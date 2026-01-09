#!/bin/bash

# Script to pull environment variables from EAS
# Usage: ./scripts/pull-env.sh <environment>
# Example: ./scripts/pull-env.sh development
# Example: ./scripts/pull-env.sh production

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
    echo "❌ Error: Please specify environment (development or production)"
    echo "Usage: ./scripts/pull-env.sh <environment>"
    exit 1
fi

if [ "$ENVIRONMENT" != "development" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo "❌ Error: Environment must be 'development' or 'production'"
    exit 1
fi

echo "🔄 Pulling environment variables from EAS ($ENVIRONMENT)..."

pnpm exec eas env:pull --environment "$ENVIRONMENT" --non-interactive --path .env

if [ $? -eq 0 ]; then
    echo "✅ Environment variables updated successfully!"
else
    echo "❌ Failed to pull environment variables"
    exit 1
fi

# Setup Firebase credentials (creates placeholders if real ones don't exist)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/setup-firebase-credentials.sh"
