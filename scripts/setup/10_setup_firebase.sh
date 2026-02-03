#!/bin/bash
#
# 10_setup_firebase.sh - Firebase Configuration Setup
#
# This script helps set up Firebase credentials for the mobile app.
# It validates existing credentials, checks Firebase CLI, and guides
# developers through obtaining proper credentials if needed.
#

# Source helper functions from parent script
if [[ -n "$SCRIPT_DIR" ]]; then
    source "$SCRIPT_DIR/setup.sh" --helpers-only 2>/dev/null || true
else
    # Standalone mode - define minimal helpers
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
    print_success() { echo -e "${GREEN}[OK]${NC} $1"; }
    print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
    print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
    print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
    print_header() { echo -e "\n${GREEN}=== $1 ===${NC}\n"; }
fi

# Project root detection
if [[ -z "$PROJECT_ROOT" ]]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
fi

# Source env-utils for .env manipulation
source "$PROJECT_ROOT/scripts/utils/env-utils.sh"

# Check for non-interactive mode and auth status from earlier script
NON_INTERACTIVE="${NON_INTERACTIVE:-false}"

# Source auth status from earlier script if available
AUTH_STATUS_FILE="$PROJECT_ROOT/.setup_auth_status"
if [[ -f "$AUTH_STATUS_FILE" ]]; then
    source "$AUTH_STATUS_FILE"
    print_info "Loaded auth status from previous step"
fi
FIREBASE_AUTHENTICATED="${FIREBASE_AUTHENTICATED:-false}"

print_header "Firebase Configuration Setup"

# ==============================================================================
# FIREBASE PROJECT ID RESOLUTION
# ==============================================================================

# Project ID defaults based on environment
FIREBASE_PROJECT_ID_DEV="chatscommerce-dev"
FIREBASE_PROJECT_ID_PROD="chatscommerce-ec2f7"

# Load from .env if available
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    # Source .env to get ENVIRONMENT and optional FIREBASE_PROJECT_ID override
    set -a
    source "$PROJECT_ROOT/.env" 2>/dev/null || true
    set +a
fi

# Resolve project IDs (use env override if set, otherwise use defaults)
resolve_firebase_project_id() {
    local env="$1"
    if [[ "$env" == "dev" || "$env" == "development" ]]; then
        echo "${FIREBASE_PROJECT_ID:-$FIREBASE_PROJECT_ID_DEV}"
    else
        echo "${FIREBASE_PROJECT_ID:-$FIREBASE_PROJECT_ID_PROD}"
    fi
}

FIREBASE_DEV_PROJECT=$(resolve_firebase_project_id "dev")
FIREBASE_PROD_PROJECT=$(resolve_firebase_project_id "prod")

print_info "Firebase Project IDs:"
echo "  Development: $FIREBASE_DEV_PROJECT"
echo "  Production:  $FIREBASE_PROD_PROJECT"
echo ""

# ==============================================================================
# CREDENTIAL FILE PATHS
# ==============================================================================
CREDENTIALS_DIR="$PROJECT_ROOT/credentials"
IOS_PROD="$CREDENTIALS_DIR/ios/GoogleService-Info.plist"
IOS_DEV="$CREDENTIALS_DIR/ios/GoogleService-Info-dev.plist"
ANDROID_PROD="$CREDENTIALS_DIR/android/google-services.json"
ANDROID_DEV="$CREDENTIALS_DIR/android/google-services-dev.json"

# ==============================================================================
# VALIDATION FUNCTIONS
# ==============================================================================

# Check if a plist file is valid (not placeholder)
validate_ios_plist() {
    local file="$1"
    local name="$2"

    if [[ ! -f "$file" ]]; then
        print_warning "$name: File not found"
        return 1
    fi

    # Check for required keys
    if ! grep -q "GOOGLE_APP_ID" "$file" 2>/dev/null; then
        print_warning "$name: Missing GOOGLE_APP_ID"
        return 1
    fi

    if ! grep -q "GCM_SENDER_ID" "$file" 2>/dev/null; then
        print_warning "$name: Missing GCM_SENDER_ID"
        return 1
    fi

    # Check for placeholder values
    if grep -q "YOUR_" "$file" 2>/dev/null; then
        print_warning "$name: Contains placeholder values (YOUR_*)"
        return 1
    fi

    if grep -q "PLACEHOLDER" "$file" 2>/dev/null; then
        print_warning "$name: Contains PLACEHOLDER values"
        return 1
    fi

    if grep -q "placeholder-" "$file" 2>/dev/null; then
        print_warning "$name: Contains placeholder values"
        return 1
    fi

    # Extract and display project info
    local bundle_id=$(grep -A1 "BUNDLE_ID" "$file" | grep "string" | sed 's/.*<string>\(.*\)<\/string>.*/\1/' 2>/dev/null)
    local project_id=$(grep -A1 "PROJECT_ID" "$file" | grep "string" | sed 's/.*<string>\(.*\)<\/string>.*/\1/' 2>/dev/null)

    print_success "$name: Valid (Project: ${project_id:-unknown}, Bundle: ${bundle_id:-unknown})"
    return 0
}

