#!/usr/bin/env bash
# E2E Testing Setup Script
# =========================
# Modular functions for E2E (Maestro) testing setup
# 
# Functions:
#   - install-java: Install Java 17+ (required for Maestro)
#   - install-maestro: Install Maestro CLI
#   - install-idb-companion: Install iOS Device Bridge (macOS only)
#   - verify-e2e-setup: Verify complete E2E setup

set -e

# Get script directory and source helpers
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/helpers.sh"

# ============================================================================
# Function: install-java
# Description: Install Java 17+ (required for Maestro)
# Platform: macOS, Linux
# ============================================================================
install-java() {
  log_step 1 4 "Checking Java installation"
  
  local platform=$(detect_platform)
  
  # Check if Java is installed and working
  local java_output=$(java -version 2>&1 || true)
  
  if [[ "$java_output" == *"Unable to locate a Java Runtime"* ]] || [[ -z "$java_output" ]]; then
    log_info "Java not found or not working"
    
    if [[ "$platform" == "macos" ]]; then
      if ! command_exists brew; then
        log_error "Homebrew required to install Java. Please install Homebrew first."
        exit 1
      fi
      
      log_info "Installing Java 17 via Homebrew..."
      brew install openjdk@17
      check_error "Failed to install Java 17"
      
      # Link it so system can find it
      log_info "Linking Java 17 to system..."
      sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
      
      # Verify installation
      if java -version &> /dev/null; then
        log_success "Java 17 installed successfully"
      else
        log_warn "Java installed but 'java' command still failing"
        log_info 'Try adding to PATH: export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"'
        log_info "You may need to restart your terminal"
      fi
    elif [[ "$platform" == "linux" ]]; then
      log_error "Please install Java 17+ manually for Linux"
      log_info "Debian/Ubuntu: sudo apt-get install openjdk-17-jdk"
      log_info "Fedora/RHEL: sudo dnf install java-17-openjdk"
      exit 1
    else
      log_error "Unsupported platform: $platform"
      exit 1
    fi
  else
    # Extract version string
    local version_string=$(echo "$java_output" | head -1 | sed -n 's/.*version "\([^"]*\)".*/\1/p')
    
    if [ -z "$version_string" ]; then
      log_warn "Could not determine Java version. Output:"
      echo "$java_output"
      log_info "Proceeding with unknown Java version..."
    else
      log_success "Java found: $version_string"
      
      # Parse major version
      local major_version=0
      if [[ "$version_string" == 1.* ]]; then
        major_version=$(echo "$version_string" | cut -d'.' -f2)
      else
        major_version=$(echo "$version_string" | cut -d'.' -f1)
      fi
      
      # Check if Java version is 17+
      if [ "$major_version" -gt 0 ] && [ "$major_version" -lt 17 ]; then
        log_warn "Java version is less than 17 (found: $major_version). Some features may not work."
        log_info "Install Java 17+: brew install openjdk@17"
      fi
    fi
  fi
}

# ============================================================================
# Function: install-maestro
# Description: Install Maestro CLI for E2E testing
# Platform: macOS, Linux
# ============================================================================
install-maestro() {
  log_step 2 4 "Installing Maestro CLI"
  
  if command_exists maestro; then
    local maestro_version=$(maestro --version 2>&1 || echo "unknown")
    log_success "Maestro already installed (version: $maestro_version)"
    return 0
  fi
  
  log_info "Installing Maestro CLI..."
  curl -fsSL "https://get.maestro.mobile.dev" | bash
  check_error "Failed to install Maestro"
  
  # Add Maestro to PATH for current session
  export PATH="$HOME/.maestro/bin:$PATH"
  
  # Add to shell profile for persistent PATH
  local shell_profile=""
  if [[ "$SHELL" == *"zsh"* ]]; then
    shell_profile="$HOME/.zshrc"
  elif [[ "$SHELL" == *"bash"* ]]; then
    shell_profile="$HOME/.bash_profile"
  fi
  
  if [ -n "$shell_profile" ]; then
    if ! grep -q '.maestro/bin' "$shell_profile" 2>/dev/null; then
      echo "" >> "$shell_profile"
      echo "# Maestro CLI" >> "$shell_profile"
      echo 'export PATH="$HOME/.maestro/bin:$PATH"' >> "$shell_profile"
      log_info "Added Maestro to PATH in $shell_profile"
      log_info "Run 'source $shell_profile' or restart your terminal"
    fi
  fi
  
  log_success "Maestro installed successfully"
}

