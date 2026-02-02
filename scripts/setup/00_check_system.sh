#!/bin/bash
#
# 00_check_system.sh - System Check Script
# Detects OS, architecture, and existing tools.
# This is a read-only diagnostic script - installs nothing.
#
set -e

# ==============================================================================
# COLORS AND OUTPUT HELPERS
# ==============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}[FOUND]${NC} $1"
}

print_not_found() {
    echo -e "${YELLOW}[NOT FOUND]${NC} $1"
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
# DETECT OS AND ARCHITECTURE
# ==============================================================================
print_header "System Check"

OS="$(uname -s)"
ARCH="$(uname -m)"
OS_VERSION=""
OS_DISPLAY=""

case "$OS" in
    Darwin)
        OS_VERSION=$(sw_vers -productVersion 2>/dev/null || echo "unknown")
        DARWIN_VERSION=$(uname -r)
        if [[ "$ARCH" == "arm64" ]]; then
            ARCH_DISPLAY="arm64 (Apple Silicon)"
        else
            ARCH_DISPLAY="x86_64 (Intel)"
        fi
        OS_DISPLAY="macOS $OS_VERSION (Darwin $DARWIN_VERSION)"
        ;;
    Linux)
        if [[ -f /etc/os-release ]]; then
            . /etc/os-release
            OS_DISPLAY="$NAME $VERSION_ID"
        else
            OS_DISPLAY="Linux $(uname -r)"
        fi
        ARCH_DISPLAY="$ARCH"
        ;;
    MINGW*|MSYS*|CYGWIN*)
        OS="Windows"
        OS_DISPLAY="Windows ($(uname -s))"
        ARCH_DISPLAY="$ARCH"
        print_warning "Windows detected. Consider using WSL2 for best experience."
        ;;
    *)
        OS_DISPLAY="$OS $(uname -r)"
        ARCH_DISPLAY="$ARCH"
        ;;
esac

echo "OS: $OS_DISPLAY"
echo "Architecture: $ARCH_DISPLAY"

# ==============================================================================
# CHECK SYSTEM RESOURCES
# ==============================================================================
RAM_GB=""
DISK_AVAILABLE=""

if [[ "$OS" == "Darwin" ]]; then
    # macOS
    RAM_BYTES=$(sysctl -n hw.memsize 2>/dev/null || echo "0")
    RAM_GB=$((RAM_BYTES / 1024 / 1024 / 1024))
    DISK_AVAILABLE=$(df -h / | awk 'NR==2 {print $4}')
elif [[ "$OS" == "Linux" ]]; then
    # Linux
    RAM_KB=$(grep MemTotal /proc/meminfo 2>/dev/null | awk '{print $2}')
    RAM_GB=$((RAM_KB / 1024 / 1024))
    DISK_AVAILABLE=$(df -h / | awk 'NR==2 {print $4}')
fi

if [[ -n "$RAM_GB" ]]; then
    echo "RAM: ${RAM_GB} GB"
fi
if [[ -n "$DISK_AVAILABLE" ]]; then
    echo "Disk Space Available: $DISK_AVAILABLE"
fi

# ==============================================================================
# CHECK EXISTING TOOLS
# ==============================================================================
print_header "Existing Tools"

WARNINGS=()
NODE_VERSION_MANAGERS=()

# Check for Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version 2>/dev/null | awk '{print $3}')
    print_success "git: $GIT_VERSION"
else
    print_not_found "git"
    print_warning "Git is required. Install from https://git-scm.com/"
fi

# Check for nvm
if [[ -d "$HOME/.nvm" ]] || command -v nvm &> /dev/null; then
    NVM_VERSION=""
    if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
        # Source nvm to get version
        export NVM_DIR="$HOME/.nvm"
        # shellcheck disable=SC1091
        source "$NVM_DIR/nvm.sh" 2>/dev/null
        NVM_VERSION=$(nvm --version 2>/dev/null || echo "installed")
    fi
    print_success "nvm: $NVM_VERSION at ~/.nvm"
    NODE_VERSION_MANAGERS+=("nvm")
    WARNINGS+=("nvm detected. Volta will be installed alongside it. Consider removing nvm after setup to avoid conflicts.")
else
    print_not_found "nvm"
fi

# Check for fnm
if command -v fnm &> /dev/null; then
    FNM_VERSION=$(fnm --version 2>/dev/null | awk '{print $2}')
    print_success "fnm: $FNM_VERSION"
    NODE_VERSION_MANAGERS+=("fnm")
    WARNINGS+=("fnm detected. Volta will be installed alongside it.")
else
    print_not_found "fnm"
fi

