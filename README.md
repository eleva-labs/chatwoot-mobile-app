# Chatscommerce Mobile App

React Native mobile application for Chatscommerce, built with Expo.

## Quick Start

### Prerequisites

- **macOS** (iOS development requires macOS)
- **Xcode** (Download from Mac App Store - ~10GB)
- **Volta** (Node version manager - `curl https://get.volta.sh | bash`)
- **Homebrew** (Package manager - install from brew.sh)

### Automated Setup (Recommended - 5 minutes)

```bash
# Clone repository
git clone <repo-url>
cd chatwoot-mobile-app

# Run automated setup (installs Volta, Node 20, Watchman, Expo CLI, dependencies, environment)
./scripts/setup-development.sh

# OR use the unified task command (recommended)
task setup-full

# Verify setup
task check-prereqs

# Start iOS development (build takes 5-10 minutes first time)
task run-ios
```

### Manual Setup (10 minutes)

```bash
# Clone repository
git clone <repo-url>
cd chatwoot-mobile-app

# Install Volta and setup Node
curl https://get.volta.sh | bash
volta install node@20
volta pin node@20

# Install required tools
brew install watchman
volta install @expo/cli

# Install dependencies
pnpm install

# Setup development environment
task setup-dev

# Verify setup
task check-prereqs

# Start iOS development (build takes 5-10 minutes first time)
task run-ios
```

### Local Environment Variables

The app uses two layers of environment configuration:
- **`.env`** - Pulled from EAS (shared team settings)
- **`.env.local`** - Local-only overrides (gitignored, machine-specific)

Local overrides are useful for:
- Disabling Sentry uploads (`SENTRY_DISABLE_AUTO_UPLOAD=true`)
- Switching between simulator/device builds (`SIMULATOR=1` or `0`)

Setup automatically: `task setup-local-env`

### Development Workflow

```bash
# Check environment anytime
task check-prereqs

# Configure local environment (one-time after setup)
task setup-local-env    # Creates .env.local with local settings
task verify-patches     # Verify patches applied during pnpm install

# Start development
task run-ios          # iOS Simulator (5-10 min first build)
task run-android      # Android Emulator
task run-web          # Web development

# Other useful commands
task test            # Run tests
task lint            # Check code quality
task clean           # Clean caches
```

### 📖 Detailed Setup Guide

For comprehensive onboarding, development workflows, troubleshooting, and best practices, see our **[Development Guide](docs/DEVELOPMENT.md)**.

## Build Performance

This project includes optimizations for faster builds:

| Feature | Impact | Command to Verify |
|---------|--------|-------------------|
| ccache | 40-50% faster clean builds | `ccache -s` |
| expo-build-disk-cache | Near-instant cached rebuilds | `ls node_modules/.expo-build-disk-cache` |
| EAS Build caching | 30-40% faster cloud builds | Check EAS dashboard |

**Build Commands:**
```bash
task generate        # Clean rebuild (use after SDK changes)
task generate-soft   # Incremental (use for config changes)
task generate-fast   # Skip pod install (fastest for testing)
```

**If builds are slow:**
```bash
# Verify ccache is working
ccache -s

# Clear caches if needed
task clean-all-caches
```

## Prerequisites

| Requirement | Version | Installation                                                                      |
| ----------- | ------- | --------------------------------------------------------------------------------- |
| Node.js     | 20 LTS  | See [SETUP_IOS.md](docs/SETUP_IOS.md#6-node-version-manager-volta) (Volta or nvm) |
| pnpm        | Latest  | `npm install -g pnpm`                                                             |
| Task        | Latest  | `brew install go-task`                                                            |
| Watchman    | Latest  | `brew install watchman`                                                           |
| Expo CLI    | Latest  | `npm install -g @expo/cli`                                                        |

### Platform-Specific Setup

| Platform                      | Guide                                          |
| ----------------------------- | ---------------------------------------------- |
| iOS (macOS only)              | [docs/SETUP_IOS.md](docs/SETUP_IOS.md)         |
| Android (macOS/Windows/Linux) | [docs/SETUP_ANDROID.md](docs/SETUP_ANDROID.md) |

## Project Setup

### Option 1: Automatic (Recommended)

```bash
task setup
```

This will:

- Install dependencies (`pnpm install`)
- Pull environment variables from EAS
- Create Firebase credential placeholders

### Option 2: Manual

```bash
# Install dependencies
pnpm install

# Pull environment from EAS (requires EAS login)
task setup-dev

# Or manually setup Firebase placeholders
task setup-firebase
```

## Commands

All commands are run via [Taskfile](https://taskfile.dev/). Run `task` to see all available commands.

### Development

| Command            | Description                         |
| ------------------ | ----------------------------------- |
| `task start`       | Start Expo dev server               |
| `task run-ios`     | Build and run on iOS                |
| `task run-android` | Build and run on Android            |
| `task storybook`   | Start Storybook (component gallery) |

### Build

| Command                  | Description                        |
| ------------------------ | ---------------------------------- |
| `task generate`          | Regenerate native projects (clean) |
| `task eas-build-ios`     | Build iOS on EAS cloud             |
| `task eas-build-android` | Build Android on EAS cloud         |

### Code Quality

| Command         | Description               |
| --------------- | ------------------------- |
| `task lint`     | Run ESLint                |
| `task lint-fix` | Run ESLint with auto-fix  |
| `task format`   | Format code with Prettier |
| `task test`     | Run tests                 |

### Environment

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `task setup-dev`  | Pull dev environment from EAS  |
| `task setup-prod` | Pull prod environment from EAS |
| `task env-check`  | Verify environment variables   |

## Environment Variables

Environment variables are managed via `.env` files:

- `.env.example` - Template with defaults (committed)
- `.env` - Actual values (gitignored, pulled from EAS)
- `.env.local.example` - Local-only variables template (committed)
- `.env.local` - Local overrides (gitignored, machine-specific)

See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for details.

## Documentation

| Document                                   | Description                         |
| ------------------------------------------ | ----------------------------------- |
| [iOS Setup](docs/SETUP_IOS.md)             | Xcode, simulator, code signing      |
| [Android Setup](docs/SETUP_ANDROID.md)     | Android Studio, SDK, emulator       |
| [Environment](docs/ENVIRONMENT.md)         | Environment variables, .env files   |
| [Deployment](docs/DEPLOYMENT.md)           | CI/CD, EAS builds, store submission |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common issues and fixes             |

## Tech Stack

| Technology      | Version |
| --------------- | ------- |
| Node.js         | 20 LTS  |
| React Native    | 0.76.9  |
| Expo SDK        | 52      |
| TypeScript      | 5.1.3   |
| Min iOS         | 13.0    |
| Min Android API | 24      |

## Project Structure

```
├── src/                    # Source code
│   ├── components/         # Reusable components
│   ├── screens/            # Screen components
│   ├── services/           # API and services
│   └── infrastructure/     # Core infrastructure
├── credentials/            # Firebase credentials (gitignored)
├── scripts/                # Build and setup scripts
├── docs/                   # Documentation
├── .env.example            # Environment template
├── Taskfile.yml            # Task runner configuration
└── app.config.ts           # Expo configuration
```

## License

Private - All rights reserved.
