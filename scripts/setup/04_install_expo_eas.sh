#!/bin/bash
#
# 04_install_expo_eas.sh - Install Expo CLI and EAS CLI
# Installs global CLIs needed for Expo/React Native development.
# Idempotent - safe to run multiple times.
#
set -e

# ==============================================================================
# COLORS AND OUTPUT HELPERS
# ==============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_header() {
    echo -e "\n${BOLD}=== $1 ===${NC}\n"
}

# ==============================================================================
# SETUP PATHS
# ==============================================================================

# Ensure Volta is in PATH
export VOLTA_HOME="$HOME/.volta"
export PATH="$VOLTA_HOME/bin:$PATH"

# ==============================================================================
# CHECK PREREQUISITES
# ==============================================================================
print_header "Expo & EAS CLI Installation"

# Verify npm is available
if ! command -v npm &> /dev/null; then
    print_error "npm is not available. Please run 02_install_node.sh first."
    exit 1
fi

NPM_VERSION=$(npm --version 2>/dev/null)
print_info "Using npm version: $NPM_VERSION"

# ==============================================================================
# INSTALL EXPO CLI
# ==============================================================================
echo ""
print_info "Checking Expo CLI..."

EXPO_INSTALLED=false
EXPO_VERSION=""

# Check if expo-cli or @expo/cli is installed
if command -v expo &> /dev/null; then
    EXPO_VERSION=$(expo --version 2>/dev/null || echo "installed")
    print_success "Expo CLI already installed: $EXPO_VERSION"
    EXPO_INSTALLED=true
fi

if [[ "$EXPO_INSTALLED" == "false" ]]; then
    print_info "Installing @expo/cli globally..."

    if npm install -g @expo/cli; then
        EXPO_VERSION=$(expo --version 2>/dev/null || echo "installed")
        print_success "Expo CLI installed: $EXPO_VERSION"
    else
        print_error "Failed to install Expo CLI"
        print_info "Try manually: npm install -g @expo/cli"
    fi
fi

# ==============================================================================
# INSTALL EAS CLI
# ==============================================================================
echo ""
print_info "Checking EAS CLI..."

EAS_INSTALLED=false
EAS_VERSION=""

if command -v eas &> /dev/null; then
    EAS_VERSION=$(eas --version 2>/dev/null || echo "installed")
    print_info "EAS CLI installed: $EAS_VERSION"

    # Check if update is needed by comparing with latest available version
    LATEST_EAS_VERSION=$(npm view eas-cli version 2>/dev/null || echo "")

    if [[ -n "$LATEST_EAS_VERSION" ]] && [[ "$EAS_VERSION" != "$LATEST_EAS_VERSION" ]]; then
        print_info "Updating EAS CLI from $EAS_VERSION to $LATEST_EAS_VERSION..."
        if npm install -g eas-cli@latest; then
            EAS_VERSION=$(eas --version 2>/dev/null || echo "latest")
            print_success "EAS CLI updated: $EAS_VERSION"
        else
            print_warning "Failed to update EAS CLI, using existing version"
        fi
    else
        print_success "EAS CLI is already at latest version: $EAS_VERSION"
    fi
    EAS_INSTALLED=true
else
    print_info "Installing eas-cli@latest globally..."

    if npm install -g eas-cli@latest; then
        EAS_VERSION=$(eas --version 2>/dev/null || echo "installed")
        print_success "EAS CLI installed: $EAS_VERSION"
        EAS_INSTALLED=true
    else
        print_error "Failed to install EAS CLI"
        print_info "Try manually: npm install -g eas-cli@latest"
    fi
fi

# ==============================================================================
# CHECK EAS AUTHENTICATION
# ==============================================================================
echo ""
print_info "Checking EAS authentication status..."

EAS_AUTHENTICATED=false
if command -v eas &> /dev/null; then
    # Try to check whoami
    EAS_USER=$(eas whoami 2>/dev/null || echo "")

    if [[ -n "$EAS_USER" ]] && [[ "$EAS_USER" != *"not logged in"* ]] && [[ "$EAS_USER" != *"Error"* ]]; then
        print_success "Logged into EAS as: $EAS_USER"
        EAS_AUTHENTICATED=true
    else
        print_warning "Not logged into EAS"
        print_info "Run 'eas login' to authenticate for builds and updates"
    fi
else
    print_warning "EAS CLI not available for authentication check"
fi

# ==============================================================================
# VERIFY INSTALLATIONS
# ==============================================================================
echo ""
print_header "Installation Summary"

# Expo CLI
if command -v expo &> /dev/null; then
    EXPO_FINAL=$(expo --version 2>/dev/null || echo "installed")
    print_success "Expo CLI: $EXPO_FINAL"
else
    print_warning "Expo CLI: verification pending after terminal restart"
fi

# EAS CLI
if command -v eas &> /dev/null; then
    EAS_FINAL=$(eas --version 2>/dev/null || echo "installed")
    print_success "EAS CLI: $EAS_FINAL"
else
    print_warning "EAS CLI: verification pending after terminal restart"
fi

# ==============================================================================
# NEXT STEPS
# ==============================================================================
echo ""
if [[ "$EAS_AUTHENTICATED" == "false" ]]; then
    print_header "Next Steps"
    echo "To enable EAS Build and Update features:"
    echo ""
    echo "  1. Create an Expo account (if needed): https://expo.dev/signup"
    echo "  2. Run: eas login"
    echo "  3. Follow the prompts to authenticate"
    echo ""
fi

print_success "Expo and EAS CLI installation complete."
