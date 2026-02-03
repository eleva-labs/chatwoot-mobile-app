#!/bin/bash
#
# Chatwoot Mobile App - Main Setup Script
# This is the main entry point for setting up the development environment.
#
# Usage:
#   ./scripts/setup/setup.sh                # Full setup (prompts for platform)
#   ./scripts/setup/setup.sh --ios          # iOS only
#   ./scripts/setup/setup.sh --android      # Android only
#   ./scripts/setup/setup.sh --skip=05,06   # Skip specific scripts
#   ./scripts/setup/setup.sh --non-interactive  # Skip all interactive prompts
#   ./scripts/setup/setup.sh --helpers-only # Export helper functions only (for sourcing)
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
NC='\033[0m' # No Color

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

print_step() {
    local step=$1
    local total=$2
    local message=$3
    echo -e "\n${CYAN}${BOLD}[$step/$total]${NC} ${BOLD}$message${NC}"
}

print_header() {
    echo -e "\n${BOLD}=== $1 ===${NC}\n"
}

# ==============================================================================
# SHELL CONFIGURATION HELPERS
# ==============================================================================

# Detect user's shell and config file
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

# Add a line to shell config if not already present (idempotent)
add_to_shell_config() {
    local line="$1"
    local config_file="${2:-$(detect_shell_config)}"

    # Create config file if it doesn't exist
    if [[ ! -f "$config_file" ]]; then
        touch "$config_file"
    fi

    # Check if line already exists (exact match)
    if ! grep -qF "$line" "$config_file" 2>/dev/null; then
        echo "$line" >> "$config_file"
        echo -e "  ${GREEN}[ADDED]${NC} $line"
        return 0  # Line was added
    else
        echo -e "  ${YELLOW}[SKIP]${NC} Already present: ${line:0:60}..."
        return 1  # Line already existed
    fi
}

# Add a comment/section header to shell config
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

# Notify user to reload shell config
notify_shell_reload() {
    local config_file="${1:-$(detect_shell_config)}"

    echo ""
    print_header "Shell Configuration Updated"
    echo "Config file: $config_file"
    echo ""
    echo "To apply changes, either:"
    echo "  1. Restart your terminal"
    echo "  2. Run: source $config_file"
    echo ""
}

# ==============================================================================
# SCRIPT DIRECTORY AND PROJECT ROOT
# ==============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Export for child scripts
export SCRIPT_DIR
export PROJECT_ROOT
export RED GREEN YELLOW BLUE CYAN BOLD NC

# Export helper functions for child scripts
export -f print_success print_error print_warning print_info print_step print_header
export -f detect_shell_config add_to_shell_config add_section_header notify_shell_reload

# ==============================================================================
# HELPERS-ONLY MODE (for sourcing by child scripts)
# ==============================================================================
if [[ "$1" == "--helpers-only" ]]; then
    # Just export the functions and exit - don't run anything
    return 0 2>/dev/null || exit 0
fi

# ==============================================================================
# PARSE COMMAND LINE ARGUMENTS
# ==============================================================================
PLATFORM="both"  # ios, android, or both
SKIP_SCRIPTS=""
NON_INTERACTIVE=false

for arg in "$@"; do
    case $arg in
        --ios)
            PLATFORM="ios"
            ;;
        --android)
            PLATFORM="android"
            ;;
        --skip=*)
            SKIP_SCRIPTS="${arg#*=}"
            ;;
        --non-interactive)
            NON_INTERACTIVE=true
            ;;
        --help|-h)
            echo "Chatwoot Mobile App - Development Environment Setup"
            echo ""
            echo "Usage: ./scripts/setup/setup.sh [options]"
            echo ""
            echo "Options:"
            echo "  --ios              Install iOS dependencies only"
            echo "  --android          Install Android dependencies only"
            echo "  --skip=NN,NN       Skip specific scripts (e.g., --skip=05,06)"
            echo "  --non-interactive  Skip all interactive prompts (use defaults)"
            echo "  --help, -h         Show this help message"
            echo ""
            echo "Scripts:"
            echo "  00 - System check"
            echo "  01 - Volta installation"
            echo "  02 - Node.js installation"
            echo "  03 - pnpm installation"
            echo "  04 - Expo/EAS CLI installation"
            echo "  05 - Authentication setup (EAS, Firebase)"
            echo "  06 - iOS dependencies (macOS only)"
            echo "  07 - Android dependencies"
            echo "  08 - Project dependencies"
            echo "  09 - Environment setup"
            echo "  10 - Firebase setup"
            echo "  11 - Verification"
            echo ""
            exit 0
            ;;
    esac
done

# Export NON_INTERACTIVE for child scripts
export NON_INTERACTIVE

# Convert skip list to array
IFS=',' read -ra SKIP_ARRAY <<< "$SKIP_SCRIPTS"

should_skip() {
    local script_num=$1
    for skip in "${SKIP_ARRAY[@]}"; do
        if [[ "$skip" == "$script_num" ]]; then
            return 0
        fi
    done
    return 1
}

# ==============================================================================
# MAIN SETUP
# ==============================================================================
clear 2>/dev/null || true

