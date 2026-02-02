# Chatscommerce Mobile App

A mobile customer support application built on [Chatwoot](https://chatwoot.com) open-source platform, enabling support agents to manage conversations on the go.

## Overview

Chatscommerce Mobile App is a React Native application that provides real-time customer support capabilities for iOS and Android devices. Support agents can receive push notifications, respond to customer messages, and manage conversations from anywhere.

**Key Features:**
- Real-time messaging with customers
- Push notifications via Firebase
- Deep linking support for inbox and conversations
- Over-the-air updates via EAS
- Multi-platform support (iOS & Android)

## Tech Stack

| Technology | Version |
|------------|---------|
| React Native | 0.76.9 |
| Expo SDK | ~52.0.47 |
| Node.js | >=22.12.0 |
| TypeScript | 5.1.3 |
| Min iOS | 15.1 |
| Min Android API | 24 |

## Pre-Requirements

**System:**
- macOS (required for iOS development, recommended for Android)
- Linux or Windows (Android development only)

**Required Tools:**

| Tool | Purpose | Installation |
|------|---------|--------------|
| **Volta** | **Node version manager** | [volta.sh](https://volta.sh/) (auto-installed by setup) |
| Homebrew | Package manager (macOS) | [brew.sh](https://brew.sh/) |
| Git | Version control | [git-scm.com](https://git-scm.com/) |
| Xcode 16.x | iOS development (macOS only) | Mac App Store |
| Android Studio | Android development | [developer.android.com](https://developer.android.com/studio) |

> **Important:** This project uses **Volta** to manage the entire Node.js environment. Volta automatically ensures everyone uses the correct versions of Node.js (22.x) and pnpm (10.x) as defined in `package.json`. The setup script installs Volta automatically.

## Quick Start

```bash
git clone <repo-url>
cd chatwoot-mobile-app
./scripts/setup/setup.sh
```

**What the setup script installs:**
- **Volta** (manages all Node.js tooling)
  - Node.js 22.x (via Volta)
  - pnpm 10.x (via Volta/Corepack)
- Expo CLI & EAS CLI
- iOS dependencies (macOS only): CocoaPods, Watchman
- Android dependencies: JDK 17, environment configuration
- Project dependencies

**Platform-specific setup:**
```bash
./scripts/setup/setup.sh --ios      # iOS only
./scripts/setup/setup.sh --android  # Android only
./scripts/setup/setup.sh --skip=05,06  # Skip specific scripts (e.g., iOS and Android setup)
```

The setup script automatically configures shell environment variables (JAVA_HOME, ANDROID_HOME, PATH).

After setup completes, **restart your terminal** and verify your setup:
```bash
./scripts/setup/09_verify_setup.sh
```

<details>
<summary><strong>Manual Setup (click to expand)</strong></summary>

### 1. Install Node.js

Using Volta (recommended):
```bash
curl https://get.volta.sh | bash
volta install node@22
```

Or download from [nodejs.org](https://nodejs.org/) (version >=22.12.0)

### 2. Enable pnpm

```bash
corepack enable
pnpm --version  # Verify installation
```

### 3. Install Expo CLI

```bash
npm install -g @expo/cli eas-cli
```

### 4. Clone and Install

```bash
git clone <repo-url>
cd chatwoot-mobile-app
pnpm install
```

### 5. Generate Native Code

```bash
pnpm run generate
```

</details>

## Platform Setup

### iOS (macOS only)

**Requirements:**
- Xcode 16.x (latest version from Mac App Store)
- Xcode Command Line Tools: `xcode-select --install`
- Watchman (installed automatically by setup script for file watching)

**Firebase Setup:**
1. Create Firebase iOS app with bundle ID: `com.chatscommerce.app`
2. Download `GoogleService-Info.plist` files and place in:
   - `/credentials/ios/GoogleService-Info.plist` (production)
   - `/credentials/ios/GoogleService-Info-dev.plist` (development)

**Run on iOS:**
```bash
pnpm run ios:dev
```

**Common Issues:**
- CocoaPods issues: `cd ios && pod install`
- Build failures: Clear Derived Data in Xcode (Xcode > Settings > Locations > Derived Data)

### Android

**Requirements:**
- Android Studio with SDK 35
- JDK 17 (installed by setup script)

**Environment Variables** (auto-configured by setup script):
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
# JAVA_HOME is auto-detected. Common paths:
# - macOS (Homebrew ARM): /opt/homebrew/opt/openjdk@17
# - macOS (Homebrew Intel): /usr/local/opt/openjdk@17
# - macOS (Temurin cask): /Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
```

**Required SDK Components** (install via Android Studio SDK Manager):
- Android SDK Platform 35
- Android SDK Build-Tools 35.x
- Android SDK Platform-Tools
- Android Emulator
- Intel HAXM (Intel Macs) or Android Emulator hypervisor (Apple Silicon)

**Firebase Setup:**
1. Create Firebase Android app with package name: `com.chatscommerce.app`
2. Download `google-services.json` files and place in:
   - `/credentials/android/google-services.json` (production)
   - `/credentials/android/google-services-dev.json` (development)

**Run on Android:**
```bash
pnpm run android:dev
```

**Common Issues:**
- SDK not found: Verify `ANDROID_HOME` is set correctly
- Emulator issues: Ensure AVD is running before starting the app

## Development

### Running the App

| Command | Description |
|---------|-------------|
| `pnpm start` | Start Expo development server |
| `pnpm run ios:dev` | Run on iOS simulator |
| `pnpm run android:dev` | Run on Android emulator |
| `pnpm run start:storybook` | Start Storybook for component development |

### Environment Configuration

Environment variables are managed through Expo's dashboard and downloaded using scripts:

```bash
pnpm run env:pull:dev   # Pull development environment
pnpm run env:pull:prod  # Pull production environment
```

**Key environment variables:**
- `EXPO_PUBLIC_BASE_URL` - API base URL (required)
- `EXPO_PUBLIC_SENTRY_DSN` - Sentry error tracking (optional)
- Firebase config files (`GoogleService-Info.plist`, `google-services.json`)

### Available Scripts

**Development:**
| Script | Description |
|--------|-------------|
| `pnpm start` | Start Expo development server |
| `pnpm run android:dev` | Run on Android with dev environment |
| `pnpm run ios:dev` | Run on iOS with dev environment |
| `pnpm run generate` | Generate native code (clean prebuild) |
| `pnpm run generate:soft` | Soft prebuild (preserves changes) |

**Environment:**
| Script | Description |
|--------|-------------|
| `pnpm run env:pull:dev` | Pull development environment variables |
| `pnpm run env:pull:prod` | Pull production environment variables |

**iOS Development:**
| Script | Description |
|--------|-------------|
| `pnpm run ios:dev` | Run app on iOS simulator (dev mode) |
| `pnpm run ios:pods` | Install CocoaPods dependencies |
| `pnpm run ios:simulator` | Build for iOS simulator (no code signing) |
| `pnpm run ios:clean` | Clean iOS build artifacts and pods |
| `pnpm run ios:logs` | Stream logs from iOS simulator |
| `pnpm run build:ios:local` | Build iOS locally (requires certificates) |
| `pnpm run build:ios:prod` | Build iOS via EAS cloud |

**Project Generation:**
| Script | Description |
|--------|-------------|
| `pnpm run generate` | Generate fresh ios/ and android/ folders (clean prebuild) |
| `pnpm run generate:soft` | Regenerate without cleaning existing native folders |

**Building:**
| Script | Description |
|--------|-------------|
| `pnpm run build:android:local` | Build Android locally |
| `pnpm run build:android:prod` | Build Android via EAS |

**Quality:**
| Script | Description |
|--------|-------------|
| `pnpm test` | Run tests |
| `pnpm run lint` | Run ESLint |
| `pnpm run format` | Format code with Prettier |
| `pnpm run run:doctor` | Run Expo diagnostics |

**Storybook:**
| Script | Description |
|--------|-------------|
| `pnpm run start:storybook` | Start Storybook server |
| `pnpm run storybook:ios` | Run Storybook on iOS |
| `pnpm run storybook:android` | Run Storybook on Android |

## Building & Deployment

### Local Builds

```bash
pnpm run build:android:local  # Build Android APK/AAB locally
pnpm run build:ios:local      # Build iOS IPA locally
```

### Cloud Builds (EAS)

```bash
pnpm run build:android:prod   # Build Android via EAS
pnpm run build:ios:prod       # Build iOS via EAS
```

### CI/CD

When a Pull Request is merged to the `main` branch:
1. Production builds are automatically created for both platforms via EAS Build
2. Android app is submitted to Google Play Store (internal track)
3. iOS app is submitted to Apple App Store for review

## Troubleshooting

<details>
<summary><strong>Metro bundler issues</strong></summary>

```bash
# Clear caches and reinstall
pnpm run clean
pnpm install
```

Or restart with cache cleared:
```bash
pnpm start --clear
```

</details>

<details>
<summary><strong>Environment variable issues</strong></summary>

1. Pull fresh environment variables:
   ```bash
   pnpm run env:pull:dev
   ```
2. Restart the development server after changes
3. Ensure `.env` file exists in project root

</details>

<details>
<summary><strong>iOS build failures</strong></summary>

- Update Xcode to the latest version
- Reinstall pods: `cd ios && pod install --repo-update`
- Clear Derived Data: Xcode > Settings > Locations > Derived Data > Delete

</details>

<details>
<summary><strong>Android build failures</strong></summary>

- Verify `ANDROID_HOME` environment variable: `echo $ANDROID_HOME`
- Verify `JAVA_HOME` points to JDK 17: `java --version`
- Run setup verification: `./scripts/setup/09_verify_setup.sh`

</details>

## Contributing

1. Branch from `development` (not `main`)
2. Make changes and test on both platforms
3. Run linting before committing:
   ```bash
   pnpm run lint
   pnpm run format
   ```
4. Run tests: `pnpm test`
5. Create Pull Request to `development` branch
6. After review and approval, merge to `development`
7. When ready for release, merge `development` to `main` (triggers automatic deployment)
