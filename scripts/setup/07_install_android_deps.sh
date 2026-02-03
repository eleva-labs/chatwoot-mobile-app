#!/bin/bash
#
# 07_install_android_deps.sh - Install Android Development Dependencies
# Installs JDK 17 and configures JAVA_HOME, ANDROID_HOME, and PATH.
# Works on both macOS and Linux.
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
CYAN='\033[0;36m'
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
# SHELL CONFIGURATION HELPERS
# ==============================================================================
detect_shell_config() {
    local shell_name
    shell_name=$(basename "$SHELL")
    case "$shell_name" in
        zsh)
            echo "$HOME/.zshrc"
            ;;
        bash)
            if [[ -f "$HOME/.bashrc" ]]; then
                echo "$HOME/.bashrc"
            elif [[ -f "$HOME/.bash_profile" ]]; then
                echo "$HOME/.bash_profile"
            else
                echo "$HOME/.bashrc"
            fi
            ;;
        fish)
            echo "$HOME/.config/fish/config.fish"
            ;;
        *)
            echo "$HOME/.profile"
            ;;
    esac
}

add_to_shell_config() {
    local line="$1"
    local config_file="${2:-$(detect_shell_config)}"

    if [[ ! -f "$config_file" ]]; then
        touch "$config_file"
    fi

    if ! grep -qF "$line" "$config_file" 2>/dev/null; then
        echo "$line" >> "$config_file"
        echo -e "  ${GREEN}[ADDED]${NC} $line"
        return 0
    else
        echo -e "  ${YELLOW}[SKIP]${NC} Already present: ${line:0:60}..."
        return 1
    fi
}

add_section_header() {
    local header="$1"
    local config_file="${2:-$(detect_shell_config)}"

    if [[ ! -f "$config_file" ]]; then
        touch "$config_file"
    fi

    if ! grep -qF "$header" "$config_file" 2>/dev/null; then
        echo "" >> "$config_file"
        echo "$header" >> "$config_file"
    fi
}

# ==============================================================================
# DETECT OS AND ARCHITECTURE
# ==============================================================================
print_header "Android Dependencies"

OS="$(uname -s)"
ARCH="$(uname -m)"

print_info "Detected OS: $OS"
print_info "Detected Architecture: $ARCH"

if [[ "$OS" != "Darwin" ]] && [[ "$OS" != "Linux" ]]; then
    print_error "Unsupported operating system: $OS"
    print_info "This script supports macOS and Linux only."
    exit 1
fi

# ==============================================================================
# JAVA_HOME DETECTION FUNCTION
# ==============================================================================
detect_java_home() {
    local java_home=""

    case "$OS" in
        Darwin)
            # macOS - check paths in order of preference
            # 1. Temurin cask (most common - installed via brew install --cask temurin@17)
            if [[ -d "/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home" ]]; then
                java_home="/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home"
            # 2. Homebrew formula (ARM - Apple Silicon)
            elif [[ -d "/opt/homebrew/opt/openjdk@17" ]]; then
                java_home="/opt/homebrew/opt/openjdk@17"
            # 3. Homebrew formula (Intel)
            elif [[ -d "/usr/local/opt/openjdk@17" ]]; then
                java_home="/usr/local/opt/openjdk@17"
            # 4. Fallback - any JDK 17 in JavaVirtualMachines
            elif ls -d /Library/Java/JavaVirtualMachines/*-17*/Contents/Home 2>/dev/null | head -1 | grep -q .; then
                java_home=$(ls -d /Library/Java/JavaVirtualMachines/*-17*/Contents/Home 2>/dev/null | head -1)
            # 5. Homebrew Cellar paths (ARM)
            elif [[ -d "/opt/homebrew/Cellar/openjdk@17" ]]; then
                java_home=$(ls -d /opt/homebrew/Cellar/openjdk@17/*/libexec/openjdk.jdk/Contents/Home 2>/dev/null | head -1)
            # 6. Homebrew Cellar paths (Intel)
            elif [[ -d "/usr/local/Cellar/openjdk@17" ]]; then
                java_home=$(ls -d /usr/local/Cellar/openjdk@17/*/libexec/openjdk.jdk/Contents/Home 2>/dev/null | head -1)
            fi
            ;;
        Linux)
            # Linux - check common locations
            if [[ -d "/usr/lib/jvm/temurin-17-jdk-amd64" ]]; then
                java_home="/usr/lib/jvm/temurin-17-jdk-amd64"
            elif [[ -d "/usr/lib/jvm/temurin-17-jdk-arm64" ]]; then
                java_home="/usr/lib/jvm/temurin-17-jdk-arm64"
            elif [[ -d "/usr/lib/jvm/java-17-openjdk-amd64" ]]; then
                java_home="/usr/lib/jvm/java-17-openjdk-amd64"
            elif [[ -d "/usr/lib/jvm/java-17-openjdk-arm64" ]]; then
                java_home="/usr/lib/jvm/java-17-openjdk-arm64"
            elif [[ -d "/usr/lib/jvm/java-17-openjdk" ]]; then
                java_home="/usr/lib/jvm/java-17-openjdk"
            fi
            ;;
    esac

    echo "$java_home"
}

