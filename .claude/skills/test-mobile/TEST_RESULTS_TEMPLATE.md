# Test Results: [FEATURE_NAME]

**Version**: 1.0.0
**Test Date**: [YYYY-MM-DD]
**Tester**: [Name]
**Test Plan**: [Link to TEST_PLAN.md]
**Status**: In Progress | Complete

---

## Executive Summary

### Overall Result
| Metric | Value |
|--------|-------|
| **Status** | PASS / CONDITIONAL PASS / FAIL |
| **Total Tests** | [Number] |
| **Passed** | [Number] ([Percentage]%) |
| **Failed** | [Number] ([Percentage]%) |
| **Blocked** | [Number] |
| **Skipped** | [Number] |

### Key Findings
1. [Finding 1]
2. [Finding 2]
3. [Finding 3]

### Recommendation
[Go / No-Go decision with rationale]

---

## Test Environment

### Configuration
| Item | Value |
|------|-------|
| Node Version | [Version] |
| pnpm Version | [Version] |
| Expo Version | [Version] |
| iOS Simulator | [Device/OS] |
| Android Emulator | [Device/OS] |
| Test Date | [YYYY-MM-DD] |
| Test Duration | [Duration] |

### Environment Variables
```bash
# Environment configuration used
EXPO_PUBLIC_BASE_URL=https://...
```

---

## Results Summary

### By Test Type

| Type | Total | Pass | Fail | Skip | Pass Rate |
|------|-------|------|------|------|-----------|
| Unit Tests | [#] | [#] | [#] | [#] | [%] |
| Component Tests | [#] | [#] | [#] | [#] | [%] |
| Integration Tests | [#] | [#] | [#] | [#] | [%] |
| Manual Tests | [#] | [#] | [#] | [#] | [%] |
| **Total** | [#] | [#] | [#] | [#] | [%] |

### By Priority

| Priority | Total | Pass | Fail | Pass Rate |
|----------|-------|------|------|-----------|
| High | [#] | [#] | [#] | [%] |
| Medium | [#] | [#] | [#] | [%] |
| Low | [#] | [#] | [#] | [%] |

### By Platform

| Platform | Total | Pass | Fail | Pass Rate |
|----------|-------|------|------|-----------|
| iOS | [#] | [#] | [#] | [%] |
| Android | [#] | [#] | [#] | [%] |
| Both | [#] | [#] | [#] | [%] |

---

## Detailed Results

### Unit Tests

| TC ID | Description | Status | Notes |
|-------|-------------|--------|-------|
| UT-001 | [Description] | Pass | |
| UT-002 | [Description] | Fail | [See Issue #1] |
| UT-003 | [Description] | Pass | |

### Component Tests

| TC ID | Description | Platform | Status | Notes |
|-------|-------------|----------|--------|-------|
| CT-001 | [Description] | Both | Pass | |
| CT-002 | [Description] | Both | Fail | [See Issue #2] |
| CT-003 | [Description] | iOS | Pass | |
| CT-004 | [Description] | Android | Partial | [Android-specific issue] |

### Integration Tests

| TC ID | Description | Status | Notes |
|-------|-------------|--------|-------|
| IT-001 | [Description] | Pass | |
| IT-002 | [Description] | Pass | |
| IT-003 | [Description] | Fail | [See Issue #3] |

### Manual Tests

| TC ID | Description | iOS | Android | Notes |
|-------|-------------|-----|---------|-------|
| MT-001 | [Description] | Pass | Pass | |
| MT-002 | [Description] | Pass | Fail | [See Issue #4] |
| MT-003 | [Description] | Pass | Pass | |

---

## Issues Found

### Issue #1: [Issue Title]
**Severity**: Critical / Major / Minor
**Status**: Open / Fixed / Won't Fix
**Test Case**: [TC ID]
**Platform**: iOS / Android / Both

**Description**:
[Detailed description of the issue]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Screenshots/Logs**:
```
[Relevant error messages or logs]
```

**Resolution**:
[How the issue was fixed, or why it won't be fixed]

---

### Issue #2: [Issue Title]
**Severity**: Critical / Major / Minor
**Status**: Open / Fixed / Won't Fix
**Test Case**: [TC ID]
**Platform**: iOS / Android / Both

**Description**:
[Detailed description of the issue]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Resolution**:
[How the issue was fixed, or why it won't be fixed]

---

## Code Coverage

### Coverage Summary
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Statements | [%] | 80% | Pass/Fail |
| Branches | [%] | 75% | Pass/Fail |
| Functions | [%] | 80% | Pass/Fail |
| Lines | [%] | 80% | Pass/Fail |

### Coverage by File
| File | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| Component.tsx | [%] | [%] | [%] | [%] |
| utility.ts | [%] | [%] | [%] | [%] |
| slice.ts | [%] | [%] | [%] | [%] |

### Uncovered Areas
- [Area 1 - Reason]
- [Area 2 - Reason]

---

## Performance Observations

### iOS Performance
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| App Launch | [Time] | <2s | Pass/Fail |
| Screen Transition | [Time] | <300ms | Pass/Fail |
| Memory Usage | [MB] | <200MB | Pass/Fail |

### Android Performance
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| App Launch | [Time] | <2s | Pass/Fail |
| Screen Transition | [Time] | <300ms | Pass/Fail |
| Memory Usage | [MB] | <200MB | Pass/Fail |

### Performance Issues
- [Issue 1 - Description and impact]
- [Issue 2 - Description and impact]

---

## Regression Impact

### Areas Tested for Regression
- [ ] [Related feature 1] - Pass/Fail
- [ ] [Related feature 2] - Pass/Fail
- [ ] [Related feature 3] - Pass/Fail

### Regression Issues Found
- [None / List of regression issues]

---

## Test Session Log

### [YYYY-MM-DD HH:MM] - Session Start
- Environment setup complete
- Test data prepared
- Started unit tests

### [YYYY-MM-DD HH:MM] - Unit Tests Complete
- X passed, Y failed
- Issue #1 found and documented

### [YYYY-MM-DD HH:MM] - Component Tests Complete
- X passed, Y failed
- Issue #2 found and documented

### [YYYY-MM-DD HH:MM] - Manual Testing - iOS
- Tested on iPhone 15 Pro Simulator
- All flows working

### [YYYY-MM-DD HH:MM] - Manual Testing - Android
- Tested on Pixel 7 Emulator
- Issue #4 found on Android

### [YYYY-MM-DD HH:MM] - Session End
- Total duration: X hours
- Next steps: [Bug fixes, regression testing, etc.]

---

## Recommendations

### Must Fix (Before Release)
1. [Issue #X] - [Reason]
2. [Issue #Y] - [Reason]

### Should Fix (Next Sprint)
1. [Issue #X] - [Reason]
2. [Issue #Y] - [Reason]

### Nice to Have (Backlog)
1. [Improvement suggestion]
2. [Improvement suggestion]

---

## Next Steps

1. [ ] Fix critical issues (#X, #Y)
2. [ ] Re-run failed tests
3. [ ] Regression testing
4. [ ] Update documentation
5. [ ] Final sign-off

---

## Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| Tester | | | Approved / Pending |
| Developer | | | Approved / Pending |
| Tech Lead | | | Approved / Pending |

---

## Attachments

- [Link to test execution logs]
- [Link to coverage report]
- [Link to screenshots/videos]
- [Link to performance reports]

---

**End of Test Results**
