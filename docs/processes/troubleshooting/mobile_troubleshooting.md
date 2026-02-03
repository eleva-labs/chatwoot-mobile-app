# Mobile Troubleshooting Guide

**Version**: 1.0.0
**Last Updated**: 2025-01-27
**Status**: Active
**Document Type**: Process Guide
**Project**: Chatwoot Mobile App (React Native + Expo)

---

## Overview

**Purpose**: Common issues and solutions for React Native/Expo mobile app development.

**Scope**:
- ✅ Build issues, runtime issues, platform-specific issues, performance issues, dependency issues
- ❌ Backend API issues, infrastructure issues, deployment issues (separate guides)

**When to Use**: When encountering errors or unexpected behavior during development

---

## Build Issues

### Metro Bundler Issues

**Symptoms**: Metro won't start, bundling fails, cache issues

**Solutions**:
```bash
# Clear Metro cache
pnpm start --reset-cache

# Clear watchman
watchman watch-del-all

# Clear all caches
pnpm run clean
pnpm start --reset-cache

# Reinstall dependencies
rm -rf node_modules
pnpm install
```

**Prevention**: Clear cache regularly, keep dependencies updated

---

### Native Code Build Issues

**Symptoms**: iOS/Android build fails, native module errors

**Solutions**:
```bash
# Regenerate native code
pnpm run generate

# Clean iOS build
cd ios
rm -rf build Pods Podfile.lock
pod install
cd ..

# Clean Android build
cd android
./gradlew clean
cd ..

# Rebuild
pnpm run ios:run  # or android:run
```

**Prevention**: Keep native dependencies updated, regenerate after major dependency changes

---

### TypeScript Compilation Errors

**Symptoms**: Type errors, compilation fails

**Solutions**:
```bash
# Check TypeScript errors
npx tsc --noEmit

# Fix type errors incrementally
# Add proper types, avoid 'any'

# Check tsconfig.json
cat tsconfig.json
```

**Prevention**: Run `npx tsc --noEmit` frequently, use strict TypeScript

---

### Dependency Issues

**Symptoms**: Package conflicts, peer dependency warnings, installation fails

**Solutions**:
```bash
# Clear pnpm cache
pnpm store prune

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check for conflicts
pnpm why <package-name>

# Update dependencies
pnpm update
```

**Prevention**: Keep dependencies updated, resolve conflicts immediately

---

## Runtime Issues

### App Crashes on Startup

**Symptoms**: App crashes immediately on launch

**Solutions**:
1. Check logs:
   ```bash
   # iOS
   npx react-native log-ios

   # Android
   npx react-native log-android
   ```

2. Check Redux Persist migration:
   ```typescript
   // Verify CURRENT_VERSION in src/store/index.ts
   // Update migration if state shape changed
   ```

3. Check environment variables:
   ```bash
   # Verify .env files
   cat .env
   ```

4. Check native modules:
   ```bash
   # Verify all native modules properly linked
   pnpm run generate
   ```

**Prevention**: Test after major changes, verify migrations, check logs regularly

---

### Redux State Issues

**Symptoms**: State not persisting, state not updating, migration errors

**Solutions**:
1. Check Redux Persist config:
   ```typescript
   // Verify persistConfig in src/store/index.ts
   // Check CURRENT_VERSION matches migration
   ```

2. Clear persisted state:
   ```bash
   # Clear AsyncStorage (development only)
   # Use React Native Debugger or device settings
   ```

3. Check action creators:
   ```typescript
   // Verify actions are dispatched correctly
   // Check reducer logic
   ```

4. Check selectors:
   ```typescript
   // Verify selectors are correct
   // Check memoization if performance issue
   ```

**Prevention**: Test Redux changes immediately, verify migrations, use typed actions

---

### Navigation Issues

**Symptoms**: Navigation fails, params not passed, deep linking doesn't work

**Solutions**:
1. Check navigation types:
   ```typescript
   // Verify navigation param types
   // Check screen prop types
   ```

2. Check route definitions:
   ```typescript
   // Verify routes defined in navigation config
   // Check param types match
   ```

3. Check deep linking:
   ```bash
   # Test deep link
   npx uri-scheme open <scheme>://path --ios
   npx uri-scheme open <scheme>://path --android
   ```

4. Check app.config.ts:
   ```typescript
   // Verify scheme and associations
   ```

**Prevention**: Type navigation params, test navigation flows, verify deep linking

---

### API Integration Issues

**Symptoms**: API calls fail, network errors, data not loading

**Solutions**:
1. Check network connectivity:
   ```bash
   # Verify device/emulator has network
   # Check API endpoint accessible
   ```

2. Check API configuration:
   ```typescript
   // Verify base URL in settings
   // Check API endpoints correct
   ```

3. Check error handling:
   ```typescript
   // Verify error handling in API calls
   // Check error messages displayed
   ```

4. Check authentication:
   ```typescript
   // Verify auth tokens
   // Check token expiration
   ```

**Prevention**: Test API integration, handle errors gracefully, verify auth

---

## Platform-Specific Issues

### iOS Issues

**Symptoms**: iOS-specific crashes, UI issues, build failures

**Solutions**:
1. Check Xcode version:
   ```bash
   xcodebuild -version
   # Should match requirements
   ```

2. Check iOS deployment target:
   ```typescript
   // Verify in app.config.ts
   // Check ios.deploymentTarget
   ```

