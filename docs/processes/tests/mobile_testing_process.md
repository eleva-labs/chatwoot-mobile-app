# Mobile Testing Process Guide

**Version**: 1.0.0
**Last Updated**: 2025-01-27
**Status**: Active
**Document Type**: Process Guide
**Project**: Chatwoot Mobile App (React Native + Expo)

---

## Overview

**Purpose**: Systematic testing of React Native mobile app features with comprehensive validation across iOS and Android platforms.

**Scope**:
- ✅ Unit tests, component tests, integration tests, manual testing, iOS/Android platform testing, Redux state testing
- ❌ Load/performance testing (separate process), security penetration testing, automated E2E testing (separate process)

**Duration**: 2-8 hours per feature area

---

## Key Principles

1. **Systematic Approach** - Follow 6 phases, document everything
2. **Test in Isolation** - Independent tests, clean up test data
3. **Document First** - Create test plan before executing
4. **Platform Coverage** - Always test on both iOS and Android
5. **Quality Over Speed** - Test error cases, validate all scenarios
6. **Mobile-Specific** - Consider safe areas, navigation, gestures, performance

---

## Process Workflow

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 1. Discovery | 30-60 min | Test plan, feature inventory |
| 2. Planning | 1-2 hours | Test plan with test cases |
| 3. Environment Setup | 15-30 min | Running app, test data |
| 4. Execution | 2-6 hours | Test results document with findings |
| 5. Issue Resolution | Variable | Code fixes, regression tests |
| 6. Documentation | 30-60 min | Updated docs, committed changes |

---

## Phase 1: Discovery

**Objective**: Understand current feature state and testing requirements

### 1.1 Review Feature Implementation

**Locations**:
- Components: `src/components-next/`
- Screens: `src/screens/`
- Redux: `src/store/`
- Navigation: `src/navigation/`
- Types: `src/types/`

**What to look for**: Feature components, screens, Redux slices, navigation routes, types, API integrations

**Tools**:
```bash
# Find feature files
find src -name "*feature_name*" -type f

# Search for feature usage
grep -r "feature_name" src/

# Review Redux slice
cat src/store/feature_name/featureSlice.ts
```

### 1.2 Review Existing Tests

**Locations**:
- Test files: `__tests__/`, `src/**/*.test.ts`, `src/**/*.test.tsx`
- Test utilities: `__mocks__/`

**What to look for**: Existing test coverage, test patterns, test utilities, mocks

**Tools**:
```bash
# Find test files
find . -name "*test*.ts*" -type f

# Review test coverage
pnpm test --coverage

# Check test patterns
grep -r "describe\|it\|test" __tests__/
```

### 1.3 Identify Test Scenarios

**Categories**:
- **Happy Path**: Normal user flows
- **Error Cases**: Network errors, validation errors, edge cases
- **Edge Cases**: Empty states, boundary values, platform differences
- **Integration**: Redux state, navigation, API calls
- **Platform-Specific**: iOS-only, Android-only behaviors

---

## Phase 2: Planning

**Objective**: Create detailed test plan with test cases

### 2.1 Create Test Plan Document

**Location**: `docs/ignore/tests/mobile/<FEATURE>_TEST_PLAN.md`

**Template**: `/docs/processes/tests/TEST_PLAN_TEMPLATE.md`

**Structure**:
- Test Categories: Unit Tests, Component Tests, Integration Tests, Manual Testing, Platform Testing
- For each test: TC number, test description, test steps, expected result, platform (iOS/Android/Both), priority

**Example**:
```markdown
### TC-001: Component Renders Correctly
**Component**: AIChatInterface
**Platform**: Both
**Priority**: High
**Steps**: 
1. Render component with props
2. Verify component renders
**Expected**: Component displays correctly
```

### 2.2 Organize Test Cases

**Recommended order**: Unit tests → Component tests → Integration tests → Manual tests, then by feature area, then happy path → error cases

### 2.3 Include Test Data

Provide: Valid props/data, invalid props/data, edge case values, platform-specific data

---

## Phase 3: Environment Setup

**Objective**: Prepare clean testing environment

### Commands

```bash
# Install dependencies
pnpm install

# Start Metro bundler
pnpm start

# Start iOS simulator (in separate terminal)
pnpm run ios:run

# Start Android emulator (in separate terminal)
pnpm run android:run

# Run tests
pnpm test

# Run tests with coverage
pnpm test --coverage

# Type checking
npx tsc --noEmit

# Linting
pnpm run lint
```

