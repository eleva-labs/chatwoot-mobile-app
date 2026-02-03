# Setup Guide

This guide covers setting up the development environment for the Chatscommerce Mobile App.

## Quick Setup (Recommended)

```bash
git clone <repo-url>
cd chatwoot-mobile-app
./scripts/setup/setup.sh
```

The setup script handles everything automatically, including authentication prompts.

## What Gets Installed

The setup script installs and configures:

| Tool | Version | Purpose |
|------|---------|---------|
| Volta | Latest | Node.js version manager |
| Node.js | 22.x | JavaScript runtime |
| pnpm | 10.x | Package manager |
| Expo CLI | Latest | Expo development tools |
| EAS CLI | Latest | Build and update services |
| CocoaPods | Latest | iOS dependency manager (macOS only) |
| Watchman | Latest | File watching (macOS only) |
| JDK | 17 | Android development |

## Setup Phases

The setup runs in five phases:

### Phase 1: Tool Installation (Automated)
Scripts 00-04 install all required development tools without interaction.

### Phase 2: Authentication (Interactive)
Script 05 prompts for:
1. **EAS Login** - Required for pulling environment variables, cloud builds, and OTA updates
2. **Firebase Login** - Optional, enables automatic credential download

### Phase 3: Platform Dependencies
Scripts 06-07 install platform-specific dependencies:
- iOS: CocoaPods, Watchman (macOS only)
- Android: JDK 17, environment configuration

### Phase 4: Project Configuration
Scripts 08-10 configure the project:
- Install npm dependencies
- Create/configure `.env` file
- Validate Firebase credentials

### Phase 5: Verification
Script 11 verifies the complete setup and provides a summary.

## Setup Options

```bash
# Full setup (both platforms)
./scripts/setup/setup.sh

# iOS only
./scripts/setup/setup.sh --ios

# Android only
./scripts/setup/setup.sh --android

# Skip specific scripts
./scripts/setup/setup.sh --skip=05,06

# Non-interactive mode (CI/CD)
./scripts/setup/setup.sh --non-interactive

# Show help
./scripts/setup/setup.sh --help
```

## After Setup

1. **Restart your terminal** to apply shell configuration changes
2. Verify setup: `./scripts/setup/11_verify_setup.sh`
3. Start development: `pnpm start`

## Detailed Guides

| Guide | Description |
|-------|-------------|
| [Prerequisites](01-prerequisites.md) | System requirements |
| [Automated Setup](02-automated-setup.md) | Using setup.sh |
| [Manual Setup](03-manual-setup.md) | Step-by-step manual setup |
| [Authentication](04-authentication.md) | EAS and Firebase auth |
| [Firebase Credentials](05-firebase-credentials.md) | Firebase setup |
| [Environment Variables](06-environment-variables.md) | Environment configuration |
| [Troubleshooting](07-troubleshooting.md) | Common issues |

## Quick Reference

| Task | Command |
|------|---------|
| Run full setup | `./scripts/setup/setup.sh` |
| Verify setup | `./scripts/setup/11_verify_setup.sh` |
| Pull dev environment | `pnpm run env:pull:dev` |
| Start development | `pnpm start` |
| Run on iOS | `pnpm run ios:dev` |
| Run on Android | `pnpm run android:dev` |

---

**Next:** [Prerequisites](01-prerequisites.md)
