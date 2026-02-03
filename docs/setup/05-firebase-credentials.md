# Firebase Credentials Setup

Firebase requires platform-specific configuration files for push notifications, analytics, and other services.

## Overview

The app requires credential files for both platforms and both environments:

| Platform | Environment | File | Location |
|----------|-------------|------|----------|
| iOS | Production | `GoogleService-Info.plist` | `credentials/ios/` |
| iOS | Development | `GoogleService-Info-dev.plist` | `credentials/ios/` |
| Android | Production | `google-services.json` | `credentials/android/` |
| Android | Development | `google-services-dev.json` | `credentials/android/` |

## Firebase Project IDs

The app uses two Firebase projects:

| Environment | Project ID | Console URL |
|-------------|------------|-------------|
| Development | `chatscommerce-dev` | [Console](https://console.firebase.google.com/project/chatscommerce-dev) |
| Production | `chatscommerce-ec2f7` | [Console](https://console.firebase.google.com/project/chatscommerce-ec2f7) |

### Overriding Project IDs

If you're using different Firebase projects (e.g., external contributors), set in your `.env`:

```bash
FIREBASE_PROJECT_ID=your-custom-project-id
```

This affects the setup script credential downloads. The credential files themselves contain the actual project configuration.

## Bundle/Package IDs

Ensure your Firebase apps are registered with these identifiers:

| Environment | iOS Bundle ID | Android Package Name |
|-------------|---------------|---------------------|
| Production | `com.chatscommerce.app` | `com.chatscommerce.app` |
| Development | `com.chatscommerce.app.dev` | `com.chatscommerce.app.dev` |

## Method 1: Setup Script (Recommended)

The easiest way to download credentials is using the setup script:

```bash
./scripts/setup/10_setup_firebase.sh
```

The script will:
1. Display the Firebase project IDs
2. Offer a menu to download dev, prod, or both credentials
3. Validate the downloaded files

## Method 2: Firebase CLI (Manual)

If you're logged into Firebase CLI:

```bash
# Login if not already
firebase login

# Download development credentials
firebase apps:sdkconfig ios --project chatscommerce-dev \
    --out credentials/ios/GoogleService-Info-dev.plist
firebase apps:sdkconfig android --project chatscommerce-dev \
    --out credentials/android/google-services-dev.json

# Download production credentials
firebase apps:sdkconfig ios --project chatscommerce-ec2f7 \
    --out credentials/ios/GoogleService-Info.plist
firebase apps:sdkconfig android --project chatscommerce-ec2f7 \
    --out credentials/android/google-services.json
```

## Method 3: Firebase Console (Manual)

### Step 1: Access Firebase Console

Go to the appropriate project:
- **Development**: [chatscommerce-dev](https://console.firebase.google.com/project/chatscommerce-dev)
- **Production**: [chatscommerce-ec2f7](https://console.firebase.google.com/project/chatscommerce-ec2f7)

### Step 2: Download iOS Config

1. Click the gear icon > **Project Settings**
2. Scroll to **Your apps**
3. Click on the iOS app (or add one)
4. Click **GoogleService-Info.plist** to download
5. Save to `credentials/ios/GoogleService-Info.plist`

### Step 3: Download Android Config

1. In **Project Settings** > **Your apps**
2. Click on the Android app (or add one)
3. Click **google-services.json** to download
4. Save to `credentials/android/google-services.json`

### Step 4: Repeat for Development Apps

Download configs for development apps (with `.dev` suffix) and save as:
- `credentials/ios/GoogleService-Info-dev.plist`
- `credentials/android/google-services-dev.json`

## Registering New Apps

If apps aren't registered in Firebase:

### iOS App

1. Project Settings > **Add app** > iOS
2. Enter bundle ID: `com.chatscommerce.app` (or `.dev` for development)
3. Download `GoogleService-Info.plist`

### Android App

1. Project Settings > **Add app** > Android
2. Enter package name: `com.chatscommerce.app` (or `.dev` for development)
3. Download `google-services.json`

## Validation

### Using Setup Script

```bash
./scripts/setup/10_setup_firebase.sh
```

This validates all credential files and reports issues.

### Manual Validation

Check for required fields:

```bash
# iOS - should contain GOOGLE_APP_ID
grep "GOOGLE_APP_ID" credentials/ios/GoogleService-Info.plist

# Android - should contain project_info
grep "project_info" credentials/android/google-services.json
```

Check for placeholder values:

```bash
# Should return nothing (no placeholders)
grep -E "(YOUR_|PLACEHOLDER|placeholder-)" credentials/ios/*.plist
grep -E "(YOUR_|PLACEHOLDER|placeholder-)" credentials/android/*.json
```

## Troubleshooting

### "No registered apps"

Register apps in Firebase Console:
1. Project Settings > Your apps
2. Click iOS/Android icon
3. Enter bundle/package ID
4. Download config file

### "Invalid config file"

Check for placeholder values:
```bash
grep -E "(YOUR_|PLACEHOLDER)" credentials/**/*
```

Replace placeholders with real values from Firebase Console.

### "App not found" when downloading via CLI

List available apps:
```bash
# For development project
firebase apps:list --project chatscommerce-dev

# For production project
firebase apps:list --project chatscommerce-ec2f7
```

Ensure the app with the correct bundle/package ID exists.

### Config Files Not Working

1. Verify bundle/package IDs match exactly
2. Check for trailing spaces in IDs
3. Re-download from Firebase Console
4. Clean and rebuild the app

## File Structure

```
credentials/
  ios/
    GoogleService-Info.plist      # Production iOS
    GoogleService-Info-dev.plist  # Development iOS
  android/
    google-services.json          # Production Android
    google-services-dev.json      # Development Android
```

## Security Notes

- Credential files are gitignored by default
- Do not commit real credentials to public repositories
- For CI/CD, use environment variables or secrets
- Store credentials securely (password manager, secrets vault)

## Firebase Services Enabled

With proper credentials, the app can use:

- **Push Notifications** (Firebase Cloud Messaging)
- **Analytics** (Firebase Analytics)
- **Performance Monitoring** (Firebase Performance)
- **Crash Reporting** (Firebase Crashlytics)

---

**Previous:** [Authentication](04-authentication.md) | **Next:** [Environment Variables](06-environment-variables.md)
