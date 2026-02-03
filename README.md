# Chatscommerce Mobile App

A mobile customer support application built on [Chatwoot](https://chatwoot.com) open-source platform, enabling support agents to manage conversations on the go.

## Overview

React Native application providing real-time customer support for iOS and Android. Features include push notifications, deep linking, and over-the-air updates.

| Technology | Version |
|------------|---------|
| React Native | 0.76.9 |
| Expo SDK | ~52.0.47 |
| Node.js | >=22.12.0 |
| TypeScript | 5.1.3 |

## Quick Start

```bash
git clone <repo-url>
cd chatwoot-mobile-app
./scripts/setup/setup.sh
```

After setup completes, restart your terminal and run:

```bash
pnpm start
```

> **Note:** The setup script installs Volta, Node.js, pnpm, Expo CLI, and platform dependencies automatically. See [Setup Guide](docs/setup/README.md) for details.

## Development

| Command | Description |
|---------|-------------|
| `pnpm start` | Start Expo dev server |
| `pnpm run ios:dev` | Run on iOS simulator |
| `pnpm run android:dev` | Run on Android emulator |
| `pnpm run env:pull:dev` | Pull dev environment from EAS |
| `pnpm test` | Run tests |
| `pnpm run lint` | Run ESLint |

### Platform-Specific Setup

**iOS (macOS only):**
- Xcode 16.x from Mac App Store
- Firebase credentials in `credentials/ios/`

**Android:**
- Android Studio with SDK 35
- JDK 17 (installed by setup script)
- Firebase credentials in `credentials/android/`

## Documentation

| Topic | Location |
|-------|----------|
| Setup Guide | [docs/setup/](docs/setup/README.md) |
| Development Processes | [docs/processes/](docs/processes/INDEX.md) |
| Prerequisites | [docs/setup/01-prerequisites.md](docs/setup/01-prerequisites.md) |
| Authentication | [docs/setup/04-authentication.md](docs/setup/04-authentication.md) |
| Firebase Setup | [docs/setup/05-firebase-credentials.md](docs/setup/05-firebase-credentials.md) |
| Troubleshooting | [docs/setup/07-troubleshooting.md](docs/setup/07-troubleshooting.md) |

## Building

```bash
# Local builds
pnpm run build:android:local
pnpm run build:ios:local

# Cloud builds (EAS)
pnpm run build:android:prod
pnpm run build:ios:prod
```

## Contributing

1. Branch from `development`
2. Make changes and test on both platforms
3. Run `pnpm run lint && pnpm test`
4. Create Pull Request to `development`

<details>
<summary><strong>All Available Scripts</strong></summary>

### Development
| Script | Description |
|--------|-------------|
| `pnpm start` | Start Expo dev server |
| `pnpm run android:dev` | Run on Android (dev) |
| `pnpm run ios:dev` | Run on iOS (dev) |
| `pnpm run generate` | Generate native code |
| `pnpm run generate:soft` | Soft prebuild |

### Environment
| Script | Description |
|--------|-------------|
| `pnpm run env:pull:dev` | Pull dev environment |
| `pnpm run env:pull:prod` | Pull prod environment |

### iOS
| Script | Description |
|--------|-------------|
| `pnpm run ios:pods` | Install CocoaPods |
| `pnpm run ios:simulator` | Build for simulator |
| `pnpm run ios:clean` | Clean iOS build |
| `pnpm run ios:logs` | Stream simulator logs |

### Building
| Script | Description |
|--------|-------------|
| `pnpm run build:android:local` | Build Android locally |
| `pnpm run build:android:prod` | Build Android via EAS |
| `pnpm run build:ios:local` | Build iOS locally |
| `pnpm run build:ios:prod` | Build iOS via EAS |

### Quality
| Script | Description |
|--------|-------------|
| `pnpm test` | Run tests |
| `pnpm run lint` | Run ESLint |
| `pnpm run format` | Format with Prettier |
| `pnpm run run:doctor` | Expo diagnostics |

### Storybook
| Script | Description |
|--------|-------------|
| `pnpm run start:storybook` | Start Storybook |
| `pnpm run storybook:ios` | Storybook on iOS |
| `pnpm run storybook:android` | Storybook on Android |

</details>

<details>
<summary><strong>Troubleshooting</strong></summary>

### Metro bundler issues
```bash
pnpm run clean && pnpm install
pnpm start --clear
```

### iOS build failures
```bash
cd ios && pod install --repo-update
```
Clear Derived Data in Xcode if issues persist.

### Android build failures
```bash
./scripts/setup/11_verify_setup.sh
```
Verify `ANDROID_HOME` and `JAVA_HOME` are set correctly.

### Environment issues
```bash
pnpm run env:pull:dev
```
Restart dev server after changes.

See [Troubleshooting Guide](docs/setup/07-troubleshooting.md) for more solutions.

</details>
