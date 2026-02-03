#!/bin/bash
#
# 11_verify_setup.sh
# Verifies the development environment is correctly configured
#
# This script:
# - Verifies all tools are installed and working
# - Checks environment variables
# - Runs expo doctor for Expo health check
# - Prints a comprehensive summary with PASS/FAIL for each check
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
    CYAN='\033[0;36m'
    BOLD='\033[1m'
    NC='\033[0m'
    print_success() { echo "[OK] $1"; }
    print_error() { echo "[ERROR] $1"; }
    print_warning() { echo "[!] $1"; }
    print_info() { echo "[INFO] $1"; }
    print_header() { echo "=== $1 ==="; }
}

# Use PROJECT_ROOT from environment or calculate it
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

# ==============================================================================
# VERIFICATION HELPERS
# ==============================================================================

# Track pass/fail counts
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# Check mark and X mark
CHECK_MARK="${GREEN}[✓]${NC}"
X_MARK="${RED}[✗]${NC}"
WARN_MARK="${YELLOW}[!]${NC}"

check_pass() {
    local name=$1
    local version=$2
    echo -e "  ${CHECK_MARK} ${name}$(printf '%*s' $((18 - ${#name})) '')${version}"
    PASS_COUNT=$((PASS_COUNT + 1))
}

check_fail() {
    local name=$1
    local message=${2:-"Not found"}
    echo -e "  ${X_MARK} ${name}$(printf '%*s' $((18 - ${#name})) '')${message}"
    FAIL_COUNT=$((FAIL_COUNT + 1))
}

check_warn() {
    local name=$1
    local message=$2
    echo -e "  ${WARN_MARK} ${name}$(printf '%*s' $((18 - ${#name})) '')${message}"
    WARN_COUNT=$((WARN_COUNT + 1))
}

# ==============================================================================
# PRINT HEADER
# ==============================================================================

echo ""
echo -e "${BOLD}============================================${NC}"
echo -e "${BOLD}        SETUP VERIFICATION RESULTS${NC}"
echo -e "${BOLD}============================================${NC}"
echo ""

# ==============================================================================
# CORE TOOLS VERIFICATION
# ==============================================================================

echo -e "${CYAN}${BOLD}Core Tools:${NC}"

# Volta
if command -v volta &> /dev/null; then
    VOLTA_VERSION=$(volta --version 2>/dev/null || echo "unknown")
    check_pass "Volta" "$VOLTA_VERSION"
else
    check_fail "Volta"
fi

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version 2>/dev/null || echo "unknown")
    # Check if version is 22.x
    if [[ "$NODE_VERSION" =~ ^v22\. ]]; then
        check_pass "Node.js" "$NODE_VERSION"
    else
        check_warn "Node.js" "$NODE_VERSION (expected 22.x)"
    fi
else
    check_fail "Node.js"
fi

# pnpm
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version 2>/dev/null || echo "unknown")
    # Check if version is 10.x
    if [[ "$PNPM_VERSION" =~ ^10\. ]]; then
        check_pass "pnpm" "$PNPM_VERSION"
    else
        check_warn "pnpm" "$PNPM_VERSION (expected 10.x)"
    fi
else
    check_fail "pnpm"
fi

# Expo CLI
if command -v npx &> /dev/null && npx expo --version &> /dev/null; then
    EXPO_VERSION=$(npx expo --version 2>/dev/null || echo "unknown")
    check_pass "Expo CLI" "$EXPO_VERSION"
else
    check_fail "Expo CLI"
fi

# EAS CLI
if command -v eas &> /dev/null; then
    EAS_VERSION=$(eas --version 2>/dev/null || echo "unknown")
    check_pass "EAS CLI" "$EAS_VERSION"
else
    check_fail "EAS CLI"
fi

# ==============================================================================
# ENVIRONMENT VARIABLES
# ==============================================================================

echo ""
echo -e "${CYAN}${BOLD}Environment Variables:${NC}"

