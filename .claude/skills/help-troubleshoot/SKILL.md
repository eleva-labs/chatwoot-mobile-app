---
name: help-troubleshoot
description: >-
  Diagnose and resolve common development issues.
  Use when encountering build errors, runtime issues, platform-specific
  problems, or performance issues.
  Invoked by: "error", "issue", "problem", "not working", "debug", "fix",
  "troubleshoot", "help".
---

# Troubleshooting SOP

**Version**: 1.0.0
**Last Updated**: 2026-01-11
**Status**: Active

---

## Overview

### Purpose

Systematic diagnosis and resolution of common development issues for React Native/Expo mobile applications. Covers build issues, runtime errors, platform-specific problems, and performance issues.

### When to Use

**ALWAYS**: Build failures, app crashes, runtime errors, platform-specific issues, performance problems
**SKIP**: Feature requests, architecture questions, code review

---

## Quick Start

1. **Identify issue category**: Build, Runtime, Platform, or Performance
2. **Check logs**: Metro terminal, device logs, error messages
3. **Try quick fixes**: Clear cache, reinstall deps, restart Metro
4. **Search common issues**: Check BUILD_ISSUES.md, RUNTIME_ISSUES.md, or PLATFORM_ISSUES.md for categorized issues
5. **Apply specific solution**: Follow step-by-step resolution

---

## Issue Categories

Issues are organized into separate files by category for easier navigation:

| Category     | File                                     | Description                               |
| ------------ | ---------------------------------------- | ----------------------------------------- |
| **Build**    | [BUILD_ISSUES.md](BUILD_ISSUES.md)       | Metro, native builds, TypeScript, caching |
| **Runtime**  | [RUNTIME_ISSUES.md](RUNTIME_ISSUES.md)   | Crashes, state, navigation, hot reload    |
| **Platform** | [PLATFORM_ISSUES.md](PLATFORM_ISSUES.md) | iOS and Android specific issues           |

### Quick Category Reference

**Build Issues** (see [BUILD_ISSUES.md](BUILD_ISSUES.md))

- Metro bundler problems
- Native code build failures
- TypeScript compilation errors
- Build cache issues (ccache, EAS cache)

**Runtime Issues** (see [RUNTIME_ISSUES.md](RUNTIME_ISSUES.md))

- App crashes on startup
- Redux state problems
- Navigation failures
- Hot reload not working

**Platform-Specific Issues** (see [PLATFORM_ISSUES.md](PLATFORM_ISSUES.md))

- iOS: Xcode, CocoaPods, simulator, Ruby gems
- Android: Gradle, SDK, emulator, ADB

**Setup Issues** - See [/setup](../setup/SKILL.md) skill for environment setup and configuration

---

## Diagnostic Steps

### Step 1: Gather Information

```bash
# Check error message in Metro terminal
# Check device/simulator logs

# iOS logs
npx react-native log-ios

# Android logs
npx react-native log-android
```

### Step 2: Identify Issue Category

| Symptom                                        | Likely Category   |
| ---------------------------------------------- | ----------------- |
| Build fails before app launches                | Build Issue       |
| App crashes immediately                        | Runtime Issue     |
| Works on iOS, fails on Android (or vice versa) | Platform-Specific |
| App is slow or laggy                           | Performance Issue |

### Step 3: Try Quick Fixes

```bash
# Clear Metro cache
pnpm start --reset-cache

# Clear watchman
watchman watch-del-all

# Reinstall dependencies
rm -rf node_modules
pnpm install

# Regenerate native code
pnpm run generate

# Full clean
pnpm run clean

# Recreate local environment
task setup:base

# Verify patches are applied
task verify-patches

# Check local env
cat .env.local
```

### Step 4: Apply Specific Solution

See categorized issue files for detailed solutions:

- [BUILD_ISSUES.md](BUILD_ISSUES.md) - Build and compilation issues
- [RUNTIME_ISSUES.md](RUNTIME_ISSUES.md) - App crashes and runtime errors
- [PLATFORM_ISSUES.md](PLATFORM_ISSUES.md) - iOS/Android specific issues
- For setup/environment issues, see [/setup](../setup/SKILL.md) skill

---

## Quick Fixes Reference

### Universal Reset

