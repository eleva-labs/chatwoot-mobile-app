#!/bin/bash
#
# 05_install_ios_deps.sh - Install iOS Development Dependencies
# Installs Xcode Command Line Tools, Homebrew, CocoaPods, and Watchman.
# Only runs on macOS - exits gracefully on other platforms.
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
# PLATFORM CHECK
# ==============================================================================
print_header "iOS Dependencies"

if [[ "$(uname)" != "Darwin" ]]; then
    print_info "Skipping iOS dependencies (not on macOS)"
    print_info "iOS development requires macOS"
    exit 0
fi

print_info "Detected macOS - proceeding with iOS setup"

# ==============================================================================
# XCODE COMMAND LINE TOOLS
# ==============================================================================
echo ""
print_info "Checking Xcode Command Line Tools..."

install_xcode_clt() {
    # Check if Xcode CLT is installed
    if xcode-select -p &> /dev/null; then
        local xcode_path
        xcode_path=$(xcode-select -p 2>/dev/null)
        print_success "Xcode CLT: $xcode_path"
        return 0
    fi

    print_info "Installing Xcode Command Line Tools..."
    print_warning "A dialog will appear. Please click 'Install' and wait for completion."

    # Trigger the installation dialog
    xcode-select --install 2>/dev/null || true

    # Wait for user to complete the installation
    echo ""
    print_info "Waiting for Xcode CLT installation to complete..."
    print_info "Press Enter after the installation finishes (or Ctrl+C to cancel)"
    read -r

    # Verify installation
    if xcode-select -p &> /dev/null; then
        print_success "Xcode CLT installed successfully"
    else
        print_error "Xcode CLT installation may have failed. Please try again manually."
        print_info "Run: xcode-select --install"
        return 1
    fi
}

install_xcode_clt

# Accept Xcode license if needed
if command -v xcodebuild &> /dev/null; then
    # Check if license is already accepted
    if ! xcodebuild -license check &> /dev/null; then
        print_info "Accepting Xcode license..."
        sudo xcodebuild -license accept 2>/dev/null || true
    fi
fi

# ==============================================================================
# HOMEBREW
# ==============================================================================
echo ""
print_info "Checking Homebrew..."

install_homebrew() {
    if command -v brew &> /dev/null; then
        local brew_version
        brew_version=$(brew --version 2>/dev/null | head -1)
        print_success "Homebrew: $brew_version"
        return 0
    fi

    print_info "Installing Homebrew..."

    # Install Homebrew (official installer)
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add Homebrew to PATH for this session (Apple Silicon vs Intel)
    if [[ "$(uname -m)" == "arm64" ]]; then
        # Apple Silicon
        eval "$(/opt/homebrew/bin/brew shellenv)"
    else
        # Intel
        eval "$(/usr/local/bin/brew shellenv)"
    fi

    if command -v brew &> /dev/null; then
        print_success "Homebrew installed successfully"
    else
        print_error "Homebrew installation failed"
        return 1
    fi
}

install_homebrew

# Ensure Homebrew is in PATH for this script
if [[ "$(uname -m)" == "arm64" ]] && [[ -f "/opt/homebrew/bin/brew" ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
elif [[ -f "/usr/local/bin/brew" ]]; then
    eval "$(/usr/local/bin/brew shellenv)"
fi

# ==============================================================================
# COCOAPODS
# ==============================================================================
echo ""
print_info "Checking CocoaPods..."

install_cocoapods() {
    if command -v pod &> /dev/null; then
        local pod_version
        # Use timeout and check exit code to handle broken pod installations
        pod_version=$(timeout 30 pod --version 2>/dev/null || echo "")
        if [[ -n "$pod_version" ]]; then
            print_success "CocoaPods: $pod_version"
            return 0
        else
            print_warning "CocoaPods found but appears broken, attempting reinstall..."
        fi
    fi

    print_info "Installing CocoaPods..."

    # Try Homebrew first (preferred for easier updates)
    if command -v brew &> /dev/null; then
        # Uninstall broken installation if present
        brew uninstall cocoapods 2>/dev/null || true
        brew install cocoapods
    else
        # Fallback to gem if Homebrew is not available
        print_info "Installing via gem (Homebrew not available)..."
        sudo gem install cocoapods
    fi

    if command -v pod &> /dev/null; then
        local pod_version
        pod_version=$(timeout 30 pod --version 2>/dev/null || echo "")
        if [[ -n "$pod_version" ]]; then
            print_success "CocoaPods installed: $pod_version"
        else
            print_warning "CocoaPods installed but version check failed (may need Ruby fix)"
            print_info "If CocoaPods fails, try: gem install cocoapods"
            # Don't fail - the installation exists, just version check is problematic
        fi
    else
        print_error "CocoaPods installation failed"
        return 1
    fi
}

install_cocoapods

# ==============================================================================
# WATCHMAN
# ==============================================================================
echo ""
print_info "Checking Watchman..."

install_watchman() {
    if command -v watchman &> /dev/null; then
        local watchman_version
        watchman_version=$(watchman --version 2>/dev/null)
        print_success "Watchman: $watchman_version"
        return 0
    fi

    print_info "Installing Watchman..."

    if command -v brew &> /dev/null; then
        brew install watchman
    else
        print_error "Homebrew required to install Watchman"
        print_info "Please install Homebrew first: https://brew.sh"
        return 1
    fi

    if command -v watchman &> /dev/null; then
        local watchman_version
        watchman_version=$(watchman --version 2>/dev/null)
        print_success "Watchman installed: $watchman_version"
    else
        print_error "Watchman installation failed"
        return 1
    fi
}

install_watchman

# ==============================================================================
# VERIFICATION SUMMARY
# ==============================================================================
echo ""
print_header "iOS Dependencies Summary"

# Xcode CLT
if xcode-select -p &> /dev/null; then
    print_success "Xcode CLT: $(xcode-select -p)"
else
    print_error "Xcode CLT: Not installed"
fi

# Homebrew
if command -v brew &> /dev/null; then
    print_success "Homebrew: $(brew --version 2>/dev/null | head -1)"
else
    print_error "Homebrew: Not installed"
fi

# CocoaPods
if command -v pod &> /dev/null; then
    print_success "CocoaPods: $(pod --version 2>/dev/null)"
else
    print_error "CocoaPods: Not installed"
fi

# Watchman
if command -v watchman &> /dev/null; then
    print_success "Watchman: $(watchman --version 2>/dev/null)"
else
    print_error "Watchman: Not installed"
fi

# ==============================================================================
# XCODE NOTICE
# ==============================================================================
echo ""
print_warning "Full Xcode required for iOS simulator and builds."
if [[ ! -d "/Applications/Xcode.app" ]]; then
    print_info "Install Xcode from the App Store if not present."
    print_info "After installing, run: sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
else
    print_success "Xcode.app detected at /Applications/Xcode.app"
fi

echo ""
print_success "iOS dependencies installation complete."
