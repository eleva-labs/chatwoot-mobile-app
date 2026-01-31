#!/usr/bin/env bash
# Comprehensive setup verification script
# Verifies all tools, platforms, and environment configuration
# Note: set -e is NOT used here because we want to collect all failures, not exit on first failure

# Source helpers
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/helpers.sh"

# Detect platform
PLATFORM=$(detect_platform)

# Initialize counters
PASSED=0
FAILED=0

# Initialize fixes array
declare -a FIXES

# Check function - centralized verification logic
# Usage: check "name" "check_command" "fix_message"
check() {
  local name=$1
  local check_cmd=$2
  local fix_msg=$3
  
  # Run check command (suppress output)
  if eval "$check_cmd" >/dev/null 2>&1; then
    log_success "$name"
    ((PASSED++))
  else
    log_error "$name"
    FIXES+=("$fix_msg")
    ((FAILED++))
  fi
}

# Header
echo ""
log_info "=========================================="
log_info "  Chatwoot Mobile App - Setup Verification"
log_info "=========================================="
echo ""
log_info "Platform: $PLATFORM"
echo ""

# ==================== Foundation Checks ====================
log_info "Foundation Tools:"
log_info "----------------------------------------"

check "Node.js" \
  "command_exists node" \
  "Node.js not found. Run: task setup:base"

check "pnpm" \
  "command_exists pnpm" \
  "pnpm not found. Run: task setup:base"

check "Task" \
  "command_exists task" \
  "Task not found. Run: task setup:base"

check "Watchman" \
  "command_exists watchman" \
  "Watchman not found. Run: task setup:base"

check "Expo CLI" \
  "command_exists expo" \
  "Expo CLI not found. Run: task setup:base"

check "EAS CLI" \
  "command_exists eas" \
  "EAS CLI not found. Install with: npm install --global eas-cli"

check "direnv" \
  "command_exists direnv" \
  "direnv not found. Run: task setup:base"

# Check direnv hook in shell config
check "direnv hook configured" \
  "grep -q 'direnv hook' ~/.zshrc 2>/dev/null || grep -q 'direnv hook' ~/.bashrc 2>/dev/null" \
  "direnv hook not configured in shell. Run: task setup:base"

echo ""

# ==================== iOS Development Checks (macOS only) ====================
if [[ "$PLATFORM" == "macos" ]]; then
  log_info "iOS Development Tools:"
  log_info "----------------------------------------"
  
  check "Xcode Command Line Tools" \
    "xcode-select -p" \
    "Xcode CLI Tools not found. Run: task ios:setup"
  
  check "Xcode" \
    "command_exists xcodebuild" \
    "Xcode not installed. Install from Mac App Store"
  
  check "iOS Simulator" \
    "xcrun simctl list devices | grep -q 'iPhone'" \
    "iOS Simulator not available. Open Xcode → Settings → Platforms"
  
  check "ccache" \
    "command_exists ccache" \
    "ccache not found. Run: task ios:setup"
  
  check "CocoaPods" \
    "command_exists pod" \
    "CocoaPods not found. Run: task ios:setup"
  
  # Check ccache in PATH
  check "ccache in PATH" \
    "which ccache | grep -q 'ccache'" \
    "ccache not in PATH. Run: task ios:setup and restart your shell"
  
  echo ""
fi

# ==================== Android Development Checks ====================
log_info "Android Development Tools:"
log_info "----------------------------------------"

# Check Android SDK
if [[ -n "$ANDROID_HOME" && -d "$ANDROID_HOME" ]]; then
  log_success "Android SDK (ANDROID_HOME=$ANDROID_HOME)"
  ((PASSED++))
else
  log_error "Android SDK (ANDROID_HOME not set or invalid)"
  FIXES+=("Android SDK not configured. Run: task android:setup")
  ((FAILED++))
fi

check "adb in PATH" \
  "command_exists adb" \
  "adb not found in PATH. Run: task android:setup"

echo ""

# ==================== E2E Testing Checks ====================
log_info "E2E Testing Tools:"
log_info "----------------------------------------"

check "Maestro" \
  "command_exists maestro" \
  "Maestro not found. Run: task setup:e2e"

check ".env.maestro exists" \
  "[ -f .env.maestro ]" \
  ".env.maestro not found. Copy from .env.maestro.example and configure credentials"

echo ""

# ==================== Environment Checks ====================
log_info "Environment Configuration:"
log_info "----------------------------------------"

# Check EAS authentication
check "EAS authentication" \
  "$SCRIPT_DIR/../utils/check-eas-auth.sh --quiet" \
  "Not logged in to EAS. Run: eas login"

# Check EAS project access
check "EAS project access" \
  "$SCRIPT_DIR/../utils/check-eas-auth.sh --project --quiet" \
  "No access to this project. Request access from project admin"

check ".env exists" \
  "[ -f .env ]" \
  ".env not found. Run: pnpm run env:pull:dev"

# Check expo-localization patch
check "expo-localization patch applied" \
  "grep -q '@unknown default' node_modules/expo-localization/ios/LocalizationModule.swift" \
  "expo-localization patch not applied. Run: pnpm install"

# Check .envrc exists
check ".envrc exists" \
  "[ -f .envrc ]" \
  ".envrc not found. Run: task setup:base"

# Check .envrc is allowed
if [[ -f .envrc ]]; then
  if direnv status 2>/dev/null | grep -q "Found RC allowed true"; then
    log_success ".envrc allowed"
    ((PASSED++))
  else
    log_error ".envrc not allowed"
    FIXES+=(".envrc not allowed. Run: direnv allow .")
    ((FAILED++))
  fi
fi

echo ""

# ==================== Summary Report ====================
log_info "=========================================="
log_info "  Summary"
log_info "=========================================="
echo ""
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

# ==================== Fix Suggestions ====================
if [[ $FAILED -gt 0 ]]; then
  log_warning "Fix Suggestions:"
  log_info "----------------------------------------"
  for fix in "${FIXES[@]}"; do
    echo -e "  ${YELLOW}•${NC} $fix"
  done
  echo ""
fi

# ==================== Next Steps ====================
echo ""
log_info "=========================================="
log_info "  Next Steps"
log_info "=========================================="
echo ""

if [[ $FAILED -eq 0 ]]; then
  # All checks passed
  log_success "All setup verification checks passed!"
  echo ""
  log_info "You're ready to develop! Try these commands:"
  echo ""
  log_info "  Development:"
  log_info "    pnpm install              # Install dependencies"
  log_info "    task ios:run              # Run iOS app"
  log_info "    task android:run          # Run Android app"
  echo ""
  log_info "  Testing:"
  log_info "    task test                 # Run unit tests"
  log_info "    task e2e:ios              # Run E2E tests (iOS)"
  log_info "    task e2e:android          # Run E2E tests (Android)"
  echo ""
  exit 0
else
  # Some checks failed
  log_error "Some verification checks failed ($FAILED issues)"
  echo ""
  log_info "Quick fix commands:"
  echo ""
  log_info "  Foundation setup:     task setup:base"
  if [[ "$PLATFORM" == "macos" ]]; then
    log_info "  iOS setup:            task ios:setup"
  fi
  log_info "  Android setup:        task android:setup"
  log_info "  E2E setup:            task setup:e2e"
  echo ""
  log_info "After fixing, run: task setup:verify"
  echo ""
  exit 1
fi
