#!/usr/bin/env bash

# Script to pull environment variables from EAS
#
# PREREQUISITE: You must be logged in to EAS (one-time)
#   Run: eas login
#   Session persists for weeks/months (no re-login needed)
#
# Usage: ./scripts/env/pull.sh <environment>
# Example: ./scripts/env/pull.sh development
# Example: ./scripts/env/pull.sh production

# Ensure Volta binaries are in PATH
if [ -d "$HOME/.volta/bin" ]; then
  export PATH="$HOME/.volta/bin:$PATH"
fi

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
    echo "❌ Error: Please specify environment (development or production)"
    echo "Usage: ./scripts/env/pull.sh <environment>"
    exit 1
fi

if [ "$ENVIRONMENT" != "development" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo "❌ Error: Environment must be 'development' or 'production'"
    exit 1
fi

# Verify EAS authentication
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if ! "$SCRIPT_DIR/../utils/check-eas-auth.sh" --project; then
    exit 1
fi

echo ""
echo "🔄 Pulling environment variables from EAS ($ENVIRONMENT)..."

eas env:pull --environment "$ENVIRONMENT" --non-interactive --path .env

if [ $? -eq 0 ]; then
    echo "✅ Environment variables updated successfully!"
else
    echo "❌ Failed to pull environment variables"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check you're logged in: eas whoami"
    echo "  2. Check project access: eas project:info"
    echo "  3. Check internet connection"
    echo ""
    exit 1
fi

# Setup Firebase credentials (creates placeholders if real ones don't exist)
"$SCRIPT_DIR/../firebase/setup-credentials.sh"
