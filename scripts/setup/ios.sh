#!/usr/bin/env bash
# iOS setup script - macOS only
set -e  # Exit on error

# Source helpers
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/helpers.sh"

# Check platform is macOS
check-platform() {
  local platform=$(detect_platform)
  if [[ "$platform" != "macos" ]]; then
    log_error "iOS development requires macOS"
    log_info "You're running on: $OSTYPE"
    log_info "For Android development, use: task android:setup"
    exit 1
  fi
}

# Install Xcode Command Line Tools
install-xcode-cli-tools() {
  check-platform
  
  log_step 1 4 "Installing Xcode Command Line Tools"
  
  # Check if Xcode CLI tools are installed
  if xcode-select -p >/dev/null 2>&1; then
    log_success "Xcode Command Line Tools already installed: $(xcode-select -p)"
  else
    log_info "Installing Xcode Command Line Tools..."
    log_warning "A dialog will appear - please follow the installation prompts"
    xcode-select --install
    
    log_info "Waiting for Xcode CLI tools installation to complete..."
    log_warning "Please complete the installation dialog, then press ENTER to continue"
    read -p ""
    
    # Verify installation
    if xcode-select -p >/dev/null 2>&1; then
      log_success "Xcode Command Line Tools installed"
    else
      log_error "Xcode Command Line Tools installation failed or was cancelled"
      exit 1
    fi
  fi
}

# Install CocoaPods
install-cocoapods() {
  check-platform
  
  log_step 2 4 "Installing CocoaPods"
  
  # Check if CocoaPods is available
  if command_exists pod; then
    log_success "CocoaPods already installed: $(pod --version)"
  else
    log_info "Installing CocoaPods via Homebrew..."
    
    # Install via Homebrew
    if command_exists brew; then
      brew install cocoapods
      check_error "Failed to install CocoaPods"
      log_success "CocoaPods installed"
    else
      log_error "Homebrew is required to install CocoaPods"
      log_info "Install Homebrew from https://brew.sh"
      exit 1
    fi
  fi
  
  # Verify CocoaPods can run
  pod --version >/dev/null 2>&1
  check_error "CocoaPods installation verification failed"
}

# Install ccache for build optimization
install-ccache() {
  check-platform
  
  log_step 3 4 "Installing ccache for build optimization"
  
  # Check if ccache is installed
  if command_exists ccache; then
    log_success "ccache already installed: $(ccache --version | head -1)"
  else
    log_info "Installing ccache via Homebrew..."
    
    if command_exists brew; then
      brew install ccache
      check_error "Failed to install ccache"
      log_success "ccache installed"
    else
      log_error "Homebrew is required to install ccache"
      exit 1
    fi
  fi
  
  # Detect ccache path (Apple Silicon vs Intel)
  local ccache_path="/opt/homebrew/opt/ccache/libexec"
  if [[ ! -d "$ccache_path" ]]; then
    ccache_path="/usr/local/opt/ccache/libexec"  # Intel Mac
  fi
  
  # Configure ccache PATH in shell config
  local shell_name=$(basename "$SHELL")
  local shell_rc=""
  
  case $shell_name in
    zsh) shell_rc="$HOME/.zshrc" ;;
    bash) shell_rc="$HOME/.bashrc" ;;
    *)
      log_warning "Unknown shell: $shell_name. Please add ccache to PATH manually:"
      log_info "  export PATH=\"$ccache_path:\$PATH\""
      return 0
      ;;
  esac
  
  # Add ccache to PATH if not present
  if ! grep -q "ccache for iOS builds" "$shell_rc" 2>/dev/null; then
    echo "" >> "$shell_rc"
    echo "# ccache for iOS builds" >> "$shell_rc"
    echo "export PATH=\"$ccache_path:\$PATH\"" >> "$shell_rc"
    log_success "Added ccache to PATH in $shell_rc"
    log_warning "Please restart your shell or run: source $shell_rc"
  else
    log_success "ccache already configured in PATH"
  fi
  
  # Export for current session
  export PATH="$ccache_path:$PATH"
}

