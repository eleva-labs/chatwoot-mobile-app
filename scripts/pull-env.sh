#!/bin/bash

# Script to pull environment variables from EAS
# Usage: ./scripts/pull-env.sh <environment> [--merge]
# Example: ./scripts/pull-env.sh development
# Example: ./scripts/pull-env.sh production --merge
#
# Options:
#   --merge    Merge EAS values with existing .env, preserving local-only values
#              Without this flag, .env is completely replaced by EAS values

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source env-utils for .env manipulation
source "$PROJECT_ROOT/scripts/utils/env-utils.sh"

ENVIRONMENT=$1
MERGE_MODE=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --merge)
            MERGE_MODE=true
            ;;
        development|production)
            ENVIRONMENT=$arg
            ;;
    esac
done

if [ -z "$ENVIRONMENT" ]; then
    echo "❌ Error: Please specify environment (development or production)"
    echo "Usage: ./scripts/pull-env.sh <environment> [--merge]"
    echo ""
    echo "Options:"
    echo "  --merge    Merge EAS values with existing .env, preserving local-only values"
    exit 1
fi

if [ "$ENVIRONMENT" != "development" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo "❌ Error: Environment must be 'development' or 'production'"
    exit 1
fi

ENV_FILE="$PROJECT_ROOT/.env"

if [ "$MERGE_MODE" = true ]; then
    echo "🔄 Pulling environment variables from EAS ($ENVIRONMENT) with merge..."

    # Pull to a temp file first
    TEMP_ENV=$(mktemp)
    trap "rm -f '$TEMP_ENV'" EXIT

    if ! eas env:pull --environment "$ENVIRONMENT" --non-interactive --path "$TEMP_ENV"; then
        echo "❌ Failed to pull environment variables from EAS"
        exit 1
    fi

    # Backup existing .env if it exists
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "$ENV_FILE.backup"
        echo "📋 Backed up existing .env to .env.backup"

        # Read each key=value from pulled env and merge into existing .env
        while IFS= read -r line || [[ -n "$line" ]]; do
            # Skip comments and empty lines
            if [[ "$line" =~ ^[[:space:]]*# ]] || [[ -z "$line" ]]; then
                continue
            fi

            # Extract key and value
            if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*) ]]; then
                key="${BASH_REMATCH[1]}"
                value="${BASH_REMATCH[2]}"

                # Update the value in existing .env using env-utils
                set_env_value "$key" "$value" "$ENV_FILE"
            fi
        done < "$TEMP_ENV"

        echo "✅ Environment variables merged successfully!"
        echo "   Local-only values have been preserved."
    else
        # No existing .env, just use the pulled file
        cp "$TEMP_ENV" "$ENV_FILE"
        echo "✅ Environment variables created successfully!"
    fi
else
    echo "🔄 Pulling environment variables from EAS ($ENVIRONMENT)..."

    # Backup existing .env if it exists
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "$ENV_FILE.backup"
        echo "📋 Backed up existing .env to .env.backup"
    fi

    if eas env:pull --environment "$ENVIRONMENT" --non-interactive --path "$ENV_FILE"; then
        echo "✅ Environment variables updated successfully!"
    else
        echo "❌ Failed to pull environment variables"
        # Restore backup if pull failed
        if [ -f "$ENV_FILE.backup" ]; then
            mv "$ENV_FILE.backup" "$ENV_FILE"
            echo "📋 Restored .env from backup"
        fi
        exit 1
    fi
fi
