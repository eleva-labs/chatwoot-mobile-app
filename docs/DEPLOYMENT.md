# Deployment

This guide covers building and deploying the Chatscommerce mobile app to the App Store and Google Play.

## Overview

Builds are managed through [EAS Build](https://docs.expo.dev/build/introduction/) (Expo Application Services). EAS handles code signing, native builds, and store submission.

## Build Profiles

| Profile                 | Environment | Use Case                           |
| ----------------------- | ----------- | ---------------------------------- |
| `development`           | dev         | Development builds with dev client |
| `development:simulator` | dev         | iOS simulator builds               |
| `production`            | prod        | Store-ready builds                 |

## Prerequisites

### 1. EAS CLI

```bash
npm install -g eas-cli
```

### 2. EAS Login

```bash
npx eas login
npx eas whoami  # Verify logged in
```

### 3. App Store / Play Store Setup

**iOS (App Store Connect):**

- Apple Developer Program membership ($99/year)
- App created in App Store Connect
- App-specific password for CI (optional)

**Android (Google Play Console):**

- Google Play Developer account ($25 one-time)
- App created in Play Console
- Service account key for automated submissions

## Building

### Development Builds

For testing on devices with development features:

```bash
# iOS (device)
task ios:eas
# Or: eas build -p ios --profile development

# Android
task android:eas
# Or: eas build -p android --profile development

# iOS (simulator only)
eas build -p ios --profile development:simulator
```

### Production Builds

For store submission:

```bash
# iOS
eas build -p ios --profile production

# Android
eas build -p android --profile production
```

### Local Builds

Build on your machine instead of EAS cloud:

```bash
# iOS (requires macOS + Xcode)
task ios:eas-local

# Android
task android:eas-local
```

## Store Submission

### Automatic Submission

Submit immediately after build:

```bash
# iOS
eas build -p ios --profile production --auto-submit

# Android
eas build -p android --profile production --auto-submit
```

### Manual Submission

Submit an existing build:

```bash
# List recent builds
eas build:list

# Submit specific build
eas submit -p ios --id <build-id>
eas submit -p android --id <build-id>
```

## Version Management

Version numbers are managed automatically by EAS:

```json
// eas.json
{
  "cli": {
    "appVersionSource": "remote"
  },
  "build": {
    "production": {
      "autoIncrement": true
    }
  }
}
```

- **appVersionSource: "remote"** - EAS tracks version numbers
- **autoIncrement: true** - Build number increments automatically

To manually set version:

```bash
eas build:version:set
```

## Environment Variables

### EAS Secrets

Sensitive variables are stored in EAS Secrets (not in code):

1. Go to [expo.dev](https://expo.dev) > Project > Secrets
2. Add secrets for each environment:
   - `GOOGLE_SERVICES_JSON` - Firebase Android config (base64)
   - `GOOGLE_SERVICE_INFO_PLIST` - Firebase iOS config (base64)
   - `SENTRY_AUTH_TOKEN` - Sentry upload token

### Environment-Specific Config

The `ENVIRONMENT` variable controls which config is used:

| ENVIRONMENT | Bundle ID                   | API URL                             |
| ----------- | --------------------------- | ----------------------------------- |
| `dev`       | `com.chatscommerce.app.dev` | `https://dev.app.chatscommerce.com` |
| `prod`      | `com.chatscommerce.app`     | `https://app.chatscommerce.com`     |

## Code Signing

### iOS

EAS manages iOS code signing automatically. On first build:

1. EAS prompts to create/select certificates
2. Credentials are stored securely in EAS
3. Subsequent builds use stored credentials

To manage credentials:

```bash
eas credentials
```

### Android

EAS generates and manages the keystore. For Play Store:

1. First build creates a new keystore
2. Upload the app to Play Store
3. Subsequent builds use the same keystore

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm install -g eas-cli && pnpm install

      - name: Build iOS
        run: eas build -p ios --profile production --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

      - name: Build Android
        run: eas build -p android --profile production --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

### EXPO_TOKEN

For CI/CD, create a robot token:

1. Go to [expo.dev](https://expo.dev) > Account Settings > Access Tokens
2. Create new token
3. Add as `EXPO_TOKEN` secret in your CI

## Over-the-Air Updates

For JavaScript-only updates (no native changes):

```bash
# Publish update to production channel
eas update --branch production --message "Bug fixes"

# Publish update to development channel
eas update --branch development --message "New feature"
```

Updates are automatically downloaded when users open the app.

## Troubleshooting

### Build failed on EAS

1. Check build logs on [expo.dev](https://expo.dev)
2. Common issues:
   - Missing environment variables
   - Credential issues
   - Native dependency problems

### Submission rejected

**iOS common rejections:**

- Missing privacy policy
- Incomplete metadata
- Guideline violations

**Android common rejections:**

- Missing privacy policy
- Incorrect content rating
- Policy violations

### Credentials issues

```bash
# View current credentials
eas credentials

# Reset credentials (careful!)
eas credentials --platform ios
# Select "Remove" to clear and recreate
```

## Useful Commands

```bash
# Check build status
eas build:list

# View build details
eas build:view

# Cancel a build
eas build:cancel

# View submission status
eas submit:list

# Configure project
eas build:configure

# Update EAS CLI
npm install -g eas-cli@latest
```

## Next Steps

- [Environment Setup](ENVIRONMENT.md)
- [Troubleshooting](TROUBLESHOOTING.md)
- [Back to README](../README.md)
