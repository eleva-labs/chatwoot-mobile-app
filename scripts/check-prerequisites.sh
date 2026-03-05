#!/bin/bash

# iOS Development Prerequisites Check Script
# Verifies all required tools for iOS development with this React Native/Expo project

# set -e  # Disabled to prevent exit on command failures in checks

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Checking iOS development prerequisites...${NC}"
echo ""

PASSED=0
FAILED=0

# Helper function to check command existence
check_command() {
    local cmd=$1
    local name=$2
    if command -v "$cmd" &> /dev/null; then
        echo -e "${GREEN}✅ $name: $(eval "$cmd --version" 2>/dev/null | head -1)${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ $name: Not installed${NC}"
        ((FAILED++))
    fi
}

# Helper function to check version
check_version() {
    local cmd=$1
    local name=$2
    local expected_major=$3
    if command -v "$cmd" &> /dev/null; then
        local version_output
        version_output=$(eval "$cmd --version" 2>/dev/null | head -1)
        local version
        version=$(echo "$version_output" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        local major_version
        major_version=$(echo "$version" | cut -d'.' -f1)

        if [ "$major_version" -eq "$expected_major" ]; then
            echo -e "${GREEN}✅ $name: $version_output${NC}"
            ((PASSED++))
        else
            echo -e "${YELLOW}⚠️  $name: $version_output (Expected major version $expected_major)${NC}"
            ((PASSED++))  # Still count as passed, just warn
        fi
    else
        echo -e "${RED}❌ $name: Not installed${NC}"
        ((FAILED++))
    fi
}

# Check Node.js version
check_version "node" "Node.js" 20

# Check pnpm
check_command "pnpm" "pnpm"

# Check Task
check_command "task" "Task"

# Check Watchman
check_command "watchman" "Watchman"

# Check Expo CLI (can be installed via Volta or npm)
if command -v "expo" &> /dev/null; then
    echo -e "${GREEN}✅ Expo CLI: $(expo --version)${NC}"
    ((PASSED++))
elif [ -f "$HOME/.volta/bin/expo-internal" ]; then
    echo -e "${GREEN}✅ Expo CLI: $(~/.volta/bin/expo-internal --version) (via Volta)${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Expo CLI: Not installed${NC}"
    ((FAILED++))
fi

# Check Volta (optional but recommended)
if command -v "volta" &> /dev/null; then
    echo -e "${GREEN}✅ Volta: $(volta --version)${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  Volta: Not installed (recommended for Node version management)${NC}"
fi

# Check Homebrew
check_command "brew" "Homebrew"

# Check Xcode Command Line Tools
if xcode-select -p &> /dev/null; then
    echo -e "${GREEN}✅ Xcode Command Line Tools: $(xcode-select -p)${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Xcode Command Line Tools: Not installed${NC}"
    ((FAILED++))
fi

# Check Xcode
if command -v "xcodebuild" &> /dev/null; then
    xcode_version=$(xcodebuild -version | head -1)
    echo -e "${GREEN}✅ Xcode: $xcode_version${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Xcode: Not installed${NC}"
    ((FAILED++))
fi

# Check Ruby
check_command "ruby" "Ruby"

# Check RubyGems
check_command "gem" "RubyGems"

# Check iOS Simulator
if command -v "xcrun" &> /dev/null && xcrun simctl list devices &> /dev/null; then
    echo -e "${GREEN}✅ iOS Simulator: Available${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ iOS Simulator: Not available${NC}"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}iOS Build Tools:${NC}"

# Check ccache
if command -v "ccache" &> /dev/null; then
    echo -e "${GREEN}✅ ccache: $(ccache --version | head -1)${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  ccache: Not installed (recommended for faster builds)${NC}"
fi

# Check ccache in PATH
if echo "$PATH" | grep -q "ccache/libexec"; then
    echo -e "${GREEN}✅ ccache PATH: Configured${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  ccache PATH: Not configured (run: ./scripts/setup-ios-build-tools.sh)${NC}"
fi

# Check CocoaPods is linked and available
if command -v "pod" &> /dev/null; then
    echo -e "${GREEN}✅ CocoaPods: $(pod --version)${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ CocoaPods: Not available${NC}"
    ((FAILED++))
fi

# Check bigdecimal gem
if gem list bigdecimal -i >/dev/null 2>&1; then
    echo -e "${GREEN}✅ bigdecimal gem: Installed${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  bigdecimal gem: Not installed (may cause issues with Ruby 4.0+)${NC}"
fi

echo ""
echo -e "${BLUE}Local Environment:${NC}"

# Check .env.local exists
if [[ -f "$PROJECT_ROOT/.env.local" ]]; then
    echo -e "${GREEN}✅ .env.local: exists${NC}"
    ((PASSED++))

    # Check SENTRY_DISABLE_AUTO_UPLOAD is set
    if grep -q "^SENTRY_DISABLE_AUTO_UPLOAD=true" "$PROJECT_ROOT/.env.local"; then
        echo -e "${GREEN}   ✅ SENTRY_DISABLE_AUTO_UPLOAD: set${NC}"
    else
        echo -e "${YELLOW}   ⚠️  SENTRY_DISABLE_AUTO_UPLOAD: not set (run 'task setup-local-env')${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env.local: not found (run 'task setup-local-env')${NC}"
fi

# Verify patches are applied
if grep -q "@unknown default" "$PROJECT_ROOT/node_modules/expo-localization/ios/LocalizationModule.swift" 2>/dev/null; then
    echo -e "${GREEN}✅ expo-localization patch: applied${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ expo-localization patch: NOT applied (run 'pnpm install')${NC}"
    ((FAILED++))
fi

# Check ios/.xcode.env.local if ios/ exists
if [[ -d "$PROJECT_ROOT/ios" ]]; then
    if [[ -f "$PROJECT_ROOT/ios/.xcode.env.local" ]]; then
        echo -e "${GREEN}✅ ios/.xcode.env.local: exists${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  ios/.xcode.env.local: not found (run 'task setup-local-env')${NC}"
    fi
fi

echo ""
echo -e "${BLUE}📊 Summary:${NC}"
echo -e "   ✅ Passed: $PASSED"
echo -e "   ❌ Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All prerequisites satisfied! Ready for iOS development.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some prerequisites are missing. Please install them before proceeding.${NC}"
    echo ""
    echo -e "${YELLOW}📖 Installation guides:${NC}"
    echo -e "   - Watchman: brew install watchman"
    echo -e "   - Volta: curl https://get.volta.sh | bash"
    echo -e "   - Xcode: Install from Mac App Store"
    echo -e "   - Full guide: docs/SETUP_IOS.md"
    echo ""
    exit 1
fi