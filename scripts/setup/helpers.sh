#!/usr/bin/env bash
# Helper utilities for setup scripts
# Provides platform detection, logging, and common functions

# Platform detection (returns: "macos", "linux", or "windows")
detect_platform() {
  case "$OSTYPE" in
    darwin*) echo "macos" ;;
    linux*) echo "linux" ;;
    msys*|cygwin*) echo "windows" ;;
    *) echo "unknown" ;;
  esac
}

# Color codes
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Logging utilities
log_info() { 
  echo -e "${BLUE}$1${NC}"
}

log_success() { 
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() { 
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() { 
  echo -e "${RED}❌ $1${NC}"
}

log_step() { 
  echo -e "${BLUE}[$1/$2] $3${NC}"
}

# Command checks
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Version comparison (returns 0 if $1 >= $2, 1 otherwise)
version_ge() {
  # Usage: version_ge "1.2.3" "1.2.0"
  printf '%s\n%s\n' "$2" "$1" | sort -V -C
}

# Error handling (exits with code 1 if last command failed)
check_error() {
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    log_error "$1"
    exit 1
  fi
  return 0
}

# Progress indicator (displays spinner while command runs in background)
show_progress() {
  local pid=$1
  local message="${2:-Working...}"
  local spin='-\|/'
  local i=0
  echo -n "$message "
  while kill -0 $pid 2>/dev/null; do
    i=$(( (i+1) %4 ))
    printf "\r$message ${spin:$i:1}"
    sleep 0.1
  done
  printf "\r$message Done\n"
}

# Confirm action (returns 0 for yes, 1 for no)
confirm() {
  local prompt="${1:-Are you sure?}"
  read -p "$prompt [y/N] " -n 1 -r
  echo
  [[ $REPLY =~ ^[Yy]$ ]]
}
