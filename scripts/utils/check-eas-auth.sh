#!/usr/bin/env bash
# EAS Authentication Checker
# Verifies user is logged in to EAS and has project access
# Usage: 
#   ./scripts/utils/check-eas-auth.sh          # Check login only
#   ./scripts/utils/check-eas-auth.sh --project # Check login + project access

set -e

# Source helpers for logging
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../setup/helpers.sh"

# Parse flags
CHECK_PROJECT=false
QUIET=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --project)
      CHECK_PROJECT=true
      shift
      ;;
    --quiet)
      QUIET=true
      shift
      ;;
    *)
      shift
      ;;
  esac
done

# Function to log (respects --quiet flag)
log_message() {
  if [[ "$QUIET" != "true" ]]; then
    echo "$1"
  fi
}

# Check if EAS CLI is available
if ! command_exists eas; then
  if [[ "$QUIET" != "true" ]]; then
    log_error "EAS CLI not found"
    echo ""
    echo "EAS CLI is required to pull environment variables."
    echo ""
    echo "Fix: Install EAS CLI by running:"
    echo "  task setup:base"
    echo ""
  fi
  exit 1
fi

# Check if logged in
if ! eas whoami &>/dev/null; then
  if [[ "$QUIET" != "true" ]]; then
    log_error "Not logged in to EAS"
    echo ""
    echo "You must be logged in to EAS to pull environment variables."
    echo ""
    echo "EAS login is a one-time prerequisite:"
    echo "  1. Run: eas login"
    echo "  2. Enter your Expo credentials"
    echo "  3. Session persists for weeks/months (no re-login needed)"
    echo ""
    echo "Don't have an EAS account?"
    echo "  • Sign up at: https://expo.dev"
    echo "  • Request project access from admin"
    echo ""
  fi
  exit 1
fi

# Get logged in user
LOGGED_IN_USER=$(eas whoami 2>/dev/null | head -1)
[[ "$QUIET" != "true" ]] && log_success "Logged in as: $LOGGED_IN_USER"

# Check project access if requested
if [[ "$CHECK_PROJECT" == "true" ]]; then
  if ! eas project:info &>/dev/null; then
    if [[ "$QUIET" != "true" ]]; then
      log_error "No access to this project"
      echo ""
      echo "You're logged in as: $LOGGED_IN_USER"
      echo "But you don't have access to this project."
      echo ""
      echo "Fix: Request access from project admin"
      echo "  • Provide your email: $LOGGED_IN_USER"
      echo "  • Admin grants access in Expo dashboard"
      echo ""
    fi
    exit 1
  fi
  [[ "$QUIET" != "true" ]] && log_success "Project access verified"
fi

exit 0