# Setup iOS Simulator
setup-ios-simulator() {
  check-platform
  
  log_step 4 4 "Verifying iOS Simulator"
  
  # Check if xcrun is available (part of Xcode CLI tools)
  if ! command_exists xcrun; then
    log_error "xcrun not found - Xcode Command Line Tools required"
    log_info "Run: task _setup-xcode-cli-tools"
    exit 1
  fi
  
  # Check if Xcode is installed (required for simulators)
  if ! command_exists xcodebuild; then
    log_error "Xcode is not installed"
    log_info "Install Xcode from Mac App Store: https://apps.apple.com/us/app/xcode/id497799835"
    exit 1
  fi
  
  local xcode_version=$(xcodebuild -version | head -1)
  log_success "Xcode installed: $xcode_version"
  
  # List available simulators
  local simulators=$(xcrun simctl list devices available 2>/dev/null | grep -i "iphone")
  
  if [[ -z "$simulators" ]]; then
    log_error "No iOS simulators found"
    log_info "Open Xcode → Settings → Platforms to install iOS simulators"
    exit 1
  fi
  
  log_success "iOS Simulators available"
  log_info "Available simulators:"
  echo "$simulators" | head -5
}

# Verify iOS setup
verify-ios-setup() {
  check-platform
  
  log_info "Verifying iOS development setup..."
  echo ""
  
  local errors=0
  
  # Check Xcode CLI tools
  if xcode-select -p >/dev/null 2>&1; then
    log_success "Xcode Command Line Tools"
  else
    log_error "Xcode Command Line Tools NOT found"
    ((errors++))
  fi
  
  # Check Xcode
  if command_exists xcodebuild; then
    log_success "Xcode: $(xcodebuild -version | head -1)"
  else
    log_error "Xcode NOT installed"
    ((errors++))
  fi
  
  # Check CocoaPods
  if command_exists pod; then
    log_success "CocoaPods: $(pod --version)"
  else
    log_error "CocoaPods NOT installed"
    ((errors++))
  fi
  
  # Check ccache
  if command_exists ccache; then
    log_success "ccache: $(ccache --version | head -1)"
  else
    log_error "ccache NOT installed"
    ((errors++))
  fi
  
  # Check ccache in PATH
  if echo "$PATH" | grep -q "ccache"; then
    log_success "ccache configured in PATH"
  else
    log_warning "ccache NOT in PATH (restart shell or run: task ios:setup)"
  fi
  
  # Check iOS Simulator
  if xcrun simctl list devices booted 2>/dev/null | grep -q "iPhone"; then
    log_success "iOS Simulator available and running"
  elif xcrun simctl list devices available 2>/dev/null | grep -q "iPhone"; then
    log_success "iOS Simulator available"
  else
    log_error "iOS Simulator NOT available"
    ((errors++))
  fi
  
  echo ""
  if [[ $errors -eq 0 ]]; then
    log_success "iOS development setup is complete!"
    echo ""
    log_info "Next steps:"
    log_info "  1. Run 'task ios:run' to build and run the app"
    log_info "  2. Run 'task setup:verify' for comprehensive verification"
    exit 0
  else
    log_error "$errors issue(s) found"
    log_info "Run 'task ios:setup' to fix issues"
    exit 1
  fi
}

# Main function dispatcher
main() {
  local cmd=$1
  
  case $cmd in
    install-xcode-cli-tools) install-xcode-cli-tools ;;
    install-cocoapods) install-cocoapods ;;
    install-ccache) install-ccache ;;
    setup-ios-simulator) setup-ios-simulator ;;
    verify-ios-setup) verify-ios-setup ;;
    *)
      log_error "Unknown command: $cmd"
      echo ""
      echo "Usage: $0 {install-xcode-cli-tools|install-cocoapods|install-ccache|setup-ios-simulator|verify-ios-setup}"
      exit 1
      ;;
  esac
}

# Execute main with all arguments
main "$@"
