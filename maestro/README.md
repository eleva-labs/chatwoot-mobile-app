# Maestro E2E Testing

## Overview

This project uses [Maestro](https://docs.maestro.dev) for mobile UI automation testing. Maestro provides deterministic, YAML-based test execution.

### Key Principle

**Tests run as pure YAML, deterministic execution. AI is only for exploratory testing (optional).**

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

### Installation

```bash
# Install Maestro and dependencies
task maestro-setup

# Verify installation
maestro --version
maestro doctor
```

### Test Credentials Setup

```bash
# Copy example file
cp .env.maestro.local.example .env.maestro.local

# Edit with your test credentials
# E2E_USER_EMAIL=your-test-email@example.com
# E2E_USER_PASSWORD=your-test-password
# E2E_ADMIN_EMAIL=your-admin-email@example.com
# E2E_ADMIN_PASSWORD=your-admin-password
```

### Device/Emulator Setup

**iOS** (macOS only):

```bash
# Boot iOS Simulator
task run-ios
```

**Android**:

```bash
# Run Android Emulator
task run-android
```

### Running Tests

#### Important: Metro Bundler

If you are testing a **Debug build** (default for local development), ensure Metro is running:

```bash
# Start Metro in background
task start &
```

For **Release builds** (CI/CD), Metro is not required.

#### All Tests

```bash
# Run all tests (default: local backend)
task maestro-test

# Against dev backend
task maestro-test-dev
```

#### Smoke Tests Only

```bash
# Default backend
task maestro-test-smoke

# Against dev backend
task maestro-test-smoke-dev
```

#### Manual Maestro Commands

If you need granular control or want to run specific flows without Task:

```bash
# Run specific flow
maestro test maestro/flows/auth/login.yaml

# Run all flows in a directory
maestro test maestro/flows/auth/
```

## Development Workflow

### Exploratory Testing (Step 1)

Use Maestro Studio to explore the app and generate draft flows:

```bash
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

## Exploratory Testing Workflow

Maestro Studio is an interactive tool for exploring the app and generating test flows. It's used for:

- Exploring UI elements and accessibility tree
- Recording interactions as YAML flows
- Understanding element selectors and testIDs
- Creating draft flows for refinement

### When to Use Exploratory Testing

Use Maestro Studio when:

- **Creating new test flows** - Start from scratch by exploring the app
- **Investigating UI changes** - Understand new screens and components
- **Debugging element selection** - Find the right selectors for elements
- **Learning Maestro features** - Experiment with Maestro's capabilities

### How It Works

1. **Launch Studio**:

   ```bash
   pnpm maestro:studio
   # or
   task maestro-studio
   ```

2. **Connect Device/Simulator**:
   - Ensure iOS Simulator or Android Emulator is running
   - Studio will detect and connect automatically

3. **Explore App**:
   - Navigate through the app manually
   - Use Studio's element inspector to find testIDs
   - Try tapping elements to see what selectors Maestro suggests
   - Record actions to generate YAML flow

4. **Generate Draft Flow**:
   - Studio creates YAML flow based on your interactions
   - Save to `maestro/exploratory/` as draft

5. **Refine and Transform**:
   - Apply the transformation checklist (see "Transformation Checklist" section)
   - Move refined flow to `flows/<category>/<name>.yaml`
   - Delete draft from `exploratory/`

### Studio Features

- **Element Inspector**: Click on any UI element to see its properties:
  - `id` (testID) - preferred selector
  - `text` - element text
  - `label` - accessibility label
  - `bounds` - position (avoid if possible)
  - `className` - component type

- **Flow Recording**: Actions are recorded as you interact:
  - Tap actions
  - Input actions
  - Scroll actions
  - Swipe actions
  - Wait/assert actions

- **Copy to Clipboard**: Copy YAML snippets
- **Visual mirroring**: See device/simulator in real-time
- **Code suggestions**: Maestro suggests React Native selectors

### Best Practices

- **Use testIDs over text selectors**: More stable across UI changes
- **Record end-to-end flows**: Not just individual interactions
- **Add comments during recording**: Explain what each step does
- **Test on both platforms**: Verify flows work on iOS and Android
- **Iterate quickly**: Draft → refine → test → repeat

### Limitations

- Manual process: Requires human interaction to explore
- No AI generation: Studio is purely interactive, not AI-powered
- Exploratory recordings are drafts: Must be refined before committing

### Integration with Development Workflow

Exploratory testing is **Step 1** of the three-step workflow:

1. **Exploratory** (Step 1) - Use Maestro Studio, save to `exploratory/`
2. **Transformation** (Step 2) - Apply checklist, move to `flows/`
3. **Execution** (Step 3) - Run deterministically without AI

### Transformation Checklist

Before committing a flow to `flows/`:

**Selector Quality**

- [ ] Replace all `tapOn: "text"` with `tapOn: { id: "testID" }` where possible
- [ ] Verify testIDs exist in React Native components
- [ ] Use text selectors only for dynamic/user-visible content
- [ ] Avoid position-based selectors (`point: "x, y"`)

**Flow Structure**

- [ ] No `appId` header (use config.yaml instead)
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

| Variable              | Description                 | Default                     |
| --------------------- | --------------------------- | --------------------------- |
| `MAESTRO_BACKEND_URL` | Backend URL to test against | `http://localhost:3000`     |
| `APP_ID`              | App identifier              | `com.chatscommerce.app.dev` |
| `LAUNCH_TIMEOUT`      | App launch timeout (ms)     | `30000`                     |
| `ELEMENT_TIMEOUT`     | Element wait timeout (ms)   | `10000`                     |
| `E2E_USER_EMAIL`      | Test agent email            | From `.env.maestro.local`   |
| `E2E_USER_PASSWORD`   | Test agent password         | From `.env.maestro.local`   |
| `E2E_ADMIN_EMAIL`     | Test admin email            | From `.env.maestro.local`   |
| `E2E_ADMIN_PASSWORD`  | Test admin password         | From `.env.maestro.local`   |

### Centralized Configuration

All flows rely on `config.yaml` for APP_ID configuration:

```yaml
# maestro/.maestro/config.yaml
env:
  APP_ID: 'com.chatscommerce.app.dev'
  MAESTRO_BACKEND_URL: ${MAESTRO_BACKEND_URL:-http://localhost:3000}
```

**Single source of truth** - no need to edit individual flow files when APP_ID changes.

**Runtime Overrides**:

```bash
# Override APP_ID
APP_ID=com.chatscommerce.app maestro test maestro/flows/

# Override backend
MAESTRO_BACKEND_URL=https://dev.app.chatscommerce.com maestro test maestro/flows/
```

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

## Helper Flows (`helpers/`)

Reusable sub-flows:

- `login-as-agent.yaml` - Log in as test agent user
- `login-as-admin.yaml` - Log in as admin user
- `clear-app-state.yaml` - Clear app state for fresh tests
- `navigate-to-conversations.yaml` - Navigate to conversations tab

**Usage in flows**:

```yaml
- runFlow: ../../helpers/login-as-agent.yaml
- runFlow: ../../helpers/navigate-to-conversations.yaml
```

## Local Testing

To test workflows locally before pushing:

```bash
# Run Maestro tests locally against dev backend
MAESTRO_BACKEND_URL=https://dev.app.chatscommerce.com pnpm maestro:test:smoke:dev
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
5. Check for timing issues between steps

### Secrets Not Working (CI)

1. Verify secrets are correctly named (case-sensitive)
2. Ensure secrets are set for correct repository
3. Check workflow run logs for secret references
4. Ensure test users exist on dev backend

See `.github/workflows/README.md` for detailed GitHub Actions troubleshooting.

## CI/CD Integration

Tests run automatically in CI/CD via GitHub Actions:

- **Android**: On every PR to `development` branch (frequent feedback, broad path coverage)
- **iOS**: On every push to `main` branch (production readiness, cost optimization)

See `.github/workflows/README.md` for detailed workflow configuration, triggers, secrets, and troubleshooting.

## Resources

- [Maestro Documentation](https://docs.maestro.dev)
- [Maestro React Native](https://docs.maestro.dev/platform-support/react-native)
- [Maestro GitHub Actions](https://docs.maestro.dev/cloud/ci-integration/github-actions)
- [Expo E2E with Maestro](https://docs.expo.dev/eas/workflows/examples/e2e-tests/)

## Support

For issues or questions:

1. Check this README's Troubleshooting section
2. Review Maestro docs
3. Check `.github/workflows/README.md` for CI/CD issues
4. Contact development team
