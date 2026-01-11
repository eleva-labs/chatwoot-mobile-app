# Common Issues Database

**Version**: 1.0.0
**Last Updated**: 2026-01-11
**Status**: Active

---

## Build Issues

### Metro Bundler Issues

#### Metro Won't Start
**Symptoms**: Metro bundler fails to start, port in use error

**Solutions**:
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

**Prevention**: Close Metro properly, don't run multiple instances

---

#### Bundling Fails
**Symptoms**: "Unable to resolve module", syntax errors during bundling

**Solutions**:
```bash
# Clear Metro cache
pnpm start --reset-cache

# Check for syntax errors
npx tsc --noEmit

# Verify import paths
# Check file exists at import path
# Check for circular dependencies
```

**Prevention**: Run TypeScript checks before committing

---

### Native Code Build Issues

#### iOS Build Fails
**Symptoms**: Xcode build errors, CocoaPods issues

**Solutions**:
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

**Prevention**: Keep Xcode updated, regenerate after dependency changes

---

#### Android Build Fails
**Symptoms**: Gradle errors, SDK issues

**Solutions**:
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

**Prevention**: Keep Android Studio updated, verify SDK path

---

#### "Command PhaseScriptExecution failed" (iOS)
**Symptoms**: iOS build fails with script execution error

**Solutions**:
```bash
cd ios
pod deintegrate
pod install
cd ..
pnpm run ios:dev
```

**Prevention**: Run `pod install` after dependency changes

---

#### Build Memory Error (Android)
**Symptoms**: Out of memory during Gradle build

**Solution**: Add to `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=512m
```

**Prevention**: Allocate sufficient memory for builds

---

### TypeScript Compilation Errors

#### Type Errors
**Symptoms**: TypeScript compilation fails

**Solutions**:
```bash
# Check all TypeScript errors
npx tsc --noEmit

# Common fixes:
# - Add proper types (avoid 'any')
# - Update interface definitions
# - Fix import paths
```

**Prevention**: Run type checking frequently

---

### Dependency Issues

#### Package Conflicts
**Symptoms**: Peer dependency warnings, installation fails

**Solutions**:
```bash
# Clear pnpm cache
pnpm store prune

# Reinstall from scratch
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check for conflicts
pnpm why <package-name>
```

**Prevention**: Resolve conflicts immediately, keep deps updated

---

## Runtime Issues

### App Crashes on Startup

#### Immediate Crash
**Symptoms**: App crashes before showing any UI

**Solutions**:
1. Check logs:
   ```bash
   npx react-native log-ios
   npx react-native log-android
   ```

2. Check Redux Persist migration:
   ```typescript
   // Verify CURRENT_VERSION in src/store/index.ts
   // Update migration if state shape changed
   ```

3. Check environment variables:
   ```bash
   cat .env
   ```

4. Regenerate native code:
   ```bash
   pnpm run generate
   ```

**Prevention**: Test after major changes, verify migrations

---

#### Crash After Login
**Symptoms**: App works initially, crashes after auth

**Solutions**:
1. Check Redux state shape
2. Verify API response handling
3. Check navigation params
4. Review error boundaries

**Prevention**: Add error handling, test auth flows

---

### Redux State Issues

#### State Not Persisting
**Symptoms**: Data lost after app restart

**Solutions**:
1. Check `persistConfig` in `src/store/index.ts`
2. Verify `CURRENT_VERSION` matches migration
3. Check whitelist/blacklist in persist config

**Prevention**: Test persistence after state changes

---

#### State Not Updating
**Symptoms**: UI doesn't reflect state changes

**Solutions**:
1. Verify action is dispatched correctly
2. Check reducer logic
3. Verify selector is correct
4. Check for memoization issues

**Prevention**: Use Redux DevTools, test reducers

---

### Navigation Issues

#### Navigation Fails
**Symptoms**: Can't navigate to screen, params missing

**Solutions**:
1. Verify route is defined in navigator
2. Check navigation param types
3. Verify screen component exists
4. Check for navigation nesting issues

**Prevention**: Type navigation params, test flows

---

#### Deep Linking Doesn't Work
**Symptoms**: App URLs don't open correct screen