# VOLTA_HOME
if [[ -n "$VOLTA_HOME" ]] && [[ -d "$VOLTA_HOME" ]]; then
    check_pass "VOLTA_HOME" "$VOLTA_HOME"
else
    check_warn "VOLTA_HOME" "${VOLTA_HOME:-Not set}"
fi

# JAVA_HOME
if [[ -n "$JAVA_HOME" ]]; then
    if [[ -d "$JAVA_HOME" ]]; then
        check_pass "JAVA_HOME" "$JAVA_HOME"
    else
        check_warn "JAVA_HOME" "$JAVA_HOME (directory not found)"
    fi
else
    check_warn "JAVA_HOME" "Not set (required for Android)"
fi

# ANDROID_HOME
if [[ -n "$ANDROID_HOME" ]]; then
    if [[ -d "$ANDROID_HOME" ]]; then
        check_pass "ANDROID_HOME" "$ANDROID_HOME"
    else
        check_warn "ANDROID_HOME" "$ANDROID_HOME (directory not found)"
    fi
else
    check_warn "ANDROID_HOME" "Not set (required for Android)"
fi

# ==============================================================================
# PLATFORM TOOLS - macOS
# ==============================================================================

if [[ "$(uname)" == "Darwin" ]]; then
    echo ""
    echo -e "${CYAN}${BOLD}Platform Tools (macOS):${NC}"

    # CocoaPods
    if command -v pod &> /dev/null; then
        POD_VERSION=$(pod --version 2>/dev/null || echo "unknown")
        check_pass "CocoaPods" "$POD_VERSION"
    else
        check_warn "CocoaPods" "Not found (required for iOS)"
    fi

    # Watchman
    if command -v watchman &> /dev/null; then
        WATCHMAN_VERSION=$(watchman --version 2>/dev/null || echo "unknown")
        check_pass "Watchman" "$WATCHMAN_VERSION"
    else
        check_warn "Watchman" "Not found (recommended)"
    fi

    # Xcode Command Line Tools
    if xcode-select -p &> /dev/null; then
        XCODE_PATH=$(xcode-select -p 2>/dev/null)
        check_pass "Xcode CLT" "Installed"
    else
        check_warn "Xcode CLT" "Not found (required for iOS)"
    fi
fi

# ==============================================================================
# PLATFORM TOOLS - Android
# ==============================================================================

echo ""
echo -e "${CYAN}${BOLD}Platform Tools (Android):${NC}"

# Java
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -1 | sed 's/.*"\(.*\)".*/\1/' || echo "unknown")
    # Check if version is 17.x
    if [[ "$JAVA_VERSION" =~ ^17\. ]]; then
        check_pass "Java" "$JAVA_VERSION"
    else
        check_warn "Java" "$JAVA_VERSION (expected 17.x)"
    fi
else
    check_fail "Java" "Not found (required for Android)"
fi

# Android SDK
if [[ -n "$ANDROID_HOME" ]] && [[ -d "$ANDROID_HOME" ]]; then
    check_pass "Android SDK" "Present"

    # Check for platform-tools
    if [[ -d "$ANDROID_HOME/platform-tools" ]]; then
        check_pass "platform-tools" "Present"
    else
        check_warn "platform-tools" "Not found"
    fi

    # Check for build-tools
    if [[ -d "$ANDROID_HOME/build-tools" ]]; then
        BUILD_TOOLS=$(ls "$ANDROID_HOME/build-tools" 2>/dev/null | tail -1)
        check_pass "build-tools" "${BUILD_TOOLS:-Present}"
    else
        check_warn "build-tools" "Not found"
    fi
else
    check_warn "Android SDK" "Not found or ANDROID_HOME not set"
fi

# ==============================================================================
# PROJECT VERIFICATION
# ==============================================================================

echo ""
echo -e "${CYAN}${BOLD}Project:${NC}"

cd "$PROJECT_ROOT"

