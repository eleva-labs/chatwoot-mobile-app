# Setup Troubleshooting

Common issues and solutions during development environment setup.

## Setup Script Issues

### Script Permission Denied

```bash
# Make scripts executable
chmod +x scripts/setup/*.sh

# Then run setup
./scripts/setup/setup.sh
```

### Script Fails at Specific Step

Run the specific script manually to see detailed errors:

```bash
./scripts/setup/07_install_android_deps.sh
```

Then continue from verification:

```bash
./scripts/setup/11_verify_setup.sh
```

### Skip Completed Steps

```bash
./scripts/setup/setup.sh --skip=00,01,02,03,04
```

## Node.js Issues

### Wrong Node Version

```bash
# Check version
node --version

# Should be v22.x.x
# If not, run:
volta install node@22

# Or restart terminal
source ~/.zshrc
```

### Volta Not Found

```bash
# Check if installed
which volta

# If not found, reinstall
curl https://get.volta.sh | bash

# Then restart terminal
source ~/.zshrc
```

### pnpm Not Found

```bash
# Enable corepack
corepack enable

# Install pnpm via Volta
volta install pnpm@10

# Verify
pnpm --version
```

## iOS Issues (macOS)

### Xcode Command Line Tools Missing

```bash
xcode-select --install
```

### CocoaPods Installation Fails

```bash
# Uninstall broken installation
brew uninstall cocoapods

# Reinstall
brew install cocoapods

# Or use gem
sudo gem install cocoapods
```

### Pod Install Fails

```bash
# Clear CocoaPods cache
cd ios
pod cache clean --all
rm -rf Pods
rm Podfile.lock
pod install
```

### Xcode License Not Accepted

```bash
sudo xcodebuild -license accept
```

## Android Issues

### JAVA_HOME Not Set

Add to `~/.zshrc` or `~/.bashrc`:

```bash
# macOS (Temurin)
export JAVA_HOME="/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home"

# Verify
source ~/.zshrc
echo $JAVA_HOME
java --version
```

### Wrong Java Version

```bash
# Check version
java --version

# Should be 17.x.x
# Install JDK 17:
brew install --cask temurin@17
```

### ANDROID_HOME Not Set

Add to `~/.zshrc` or `~/.bashrc`:

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/platform-tools:$PATH"
```

### Android SDK Not Found

1. Open Android Studio
2. Go to Settings > SDK Manager
3. Install required SDK components

## Authentication Issues

### EAS Login Fails

```bash
# Clear credentials
eas logout

# Try again
eas login

# Check network
curl -I https://expo.dev
```

### Firebase Login Fails

```bash
# Clear credentials
firebase logout

# Re-authenticate
firebase login --reauth
```

### "Not Authorized" Errors

Ensure you have project access:
- EAS: Check expo.dev project settings
- Firebase: Check Firebase Console IAM

## Environment Issues

### .env File Not Found

```bash
# Create from template
cp .env.example .env

# Or pull from EAS
eas login
pnpm run env:pull:dev
```

### Variables Not Loading

```bash
# Clear Metro cache
pnpm start --clear

# Or regenerate native projects
pnpm run generate
```

### EAS Pull Fails

```bash
# Check login status
eas whoami

# Re-login if needed
eas login

# Then pull
pnpm run env:pull:dev
```

## Firebase Credential Issues

### Credentials Not Found

```bash
# Check if files exist
ls -la credentials/ios/
ls -la credentials/android/

# Download from Firebase Console or CLI
firebase apps:sdkconfig ios --project YOUR_PROJECT_ID \
    --out credentials/ios/GoogleService-Info.plist
```

### Invalid Credentials

```bash
# Check for placeholders
grep -E "(YOUR_|PLACEHOLDER)" credentials/ios/*.plist
grep -E "(YOUR_|PLACEHOLDER)" credentials/android/*.json

# Re-download from Firebase Console
```

### App Not Registered in Firebase

1. Go to Firebase Console
2. Project Settings > Your apps
3. Add iOS/Android app with correct bundle/package ID

## Build Issues

### node_modules Corrupted

```bash
# Remove and reinstall
rm -rf node_modules
pnpm install
```

### Expo Doctor Errors

```bash
# Run diagnostics
pnpm run run:doctor

# Common fix: regenerate native projects
pnpm run generate
```

### Metro Bundler Issues

```bash
# Clear cache and restart
pnpm start --clear
```

## Shell Configuration Issues

### Changes Not Applied

```bash
# Reload shell config
source ~/.zshrc  # or ~/.bashrc

# Or restart terminal
```

### Variables Not Persisting

Check shell config file has the exports:

```bash
cat ~/.zshrc | grep -E "(VOLTA|JAVA|ANDROID)"
```

If missing, run the relevant setup script:

```bash
./scripts/setup/07_install_android_deps.sh
```

## Verification Failures

Run the verification script for detailed information:

```bash
./scripts/setup/11_verify_setup.sh
```

The output shows:
- [OK] - Component working correctly
- [!] - Warning (may need attention)
- [X] - Failed (requires action)

## Getting Help

1. Check this troubleshooting guide
2. Search existing issues on GitHub
3. Check Expo documentation: https://docs.expo.dev
4. Check React Native documentation: https://reactnative.dev

## Reset Everything

If all else fails, reset the development environment:

```bash
# Remove generated files
rm -rf node_modules
rm -rf ios
rm -rf android
rm -rf .expo

# Re-run setup
./scripts/setup/setup.sh

# Regenerate native projects
pnpm run generate
```

---

**Previous:** [Environment Variables](06-environment-variables.md) | **Back to:** [README](README.md)