**Solutions**:
```bash
# Test deep link
npx uri-scheme open <scheme>://path --ios
npx uri-scheme open <scheme>://path --android
```

Check `app.config.ts` for scheme configuration.

**Prevention**: Test deep links after route changes

---

### API Integration Issues

#### Network Errors
**Symptoms**: API calls fail, timeout errors

**Solutions**:
1. Verify network connectivity
2. Check API endpoint URL
3. Verify authentication tokens
4. Check CORS configuration (web)

**Prevention**: Add error handling, test with mocked API

---

#### Data Not Loading
**Symptoms**: Empty screens, loading forever

**Solutions**:
1. Check API response format
2. Verify data parsing logic
3. Check for async issues
4. Verify error handling

**Prevention**: Handle loading and error states

---

## Platform-Specific Issues

### iOS Issues

#### Xcode Version Mismatch
**Symptoms**: Build fails, API deprecated warnings

**Solutions**:
```bash
# Check Xcode version
xcodebuild -version

# Update Xcode from App Store
# Accept license
sudo xcodebuild -license accept
```

**Prevention**: Keep Xcode updated

---

#### Simulator Not Available
**Symptoms**: Can't find simulator, simulator won't start

**Solutions**:
```bash
# Kill simulator
killall Simulator

# List available simulators
xcrun simctl list devices

# Boot specific simulator
xcrun simctl boot "iPhone 15 Pro"

# Open simulator app
open -a Simulator
```

**Prevention**: Verify simulator installed in Xcode

---

#### CocoaPods Issues
**Symptoms**: Pod install fails, version conflicts

**Solutions**:
```bash
# Update CocoaPods
sudo gem install cocoapods

# Clear pod cache
pod cache clean --all

# Reinstall pods
cd ios
pod deintegrate
pod install
cd ..
```

**Prevention**: Keep CocoaPods updated

---

#### No Signing Certificate
**Symptoms**: Code signing error

**For simulator**:
Set `SIMULATOR=1` in `.env`

**For device**:
1. Open `ios/ChatscommerceDev.xcworkspace`
2. Select project > Signing & Capabilities
3. Enable "Automatically manage signing"
4. Select your Team

**Prevention**: Configure signing before device testing

---

### Android Issues

#### SDK Not Found
**Symptoms**: "SDK location not found" error

**Solution**: Create `android/local.properties`:
```properties
sdk.dir=/Users/<username>/Library/Android/sdk
```

Or set environment variable:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
```

**Prevention**: Set ANDROID_HOME in shell profile

---

#### Emulator Won't Start
**Symptoms**: Emulator fails to boot, slow performance

**Solutions**:
```bash
# List emulators
emulator -list-avds

# Start with verbose output
emulator -avd <avd_name> -verbose

# Wipe emulator data
emulator -avd <avd_name> -wipe-data
```

**Prevention**: Allocate sufficient RAM, use x86_64 images

---

#### Gradle Sync Failed
**Symptoms**: Android Studio can't sync project

**Solutions**:
1. Open `android/` in Android Studio
2. Click "Sync Project with Gradle Files"
3. If still failing: File > Invalidate Caches > Restart

**Prevention**: Keep Android Studio and Gradle updated

---

#### "Unable to load script" Error
**Symptoms**: App shows error loading JavaScript

**Solutions**:
```bash
# Ensure Metro is running
pnpm start

# For physical device, forward port
adb reverse tcp:8081 tcp:8081

# Verify device is connected
adb devices
```

**Prevention**: Start Metro before running app

---

#### INSTALL_FAILED_INSUFFICIENT_STORAGE
**Symptoms**: Can't install app on emulator

**Solutions**:
```bash
# Wipe emulator data
emulator -avd <avd_name> -wipe-data
```

Or increase storage in AVD Manager.

**Prevention**: Clean old apps, allocate sufficient storage

---

### Platform UI Issues

#### Safe Area Problems
**Symptoms**: Content overlaps notch, home indicator

**Solutions**:
```typescript
// Use SafeAreaView from react-native-safe-area-context
import { SafeAreaView } from 'react-native-safe-area-context';

