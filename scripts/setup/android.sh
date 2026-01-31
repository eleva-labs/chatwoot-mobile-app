#!/usr/bin/env bash
# Android setup script - Cross-platform
set -e  # Exit on error

# Source helpers
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/helpers.sh"

# Install/verify Android Studio and SDK
install-android-studio() {
  log_step 1 4 "Checking Android SDK"
  
  local platform=$(detect_platform)
  
  # Check if Android SDK is already installed
  if [[ -n "$ANDROID_HOME" ]] && [[ -d "$ANDROID_HOME" ]]; then
    log_success "Android SDK found: $ANDROID_HOME"
    return 0
  fi
  
  # SDK not found - attempt to install
  log_info "Android SDK not found - attempting auto-installation..."
  
  if [[ "$platform" == "macos" ]]; then
    # Install Android command-line tools via Homebrew
    if ! command_exists brew; then
      log_error "Homebrew required for auto-installation"
      log_info "Install Homebrew: https://brew.sh"
      log_info "Or follow manual installation instructions below"
    else
      log_info "Installing Android command-line tools via Homebrew..."
      if brew install --cask android-commandlinetools; then
        log_success "Android command-line tools installed"
        log_warning "Please run 'direnv allow .' to activate ANDROID_HOME"
        log_info "Then re-run: task android:setup"
        return 0
      else
        log_warning "Auto-installation failed - showing manual instructions"
      fi
    fi
  fi
  
  # Show manual installation instructions (for all platforms or if auto-install failed)
  log_info ""
  log_info "Manual Installation Instructions:"
  log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log_info "Option 1: Android Studio (Recommended - Full IDE)"
  log_info "  1. Download from: https://developer.android.com/studio"
  log_info "  2. Install Android Studio"
  log_info "  3. Open → More Actions → SDK Manager"
  log_info "  4. Install SDK components:"
  log_info "     • Android 13.0 (API 33) - recommended"
  log_info "     • Android SDK Build-Tools (latest)"
  log_info "     • Android SDK Platform-Tools"
  log_info "     • Android Emulator"
  log_info ""
  log_info "Option 2: Command-line tools only (Lightweight)"
  log_info "  1. Download: https://developer.android.com/studio#command-line-tools-only"
  
  local sdk_path=""
  if [[ "$platform" == "macos" ]]; then
    sdk_path="\$HOME/Library/Android/sdk"
  else
    sdk_path="\$HOME/Android/Sdk"
  fi
  
  log_info "  2. Extract to: $sdk_path/cmdline-tools/latest"
  log_info "  3. Run: direnv allow ."
  log_info "  4. Install SDK: sdkmanager \"platform-tools\" \"platforms;android-33\""
  log_info ""
  log_info "Expected SDK location: $sdk_path"
  log_info ""
  log_info "After installation:"
  log_info "  • Run: direnv allow .  (to activate ANDROID_HOME)"
  log_info "  • Run: task android:setup  (to continue setup)"
  log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log_info ""
  exit 1
}

# Setup Android SDK
setup-android-sdk() {
  log_step 2 3 "Setting up Android SDK"
  
  # Check ANDROID_HOME is set
  if [[ -z "$ANDROID_HOME" ]] || [[ ! -d "$ANDROID_HOME" ]]; then
    log_error "ANDROID_HOME not set or directory doesn't exist"
    log_info "Run 'task _setup-android-studio' first"
    exit 1
  fi
  
  log_success "ANDROID_HOME: $ANDROID_HOME"
  
  # Check if sdkmanager is available
  if ! command -v sdkmanager >/dev/null 2>&1; then
    log_error "sdkmanager not found in PATH"
    log_info "Add to your shell config:"
    log_info "  export PATH=\$PATH:\$ANDROID_HOME/tools/bin"
    exit 1
  fi
  
  # Accept licenses
  log_info "Accepting Android SDK licenses..."
  yes | sdkmanager --licenses >/dev/null 2>&1 || true
  log_success "Android SDK licenses accepted"
  
  # Install essential SDK components (2026 stable versions)
  log_info "Installing Android SDK platforms and tools (this may take 5-10 minutes)..."
  sdkmanager --install \
    "platform-tools" \
    "platforms;android-35" \
    "build-tools;35.0.1" \
    "emulator" \
    "system-images;android-35;google_apis;x86_64" \
    2>&1 | grep -v "^\[" || true  # Hide progress bars, show errors
  
  # Verify installation
  if sdkmanager --list_installed 2>/dev/null | grep -q "platforms;android-"; then
    log_success "Android SDK platforms installed (Android 15 / API 35)"
  else
    log_warning "No Android SDK platforms detected"
    log_info "Install manually: sdkmanager \"platforms;android-35\""
  fi
}

