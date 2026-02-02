#!/bin/bash
#
# 01_install_volta.sh - Install Volta (Node.js Version Manager)
# Installs Volta and configures shell environment.
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
# MAIN INSTALLATION
# ==============================================================================
print_header "Volta Installation"

# Check if already installed
VOLTA_INSTALLED=false
if command -v volta &> /dev/null; then
    CURRENT_VERSION=$(volta --version 2>/dev/null || echo "unknown")
    print_success "Volta already installed: $CURRENT_VERSION"
    VOLTA_INSTALLED=true
elif [[ -f "$HOME/.volta/bin/volta" ]]; then
    print_info "Volta binary found at ~/.volta/bin/volta"
    print_info "Adding to PATH..."
    VOLTA_INSTALLED=true
fi

# Install Volta if not present
if [[ "$VOLTA_INSTALLED" == "false" ]]; then
    print_info "Downloading and installing Volta..."

    # Check for curl
    if ! command -v curl &> /dev/null; then
        print_error "curl is required but not installed."
        exit 1
    fi

    # Install Volta with --skip-setup to handle shell config ourselves
    curl -fsSL https://get.volta.sh | bash -s -- --skip-setup

    if [[ -f "$HOME/.volta/bin/volta" ]]; then
        print_success "Volta downloaded successfully"
    else
        print_error "Volta installation failed"
        exit 1
    fi
fi

# ==============================================================================
# CONFIGURE SHELL
# ==============================================================================
CONFIG_FILE=$(detect_shell_config)
echo ""
print_info "Configuring shell: $CONFIG_FILE"

# Track if any changes were made to shell config
SHELL_CONFIG_MODIFIED=false

# Detect shell type for fish compatibility
SHELL_NAME=$(basename "$SHELL")

if [[ "$SHELL_NAME" == "fish" ]]; then
    # Fish shell uses different syntax
    mkdir -p "$HOME/.config/fish"
    add_section_header "# Volta (Node.js version manager)" "$CONFIG_FILE"
    add_to_shell_config 'set -gx VOLTA_HOME "$HOME/.volta"' "$CONFIG_FILE" && SHELL_CONFIG_MODIFIED=true
    add_to_shell_config 'set -gx PATH "$VOLTA_HOME/bin" $PATH' "$CONFIG_FILE" && SHELL_CONFIG_MODIFIED=true
    add_to_shell_config 'set -gx VOLTA_FEATURE_PNPM 1' "$CONFIG_FILE" && SHELL_CONFIG_MODIFIED=true
else
    # Bash/Zsh use same syntax
    add_section_header "# Volta (Node.js version manager)" "$CONFIG_FILE"
    add_to_shell_config 'export VOLTA_HOME="$HOME/.volta"' "$CONFIG_FILE" && SHELL_CONFIG_MODIFIED=true
    add_to_shell_config 'export PATH="$VOLTA_HOME/bin:$PATH"' "$CONFIG_FILE" && SHELL_CONFIG_MODIFIED=true
    add_to_shell_config 'export VOLTA_FEATURE_PNPM=1' "$CONFIG_FILE" && SHELL_CONFIG_MODIFIED=true
fi

# ==============================================================================
# VERIFY INSTALLATION
# ==============================================================================
echo ""
print_info "Verifying installation..."

# Source the new PATH for verification
export VOLTA_HOME="$HOME/.volta"
export PATH="$VOLTA_HOME/bin:$PATH"

if [[ -x "$VOLTA_HOME/bin/volta" ]]; then
    VOLTA_VERSION=$("$VOLTA_HOME/bin/volta" --version 2>/dev/null || echo "unknown")
    print_success "Volta version: $VOLTA_VERSION"
else
    print_warning "Volta binary exists but verification pending after terminal restart"
fi

# ==============================================================================
# SUMMARY
# ==============================================================================
echo ""
print_success "Volta installed and configured."
if [[ "$SHELL_CONFIG_MODIFIED" == "true" ]]; then
    print_warning "Restart terminal or run: source $CONFIG_FILE"
fi
