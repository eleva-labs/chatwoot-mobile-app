# Automated Setup

Using the setup script to configure your development environment.

## Quick Start

```bash
./scripts/setup/setup.sh
```

This single command handles the entire setup process.

## Setup Script Overview

The setup script (`scripts/setup/setup.sh`) runs 12 individual scripts organized into 5 phases:

```
Phase 1: Tool Installation (Automated)
  00_check_system.sh      - Verify system requirements
  01_install_volta.sh     - Install Volta (Node version manager)
  02_install_node.sh      - Install Node.js 22.x
  03_install_pnpm.sh      - Install pnpm 10.x
  04_install_expo_eas.sh  - Install Expo CLI and EAS CLI

Phase 2: Authentication (Interactive)
  05_setup_auth.sh        - EAS and Firebase login

Phase 3: Platform Dependencies
  06_install_ios_deps.sh  - CocoaPods, Watchman (macOS only)
  07_install_android_deps.sh - JDK 17, environment config

Phase 4: Project Configuration
  08_install_project_deps.sh - npm dependencies
  09_setup_env.sh           - Environment file setup
  10_setup_firebase.sh      - Firebase credentials

Phase 5: Verification
  11_verify_setup.sh      - Final verification
```

## Command Line Options

```bash
# Full setup (both platforms)
./scripts/setup/setup.sh

# iOS only (skips Android dependencies)
./scripts/setup/setup.sh --ios

# Android only (skips iOS dependencies)
./scripts/setup/setup.sh --android

# Skip specific scripts by number
./scripts/setup/setup.sh --skip=05,06

# Non-interactive mode (uses defaults, skips prompts)
./scripts/setup/setup.sh --non-interactive

# Show help
./scripts/setup/setup.sh --help
```

## Interactive Prompts

During setup, you will be prompted for:

### 1. Platform Selection
```
Platform selection:
  1) iOS only
  2) Android only
  3) Both (recommended)
```

### 2. EAS Authentication
```
Login to EAS now? (Y/n):
```
Logging in enables pulling environment variables and cloud builds.

### 3. Firebase Authentication
```
Login to Firebase now? (Y/n/skip):
```
Optional. Enables automatic credential download.

### 4. Existing .env Handling
```
Keep existing .env? (Y/n):
```
If `.env` exists, you can keep it or replace it.

### 5. EAS Environment Pull
```
Would you like to pull environment variables from EAS now?
  1) Pull development environment
  2) Pull production environment
  3) Skip - I'll configure manually
```

## Non-Interactive Mode

For CI/CD or automated setups:

```bash
./scripts/setup/setup.sh --non-interactive
```

In this mode:
- Platform defaults to "both"
- Authentication prompts are skipped
- Existing `.env` is preserved
- EAS pull is skipped

## Running Individual Scripts

Each script can be run independently:

```bash
# Run a specific script
./scripts/setup/01_install_volta.sh

# Skip a script during full setup
./scripts/setup/setup.sh --skip=05

# Re-run verification
./scripts/setup/11_verify_setup.sh
```

## Post-Setup Steps

After setup completes:

1. **Restart your terminal** (or source your shell config)
   ```bash
   source ~/.zshrc  # or ~/.bashrc
   ```

2. **Verify the setup**
   ```bash
   ./scripts/setup/11_verify_setup.sh
   ```

3. **Configure environment** (if not done during setup)
   ```bash
   pnpm run env:pull:dev
   ```

4. **Start development**
   ```bash
   pnpm start
   ```

## Troubleshooting

### Setup Fails at a Specific Script

Re-run just that script:
```bash
./scripts/setup/07_install_android_deps.sh
```

Then continue from verification:
```bash
./scripts/setup/11_verify_setup.sh
```

### Shell Configuration Not Applied

Restart terminal or manually source:
```bash
source ~/.zshrc
# or
source ~/.bashrc
```

### Permission Denied

Ensure scripts are executable:
```bash
chmod +x scripts/setup/*.sh
```

### Skip Previously Completed Steps

```bash
./scripts/setup/setup.sh --skip=00,01,02,03
```

---

**Previous:** [Prerequisites](01-prerequisites.md) | **Next:** [Manual Setup](03-manual-setup.md)
