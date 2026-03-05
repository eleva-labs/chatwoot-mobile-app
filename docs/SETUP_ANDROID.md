# Android Development Setup

This guide covers setting up your environment for Android development on macOS, Windows, or Linux.

## Prerequisites

### 1. Java Development Kit (JDK)

Android requires JDK 17.

#### macOS

```bash
brew install openjdk@17

# Add to PATH (add to ~/.zshrc or ~/.bashrc)
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH="$JAVA_HOME/bin:$PATH"
```

#### Windows

Download and install from [Adoptium](https://adoptium.net/) (Eclipse Temurin JDK 17).

#### Linux

```bash
sudo apt install openjdk-17-jdk
```

Verify installation:

```bash
java --version
# Should show version 17.x.x
```

### 2. Android Studio

Download from [developer.android.com/studio](https://developer.android.com/studio)

During installation, ensure these components are selected:

- Android SDK
- Android SDK Platform
- Android Virtual Device (AVD)

### 3. Node.js Version Management

For consistent Node.js versions across the team, we recommend using Volta (same as iOS setup):

```bash
# Install Volta
curl https://get.volta.sh | bash

# Setup Node 20
volta install node@20
volta pin node@20
```

Verify:

```bash
node --version  # Should show v20.x.x
volta --version # Should show version info
```

> **Note:** Android development also supports nvm. See [iOS Setup](SETUP_IOS.md#6-node-version-manager-volta) for details.

### 4. Android SDK Configuration

After installing Android Studio:

1. Open **Android Studio**
2. Go to **Settings/Preferences > Languages & Frameworks > Android SDK**
3. In **SDK Platforms** tab, install:
   - Android 14 (API 34) - or latest
4. In **SDK Tools** tab, ensure these are installed:
   - Android SDK Build-Tools
   - Android SDK Command-line Tools
   - Android Emulator
   - Android SDK Platform-Tools

### 4. Environment Variables

Add to your shell profile (`~/.zshrc`, `~/.bashrc`, or Windows Environment Variables):

#### macOS / Linux

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
# export ANDROID_HOME=$HOME/Android/Sdk       # Linux

export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

#### Windows

1. Open **System Properties > Environment Variables**
2. Add new System Variable:
   - Name: `ANDROID_HOME`
   - Value: `C:\Users\<username>\AppData\Local\Android\Sdk`
3. Add to `Path`:
   - `%ANDROID_HOME%\emulator`
   - `%ANDROID_HOME%\platform-tools`

Verify:

```bash
adb --version
# Should output version info
```

## Setting Up Android Emulator

### Create Virtual Device (AVD)

1. Open **Android Studio**
2. Go to **Tools > Device Manager** (or click phone icon in toolbar)
3. Click **Create Device**
4. Select a device (e.g., Pixel 7)
5. Select a system image (API 34 recommended)
6. Click **Finish**

### Start Emulator

From Android Studio:

- Click the **Play** button next to your device in Device Manager

From command line:

```bash
# List available emulators
emulator -list-avds

# Start emulator
emulator -avd <avd_name>
```

## Running on Android Emulator

### Quick Start

```bash
# Ensure environment is set up
task setup-dev

# Start emulator first (from Android Studio or command line)
# Then run
task run-android
```

### Verify Device Connection

```bash
adb devices
# Should list your emulator or connected device
```

## Running on Physical Device

### Enable Developer Options

1. Go to **Settings > About Phone**
2. Tap **Build Number** 7 times
3. Go back to **Settings > Developer Options**
4. Enable **USB Debugging**

### Connect Device

1. Connect via USB
2. Accept the debugging prompt on your device
3. Verify connection:
   ```bash
   adb devices
   # Should list your device
   ```

### Run

```bash
task run-android
```

## Common Commands

```bash
# Run on Android
task run-android

# Build native project only
task build-android

# Regenerate native project
task generate

# Connect ADB for debugging
task adb-connect

# View logs
adb logcat | grep "ReactNative"
```

## Android Studio Tips

### Sync Gradle

If you see Gradle sync issues:

1. Open `android/` folder in Android Studio
2. Click **Sync Project with Gradle Files** (elephant icon)

### Invalidate Caches

For strange build issues:

1. **File > Invalidate Caches**
2. Select **Invalidate and Restart**

## Debugging with React Native

### Enable Hot Reload

1. Shake device or press `Cmd+M` (macOS) / `Ctrl+M` (Windows)
2. Select **Enable Fast Refresh**

### Open Developer Menu

- Emulator: `Cmd+M` (macOS) or `Ctrl+M` (Windows)
- Physical device: Shake the device

### View Logs

```bash
# All React Native logs
adb logcat *:S ReactNative:V ReactNativeJS:V

# Filter for your app
adb logcat | grep "com.chatscommerce"
```

### Connect Debugger

1. Open Developer Menu
2. Select **Debug with Chrome** or **Open Debugger**
3. Chrome DevTools will open at `localhost:8081/debugger-ui`

## Troubleshooting

### "SDK location not found"

Create `android/local.properties`:

```properties
sdk.dir=/Users/<username>/Library/Android/sdk
```

Or set `ANDROID_HOME` environment variable.

### "INSTALL_FAILED_INSUFFICIENT_STORAGE"

Clear emulator data:

```bash
emulator -avd <avd_name> -wipe-data
```

Or increase emulator storage in AVD settings.

### "Unable to load script"

Metro bundler not running or not connected:

```bash
# Start Metro manually
task start

# In another terminal
task run-android
```

### Emulator slow

- Enable hardware acceleration (HAXM on Intel, Hypervisor on AMD)
- Use x86_64 system images instead of ARM
- Allocate more RAM to emulator in AVD settings

### Build fails with memory error

Add to `android/gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=512m
```

## ADB Commands Reference

```bash
# List devices
adb devices

# Install APK
adb install app.apk

# Uninstall app
adb uninstall com.chatscommerce.app.dev

# Clear app data
adb shell pm clear com.chatscommerce.app.dev

# Reverse port (for Metro connection)
adb reverse tcp:8081 tcp:8081

# Take screenshot
adb exec-out screencap -p > screenshot.png

# Record screen
adb shell screenrecord /sdcard/recording.mp4
```

## Next Steps

- [Environment Setup](ENVIRONMENT.md) - Configure environment variables
- [Troubleshooting](TROUBLESHOOTING.md) - More common issues
- [Back to README](../README.md)
