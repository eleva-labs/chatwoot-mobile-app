# Chatscommerce Mobile App

Quick reference for developers using Task Runner for all development workflows.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Common Commands](#common-commands)
- [Development Workflow](#development-workflow)
- [Quality & Testing](#quality--testing)
- [Troubleshooting](#troubleshooting)
- [Reference](#reference)

---

## Quick Start

```bash
# 1. Install Task Runner - https://taskfile.dev/installation
# 2. Run foundation setup
task setup:base

# 3. Install dependencies
pnpm install

# 4. Setup platform
task ios:setup        # macOS only
task android:setup    # Any OS

# 5. Run the app
task ios:run          # iOS
task android:run      # Android

# 6. See all commands
task --list
```

**Why Task Runner?** Consistent interface, hides complexity, enforces best practices, self-documents.

---

## Prerequisites

**Required:**

- [Task Runner](https://taskfile.dev/installation) - All commands use Task
- Node.js 20.20+ ([Download](https://nodejs.org) or use [nvm](https://github.com/nvm-sh/nvm)/[asdf](https://asdf-vm.com))
- Git
- pnpm (installed via Corepack - see setup below)

**Platform-Specific:**

- **iOS**: macOS, Xcode, Homebrew
- **Android**: Android Studio, Android SDK (API 34 recommended, min 24), JDK
- **E2E**: Java, Maestro (installed via `task setup:e2e`)

---

## Common Commands

### Setup

| Command              | Purpose                                    |
| -------------------- | ------------------------------------------ |
| `task setup:base`    | Node, pnpm, tools, direnv, environment     |
| `task setup:quick`   | Minimal setup (dependencies + environment) |
| `task ios:setup`     | iOS development tools                      |
| `task android:setup` | Android development tools                  |
| `task setup:e2e`     | E2E testing (Maestro)                      |
| `task setup:full`    | All platforms + verification               |
| `task setup:verify`  | Verify setup complete                      |

### Development

| Command              | Purpose                              |
| -------------------- | ------------------------------------ |
| `task dev:start`     | Start Expo dev server                |
| `task dev:stop`      | Stop dev server                      |
| `task dev:restart`   | Restart dev server                   |
| `task ios:run`       | Build and run iOS (full rebuild)     |
| `task ios:start`     | Run iOS (fast iteration)             |
| `task ios:clean`     | Clean iOS caches                     |
| `task android:run`   | Build and run Android (full rebuild) |
| `task android:start` | Run Android (fast iteration)         |
| `task android:clean` | Clean Android caches                 |

### Quality

| Command                   | Purpose                         |
| ------------------------- | ------------------------------- |
| `task quality:check`      | format-check + lint + typecheck |
| `task quality:format-all` | Auto-fix formatting and linting |
| `task quality:test`       | Run unit tests                  |
| `task quality:test-watch` | Tests in watch mode             |

### E2E Testing

| Command                      | Purpose                     |
| ---------------------------- | --------------------------- |
| `task maestro:smoke-ios`     | Quick smoke tests (iOS)     |
| `task maestro:test-ios`      | Full test suite (iOS)       |
| `task maestro:smoke-android` | Quick smoke tests (Android) |
| `task maestro:test-android`  | Full test suite (Android)   |
| `task maestro:studio`        | Launch Maestro Studio GUI   |

### Build & Deploy

| Command            | Purpose                                 |
| ------------------ | --------------------------------------- |
| `task ios:eas`     | Build iOS on EAS cloud (production)     |
| `task android:eas` | Build Android on EAS cloud (production) |

---

## Development Workflow

### First-Time Setup

```bash
# 1. Install Task Runner - https://taskfile.dev/installation
# 2. Clone repo
git clone <repository-url>
cd chatwoot-mobile-app

# 3. Run full setup
task setup:full

# 4. Install dependencies
pnpm install

# 5. Add Firebase credentials to /credentials directory
# See Firebase Setup section below

# 6. Verify
task setup:verify

# 7. Run
task ios:run      # or task android:run
```

### Daily Development

```bash
# Terminal 1: Start dev server
task dev:start

# Terminal 2: Run app (fast iteration)
task ios:start      # or task android:start

# Hot reload happens automatically on code changes

# Before committing
task quality:check
task quality:test
```

### Pre-Commit

```bash
# Run all checks
task quality:check

# Auto-fix issues
task quality:format-all

# Run tests
task quality:test
```

### Production Builds

```bash
# Build on EAS cloud (recommended)
task ios:eas        # iOS for App Store
task android:eas    # Android for Play Store

# Automatic deployment on merge to main branch
```

### Environment Switching

Edit `.env` file in project root:

```bash
# Development
EXPO_PUBLIC_BASE_URL=https://dev-api.example.com
ENVIRONMENT=development

# Production
EXPO_PUBLIC_BASE_URL=https://api.example.com
ENVIRONMENT=production
```

After changing `.env`:

```bash
task dev:restart
task ios:run      # or task android:run
```

### Firebase Setup

**Required for push notifications**

**Android:**

1. Create Firebase Android app: `com.chatscommerce.app`
2. Download `google-services.json` to:
   - `/credentials/android/google-services.json` (production)
   - `/credentials/android/google-services-dev.json` (development)

**iOS:**

1. Create Firebase iOS app: `com.chatscommerce.app`
2. Download `GoogleService-Info.plist` to:
   - `/credentials/ios/GoogleService-Info.plist` (production)
   - `/credentials/ios/GoogleService-Info-dev.plist` (development)

---

## Quality & Testing

### Code Quality

```bash
# Check code quality
task quality:check              # format-check + lint + typecheck

# Auto-fix issues
task quality:format-all         # Format + lint fix

# Individual checks
task quality:lint               # Check linting
task quality:lint-fix           # Fix lint issues
task quality:format             # Format code
task quality:typecheck          # TypeScript check
```

### Unit Testing

```bash
task quality:test               # Run all tests
task quality:test-watch         # Watch mode
task quality:test-coverage      # Coverage report
```

### E2E Testing

```bash
# Quick validation (recommended first)
task maestro:smoke-ios          # iOS smoke tests
task maestro:smoke-android      # Android smoke tests

# Full test suite
task maestro:test-ios           # All iOS tests
task maestro:test-android       # All Android tests

# Test against specific backend
task maestro:test-ios-local     # localhost:3000
task maestro:test-ios-dev       # dev backend

# Exploratory testing
task maestro:studio             # Maestro GUI
```

---

## Troubleshooting

### Quick Diagnostics

```bash
task utils:doctor               # Expo diagnostics
task setup:verify               # Verify setup
task maestro:doctor             # Check Maestro version
```

### Common Issues

#### Metro/Bundler Issues

```bash
task dev:stop
task ios:clean        # or task android:clean
pnpm install
task dev:start
```

#### iOS Build Failures

```bash
task ios:clean
task ios:generate
task setup:verify
```

If CocoaPods issues persist:

```bash
task ios:clean
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
task ios:generate
```

#### Android Build Failures

```bash
task android:clean
task android:generate
task setup:verify
```

If Gradle issues persist:

```bash
task android:clean
rm -rf ~/.gradle/caches
task android:generate
```

#### Environment Variable Issues

```bash
task setup:env-check            # Check current environment
task setup:base                 # Re-pull from Expo
task dev:restart                # Restart dev server
```

#### Dependency Issues

```bash
rm -rf node_modules
pnpm install
task setup:verify-patches       # Verify patches applied
```

### Platform-Specific

**iOS Simulator:**

```bash
task ios:stop
xcrun simctl list devices       # List available
xcrun simctl boot "iPhone 15 Pro"  # Boot specific
```

**Android Emulator:**

```bash
task android:stop
emulator -list-avds             # List available
emulator -avd <avd-name>        # Start specific
task utils:adb-connect          # Connect for debugging
```

---

## Reference

### Tech Stack

- **Node.js**: 18+
- **React Native**: 0.76.9
- **Expo SDK**: ~52.0.46
- **TypeScript**: 5.1.3
- **Min iOS**: 13.0
- **Min Android API**: 24

### Project Structure

```
chatwoot-mobile-app/
├── src/                # App source code
├── ios/                # iOS native (generated)
├── android/            # Android native (generated)
├── credentials/        # Firebase configs (gitignored)
├── maestro/            # E2E test flows
├── scripts/            # Build/setup scripts
├── tasks/              # Task definitions
├── .env                # Environment config
└── Taskfile.yml        # Task runner config
```

### Environment Variables

Key variables in `.env`:

```bash
EXPO_PUBLIC_BASE_URL=<api-url>
ENVIRONMENT=development|production
SIMULATOR=iPhone 15 Pro
```

Check current: `task setup:env-check`

### All Available Tasks

See complete list:

```bash
task --list
```

### Advanced Commands

**iOS:**

| Command                  | Purpose                               |
| ------------------------ | ------------------------------------- |
| `task ios:generate`      | Generate native project (clean)       |
| `task ios:generate-soft` | Generate native project (incremental) |
| `task ios:build`         | Build without running                 |
| `task ios:storybook`     | Run Storybook on iOS                  |

**Android:**

| Command                      | Purpose                               |
| ---------------------------- | ------------------------------------- |
| `task android:generate`      | Generate native project (clean)       |
| `task android:generate-soft` | Generate native project (incremental) |
| `task android:build`         | Build without running                 |
| `task android:storybook`     | Run Storybook on Android              |

**Utilities:**

| Command                    | Purpose                 |
| -------------------------- | ----------------------- |
| `task utils:storybook`     | Start Storybook server  |
| `task utils:build-metrics` | Track build metrics     |
| `task utils:ccache-stats`  | Show ccache stats (iOS) |
| `task utils:ccache-clear`  | Clear ccache (iOS)      |

### Useful Links

- [Task Runner](https://taskfile.dev)
- [Expo Docs](https://docs.expo.dev)
- [React Native](https://reactnative.dev)
- [Maestro](https://maestro.mobile.dev)
- [EAS Build](https://docs.expo.dev/build/introduction/)

### Getting Help

```bash
task utils:doctor
task setup:verify
```

Check `/docs` directory or GitHub issues for more help.

---

**Quick Reference Card:**

```bash
# Most Common Commands
task ios:run           # Run on iOS
task android:run       # Run on Android
task quality:check     # Check code quality
task quality:test      # Run tests
task setup:verify      # Verify setup
task --list            # All commands
```