### Verify Environment

```bash
# Check Expo CLI
npx expo --version

# Check Node version
node -v

# Check pnpm version
pnpm -v

# Verify iOS simulator available
xcrun simctl list devices

# Verify Android emulator available
adb devices
```

---

## Phase 4: Execution

**Objective**: Execute tests systematically and track results

### 4.1 Create Test Tracking Document

**Location**: `docs/ignore/tests/mobile/<FEATURE>_TEST_RESULTS.md`

**Template**: `/docs/processes/tests/TEST_RESULTS_TEMPLATE.md`

**Sections**: Test summary table, execution checklist, issues and fixes, detailed results, session notes, final summary

**Status Indicators**: ⏳ Pending, ✅ Pass, ❌ Fail, 🔄 In Progress, ⚠️ Partial

### 4.2 Execute Unit Tests

**Workflow**:
1. Run test with Jest
2. Check results
3. Update tracking document with result
4. If failed, document in Issues section
5. Move to next test

**Commands**:
```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test path/to/test.ts

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

### 4.3 Execute Component Tests

**Using React Native Testing Library**:
```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { Component } from './Component';

test('component renders correctly', () => {
  const { getByText } = render(<Component prop="value" />);
  expect(getByText('Expected Text')).toBeTruthy();
});
```

**Test Areas**:
- Component rendering
- User interactions (press, scroll, input)
- Props handling
- State updates
- Accessibility

### 4.4 Execute Integration Tests

**Test Areas**:
- Redux state updates
- Navigation flows
- API integration
- Component interactions
- Screen transitions

### 4.5 Execute Manual Tests

**iOS Testing**:
```bash
# Start iOS development build
pnpm run ios:run

# Test on physical device (requires setup)
# Test on simulator
```

**Android Testing**:
```bash
# Start Android development build
pnpm run android:run

# Test on physical device (requires setup)
# Test on emulator
```

**Manual Test Checklist**:
- [ ] Feature works on iOS
- [ ] Feature works on Android
- [ ] Dark mode support (if applicable)
- [ ] Safe area handling
- [ ] Navigation flows correctly
- [ ] Redux state updates correctly
- [ ] API integration works
- [ ] Error handling works
- [ ] Loading states work
- [ ] Performance is acceptable
- [ ] Gestures work correctly
- [ ] Keyboard handling works
- [ ] Deep linking works (if applicable)

### 4.6 Real-Time Issue Tracking

**When issue encountered**: Stop → Document → Assess → Decide

**Fix immediately if**: Blocking subsequent tests, data corruption risk, critical crash, platform-specific blocker

**Continue testing if**: Non-blocking, affects specific scenarios, can workaround

---

## Phase 5: Issue Resolution

**Objective**: Fix bugs systematically

### 5.1 Debug and Fix

**Systematic debugging**:

1. **Locate issue**: Search for component, screen, Redux slice, utility
   ```bash
   grep -r "issue_keyword" src/
   ```

2. **Understand flow**: Component → Screen → Redux → API

3. **Read code**: Read each layer to understand the issue

4. **Apply fix**: Follow React Native patterns, fix in appropriate layer, update tests

5. **Update documentation**: Update tracking doc, add code comments

### 5.2 Re-test

```bash
# Re-run failed test
pnpm test path/to/test.ts

# Re-run all tests
pnpm test

# Re-test manually on iOS
pnpm run ios:run

# Re-test manually on Android
pnpm run android:run
```

### 5.3 Regression Testing

**After fixing**:
1. Re-run failed test → Should pass
2. Re-run related tests → Should still pass
3. Re-run all tests in category → Should all pass
4. Re-test manually on both platforms

---

## Phase 6: Documentation

**Objective**: Record results and maintain documentation

### 6.1 Update Documentation

**Files to update**:
- Test results document
- Test plan (mark completed)
- Feature documentation (if applicable)
- README (if setup changed)

### 6.2 Commit Changes

```bash
# Commit code fixes
git add src/
git commit -m "fix: resolve [issue description]

- Fixed [component/screen/Redux] issue
- Updated tests to cover edge case
- Verified on iOS and Android

Refs: Test Session YYYY-MM-DD"

# Commit test documentation
git add docs/ignore/tests/mobile/
git commit -m "docs: add test results for [FEATURE]

