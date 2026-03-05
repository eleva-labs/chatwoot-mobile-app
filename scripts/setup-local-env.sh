#!/bin/bash
# ===========================================
# Setup Local-Only Environment Variables
# ===========================================
# This script creates .env.local and ios/.xcode.env.local
# with machine-specific settings that should NOT be synced to EAS
#
# Usage: ./scripts/setup-local-env.sh
# Or via Taskfile: task setup-local-env

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Setting up local environment...${NC}"
echo ""

# ===========================================
# 1. Create/Update .env.local
# ===========================================
ENV_LOCAL="$PROJECT_ROOT/.env.local"
ENV_LOCAL_EXAMPLE="$PROJECT_ROOT/.env.local.example"

if [[ -f "$ENV_LOCAL_EXAMPLE" ]] && [[ ! -f "$ENV_LOCAL" ]]; then
    cp "$ENV_LOCAL_EXAMPLE" "$ENV_LOCAL"
    echo -e "${GREEN}Created .env.local from template${NC}"
elif [[ ! -f "$ENV_LOCAL" ]]; then
    # Create with defaults if no template exists
    cat > "$ENV_LOCAL" << 'EOF'
# Local-only environment variables (auto-generated)
# These values should NOT be synced to EAS

# Disable Sentry source map uploads for local development
SENTRY_DISABLE_AUTO_UPLOAD=true

# Build for simulator (1) or device (0)
SIMULATOR=1
EOF
    echo -e "${GREEN}Created .env.local with defaults${NC}"
else
    echo -e "${YELLOW}.env.local already exists - checking for required variables${NC}"

    # Ensure critical variables exist
    if ! grep -q "^SENTRY_DISABLE_AUTO_UPLOAD" "$ENV_LOCAL"; then
        echo "" >> "$ENV_LOCAL"
        echo "# Added by setup-local-env.sh" >> "$ENV_LOCAL"
        echo "SENTRY_DISABLE_AUTO_UPLOAD=true" >> "$ENV_LOCAL"
        echo -e "${GREEN}  Added SENTRY_DISABLE_AUTO_UPLOAD=true${NC}"
    else
        echo -e "${GREEN}  SENTRY_DISABLE_AUTO_UPLOAD already set${NC}"
    fi

    if ! grep -q "^SIMULATOR" "$ENV_LOCAL"; then
        echo "SIMULATOR=1" >> "$ENV_LOCAL"
        echo -e "${GREEN}  Added SIMULATOR=1${NC}"
    else
        echo -e "${GREEN}  SIMULATOR already set${NC}"
    fi
fi

# ===========================================
# 2. Setup ios/.xcode.env.local with Node path
# ===========================================
if [[ -d "$PROJECT_ROOT/ios" ]]; then
    XCODE_ENV_LOCAL="$PROJECT_ROOT/ios/.xcode.env.local"

    echo ""
    echo -e "${BLUE}Detecting Node.js path...${NC}"

    NODE_PATH=""
    NODE_SOURCE=""

    # Priority: Volta > nvm > system
    if command -v volta &> /dev/null; then
        NODE_PATH=$(volta which node 2>/dev/null || echo "")
        if [[ -n "$NODE_PATH" ]]; then
            NODE_SOURCE="Volta"
        fi
    fi

    if [[ -z "$NODE_PATH" ]] && [[ -f "$HOME/.nvm/nvm.sh" ]]; then
        # Try to get nvm node path
        export NVM_DIR="$HOME/.nvm"
        source "$NVM_DIR/nvm.sh" 2>/dev/null || true
        NODE_PATH=$(which node 2>/dev/null || echo "")
        if [[ -n "$NODE_PATH" ]] && [[ "$NODE_PATH" == *".nvm"* ]]; then
            NODE_SOURCE="nvm"
        fi
    fi

    if [[ -z "$NODE_PATH" ]]; then
        NODE_PATH=$(which node 2>/dev/null || echo "")
        if [[ -n "$NODE_PATH" ]]; then
            NODE_SOURCE="system"
        fi
    fi

    if [[ -n "$NODE_PATH" ]]; then
        echo "export NODE_BINARY=\"$NODE_PATH\"" > "$XCODE_ENV_LOCAL"
        echo -e "${GREEN}Created ios/.xcode.env.local with $NODE_SOURCE Node path:${NC}"
        echo -e "  $NODE_PATH"
    else
        echo -e "${YELLOW}Warning: Could not detect Node.js path${NC}"
        echo -e "  Please manually create ios/.xcode.env.local with:"
        echo -e "  export NODE_BINARY=\"/path/to/node\""
    fi
else
    echo ""
    echo -e "${YELLOW}ios/ directory not found - skipping .xcode.env.local setup${NC}"
    echo -e "  (Run 'npx expo prebuild' to generate iOS project first)"
fi

# ===========================================
# Summary
# ===========================================
echo ""
echo -e "${GREEN}Local environment setup complete!${NC}"
echo ""
echo "Files configured:"
echo -e "  ${BLUE}.env.local${NC} - Local environment overrides"
if [[ -d "$PROJECT_ROOT/ios" ]]; then
    echo -e "  ${BLUE}ios/.xcode.env.local${NC} - Xcode Node.js path"
fi
echo ""
echo "Next steps:"
echo "  1. Review .env.local and adjust values if needed"
echo "  2. Run 'task setup-dev' to pull environment from EAS"
echo "  3. Run 'task run-ios' to build and run on iOS"
