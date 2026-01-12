#!/bin/bash
#
# iOS Build Tools Setup Script
# Sets up ccache, CocoaPods, and Ruby dependencies for faster iOS builds
#
# Usage:
#   ./scripts/setup-ios-build-tools.sh [OPTIONS]
#
# Options:
#   --with-pods    Also run pod install after setup
#   --check-only   Only verify installation, don't install anything
#   --help         Show this help message

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
WITH_PODS=false
CHECK_ONLY=false

for arg in "$@"; do
    case $arg in
        --with-pods)
            WITH_PODS=true
            shift
            ;;
        --check-only)
            CHECK_ONLY=true
            shift
            ;;
        --help)
            echo "iOS Build Tools Setup Script"
            echo ""
            echo "Usage: ./scripts/setup-ios-build-tools.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --with-pods    Also run pod install after setup"
            echo "  --check-only   Only verify installation, don't install anything"
            echo "  --help         Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./scripts/setup-ios-build-tools.sh              # Full setup"
            echo "  ./scripts/setup-ios-build-tools.sh --with-pods  # Setup + pod install"
            echo "  ./scripts/setup-ios-build-tools.sh --check-only # Verify only"
            exit 0
            ;;
    esac
done

# Helper function to check command existence
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo -e "${BLUE}iOS Build Tools Setup${NC}"
echo -e "${BLUE}=====================${NC}"
echo ""

if $CHECK_ONLY; then
    echo -e "${YELLOW}Running in check-only mode (no installations)${NC}"
    echo ""
fi

#-----------------------------------------------------------
# 1. Install/verify ccache
#-----------------------------------------------------------
setup_ccache() {
    echo -e "${BLUE}[1/5] Setting up ccache...${NC}"

    if command_exists ccache; then
        echo -e "${GREEN}  ccache already installed: $(ccache --version | head -1)${NC}"
    elif $CHECK_ONLY; then
        echo -e "${RED}  ccache NOT installed${NC}"
        return 1
    else
        echo -e "${YELLOW}  Installing ccache via Homebrew...${NC}"
        brew install ccache
        echo -e "${GREEN}  ccache installed${NC}"
    fi
}

#-----------------------------------------------------------
# 2. Install bigdecimal gem (Ruby 4.0 compatibility)
#-----------------------------------------------------------
setup_ruby_deps() {
    echo -e "${BLUE}[2/5] Setting up Ruby dependencies...${NC}"

    # Check if bigdecimal is available
    if gem list bigdecimal -i >/dev/null 2>&1; then
        echo -e "${GREEN}  bigdecimal gem already installed${NC}"
    elif $CHECK_ONLY; then
        echo -e "${YELLOW}  bigdecimal gem NOT installed (may cause issues with Ruby 4.0+)${NC}"
    else
        echo -e "${YELLOW}  Installing bigdecimal gem...${NC}"
        gem install bigdecimal
        echo -e "${GREEN}  bigdecimal gem installed${NC}"
    fi
}

#-----------------------------------------------------------
# 3. Link CocoaPods
#-----------------------------------------------------------
setup_cocoapods() {
    echo -e "${BLUE}[3/5] Setting up CocoaPods...${NC}"

    if command_exists pod; then
        echo -e "${GREEN}  CocoaPods already available: $(pod --version)${NC}"
    elif $CHECK_ONLY; then
        echo -e "${RED}  CocoaPods NOT available${NC}"
        return 1
    else
        # Try to link if installed but not linked
        if brew list cocoapods >/dev/null 2>&1; then
            echo -e "${YELLOW}  Linking CocoaPods...${NC}"
            brew link cocoapods
            echo -e "${GREEN}  CocoaPods linked${NC}"
        else
            echo -e "${YELLOW}  Installing CocoaPods...${NC}"
            brew install cocoapods
            echo -e "${GREEN}  CocoaPods installed${NC}"
        fi
    fi
}