echo -e "${BOLD}"
echo "=============================================="
echo "  Chatwoot Mobile App Development Setup"
echo "=============================================="
echo -e "${NC}"

echo "This script will set up your development environment."
echo "It will install: Volta, Node.js 22.x, pnpm 10.x, Expo CLI, EAS CLI"
echo ""

# Platform selection (if not specified via command line)
if [[ "$PLATFORM" == "both" ]] && [[ -t 0 ]]; then
    echo "Platform selection:"
    echo "  1) iOS only"
    echo "  2) Android only"
    echo "  3) Both (recommended)"
    echo ""
    read -p "Select platform [3]: " platform_choice
    case $platform_choice in
        1) PLATFORM="ios" ;;
        2) PLATFORM="android" ;;
        *) PLATFORM="both" ;;
    esac
fi

echo ""
print_info "Platform: $PLATFORM"
if [[ -n "$SKIP_SCRIPTS" ]]; then
    print_info "Skipping scripts: $SKIP_SCRIPTS"
fi
if [[ "$NON_INTERACTIVE" == "true" ]]; then
    print_info "Mode: Non-interactive (using defaults)"
fi
echo ""

# Determine total steps based on platform
# Full setup has scripts 00-11 (12 scripts total)
TOTAL_STEPS=12

CURRENT_STEP=0
SHELL_CONFIG_MODIFIED=false
ERRORS=()

run_script() {
    local script_num=$1
    local script_name=$2
    local description=$3
    local platform_condition=${4:-"all"}

    # Check platform condition
    if [[ "$platform_condition" == "ios" ]] && [[ "$PLATFORM" == "android" ]]; then
        return 0
    fi
    if [[ "$platform_condition" == "android" ]] && [[ "$PLATFORM" == "ios" ]]; then
        return 0
    fi

    ((CURRENT_STEP++))

    if should_skip "$script_num"; then
        print_step $CURRENT_STEP $TOTAL_STEPS "$description"
        print_warning "Skipped (--skip=$script_num)"
        return 0
    fi

    print_step $CURRENT_STEP $TOTAL_STEPS "$description"

    local script_path="$SCRIPT_DIR/${script_num}_${script_name}.sh"
    if [[ -f "$script_path" ]]; then
        if bash "$script_path"; then
            print_success "$description completed"
        else
            print_error "$description failed"
            ERRORS+=("$script_num: $description")
        fi
    else
        print_warning "Script not found: $script_path"
    fi
}

# ==============================================================================
# RUN SETUP SCRIPTS
# ==============================================================================

# --- Phase 1: Automated Tool Installation ---
print_header "Phase 1: Tool Installation"
run_script "00" "check_system" "Checking system requirements..." "all"
run_script "01" "install_volta" "Installing Volta..." "all"
run_script "02" "install_node" "Installing Node.js..." "all"
run_script "03" "install_pnpm" "Installing pnpm..." "all"
run_script "04" "install_expo_eas" "Installing Expo and EAS CLI..." "all"

# --- Phase 2: Interactive Authentication ---
print_header "Phase 2: Authentication"
run_script "05" "setup_auth" "Setting up authentication..." "all"

# --- Phase 3: Platform Dependencies ---
print_header "Phase 3: Platform Dependencies"
run_script "06" "install_ios_deps" "Installing iOS dependencies..." "ios"
run_script "07" "install_android_deps" "Installing Android dependencies..." "android"

# --- Phase 4: Project Configuration ---
print_header "Phase 4: Project Configuration"
run_script "08" "install_project_deps" "Installing project dependencies..." "all"
run_script "09" "setup_env" "Setting up environment..." "all"
run_script "10" "setup_firebase" "Setting up Firebase..." "all"

# --- Phase 5: Verification ---
print_header "Phase 5: Verification"
run_script "11" "verify_setup" "Verifying setup..." "all"

# ==============================================================================
# SUMMARY
# ==============================================================================
echo ""
print_header "Setup Summary"

if [[ ${#ERRORS[@]} -eq 0 ]]; then
    print_success "All setup steps completed successfully!"
else
    print_error "Some steps failed:"
    for error in "${ERRORS[@]}"; do
        echo "  - $error"
    done
fi

# Shell configuration notification
CONFIG_FILE=$(detect_shell_config)
notify_shell_reload "$CONFIG_FILE"

echo ""
print_header "Next Steps"
echo "1. Restart your terminal (or run: source $CONFIG_FILE)"
echo "2. Verify your .env file is configured (see ./scripts/pull-env.sh)"
echo "3. Run 'pnpm start' to begin development"
echo ""

if [[ "$PLATFORM" == "both" ]] || [[ "$PLATFORM" == "android" ]]; then
    print_warning "For Android development, you will need to:"
    echo "   - Install Android Studio: https://developer.android.com/studio"
    echo "   - Install SDK components via Android Studio SDK Manager"
    echo ""
fi

if [[ "$PLATFORM" == "both" ]] || [[ "$PLATFORM" == "ios" ]]; then
    if [[ "$(uname)" == "Darwin" ]]; then
        print_info "For iOS development, ensure Xcode is installed from the App Store"
    else
        print_warning "iOS development requires macOS"
    fi
    echo ""
fi

print_success "Setup complete! Happy coding!"
