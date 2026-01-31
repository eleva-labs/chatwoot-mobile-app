# Platform Issues

**Version**: 1.0.0
**Last Updated**: 2026-01-11
**Category**: iOS-Specific and Android-Specific Issues

---

## iOS Issues

### Issue: Xcode Version Mismatch

**Symptoms:** Build fails, API deprecated warnings

**Cause:** Xcode version incompatible with project requirements

**Solution:**

**Commands:**

```bash
# Check Xcode version
xcodebuild -version

# Update Xcode from App Store
# Accept license
sudo xcodebuild -license accept
```

**Prevention:** Keep Xcode updated

---

### Issue: Simulator Not Available

**Symptoms:** Can't find simulator, simulator won't start

**Cause:** Simulator not installed, crashed state, or wrong device selected

**Solution:**

**Commands:**

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

**Prevention:** Verify simulator installed in Xcode

---

### Issue: CocoaPods Issues

**Symptoms:** Pod install fails, version conflicts

**Cause:** Outdated CocoaPods, corrupted cache, version conflicts

**Solution:**

**Commands:**

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

**Prevention:** Keep CocoaPods updated

---

### Issue: Ruby/CocoaPods Gem Errors

**Symptoms:** "cannot load such file -- bigdecimal" or other gem loading errors

**Cause:** Homebrew Ruby 4.0 has dependency issues with CocoaPods gem requirements

**Solution 1 - Use system Ruby:**

```bash
# Check which ruby is being used
which ruby

# If using Homebrew Ruby, switch to system Ruby
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

**Solution 3 - Use rbenv for Ruby version management:**

```bash
# Install rbenv
brew install rbenv

# Install a compatible Ruby version
rbenv install 3.2.2
rbenv global 3.2.2

# Then install CocoaPods
gem install cocoapods
```

**Prevention:** Pin to a stable Ruby version (3.2.x or 3.3.x) rather than using latest Homebrew Ruby

---

### Issue: No Signing Certificate

**Symptoms:** Code signing error

**Cause:** Missing or invalid code signing configuration

**For simulator:**
Set `SIMULATOR=1` in `.env`

**For device:**

1. Open `ios/ChatscommerceDev.xcworkspace`
2. Select project > Signing & Capabilities
3. Enable "Automatically manage signing"
4. Select your Team

**Prevention:** Configure signing before device testing

---

### Issue: Command Line Tools Not Installed

**Symptoms:** xcode-select errors, can't find developer tools

**Cause:** Xcode Command Line Tools not installed

**Solution:**

**Commands:**

```bash
# Install command line tools
xcode-select --install

# Verify installation
xcode-select -p
# Should output: /Applications/Xcode.app/Contents/Developer
```

---

## Android Issues

### Issue: SDK Not Found

**Symptoms:** "SDK location not found" error

**Cause:** Android SDK path not configured

**Solution:** Create `android/local.properties`:

```properties
sdk.dir=/Users/<username>/Library/Android/sdk
```

Or set environment variable:

**Commands:**

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
```

**Prevention:** Set ANDROID_HOME in shell profile

---

### Issue: Emulator Won't Start

**Symptoms:** Emulator fails to boot, slow performance

**Cause:** Hardware acceleration disabled, insufficient resources, or corrupted AVD

**Solution:**

**Commands:**

```bash
# List emulators
emulator -list-avds

# Start with verbose output
emulator -avd <avd_name> -verbose

# Wipe emulator data
emulator -avd <avd_name> -wipe-data
```

**Prevention:** Allocate sufficient RAM, use x86_64 images

---

### Issue: Gradle Sync Failed

**Symptoms:** Android Studio can't sync project

**Cause:** Gradle configuration issue, cache corruption

**Solution:**

1. Open `android/` in Android Studio
2. Click "Sync Project with Gradle Files"
3. If still failing: File > Invalidate Caches > Restart

**Prevention:** Keep Android Studio and Gradle updated

---

### Issue: Unable to Load Script Error

**Symptoms:** App shows error loading JavaScript

**Cause:** Metro not running or not connected to device

**Solution:**

**Commands:**

```bash
# Ensure Metro is running
pnpm start

# For physical device, forward port
adb reverse tcp:8081 tcp:8081

# Verify device is connected
adb devices
```

**Prevention:** Start Metro before running app

---

### Issue: INSTALL_FAILED_INSUFFICIENT_STORAGE

**Symptoms:** Can't install app on emulator

**Cause:** Emulator storage full

**Solution:**

**Commands:**

```bash
# Wipe emulator data
emulator -avd <avd_name> -wipe-data
```

Or increase storage in AVD Manager.

**Prevention:** Clean old apps, allocate sufficient storage

---

### Issue: ADB Device Not Recognized

**Symptoms:** `adb devices` shows nothing or "unauthorized"

**Cause:** USB debugging not enabled, driver issues, or device not authorized

**Solution:**

1. Enable USB debugging on device (Developer Options)
2. Connect device and tap "Allow" on authorization prompt
3. Install proper USB drivers (Windows)

**Commands:**

```bash
# Check devices
adb devices

# Restart ADB server
adb kill-server
adb start-server
```

---

### Issue: Build Variant Not Found

**Symptoms:** Gradle can't find build variant

**Cause:** Build configuration mismatch

**Solution:**

**Commands:**

```bash
# Clean Gradle
cd android
./gradlew clean
cd ..

# Regenerate
task generate
```

---

## Related Documentation

- [BUILD_ISSUES.md](BUILD_ISSUES.md) - Build-related issues
- [RUNTIME_ISSUES.md](RUNTIME_ISSUES.md) - Runtime-related issues
- [SKILL.md](SKILL.md) - Troubleshooting overview
- [/setup](../setup/SKILL.md) - Environment setup and configuration

---

**End of Platform Issues**