```bash
# Nuclear option - when all else fails
rm -rf ios android
rm -rf node_modules
pnpm run clean
rm -rf ~/Library/Developer/Xcode/DerivedData  # iOS cache

pnpm install
pnpm run generate
pnpm run ios:dev  # or android:dev
```

### Metro Issues

```bash
pnpm start --reset-cache
```

### iOS Issues

```bash
cd ios
rm -rf build Pods Podfile.lock
pod install
cd ..
pnpm run ios:dev
```

### Android Issues

```bash
cd android
./gradlew clean
cd ..
pnpm run android:dev
```

### TypeScript Issues

```bash
npx tsc --noEmit
```

### Dependency Issues

```bash
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## Common Error Messages

### "Unable to load script" (Android)

**Cause**: Metro not running or not connected
**Fix**:

```bash
# Terminal 1
pnpm start

# Terminal 2
pnpm run android:dev

# For physical device
adb reverse tcp:8081 tcp:8081
```

### "SDK location not found" (Android)

**Cause**: Android SDK not configured
**Fix**: Create `android/local.properties`:

```properties
sdk.dir=/Users/<username>/Library/Android/sdk
```

### "No signing certificate" (iOS)

**Cause**: Missing code signing configuration
**Fix for simulator**: Set `SIMULATOR=1` in `.env.local` (run `task setup:base`)
**Fix for device**: Configure signing in Xcode

### "SIMULATOR variable undefined"

**Cause**: `.env` file missing or incomplete
**Fix**: Run `task setup:base` to recreate environment

### "Sentry auth error during build"

**Cause**: Sentry uploads enabled without valid credentials
**Fix**: Ensure `.env` has `SENTRY_DISABLE_AUTO_UPLOAD=true`

### "Command PhaseScriptExecution failed" (iOS)

**Cause**: CocoaPods issue
**Fix**:

```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Build fails with memory error (Android)

**Cause**: Insufficient Gradle memory
**Fix**: Add to `android/gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=512m
```

---

## Log Locations

| Source       | Command/Location               |
| ------------ | ------------------------------ |
| Metro logs   | Terminal running `pnpm start`  |
| iOS logs     | `npx react-native log-ios`     |
| Android logs | `npx react-native log-android` |
| Redux logs   | Reactotron (development)       |
| Sentry logs  | Sentry dashboard (production)  |

---

## Environment Verification

```bash
# Verify environment setup
task env-check  # or pnpm run check:config

# Check Node version
node -v

# Check pnpm version
pnpm -v

# Check Expo CLI
npx expo --version

# Check iOS simulator
xcrun simctl list devices

# Check Android emulator
adb devices
emulator -list-avds
```

---

## Quick Reference

### Diagnostic Commands

```bash
# Check logs
npx react-native log-ios
npx react-native log-android

# Check TypeScript
npx tsc --noEmit

# Check linting
pnpm run lint

# Run tests
pnpm test

# Check Expo config
pnpm run check:config

# Expo doctor
pnpm run run:doctor
```

### Clean Commands

```bash
# Clear Metro cache
pnpm start --reset-cache

# Clear all caches
pnpm run clean

# Clean iOS
cd ios && pod deintegrate && pod install && cd ..

# Clean Android
cd android && ./gradlew clean && cd ..

# Regenerate native code
pnpm run generate
```

### Run Commands

```bash
# Start Metro
pnpm start

# iOS development
pnpm run ios:dev

# Android development
pnpm run android:dev
```

---

## When to Escalate

Escalate to team when:

- Issue persists after trying all solutions
- Issue affects production
- Issue requires infrastructure changes
- Issue is platform-specific and can't be resolved
- Issue requires external dependencies

---

## Troubleshooting

| Issue                   | Solution                                      |
| ----------------------- | --------------------------------------------- |
| Can't find the error    | Check all log sources, enable verbose logging |
| Fix didn't work         | Try nuclear reset, verify environment         |
| Platform-specific issue | Test on physical device, check platform docs  |
| Intermittent issue      | Check for race conditions, async issues       |

---

## Related SOPs

| Skill                                   | Purpose           | When to Use                |
| --------------------------------------- | ----------------- | -------------------------- |
| [/setup](../setup/SKILL.md)             | Environment setup | When environment is broken |
| [/test-mobile](../test-mobile/SKILL.md) | Testing           | After fixing issues        |

---

**End of SOP**
