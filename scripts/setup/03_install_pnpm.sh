#!/bin/bash
#
# 03_install_pnpm.sh - Install pnpm via Corepack
# Uses Corepack (primary) or Volta (fallback).
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
export VOLTA_FEATURE_PNPM=1

# Target pnpm version
PNPM_VERSION="10.28.0"

# ==============================================================================
# READ VERSION FROM PACKAGE.JSON
# ==============================================================================
print_header "pnpm Installation"

# Try to read version from package.json packageManager field
if [[ -f "$PROJECT_ROOT/package.json" ]]; then
    PM_FIELD=$(grep '"packageManager"' "$PROJECT_ROOT/package.json" 2>/dev/null | sed 's/.*"packageManager"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || echo "")

    if [[ "$PM_FIELD" == pnpm@* ]]; then
        PNPM_VERSION=$(echo "$PM_FIELD" | sed 's/pnpm@//' | cut -d'+' -f1)
        print_info "Target version from package.json: pnpm@$PNPM_VERSION"
    else
        print_info "Using default version: pnpm@$PNPM_VERSION"
    fi
else
    print_warning "package.json not found. Using default version: pnpm@$PNPM_VERSION"
fi

# ==============================================================================
# CHECK CURRENT VERSION
# ==============================================================================
CURRENT_VERSION=""
if command -v pnpm &> /dev/null; then
    CURRENT_VERSION=$(pnpm --version 2>/dev/null || echo "")
    print_info "Current pnpm version: $CURRENT_VERSION"

    if [[ "$CURRENT_VERSION" == "$PNPM_VERSION" ]]; then
        print_success "pnpm $PNPM_VERSION is already installed"
        exit 0
    fi
fi

# ==============================================================================
# INSTALL VIA COREPACK (PRIMARY METHOD)
# ==============================================================================
COREPACK_SUCCESS=false

print_info "Attempting installation via Corepack..."

# Check if corepack is available
if command -v corepack &> /dev/null; then
    print_info "Enabling Corepack..."

    # Enable corepack
    if corepack enable 2>/dev/null; then
        print_success "Corepack enabled"

        # Prepare pnpm
        print_info "Installing pnpm@$PNPM_VERSION via Corepack..."
        if corepack prepare pnpm@"$PNPM_VERSION" --activate 2>/dev/null; then
            print_success "pnpm@$PNPM_VERSION installed via Corepack"
            COREPACK_SUCCESS=true
        else
            print_warning "Corepack prepare failed, trying alternative method..."
        fi
    else
        print_warning "Failed to enable Corepack. Trying fallback method..."
    fi
else
    print_warning "Corepack not found. Trying fallback method..."
fi

# ==============================================================================
# FALLBACK: INSTALL VIA VOLTA
# ==============================================================================
if [[ "$COREPACK_SUCCESS" == "false" ]]; then
    print_info "Attempting installation via Volta..."

    if command -v volta &> /dev/null || [[ -x "$VOLTA_HOME/bin/volta" ]]; then
        if command -v volta &> /dev/null; then
            VOLTA_CMD="volta"
        elif [[ -x "$VOLTA_HOME/bin/volta" ]]; then
            VOLTA_CMD="${VOLTA_HOME}/bin/volta"
        else
            VOLTA_CMD=""
        fi

        # Ensure VOLTA_FEATURE_PNPM is set
        export VOLTA_FEATURE_PNPM=1

        if $VOLTA_CMD install pnpm@"$PNPM_VERSION" 2>/dev/null; then
            print_success "pnpm@$PNPM_VERSION installed via Volta"
        else
            print_warning "Volta installation also failed. Trying npm..."

            # Last resort: install via npm
            if npm install -g pnpm@"$PNPM_VERSION" 2>/dev/null; then
                print_success "pnpm@$PNPM_VERSION installed via npm"
            else
                print_error "Failed to install pnpm. Please install manually: npm install -g pnpm@$PNPM_VERSION"
                exit 1
            fi
        fi
    else
        # No Volta available, try npm
        print_info "Installing via npm..."
        if npm install -g pnpm@"$PNPM_VERSION" 2>/dev/null; then
            print_success "pnpm@$PNPM_VERSION installed via npm"
        else
            print_error "Failed to install pnpm. Please install manually: npm install -g pnpm@$PNPM_VERSION"
            exit 1
        fi
    fi
fi

# ==============================================================================
# VERIFY INSTALLATION
# ==============================================================================
echo ""
print_info "Verifying installation..."

# Give system a moment to update
sleep 1

# Check pnpm version
if command -v pnpm &> /dev/null; then
    INSTALLED_VERSION=$(pnpm --version 2>/dev/null || echo "unknown")
    print_success "pnpm version: $INSTALLED_VERSION"

    if [[ "$INSTALLED_VERSION" != "$PNPM_VERSION" ]]; then
        print_warning "Installed version ($INSTALLED_VERSION) differs from target ($PNPM_VERSION)"
        print_info "This may resolve after terminal restart"
    fi
else
    print_warning "pnpm verification pending after terminal restart"
fi

# ==============================================================================
# SUMMARY
# ==============================================================================
echo ""
print_success "pnpm installation complete."

# Show Corepack status
if [[ "$COREPACK_SUCCESS" == "true" ]]; then
    print_info "Installed via Corepack (recommended)"
else
    print_info "Installed via fallback method"
    print_warning "Consider enabling Corepack: corepack enable"
fi
