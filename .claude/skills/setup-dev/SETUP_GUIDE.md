# Development Environment Setup Guide

**Version**: 1.0.0
**Last Updated**: 2026-01-11
**Parent SOP**: [SKILL.md](./SKILL.md)

---

## Prerequisites Checklist

### Required Tools

Before starting, ensure you have:

- [ ] **macOS** (iOS development requires macOS)
- [ ] **Xcode** (Download from Mac App Store - ~10GB)
- [ ] **Command Line Tools**: `xcode-select --install`
- [ ] **Homebrew**: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`

### Development Tools (Auto-installed)

These will be installed by the setup script:

- [ ] **Volta** (Node version manager)
- [ ] **Node.js 20** (via Volta)
- [ ] **pnpm** (Package manager)
- [ ] **Watchman** (File watcher for Metro)

---

## Phase 1: Install Prerequisites

### Step 1.1: Install Xcode

1. Open Mac App Store
2. Search for "Xcode"
3. Click "Get" and wait for download (~10GB)
4. Open Xcode once to accept license

### Step 1.2: Install Command Line Tools

```bash
xcode-select --install
```

Follow the prompts to complete installation.

### Step 1.3: Install Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After installation, follow the instructions to add Homebrew to your PATH.

---

## Phase 2: Automated Setup

### Step 2.1: Clone Repository

```bash
git clone <repository-url>
cd chatwoot-mobile-app
```

### Step 2.2: Run Setup Script

```bash
./scripts/setup-development.sh
```

This script will:
1. Install Volta if not present
2. Install Node.js 20 via Volta
3. Pin Node version to project
4. Install pnpm
5. Install project dependencies
6. Setup development environment

---

## Phase 3: Manual Setup (Alternative)

If the automated setup fails, follow these steps manually.

### Step 3.1: Install Volta

```bash
curl https://get.volta.sh | bash
```

**Important**: Restart your terminal after installation.

### Step 3.2: Setup Node.js

```bash
# Install Node.js 20
volta install node@20

# Pin to this project
volta pin node@20

# Verify installation
node --version  # Should show v20.x.x
```

### Step 3.3: Install pnpm

```bash
# Install pnpm via Volta
volta install pnpm

# Verify installation
pnpm --version
```

### Step 3.4: Install Dependencies

```bash
pnpm install
```

### Step 3.5: Setup Development Environment

```bash
task setup-dev
```

---

## Phase 4: Verification

### Step 4.1: Run Prerequisites Check

```bash
task check-prereqs
```

This command verifies:
- Node.js version is correct
- pnpm is installed
- All dependencies are installed
- Native tooling is configured

### Step 4.2: Verify Environment Variables

```bash
task env-check
```

If this shows errors, see the `setup-env` skill.

### Step 4.3: First Run Test

```bash
# Start iOS Simulator
task run-ios

# OR Start Android Emulator
task run-android
```

---

## Node Version Management with Volta

### Why Volta?

- **Automatic**: No manual `nvm use` commands
- **Fast**: No shell initialization overhead
- **Team-consistent**: Everyone gets same versions
- **Project-scoped**: Versions defined in `package.json`

### How It Works

```bash
# Volta automatically manages Node versions
# When you enter the project directory, Node 20 is automatically activated

cd chatwoot-mobile-app
node --version  # Shows v20.x.x automatically
volta --version # Shows Volta version

# Pin additional tools to project
volta pin typescript@5.3.0
volta pin eslint@8.57.0

# List all pinned tools
volta list
```

---

## Project Structure Overview

```
chatwoot-mobile-app/
|-- src/                    # Main application code
|   |-- screens/            # App screens
|   |-- components/         # Reusable components
|   |-- services/           # API services
|   |-- store/              # State management
|-- ios/                    # iOS native code
|-- android/                # Android native code
|-- docs/                   # Documentation
|-- scripts/                # Development scripts
```

### Key Files

- **`package.json`**: Dependencies and scripts
- **`app.config.ts`**: Expo configuration
- **`eas.json`**: EAS Build configuration
- **`Taskfile.yml`**: Development tasks

---

## Build Caching (Performance)

This project uses several caching mechanisms to speed up builds:

### Local Build Caching

1. **ccache** - Caches C/C++ compilation (40-50% faster clean builds)
   ```bash
   # Verify ccache is working
   ccache -s

   # Clear ccache if needed
   ccache -C
   ```

2. **expo-build-disk-cache** - Caches Expo build artifacts
   - Cache location: `node_modules/.expo-build-disk-cache`
   - Near-instant rebuilds when cache exists

### Build Commands

| Command | Description | Use Case |
|---------|-------------|----------|
| `task generate` | Clean rebuild | After SDK/dependency changes |
| `task generate-soft` | Incremental rebuild | Config changes |
| `task generate-fast` | Skip pod install | Quick testing |

### Clearing Caches

```bash
# Clear all caches (if experiencing issues)
task clean-all-caches

# Clear iOS caches only
task clean-ios-cache

# Clear ccache only
task ccache-clear
```

---

## Daily Development Commands

### Starting Development

```bash
# iOS Simulator
task run-ios

# Android Emulator
task run-android

# Web development
task run-web
```

### Testing

```bash
# Run all tests
task test

# Run tests in watch mode
task test:watch

# Run E2E tests
task test:e2e
```

### Code Quality

```bash
# Lint code
task lint

# Format code
task format

# Type check
task typecheck
```

### Build & Deploy

```bash
# Build for iOS (development)
task build-ios-dev

# Build for Android (development)
task build-android-dev
```

---

## Troubleshooting

### Volta Issues

| Issue | Solution |
|-------|----------|
| Volta not found after install | Restart terminal or `source ~/.bashrc` / `source ~/.zshrc` |
| Wrong Node version in project | Run `volta pin node@20` in project root |
| Global packages not working | Install via Volta: `volta install <package>` |

### Build Issues

| Issue | Solution |
|-------|----------|
| Metro bundler crash | Run `task clean-cache` |
| Native module errors | Run `task clean && task generate` |
| iOS pod errors | `cd ios && pod install --repo-update` |
| Android gradle errors | `cd android && ./gradlew clean` |

### Dependency Issues

| Issue | Solution |
|-------|----------|
| Lock file conflicts | Delete `node_modules` and `pnpm-lock.yaml`, run `pnpm install` |
| Missing peer deps | Check pnpm output for missing packages |
| Version mismatches | Ensure Volta is pinning correct Node version |

---

## Success Checklist

After completing setup, verify:

- [ ] `task check-prereqs` passes
- [ ] `node --version` shows v20.x.x
- [ ] `pnpm --version` shows version number
- [ ] `task run-ios` starts iOS Simulator
- [ ] `task run-android` starts Android Emulator (if configured)
- [ ] `task test` runs without errors

---

## Next Steps

1. **Configure environment variables** - See `setup-env` skill
2. **Set up iOS development** - See `setup-ios` skill
3. **Set up Android development** - See `setup-android` skill
4. **Explore the codebase** - Start with `src/App.tsx`

---

**End of Setup Guide**
