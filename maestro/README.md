# Maestro E2E Testing

## Overview

This directory contains Maestro-based E2E (end-to-end) tests for the Chatwoot Mobile App. Maestro is a mobile UI testing framework that provides deterministic test execution via YAML flows.

## Key Principle

**Maestro does NOT require LLM for test execution.** The core `maestro test` command is 100% deterministic, executing YAML flows against the device's accessibility tree without any AI involvement. AI features are optional add-ons for exploratory testing only.

## Directory Structure

```
maestro/
├── .maestro/
│   └── config.yaml              # Global configuration
├── flows/
│   ├── auth/                    # Authentication test flows
│   ├── conversations/            # Conversation test flows
│   ├── inbox/                   # Inbox test flows
│   └── smoke/                   # Smoke test suites (critical paths)
├── helpers/                     # Reusable sub-flows (login, navigation, etc.)
├── exploratory/                 # Maestro Studio recordings (draft flows)
└── README.md                    # This file
```

## Quick Start

### Prerequisites

1. **Maestro CLI**: Install via setup script

   ```bash
   ./scripts/maestro/setup.sh
   ```

2. **Test Credentials**: Configure environment

   ```bash
   cp .env.maestro.local.example .env.maestro.local
   # Edit .env.maestro.local with your test credentials
   ```

3. **Device/Emulator**: Start iOS Simulator or Android Emulator

### Running Tests

#### All Tests

```bash
# Default: uses BACKEND_URL from env or http://localhost:3000
pnpm maestro:test

# Against local backend
pnpm maestro:test:local

# Against dev backend
pnpm maestro:test:dev
```

#### Smoke Tests Only

```bash
# Default backend
pnpm maestro:test:smoke

# Against dev backend
pnpm maestro:test:smoke:dev
```

#### Using Task Runner

```bash
# All tests
task maestro-test

# Local backend
task maestro-test-local

# Dev backend
task maestro-test-dev

# Smoke tests
task maestro-test-smoke
```

#### Manual Maestro Commands

```bash
# Run specific flow
maestro test maestro/flows/auth/login.yaml

# Run all flows in a directory
maestro test maestro/flows/auth/

# List available flows
maestro test --list maestro/flows/
```

## Development Workflow

### Exploratory Testing (Step 1)

Use Maestro Studio to explore the app and generate draft flows:

```bash
pnpm maestro:studio
# or
task maestro-studio
```

Studio will open at http://localhost:9999, providing:

- Visual element inspector
- Device/simulator mirroring
- Drag-and-drop flow building
- Generated YAML snippets

Save recordings to `maestro/exploratory/` as draft flows.

### Transformation (Step 2)

Convert Studio recordings to formal test flows:

1. **Replace selectors**: Use `testID` props instead of text selectors
2. **Add assertions**: Include explicit assertions for key states
3. **Use helpers**: Call reusable flows via `runFlow`
4. **Environment vars**: Use `${E2E_USER_EMAIL}` instead of hardcoded credentials
5. **Test platforms**: Verify on iOS Simulator AND Android Emulator

Move refined flows from `exploratory/` to `flows/<category>/<name>.yaml`.

### Execution (Step 3)

Run tests deterministically (no AI involved):

```bash
maestro test maestro/flows/
```

### Transformation Checklist

Before committing a flow to `flows/`:

**Selector Quality**

- [ ] Replace all `tapOn: "text"` with `tapOn: { id: "testID" }` where possible
- [ ] Verify testIDs exist in React Native components
- [ ] Use text selectors only for dynamic/user-visible content
- [ ] Avoid position-based selectors (`point: "x, y"`)

**Flow Structure**

- [ ] Add `appId` header (use `${APP_ID:-com.chatwoot.mobile}`)
- [ ] Add `clearState` before `launchApp` (for clean state)
- [ ] Use environment variables for credentials (`${E2E_USER_EMAIL}`)
- [ ] Add descriptive comments for each section
- [ ] Use `runFlow` for reusable login/navigation steps

**Assertions**

- [ ] Add explicit assertions (not just actions)
- [ ] Include `timeout` for slow operations
- [ ] Verify both positive and negative states
- [ ] Add `takeScreenshot` for key verification points

**Platform Testing**

- [ ] Test passes 3 consecutive times on iOS Simulator
- [ ] Test passes 3 consecutive times on Android Emulator
- [ ] No platform-specific hardcoding (unless intentional)
- [ ] Use conditional `when: { platform: iOS }` for platform-specific steps

