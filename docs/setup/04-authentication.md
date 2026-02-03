# Authentication Guide

This guide covers authentication for EAS (Expo Application Services) and Firebase CLI.

## Overview

Two authentication systems are used in this project:

| Service | Command | Required For |
|---------|---------|--------------|
| EAS (Expo) | `eas login` | Environment variables, builds, updates |
| Firebase | `firebase login` | Credential download (optional) |

## EAS Authentication

### Why EAS Login?

EAS authentication enables:

- **Environment Variables**: Pull secrets from EAS dashboard
- **Cloud Builds**: Build iOS/Android via `eas build`
- **OTA Updates**: Push updates via `eas update`
- **Submit to Stores**: Submit to App Store/Play Store via `eas submit`

### Check Current Status

```bash
eas whoami
```

If authenticated, this shows your email/username. If not, it shows an error.

### Login to EAS

```bash
eas login
```

This opens a browser for authentication. After logging in, return to the terminal.

### Logout from EAS

```bash
eas logout
```

### Using EAS After Login

```bash
# Pull development environment
pnpm run env:pull:dev

# Pull production environment
pnpm run env:pull:prod

# Start a cloud build
eas build --platform ios --profile development
```

## Firebase Authentication

### Why Firebase Login?

Firebase authentication enables:

- **Automatic Downloads**: Download `GoogleService-Info.plist` and `google-services.json` via CLI
- **Project Management**: Manage Firebase project settings
- **App Registration**: Register new apps from the command line

> **Note:** Firebase login is optional. You can manually download credentials from the Firebase Console instead.

### Check Current Status

```bash
firebase projects:list
```

If authenticated, this lists your Firebase projects. If not, it shows an error.

### Login to Firebase

```bash
firebase login
```

This opens a browser for authentication. After authorizing, return to the terminal.

### Logout from Firebase

```bash
firebase logout
```

### Using Firebase After Login

```bash
# List your projects
firebase projects:list

# List apps in a project
firebase apps:list --project YOUR_PROJECT_ID

# Download iOS config
firebase apps:sdkconfig ios --project YOUR_PROJECT_ID --out credentials/ios/GoogleService-Info.plist

# Download Android config
firebase apps:sdkconfig android --project YOUR_PROJECT_ID --out credentials/android/google-services.json
```

## Authentication During Setup

The setup script (specifically `05_setup_auth.sh`) handles authentication:

1. **Checks EAS status**: If not logged in, prompts for login
2. **Checks Firebase status**: If not logged in, prompts for login (optional)
3. **Exports status**: Makes authentication status available to subsequent scripts

### Skip Authentication Prompts

Use non-interactive mode:

```bash
./scripts/setup/setup.sh --non-interactive
```

Or skip the auth script:

```bash
./scripts/setup/setup.sh --skip=05
```

## Troubleshooting

### EAS Login Fails

```bash
# Clear credentials and retry
eas logout
eas login

# Check for network issues
curl -I https://expo.dev
```

### Firebase Login Fails

```bash
# Clear credentials and retry
firebase logout
firebase login --reauth

# Use interactive mode
firebase login --interactive
```

### "Not Authorized" Errors

Ensure you have access to the project:
- **EAS**: Verify you're added to the Expo project
- **Firebase**: Verify you're added to the Firebase project

### Token Expired

Re-authenticate:
```bash
eas login
firebase login --reauth
```

### CI/CD Authentication

For automated environments, use access tokens:

**EAS:**
```bash
# Set token as environment variable
export EXPO_TOKEN=your_eas_token

# Token can be created at expo.dev
```

**Firebase:**
```bash
# Set token as environment variable
export FIREBASE_TOKEN=your_firebase_token

# Generate token
firebase login:ci
```

## Security Best Practices

1. **Never commit tokens** to version control
2. **Use project-specific accounts** for CI/CD
3. **Rotate tokens** periodically
4. **Limit permissions** to what's needed
5. **Use environment variables** for tokens in CI/CD

## Related Commands

| Task | Command |
|------|---------|
| Check EAS status | `eas whoami` |
| Login to EAS | `eas login` |
| Logout from EAS | `eas logout` |
| Check Firebase status | `firebase projects:list` |
| Login to Firebase | `firebase login` |
| Logout from Firebase | `firebase logout` |

---

**Previous:** [Manual Setup](03-manual-setup.md) | **Next:** [Firebase Credentials](05-firebase-credentials.md)
