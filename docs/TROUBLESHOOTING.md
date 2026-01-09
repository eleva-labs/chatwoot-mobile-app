# Troubleshooting

Common issues and solutions for the Chatscommerce mobile app.

## Build Issues

### "SDK location not found" (Android)

Create `android/local.properties`:

```properties
sdk.dir=/Users/<username>/Library/Android/sdk
```

Or set `ANDROID_HOME` environment variable. See [Android Setup](SETUP_ANDROID.md#4-environment-variables).

### "No signing certificate" (iOS)

**For simulator builds:**
Ensure `SIMULATOR=1` is set in your `.env` file.

**For device builds:**
1. Open `ios/ChatscommerceDev.xcworkspace` in Xcode
2. Select project > Signing & Capabilities
3. Enable "Automatically manage signing"
4. Select your Team

### "Command PhaseScriptExecution failed" (iOS)

CocoaPods issue. Fix:

```bash
cd ios
pod deintegrate
pod install
cd ..
task run-ios
```

### Build fails with memory error (Android)

Add to `android/gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=512m
```

### Gradle sync failed (Android)

1. Open `android/` folder in Android Studio
2. Click **Sync Project with Gradle Files** (elephant icon)
3. If still failing: **File > Invalidate Caches > Invalidate and Restart**

## Runtime Issues

### "Unable to load script" (Android)

Metro bundler not running or not connected:

```bash
# Terminal 1: Start Metro
task start

# Terminal 2: Run app
task run-android
```

If using physical device, ensure port forwarding:

```bash
adb reverse tcp:8081 tcp:8081
```

### App crashes on startup

1. **Check logs:**
   ```bash
   # iOS
   xcrun simctl spawn booted log stream --level debug

   # Android
   adb logcat | grep "ReactNative"
   ```

2. **Clear caches:**
   ```bash
   task clean
   task generate
   ```

3. **Verify environment:**
   ```bash
   task env-check
   ```

### White screen / nothing renders

1. Check Metro is running (`task start`)
2. Check for JavaScript errors in console
3. Try reloading: shake device or `Cmd+R` (iOS) / `R R` (Android)

## Environment Issues

### Variables not loading

1. Ensure `.env` file exists in project root
2. Restart the dev server after changes
3. Run `task env-check` to verify

```bash
task env-check
```

### Variables empty in app code

Only `EXPO_PUBLIC_*` variables are available in app code. Other variables are only available at build time.

```typescript
// Works
const url = process.env.EXPO_PUBLIC_BASE_URL;

// Won't work in app code (build-time only)
const env = process.env.ENVIRONMENT;
```

### EAS pull fails

```bash
# Login to EAS
npx eas login

# Verify account
npx eas whoami

# Retry
task setup-dev
```

## Simulator / Emulator Issues

### iOS Simulator not appearing

```bash
killall Simulator
open -a Simulator
```

### Android Emulator slow

1. Enable hardware acceleration (HAXM on Intel, Hypervisor on AMD)
2. Use x86_64 system images instead of ARM
3. Allocate more RAM in AVD settings

### "INSTALL_FAILED_INSUFFICIENT_STORAGE" (Android)

```bash
emulator -avd <avd_name> -wipe-data
```

Or increase emulator storage in AVD settings.

## Development Tools

### Hot reload not working

1. Check Metro is running
2. Enable Fast Refresh:
   - Shake device or `Cmd+D` (iOS) / `Cmd+M` (Android)
   - Select "Enable Fast Refresh"

### Debugger won't connect

1. Open Developer Menu (shake or keyboard shortcut)
2. Select "Debug with Chrome" or "Open Debugger"
3. If still failing, restart Metro and app

### Changes not reflecting

```bash
# Full clean rebuild
task clean
task generate
task run-ios  # or task run-android
```

## Firebase / Push Notifications

### Push notifications not working

1. **Check credentials exist:**
   ```bash
   ls -la credentials/android/
   ls -la credentials/ios/
   ```

2. **Verify not using placeholders:**
   - Placeholder files have `PROJECT_ID: placeholder-project-id`
   - Real credentials have your actual Firebase project ID

3. **For iOS device builds:**
   - Requires Apple Developer Program membership ($99/year)
   - Requires push notification certificate
   - `SIMULATOR=0` must be set

See [Environment - Firebase Credentials](ENVIRONMENT.md#firebase-credentials) for setup.

## Clean Slate

When all else fails, full reset:

```bash
# Remove generated native projects
rm -rf ios android

# Clear all caches
task clean
rm -rf node_modules
rm -rf ~/Library/Developer/Xcode/DerivedData  # iOS

# Reinstall and regenerate
pnpm install
task generate
task run-ios  # or task run-android
```

## Getting Help

1. Check [Expo documentation](https://docs.expo.dev/)
2. Check [React Native documentation](https://reactnative.dev/)
3. Search [Expo forums](https://forums.expo.dev/)
4. Open an issue in the repository

## Next Steps

- [iOS Setup](SETUP_IOS.md)
- [Android Setup](SETUP_ANDROID.md)
- [Environment](ENVIRONMENT.md)
- [Back to README](../README.md)