# ==============================================================================
# ANDROID_HOME DETECTION FUNCTION
# ==============================================================================

# Validates that a directory contains actual Android SDK components
# Returns 0 (true) if valid SDK found, 1 (false) otherwise
is_valid_android_sdk() {
    local path="$1"

    # Path must exist and be a directory
    [[ -d "$path" ]] || return 1

    # Check for SDK components (any of these indicates a valid SDK)
    # - platform-tools/adb: Core Android debugging tool
    # - platforms/: Contains Android platform versions
    # - build-tools/: Contains build toolchain
    # - cmdline-tools/: Contains SDK manager and other CLI tools
    if [[ -f "$path/platform-tools/adb" ]] || \
       [[ -d "$path/platforms" ]] || \
       [[ -d "$path/build-tools" ]] || \
       [[ -d "$path/cmdline-tools" ]]; then
        return 0
    fi

    return 1
}

# Detects ANDROID_HOME by checking multiple known locations in priority order
# Returns the first valid SDK location found, or empty string if none found
detect_android_home() {
    # Define locations to check in priority order
    local locations=(
        "$ANDROID_HOME"                                    # 1. Existing env var (highest priority)
        "$HOME/Library/Android/sdk"                        # 2. Android Studio default on macOS
        "/opt/homebrew/share/android-commandlinetools"     # 3. Homebrew on Apple Silicon
        "/usr/local/share/android-commandlinetools"        # 4. Homebrew on Intel Mac
        "$HOME/Android/Sdk"                                # 5. Android Studio default on Linux
        "$HOME/android-sdk"                                # 6. Alternative Linux location
    )

    # Check each location in order
    for loc in "${locations[@]}"; do
        # Skip empty values (e.g., if ANDROID_HOME is not set)
        [[ -z "$loc" ]] && continue

        # Return first valid SDK location found
        if is_valid_android_sdk "$loc"; then
            echo "$loc"
            return 0
        fi
    done

    # No valid SDK found - return empty string
    # The caller should handle this case (e.g., prompt user to install)
    return 1
}

# Returns the default expected ANDROID_HOME path for the current OS
# Used when no SDK is found but we need to configure the path
get_default_android_home() {
    case "$OS" in
        Darwin) echo "$HOME/Library/Android/sdk" ;;
        Linux) echo "$HOME/Android/Sdk" ;;
        *) echo "$HOME/Android/Sdk" ;;
    esac
}

# ==============================================================================
# CHECK EXISTING JAVA VERSION
# ==============================================================================
check_java_version() {
    if command -v java &> /dev/null; then
        local java_version
        java_version=$(java -version 2>&1 | head -1 | cut -d'"' -f2 | cut -d'.' -f1)
        if [[ "$java_version" == "17" ]]; then
            return 0  # JDK 17 is installed
        fi
    fi
    return 1  # JDK 17 not found
}

# ==============================================================================
# INSTALL JDK 17
# ==============================================================================
echo ""
print_info "Checking for JDK 17..."

