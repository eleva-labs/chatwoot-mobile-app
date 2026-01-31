# GitHub Actions Workflows - Maestro E2E Tests

This directory contains GitHub Actions workflows for running Maestro mobile UI automation tests.

## Workflows

### Android Workflow (`maestro-android.yml`)

**Trigger**:

- Pull requests to `development` branch
- Push to `development` or `main` branches
- **Path filters**: `src/**`, `maestro/**`, `package.json`
- Manual trigger via `workflow_dispatch`

**Why different from iOS?** (See "Trigger Rationale" section below)

**Runner**: `ubuntu-latest`

**Features**:

- Sets up Java 17 and Node.js 20
- Installs Maestro CLI
- Configures Android Emulator (API 33, Pixel 6)
- Builds and installs APK
- Runs Maestro smoke tests
- Generates JUnit XML reports
- Uploads artifacts (screenshots, test results)
- Includes build caching (Gradle, pnpm)

### iOS Workflow (`maestro-ios.yml`)

**Trigger**:

- Push to `main` branch only (expensive macOS runners)
- Manual trigger via `workflow_dispatch`
- **Path filters**: `src/**`, `maestro/**`, `package.json`, `app.config.ts`, `ios/**`

**Why different from Android?** (See "Trigger Rationale" section below)

---

## Trigger Rationale

### Why Do Android and iOS Workflows Have Different Triggers?

The two workflows use different trigger strategies for intentional reasons:

| Aspect                  | Android Workflow                                                             | iOS Workflow                                     | Rationale                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| **Runner Cost**         | Ubuntu-latest (low cost, abundant)                                           | macOS-14 (expensive, limited)                    | Cost optimization - run Android tests frequently (every PR) but iOS tests less often (main push only) |
| **Test Feedback Speed** | PR-level testing provides fast feedback                                      | Main push only (less frequent)                   | Faster feedback cycle on Android vs. cost-efficient iOS testing                                       |
| **Workflow Complexity** | Higher complexity with path filters (`src/**`, `maestro/**`, `package.json`) | Simpler - just push to main                      | Lower complexity for iOS vs. better coverage with Android path filters                                |
| **Test Frequency**      | Every PR to development, push to development/main                            | Push to main only                                | Frequent Android validation vs. critical iOS validation                                               |
| **Path Coverage**       | Explicit path filters ensure tests run on relevant changes                   | No path filters (implicit coverage)              | Better coverage on Android vs. simpler iOS workflow                                                   |
| **Resource Usage**      | Ubiquitous resources, can run tests often                                    | Limited macOS runners, prioritize critical paths | Resource efficiency - test Android often, iOS only when necessary                                     |

### Design Trade-offs

**Android Approach (PR + push with path filters)**:

- ✅ **Faster feedback loop** - Every PR gets tested, catches issues early
- ✅ **Better path coverage** - Explicit filters ensure tests run on relevant changes (`src/**`, `maestro/**`, `package.json`)
- ✅ **Lower cost** - Ubuntu runners are cheap and abundant
- ⚠️ **Longer workflow runs** - Emulator setup + build + test on every PR
- ⚠️ **More complexity** - Path filters and multiple trigger conditions

**iOS Approach (push to main only)**:

- ✅ **Lower cost** - Run expensive macOS runners only when truly needed
- ✅ **Simpler workflow** - Minimal trigger configuration reduces complexity
- ✅ **Focus on critical paths** - Main push ensures production readiness
- ⚠️ **Slower feedback loop** - No PR-level testing, issues caught later
- ⚠️ **Potential missed coverage** - No path filters, might miss iOS-specific changes that don't trigger main push

### Decision

This is a **strategic trade-off** balancing cost, coverage, and feedback speed:

- **Android** tests run on every PR for rapid feedback and broad path coverage
- **iOS** tests run on main pushes to validate production readiness and control costs

This aligns with the Maestro POC design goal of validating critical paths across both platforms while managing CI/CD resources efficiently.

**Runner**: `macos-14`

**Features**:

