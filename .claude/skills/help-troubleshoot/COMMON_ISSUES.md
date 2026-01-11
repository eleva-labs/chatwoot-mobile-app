# Common Issues Database

**Version**: 2.0.0
**Last Updated**: 2026-01-11
**Status**: Active

---

## Overview

This document serves as an index to categorized troubleshooting guides. Issues are organized by category for easier navigation and maintenance.

---

## Issue Categories

### [Setup Issues](SETUP_ISSUES.md)
Environment setup, dependencies, and installation problems.

**Issues covered:**
- Environment Variables Not Loading
- Variables Empty in App Code
- Expo CLI Version Mismatch
- EAS Build Fails to Initialize
- EAS Pull Fails
- Package Conflicts
- Node Version Mismatch
- pnpm Not Installed

---

### [Build Issues](BUILD_ISSUES.md)
Build failures, compilation errors, native builds, and cache issues.

**Issues covered:**
- Metro Won't Start
- Bundling Fails
- iOS Build Fails
- Android Build Fails
- Command PhaseScriptExecution Failed (iOS)
- Build Memory Error (Android)
- TypeScript Type Errors
- ccache Not Working
- expo-build-disk-cache Not Working
- Stale Cache Causing Build Failures

---

### [Runtime Issues](RUNTIME_ISSUES.md)
App crashes, state management, navigation, API integration, hot reload, and performance.

**Issues covered:**
- Immediate Crash on Startup
- Crash After Login
- State Not Persisting
- State Not Updating
- Navigation Fails
- Deep Linking Doesn't Work
- Network Errors
- Data Not Loading
- Changes Not Reflecting (Hot Reload)
- Fast Refresh Disabled
- List Performance / Slow Scrolling
- Re-render Issues
- Memory Leaks
- High Image Memory Usage
- Safe Area Problems
- Status Bar Issues

---

### [Platform Issues](PLATFORM_ISSUES.md)
iOS-specific and Android-specific issues.

**iOS Issues:**
- Xcode Version Mismatch
- Simulator Not Available
- CocoaPods Issues
- Ruby/CocoaPods Gem Errors
- No Signing Certificate
- Command Line Tools Not Installed

**Android Issues:**
- SDK Not Found
- Emulator Won't Start
- Gradle Sync Failed
- Unable to Load Script Error
- INSTALL_FAILED_INSUFFICIENT_STORAGE
- ADB Device Not Recognized
- Build Variant Not Found

---

## Quick Reference

### Common Commands

```bash
# Environment check
task env-check

# Clean and rebuild
task clean
task generate

# Clear all caches
task clean-all-caches

# Platform-specific runs
task run-ios
task run-android
```

### Clean Slate Reset

When all else fails:

```bash
# Remove generated native projects
rm -rf ios android

# Clear all caches
task clean
rm -rf node_modules

# Reinstall and regenerate
pnpm install
task generate
```

---

## Related Documentation

- [SKILL.md](SKILL.md) - Troubleshooting skill overview
- [Expo Troubleshooting](https://docs.expo.dev/troubleshooting/clear-cache/)
- [React Native Troubleshooting](https://reactnative.dev/docs/troubleshooting)

---

**End of Common Issues Index**
