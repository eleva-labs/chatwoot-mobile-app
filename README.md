# Chatscommerce Mobile App

React Native mobile application for Chatscommerce, built with Expo.

## Quick Start

### Prerequisites

- **macOS** (iOS development requires macOS)
- **Xcode** (Download from Mac App Store - ~10GB)
- **Homebrew** (Package manager - install from brew.sh)
- **Volta** (Node version manager - `curl https://get.volta.sh | bash`)
- **direnv** (Auto-loads environment variables - installed via `task setup:base`)

### Automated Setup (Recommended - 10-15 minutes)

```bash
# Clone repository
git clone <repo-url>
cd chatwoot-mobile-app

# Complete setup (base + iOS + Android + E2E + verification)
task setup:full

# OR minimal setup (dependencies + environment only)
task setup:quick

# Verify setup
task setup:check-prereqs

# Start iOS development (build takes 5-10 minutes first time)
task ios:run
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
task setup:base

# Verify setup
task setup:check-prereqs

# Start iOS development (build takes 5-10 minutes first time)
task ios:run
```

### Local Environment Variables

The app uses environment configuration from:

- **`.env`** - Pulled from EAS (shared team settings)

Edit `.env` for local overrides:

- Disabling Sentry uploads (`SENTRY_DISABLE_AUTO_UPLOAD=true`)
- Switching between simulator/device builds (`SIMULATOR=1` or `0`)

Environment files are created automatically by `task setup:base`

### Development Workflow

```bash
# Check environment anytime
task setup:check-prereqs

# Verify patches applied during pnpm install
task setup:verify-patches

# Start development
task ios:run          # iOS Simulator (5-10 min first build)
task android:run      # Android Emulator

# Other useful commands
task quality:test    # Run tests
task quality:lint    # Check code quality
```

## Maestro E2E Testing

This project uses [Maestro](https://docs.maestro.dev) for mobile UI automation testing. Maestro provides deterministic, YAML-based test execution without requiring LLM/AI for running tests.

### Quick Start

```bash
# Install Maestro (Java, Maestro CLI, idb-companion)
task maestro:setup
# OR: task setup:e2e

# Set up test environment
cp .env.maestro.example .env.maestro
# Edit .env.maestro with your test credentials

# Run tests
task maestro:test
```

### Documentation

- **[Maestro Testing Guide](./maestro/README.md)** - Comprehensive guide for using Maestro
- **[CI/CD Workflows](./.github/workflows/README.md)** - GitHub Actions configuration and trigger rationale

### Features

- **Deterministic execution** - Tests run as pure YAML, no LLM required
- **Cross-platform support** - iOS and Android tests
- **Centralized configuration** - Single APP_ID in config.yaml
- **Exploratory workflow** - Maestro Studio for flow exploration
- **Transformation workflow** - Studio recordings → formal test flows
- **CI/CD integration** - Automated testing on PRs and commits

### Running Tests

```bash
# All tests (default: local backend)
pnpm maestro:test

# Against dev backend
pnpm maestro:test:dev

# Smoke tests only
pnpm maestro:test:smoke
```

For detailed information, see [maestro/README.md](./maestro/README.md).

### 📖 Detailed Setup Guide

For comprehensive onboarding, development workflows, troubleshooting, and best practices, see our **[Development Guide](docs/DEVELOPMENT.md)**.

## Build Performance

This project includes optimizations for faster builds:

| Feature               | Impact                       | Command to Verify                        |
| --------------------- | ---------------------------- | ---------------------------------------- |
| ccache                | 40-50% faster clean builds   | `ccache -s`                              |
| expo-build-disk-cache | Near-instant cached rebuilds | `ls node_modules/.expo-build-disk-cache` |
| EAS Build caching     | 30-40% faster cloud builds   | Check EAS dashboard                      |

**Build Commands:**

```bash
task ios:generate        # Clean rebuild (use after SDK changes)
task ios:generate-soft   # Incremental (use for config changes)
# For Android: task android:generate, task android:generate-soft
```

**If builds are slow:**

```bash
# Verify ccache is working
ccache -s
```

## Prerequisites

| Requirement | Version | Installation                                                                      |
| ----------- | ------- | --------------------------------------------------------------------------------- |
| Node.js     | 20.19.6 | See [SETUP_IOS.md](docs/SETUP_IOS.md#6-node-version-manager-volta) (Volta or nvm) |
| pnpm        | 9.0.0   | Managed by Volta (auto-installed)                                                 |
| Task        | Latest  | `brew install go-task`                                                            |
| Watchman    | Latest  | `brew install watchman`                                                           |
| Expo CLI    | Latest  | `volta install @expo/cli` or `npm install -g @expo/cli`                           |
| CocoaPods   | 1.16.2+ | `sudo gem install cocoapods` (iOS only)                                           |

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
task setup:base
```

## Commands

All commands are run via [Taskfile](https://taskfile.dev/). Run `task` to see all available commands.

### Development

| Command                | Description                         |
| ---------------------- | ----------------------------------- |
| `task dev:start`       | Start Expo dev server               |
| `task ios:run`         | Build and run on iOS                |
| `task android:run`     | Build and run on Android            |
| `task utils:storybook` | Start Storybook (component gallery) |

### Build

| Command                 | Description                       |
| ----------------------- | --------------------------------- |
| `task ios:generate`     | Regenerate iOS native project     |
| `task android:generate` | Regenerate Android native project |
| `task ios:eas`          | Build iOS on EAS cloud            |
| `task android:eas`      | Build Android on EAS cloud        |

### Code Quality

| Command                 | Description               |
| ----------------------- | ------------------------- |
| `task quality:lint`     | Run ESLint                |
| `task quality:lint-fix` | Run ESLint with auto-fix  |
| `task quality:format`   | Format code with Prettier |
| `task quality:test`     | Run tests                 |

### Environment

| Command                       | Description                    |
| ----------------------------- | ------------------------------ |
| `task setup:base`             | Setup development environment  |
| `pnpm run expo:env:pull:prod` | Pull prod environment from EAS |
| `task setup:env-check`        | Verify environment variables   |

## Environment Variables

Environment variables are managed via `.env` files:

- `.env.example` - Template with all variables
- `.env` - Base configuration from EAS
- `.env.maestro.example` - E2E testing template
- `.env.maestro` - E2E testing configuration

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
| Node.js         | 20.19.6 |
| pnpm            | 9.0.0   |
| React Native    | 0.76.9  |
| Expo SDK        | 52.0.48 |
| TypeScript      | 5.1.3   |
| Hermes Engine   | 0.76.9  |
| Firebase SDK    | 12.4.0  |
| CocoaPods       | 1.16.2  |
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
