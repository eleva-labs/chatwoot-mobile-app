# iOS Development Setup

This guide covers setting up your macOS environment for iOS development.

> **Note:** iOS development requires macOS. Windows and Linux users can only develop for Android.

## Prerequisites

### 1. Xcode

Install Xcode from the Mac App Store:

1. Open **App Store** on your Mac
2. Search for **Xcode**
3. Click **Get** / **Install**
4. Wait for installation (15-30 GB download)

After installation, open Xcode once to complete setup and accept the license agreement.

### 2. Xcode Command Line Tools

```bash
xcode-select --install
```

Verify installation:

```bash
xcode-select -p
# Should output: /Applications/Xcode.app/Contents/Developer
```

### 3. iOS Simulator

The iOS Simulator is included with Xcode. To verify:

1. Open **Xcode**
2. Go to **Xcode > Open Developer Tool > Simulator**
3. Or run from terminal:
   ```bash
   open -a Simulator
   ```

### 4. CocoaPods (Optional)

CocoaPods is managed automatically by Expo, but you can install it manually if needed:

```bash
sudo gem install cocoapods
```

### 4.5. ccache (Recommended for Faster Builds)

ccache dramatically speeds up C/C++ compilation for native iOS builds (40-50% faster clean builds).

#### Installation

```bash
# Install ccache
brew install ccache

# Verify installation
ccache --version
```

#### PATH Configuration (Required)

Add the following to your `~/.zshrc` (or `~/.bashrc`):

```bash
# ccache for faster iOS builds
export PATH="/opt/homebrew/opt/ccache/libexec:$PATH"
```

Then reload your shell:

```bash
source ~/.zshrc
```

#### Verification

```bash
# Show ccache statistics
ccache -s

# After running a build, cache hits should appear
task ccache-stats
```

**Important:** For ccache to work with Xcode, launch Xcode from terminal:

```bash
xed ios/ChatscommerceDev.xcworkspace
```

### 5. Watchman (File Watcher)

Watchman is required for React Native's Metro bundler to efficiently watch file changes.

```bash
brew install watchman
```

Verify installation:

```bash
watchman version
```

### 6. Node Version Manager (Volta Recommended)

For consistent Node.js versions across the team, we recommend using Volta:

```bash
# Install Volta
curl https://get.volta.sh | bash

# Restart terminal, then install Node 20
volta install node@20

# Pin project to Node 20
volta pin node@20
```

Verify:

```bash
node --version  # Should show v20.x.x
volta --version # Should show version info
```

> **Note:** This project also supports nvm (currently used in Xcode builds). You can use either Volta or nvm, but Volta provides automatic version switching and better team consistency. The project has both `.nvmrc` and `volta` configurations for compatibility.

### 7. Ruby and RubyGems

Required for CocoaPods dependency management:

```bash
ruby --version  # Should be available on macOS
gem --version   # Should be available
```

If Ruby issues occur:

```bash
brew install ruby
```

### 8. System Dependencies Verification

Run this to verify all prerequisites:

```bash
# Check Node version
node --version

# Check Watchman
watchman version

# Check Xcode tools
xcode-select -p

# Check Homebrew
brew --version

# Check Ruby
ruby --version
```

## Running on iOS Simulator

### Quick Start

```bash
# Ensure environment is set up
task setup-dev

# Run on simulator (SIMULATOR=1 is default in .env.example)
task run-ios
```

### How It Works

The `SIMULATOR` environment variable controls code signing:

| Value         | Target          | Code Signing |
| ------------- | --------------- | ------------ |
| `SIMULATOR=1` | iOS Simulator   | Not required |
| `SIMULATOR=0` | Physical device | Required     |

This is configured in `.env.example`:

```bash
# Build target: 0 = device (needs signing), 1 = simulator (no signing)
SIMULATOR=1
```

### Selecting a Simulator

When running `task run-ios`, Expo will prompt you to select a simulator. You can also specify directly:

```bash
# List available simulators
xcrun simctl list devices

# Run on specific simulator
expo run:ios --device "iPhone 15 Pro"
```

