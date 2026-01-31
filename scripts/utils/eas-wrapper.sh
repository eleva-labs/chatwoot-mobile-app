#!/usr/bin/env bash
# EAS CLI wrapper that ensures Volta binaries are in PATH
# Usage: ./scripts/utils/eas-wrapper.sh <eas-arguments>

# Ensure Volta binaries are in PATH
if [ -d "$HOME/.volta/bin" ]; then
  export PATH="$HOME/.volta/bin:$PATH"
fi

# Run eas command with proper PATH
exec eas "$@"
