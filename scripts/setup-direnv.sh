#!/bin/bash

# Setup direnv for Auto-Loading Environment Variables
# ====================================================
# This script installs direnv and configures it for the project
# direnv automatically loads .env files when you cd into the project

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Setting up direnv...${NC}"
echo ""

# Step 1: Check if direnv is installed
if command -v direnv &> /dev/null; then
    echo -e "${GREEN}✅ direnv is already installed: $(direnv --version)${NC}"
else
    echo -e "${YELLOW}📦 Installing direnv via Homebrew...${NC}"
    if command -v brew &> /dev/null; then
        brew install direnv
        echo -e "${GREEN}✅ direnv installed${NC}"
    else
        echo -e "${RED}❌ Homebrew not found. Please install Homebrew first:${NC}"
        echo -e "   curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh | bash"
        exit 1
    fi
fi

echo ""

# Step 2: Detect shell
SHELL_NAME=$(basename "$SHELL")
SHELL_RC=""

case "$SHELL_NAME" in
    zsh)
        SHELL_RC="$HOME/.zshrc"
        ;;
    bash)
        SHELL_RC="$HOME/.bashrc"
        ;;
    *)
        echo -e "${YELLOW}⚠️  Unknown shell: $SHELL_NAME${NC}"
        echo -e "   Defaulting to ~/.zshrc"
        SHELL_RC="$HOME/.zshrc"
        ;;
esac

echo -e "${BLUE}📝 Configuring direnv hook for $SHELL_NAME...${NC}"

# Step 3: Add direnv hook to shell config
HOOK_LINE="eval \"\$(direnv hook $SHELL_NAME)\""

if grep -q "direnv hook" "$SHELL_RC" 2>/dev/null; then
    echo -e "${GREEN}✅ direnv hook already configured in $SHELL_RC${NC}"
else
    echo "" >> "$SHELL_RC"
    echo "# direnv - auto-load environment variables" >> "$SHELL_RC"
    echo "$HOOK_LINE" >> "$SHELL_RC"
    echo -e "${GREEN}✅ Added direnv hook to $SHELL_RC${NC}"
fi

echo ""

# Step 4: Check if .envrc exists
if [[ -f "$PROJECT_ROOT/.envrc" ]]; then
    echo -e "${GREEN}✅ .envrc file exists${NC}"
else
    echo -e "${YELLOW}⚠️  .envrc file not found${NC}"
    echo -e "   Creating .envrc..."
    
    cat > "$PROJECT_ROOT/.envrc" <<'EOF'
# ===========================================
# direnv configuration
# ===========================================
# Auto-loads environment variables when you cd into this directory
# Install: brew install direnv
# Setup: echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc

# -------------------------------------------
# Main Environment File (Source of Truth)
# -------------------------------------------
dotenv_if_exists .env

# -------------------------------------------
# Maestro Test Configuration (Optional)
# -------------------------------------------
# Only loaded when running Maestro E2E tests
dotenv_if_exists .env.maestro
EOF
    
    echo -e "${GREEN}✅ Created .envrc${NC}"
fi

echo ""

# Step 5: Allow direnv for this project
echo -e "${BLUE}🔓 Allowing direnv for this project...${NC}"
cd "$PROJECT_ROOT"

# Source the direnv hook for current session
eval "$HOOK_LINE"

# Allow the directory
direnv allow .

echo -e "${GREEN}✅ direnv allowed for this project${NC}"

echo ""

# Step 6: Verify setup
echo -e "${BLUE}✅ Verifying setup...${NC}"

# Check if direnv loads the environment
if eval "$(direnv export bash)" 2>/dev/null && [[ -n "$HELICONE_API_KEY" ]]; then
    echo -e "${GREEN}✅ Environment variables loaded successfully${NC}"
    echo -e "   HELICONE_API_KEY: ${HELICONE_API_KEY:0:20}..."
else
    echo -e "${YELLOW}⚠️  Environment variables not loaded yet${NC}"
    echo -e "   This is normal if .env doesn't exist or doesn't have HELICONE_API_KEY"
fi

echo ""
echo -e "${GREEN}🎉 direnv setup complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo -e "   1. Restart your terminal OR run: source $SHELL_RC"
echo -e "   2. cd out and back into this directory to test"
echo -e "   3. Run 'task check-prereqs' to verify"
echo ""
echo -e "${BLUE}💡 How it works:${NC}"
echo -e "   When you 'cd' into this project, direnv automatically loads:"
echo -e "   - .env (your environment variables)"
echo -e "   - .env.maestro (test configuration)"
echo ""
echo -e "   OpenCode will then have access to HELICONE_API_KEY for MCP!"
echo ""