- Sets up Xcode 15.4 and Node.js 20
- Installs Maestro CLI
- Installs idb-companion (required for iOS Simulator)
- Boots iOS Simulator (iPhone 15 Pro)
- Builds and installs iOS app
- Runs Maestro smoke tests
- Generates JUnit XML reports
- Uploads artifacts (screenshots, test results)
- Includes build caching (CocoaPods, pnpm)

## Environment Variables

Both workflows use the following environment variables:

| Variable      | Value                               | Description               |
| ------------- | ----------------------------------- | ------------------------- |
| `BACKEND_URL` | `https://dev.app.chatscommerce.com` | Dev backend for CI/CD     |
| `APP_ID`      | `com.chatscommerce.app.dev`         | Dev app bundle identifier |
| `CI`          | `true`                              | CI environment flag       |

## Required GitHub Secrets

To run the workflows, you must configure the following secrets in your GitHub repository settings:

### Navigate to Secrets Settings

1. Go to your GitHub repository
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add each secret from the table below

### Secret List

| Secret Name          | Description              | Required For         |
| -------------------- | ------------------------ | -------------------- |
| `E2E_USER_EMAIL`     | Test agent user email    | Android + iOS        |
| `E2E_USER_PASSWORD`  | Test agent user password | Android + iOS        |
| `E2E_ADMIN_EMAIL`    | Test admin user email    | Admin tests (if any) |
| `E2E_ADMIN_PASSWORD` | Test admin user password | Admin tests (if any) |

### Adding Secrets

1. Click **New repository secret**
2. Enter the **Name** (e.g., `E2E_USER_EMAIL`)
3. Enter the **Value** (e.g., `e2e-agent@your-domain.com`)
4. Click **Add secret**

### Test User Requirements

- Test users must exist on the dev backend (`https://dev.app.chatscommerce.com`)
- Agent user should have standard access permissions
- Admin user should have admin permissions (for admin-only tests)
- Ensure passwords are strong and meet backend requirements

## Test Paths

Workflows can be manually triggered with a custom test path:

**Default**: `flows/smoke/` (smoke tests only)

**Custom paths** (via workflow_dispatch):

- `flows/` (all tests)
- `flows/auth/` (authentication tests only)
- `flows/conversations/` (conversation tests only)
- `flows/inbox/` (inbox tests only)

## Artifacts

Workflows upload the following artifacts:

| Artifact                          | Retention | Description                |
| --------------------------------- | --------- | -------------------------- |
| `maestro-test-results-<platform>` | 14 days   | JUnit XML test results     |
| `maestro-screenshots-<platform>`  | 7 days    | Screenshots from test runs |

## Test Reports

Both workflows use `dorny/test-reporter@v1` to display test results in the GitHub UI:

- Test results appear as a comment on PRs or commits
- JUnit format integration
- Failing tests highlighted in red
- Failed tests show individual test case details

## Build Caching

### Android Workflow Caches:

- **Gradle packages**: `~/.gradle/caches`, `~/.gradle/wrapper`
- **pnpm packages**: `~/.pnpm-store`

### iOS Workflow Caches:

- **CocoaPods**: `~/Library/Caches/CocoaPods`
- **pnpm packages**: `~/.pnpm-store`

Caching significantly reduces build times on subsequent workflow runs.

## Troubleshooting

### Workflow Failures

1. Check the **Actions** tab for workflow runs
2. Review the job logs for error messages
3. Download artifacts (screenshots, test results) for debugging

### Secrets Not Working

- Verify secrets are correctly named (case-sensitive)
- Ensure secrets are set for the correct repository
- Check workflow run logs for secret references

### Emulator/Simulator Issues

- **Android**: Emulator boot timeout may increase for slow runners
- **iOS**: Simulator may require additional boot time on first run

## Local Testing

To test workflows locally before pushing:

```bash
# Run Maestro tests locally against dev backend
BACKEND_URL=https://dev.app.chatscommerce.com pnpm maestro:test:smoke:dev
```

## Additional Resources

- [Maestro Documentation](https://docs.maestro.dev)
- [Maestro GitHub Actions Guide](https://docs.maestro.dev/cloud/ci-integration/github-actions)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