install_jdk() {
    if check_java_version; then
        local java_version_full
        java_version_full=$(java -version 2>&1 | head -1)
        print_success "JDK 17 already installed: $java_version_full"
        return 0
    fi

    print_info "Installing OpenJDK 17 (Eclipse Temurin)..."

    case "$OS" in
        Darwin)
            # macOS - use Homebrew
            if ! command -v brew &> /dev/null; then
                print_error "Homebrew not found. Please install Homebrew first."
                print_info "Run: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
                exit 1
            fi

            # Install Temurin JDK 17 via Homebrew
            print_info "Installing temurin@17 via Homebrew..."
            brew install --cask temurin@17 2>/dev/null || brew install openjdk@17

            print_success "JDK 17 installed via Homebrew"
            ;;
        Linux)
            # Linux - detect package manager
            if command -v apt-get &> /dev/null; then
                print_info "Detected apt package manager (Debian/Ubuntu)"
                print_info "Installing openjdk-17-jdk..."
                sudo apt-get update
                sudo apt-get install -y openjdk-17-jdk
            elif command -v dnf &> /dev/null; then
                print_info "Detected dnf package manager (Fedora/RHEL)"
                print_info "Installing java-17-openjdk-devel..."
                sudo dnf install -y java-17-openjdk-devel
            elif command -v pacman &> /dev/null; then
                print_info "Detected pacman package manager (Arch)"
                print_info "Installing jdk17-openjdk..."
                sudo pacman -S --noconfirm jdk17-openjdk
            else
                print_error "Unsupported package manager."
                print_info "Please install JDK 17 manually from: https://adoptium.net/temurin/releases/"
                exit 1
            fi

            print_success "JDK 17 installed"
            ;;
    esac
}

install_jdk

# ==============================================================================
# CONFIGURE SHELL ENVIRONMENT
# ==============================================================================
echo ""
print_info "Configuring shell environment..."

CONFIG_FILE=$(detect_shell_config)
print_info "Detected shell config: $CONFIG_FILE"

# Track if any changes were made
SHELL_CONFIG_MODIFIED=false

# Detect JAVA_HOME
JAVA_HOME_PATH=$(detect_java_home)
if [[ -z "$JAVA_HOME_PATH" ]]; then
    print_warning "Could not auto-detect JAVA_HOME. JDK may not be installed correctly."
else
    print_info "Detected JAVA_HOME: $JAVA_HOME_PATH"
fi

# Detect ANDROID_HOME - try to find existing valid SDK, otherwise use default path
ANDROID_HOME_PATH=$(detect_android_home) || ANDROID_HOME_PATH=$(get_default_android_home)
if is_valid_android_sdk "$ANDROID_HOME_PATH"; then
    print_success "Found valid Android SDK at: $ANDROID_HOME_PATH"
else
    print_info "Using ANDROID_HOME: $ANDROID_HOME_PATH (SDK not yet installed)"
fi

# Detect shell type for fish compatibility
SHELL_NAME=$(basename "$SHELL")

# Add section header
add_section_header "# Android Development Environment" "$CONFIG_FILE"

if [[ "$SHELL_NAME" == "fish" ]]; then
    # Fish shell uses different syntax
    mkdir -p "$HOME/.config/fish"

    # JAVA_HOME for fish - use the detected path
    if [[ -n "$JAVA_HOME_PATH" ]]; then
        add_to_shell_config "set -gx JAVA_HOME \"$JAVA_HOME_PATH\"" "$CONFIG_FILE" && SHELL_CONFIG_MODIFIED=true
    else
        print_warning "JAVA_HOME not detected - skipping shell config for JAVA_HOME"
    fi
    add_to_shell_config 'set -gx PATH "$JAVA_HOME/bin" $PATH' "$CONFIG_FILE" && SHELL_CONFIG_MODIFIED=true

    # ANDROID_HOME for fish
    add_to_shell_config "set -gx ANDROID_HOME \"$ANDROID_HOME_PATH\"" "$CONFIG_FILE" && SHELL_CONFIG_MODIFIED=true
    add_to_shell_config 'set -gx PATH "$ANDROID_HOME/emulator" $PATH' "$CONFIG_FILE" && SHELL_CONFIG_MODIFIED=true
    add_to_shell_config 'set -gx PATH "$ANDROID_HOME/platform-tools" $PATH' "$CONFIG_FILE" && SHELL_CONFIG_MODIFIED=true
    add_to_shell_config 'set -gx PATH "$ANDROID_HOME/cmdline-tools/latest/bin" $PATH' "$CONFIG_FILE" && SHELL_CONFIG_MODIFIED=true
else
    # Bash/Zsh use same syntax

    # JAVA_HOME - use the detected path (works for temurin cask, Homebrew formula, etc.)
    if [[ -n "$JAVA_HOME_PATH" ]]; then
        add_to_shell_config "export JAVA_HOME=\"$JAVA_HOME_PATH\"" "$CONFIG_FILE" && SHELL_CONFIG_MODIFIED=true
    else
        print_warning "JAVA_HOME not detected - skipping shell config for JAVA_HOME"
    fi
    add_to_shell_config 'export PATH="$JAVA_HOME/bin:$PATH"' "$CONFIG_FILE" && SHELL_CONFIG_MODIFIED=true

    # ANDROID_HOME
    add_to_shell_config "export ANDROID_HOME=\"$ANDROID_HOME_PATH\"" "$CONFIG_FILE" && SHELL_CONFIG_MODIFIED=true

    # Android SDK PATH entries
    add_to_shell_config 'export PATH="$ANDROID_HOME/emulator:$PATH"' "$CONFIG_FILE" && SHELL_CONFIG_MODIFIED=true
    add_to_shell_config 'export PATH="$ANDROID_HOME/platform-tools:$PATH"' "$CONFIG_FILE" && SHELL_CONFIG_MODIFIED=true
    add_to_shell_config 'export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"' "$CONFIG_FILE" && SHELL_CONFIG_MODIFIED=true