# Check if a JSON file is valid (not placeholder)
validate_android_json() {
    local file="$1"
    local name="$2"

    if [[ ! -f "$file" ]]; then
        print_warning "$name: File not found"
        return 1
    fi

    # Check if it's valid JSON
    if ! python3 -c "import json; json.load(open('$file'))" 2>/dev/null; then
        print_warning "$name: Invalid JSON format"
        return 1
    fi

    # Check for required fields
    if ! grep -q "project_info" "$file" 2>/dev/null; then
        print_warning "$name: Missing project_info"
        return 1
    fi

    if ! grep -q "client" "$file" 2>/dev/null; then
        print_warning "$name: Missing client configuration"
        return 1
    fi

    # Check for placeholder values
    if grep -q "YOUR_" "$file" 2>/dev/null; then
        print_warning "$name: Contains placeholder values (YOUR_*)"
        return 1
    fi

    if grep -q "placeholder-" "$file" 2>/dev/null; then
        print_warning "$name: Contains placeholder values"
        return 1
    fi

    # Extract and display project info
    local project_id=$(python3 -c "import json; print(json.load(open('$file')).get('project_info', {}).get('project_id', 'unknown'))" 2>/dev/null)
    local package_name=$(python3 -c "import json; c=json.load(open('$file')).get('client', [{}]); print(c[0].get('client_info', {}).get('android_client_info', {}).get('package_name', 'unknown'))" 2>/dev/null)

    print_success "$name: Valid (Project: ${project_id:-unknown}, Package: ${package_name:-unknown})"
    return 0
}

# ==============================================================================
# DOWNLOAD HELPER FUNCTION
# ==============================================================================

# Download credentials for a specific project/environment
download_firebase_credentials() {
    local project_id="$1"
    local env="$2"  # "dev" or "prod"

    print_info "Downloading credentials from project: $project_id ($env)"
    echo ""

    # Determine output files based on environment
    if [[ "$env" == "dev" ]]; then
        local ios_out="$IOS_DEV"
        local android_out="$ANDROID_DEV"
        local bundle_suffix=".dev"
        local android_rel_path="./credentials/android/google-services-dev.json"
        local ios_rel_path="./credentials/ios/GoogleService-Info-dev.plist"
    else
        local ios_out="$IOS_PROD"
        local android_out="$ANDROID_PROD"
        local bundle_suffix=""
        local android_rel_path="./credentials/android/google-services.json"
        local ios_rel_path="./credentials/ios/GoogleService-Info.plist"
    fi

    # List apps in the project
    print_info "Apps registered in $project_id:"
    firebase apps:list --project "$project_id" 2>/dev/null || true
    echo ""

    # Track download success for env variable updates
    local ios_download_success=false
    local android_download_success=false

    # Download iOS config
    print_info "Downloading iOS configuration..."
    if firebase apps:sdkconfig ios --project "$project_id" --out "$ios_out" 2>/dev/null; then
        print_success "Downloaded iOS $env config to $ios_out"
        ios_download_success=true
    else
        print_warning "Could not download iOS config"
        echo "  Ensure iOS app is registered with bundle ID: com.chatscommerce.app${bundle_suffix}"
    fi

    # Download Android config
    print_info "Downloading Android configuration..."
    if firebase apps:sdkconfig android --project "$project_id" --out "$android_out" 2>/dev/null; then
        print_success "Downloaded Android $env config to $android_out"
        android_download_success=true
    else
        print_warning "Could not download Android config"
        echo "  Ensure Android app is registered with package name: com.chatscommerce.app${bundle_suffix}"
    fi

    # Update .env with credential paths after successful downloads
    if [[ -f "$PROJECT_ROOT/.env" ]]; then
        if [[ "$android_download_success" == "true" ]]; then
            set_env_value "GOOGLE_SERVICES_JSON" "$android_rel_path"
            print_info "Set GOOGLE_SERVICES_JSON=$android_rel_path in .env"
        fi
        if [[ "$ios_download_success" == "true" ]]; then
            set_env_value "GOOGLE_SERVICE_INFO_PLIST" "$ios_rel_path"
            print_info "Set GOOGLE_SERVICE_INFO_PLIST=$ios_rel_path in .env"
        fi
    fi

    echo ""
}