## Running on Physical Device

### Requirements

1. **Apple Developer Account** (free or paid)
2. **Code Signing Certificate**
3. **Provisioning Profile**

### Setup Code Signing

#### Option 1: Automatic (Recommended for Development)

1. Open `ios/ChatscommerceDev.xcworkspace` in Xcode
2. Select the project in the navigator
3. Go to **Signing & Capabilities** tab
4. Check **Automatically manage signing**
5. Select your **Team** (Apple ID)

#### Option 2: Manual (For Distribution)

For production builds, use EAS Build which handles signing automatically:

```bash
task eas-build-ios
```

### Run on Device

1. Connect your iPhone via USB
2. Trust the computer on your device
3. Set `SIMULATOR=0` in your `.env` file
4. Run:
   ```bash
   task run-ios
   ```

## Push Notifications (Optional)

Push notifications require:

1. Apple Developer Program membership ($99/year)
2. Push notification certificate
3. Real Firebase credentials

For development without push notifications, the placeholder Firebase credentials work fine.

See [ENVIRONMENT.md](ENVIRONMENT.md) for Firebase setup details.

## Common Commands

```bash
# Run on simulator
task run-ios

# Build native project only (no run)
task build-ios

# Regenerate native project
task generate

# Clean and rebuild
task clean
task generate
task run-ios
```

## Xcode Tips

### Clear Derived Data

If you encounter strange build issues:

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
```

Or in Xcode: **Xcode > Settings > Locations > Derived Data** (click arrow to open in Finder, then delete contents).

### Reset Simulator

```bash
# Reset all simulators
xcrun simctl shutdown all
xcrun simctl erase all
```

### View Simulator Logs

```bash
# In a separate terminal while app is running
xcrun simctl spawn booted log stream --level debug --predicate 'subsystem == "com.chatscommerce.app.dev"'
```

## Troubleshooting

### "No signing certificate" error

This happens when building for device without code signing:

- For simulator: Ensure `SIMULATOR=1` in `.env`
- For device: Set up code signing in Xcode

### "Command PhaseScriptExecution failed"

Usually a CocoaPods issue:

```bash
cd ios
pod deintegrate
pod install
cd ..
task run-ios
```

### Simulator not appearing

```bash
# Kill and restart simulator
killall Simulator
open -a Simulator
```

### Build taking too long

First build is slow (compiling native modules). Subsequent builds benefit from caching:

**Verify ccache is working:**
```bash
ccache -s  # Should show cache hits after second build
```

**Use incremental builds:**
```bash
task generate-soft   # Incremental (use for config changes)
task generate-fast   # Skip pod install (fastest for testing)
```

**If builds remain slow:**
```bash
# Verify ccache PATH is set
echo $PATH | grep ccache

# Launch Xcode from terminal (required for ccache)
xed ios/ChatscommerceDev.xcworkspace
```

---

## Build Performance

This project uses several optimizations for faster builds:

| Feature | Impact | Verification Command |
|---------|--------|---------------------|
| ccache | 40-50% faster clean builds | `ccache -s` |
| expo-build-disk-cache | Near-instant cached rebuilds | `ls node_modules/.expo-build-disk-cache` (SDK 53+) |
| EAS Build caching | 30-40% faster cloud builds | Check EAS dashboard |

### Build Commands

| Command | Description | Use Case |
|---------|-------------|----------|
| `task generate` | Clean rebuild | After SDK/dependency changes |
| `task generate-soft` | Incremental rebuild | Config changes |
| `task generate-fast` | Skip pod install | Quick testing |

### Cache Management

```bash
task ccache-stats     # Show ccache statistics
task ccache-clear     # Clear ccache
task clean-ios-cache  # Clear iOS caches (DerivedData, Pods)
task clean-all-caches # Clear ALL build caches
```

## Next Steps

- [Environment Setup](ENVIRONMENT.md) - Configure environment variables
- [Troubleshooting](TROUBLESHOOTING.md) - More common issues
- [Back to README](../README.md)
