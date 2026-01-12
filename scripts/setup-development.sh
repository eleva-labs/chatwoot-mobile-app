#!/bin/bash

# Chatscommerce Mobile Development Environment Setup Script
# This script provides an enhanced development setup using Volta for Node version management

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Chatscommerce Mobile Development Environment Setup${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""

# Function to check command availability
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Volta installation
check_volta() {
    if command_exists volta; then
        echo -e "${GREEN}✅ Volta is installed: $(volta --version)${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Volta is not installed${NC}"
        return 1
    fi
}

# Function to setup Volta
setup_volta() {
    echo -e "${BLUE}📦 Installing Volta...${NC}"

    # Install Volta
    curl https://get.volta.sh | bash

    # Source Volta in current session
    export VOLTA_HOME="$HOME/.volta"
    export PATH="$VOLTA_HOME/bin:$PATH"

    # Try to source shell profile for future sessions
    if [[ -f "$HOME/.bashrc" ]]; then
        source "$HOME/.bashrc"
    elif [[ -f "$HOME/.zshrc" ]]; then
        source "$HOME/.zshrc"
    fi

    echo -e "${GREEN}✅ Volta installed successfully${NC}"
}

# Function to setup Node via Volta
setup_node() {
    echo -e "${BLUE}📦 Setting up Node.js 20 via Volta...${NC}"

    # Install Node 20
    volta install node@20

    # Pin project to Node 20
    volta pin node@20

    echo -e "${GREEN}✅ Node.js 20 setup complete${NC}"
}

# Function to verify Node version
verify_node() {
    local expected_version="20"

    if command_exists node; then
        local node_version
        node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)

        if [[ "$node_version" == "$expected_version" ]]; then
            echo -e "${GREEN}✅ Node.js version correct: $(node --version)${NC}"
        else
            echo -e "${YELLOW}⚠️  Node.js version mismatch. Expected v${expected_version}, got $(node --version)${NC}"
            echo -e "${YELLOW}   This might resolve after restarting your terminal${NC}"
        fi
    else
        echo -e "${RED}❌ Node.js not found in PATH${NC}"
        return 1
    fi
}

# Function to install dependencies
install_dependencies() {
    echo -e "${BLUE}📦 Installing project dependencies...${NC}"

    cd "$PROJECT_ROOT"

    if command_exists pnpm; then
        pnpm install
        echo -e "${GREEN}✅ Dependencies installed with pnpm${NC}"
    elif command_exists npm; then
        npm install
        echo -e "${GREEN}✅ Dependencies installed with npm${NC}"
    else
        echo -e "${RED}❌ Neither pnpm nor npm found${NC}"
        return 1
    fi
}

# Function to setup iOS build tools (ccache, bigdecimal gem, CocoaPods)
setup_ios_build_tools() {
    echo -e "${BLUE}📦 Setting up iOS build tools...${NC}"

    if [[ -f "$SCRIPT_DIR/setup-ios-build-tools.sh" ]]; then
        bash "$SCRIPT_DIR/setup-ios-build-tools.sh"
    else
        echo -e "${YELLOW}⚠️  iOS build tools script not found, skipping${NC}"
    fi
}

# Function to setup development environment
setup_dev_environment() {
    echo -e "${BLUE}🔧 Setting up development environment...${NC}"

    cd "$PROJECT_ROOT"

    if command_exists task; then
        task setup-dev
        echo -e "${GREEN}✅ Development environment configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Task runner not found. Skipping environment setup.${NC}"
        echo -e "${YELLOW}   Install with: brew install go-task${NC}"
    fi
}

# Function to run prerequisite check
run_prereq_check() {
    echo -e "${BLUE}🔍 Running prerequisite verification...${NC}"

    cd "$PROJECT_ROOT"

    if [[ -f "scripts/check-prerequisites.sh" ]]; then
        bash scripts/check-prerequisites.sh
    else
        echo -e "${YELLOW}⚠️  Prerequisite check script not found${NC}"
    fi
}

# Main setup flow
main() {
    echo "This script will setup your development environment with Volta for Node version management."
    echo "Existing nvm setup for Xcode/EAS builds will remain untouched."
    echo ""

    # Check current Volta status
    if check_volta; then
        echo "Volta is already installed. Proceeding with Node setup..."
    else
        setup_volta
    fi

    # Setup Node
    setup_node

    # Verify Node version
    verify_node

    # Install dependencies
    install_dependencies

    # Setup iOS build tools (ccache, bigdecimal gem, CocoaPods)
    setup_ios_build_tools

    # Setup development environment
    setup_dev_environment

    # Final verification
    echo ""
    echo -e "${BLUE}🎯 Setup Summary${NC}"
    echo -e "${BLUE}================${NC}"
    echo -e "${GREEN}✅ Volta installed and configured${NC}"
    echo -e "${GREEN}✅ Node.js 20 pinned to project${NC}"
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    echo -e "${GREEN}✅ Development environment configured${NC}"
    echo ""

    echo -e "${BLUE}🚀 Next Steps${NC}"
    echo -e "${BLUE}=============${NC}"
    echo "1. Restart your terminal to ensure PATH updates take effect"
    echo "2. Run 'task check-prereqs' to verify everything is working"
    echo "3. Start development with 'task run-ios' or 'task run-android'"
    echo ""

    echo -e "${BLUE}💡 Volta Tips${NC}"
    echo -e "${BLUE}=============${NC}"
    echo "- Volta automatically manages Node versions per project"
    echo "- Use 'volta list' to see installed tools"
    echo "- Use 'volta pin <tool>@<version>' to pin additional tools"
    echo "- Your existing nvm setup remains for Xcode/EAS builds"
    echo ""

    # Optional final check
    echo "Would you like to run a final prerequisite check? (y/N): "
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        run_prereq_check
    fi

    echo ""
    echo -e "${GREEN}🎉 Setup complete! Happy coding!${NC}"
}

# Run main function
main "$@"