Completed comprehensive testing covering:
- XX unit tests
- XX component tests
- XX integration tests
- Manual testing on iOS and Android

All tests passing ✅"

git push
```

---

## Quick Reference

### Testing Commands

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test --coverage

# Run specific test file
pnpm test path/to/test.ts

# Run tests in watch mode
pnpm test --watch

# Type checking
npx tsc --noEmit

# Linting
pnpm run lint
```

### Platform Testing

```bash
# iOS development build
pnpm run ios:run

# Android development build
pnpm run android:run

# Check iOS simulator
xcrun simctl list devices

# Check Android emulator
adb devices
```

### Test File Patterns

```bash
# Find test files
find . -name "*.test.ts*" -type f

# Find test utilities
find __mocks__ -type f

# Find test examples
grep -r "describe\|it\|test" __tests__/
```

---

## Best Practices

**Testing**: Test in isolation, clean up after yourself, document as you go, capture actual results, test happy path first, use meaningful test data, test on both platforms

**Documentation**: Be specific with commands/results/errors, use code blocks, add timestamps, include context, link related docs

**Debugging**: Read error messages carefully, check logs, trace flow (Component → Screen → Redux → API), test your fix, run regression tests

**Platform Testing**: Always test on both iOS and Android, document platform-specific issues, verify safe area handling, test gestures, verify navigation

---

## Troubleshooting

| Issue | Symptoms | Solution | Prevention |
|-------|----------|----------|------------|
| **Tests won't run** | Jest fails/exits | Check Node version, verify dependencies, clear cache (`pnpm test --clearCache`) | Keep dependencies updated |
| **iOS simulator issues** | Simulator won't start | Check Xcode installed, verify simulator available, restart Metro | Keep Xcode updated |
| **Android emulator issues** | Emulator won't start | Check Android Studio installed, verify emulator configured, check ADB | Keep Android Studio updated |
| **Tests fail intermittently** | Same test passes/fails randomly | Reset state between tests, add delays, use unique test data, mock external services | Write isolated tests |
| **TypeScript errors in tests** | Type errors | Check types, update test types, verify imports | Run `npx tsc --noEmit` frequently |
| **Platform-specific failures** | Works on iOS but not Android | Test on both platforms, check platform-specific code, verify safe areas | Test on both platforms during development |

**Detailed troubleshooting**:

**Tests won't run**:
```bash
# Clear cache
pnpm test --clearCache

# Reinstall dependencies
rm -rf node_modules
pnpm install

# Check Node version
node -v  # Should match .nvmrc or package.json

# Verify Jest config
cat jest.config.js
```

**Platform-specific issues**:
```bash
# Check iOS simulator
xcrun simctl list devices

# Check Android emulator
adb devices

# Restart Metro bundler
pnpm start --reset-cache

# Rebuild native code
pnpm run generate
```

---

## Process Checklist

### Pre-Testing
- [ ] Feature implementation reviewed
- [ ] Existing tests reviewed
- [ ] Test plan document created
- [ ] Test tracking document created
- [ ] Environment set up (iOS/Android)
- [ ] Dependencies installed

### During Testing
- [ ] Execute tests in order
- [ ] Update tracking document after each test
- [ ] Document failures immediately
- [ ] Test on both iOS and Android
- [ ] Verify all scenarios covered

### Issue Resolution
- [ ] Debug systematically (Component → Screen → Redux → API)
- [ ] Apply fix in appropriate layer
- [ ] Re-run failed test
- [ ] Run regression tests
- [ ] Test on both platforms

### Post-Testing
- [ ] Update summary statistics
- [ ] Mark all issues as fixed/pending
- [ ] Update test documentation
- [ ] Commit code fixes and test results
- [ ] Share results with team

---

## Templates

- **Test Plan**: `/docs/processes/tests/TEST_PLAN_TEMPLATE.md`
- **Test Results**: `/docs/processes/tests/TEST_RESULTS_TEMPLATE.md`

---

## Related Documentation

- **Jest Documentation**: https://jestjs.io/
- **React Native Testing Library**: https://callstack.github.io/react-native-testing-library/
- **Expo Testing Guide**: https://docs.expo.dev/guides/testing-with-jest/
- **Project Rules**: `/.cursor/rules/about.mdc` - Development guidelines

---

## Changelog

### Version 1.0.0 (2025-01-27)
**Status**: Active
**Changes**: Initial version for React Native/Expo mobile app testing

---

**End of Document**