# Check for asdf
if command -v asdf &> /dev/null; then
    ASDF_VERSION=$(asdf --version 2>/dev/null | head -1)
    print_success "asdf: $ASDF_VERSION"
    if asdf plugin list 2>/dev/null | grep -q nodejs; then
        NODE_VERSION_MANAGERS+=("asdf-nodejs")
    fi
else
    print_not_found "asdf"
fi

# Check for mise
if command -v mise &> /dev/null; then
    MISE_VERSION=$(mise --version 2>/dev/null | head -1)
    print_success "mise: $MISE_VERSION"
    NODE_VERSION_MANAGERS+=("mise")
else
    print_not_found "mise"
fi

# Check for Volta
if command -v volta &> /dev/null; then
    VOLTA_VERSION=$(volta --version 2>/dev/null)
    print_success "Volta: $VOLTA_VERSION"
else
    print_not_found "Volta (will be installed)"
fi

# Check for Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version 2>/dev/null)
    NODE_PATH=$(which node 2>/dev/null)

    # Determine which version manager is providing Node
    NODE_MANAGER="system"
    if [[ "$NODE_PATH" == *".nvm"* ]]; then
        NODE_MANAGER="nvm"
    elif [[ "$NODE_PATH" == *".fnm"* ]]; then
        NODE_MANAGER="fnm"
    elif [[ "$NODE_PATH" == *".asdf"* ]]; then
        NODE_MANAGER="asdf"
    elif [[ "$NODE_PATH" == *".volta"* ]]; then
        NODE_MANAGER="Volta"
    elif [[ "$NODE_PATH" == *".mise"* ]]; then
        NODE_MANAGER="mise"
    fi

    print_success "Node.js: $NODE_VERSION (via $NODE_MANAGER)"

    # Check if Node version is compatible
    NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v//' | cut -d. -f1)
    if [[ "$NODE_MAJOR" -lt 22 ]]; then
        WARNINGS+=("Node.js $NODE_VERSION detected. This project requires Node.js 22.x. Setup will install the correct version.")
    fi
else
    print_not_found "Node.js (will be installed)"
fi

# Check for npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version 2>/dev/null)
    print_success "npm: $NPM_VERSION"
else
    print_not_found "npm"
fi

# Check for pnpm
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version 2>/dev/null)
    print_success "pnpm: $PNPM_VERSION"

    # Check pnpm version
    PNPM_MAJOR=$(echo "$PNPM_VERSION" | cut -d. -f1)
    if [[ "$PNPM_MAJOR" -lt 10 ]]; then
        WARNINGS+=("pnpm $PNPM_VERSION detected. This project requires pnpm 10.x. Setup will install the correct version.")
    fi
else
    print_not_found "pnpm (will be installed)"
fi

# Check for Corepack
if command -v corepack &> /dev/null; then
    COREPACK_STATUS="available"
    # Check if corepack is enabled
    if corepack --version &> /dev/null; then
        print_success "Corepack: enabled"
    else
        print_success "Corepack: available (not enabled)"
    fi
else
    print_not_found "Corepack"
fi

# Check for Homebrew (macOS/Linux)
if command -v brew &> /dev/null; then
    BREW_VERSION=$(brew --version 2>/dev/null | head -1 | awk '{print $2}')
    print_success "Homebrew: $BREW_VERSION"
else
    if [[ "$OS" == "Darwin" ]]; then
        print_not_found "Homebrew (recommended for macOS)"
    else
        print_not_found "Homebrew"
    fi
fi

# Check for curl
if command -v curl &> /dev/null; then
    CURL_VERSION=$(curl --version 2>/dev/null | head -1 | awk '{print $2}')
    print_success "curl: $CURL_VERSION"
else
    print_not_found "curl (required for installation)"
fi

# ==============================================================================
# PLATFORM-SPECIFIC CHECKS
# ==============================================================================

# iOS (macOS only)
if [[ "$OS" == "Darwin" ]]; then
    print_header "iOS Development Tools"

    # Check for Xcode Command Line Tools
    if xcode-select -p &> /dev/null; then
        XCODE_PATH=$(xcode-select -p)
        print_success "Xcode CLT: $XCODE_PATH"
    else
        print_not_found "Xcode Command Line Tools"
    fi

    # Check for full Xcode
    if [[ -d "/Applications/Xcode.app" ]]; then
        XCODE_VERSION=$(/usr/bin/xcodebuild -version 2>/dev/null | head -1 | awk '{print $2}')
        print_success "Xcode: $XCODE_VERSION"
    else
        print_not_found "Xcode (required for iOS simulator)"
    fi

    # Check for CocoaPods
    if command -v pod &> /dev/null; then
        POD_VERSION=$(pod --version 2>/dev/null)
        print_success "CocoaPods: $POD_VERSION"
    else
        print_not_found "CocoaPods"
    fi

    # Check for Watchman
    if command -v watchman &> /dev/null; then
        WATCHMAN_VERSION=$(watchman --version 2>/dev/null)
        print_success "Watchman: $WATCHMAN_VERSION"
    else
        print_not_found "Watchman"
    fi