// Specify edges
<SafeAreaView edges={['top', 'bottom']}>
```

**Prevention**: Always use SafeAreaView, test on devices with notch

---

#### Status Bar Issues
**Symptoms**: Status bar color wrong, content overlapping

**Solutions**:
```typescript
import { StatusBar } from 'react-native';

<StatusBar
  barStyle="dark-content"
  backgroundColor="transparent"
  translucent
/>
```

**Prevention**: Configure StatusBar at app level

---

## Performance Issues

### Slow Rendering

#### List Performance
**Symptoms**: Slow scrolling, laggy lists

**Solutions**:
```typescript
// Use FlashList instead of FlatList
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={100}
  keyExtractor={item => item.id}
/>
```

**Prevention**: Use FlashList for long lists

---

#### Re-render Issues
**Symptoms**: Components re-render unnecessarily

**Solutions**:
```typescript
// Memoize components
const MemoizedComponent = React.memo(Component);

// Memoize values
const memoizedValue = useMemo(() => expensiveCalculation(), [deps]);

// Memoize callbacks
const memoizedCallback = useCallback(() => handleAction(), [deps]);
```

**Prevention**: Profile renders, use React DevTools

---

### Memory Issues

#### Memory Leaks
**Symptoms**: App slows down over time, crashes

**Solutions**:
```typescript
// Clean up subscriptions
useEffect(() => {
  const subscription = eventEmitter.subscribe(handler);
  return () => subscription.unsubscribe();
}, []);

// Cancel async operations
useEffect(() => {
  let mounted = true;
  fetchData().then(data => {
    if (mounted) setData(data);
  });
  return () => { mounted = false; };
}, []);
```

**Prevention**: Always cleanup in useEffect

---

#### Image Memory
**Symptoms**: High memory usage with images

**Solutions**:
```typescript
// Use expo-image for optimized loading
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  style={{ width: 200, height: 200 }}
  contentFit="cover"
  transition={200}
/>
```

**Prevention**: Limit image sizes, use appropriate formats

---

## Development Environment Issues

### Expo CLI Issues

#### Version Mismatch
**Symptoms**: Expo commands fail

**Solutions**:
```bash
# Update Expo CLI
npm install -g expo-cli@latest

# Or use npx (recommended)
npx expo --version
```

**Prevention**: Use npx for Expo commands

---

### EAS Build Issues

#### Build Fails on EAS
**Symptoms**: Cloud build fails

**Solutions**:
1. Check `eas.json` configuration
2. Verify `app.config.ts` values
3. Check credentials: `eas credentials`
4. Review build logs on Expo dashboard

**Prevention**: Test locally before EAS build

---

## Environment Issues

### Variables Not Loading
**Symptoms**: Environment variables undefined

**Solutions**:
1. Verify `.env` file exists
2. Restart Metro after changes
3. Run `task env-check`

**Prevention**: Check env after changes

---

### Variables Empty in App
**Symptoms**: `process.env.VAR` is undefined

**Important**: Only `EXPO_PUBLIC_*` variables are available in app code.

```typescript
// Works (runtime)
const url = process.env.EXPO_PUBLIC_BASE_URL;

// Won't work in app (build-time only)
const env = process.env.ENVIRONMENT;
```

**Prevention**: Use EXPO_PUBLIC_ prefix for runtime variables

---

## Hot Reload Issues

### Changes Not Reflecting
**Symptoms**: Code changes don't appear

**Solutions**:
```bash
# Full clean rebuild
pnpm run clean
pnpm run generate
pnpm run ios:dev  # or android:dev
```

**Prevention**: Save files, check Metro for errors

---

### Fast Refresh Disabled
**Symptoms**: Need to reload manually

**Solutions**:
1. Open Developer Menu (shake or `Cmd+D`/`Cmd+M`)
2. Enable "Fast Refresh"

**Prevention**: Keep Fast Refresh enabled

---

## Related Documentation

- [SKILL.md](SKILL.md) - Troubleshooting overview
- [Expo Troubleshooting](https://docs.expo.dev/troubleshooting/clear-cache/)
- [React Native Troubleshooting](https://reactnative.dev/docs/troubleshooting)

---

**End of Common Issues Database**
