#!/bin/bash
#
# 05_setup_auth.sh - Authentication Setup
#
# This script handles EAS and Firebase CLI authentication.
# It checks existing authentication status and prompts for login if needed.
# Authentication status is exported for use by subsequent scripts.
#
# Exports:
#   EAS_AUTHENTICATED - true if logged into EAS
#   FIREBASE_AUTHENTICATED - true if logged into Firebase
#
set -e

# ==============================================================================
# SOURCE HELPER FUNCTIONS
# ==============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/setup.sh" --helpers-only 2>/dev/null || {
    # Fallback if helpers aren't available
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
}

# Use PROJECT_ROOT from environment or calculate it
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

# Check for non-interactive mode (passed from parent setup.sh)
NON_INTERACTIVE="${NON_INTERACTIVE:-false}"

# ==============================================================================
# EAS AUTHENTICATION
# ==============================================================================

check_eas_auth() {
    if command -v eas &> /dev/null; then
        if eas whoami &> /dev/null; then
            EAS_USER=$(eas whoami 2>/dev/null)
            print_success "EAS: Authenticated as $EAS_USER"
            return 0
        fi
    fi
    return 1
}

prompt_eas_login() {
    echo ""
    print_info "EAS Authentication Required"
    echo ""
    echo "EAS login enables:"
    echo "  - Pulling environment variables from EAS secrets"
    echo "  - Cloud builds via 'eas build'"
    echo "  - Over-the-air updates via 'eas update'"
    echo ""

    if [[ "$NON_INTERACTIVE" == "true" ]]; then
        print_info "Non-interactive mode: skipping EAS login prompt"
        return 1
    fi

    if [[ -t 0 ]]; then
        read -p "Login to EAS now? (Y/n): " response
        if [[ "$response" != "n" && "$response" != "N" ]]; then
            echo ""
            eas login
            return $?
        fi
    fi
    return 1
}

# ==============================================================================
# FIREBASE AUTHENTICATION
# ==============================================================================

check_firebase_auth() {
    if command -v firebase &> /dev/null; then
        if firebase projects:list &> /dev/null; then
            print_success "Firebase: Authenticated"
            return 0
        fi
    fi
    return 1
}

prompt_firebase_login() {
    echo ""
    print_info "Firebase Authentication (Optional)"
    echo ""
    echo "Firebase login enables:"
    echo "  - Downloading GoogleService-Info.plist automatically"
    echo "  - Downloading google-services.json automatically"
    echo "  - Managing Firebase project settings"
    echo ""
    echo "Note: You can skip this and manually download credentials later."
    echo ""

    if [[ "$NON_INTERACTIVE" == "true" ]]; then
        print_info "Non-interactive mode: skipping Firebase login prompt"
        return 1
    fi

    if [[ -t 0 ]]; then
        read -p "Login to Firebase now? (Y/n/skip): " response
        case "$response" in
            n|N|skip|Skip|SKIP)
                print_info "Skipping Firebase login"
                return 1
                ;;
            *)
                echo ""
                firebase login
                return $?
                ;;
        esac
    fi
    return 1
}

# ==============================================================================
# MAIN FLOW
# ==============================================================================

print_header "Authentication Setup"

# Initialize auth status
EAS_AUTHENTICATED=false
FIREBASE_AUTHENTICATED=false

# --- Check EAS Authentication ---
echo "Checking EAS authentication..."
if check_eas_auth; then
    EAS_AUTHENTICATED=true
else
    if ! command -v eas &> /dev/null; then
        print_warning "EAS CLI not installed - skipping EAS authentication"
        print_info "Install with: npm install -g eas-cli"
    else
        if prompt_eas_login; then
            # Verify login succeeded
            if check_eas_auth; then
                EAS_AUTHENTICATED=true
            fi
        else
            print_warning "EAS not authenticated - some features will be unavailable"
            echo "  - Cannot pull environment variables from EAS"
            echo "  - Cannot use cloud builds"
            echo "  - Cannot push OTA updates"
        fi
    fi
fi

echo ""

# --- Check Firebase Authentication ---
echo "Checking Firebase authentication..."
if check_firebase_auth; then
    FIREBASE_AUTHENTICATED=true
else
    if ! command -v firebase &> /dev/null; then
        print_warning "Firebase CLI not installed - skipping Firebase authentication"
        print_info "Install with: npm install -g firebase-tools"
        print_info "Or: curl -sL https://firebase.tools | bash"
    else
        if prompt_firebase_login; then
            # Verify login succeeded
            if check_firebase_auth; then
                FIREBASE_AUTHENTICATED=true
            fi
        else
            print_info "Firebase auth skipped - manual credential setup required"
            echo "  - Download credentials from Firebase Console"
            echo "  - Place in credentials/ios/ and credentials/android/"
        fi
    fi
fi

# ==============================================================================
# EXPORT STATUS
# ==============================================================================

# Export authentication status (note: exports only work in the current shell
# and do not propagate to scripts run as subshells/subprocesses)
export EAS_AUTHENTICATED
export FIREBASE_AUTHENTICATED

# Write status to a temp file that other scripts can source
# This is the mechanism that actually passes auth status to subsequent scripts
AUTH_STATUS_FILE="$PROJECT_ROOT/.setup_auth_status"
cat > "$AUTH_STATUS_FILE" << EOF
# Authentication status from 05_setup_auth.sh
# This file is auto-generated and can be deleted
EAS_AUTHENTICATED=$EAS_AUTHENTICATED
FIREBASE_AUTHENTICATED=$FIREBASE_AUTHENTICATED
EOF

# ==============================================================================
# SUMMARY
# ==============================================================================

echo ""
print_header "Authentication Status Summary"

if [[ "$EAS_AUTHENTICATED" == "true" ]]; then
    print_success "EAS: Authenticated"
else
    print_warning "EAS: Not authenticated"
fi

if [[ "$FIREBASE_AUTHENTICATED" == "true" ]]; then
    print_success "Firebase: Authenticated"
else
    print_warning "Firebase: Not authenticated"
fi

echo ""

# Don't fail the script if auth is missing - it's optional
exit 0