# ==============================================================================
# CHECK FIREBASE CLI
# ==============================================================================
print_info "Checking Firebase CLI..."

FIREBASE_CLI_AVAILABLE=false
FIREBASE_CLI_AUTHENTICATED=false

if command -v firebase &> /dev/null; then
    FIREBASE_VERSION=$(firebase --version 2>/dev/null)
    print_success "Firebase CLI installed: $FIREBASE_VERSION"
    FIREBASE_CLI_AVAILABLE=true

    # Check if logged in
    if firebase projects:list &> /dev/null; then
        print_success "Firebase CLI authenticated"
        FIREBASE_CLI_AUTHENTICATED=true
    else
        print_warning "Firebase CLI not authenticated (run: firebase login)"
    fi
else
    print_warning "Firebase CLI not installed"
    echo "  Install with: npm install -g firebase-tools"
    echo "  Or: curl -sL https://firebase.tools | bash"
fi

echo ""

# ==============================================================================
# VALIDATE EXISTING CREDENTIALS
# ==============================================================================
print_info "Validating Firebase credential files..."
echo ""

# Ensure credentials directories exist
mkdir -p "$CREDENTIALS_DIR/ios"
mkdir -p "$CREDENTIALS_DIR/android"

# Track validation results
IOS_VALID=0
ANDROID_VALID=0

echo "iOS Credentials:"
validate_ios_plist "$IOS_DEV" "  Development" && ((IOS_VALID++)) || true
validate_ios_plist "$IOS_PROD" "  Production" && ((IOS_VALID++)) || true

echo ""
echo "Android Credentials:"
validate_android_json "$ANDROID_DEV" "  Development" && ((ANDROID_VALID++)) || true
validate_android_json "$ANDROID_PROD" "  Production" && ((ANDROID_VALID++)) || true

echo ""

# ==============================================================================
# PROGRAMMATIC CREDENTIAL DOWNLOAD (if authenticated)
# ==============================================================================

# Only offer download if Firebase is authenticated and not all credentials are valid
TOTAL_VALID_INITIAL=$((IOS_VALID + ANDROID_VALID))

if [[ "$FIREBASE_CLI_AUTHENTICATED" == "true" ]] && [[ $TOTAL_VALID_INITIAL -lt 4 ]]; then
    print_header "Firebase Credential Download"
    echo "You can download credentials directly using Firebase CLI."
    echo ""

    if [[ "$NON_INTERACTIVE" == "true" ]]; then
        print_info "Non-interactive mode: skipping credential download prompt"
        print_info "Run this script manually to download credentials"
    elif [[ -t 0 ]]; then
        # List available projects
        echo "Available Firebase projects:"
        echo ""
        firebase projects:list 2>/dev/null | head -15 || print_warning "Could not list projects"
        echo ""

        echo "Which credentials would you like to download?"
        echo "  1) Development only (project: $FIREBASE_DEV_PROJECT)"
        echo "  2) Production only (project: $FIREBASE_PROD_PROJECT)"
        echo "  3) Both development and production"
        echo "  4) Skip download"
        echo ""
        read -p "Enter choice [1-4]: " download_choice

        case "$download_choice" in
            1)
                download_firebase_credentials "$FIREBASE_DEV_PROJECT" "dev"
                # Save Firebase project ID to .env for future reference
                if [[ -f "$PROJECT_ROOT/.env" ]]; then
                    set_env_value "FIREBASE_PROJECT_ID" "$FIREBASE_DEV_PROJECT"
                    print_info "Saved FIREBASE_PROJECT_ID=$FIREBASE_DEV_PROJECT to .env"
                fi
                ;;
            2)
                download_firebase_credentials "$FIREBASE_PROD_PROJECT" "prod"
                # Save Firebase project ID to .env for future reference
                if [[ -f "$PROJECT_ROOT/.env" ]]; then
                    set_env_value "FIREBASE_PROJECT_ID" "$FIREBASE_PROD_PROJECT"
                    print_info "Saved FIREBASE_PROJECT_ID=$FIREBASE_PROD_PROJECT to .env"
                fi
                ;;
            3)
                download_firebase_credentials "$FIREBASE_DEV_PROJECT" "dev"
                download_firebase_credentials "$FIREBASE_PROD_PROJECT" "prod"
                # For both, we save the dev project ID as the default (matches ENVIRONMENT=dev)
                if [[ -f "$PROJECT_ROOT/.env" ]]; then
                    # Get current ENVIRONMENT to decide which project ID to save
                    current_env=$(get_env_value "ENVIRONMENT" 2>/dev/null || echo "dev")
                    if [[ "$current_env" == "prod" || "$current_env" == "production" ]]; then
                        set_env_value "FIREBASE_PROJECT_ID" "$FIREBASE_PROD_PROJECT"
                        print_info "Saved FIREBASE_PROJECT_ID=$FIREBASE_PROD_PROJECT to .env (matching ENVIRONMENT=$current_env)"
                    else
                        set_env_value "FIREBASE_PROJECT_ID" "$FIREBASE_DEV_PROJECT"
                        print_info "Saved FIREBASE_PROJECT_ID=$FIREBASE_DEV_PROJECT to .env (matching ENVIRONMENT=$current_env)"
                    fi
                fi
                ;;
            *)
                print_info "Skipping credential download"
                ;;
        esac

        # Re-validate after download
        if [[ "$download_choice" =~ ^[1-3]$ ]]; then
            print_info "Re-validating credentials after download..."
            echo ""
            IOS_VALID=0
            ANDROID_VALID=0

            echo "iOS Credentials:"
            validate_ios_plist "$IOS_DEV" "  Development" && ((IOS_VALID++)) || true
            validate_ios_plist "$IOS_PROD" "  Production" && ((IOS_VALID++)) || true

            echo ""
            echo "Android Credentials:"
            validate_android_json "$ANDROID_DEV" "  Development" && ((ANDROID_VALID++)) || true
            validate_android_json "$ANDROID_PROD" "  Production" && ((ANDROID_VALID++)) || true
        fi
    fi
