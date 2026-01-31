#!/bin/bash

# iOS Development Prerequisites Check Script
# Verifies all required tools for iOS development with this React Native/Expo project

# set -e  # Disabled to prevent exit on command failures in checks

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Source helpers for consistent logging
source "$SCRIPT_DIR/../setup/helpers.sh"

# Parse flags
QUICK_MODE=false
PLATFORM_FILTER=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --quick)
      QUICK_MODE=true
      shift
      ;;
    --platform=*)
      PLATFORM_FILTER="${1#*=}"
      shift
      ;;
    *)
      shift
      ;;
  esac
done

log_info "🔍 Checking prerequisites..."
if [[ "$PLATFORM_FILTER" != "" ]]; then
  log_info "Filter: $PLATFORM_FILTER only"
fi
if [[ "$QUICK_MODE" == "true" ]]; then
  log_info "Mode: Quick check (critical tools only)"
fi
echo ""

PASSED=0
FAILED=0
CRITICAL_FAILED=0

# Helper function to check command existence
check_command() {
    local cmd=$1
    local name=$2
    local fix_msg=$3
    local is_critical=${4:-false}
    
    if command -v "$cmd" &> /dev/null; then
        log_success "$name: $(eval "$cmd --version" 2>/dev/null | head -1)"
        ((PASSED++))
    else
        log_error "$name: Not installed"
        if [[ -n "$fix_msg" ]]; then
            echo "         Fix: $fix_msg"
        fi
        ((FAILED++))
        if [[ "$is_critical" == "true" ]]; then
            ((CRITICAL_FAILED++))
        fi
    fi
}

