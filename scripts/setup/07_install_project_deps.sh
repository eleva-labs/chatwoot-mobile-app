#!/bin/bash
#
# 07_install_project_deps.sh
# Installs project dependencies via pnpm
#
# This script:
# - Runs pnpm install to install all project dependencies
# - Handles common errors (node_modules issues, lock file conflicts)
# - Verifies node_modules was created successfully
#
set -e

# ==============================================================================
# SOURCE HELPER FUNCTIONS
# ==============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/setup.sh" --helpers-only 2>/dev/null || {
    # Fallback if helpers aren't available
    print_success() { echo "[OK] $1"; }
    print_error() { echo "[ERROR] $1"; }
    print_warning() { echo "[!] $1"; }
    print_info() { echo "[INFO] $1"; }
    print_header() { echo "=== $1 ==="; }
}

# Use PROJECT_ROOT from environment or calculate it
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

# ==============================================================================
# ENSURE VOLTA ENVIRONMENT
# ==============================================================================
# Ensure Volta is in PATH for consistent Node/pnpm versions
export VOLTA_HOME="$HOME/.volta"
if [[ -d "$VOLTA_HOME" ]]; then
    export PATH="$VOLTA_HOME/bin:$PATH"
fi

print_header "Project Dependencies Installation"

# ==============================================================================
# CHECK PREREQUISITES
# ==============================================================================

# Determine how to run pnpm with the correct Node version
# Volta's pnpm shim may use a different Node version, so we use node directly
PNPM_CMD=""
if [[ -d "$VOLTA_HOME" ]] && [[ -x "$VOLTA_HOME/bin/node" ]]; then
    # Find the pnpm.cjs installed by Volta
    PNPM_CJS=$(find "$VOLTA_HOME/tools/image/pnpm" -name "pnpm.cjs" 2>/dev/null | head -1)
    if [[ -f "$PNPM_CJS" ]]; then
        PNPM_CMD="$VOLTA_HOME/bin/node $PNPM_CJS"
        print_info "Using Volta's Node with pnpm for consistent versioning"
    fi
fi

# Fall back to regular pnpm if Volta setup didn't work
if [[ -z "$PNPM_CMD" ]]; then
    if command -v pnpm &> /dev/null; then
        PNPM_CMD="pnpm"
    else
        print_error "pnpm is not installed or not in PATH"
        print_info "Please run the previous setup scripts first, then restart your terminal"
        exit 1
    fi
fi

# Verify we're in a valid project directory
if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
    print_error "package.json not found in $PROJECT_ROOT"
    print_info "Please run this script from the project root"
    exit 1
fi

cd "$PROJECT_ROOT"
print_info "Project directory: $PROJECT_ROOT"

# ==============================================================================
# CHECK FOR NODE_MODULES ISSUES
# ==============================================================================

# Check if node_modules exists and might be corrupted
if [[ -d "$PROJECT_ROOT/node_modules" ]]; then
    # Check for .package-lock.json which indicates incomplete install
    if [[ -f "$PROJECT_ROOT/node_modules/.package-lock.json" ]] && [[ ! -f "$PROJECT_ROOT/node_modules/.pnpm/lock.yaml" ]]; then
        print_warning "Detected potentially corrupted node_modules"
        print_info "This can happen if a previous install was interrupted"
        echo ""

        if [[ -t 0 ]]; then
            read -p "Remove node_modules and reinstall? (Y/n): " response
            if [[ "$response" != "n" && "$response" != "N" ]]; then
                print_info "Removing node_modules..."
                rm -rf "$PROJECT_ROOT/node_modules"
            fi
        fi
    fi
fi

# ==============================================================================
# INSTALL DEPENDENCIES
# ==============================================================================

echo ""
print_info "Installing dependencies via pnpm..."
echo ""

# First attempt: Try with frozen-lockfile for reproducibility
INSTALL_SUCCESS=false
if $PNPM_CMD install --frozen-lockfile 2>/dev/null; then
    INSTALL_SUCCESS=true
else
    print_warning "Lock file may be out of sync, running normal install..."
    echo ""

    # Second attempt: Normal install (may update lock file)
    if $PNPM_CMD install; then
        INSTALL_SUCCESS=true
        print_warning "Lock file was updated. Consider committing pnpm-lock.yaml"
    else
        INSTALL_SUCCESS=false
    fi
fi

# ==============================================================================
# HANDLE INSTALLATION FAILURES
# ==============================================================================

if [[ "$INSTALL_SUCCESS" != "true" ]]; then
    print_error "Failed to install dependencies"
    echo ""
    print_info "Common solutions:"
    echo "  1. Clear cache: pnpm store prune"
    echo "  2. Remove node_modules: rm -rf node_modules"
    echo "  3. Clear pnpm cache: rm -rf ~/.local/share/pnpm/store"
    echo "  4. Reinstall: pnpm install"
    echo ""
    print_info "If issues persist, check:"
    echo "  - Node.js version: node --version (should be 22.x)"
    echo "  - pnpm version: pnpm --version (should be 10.x)"
    echo "  - Network connectivity"
    exit 1
fi

# ==============================================================================
# VERIFY INSTALLATION
# ==============================================================================

echo ""
print_info "Verifying installation..."

# Check node_modules exists
if [[ ! -d "$PROJECT_ROOT/node_modules" ]]; then
    print_error "node_modules directory was not created"
    exit 1
fi

# Check for some key packages to verify successful install
REQUIRED_PACKAGES=("expo" "react" "react-native")
MISSING_PACKAGES=()

for package in "${REQUIRED_PACKAGES[@]}"; do
    if [[ ! -d "$PROJECT_ROOT/node_modules/$package" ]]; then
        MISSING_PACKAGES+=("$package")
    fi
done

if [[ ${#MISSING_PACKAGES[@]} -gt 0 ]]; then
    print_warning "Some expected packages may be missing: ${MISSING_PACKAGES[*]}"
    print_info "This might be normal if using pnpm's symlink structure"
fi

# Count installed packages
PACKAGE_COUNT=$(find "$PROJECT_ROOT/node_modules" -maxdepth 1 -type d | wc -l | tr -d ' ')
print_success "Installed packages in node_modules: ~$PACKAGE_COUNT"

# Check for patches directory
if [[ -d "$PROJECT_ROOT/patches" ]]; then
    PATCH_COUNT=$(find "$PROJECT_ROOT/patches" -name "*.patch" 2>/dev/null | wc -l | tr -d ' ')
    if [[ "$PATCH_COUNT" -gt 0 ]]; then
        print_success "Applied $PATCH_COUNT patch(es)"
    fi
fi

# ==============================================================================
# SUMMARY
# ==============================================================================

echo ""
print_success "Dependencies installed successfully!"
echo ""
print_info "Next steps:"
echo "  - Run 'npx expo prebuild' to generate native projects (if needed)"
echo "  - Run 'pnpm start' to start the development server"
echo ""