**Final Checks**

- [ ] No AI-specific commands (`assertWithAI`, etc.) - keep deterministic
- [ ] No hardcoded credentials in flow file
- [ ] Draft deleted from `exploratory/` folder
- [ ] Flow committed with descriptive commit message

## Configuration

### Environment Variables

| Variable             | Description                 | Default                   |
| -------------------- | --------------------------- | ------------------------- |
| `BACKEND_URL`        | Backend URL to test against | `http://localhost:3000`   |
| `APP_ID`             | App identifier              | `com.chatwoot.mobile`     |
| `LAUNCH_TIMEOUT`     | App launch timeout (ms)     | `30000`                   |
| `ELEMENT_TIMEOUT`    | Element wait timeout (ms)   | `10000`                   |
| `E2E_USER_EMAIL`     | Test agent email            | From `.env.maestro.local` |
| `E2E_USER_PASSWORD`  | Test agent password         | From `.env.maestro.local` |
| `E2E_ADMIN_EMAIL`    | Test admin email            | From `.env.maestro.local` |
| `E2E_ADMIN_PASSWORD` | Test admin password         | From `.env.maestro.local` |

### Backend Selection

Tests can run against different backends:

| Environment     | Backend                             | Command                   |
| --------------- | ----------------------------------- | ------------------------- |
| Local (default) | `http://localhost:3000`             | `pnpm maestro:test:local` |
| Dev             | `https://dev.app.chatscommerce.com` | `pnpm maestro:test:dev`   |

## Test Categories

### Smoke Tests (`flows/smoke/`)

Critical path tests that run on every PR:

- Login
- View conversation list
- Open conversation
- Send reply

**Duration**: 3-5 minutes

### Authentication Tests (`flows/auth/`)

Tests covering authentication flows:

- Successful login
- Invalid credentials
- Logout

### Conversation Tests (`flows/conversations/`)

Tests covering conversation management:

- View conversations
- Open conversation
- Send reply
- Attach files

### Inbox Tests (`flows/inbox/`)

Tests covering inbox management:

- View inbox
- Filter conversations
- Status updates

## Helper Flows

Reusable sub-flows in `helpers/`:

### `login-as-agent.yaml`

Logs in as the test agent user. Used by most test flows.

```yaml
- runFlow: ../../helpers/login-as-agent.yaml
```

### `login-as-admin.yaml`

Logs in as the test admin user for admin-only features.

```yaml
- runFlow: ../../helpers/login-as-admin.yaml
```

### `clear-app-state.yaml`

Clears app state for fresh test starts.

```yaml
- runFlow: ../../helpers/clear-app-state.yaml
```

## Troubleshooting

### Maestro Not Found

```bash
# Add Maestro to PATH
export PATH="$HOME/.maestro/bin:$PATH"

# Or run setup script
./scripts/maestro/setup.sh
```

### Device Not Found

```bash
# Check iOS Simulator
xcrun simctl list devices

# Check Android Emulator
adb devices

# Start emulator if needed
# macOS: open -a Simulator
# Android: emulator -avd <name>
```

### Tests Timing Out

1. Increase timeouts in `maestro/.maestro/config.yaml`
2. Check if app is installed on device
3. Verify backend is accessible
4. Check network connectivity

### Element Not Found

1. Use `maestro studio` to inspect current screen
2. Verify testID exists in React Native component
3. Check if element is visible/accessible
4. Try waiting for element before tapping

### Tests Flaky

1. Increase timeouts for slow operations
2. Add explicit waits for dynamic content
3. Use `testID` selectors instead of text selectors
4. Run on same device/simulator version as CI

## CI/CD Integration

Tests run automatically in CI/CD via GitHub Actions:

- **Android**: On every PR to `development` branch
- **iOS**: On every push to `main` branch (macOS runner)

See `.github/workflows/maestro-android.yml` and `.github/workflows/maestro-ios.yml` for configuration.

## Resources

- [Maestro Documentation](https://docs.maestro.dev)
- [Maestro React Native](https://docs.maestro.dev/platform-support/react-native)
- [Maestro GitHub Actions](https://docs.maestro.dev/cloud/ci-integration/github-actions)
- [Expo E2E with Maestro](https://docs.expo.dev/eas/workflows/examples/e2e-tests/)

## Support

For issues or questions:

1. Check this README's Troubleshooting section
2. Review Maestro docs
3. Check DESIGN_PROPOSAL.md for design decisions
4. Contact the development team
