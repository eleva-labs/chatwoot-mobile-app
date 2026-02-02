#!/bin/bash
#
# 02_install_node.sh - Install Node.js via Volta
# Reads version from package.json volta field.
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
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

# Ensure Volta is in PATH
export VOLTA_HOME="$HOME/.volta"
export PATH="$VOLTA_HOME/bin:$PATH"

# ==============================================================================
# MAIN INSTALLATION
# ==============================================================================
print_header "Node.js Installation"

# Verify Volta is available
if ! command -v volta &> /dev/null; then
    if [[ -x "$VOLTA_HOME/bin/volta" ]]; then
        print_info "Using Volta from $VOLTA_HOME/bin/volta"
        VOLTA_CMD="$VOLTA_HOME/bin/volta"
    else
        print_error "Volta is not installed. Please run 01_install_volta.sh first."
        exit 1
    fi
else
    VOLTA_CMD="volta"
fi

# Read Node version from package.json
print_info "Reading version from package.json..."

if [[ -f "$PROJECT_ROOT/package.json" ]]; then
    # Extract volta.node version from package.json using Python for reliable JSON parsing
    if command -v python3 &> /dev/null; then
        NODE_VERSION=$(python3 -c "import sys, json; data=json.load(open('$PROJECT_ROOT/package.json')); print(data.get('volta',{}).get('node',''))" 2>/dev/null || echo "")
    else
        # Fallback: extract volta.node specifically (first match only, head -1)
        NODE_VERSION=$(grep -A2 '"volta"' "$PROJECT_ROOT/package.json" 2>/dev/null | grep '"node"' | head -1 | sed 's/.*"node"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || echo "")
    fi

    if [[ -n "$NODE_VERSION" ]]; then
        print_info "Target version from package.json: Node.js $NODE_VERSION"
    else
        # Fallback to default version
        NODE_VERSION="22.22.0"
        print_warning "No volta.node field in package.json. Using default: $NODE_VERSION"
    fi
else
    print_warning "package.json not found. Using default version."
    NODE_VERSION="22.22.0"
fi

# Check current Node version
CURRENT_VERSION=""
if command -v node &> /dev/null; then
    CURRENT_VERSION=$(node --version 2>/dev/null | sed 's/v//')
    print_info "Current Node.js version: v$CURRENT_VERSION"
fi

# Install Node via Volta
if [[ "$CURRENT_VERSION" == "$NODE_VERSION" ]]; then
    print_success "Node.js $NODE_VERSION is already installed"
else
    print_info "Installing Node.js $NODE_VERSION via Volta..."

    # Navigate to project root so Volta picks up the package.json
    cd "$PROJECT_ROOT"

    # Install Node.js
    if $VOLTA_CMD install node@"$NODE_VERSION"; then
        print_success "Node.js $NODE_VERSION installed successfully"
    else
        print_error "Failed to install Node.js $NODE_VERSION"
        exit 1
    fi
fi

# ==============================================================================
# PIN NODE VERSION TO PROJECT
# ==============================================================================
print_info "Pinning Node.js version to project..."
cd "$PROJECT_ROOT"

# Use volta pin to ensure package.json has the correct version
if $VOLTA_CMD pin node@"$NODE_VERSION" 2>/dev/null; then
    print_success "Node.js $NODE_VERSION pinned to project"
else
    print_info "Node.js version already pinned in package.json"
fi

# ==============================================================================
# VERIFY INSTALLATION
# ==============================================================================
echo ""
print_info "Verifying installation..."

# Use Volta's run to ensure we get the correct version
if [[ -x "$VOLTA_HOME/bin/node" ]]; then
    INSTALLED_NODE=$("$VOLTA_HOME/bin/node" --version 2>/dev/null || echo "unknown")
    INSTALLED_NPM=$("$VOLTA_HOME/bin/npm" --version 2>/dev/null || echo "unknown")

    print_success "Node version: $INSTALLED_NODE"
    print_success "npm version: $INSTALLED_NPM"
elif command -v node &> /dev/null; then
    INSTALLED_NODE=$(node --version 2>/dev/null || echo "unknown")
    INSTALLED_NPM=$(npm --version 2>/dev/null || echo "unknown")

    print_success "Node version: $INSTALLED_NODE"
    print_success "npm version: $INSTALLED_NPM"
else
    print_warning "Node.js installed but verification pending after terminal restart"
fi

# ==============================================================================
# SUMMARY
# ==============================================================================
echo ""
print_success "Node.js installation complete."
