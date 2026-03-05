# Build Issues

**Version**: 1.0.0
**Last Updated**: 2026-01-11
**Category**: Build Failures, Compilation Errors, Native Builds, Cache Issues

---

## Metro Bundler Issues

### Issue: Metro Won't Start

**Symptoms:** Metro bundler fails to start, port in use error

**Cause:** Existing Metro process running, port 8081 occupied

**Solution:**

**Commands:**
```bash
# Kill existing Metro process
lsof -ti:8081 | xargs kill -9

# Clear Metro cache
pnpm start --reset-cache

# Clear watchman
watchman watch-del-all

# Reinstall dependencies
rm -rf node_modules
pnpm install
```

**Prevention:** Close Metro properly, don't run multiple instances

---

### Issue: Bundling Fails

**Symptoms:** "Unable to resolve module", syntax errors during bundling

**Cause:** Missing modules, syntax errors, circular dependencies

**Solution:**

**Commands:**
```bash
# Clear Metro cache
pnpm start --reset-cache

# Check for syntax errors
npx tsc --noEmit

# Verify import paths
# Check file exists at import path
# Check for circular dependencies
```

**Prevention:** Run TypeScript checks before committing

---

## Native Code Build Issues

### Issue: iOS Build Fails

**Symptoms:** Xcode build errors, CocoaPods issues

**Cause:** Outdated pods, corrupted build cache, dependency issues

**Solution:**

**Commands:**
```bash
# Clean and reinstall pods
cd ios
rm -rf build Pods Podfile.lock
pod install
cd ..

# Regenerate native code
pnpm run generate

# Clear Xcode derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Rebuild
pnpm run ios:dev
```

**Prevention:** Keep Xcode updated, regenerate after dependency changes

---

### Issue: Android Build Fails

**Symptoms:** Gradle errors, SDK issues

**Cause:** SDK path not configured, Gradle cache issues

**Solution:**

**Commands:**
```bash
# Clean Gradle
cd android
./gradlew clean
cd ..

# Regenerate native code
pnpm run generate

# If SDK not found, create android/local.properties:
# sdk.dir=/Users/<username>/Library/Android/sdk

# Rebuild
pnpm run android:dev
```

**Prevention:** Keep Android Studio updated, verify SDK path

---

### Issue: Command PhaseScriptExecution Failed (iOS)

**Symptoms:** iOS build fails with script execution error

**Cause:** CocoaPods misconfiguration or corrupted state

**Solution:**

**Commands:**
```bash
cd ios
pod deintegrate
pod install
cd ..
pnpm run ios:dev
```

**Prevention:** Run `pod install` after dependency changes

---

### Issue: Build Memory Error (Android)

**Symptoms:** Out of memory during Gradle build

**Cause:** Insufficient JVM heap allocation

**Solution:** Add to `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=512m
```

**Prevention:** Allocate sufficient memory for builds

---

## TypeScript Compilation Errors

### Issue: Type Errors

**Symptoms:** TypeScript compilation fails

**Cause:** Type mismatches, missing type definitions

**Solution:**

**Commands:**
```bash
# Check all TypeScript errors
npx tsc --noEmit

# Common fixes:
# - Add proper types (avoid 'any')
# - Update interface definitions
# - Fix import paths
```

**Prevention:** Run type checking frequently

---

## Build Cache Issues

### Issue: ccache Not Working

**Symptoms:** Build times haven't improved, `ccache -s` shows no hits

**Cause:** ccache not installed, PATH not configured, or Xcode not launched from terminal

**Solution:**
1. Verify ccache is installed:
   ```bash
   ccache --version
   which ccache
   ```

2. Verify PATH includes ccache:
   ```bash
   echo $PATH | grep ccache
   ```

3. Launch Xcode from terminal (required for ccache):
   ```bash
   xed ios/ChatscommerceDev.xcworkspace
   ```

4. Verify ccache is enabled in Podfile.properties.json:
   ```json
   "apple.ccacheEnabled": "true"
   ```

**Commands:**
```bash
# Check ccache stats
task ccache-stats

# Clear ccache if needed
task ccache-clear
```

**Prevention:** Always launch Xcode from terminal for native development

---

### Issue: expo-build-disk-cache Not Working

**Symptoms:** Rebuilds still slow, cache directory empty

**Cause:** Feature requires Expo SDK 53+, not properly configured

**Solution:**
1. Verify package is installed:
   ```bash
   pnpm list expo-build-disk-cache
   ```

2. Verify configuration in app.config.ts includes:
   ```typescript
   experiments: {
     buildCacheProvider: {
       plugin: 'expo-build-disk-cache',
     },
   },
   ```

3. Check cache directory exists:
   ```bash
   ls -la node_modules/.expo-build-disk-cache
   ```

**Commands:**
```bash
# Regenerate native code
task generate
```

**Prevention:** Run `task generate` after fresh install

---

### Issue: Stale Cache Causing Build Failures

**Symptoms:** Strange build errors after dependency updates

**Cause:** Cached artifacts incompatible with new dependencies

**Solution:**

**Commands:**
```bash
# Clear all caches
task clean-all-caches

# Reinstall and rebuild
pnpm install
task generate
```

**Prevention:** Clear caches after major dependency updates

---

## Related Documentation

- [COMMON_ISSUES.md](COMMON_ISSUES.md) - Issue index
- [PLATFORM_ISSUES.md](PLATFORM_ISSUES.md) - Platform-specific build issues
- [SKILL.md](SKILL.md) - Troubleshooting overview

---

**End of Build Issues**