fi

echo ""

# ==============================================================================
# SUMMARY AND GUIDANCE
# ==============================================================================
print_header "Firebase Setup Status"

# Recalculate totals after potential download
TOTAL_VALID=$((IOS_VALID + ANDROID_VALID))

if [[ $TOTAL_VALID -eq 4 ]]; then
    print_success "All Firebase credentials are properly configured!"
    echo ""
    echo "Your app is ready for Firebase services including:"
    echo "  - Push Notifications"
    echo "  - Analytics"
    echo "  - Performance Monitoring"
    echo "  - Crashlytics"
    exit 0
fi

if [[ $TOTAL_VALID -gt 0 ]]; then
    print_warning "Some Firebase credentials are missing or invalid"
else
    print_warning "No valid Firebase credentials found"
fi

echo ""
print_header "How to Obtain Firebase Credentials"

echo "Firebase Projects:"
echo "  Development: $FIREBASE_DEV_PROJECT"
echo "    Console: https://console.firebase.google.com/project/$FIREBASE_DEV_PROJECT"
echo ""
echo "  Production: $FIREBASE_PROD_PROJECT"
echo "    Console: https://console.firebase.google.com/project/$FIREBASE_PROD_PROJECT"
echo ""
echo "Steps:"
echo ""
echo "1. Go to Firebase Console (see URLs above)"
echo ""
echo "2. For iOS:"
echo "   a. Project Settings > General > Your apps > iOS"
echo "   b. Click 'GoogleService-Info.plist' to download"
echo "   c. Place files in:"
echo "      - Production: $IOS_PROD"
echo "      - Development: $IOS_DEV"
echo ""
echo "3. For Android:"
echo "   a. Project Settings > General > Your apps > Android"
echo "   b. Click 'google-services.json' to download"
echo "   c. Place files in:"
echo "      - Production: $ANDROID_PROD"
echo "      - Development: $ANDROID_DEV"
echo ""

# Provide Firebase CLI alternative if available
if [[ "$FIREBASE_CLI_AVAILABLE" == "true" ]]; then
    echo "Or use Firebase CLI:"
    echo ""
    echo "  # Development credentials"
    echo "  firebase apps:sdkconfig ios --project $FIREBASE_DEV_PROJECT \\"
    echo "      --out credentials/ios/GoogleService-Info-dev.plist"
    echo "  firebase apps:sdkconfig android --project $FIREBASE_DEV_PROJECT \\"
    echo "      --out credentials/android/google-services-dev.json"
    echo ""
    echo "  # Production credentials"
    echo "  firebase apps:sdkconfig ios --project $FIREBASE_PROD_PROJECT \\"
    echo "      --out credentials/ios/GoogleService-Info.plist"
    echo "  firebase apps:sdkconfig android --project $FIREBASE_PROD_PROJECT \\"
    echo "      --out credentials/android/google-services.json"
    echo ""
fi

echo "Bundle/Package IDs for reference:"
echo "  - Production: com.chatscommerce.app"
echo "  - Development: com.chatscommerce.app.dev"
echo ""

print_info "After placing the files, run this script again to validate."
echo ""

# Exit with warning status if not all credentials are valid
exit 0