fi

print_success "Shell environment configured"

# ==============================================================================
# VERIFICATION
# ==============================================================================
echo ""
print_header "Verification"

# Set environment for verification in current session
JAVA_HOME_PATH=$(detect_java_home)
if [[ -n "$JAVA_HOME_PATH" ]]; then
    export JAVA_HOME="$JAVA_HOME_PATH"
    export PATH="$JAVA_HOME/bin:$PATH"
fi

# Verify Java
if [[ -n "$JAVA_HOME_PATH" ]] && [[ -x "$JAVA_HOME_PATH/bin/java" ]]; then
    java_version_output=$("$JAVA_HOME_PATH/bin/java" -version 2>&1 | head -1)
    print_success "Java: $java_version_output"
    print_success "JAVA_HOME: $JAVA_HOME_PATH"
elif command -v java &> /dev/null; then
    java_version_output=$(java -version 2>&1 | head -1)
    print_success "Java: $java_version_output"
    print_warning "JAVA_HOME verification pending - restart terminal first"
else
    print_warning "Java verification pending - restart terminal first"
fi

# Check if Android SDK exists and is valid
ANDROID_HOME_PATH=$(detect_android_home) || ANDROID_HOME_PATH=$(get_default_android_home)
if is_valid_android_sdk "$ANDROID_HOME_PATH"; then
    print_success "ANDROID_HOME: $ANDROID_HOME_PATH (validated)"

    # Check for platform-tools
    if [[ -f "$ANDROID_HOME_PATH/platform-tools/adb" ]]; then
        print_success "Android platform-tools: Found (adb available)"
    elif [[ -d "$ANDROID_HOME_PATH/platform-tools" ]]; then
        print_success "Android platform-tools: Found"
    else
        print_warning "Android platform-tools: Not yet installed"
    fi

    # Check for emulator
    if [[ -d "$ANDROID_HOME_PATH/emulator" ]]; then
        print_success "Android emulator: Found"
    else
        print_warning "Android emulator: Not yet installed"
    fi

    # Check for build-tools
    if [[ -d "$ANDROID_HOME_PATH/build-tools" ]]; then
        print_success "Android build-tools: Found"
    else
        print_warning "Android build-tools: Not yet installed"
    fi

    # Check for platforms
    if [[ -d "$ANDROID_HOME_PATH/platforms" ]]; then
        print_success "Android platforms: Found"
    else
        print_warning "Android platforms: Not yet installed"
    fi
elif [[ -d "$ANDROID_HOME_PATH" ]]; then
    print_warning "ANDROID_HOME directory exists but no SDK components found: $ANDROID_HOME_PATH"
    print_info "Run Android Studio SDK Manager to install SDK components"
else
    print_info "ANDROID_HOME configured but SDK not yet installed: $ANDROID_HOME_PATH"
    print_info "SDK will be installed when you set up Android Studio"
fi

# ==============================================================================
# REMAINING MANUAL STEPS
# ==============================================================================
echo ""
print_header "REMAINING MANUAL STEPS"

echo "1. Download and install Android Studio from:"
echo "   ${BLUE}https://developer.android.com/studio${NC}"
echo ""
echo "2. Open Android Studio SDK Manager and install:"
echo "   - Android SDK Platform 35"
echo "   - Android SDK Build-Tools 35.0.0"
echo "   - Android SDK Command-line Tools"
echo "   - Android Emulator"
echo "   - Android SDK Platform-Tools"
echo ""
echo "3. Restart your terminal or run:"
echo "   ${CYAN}source $CONFIG_FILE${NC}"
echo ""

# ==============================================================================
# SUMMARY
# ==============================================================================
print_success "Android dependencies installation complete."
if [[ "$SHELL_CONFIG_MODIFIED" == "true" ]]; then
    print_warning "Shell configuration was modified. Restart terminal to apply changes."
fi
