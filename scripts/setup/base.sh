#!/usr/bin/env bash
# Base setup script - Foundation for all platforms
set -e  # Exit on error

# Source helpers
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/helpers.sh"

# Install Volta and Node 20
install-node-volta() {
  log_step 1 4 "Installing Volta and Node 20"
  
  # Check if Volta is installed
  if command_exists volta; then
    log_success "Volta already installed: $(volta --version)"
  else
    log_info "Installing Volta..."
    curl https://get.volta.sh | bash
    check_error "Failed to install Volta"
    
    # Source Volta for current session
    export VOLTA_HOME="$HOME/.volta"
    export PATH="$VOLTA_HOME/bin:$PATH"
    
    log_success "Volta installed"
  fi
  
  # Install Node 20
  log_info "Installing Node 20..."
  volta install node@20
  check_error "Failed to install Node 20"
  
  # Pin Node 20 to project
  volta pin node@20
  check_error "Failed to pin Node 20"
  
  # Verify
  node_version=$(node --version)
  log_success "Node.js: $node_version"
  
  # pnpm is automatically installed via Volta
  if command_exists pnpm; then
    log_success "pnpm available via Volta"
  else
    log_info "Installing pnpm via Volta..."
    volta install pnpm
    check_error "Failed to install pnpm"
    log_success "pnpm installed"
  fi
}

# Install base tools
install-tools-base() {
  log_step 2 4 "Installing development tools"
  
  local platform=$(detect_platform)
  
  # Watchman
  if command_exists watchman; then
    log_success "Watchman already installed"
  else
    case $platform in
      macos)
        log_info "Installing Watchman via Homebrew..."
        brew install watchman
        ;;
      linux)
        log_info "Installing Watchman..."
        # Check if we can use apt
        if command_exists apt-get; then
          sudo apt-get update
          sudo apt-get install -y watchman
        else
          log_warning "Please install Watchman manually for your Linux distribution"
        fi
        ;;
    esac
    check_error "Failed to install Watchman"
    log_success "Watchman installed"
  fi
  
  # Task
  if command_exists task; then
    log_success "Task already installed"
  else
    case $platform in
      macos)
        log_info "Installing Task via Homebrew..."
        brew install go-task
        ;;
      linux)
        log_info "Installing Task..."
        if command_exists apt-get; then
          sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin
        else
          log_warning "Please install Task manually from https://taskfile.dev"
        fi
        ;;
    esac
    check_error "Failed to install Task"
    log_success "Task installed"
  fi
  
  # Expo CLI (install via Volta)
  if command_exists expo; then
    log_success "Expo CLI already installed"
  else
    log_info "Installing Expo CLI via Volta..."
    volta install @expo/cli
    check_error "Failed to install Expo CLI"
    log_success "Expo CLI installed"
  fi
  
  # EAS CLI (install via Volta)
  if command_exists eas; then
    log_success "EAS CLI already installed"
  else
    log_info "Installing EAS CLI via Volta..."
    volta install eas-cli
    check_error "Failed to install EAS CLI"
    log_success "EAS CLI installed"
  fi
}

# Setup direnv
install-direnv() {
  log_step 3 4 "Setting up direnv"
  
  # Check if direnv is installed
  if ! command_exists direnv; then
    local platform=$(detect_platform)
    log_info "Installing direnv..."
    case $platform in
      macos)
        brew install direnv
        ;;
      linux)
        if command_exists apt-get; then
          sudo apt-get update
          sudo apt-get install -y direnv
        else
          log_warning "Please install direnv manually for your Linux distribution"
        fi
        ;;
    esac
    check_error "Failed to install direnv"
  else
    log_success "direnv already installed"
  fi
  
  # Detect shell
  local shell_name=$(basename "$SHELL")
  local shell_rc=""
  
  case $shell_name in
    zsh) shell_rc="$HOME/.zshrc" ;;
    bash) shell_rc="$HOME/.bashrc" ;;
    *)
      log_warning "Unknown shell: $shell_name. Please configure direnv manually."
      return 0
      ;;
  esac
  
  # Add hook if not present
  if ! grep -q "direnv hook" "$shell_rc" 2>/dev/null; then
    echo "" >> "$shell_rc"
    echo "# direnv - auto-load environment variables" >> "$shell_rc"
    echo "eval \"\$(direnv hook $shell_name)\"" >> "$shell_rc"
    log_success "Added direnv hook to $shell_rc"
  else
    log_success "direnv hook already configured in $shell_rc"
  fi
  
  # Create .envrc if not exists
  if [[ ! -f .envrc ]]; then
    cat > .envrc <<'EOF'