# ============================================================================
# Function: install-idb-companion
# Description: Install iOS Device Bridge (required for iOS E2E testing)
# Platform: macOS only
# ============================================================================
install-idb-companion() {
  log_step 3 4 "Installing idb-companion (iOS Device Bridge)"
  
  local platform=$(detect_platform)
  
  if [[ "$platform" != "macos" ]]; then
    log_info "Skipping idb-companion (macOS only)"
    return 0
  fi
  
  if command_exists idb_companion; then
    log_success "idb-companion already installed"
    return 0
  fi
  
  if ! command_exists brew; then
    log_warn "Homebrew not found. Skipping idb-companion installation."
    return 0
  fi
  
  log_info "Installing idb-companion via Homebrew..."
  brew tap facebook/fb
  brew install facebook/fb/idb-companion
  check_error "Failed to install idb-companion"
  
  log_success "idb-companion installed successfully"
}

# ============================================================================
# Function: verify-e2e-setup
# Description: Verify complete E2E testing setup
# Platform: macOS, Linux
# ============================================================================
verify-e2e-setup() {
  log_step 4 4 "Verifying E2E setup"
  
  local platform=$(detect_platform)
  local all_passed=true
  
  echo ""
  log_info "=== Java Verification ==="
  if java -version &> /dev/null; then
    local java_version=$(java -version 2>&1 | head -1)
    log_success "Java: $java_version"
  else
    log_error "Java: NOT FOUND or not working"
    all_passed=false
  fi
  
  echo ""
  log_info "=== Maestro Verification ==="
  
  # Add to PATH for current session
  export PATH="$HOME/.maestro/bin:$PATH"
  
  if command_exists maestro; then
    local maestro_version=$(maestro --version 2>&1 || echo "unknown")
    log_success "Maestro CLI: $maestro_version"
    
    # Run maestro doctor
    echo ""
    log_info "Running: maestro doctor"
    if maestro doctor; then
      log_success "Maestro doctor: PASSED"
    else
      log_warn "Maestro doctor: FOUND ISSUES (see above)"
      log_info "You may need to resolve these issues before using Maestro"
      all_passed=false
    fi
  else
    log_error "Maestro CLI: NOT FOUND"
    log_info "Try running 'source ~/.zshrc' or restart your terminal"
    all_passed=false
  fi
  
  echo ""
  log_info "=== iOS Device Bridge Verification (macOS only) ==="
  if [[ "$platform" == "macos" ]]; then
    if command_exists idb_companion; then
      log_success "idb-companion: INSTALLED"
    else
      log_warn "idb-companion: NOT FOUND (optional for iOS testing)"
    fi
  else
    log_info "Skipping idb-companion check (macOS only)"
  fi
  
  echo ""
  log_info "=== Environment Files Verification ==="
  if [ -f ".env.maestro" ]; then
    log_success ".env.maestro: EXISTS"
  else
    log_warn ".env.maestro: NOT FOUND"
    log_info "Create from example: cp .env.maestro.example .env.maestro"
  fi
  
  echo ""
  if [ "$all_passed" = true ]; then
    log_success "=== E2E Setup: ALL CHECKS PASSED ==="
    echo ""
    log_info "📝 Next steps:"
    log_info "   1. Ensure .env.maestro exists (copy from .env.maestro.example if needed)"
    log_info "   2. Build iOS app: task ios:generate"
    log_info "   3. Run E2E tests: task maestro:test"
  else
    log_warn "=== E2E Setup: SOME CHECKS FAILED ==="
    log_info "Please fix the issues above before running E2E tests"
    return 1
  fi
}

# ============================================================================
# Main dispatcher
# ============================================================================
main() {
  local cmd=$1
  
  case $cmd in
    install-java)
      install-java
      ;;
    install-maestro)
      install-maestro
      ;;
    install-idb-companion)
      install-idb-companion
      ;;
    verify-e2e-setup)
      verify-e2e-setup
      ;;
    *)
      log_error "Unknown command: $cmd"
      echo ""
      echo "Available commands:"
      echo "  install-java          - Install Java 17+ (required for Maestro)"
      echo "  install-maestro       - Install Maestro CLI"
      echo "  install-idb-companion - Install iOS Device Bridge (macOS only)"
      echo "  verify-e2e-setup      - Verify complete E2E setup"
      exit 1
      ;;
  esac
}

# Run main if script is executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  main "$@"
fi