# Setup Android Emulator
setup-android-emulator() {
  log_step 3 3 "Setting up Android Emulator"
  
  # Check if emulator is installed
  if ! command -v emulator >/dev/null 2>&1; then
    log_error "Android Emulator not found in PATH"
    log_info "Add to your shell config:"
    log_info "  export PATH=\$PATH:\$ANDROID_HOME/emulator"
    exit 1
  fi
  
  log_success "Android Emulator found"
  
  # List available AVDs
  local avds=$(emulator -list-avds 2>/dev/null)
  
  if [[ -z "$avds" ]]; then
    log_warning "No Android Virtual Devices (AVDs) found"
    log_info ""
    log_info "Create an AVD:"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "Option 1: Android Studio (Recommended)"
    log_info "  1. Open Android Studio"
    log_info "  2. Tools → Device Manager"
    log_info "  3. Click 'Create Device'"
    log_info "  4. Select a device (e.g., Pixel 5)"
    log_info "  5. Select a system image (e.g., Android 13 / API 33)"
    log_info "  6. Finish setup"
    log_info ""
    log_info "Option 2: Command Line"
    log_info "  avdmanager create avd -n Pixel_5_API_33 \\"
    log_info "    -k \"system-images;android-33;google_apis;x86_64\" \\"
    log_info "    -d \"pixel_5\""
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info ""
  else
    log_success "Android Virtual Devices available:"
    echo "$avds" | while read -r avd; do
      echo "  • $avd"
    done
  fi
}

# Verify Android setup
verify-android-setup() {
  log_info "Verifying Android development setup..."
  echo ""
  
  local errors=0
  
  # Check ANDROID_HOME
  if [[ -n "$ANDROID_HOME" ]] && [[ -d "$ANDROID_HOME" ]]; then
    log_success "ANDROID_HOME: $ANDROID_HOME"
  else
    log_error "ANDROID_HOME NOT set or invalid"
    ((errors++))
  fi
  
  # Check adb
  if command_exists adb; then
    log_success "adb: $(adb --version | head -1)"
  else
    log_error "adb NOT found in PATH"
    ((errors++))
  fi
  
  # Check sdkmanager
  if command_exists sdkmanager; then
    log_success "sdkmanager: available"
  else
    log_error "sdkmanager NOT found in PATH"
    ((errors++))
  fi
  
  # Check emulator
  if command_exists emulator; then
    log_success "emulator: available"
    
    # Check for AVDs
    local avds=$(emulator -list-avds 2>/dev/null)
    if [[ -n "$avds" ]]; then
      log_success "AVDs found: $(echo "$avds" | wc -l | tr -d ' ')"
    else
      log_warning "No AVDs found (create one to run Android app)"
    fi
  else
    log_error "emulator NOT found in PATH"
    ((errors++))
  fi
  
  echo ""
  if [[ $errors -eq 0 ]]; then
    log_success "Android development setup is complete!"
    echo ""
    log_info "Next steps:"
    log_info "  1. Run 'task android:run' to build and run the app"
    log_info "  2. Run 'task setup:verify' for comprehensive verification"
    exit 0
  else
    log_error "$errors issue(s) found"
    log_info "Run 'task android:setup' to fix issues"
    exit 1
  fi
}

# Main function dispatcher
main() {
  local cmd=$1
  
  case $cmd in
    install-android-studio) install-android-studio ;;
    setup-android-sdk) setup-android-sdk ;;
    setup-android-emulator) setup-android-emulator ;;
    verify-android-setup) verify-android-setup ;;
    *)
      log_error "Unknown command: $cmd"
      echo ""
      echo "Usage: $0 {install-android-studio|setup-android-sdk|setup-android-emulator|verify-android-setup}"
      exit 1
      ;;
  esac
}

# Execute main with all arguments
main "$@"