# ===========================================
# direnv configuration
# ===========================================
# Auto-loads environment variables when you cd into this directory

# Main Environment File (Source of Truth)
dotenv_if_exists .env

# Maestro Test Configuration (Optional)
dotenv_if_exists .env.maestro

# Development Tools PATH Configuration
# Add Java to PATH (for Maestro E2E testing)
if [ -n "$JAVA_HOME" ]; then
  PATH_add "$JAVA_HOME/bin"
fi

# Add Android SDK tools to PATH (for Android development)
if [ -n "$ANDROID_HOME" ]; then
  PATH_add "$ANDROID_HOME/emulator"
  PATH_add "$ANDROID_HOME/platform-tools"
  PATH_add "$ANDROID_HOME/tools"
  PATH_add "$ANDROID_HOME/tools/bin"
fi

# Add Maestro to PATH (for E2E testing)
PATH_add "$HOME/.maestro/bin"
EOF
    log_success "Created .envrc with development tool paths"
  else
    log_success ".envrc already exists"
  fi
  
  # Allow direnv
  if command_exists direnv; then
    # Allow direnv for this directory
    direnv allow . 2>/dev/null || log_warning "Please restart your shell and run 'direnv allow .'"
  fi
}

# Setup environment files
setup-env-files() {
  log_step 4 4 "Setting up environment variables"
  
  # Verify EAS authentication (prerequisite)
  log_info "Verifying EAS authentication..."
  # SCRIPT_DIR already defined at script top - use global
  if ! "$SCRIPT_DIR/../utils/check-eas-auth.sh" --project --quiet; then
    echo ""
    log_error "EAS authentication required"
    echo ""
    echo "Before running setup, you must login to EAS (one-time):"
    echo "  1. Run: eas login"
    echo "  2. Enter your Expo credentials"
    echo "  3. Then re-run: task setup:base"
    echo ""
    echo "EAS session persists for weeks/months (no re-login needed)."
    echo ""
    exit 1
  fi
  log_success "EAS authentication verified"
  
  # Pull from EAS (creates .env)
  log_info "Pulling environment from EAS..."
  pnpm run env:pull:dev
  check_error "Failed to pull environment from EAS"
  log_success ".env created from EAS"
  
  # Add development tool paths to .env if not present
  if ! grep -q "JAVA_HOME" .env 2>/dev/null; then
    cat >> .env <<'EOF'

# -------------------------------------------
# Development Tools (auto-configured by setup scripts)
# -------------------------------------------
# Java (for Maestro E2E testing)
JAVA_HOME=/opt/homebrew/opt/openjdk@17

# Android SDK (for Android development)
ANDROID_HOME=$HOME/Library/Android/sdk
EOF
    log_success "Added JAVA_HOME and ANDROID_HOME to .env"
  else
    log_success "Development tools already configured in .env"
  fi
  
  # Create .env.maestro from template if it doesn't exist
  if [[ ! -f .env.maestro ]]; then
    if [[ -f .env.maestro.example ]]; then
      cp .env.maestro.example .env.maestro
      log_success "Created .env.maestro from template"
      log_warning "Please edit .env.maestro with your test credentials"
    else
      log_warning ".env.maestro.example not found - skipping Maestro env setup"
    fi
  else
    log_success ".env.maestro already exists"
  fi
  
  # Verify patches
  if grep -q "@unknown default" node_modules/expo-localization/ios/LocalizationModule.swift 2>/dev/null; then
    log_success "expo-localization patch applied"
  else
    log_warning "expo-localization patch NOT applied (may need pnpm install)"
  fi
  
  log_success "Environment files configured"
}

# Main function dispatcher
main() {
  local cmd=$1
  
  case $cmd in
    install-node-volta) install-node-volta ;;
    install-tools-base) install-tools-base ;;
    install-direnv) install-direnv ;;
    setup-env-files) setup-env-files ;;
    *)
      log_error "Unknown command: $cmd"
      echo "Usage: $0 {install-node-volta|install-tools-base|install-direnv|setup-env-files}"
      exit 1
      ;;
  esac
}

# Execute main with all arguments
main "$@"
