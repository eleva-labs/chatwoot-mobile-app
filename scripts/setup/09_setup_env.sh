#!/bin/bash
#
# 09_setup_env.sh
# Sets up environment configuration file (.env)
#
# This script:
# - Checks if .env file already exists
# - Copies from template (.env.example or .env.development) if available
# - Guides user on filling in required values
# - Mentions EAS env pull for team members
# - Never overwrites existing .env without confirmation
#
set -e

# ==============================================================================
# SOURCE HELPER FUNCTIONS
# ==============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/setup.sh" --helpers-only 2>/dev/null || {
    # Fallback if helpers aren't available
    print_success() { echo "[OK] $1"; }
    print_error() { echo "[ERROR] $1"; }
    print_warning() { echo "[!] $1"; }
    print_info() { echo "[INFO] $1"; }
    print_header() { echo "=== $1 ==="; }
}

# Use PROJECT_ROOT from environment or calculate it
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

# Source env-utils for .env manipulation
source "$PROJECT_ROOT/scripts/utils/env-utils.sh"

print_header "Environment Setup"

cd "$PROJECT_ROOT"

# ==============================================================================
# CHECK EXISTING .env FILE
# ==============================================================================

ENV_FILE="$PROJECT_ROOT/.env"
ENV_EXAMPLE="$PROJECT_ROOT/.env.example"
ENV_DEV="$PROJECT_ROOT/.env.development"

if [[ -f "$ENV_FILE" ]]; then
    print_success ".env file already exists"

    # Check if it has content (not just empty/comments)
    if grep -qE "^[A-Z_]+=.+" "$ENV_FILE" 2>/dev/null; then
        print_info "Environment file appears to be configured"

        # Count configured variables
        VAR_COUNT=$(grep -cE "^[A-Z_]+=.+" "$ENV_FILE" 2>/dev/null || echo "0")
        print_info "Found $VAR_COUNT configured environment variable(s)"
        echo ""

        if [[ -t 0 ]]; then
            read -p "Keep existing .env? (Y/n): " response
            if [[ "$response" == "n" || "$response" == "N" ]]; then
                print_warning "Backing up existing .env to .env.backup"
                cp "$ENV_FILE" "$PROJECT_ROOT/.env.backup"
                rm "$ENV_FILE"
            else
                print_success "Keeping existing .env file"
                exit 0
            fi
        else
            # Non-interactive mode - keep existing file
            print_info "Non-interactive mode: keeping existing .env file"
            exit 0
        fi
    else
        print_warning ".env file exists but appears to be empty or unconfigured"
    fi
fi

# ==============================================================================
# CREATE .env FROM TEMPLATE
# ==============================================================================

TEMPLATE_USED=""

