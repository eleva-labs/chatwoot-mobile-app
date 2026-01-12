# Environment Configuration Guide

This guide explains how environment variables are managed in the Chatscommerce mobile app.

## Overview

The app uses layered environment configuration:

1. **`.env.local`** - Local machine overrides (highest priority)
2. **`.env`** - EAS-managed settings
3. **`.env.example`** - Template/defaults (lowest priority)

## Environment Files

| File | Purpose | Committed | Created By |
|------|---------|-----------|------------|
| `.env.example` | Template with all variables | Yes | Manual |
| `.env.local.example` | Local-only template | Yes | Manual |
| `.env` | EAS-managed settings | No | `task setup-dev` |
| `.env.local` | Local overrides | No | `task setup-local-env` |

## Quick Setup

```bash
# Complete setup in one command (recommended)
task setup-full

# Or step by step:
task setup-dev        # Pull environment from EAS
task setup-local-env  # Create local environment file
```

## Setting Up Local Environment

```bash
# Create your local environment file
task setup-local-env

# This creates:
# - .env.local (with SIMULATOR and SENTRY settings)
# - ios/.xcode.env.local (Node.js path)
```

## What Gets Created

### .env.local
```bash
SENTRY_DISABLE_AUTO_UPLOAD=true  # Prevents auth errors
SIMULATOR=1                       # Build for simulator
```

### ios/.xcode.env.local
```bash
export NODE_BINARY="/path/to/node"  # Auto-detected
```

## Common Local Settings

### Simulator Development (Default)
```bash
SIMULATOR=1
SENTRY_DISABLE_AUTO_UPLOAD=true
```

### Physical Device Development
```bash
SIMULATOR=0
# Also configure code signing in Xcode
```

## How It Works

### Taskfile Dotenv Loading

The `Taskfile.yml` loads environment files in order:

```yaml
dotenv:
  - .env.example  # Loaded first (defaults)
  - .env          # Loaded second (overrides)
  - .env.local    # Loaded last (local overrides, highest priority)
```

This means:
1. `.env.example` provides default values
2. `.env` overrides with EAS-managed values
3. `.env.local` provides local-only overrides (highest priority)
4. Later files override earlier ones for any variable

### Variable Categories

#### Build Configuration

```bash
# Environment: dev | prod
ENVIRONMENT=dev

# Build target: 0 = device, 1 = simulator
SIMULATOR=1
```

#### App Configuration

```bash
EXPO_PUBLIC_APP_SLUG=chatscommerce
EXPO_PUBLIC_PROJECT_ID=<expo-project-id>
EXPO_PUBLIC_BASE_URL=https://dev.app.chatscommerce.com
EXPO_PUBLIC_INSTALLATION_URL=https://dev.app.chatscommerce.com/
EXPO_PUBLIC_MINIMUM_CHATWOOT_VERSION=3.13.0
```

#### Firebase / Google Services

```bash
# Paths to credential files (set automatically)
EXPO_PUBLIC_IOS_GOOGLE_SERVICES_FILE=
EXPO_PUBLIC_ANDROID_GOOGLE_SERVICES_FILE=

# For EAS cloud builds (secrets)
GOOGLE_SERVICES_JSON=
GOOGLE_SERVICE_INFO_PLIST=
```

#### Sentry Error Tracking

```bash
EXPO_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
EXPO_PUBLIC_SENTRY_ORG_NAME=your-org
EXPO_PUBLIC_SENTRY_PROJECT_NAME=your-project
SENTRY_AUTH_TOKEN=<token>
SENTRY_DISABLE_AUTO_UPLOAD=true
```

#### Development Tools

```bash
# Enable Storybook component gallery
EXPO_STORYBOOK_ENABLED=false
```

## Firebase Credentials

Firebase credentials are stored in the `credentials/` directory:

```
credentials/
├── android/
│   ├── google-services.json          # Production
│   └── google-services-dev.json      # Development
└── ios/
    ├── GoogleService-Info.plist      # Production
    └── GoogleService-Info-dev.plist  # Development
```