3. Check CocoaPods:
   ```bash
   cd ios
   pod install
   pod update
   cd ..
   ```

4. Check simulator:
   ```bash
   # List available simulators
   xcrun simctl list devices

   # Reset simulator if needed
   xcrun simctl erase all
   ```

**Prevention**: Keep Xcode updated, test on multiple iOS versions, verify CocoaPods

---

### Android Issues

**Symptoms**: Android-specific crashes, UI issues, build failures

**Solutions**:
1. Check Android SDK:
   ```bash
   # Verify Android SDK installed
   # Check ANDROID_HOME set
   echo $ANDROID_HOME
   ```

2. Check Gradle:
   ```bash
   cd android
   ./gradlew clean
   ./gradlew build
   cd ..
   ```

3. Check emulator:
   ```bash
   # List available emulators
   emulator -list-avds

   # Check ADB connection
   adb devices
   ```

4. Check build tools:
   ```bash
   # Verify build tools version
   # Check in android/build.gradle
   ```

**Prevention**: Keep Android Studio updated, test on multiple Android versions, verify Gradle

---

### Platform-Specific UI Issues

**Symptoms**: UI looks different on iOS vs Android, safe area issues

**Solutions**:
1. Check SafeAreaView:
   ```typescript
   // Use SafeAreaView from react-native-safe-area-context
   // Verify edges prop correct
   ```

2. Check platform-specific styles:
   ```typescript
   // Use Platform.select for platform-specific styles
   // Test on both platforms
   ```

3. Check status bar:
   ```typescript
   // Verify StatusBar configuration
   // Check barStyle and backgroundColor
   ```

**Prevention**: Test on both platforms, use SafeAreaView, verify platform-specific code

---

## Performance Issues

### Slow Rendering

**Symptoms**: UI lag, slow scrolling, janky animations

**Solutions**:
1. Check list performance:
   ```typescript
   // Use FlashList instead of FlatList
   // Verify getItemType and keyExtractor
   ```

2. Check re-renders:
   ```typescript
   // Use React.memo for components
   // Use useMemo/useCallback for expensive operations
   ```

3. Check image optimization:
   ```typescript
   // Use expo-image for optimized images
   // Verify image sizes
   ```

4. Profile performance:
   ```bash
   # Use React DevTools Profiler
   # Use Flipper for performance monitoring
   ```

**Prevention**: Optimize lists, minimize re-renders, optimize images, profile regularly

---

### Memory Issues

**Symptoms**: App crashes due to memory, memory leaks

**Solutions**:
1. Check for leaks:
   ```typescript
   // Verify cleanup in useEffect
   // Check for circular references
   ```

2. Check image memory:
   ```typescript
   // Limit image sizes
   // Use appropriate image formats
   ```

3. Check Redux state:
   ```typescript
   // Avoid storing large objects in Redux
   // Use selectors to filter data
   ```

4. Profile memory:
   ```bash
   # Use Xcode Instruments (iOS)
   # Use Android Profiler (Android)
   ```

**Prevention**: Clean up effects, limit state size, profile memory, optimize images

---

## Development Environment Issues

### Expo CLI Issues

**Symptoms**: Expo commands fail, version mismatches

**Solutions**:
```bash
# Update Expo CLI
npm install -g expo-cli@latest

# Check Expo version
npx expo --version

# Clear Expo cache
expo start --clear
```

**Prevention**: Keep Expo CLI updated, clear cache regularly

---

### EAS Build Issues

**Symptoms**: EAS builds fail, configuration errors

**Solutions**:
1. Check eas.json:
   ```json
   // Verify build profiles
   // Check environment variables
   ```

2. Check app.config.ts:
   ```typescript
   // Verify app configuration
   // Check version and build numbers
   ```

3. Check credentials:
   ```bash
   # Verify credentials
   eas credentials
   ```

**Prevention**: Verify configuration, test builds regularly, keep credentials updated

---

## Quick Reference

### Common Commands

```bash
# Clear all caches
pnpm run clean
pnpm start --reset-cache

# Regenerate native code
pnpm run generate

# Type checking
npx tsc --noEmit

# Linting
pnpm run lint

# Run tests
pnpm test

# iOS development
pnpm run ios:run

# Android development
pnpm run android:run

# Check Expo config
pnpm run doctor:config

# Expo doctor
pnpm run doctor
```

### Log Locations

- **Metro logs**: Terminal output
- **iOS logs**: `npx react-native log-ios`
- **Android logs**: `npx react-native log-android`
- **Redux logs**: Reactotron (development)
- **Sentry logs**: Sentry dashboard (production)

---

## When to Escalate

Escalate to team when:
- Issue persists after trying all solutions
- Issue affects production
- Issue requires infrastructure changes
- Issue is platform-specific and can't be resolved
- Issue requires external dependencies

---

## Related Documentation

- [Development Process](../development/development_process.md) - Development workflow
- [Mobile Testing Process](../tests/mobile_testing_process.md) - Testing procedures
- [Expo Troubleshooting](https://docs.expo.dev/troubleshooting/clear-cache/) - Expo-specific issues
- [React Native Troubleshooting](https://reactnative.dev/docs/troubleshooting) - React Native issues

---

## Changelog

### Version 1.0.0 (2025-01-27)
**Status**: Active
**Changes**: Initial version for React Native/Expo mobile app troubleshooting

---

**End of Document**

