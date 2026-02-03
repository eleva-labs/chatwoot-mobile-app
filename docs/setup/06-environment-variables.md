# Environment Variables

Configuration of environment variables for the Chatscommerce Mobile App.

## Overview

Environment variables are stored in a `.env` file at the project root. This file is gitignored and must be configured for each development machine.

## Configuration Methods

### Method 1: Pull from EAS (Recommended)

For team members with EAS access:

```bash
# Login to EAS
eas login

# Pull development environment
pnpm run env:pull:dev

# Or pull production environment
pnpm run env:pull:prod
```

### Method 2: Manual Configuration

```bash
# Copy the template
cp .env.example .env

# Edit with your values
nano .env  # or your preferred editor
```

## Required Variables

These variables must be configured for the app to function:

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_BASE_URL` | API base URL | `https://api.example.com` |
| `EXPO_PUBLIC_CHATWOOT_BASE_URL` | Chatwoot instance URL | `https://chat.example.com` |
| `EXPO_PUBLIC_PROJECT_ID` | EAS project ID | `abc123-def456` |

## Optional Variables

These enable additional features:

| Variable | Description | Default |
|----------|-------------|---------|
| `EXPO_PUBLIC_INSTALLATION_URL` | Custom installation URL | - |
| `EXPO_PUBLIC_CHATWOOT_WEBSITE_TOKEN` | Website widget token | - |
| `EXPO_PUBLIC_MINIMUM_CHATWOOT_VERSION` | Minimum supported version | - |
| `EXPO_PUBLIC_APP_SLUG` | Expo app slug | - |

## Analytics & Monitoring

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry error tracking DSN |
| `EXPO_PUBLIC_SENTRY_PROJECT_NAME` | Sentry project name |
| `EXPO_PUBLIC_SENTRY_ORG_NAME` | Sentry organization name |
| `EXPO_PUBLIC_JUNE_SDK_KEY` | June analytics key |

## Firebase Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `FIREBASE_PROJECT_ID` | Override Firebase project for CLI | Based on ENVIRONMENT |
| `GOOGLE_SERVICES_JSON` | Path to Android config (EAS builds) | - |
| `GOOGLE_SERVICE_INFO_PLIST` | Path to iOS config (EAS builds) | - |
| `EXPO_PUBLIC_IOS_GOOGLE_SERVICES_FILE` | iOS config path override | - |
| `EXPO_PUBLIC_ANDROID_GOOGLE_SERVICES_FILE` | Android config path override | - |

### Firebase Project ID Defaults

The `FIREBASE_PROJECT_ID` variable is optional. If not set, the setup scripts use:

- `ENVIRONMENT=dev` --> `chatscommerce-dev`
- `ENVIRONMENT=prod` --> `chatscommerce-ec2f7`

Set this only if you're using a custom Firebase project (e.g., external contributors or testing with different projects).

## Development Flags

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | Environment name | `development` |
| `EXPO_STORYBOOK_ENABLED` | Enable Storybook mode | `false` |
| `SENTRY_DISABLE_AUTO_UPLOAD` | Disable Sentry source maps | `true` |

## Complete .env Template

```bash
# Chatwoot Mobile App Environment Configuration
# Copy this file to .env and fill in the values

# App Configuration
ENVIRONMENT=development

# Chatwoot API Configuration (Required)
EXPO_PUBLIC_BASE_URL=
EXPO_PUBLIC_INSTALLATION_URL=
EXPO_PUBLIC_CHATWOOT_WEBSITE_TOKEN=
EXPO_PUBLIC_CHATWOOT_BASE_URL=
EXPO_PUBLIC_MINIMUM_CHATWOOT_VERSION=

# Expo Configuration (Required)
EXPO_PUBLIC_PROJECT_ID=
EXPO_PUBLIC_APP_SLUG=

# Analytics & Monitoring (Optional)
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_SENTRY_PROJECT_NAME=
EXPO_PUBLIC_SENTRY_ORG_NAME=
EXPO_PUBLIC_JUNE_SDK_KEY=

# Firebase Configuration (Optional - for push notifications)
# Override Firebase Project ID (defaults based on ENVIRONMENT)
# FIREBASE_PROJECT_ID=
# GOOGLE_SERVICES_JSON=
# GOOGLE_SERVICE_INFO_PLIST=
# EXPO_PUBLIC_IOS_GOOGLE_SERVICES_FILE=
# EXPO_PUBLIC_ANDROID_GOOGLE_SERVICES_FILE=

# Development Flags
EXPO_STORYBOOK_ENABLED=false
SENTRY_DISABLE_AUTO_UPLOAD=true
```

## Environment-Specific Values

### Development

```bash
ENVIRONMENT=development
EXPO_PUBLIC_BASE_URL=https://api.dev.example.com
```

### Production

```bash
ENVIRONMENT=production
EXPO_PUBLIC_BASE_URL=https://api.example.com
```

## Accessing Variables in Code

Environment variables prefixed with `EXPO_PUBLIC_` are available in the app:

```typescript
import Constants from 'expo-constants';

const baseUrl = process.env.EXPO_PUBLIC_BASE_URL;
// or
const baseUrl = Constants.expoConfig?.extra?.baseUrl;
```

## EAS Secrets Management

For production builds, store secrets in EAS:

```bash
# Set a secret
eas secret:create --name MY_SECRET --value "secret_value" --scope project

# List secrets
eas secret:list

# Delete a secret
eas secret:delete MY_SECRET
```

## Validation

The setup script validates environment configuration:

```bash
./scripts/setup/09_setup_env.sh
```

Or check manually:

```bash
# Check if .env exists
ls -la .env

# Count configured variables
grep -cE "^[A-Z_]+=.+" .env
```

## Troubleshooting

### Variables Not Loading

1. Restart the Metro bundler:
   ```bash
   pnpm start --clear
   ```

2. Rebuild the app:
   ```bash
   pnpm run generate
   ```

### "EAS not authenticated"

Login to EAS first:
```bash
eas login
```

### Missing Required Variables

Check the output of:
```bash
./scripts/setup/11_verify_setup.sh
```

### Wrong Environment

Verify ENVIRONMENT variable:
```bash
grep "ENVIRONMENT=" .env
```

## Security Best Practices

1. **Never commit `.env`** to version control
2. **Use EAS secrets** for production values
3. **Rotate secrets** periodically
4. **Use different values** for development vs production
5. **Limit access** to production secrets

---

**Previous:** [Firebase Credentials](05-firebase-credentials.md) | **Next:** [Troubleshooting](07-troubleshooting.md)
