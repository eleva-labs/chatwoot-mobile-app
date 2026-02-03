# Prerequisites

System requirements for developing the Chatscommerce Mobile App.

## Operating System

| OS | iOS Development | Android Development |
|----|-----------------|---------------------|
| macOS (recommended) | Yes | Yes |
| Linux | No | Yes |
| Windows | No | Yes (WSL2 recommended) |

> **Note:** iOS development requires macOS due to Xcode requirements.

## Required Software

### Git

Version control system for source code management.

```bash
# Check version
git --version

# Install on macOS
xcode-select --install

# Install on Linux (Debian/Ubuntu)
sudo apt-get install git
```

### Xcode (macOS only)

Required for iOS development.

- **Version:** 16.x or later
- **Source:** Mac App Store
- **Components:** Command Line Tools, iOS Simulator

```bash
# Install Command Line Tools
xcode-select --install

# Accept license
sudo xcodebuild -license accept
```

### Android Studio

Required for Android development.

- **Version:** Latest stable
- **Source:** [developer.android.com/studio](https://developer.android.com/studio)

**Required SDK Components** (via SDK Manager):
- Android SDK Platform 35
- Android SDK Build-Tools 35.x
- Android SDK Platform-Tools
- Android Emulator
- Intel HAXM (Intel Macs) or Android Emulator Hypervisor (Apple Silicon)

## Hardware Requirements

### Minimum
- 8 GB RAM
- 50 GB free disk space
- Intel Core i5 or Apple M1

### Recommended
- 16 GB RAM
- 100 GB free disk space (SSD)
- Intel Core i7 or Apple M1 Pro/Max

## Network Requirements

- Stable internet connection
- Access to npm registry
- Access to GitHub
- Access to Expo services (expo.dev)
- Access to Firebase Console (optional)

## Accounts Required

| Service | Required | Purpose |
|---------|----------|---------|
| Expo (expo.dev) | Yes | EAS builds, OTA updates, env secrets |
| Firebase | Optional | Push notifications, analytics |
| Apple Developer | For iOS release | App Store distribution |
| Google Play | For Android release | Play Store distribution |

## Pre-Installation Checklist

Before running setup:

- [ ] Operating system meets requirements
- [ ] Git is installed
- [ ] Xcode installed (macOS, for iOS)
- [ ] Android Studio installed (for Android)
- [ ] Sufficient disk space available
- [ ] Expo account created
- [ ] Firebase project created (optional)

## Environment Variables

The setup script will configure these automatically:

| Variable | Purpose |
|----------|---------|
| `VOLTA_HOME` | Volta installation directory |
| `JAVA_HOME` | JDK 17 installation path |
| `ANDROID_HOME` | Android SDK location |
| `PATH` | Updated for all tools |

## Verification

After completing prerequisites:

```bash
# Clone and run setup
git clone <repo-url>
cd chatwoot-mobile-app
./scripts/setup/setup.sh
```

The setup script will verify prerequisites and install missing components.

---

**Previous:** [README](README.md) | **Next:** [Automated Setup](02-automated-setup.md)
