# Android Testing Plan - Phase 6
**Date**: 2026-01-30  
**Status**: Not Started  
**Goal**: Test Android setup and E2E testing in the same way as iOS

---

## Objective

Replicate the iOS testing approach for Android platform:
1. Test Android setup idempotency
2. Test Android verification
3. Test Maestro E2E on Android emulator
4. Fix any bugs discovered
5. Ensure 100% production-ready state

---

## Prerequisites

- ✅ macOS (Android development possible on macOS)
- ❌ Android Studio installed (to be installed during testing)
- ❌ Android SDK configured (to be configured during testing)
- ❌ Android emulator created (to be created during testing)
- ✅ Maestro setup complete (from iOS testing)
- ✅ Java 17 installed (from iOS testing)

---

## Test Plan

### **Test 1: Android Setup from Scratch**

**Objective**: Test `task android:setup` on a system without Android tools

**Expected Behavior**:
- ✅ Detects missing Android Studio
- ✅ Provides clear installation instructions (cannot auto-install Android Studio)
- ✅ After manual Android Studio install, sets up SDK and emulator
- ✅ Creates Android emulator with proper settings
- ✅ Verifies adb is accessible
- ✅ Sets ANDROID_HOME environment variable

**Commands to Test**:
```bash
# Check prerequisites first
task setup:check-prereqs -- --platform=android

# Run Android setup
task android:setup

# Verify setup
task setup:verify
```

**Expected Issues**:
- Android Studio requires manual installation (too large to auto-install)
- SDK path configuration may need manual setup
- Emulator creation may require user interaction

**Success Criteria**:
- [ ] Android Studio installation guidance is clear
- [ ] SDK setup completes without errors
- [ ] Emulator is created and bootable
- [ ] ANDROID_HOME is set correctly
- [ ] adb is in PATH

---

### **Test 2: Android Setup Idempotency**

**Objective**: Verify `task android:setup` is idempotent (safe to run multiple times)

**Expected Behavior**:
- ✅ Detects existing Android Studio → Skips installation message
- ✅ Detects existing SDK → Skips SDK setup
- ✅ Detects existing emulator → Skips emulator creation
- ✅ Fast execution on second run (<10 seconds)
- ✅ No duplicate installations
- ✅ Clear "already installed" messages

**Commands to Test**:
```bash
# First run (should set everything up)
task android:setup

# Second run (should skip everything)
task android:setup

# Third run (verify consistency)
task android:setup
```

**Success Criteria**:
- [ ] Second run completes in <10 seconds
- [ ] All components detected as "already installed"
- [ ] No errors or warnings
- [ ] No duplicate installations attempted

---

### **Test 3: Android Verification**

**Objective**: Test `task setup:verify` detects Android tools correctly

**Expected Behavior**:
- ✅ Detects ANDROID_HOME environment variable
- ✅ Detects adb in PATH
- ✅ Detects Android emulator availability
- ✅ Shows actionable fix messages if missing
- ✅ Pass/fail counts accurate

**Commands to Test**:
```bash
# Full verification
task setup:verify

# Android-specific verification
task setup:check-prereqs -- --platform=android
```

**Expected Checks**:
- [ ] ANDROID_HOME set and valid
- [ ] adb in PATH and working
- [ ] Android emulator available
- [ ] Android SDK tools accessible

**Success Criteria**:
- [ ] All Android checks pass
- [ ] Clear error messages if checks fail
- [ ] Actionable fix suggestions provided

---

### **Test 4: Android Emulator Boot**

**Objective**: Test Android emulator can be booted via task commands

**Expected Behavior**:
- ✅ Maestro task dependencies handle emulator boot
- ✅ Emulator boots successfully
- ✅ Emulator is ready for app installation

**Commands to Test**:
```bash
# Check available emulators
emulator -list-avds

# Boot emulator (should be handled by Maestro tasks)
# Maestro tasks have _ensure-emulator dependency

# Manual boot for testing
emulator -avd <emulator_name> &

# Check emulator status
adb devices
```

**Success Criteria**:
- [ ] Emulator boots successfully
- [ ] adb recognizes emulator
- [ ] Emulator is ready in <60 seconds

---

### **Test 5: Android App Installation**

**Objective**: Test React Native app can be built and installed on Android emulator

**Expected Behavior**:
- ✅ `task android:run` builds the app
- ✅ App installs on emulator
- ✅ App launches successfully
- ✅ Metro bundler connects

**Commands to Test**:
```bash
# Generate Android native project
task android:generate

# Build and run on emulator
task android:run

# Verify app is installed
adb shell pm list packages | grep chatscommerce
```

**Expected Issues**:
- Build may take 5-10 minutes first time
- Gradle may need to download dependencies
- Emulator must be running before build

**Success Criteria**:
- [ ] App builds without errors
- [ ] App installs on emulator
- [ ] App launches and shows UI
- [ ] Metro bundler connects successfully

---

### **Test 6: Maestro Android E2E Test**

**Objective**: Test Maestro can run E2E tests on Android emulator

**Expected Behavior**:
- ✅ Maestro detects Android emulator
- ✅ Maestro task dependencies ensure emulator is running
- ✅ Maestro task dependencies ensure app is installed
- ✅ Login flow test passes on Android
- ✅ Screenshots captured

**Commands to Test**:
```bash
# Run smoke test (login flow only)
task maestro:smoke

# Should handle:
# - Booting emulator if needed
# - Starting dev server if needed
# - Verifying app is installed
# - Running test
```

