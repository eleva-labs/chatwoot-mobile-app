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
task ios:run
```

### Ruby/CocoaPods gem errors (e.g., bigdecimal missing)

If you encounter errors like "cannot load such file -- bigdecimal" or other gem loading errors when running CocoaPods:

**Root Cause:** Homebrew Ruby 4.0 may have dependency issues with CocoaPods gem requirements.

**Solution 1 - Use system Ruby:**

```bash
# Check which ruby is being used
which ruby

# If using Homebrew Ruby (/opt/homebrew/opt/ruby/bin/ruby), switch to system Ruby
# Remove or comment out Ruby PATH in ~/.zshrc

# Use system Ruby with sudo for gem install
sudo gem install cocoapods
```

**Solution 2 - Install missing gems:**

```bash
# Install the missing gem
sudo gem install bigdecimal

# Or reinstall CocoaPods with dependencies
sudo gem install cocoapods --no-document
```

**Solution 3 - Use rbenv/rvm for Ruby version management:**

```bash
# Install rbenv
brew install rbenv

# Install a compatible Ruby version
rbenv install 3.2.2
rbenv global 3.2.2

# Then install CocoaPods
gem install cocoapods
```

**Prevention:** Pin to a stable Ruby version (3.2.x or 3.3.x) rather than using latest Homebrew Ruby.

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
task dev:start

# Terminal 2: Run app
task android:run
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
   task ios:clean  # or task android:clean
   task ios:generate  # or task android:generate
   ```

3. **Verify environment:**
   ```bash
   task setup:env-check
   ```

### White screen / nothing renders

1. Check Metro is running (`task dev:start`)
2. Check for JavaScript errors in console
3. Try reloading: shake device or `Cmd+R` (iOS) / `R R` (Android)

## Environment Issues

### Variables not loading

1. Ensure `.env` file exists in project root
2. Restart the dev server after changes
3. Run `task setup:env-check` to verify

```bash
task setup:env-check
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
task setup:base
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
task ios:clean  # or task android:clean
task ios:generate  # or task android:generate
task ios:run  # or task android:run
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
task ios:clean  # or task android:clean
rm -rf node_modules
rm -rf ~/Library/Developer/Xcode/DerivedData  # iOS

# Reinstall and regenerate
pnpm install
task ios:generate  # or task android:generate
task ios:run  # or task android:run
```

## Build Cache Issues

### ccache not working

**Symptoms:** Build times haven't improved, `ccache -s` shows no hits

**Solutions:**

1. Verify ccache is installed:

   ```bash
   ccache --version
   which ccache
   ```

2. Verify PATH includes ccache libexec:

   ```bash
   echo $PATH | grep ccache
   # Should show: /opt/homebrew/opt/ccache/libexec
   ```

3. Add to ~/.zshrc if missing:

   ```bash
   export PATH="/opt/homebrew/opt/ccache/libexec:$PATH"
   source ~/.zshrc
   ```

4. Launch Xcode from terminal (required for ccache to intercept compiler calls):

   ```bash
   xed ios/ChatscommerceDev.xcworkspace
   ```

5. Verify ccache is enabled in Podfile.properties.json:
   ```json
   "apple.ccacheEnabled": "true"
   ```

### Stale cache causing build failures

**Symptoms:** Strange build errors after dependency updates

**Solution:**

```bash
# Reinstall and rebuild
pnpm install
task ios:generate  # or task android:generate
```

### expo-build-disk-cache not working

**Note:** This feature requires Expo SDK 53+. The project currently uses SDK 52.

**When SDK 53 is available:**

1. Uncomment experiments section in `app.config.ts`
2. Run `task ios:generate` or `task android:generate`
3. Verify cache directory: `ls node_modules/.expo-build-disk-cache`

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
