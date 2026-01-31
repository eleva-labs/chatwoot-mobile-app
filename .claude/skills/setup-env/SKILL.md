---
name: setup-env
description: >-
  Set up any part of the development environment for the Chatscommerce Mobile App.
  Use when onboarding, setting up a new machine, or troubleshooting
  environment issues.
  Invoked by: "setup", "dev setup", "environment setup", "install dependencies".
---

# Development Environment Setup

**Version**: 2.0.0
**Last Updated**: 2026-01-30
**Status**: Active

---

## Quick Reference

### Complete Setup Commands

```bash
# Full setup (includes base + iOS + Android + E2E)
task setup:full

# Quick setup (dependencies + environment only)
task setup:quick

# Base setup (dependencies + .env creation + EAS pull)
task setup:base

# iOS setup only
task setup:ios

# Android setup only
task setup:android

# E2E testing setup (Maestro)
task setup:e2e
```

### Verification Commands

```bash
# Check prerequisites
task check-prereqs

# Verify environment variables
task env-check

# Verify patches applied
task verify-patches
```

### Daily Development

```bash
# Start iOS development
task ios:run

# Start Android development
task android:run

# Run tests
task test

# Clean and regenerate
task clean && task generate
```

---

## Setup Decision Tree

**Choose your setup path:**

| Scenario                     | Command                                 | Time      |
| ---------------------------- | --------------------------------------- | --------- |
| **New machine setup**        | `task setup:full`                       | 10-15 min |
| **Just cloned repo**         | `task setup:quick`                      | 2-3 min   |
| **Environment issues**       | `task setup:base`                       | 1-2 min   |
| **iOS development only**     | `task setup:base && task setup:ios`     | 5 min     |
| **Android development only** | `task setup:base && task setup:android` | 5 min     |
| **E2E testing setup**        | `task setup:e2e`                        | 3 min     |

---

## What Each Task Does

### `task setup:full`

Complete setup including:

- Install Volta and Node.js 20
- Install development tools (Watchman, Task, pnpm)
- Configure direnv
- Create `.env` file and pull from EAS
- Setup iOS development tools (macOS only)
- Setup Android development tools
- Setup E2E testing (Maestro)

### `task setup:quick`

Fast setup for existing environments:

- `pnpm install` (dependencies + patches)
- Create `.env` file
- Pull environment from EAS
- Verify patches applied

### `task setup:base`

Environment configuration only:

- Create `.env` file with local settings
- Pull environment from EAS development
- Configure `ios/.xcode.env.local` with Node path

### `task setup:ios`

iOS-specific tools:

- Install ccache (build caching)
- Configure ccache
- Verify Xcode installation

### `task setup:android`

Android-specific configuration:

- Verify Android SDK location
- Create `android/local.properties`
- Verify ADB availability

### `task setup:e2e`

E2E testing tools:

- Install Maestro CLI
- Verify Maestro installation
- Create `.env.maestro` from `.env.maestro.example`

---

## Prerequisites

### Required Tools

Before running setup, ensure you have:

**macOS** (required for iOS development):

- Xcode (from Mac App Store - ~10GB)
- Command Line Tools: `xcode-select --install`
- Homebrew: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`

**All Platforms**:

- Git
- Terminal/shell access

### What Gets Auto-Installed

The setup tasks automatically install:

- Volta (Node version manager)
- Node.js 20 (via Volta)
- pnpm (package manager)
- Watchman (file watcher for Metro)
- Task (task runner)
- direnv (environment management)

---

## Environment Configuration

### Environment File Strategy

This project uses two environment files:

| File                   | Purpose                                        | Git Status | Created By        |
| ---------------------- | ---------------------------------------------- | ---------- | ----------------- |
| `.env.example`         | Template with defaults                         | Committed  | Repo              |
| `.env`                 | Actual values (base from EAS, local overrides) | Gitignored | `task setup:base` |
| `.env.maestro.example` | E2E testing template                           | Committed  | Repo              |
| `.env.maestro`         | E2E testing configuration                      | Gitignored | `task setup:e2e`  |

**IMPORTANT**: Use `.env` for all configuration. There is no `.env.local` file.

### How Environment Loading Works

The `Taskfile.yml` loads environment files in order:

```yaml
dotenv:
  - .env.example # Defaults
  - .env # Overrides