**Success Criteria**:
- [ ] Emulator auto-boots via task dependency
- [ ] App installation verified
- [ ] Login flow completes successfully
- [ ] Test exits with code 0
- [ ] Screenshots saved to ~/.maestro/tests/

---

### **Test 7: Platform-Specific Checks**

**Objective**: Test `task setup:check-prereqs -- --platform=android` works correctly

**Expected Behavior**:
- ✅ Only checks Android-specific tools
- ✅ Skips iOS, Foundation, E2E checks
- ✅ Fast execution
- ✅ Clear "Filter: android only" indicator

**Commands to Test**:
```bash
task setup:check-prereqs -- --platform=android
```

**Expected Checks**:
- [ ] Android Studio
- [ ] Android SDK (ANDROID_HOME)
- [ ] adb in PATH
- [ ] Android emulator availability

**Success Criteria**:
- [ ] Only Android checks run
- [ ] Other platform checks skipped
- [ ] Clear filter indicator shown

---

## Expected Bugs to Find

Based on iOS testing experience, we expect to find:

1. **Platform Detection Issues**:
   - [ ] Android detection might fail on macOS
   - [ ] POSIX sh compatibility issues

2. **Environment Variable Issues**:
   - [ ] ANDROID_HOME might not be set via Taskfile
   - [ ] PATH might not include SDK tools

3. **Idempotency Issues**:
   - [ ] Scripts might not detect existing installations
   - [ ] Duplicate installation attempts

4. **Verification Issues**:
   - [ ] verify.sh might have Android-specific bugs
   - [ ] check-prerequisites.sh might miss Android checks

5. **Maestro Issues**:
   - [ ] Emulator detection might fail
   - [ ] App ID might be different for Android
   - [ ] Maestro might not connect to emulator

---

## Bug Fix Strategy

For each bug found:

1. **Document the Issue**:
   - File affected
   - Current behavior
   - Expected behavior
   - Error message/stack trace

2. **Root Cause Analysis**:
   - Why did it work for iOS but not Android?
   - Is it a platform-specific issue?
   - Is it a script logic issue?

3. **Fix and Test**:
   - Apply minimal fix
   - Test fix in isolation
   - Re-run all Android tests
   - Verify iOS tests still pass (no regression)

4. **Update Documentation**:
   - Update this testing plan with findings
   - Update execution document with bug fixes
   - Add notes for future reference

---

## Success Criteria (Overall)

Android testing is complete when:

- [ ] ✅ All 7 tests pass
- [ ] ✅ Android setup is 100% idempotent
- [ ] ✅ Android verification works correctly
- [ ] ✅ Maestro E2E test passes on Android
- [ ] ✅ All bugs found are fixed
- [ ] ✅ No regression in iOS tests
- [ ] ✅ Documentation updated

---

## Test Execution Log

### Execution 1: Initial Android Setup Test
**Date**: [TBD]  
**Tester**: [TBD]  
**Status**: Not Started

**Results**:
- Test 1: ⏸️ Not Run
- Test 2: ⏸️ Not Run
- Test 3: ⏸️ Not Run
- Test 4: ⏸️ Not Run
- Test 5: ⏸️ Not Run
- Test 6: ⏸️ Not Run
- Test 7: ⏸️ Not Run

**Bugs Found**: 0

**Time Taken**: N/A

---

## Comparison with iOS Testing

### iOS Testing Results (Reference)

| Test | iOS Status | Expected Android Status |
|------|-----------|------------------------|
| Setup Idempotency | ✅ PASS | Should pass |
| Verification | ✅ PASS (17/21) | Should pass (similar) |
| Quick Check | ✅ PASS | Should pass |
| Platform Filter | ✅ PASS (9/9 iOS) | Should pass (~5 Android) |
| E2E Smoke Test | ✅ PASS | Should pass |

### iOS Bugs Found (7 total)

1. ✅ macOS detection incompatibility → **Might need Android equivalent**
2. ✅ Java env setup issue → **Already fixed (Taskfile)**
3. ✅ Duplicate verification → **Already fixed**
4. ✅ maestro doctor issue → **Already fixed**
5. ✅ set -e in verify.sh → **Already fixed**
6. ✅ set -e in e2e.sh → **Already fixed**
7. ✅ Smoke test all flows → **Already fixed**

**Expected**: Android testing should find 3-5 new Android-specific bugs

---

## Android-Specific Considerations

### Android Studio Installation

Unlike iOS (Xcode auto-installs), Android Studio requires:
1. Manual download from developer.android.com
2. Manual installation (DMG on macOS)
3. Manual SDK acceptance (license agreement)
4. Manual emulator creation (via AVD Manager)

**Strategy**: Provide clear step-by-step instructions, cannot automate

### Emulator vs Physical Device

- **Emulator**: Can be automated, slower, good for CI
- **Physical Device**: Fast, requires USB debugging, harder to automate

**Strategy**: Test with emulator first (matches CI environment)

### Gradle Build System

Android uses Gradle (not Xcode):
- First build: 5-10 minutes (downloads dependencies)
- Subsequent builds: 1-2 minutes (incremental)
- May require Android SDK version updates

**Strategy**: Set expectations about first build time

---

## Next Steps

1. **Review this plan** with team/user
2. **Start Test 1**: Android setup from scratch
3. **Document results** in real-time
4. **Fix bugs** as they're discovered
5. **Iterate** until all tests pass
6. **Commit** changes with detailed message
7. **Update** Phase 6 completion status

---

**Estimated Time**: 2-3 hours (based on iOS testing experience)

**Ready to Start**: ✅ Plan complete, awaiting execution