#-----------------------------------------------------------
# 4. Configure PATH for ccache
#-----------------------------------------------------------
configure_path() {
    echo -e "${BLUE}[4/5] Configuring PATH for ccache...${NC}"

    CCACHE_PATH="/opt/homebrew/opt/ccache/libexec"
    CCACHE_PATH_INTEL="/usr/local/opt/ccache/libexec"

    # Determine correct path based on architecture
    if [[ -d "$CCACHE_PATH" ]]; then
        CCACHE_EXPORT="export PATH=\"$CCACHE_PATH:\$PATH\""
    elif [[ -d "$CCACHE_PATH_INTEL" ]]; then
        CCACHE_EXPORT="export PATH=\"$CCACHE_PATH_INTEL:\$PATH\""
        CCACHE_PATH="$CCACHE_PATH_INTEL"
    else
        if $CHECK_ONLY; then
            echo -e "${YELLOW}  ccache libexec not found (not installed?)${NC}"
            return 0
        fi
        echo -e "${YELLOW}  ccache libexec path not found, skipping PATH configuration${NC}"
        return 0
    fi

    # Function to add to shell config if not present
    add_to_shell_config() {
        local config_file=$1
        local marker="# ccache for iOS builds"

        if [[ -f "$config_file" ]]; then
            if grep -q "$marker" "$config_file" 2>/dev/null; then
                echo -e "${GREEN}  PATH already configured in $config_file${NC}"
            elif $CHECK_ONLY; then
                echo -e "${YELLOW}  PATH NOT configured in $config_file${NC}"
            else
                echo "" >> "$config_file"
                echo "$marker" >> "$config_file"
                echo "$CCACHE_EXPORT" >> "$config_file"
                echo -e "${GREEN}  PATH added to $config_file${NC}"
            fi
        elif [[ "$config_file" == "$HOME/.zshrc" ]] || [[ "$config_file" == "$HOME/.bashrc" ]]; then
            # Create the file if it doesn't exist for common shell configs
            if ! $CHECK_ONLY; then
                echo "$marker" > "$config_file"
                echo "$CCACHE_EXPORT" >> "$config_file"
                echo -e "${GREEN}  Created $config_file with ccache PATH${NC}"
            fi
        fi
    }

    # Add to both zshrc and bashrc for cross-shell support
    add_to_shell_config "$HOME/.zshrc"
    add_to_shell_config "$HOME/.bashrc"

    # Export for current session
    if [[ -d "$CCACHE_PATH" ]]; then
        export PATH="$CCACHE_PATH:$PATH"
        echo -e "${GREEN}  ccache PATH exported for current session${NC}"
    fi
}

#-----------------------------------------------------------
# 5. Run pod install (optional)
#-----------------------------------------------------------
run_pod_install() {
    if ! $WITH_PODS; then
        echo -e "${BLUE}[5/5] Skipping pod install (use --with-pods to include)${NC}"
        return 0
    fi

    echo -e "${BLUE}[5/5] Running pod install...${NC}"

    if [[ ! -d "$PROJECT_ROOT/ios" ]]; then
        echo -e "${YELLOW}  No ios/ directory found, skipping pod install${NC}"
        return 0
    fi

    cd "$PROJECT_ROOT/ios"

    if [[ -f "Podfile" ]]; then
        echo -e "${YELLOW}  Installing pods (this may take a while)...${NC}"
        pod install
        echo -e "${GREEN}  Pods installed successfully${NC}"
    else
        echo -e "${YELLOW}  No Podfile found, skipping${NC}"
    fi

    cd "$PROJECT_ROOT"
}

#-----------------------------------------------------------
# Verification Summary
#-----------------------------------------------------------
verify_setup() {
    echo ""
    echo -e "${BLUE}Verification Summary${NC}"
    echo -e "${BLUE}====================${NC}"

    local all_good=true

    # ccache
    if command_exists ccache; then
        echo -e "${GREEN}  ccache: $(ccache --version | head -1)${NC}"
    else
        echo -e "${RED}  ccache: NOT INSTALLED${NC}"
        all_good=false
    fi

    # CocoaPods
    if command_exists pod; then
        echo -e "${GREEN}  CocoaPods: $(pod --version)${NC}"
    else
        echo -e "${RED}  CocoaPods: NOT AVAILABLE${NC}"
        all_good=false
    fi

    # bigdecimal
    if gem list bigdecimal -i >/dev/null 2>&1; then
        echo -e "${GREEN}  bigdecimal gem: installed${NC}"
    else
        echo -e "${YELLOW}  bigdecimal gem: not installed${NC}"
    fi

    # PATH configuration
    if echo "$PATH" | grep -q "ccache"; then
        echo -e "${GREEN}  ccache in PATH: yes${NC}"
    else
        echo -e "${YELLOW}  ccache in PATH: no (restart terminal or source shell config)${NC}"
    fi

    echo ""
    if $all_good; then
        echo -e "${GREEN}iOS build tools setup complete!${NC}"
        echo ""
        echo -e "${BLUE}Next steps:${NC}"
        echo "  1. Restart your terminal to apply PATH changes"
        echo "  2. Run 'task generate' to rebuild native projects"
        echo "  3. Run 'task ccache-stats' to monitor cache performance"
    else
        if $CHECK_ONLY; then
            echo -e "${YELLOW}Some tools are missing. Run without --check-only to install them.${NC}"
        else
            echo -e "${RED}Some tools are missing. Please check errors above and try again.${NC}"
            exit 1
        fi
    fi
}

#-----------------------------------------------------------
# Main
#-----------------------------------------------------------
main() {
    setup_ccache
    setup_ruby_deps
    setup_cocoapods
    configure_path
    run_pod_install
    verify_setup
}

main "$@"