fi

# Android
print_header "Android Development Tools"

# Check for Java
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -1 | cut -d'"' -f2)
    JAVA_MAJOR=$(echo "$JAVA_VERSION" | cut -d. -f1)
    print_success "Java: $JAVA_VERSION"

    if [[ "$JAVA_MAJOR" != "17" ]]; then
        WARNINGS+=("Java $JAVA_VERSION detected. Android development requires JDK 17. Setup will install the correct version.")
    fi
else
    print_not_found "Java (JDK 17 will be installed)"
fi

# Check JAVA_HOME
if [[ -n "$JAVA_HOME" ]]; then
    print_success "JAVA_HOME: $JAVA_HOME"
else
    print_not_found "JAVA_HOME (will be configured)"
fi

# Check ANDROID_HOME / ANDROID_SDK_ROOT
if [[ -n "$ANDROID_HOME" ]]; then
    if [[ -d "$ANDROID_HOME" ]]; then
        print_success "ANDROID_HOME: $ANDROID_HOME"
    else
        print_warning "ANDROID_HOME set but directory doesn't exist: $ANDROID_HOME"
    fi
elif [[ -n "$ANDROID_SDK_ROOT" ]]; then
    if [[ -d "$ANDROID_SDK_ROOT" ]]; then
        print_success "ANDROID_SDK_ROOT: $ANDROID_SDK_ROOT"
    else
        print_warning "ANDROID_SDK_ROOT set but directory doesn't exist: $ANDROID_SDK_ROOT"
    fi
else
    print_not_found "ANDROID_HOME (will be configured)"
fi

# Check for Android Studio
if [[ "$OS" == "Darwin" ]]; then
    if [[ -d "/Applications/Android Studio.app" ]]; then
        print_success "Android Studio: installed"
    else
        print_not_found "Android Studio (manual installation required)"
    fi
elif [[ "$OS" == "Linux" ]]; then
    if command -v studio.sh &> /dev/null || [[ -d "$HOME/android-studio" ]]; then
        print_success "Android Studio: installed"
    else
        print_not_found "Android Studio (manual installation required)"
    fi
fi

# ==============================================================================
# WARNINGS
# ==============================================================================
if [[ ${#WARNINGS[@]} -gt 0 ]]; then
    print_header "Warnings"
    for warning in "${WARNINGS[@]}"; do
        print_warning "$warning"
        echo ""
    done
fi

# Multiple Node version managers warning
if [[ ${#NODE_VERSION_MANAGERS[@]} -gt 1 ]]; then
    print_header "Version Manager Conflict"
    print_warning "Multiple Node.js version managers detected: ${NODE_VERSION_MANAGERS[*]}"
    echo "This may cause conflicts. Volta will be installed and configured with highest priority."
    echo "Consider removing other version managers after setup is complete."
    echo ""
fi

# ==============================================================================
# SAVE PROFILE FOR OTHER SCRIPTS
# ==============================================================================
PROFILE_FILE="/tmp/chatwoot-setup-profile.env"
cat > "$PROFILE_FILE" << EOF
# Chatwoot Setup - System Profile
# Generated: $(date)

OS="$OS"
ARCH="$ARCH"
OS_DISPLAY="$OS_DISPLAY"
ARCH_DISPLAY="$ARCH_DISPLAY"
RAM_GB="$RAM_GB"

# Existing tools
HAS_NVM=$([[ -d "$HOME/.nvm" ]] && echo "true" || echo "false")
HAS_FNM=$(command -v fnm &> /dev/null && echo "true" || echo "false")
HAS_VOLTA=$(command -v volta &> /dev/null && echo "true" || echo "false")
HAS_HOMEBREW=$(command -v brew &> /dev/null && echo "true" || echo "false")
EOF

print_info "System profile saved to $PROFILE_FILE"

# ==============================================================================
# PROCEED PROMPT
# ==============================================================================
echo ""
if [[ -t 0 ]]; then
    read -p "Proceed with setup? (Y/n): " response
    if [[ "$response" == "n" ]] || [[ "$response" == "N" ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

print_success "System check complete. Proceeding with setup..."
