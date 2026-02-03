# Manual Setup

Step-by-step guide for setting up the development environment manually.

Use this guide if you prefer granular control or if the automated setup encounters issues.

## Step 1: Install Volta

[Volta](https://volta.sh) manages Node.js versions automatically.

```bash
# Install Volta
curl https://get.volta.sh | bash

# Restart terminal or source config
source ~/.zshrc  # or ~/.bashrc

# Verify installation
volta --version
```

## Step 2: Install Node.js

```bash
# Install Node.js 22.x via Volta
volta install node@22

# Verify installation
node --version  # Should show v22.x.x
```

## Step 3: Install pnpm

```bash
# Enable Corepack (comes with Node.js)
corepack enable

# Install pnpm via Volta (recommended)
volta install pnpm@10

# Verify installation
pnpm --version  # Should show 10.x.x
```

## Step 4: Install Expo and EAS CLI

```bash
# Install globally
npm install -g @expo/cli eas-cli

# Verify installation
npx expo --version
eas --version
```

## Step 5: iOS Dependencies (macOS only)

### Xcode

1. Install Xcode from the Mac App Store
2. Install Command Line Tools:
   ```bash
   xcode-select --install
   ```
3. Accept the license:
   ```bash
   sudo xcodebuild -license accept
   ```

### Homebrew

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add to PATH (Apple Silicon)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc
```

### CocoaPods

```bash
brew install cocoapods
pod --version
```

### Watchman

```bash
brew install watchman
watchman --version
```

## Step 6: Android Dependencies

### JDK 17

**macOS:**
```bash
brew install --cask temurin@17
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install openjdk-17-jdk
```

### Configure JAVA_HOME

Add to `~/.zshrc` or `~/.bashrc`:

```bash
# macOS (Temurin)
export JAVA_HOME="/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home"

# macOS (Homebrew ARM)
# export JAVA_HOME="/opt/homebrew/opt/openjdk@17"

# Linux
# export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"

export PATH="$JAVA_HOME/bin:$PATH"
```

### Android Studio

1. Download from [developer.android.com/studio](https://developer.android.com/studio)
2. Install and run Android Studio
3. Complete the setup wizard
4. Open SDK Manager and install:
   - Android SDK Platform 35
   - Android SDK Build-Tools 35.x
   - Android SDK Platform-Tools
   - Android Emulator

### Configure ANDROID_HOME

Add to `~/.zshrc` or `~/.bashrc`:

```bash
# macOS
export ANDROID_HOME="$HOME/Library/Android/sdk"

# Linux
# export ANDROID_HOME="$HOME/Android/Sdk"

export PATH="$ANDROID_HOME/emulator:$PATH"
export PATH="$ANDROID_HOME/platform-tools:$PATH"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
```

## Step 7: Clone and Install Dependencies

```bash
# Clone the repository
git clone <repo-url>
cd chatwoot-mobile-app

# Install dependencies
pnpm install
```

## Step 8: Configure Environment

### Option A: Pull from EAS (Team Members)

```bash
# Login to EAS
eas login

# Pull environment
pnpm run env:pull:dev
```

### Option B: Manual Configuration

```bash
# Copy template
cp .env.example .env

# Edit with your values
nano .env  # or your preferred editor
```

## Step 9: Firebase Credentials

See [Firebase Credentials Guide](05-firebase-credentials.md) for detailed instructions.

Quick steps:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Download credential files
4. Place in `credentials/` folder

## Step 10: Verify Setup

```bash
./scripts/setup/11_verify_setup.sh
```

This will check all components and report any issues.

## Step 11: Generate Native Projects

```bash
# Generate ios/ and android/ folders
pnpm run generate
```

## Step 12: Start Development

```bash
# Start Expo dev server
pnpm start

# Or run directly on a platform
pnpm run ios:dev
pnpm run android:dev
```

## Environment Variables Summary

Add these to your shell config (`~/.zshrc` or `~/.bashrc`):

```bash
# Volta
export VOLTA_HOME="$HOME/.volta"
export PATH="$VOLTA_HOME/bin:$PATH"

# Java
export JAVA_HOME="/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"

# Android
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/emulator:$PATH"
export PATH="$ANDROID_HOME/platform-tools:$PATH"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
```

After adding, reload:
```bash
source ~/.zshrc
```

---

**Previous:** [Automated Setup](02-automated-setup.md) | **Next:** [Authentication](04-authentication.md)