```

This means:

1. `.env.example` provides default values
2. `.env` overrides with actual/secret values
3. Later files win for any variable

### Key Environment Variables

**Build Configuration:**

```bash
ENVIRONMENT=dev           # Environment: dev | prod
SIMULATOR=1               # Build target: 0=device, 1=simulator (iOS)
```

**Development Settings:**

```bash
SENTRY_DISABLE_AUTO_UPLOAD=true   # Prevent Sentry upload errors
```

**Creating/Updating .env:**

```bash
# Regenerate .env from EAS
task setup:base

# Pull production environment
pnpm run expo:env:pull:prod
```

### Variable Access Rules

| Prefix          | Available At       | Example                    |
| --------------- | ------------------ | -------------------------- |
| `EXPO_PUBLIC_*` | Runtime (app code) | `EXPO_PUBLIC_BASE_URL`     |
| No prefix       | Build time only    | `ENVIRONMENT`, `SIMULATOR` |

---

## Platform-Specific Notes

### iOS Development (macOS Only)

#### Code Signing for Simulators

**The `SIMULATOR` environment variable controls code signing:**

| Value         | Target          | Code Signing           |
| ------------- | --------------- | ---------------------- |
| `SIMULATOR=1` | iOS Simulator   | Not required (default) |
| `SIMULATOR=0` | Physical device | Required               |

**Default:** `SIMULATOR=1` is set in `.env.example`

**To switch targets**, edit `.env`:

```bash
SIMULATOR=1  # For simulator (default)
SIMULATOR=0  # For physical device
```

Then rebuild: `task ios:run`

#### ccache Build Caching

ccache speeds up iOS builds by 40-50%. It's installed by `task setup:ios`.

**Critical requirement:** Launch Xcode from terminal to use ccache:

```bash
# Launch Xcode with ccache in PATH
xed ios/ChatscommerceDev.xcworkspace
```

**Verify ccache is working:**

```bash
ccache -s  # Show statistics
```

**Clear ccache if needed:**

```bash
task utils:ccache-clear
# or
ccache -C
```

#### Simulator Management

**List available simulators:**

```bash
xcrun simctl list devices
```

**Open Simulator:**

```bash
open -a Simulator
```

**Reset simulator:**

```bash
xcrun simctl shutdown all
xcrun simctl erase all
```

#### Common iOS Issues

| Issue                                 | Solution                                             |
| ------------------------------------- | ---------------------------------------------------- |
| "No signing certificate"              | Ensure `SIMULATOR=1` in `.env` for simulator         |
| "Command PhaseScriptExecution failed" | `cd ios && pod deintegrate && pod install && cd ..`  |
| ccache not working                    | Launch Xcode from terminal: `xed ios/*.xcworkspace`  |
| Simulator not appearing               | `killall Simulator && open -a Simulator`             |
| Build too slow                        | Verify ccache: `ccache -s`, use `task generate-soft` |

### Android Development

#### ANDROID_HOME Variable

Android requires the `ANDROID_HOME` environment variable.

**macOS/Linux** - Add to shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
# macOS
export ANDROID_HOME=$HOME/Library/Android/sdk

# Linux
export ANDROID_HOME=$HOME/Android/Sdk

export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

**Windows** - Set via System Properties > Environment Variables:

- Name: `ANDROID_HOME`
- Value: `C:\Users\<username>\AppData\Local\Android\Sdk`

**Verify:**

```bash
echo $ANDROID_HOME
adb --version
```

#### local.properties File

Android requires `android/local.properties` with SDK location.

**Created automatically by** `task setup:android`

**Manual creation:**

```properties
sdk.dir=/Users/<username>/Library/Android/sdk
```

#### ADB Commands

**Common ADB operations:**

```bash
# List devices
adb devices

# Reverse port (for Metro connection on physical device)
adb reverse tcp:8081 tcp:8081

# Clear app data
adb shell pm clear com.chatscommerce.app.dev

# Install APK
adb install app.apk

# Uninstall app
adb uninstall com.chatscommerce.app.dev

# View logs
adb logcat | grep "ReactNative"
```

#### Emulator Management

**List available emulators:**

```bash
emulator -list-avds
```

**Start emulator:**

```bash
emulator -avd <avd_name>
```

**Wipe emulator data:**

```bash
emulator -avd <avd_name> -wipe-data
```

#### Common Android Issues

| Issue                                 | Solution                                                        |
| ------------------------------------- | --------------------------------------------------------------- |
| "SDK location not found"              | Create `android/local.properties` with sdk.dir                  |
| "Unable to load script"               | Start Metro: `task start`, then `adb reverse tcp:8081 tcp:8081` |
| "INSTALL_FAILED_INSUFFICIENT_STORAGE" | `emulator -avd <name> -wipe-data` or increase storage           |
| Gradle sync failed                    | Open android/ in Android Studio, click "Sync Project"           |
| Build memory error                    | Add to `android/gradle.properties`: `org.gradle.jvmargs=-Xmx4g` |
| ADB not found                         | Ensure `ANDROID_HOME` and PATH are set correctly                |

---

## Node Version Management

### Why Volta?

- **Automatic**: No manual `nvm use` commands
- **Fast**: No shell initialization overhead
- **Team-consistent**: Everyone gets same versions
- **Project-scoped**: Versions defined in `package.json`

### How It Works

```bash
# Volta automatically manages Node versions
# When you enter the project directory, Node 20 is automatically activated

cd chatwoot-mobile-app
node --version  # Shows v20.x.x automatically

# Pin additional tools to project
volta pin typescript@5.3.0

# List all pinned tools
volta list
```

### Manual Installation

If `task setup:full` didn't install Volta:

```bash
# Install Volta
curl https://get.volta.sh | bash

# Restart terminal, then setup Node
volta install node@20
volta pin node@20

# Verify
node --version  # Should show v20.x.x
```

---

## Common Issues

### Environment Variables Not Loading

**Symptoms:** Variables undefined, app configuration fails

**Solution:**

```bash
# Verify .env exists
ls -la .env

# Recreate environment
task setup:base

# Verify environment
task env-check
```

### Variables Empty in App Code

**Symptoms:** `process.env.VAR` returns undefined

**Cause:** Only `EXPO_PUBLIC_*` variables available at runtime

**Solution:** Add `EXPO_PUBLIC_` prefix:

```typescript
// Works (runtime)
const url = process.env.EXPO_PUBLIC_BASE_URL;

// Won't work in app (build-time only)
const env = process.env.ENVIRONMENT;
```

### Node Version Mismatch

**Symptoms:** Installation fails, version errors

**Solution:**

```bash
# With Volta (recommended)
volta install node@20
volta pin node@20

# Verify
node --version  # Should show v20.x.x
```

### pnpm Not Installed

**Solution:**

```bash
# Via Volta (recommended)
volta install pnpm

# Via npm
npm install -g pnpm

# Verify
pnpm --version
```

### EAS Pull Fails

**Symptoms:** Can't pull environment from EAS

**Solution:**

```bash
# Login to EAS
npx eas login

# Verify account
npx eas whoami

# Retry
task setup:base
```

---

## Related Skills

| Skill                                              | Purpose         | When to Use                  |
| -------------------------------------------------- | --------------- | ---------------------------- |
| [help-troubleshoot](../help-troubleshoot/SKILL.md) | Issue diagnosis | Build errors, runtime issues |
| [deploy-app](../deploy-app/SKILL.md)               | App deployment  | Building for app stores      |
| [test-mobile](../test-mobile/SKILL.md)             | Testing         | Running tests                |

---

**End of SOP**