### Automatic Setup (Placeholders)

When you run `task setup-dev`, placeholder credentials are created automatically:

```bash
task setup-firebase
```

Placeholders allow the app to build and run, but **push notifications won't work**.

### Real Firebase Credentials

To enable push notifications:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create or select your project
3. Add apps for each platform:

**Android:**
- Package name: `com.chatscommerce.app.dev` (dev) or `com.chatscommerce.app` (prod)
- Download `google-services.json`
- Place in `credentials/android/`

**iOS:**
- Bundle ID: `com.chatscommerce.app.dev` (dev) or `com.chatscommerce.app` (prod)
- Download `GoogleService-Info.plist`
- Place in `credentials/ios/`

### EAS Cloud Builds

For EAS cloud builds, Firebase credentials are injected from EAS Secrets automatically. No manual credential files needed for CI/CD.

## Pulling from EAS

Environment variables are stored in the EAS dashboard and can be pulled locally:

```bash
# Development environment
task setup-dev
# Runs: ./scripts/pull-expo-env.sh development

# Production environment
task setup-prod
# Runs: ./scripts/pull-expo-env.sh production
```

This requires EAS CLI to be logged in:

```bash
npx eas login
```

## Verifying Environment

Check that variables are loaded correctly:

```bash
task env-check
```

Output:

```
ENVIRONMENT=dev
SIMULATOR=1
EXPO_PUBLIC_BASE_URL=https://dev.app.chatscommerce.com

Firebase credentials:
credentials/android/google-services-dev.json
credentials/ios/GoogleService-Info-dev.plist
```

## Environment in app.config.ts

The `app.config.ts` reads environment variables at build time:

```typescript
// Determines dev vs prod configuration
const isProd = process.env.ENVIRONMENT === 'prod';

// Controls iOS code signing
const isSimulator = process.env.SIMULATOR === '1';
```

Key behaviors:
- `ENVIRONMENT=prod` → Production bundle ID, icons, URLs
- `ENVIRONMENT=dev` → Development bundle ID, icons, URLs
- `SIMULATOR=1` → Skips iOS entitlements requiring code signing
- `SIMULATOR=0` → Includes full entitlements for device builds

## Adding New Variables

1. Add to `.env.example` with a default or empty value:
   ```bash
   # Description of variable
   NEW_VARIABLE=default_value
   ```

2. If it's a secret, add to EAS Secrets in the dashboard

3. If needed in app code, prefix with `EXPO_PUBLIC_`:
   ```bash
   EXPO_PUBLIC_NEW_FEATURE_FLAG=true
   ```

4. Access in code:
   ```typescript
   const flag = process.env.EXPO_PUBLIC_NEW_FEATURE_FLAG;
   ```

## Troubleshooting

### Variables not loading

1. Ensure `.env` file exists in project root
2. Restart the dev server after changing variables
3. Run `task env-check` to verify

### Variables empty in app

- Only `EXPO_PUBLIC_*` variables are available in app code
- Other variables are only available at build time

### EAS pull fails

```bash
# Login to EAS
npx eas login

# Verify account
npx eas whoami
```

### "SIMULATOR variable undefined"
**Fix**: Run `task setup-local-env` to create `.env.local`

### "Code signing failed"
**Fix**: Set `SIMULATOR=1` in `.env.local`, or configure code signing in Xcode

### "Sentry auth error during build"
**Fix**: Ensure `.env.local` has `SENTRY_DISABLE_AUTO_UPLOAD=true`

## Related Commands

```bash
task setup-local-env    # Create/update local environment
task verify-patches     # Verify patches applied
task setup-full         # Complete setup
```

## Next Steps

- [iOS Setup](SETUP_IOS.md)
- [Android Setup](SETUP_ANDROID.md)
- [Troubleshooting](TROUBLESHOOTING.md)
- [Back to README](../README.md)