if [[ ! -f "$ENV_FILE" ]]; then
    echo ""

    # Check for templates in order of preference
    if [[ -f "$ENV_EXAMPLE" ]]; then
        print_info "Found .env.example template"
        TEMPLATE_USED="$ENV_EXAMPLE"
    elif [[ -f "$ENV_DEV" ]]; then
        print_info "Found .env.development template"
        TEMPLATE_USED="$ENV_DEV"
    fi

    if [[ -n "$TEMPLATE_USED" ]]; then
        print_info "Creating .env from template..."
        cp "$TEMPLATE_USED" "$ENV_FILE"
        print_success ".env created from $(basename "$TEMPLATE_USED")"

        # Set default values using env-utils
        print_info "Setting default environment values..."
        set_env_value "ENVIRONMENT" "dev"
        set_env_value "EXPO_STORYBOOK_ENABLED" "false"
        set_env_value "SENTRY_DISABLE_AUTO_UPLOAD" "true"

        # Auto-populate EAS project ID if not already set and we can get it
        if command -v eas &> /dev/null && eas whoami &> /dev/null; then
            # Try to get project ID from eas.json or app.json
            if [[ -f "$PROJECT_ROOT/app.json" ]]; then
                PROJECT_ID=$(grep -o '"projectId"[[:space:]]*:[[:space:]]*"[^"]*"' "$PROJECT_ROOT/app.json" 2>/dev/null | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')
                if [[ -n "$PROJECT_ID" && "$PROJECT_ID" != "null" ]]; then
                    current_val=$(get_env_value "EXPO_PUBLIC_PROJECT_ID" 2>/dev/null || echo "")
                    if [[ -z "$current_val" ]]; then
                        set_env_value "EXPO_PUBLIC_PROJECT_ID" "$PROJECT_ID"
                        print_info "Auto-populated EXPO_PUBLIC_PROJECT_ID from app.json"
                    fi
                fi
            fi
        fi

        print_success "Default values configured"
    else
        # No template found - create minimal .env
        print_warning "No template file found (.env.example or .env.development)"
        print_info "Creating minimal .env file..."

        cat > "$ENV_FILE" << 'EOF'
# Chatwoot Mobile App Environment Configuration
# Fill in the values below or use: ./scripts/pull-env.sh development

# App Configuration
ENVIRONMENT=development

# Chatwoot API Configuration
EXPO_PUBLIC_BASE_URL=
EXPO_PUBLIC_INSTALLATION_URL=
EXPO_PUBLIC_CHATWOOT_WEBSITE_TOKEN=
EXPO_PUBLIC_CHATWOOT_BASE_URL=
EXPO_PUBLIC_MINIMUM_CHATWOOT_VERSION=

# Expo Configuration
EXPO_PUBLIC_PROJECT_ID=
EXPO_PUBLIC_APP_SLUG=

# Analytics & Monitoring (optional)
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_SENTRY_PROJECT_NAME=
EXPO_PUBLIC_SENTRY_ORG_NAME=
EXPO_PUBLIC_JUNE_SDK_KEY=

# Firebase Configuration (optional - for push notifications)
# GOOGLE_SERVICES_JSON=
# GOOGLE_SERVICE_INFO_PLIST=
# EXPO_PUBLIC_IOS_GOOGLE_SERVICES_FILE=
# EXPO_PUBLIC_ANDROID_GOOGLE_SERVICES_FILE=

# Development Flags
EXPO_STORYBOOK_ENABLED=false
SENTRY_DISABLE_AUTO_UPLOAD=true
EOF
        print_success "Created minimal .env file"
    fi
fi

# ==============================================================================
# CHECK EAS AUTHENTICATION
# ==============================================================================

echo ""
EAS_AUTHENTICATED=false

if command -v eas &> /dev/null; then
    # Check if user is logged in to EAS
    if eas whoami &> /dev/null; then
        EAS_USER=$(eas whoami 2>/dev/null)
        print_success "EAS authenticated as: $EAS_USER"
        EAS_AUTHENTICATED=true
    else
        print_info "Not logged into EAS"
    fi
else
    print_info "EAS CLI not found"
fi

# ==============================================================================
# GUIDE USER ON CONFIGURATION OPTIONS
# ==============================================================================

echo ""
print_header "Configuration Options"

if [[ "$EAS_AUTHENTICATED" == "true" ]]; then
    echo "You have several options to configure your environment:"
    echo ""
    echo "  1. Pull from EAS (recommended for team members):"
    echo "     ./scripts/pull-env.sh development"
    echo "     ./scripts/pull-env.sh production"
    echo ""
    echo "  2. Manually edit .env file:"
    echo "     Open $ENV_FILE in your editor"
    echo ""

    if [[ -t 0 ]]; then
        echo "Would you like to pull environment variables from EAS now?"
        echo "  1) Pull development environment"
        echo "  2) Pull production environment"
        echo "  3) Skip - I'll configure manually"
        echo ""
        read -p "Select option [3]: " eas_choice

        case $eas_choice in
            1)
                print_info "Pulling development environment from EAS..."
                if "$PROJECT_ROOT/scripts/pull-env.sh" development; then
                    print_success "Environment variables pulled successfully!"
                else
                    print_warning "Failed to pull from EAS. You can try manually later."
                fi
                ;;
            2)
                print_info "Pulling production environment from EAS..."
                if "$PROJECT_ROOT/scripts/pull-env.sh" production; then
                    print_success "Environment variables pulled successfully!"
                else
                    print_warning "Failed to pull from EAS. You can try manually later."
                fi
                ;;
            *)
                print_info "Skipping EAS pull. Configure .env manually."
                ;;
        esac
    fi
else
    echo "To configure your environment:"
    echo ""
    echo "  Option 1: For team members with EAS access:"
    echo "    a) Login to EAS: eas login"
    echo "    b) Pull env: ./scripts/pull-env.sh development"
    echo ""
    echo "  Option 2: Manual configuration:"
    echo "    Edit $ENV_FILE and fill in the required values"
    echo ""
fi

# ==============================================================================
# LIST REQUIRED VARIABLES
# ==============================================================================

echo ""
print_header "Required Environment Variables"

echo "The following variables should be configured:"
echo ""
echo "  Required:"
echo "    - EXPO_PUBLIC_BASE_URL: Your Chatwoot API base URL"
echo "    - EXPO_PUBLIC_CHATWOOT_BASE_URL: Chatwoot instance URL"
echo "    - EXPO_PUBLIC_PROJECT_ID: EAS project ID"
echo ""
echo "  Optional (for full functionality):"
echo "    - EXPO_PUBLIC_SENTRY_DSN: Error tracking"
echo "    - GOOGLE_SERVICES_JSON: Android push notifications"
echo "    - GOOGLE_SERVICE_INFO_PLIST: iOS push notifications"
echo ""

# ==============================================================================
# VERIFY .env EXISTS
# ==============================================================================

if [[ -f "$ENV_FILE" ]]; then
    print_success ".env file is ready at: $ENV_FILE"
else
    print_error "Failed to create .env file"
    exit 1
fi

echo ""
print_info "Remember: Never commit .env to version control!"
print_info "Use EAS secrets or pull-env.sh for team collaboration"
echo ""