# Helper function to check version
check_version() {
    local cmd=$1
    local name=$2
    local expected_major=$3
    local fix_msg=$4
    local is_critical=${5:-false}
    
    if command -v "$cmd" &> /dev/null; then
        local version_output
        version_output=$(eval "$cmd --version" 2>/dev/null | head -1)
        local version
        version=$(echo "$version_output" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        local major_version
        major_version=$(echo "$version" | cut -d'.' -f1)

        if [ "$major_version" -eq "$expected_major" ]; then
            log_success "$name: $version_output"
            ((PASSED++))
        else
            log_warning "$name: $version_output (Expected major version $expected_major)"
            ((PASSED++))  # Still count as passed, just warn
        fi
    else
        log_error "$name: Not installed"
        if [[ -n "$fix_msg" ]]; then
            echo "         Fix: $fix_msg"
        fi
        ((FAILED++))
        if [[ "$is_critical" == "true" ]]; then
            ((CRITICAL_FAILED++))
        fi
    fi
}

# ==================== Foundation Checks ====================
if [[ "$PLATFORM_FILTER" == "" || "$PLATFORM_FILTER" == "foundation" ]]; then
    log_info "Foundation Tools:"
    
    check_version "node" "Node.js" 20 "Install from https://nodejs.org or use nvm/asdf" true
    check_command "pnpm" "pnpm" "Enable Corepack: corepack enable" true
    check_command "task" "Task" "Install from https://taskfile.dev" true
    
    if [[ "$QUICK_MODE" == "false" ]]; then
        check_command "watchman" "Watchman" "Run: task setup:base"
        
        # Check Expo CLI
        if command -v "expo" &> /dev/null; then
            log_success "Expo CLI: $(expo --version)"
            ((PASSED++))
        else
            log_error "Expo CLI: Not installed"
            echo "         Fix: Run: task setup:base OR pnpm add -g @expo/cli"
            ((FAILED++))
        fi
        
        # Check Corepack (for pnpm management)
        if command -v "corepack" &> /dev/null; then
            log_success "Corepack: Available (manages pnpm version)"
            ((PASSED++))
        else
            log_warning "Corepack: Not available (comes with Node.js 16.9+)"
        fi
        
        # Check direnv
        if command -v "direnv" &> /dev/null; then
            log_success "direnv: $(direnv --version)"
            ((PASSED++))
            
            # Check if direnv hook is in shell config
            if grep -q "direnv hook" ~/.zshrc 2>/dev/null || grep -q "direnv hook" ~/.bashrc 2>/dev/null; then
                log_success "   direnv hook: configured"
            else
                log_warning "   direnv hook: not configured"
                echo "         Fix: Run: task setup:base"
            fi
            
            # Check if project .envrc is allowed
            if [[ -f "$PROJECT_ROOT/.envrc" ]]; then
                if direnv status 2>/dev/null | grep -q "Found RC allowed true"; then
                    log_success "   .envrc: allowed"
                else
                    log_warning "   .envrc: not allowed"
                    echo "         Fix: Run: direnv allow ."
                fi
            fi
        else
            log_error "direnv: Not installed"
            echo "         Fix: Run: task setup:base"
            ((FAILED++))
        fi
        
        check_command "brew" "Homebrew" "Install from https://brew.sh"
    fi
    
    echo ""
fi

# ==================== iOS Checks ====================
if [[ "$PLATFORM_FILTER" == "" || "$PLATFORM_FILTER" == "ios" ]]; then
    if [[ "$QUICK_MODE" == "false" ]]; then
        log_info "iOS Development Tools:"
        
        # Check Xcode Command Line Tools
        if xcode-select -p &> /dev/null; then
            log_success "Xcode Command Line Tools: $(xcode-select -p)"
            ((PASSED++))
        else
            log_error "Xcode Command Line Tools: Not installed"
            echo "         Fix: Run: task ios:setup"
            ((FAILED++))
        fi
        
        # Check Xcode
        if command -v "xcodebuild" &> /dev/null; then
            xcode_version=$(xcodebuild -version | head -1)
            log_success "Xcode: $xcode_version"
            ((PASSED++))
        else
            log_error "Xcode: Not installed"
            echo "         Fix: Install from Mac App Store"
            ((FAILED++))
        fi
        
        check_command "ruby" "Ruby" "System Ruby should be available on macOS"
        check_command "gem" "RubyGems" "System RubyGems should be available on macOS"
        
        # Check iOS Simulator
        if command -v "xcrun" &> /dev/null && xcrun simctl list devices &> /dev/null; then
            log_success "iOS Simulator: Available"
            ((PASSED++))
        else
            log_error "iOS Simulator: Not available"
            echo "         Fix: Open Xcode → Settings → Platforms"
            ((FAILED++))
        fi
        
        echo ""
        log_info "iOS Build Tools:"
        
        # Check ccache
        if command -v "ccache" &> /dev/null; then
            log_success "ccache: $(ccache --version | head -1)"
            ((PASSED++))
        else
            log_warning "ccache: Not installed (recommended for faster builds)"
            echo "         Fix: Run: task ios:setup"
        fi
        
        # Check ccache in PATH
        if echo "$PATH" | grep -q "ccache/libexec"; then
            log_success "ccache PATH: Configured"
            ((PASSED++))
        else
            log_warning "ccache PATH: Not configured"
            echo "         Fix: Run: task ios:setup and restart shell"
        fi
        
        # Check CocoaPods
        if command -v "pod" &> /dev/null; then
            log_success "CocoaPods: $(pod --version)"
            ((PASSED++))
        else
            log_error "CocoaPods: Not available"
            echo "         Fix: Run: task ios:setup"
            ((FAILED++))
        fi
        
        # Check bigdecimal gem
        if gem list bigdecimal -i >/dev/null 2>&1; then
            log_success "bigdecimal gem: Installed"
            ((PASSED++))
        else
            log_warning "bigdecimal gem: Not installed (may cause issues with Ruby 4.0+)"
            echo "         Fix: gem install bigdecimal"
        fi
        
        echo ""
    fi
fi

# ==================== Environment Checks ====================
if [[ "$PLATFORM_FILTER" == "" || "$PLATFORM_FILTER" == "e2e" ]]; then
    if [[ "$QUICK_MODE" == "false" ]]; then
        log_info "Local Environment:"
        
        # Verify patches are applied
        if grep -q "@unknown default" "$PROJECT_ROOT/node_modules/expo-localization/ios/LocalizationModule.swift" 2>/dev/null; then
            log_success "expo-localization patch: applied"
            ((PASSED++))
        else
            log_error "expo-localization patch: NOT applied"
            echo "         Fix: Run: pnpm install"
            ((FAILED++))
        fi
        
        # Check ios/.xcode.env.local if ios/ exists
        if [[ -d "$PROJECT_ROOT/ios" ]]; then
            if [[ -f "$PROJECT_ROOT/ios/.xcode.env.local" ]]; then
                log_success "ios/.xcode.env.local: exists"
                ((PASSED++))
            else
                log_warning "ios/.xcode.env.local: not found"
                echo "         Fix: Run: task setup:base"
            fi
        fi
        
        echo ""
    fi
fi

# ==================== EAS Authentication Checks ====================
if [[ "$PLATFORM_FILTER" == "" || "$PLATFORM_FILTER" == "foundation" ]]; then
    if [[ "$QUICK_MODE" == "false" ]]; then
        log_info "EAS Authentication:"
        
        # Check EAS CLI is available
        if command -v "eas" &> /dev/null; then
            log_success "EAS CLI: $(eas --version 2>/dev/null | head -1)"
            ((PASSED++))
            
            # Check if logged in
            if eas whoami &>/dev/null; then
                logged_in_user=$(eas whoami 2>/dev/null | head -1)
                log_success "EAS Login: $logged_in_user"
                ((PASSED++))
                
                # Check project access
                if eas project:info &>/dev/null; then
                    log_success "EAS Project Access: Verified"
                    ((PASSED++))
                else
                    log_warning "EAS Project Access: No access to this project"
                    echo "         Fix: Request access from project admin"
                fi
            else
                log_warning "EAS Login: Not logged in"
                echo "         Fix: Run: eas login (one-time, session persists)"
            fi
        else
            log_error "EAS CLI: Not installed"
            echo "         Fix: Run: task setup:base"
            ((FAILED++))
        fi
        
        echo ""
    fi
fi

echo ""
log_info "📊 Summary:"
echo "   ✅ Passed: $PASSED"
echo "   ❌ Failed: $FAILED"
if [[ $CRITICAL_FAILED -gt 0 ]]; then
    echo "   🔴 Critical failures: $CRITICAL_FAILED"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    log_success "🎉 All prerequisites satisfied! Ready for development."
    echo ""
    log_info "Next steps:"
    echo "   • Install dependencies: pnpm install"
    echo "   • Run iOS: task ios:run"
    echo "   • Run Android: task android:run"
    echo ""
    exit 0
elif [ $CRITICAL_FAILED -gt 0 ]; then
    log_error "⚠️  Critical prerequisites are missing. Cannot proceed."
    echo ""
    log_info "Quick fixes:"
    echo "   • Foundation setup: task setup:base"
    echo "   • iOS setup: task ios:setup"
    echo "   • Android setup: task android:setup"
    echo ""
    exit 2
else
    log_warning "⚠️  Some prerequisites are missing (non-critical)."
    echo ""
    log_info "Quick fixes:"
    echo "   • Foundation setup: task setup:base"
    echo "   • iOS setup: task ios:setup"
    echo "   • Android setup: task android:setup"
    echo ""
    log_info "For detailed verification: task setup:verify"
    echo ""
    exit 1
fi