# Check node_modules
if [[ -d "$PROJECT_ROOT/node_modules" ]]; then
    check_pass "node_modules" "Present"
else
    check_fail "node_modules" "Not found (run pnpm install)"
fi

# Check .env
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    check_pass ".env file" "Present"
else
    check_warn ".env file" "Not found"
fi

# Check package.json
if [[ -f "$PROJECT_ROOT/package.json" ]]; then
    check_pass "package.json" "Present"
else
    check_fail "package.json" "Not found"
fi

# ==============================================================================
# FIREBASE CREDENTIALS
# ==============================================================================

echo ""
echo -e "${CYAN}${BOLD}Firebase Credentials:${NC}"

CREDENTIALS_DIR="$PROJECT_ROOT/credentials"

# Helper function to validate plist file
validate_plist() {
    local file="$1"
    [[ -f "$file" ]] && grep -q "GOOGLE_APP_ID" "$file" 2>/dev/null && ! grep -q "YOUR_" "$file" 2>/dev/null && ! grep -q "placeholder-" "$file" 2>/dev/null
}

# Helper function to validate JSON file
validate_json() {
    local file="$1"
    [[ -f "$file" ]] && grep -q "project_info" "$file" 2>/dev/null && ! grep -q "YOUR_" "$file" 2>/dev/null && ! grep -q "placeholder-" "$file" 2>/dev/null
}

# iOS Development
IOS_DEV="$CREDENTIALS_DIR/ios/GoogleService-Info-dev.plist"
if validate_plist "$IOS_DEV"; then
    check_pass "iOS (dev)" "Valid"
elif [[ -f "$IOS_DEV" ]]; then
    check_warn "iOS (dev)" "Invalid or placeholder"
else
    check_warn "iOS (dev)" "Not found"
fi

# iOS Production
IOS_PROD="$CREDENTIALS_DIR/ios/GoogleService-Info.plist"
if validate_plist "$IOS_PROD"; then
    check_pass "iOS (prod)" "Valid"
elif [[ -f "$IOS_PROD" ]]; then
    check_warn "iOS (prod)" "Invalid or placeholder"
else
    check_warn "iOS (prod)" "Not found"
fi

# Android Development
ANDROID_DEV="$CREDENTIALS_DIR/android/google-services-dev.json"
if validate_json "$ANDROID_DEV"; then
    check_pass "Android (dev)" "Valid"
elif [[ -f "$ANDROID_DEV" ]]; then
    check_warn "Android (dev)" "Invalid or placeholder"
else
    check_warn "Android (dev)" "Not found"
fi

# Android Production
ANDROID_PROD="$CREDENTIALS_DIR/android/google-services.json"
if validate_json "$ANDROID_PROD"; then
    check_pass "Android (prod)" "Valid"
elif [[ -f "$ANDROID_PROD" ]]; then
    check_warn "Android (prod)" "Invalid or placeholder"
else
    check_warn "Android (prod)" "Not found"
fi

# ==============================================================================
# EXPO DOCTOR
# ==============================================================================

echo ""
echo -e "${CYAN}${BOLD}Expo Doctor:${NC}"

if command -v npx &> /dev/null && [[ -d "$PROJECT_ROOT/node_modules" ]]; then
    echo "  Running expo doctor..."
    echo ""

    # Run expo doctor and save output to temp file to capture exit code correctly
    EXPO_OUTPUT=$(mktemp)
    npx expo doctor > "$EXPO_OUTPUT" 2>&1 || EXPO_DOCTOR_FAILED=true

    # Process the output
    while IFS= read -r line; do
        echo "    $line"
    done < "$EXPO_OUTPUT"
    rm -f "$EXPO_OUTPUT"

    if [[ "${EXPO_DOCTOR_FAILED:-false}" != "true" ]]; then
        echo ""
        check_pass "Expo Doctor" "All checks passed"
    else
        echo ""
        check_warn "Expo Doctor" "Some issues detected (see above)"
    fi
else
    check_warn "Expo Doctor" "Cannot run (missing dependencies)"
fi

# ==============================================================================
# SUMMARY
# ==============================================================================

echo ""
echo -e "${BOLD}============================================${NC}"

TOTAL=$((PASS_COUNT + FAIL_COUNT + WARN_COUNT))

if [[ $FAIL_COUNT -eq 0 ]]; then
    if [[ $WARN_COUNT -eq 0 ]]; then
        echo -e "${BOLD}        SETUP COMPLETE! ${GREEN}✓${NC}"
    else
        echo -e "${BOLD}        SETUP MOSTLY COMPLETE ${YELLOW}!${NC}"
    fi
else
    echo -e "${BOLD}        SETUP INCOMPLETE ${RED}✗${NC}"
fi

echo -e "${BOLD}============================================${NC}"
echo ""
echo -e "  ${GREEN}Passed:${NC}  $PASS_COUNT"
echo -e "  ${YELLOW}Warnings:${NC} $WARN_COUNT"
echo -e "  ${RED}Failed:${NC}  $FAIL_COUNT"
echo ""

# ==============================================================================
# RECOMMENDATIONS
# ==============================================================================

if [[ $FAIL_COUNT -gt 0 ]] || [[ $WARN_COUNT -gt 0 ]]; then
    echo -e "${CYAN}${BOLD}Recommendations:${NC}"
    echo ""

    if ! command -v volta &> /dev/null; then
        echo "  - Install Volta: Run ./scripts/setup/01_install_volta.sh"
    fi

    if ! command -v node &> /dev/null || ! [[ "$(node --version)" =~ ^v22\. ]]; then
        echo "  - Install Node.js 22.x: Run ./scripts/setup/02_install_node.sh"
    fi

    if ! command -v pnpm &> /dev/null; then
        echo "  - Install pnpm: Run ./scripts/setup/03_install_pnpm.sh"
    fi

    if [[ -z "$JAVA_HOME" ]] || ! command -v java &> /dev/null; then
        echo "  - Install Java 17: Run ./scripts/setup/07_install_android_deps.sh"
    fi

    if [[ ! -d "$PROJECT_ROOT/node_modules" ]]; then
        echo "  - Install dependencies: Run pnpm install"
    fi

    if [[ ! -f "$PROJECT_ROOT/.env" ]]; then
        echo "  - Configure environment: Run ./scripts/setup/09_setup_env.sh"
    fi

    # Check if any Firebase credentials are missing
    FIREBASE_MISSING=false
    [[ ! -f "$PROJECT_ROOT/credentials/ios/GoogleService-Info-dev.plist" ]] && FIREBASE_MISSING=true
    [[ ! -f "$PROJECT_ROOT/credentials/android/google-services-dev.json" ]] && FIREBASE_MISSING=true
    if [[ "$FIREBASE_MISSING" == "true" ]]; then
        echo "  - Configure Firebase: Run ./scripts/setup/10_setup_firebase.sh"
    fi

    if [[ -z "$VOLTA_HOME" ]] || [[ -z "$JAVA_HOME" ]] || [[ -z "$ANDROID_HOME" ]]; then
        echo ""
        echo "  Some environment variables may not be set. Try:"
        CONFIG_FILE="${HOME}/.zshrc"
        [[ -n "$BASH_VERSION" ]] && CONFIG_FILE="${HOME}/.bashrc"
        echo "    source $CONFIG_FILE"
        echo "  or restart your terminal."
    fi

    echo ""
fi

# ==============================================================================
# EXIT CODE
# ==============================================================================

if [[ $FAIL_COUNT -gt 0 ]]; then
    print_warning "Setup verification found $FAIL_COUNT critical issue(s)"
    exit 1
else
    print_success "Development environment is ready!"
    echo ""
    echo "Next steps:"
    echo "  1. Run 'pnpm start' to start the development server"
    echo "  2. Run 'pnpm ios' or 'pnpm android' to launch the app"
    echo ""
    exit 0
fi
