# Unit Testing Process

**Version**: 3.0.0
**Last Updated**: 2025-11-12
**Status**: Active
**Document Type**: Process Guide
**Project**: Chatwoot Mobile App (React Native + Expo + TypeScript)

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Overview](#overview)
3. [Simple Decision Guide](#simple-decision-guide)
4. [Mobile Testing (Jest)](#mobile-testing-jest)
5. [Process Checklist](#process-checklist)
6. [Related Documentation](#related-documentation)

---

## Quick Start

### I need to run tests. What do I do?

**All tests (Jest):**
```bash
# Run all tests
pnpm test

# Run tests in watch mode (for active development)
pnpm test -- --watch

# Run with coverage
pnpm test -- --coverage
```

**That's it!** No database or Docker setup needed!

---

## Overview

This guide helps run unit tests in Chatwoot Mobile App autonomously.

**For Developers**: Use this when you need to verify code changes or add new tests.

**For Claude Code**: Use this to autonomously run tests during development tasks.

### What Tests Can I Run?

**Mobile (Jest)** - Requires Node.js only:
- Redux slice tests: `src/store/[feature]/specs/`
- Redux action tests: `src/store/[feature]/specs/`
- Redux selector tests: `src/store/[feature]/specs/`
- Component tests: `src/screens/*/specs/`, `src/components-next/*/specs/`
- Hook tests: `src/hooks/specs/`
- Utility tests: `src/utils/specs/`

---

## Simple Decision Guide

### Step 1: What scope do I need?

→ **All tests?**
```bash
pnpm test
```

→ **Specific file?**
```bash
pnpm test -- src/store/auth/specs/authSlice.spec.ts
```

→ **Specific folder?**
```bash
pnpm test -- src/store/conversation
```

→ **Watch mode (for active development)?**
```bash
pnpm test -- --watch
```

→ **With coverage?**
```bash
pnpm test -- --coverage
```

→ **Specific test by name?**
```bash
pnpm test -- -t "should handle logout"
```

### Step 2: Did tests pass?

→ **YES** ✅ - Done!

→ **NO** ❌ - Check error output and fix issues

---

## Mobile Testing (Jest)

### What You Need

- Node.js 18+ installed
- pnpm installed
- Dependencies installed (`pnpm install`)

### Commands Reference

| Command | What It Does | When to Use |
|---------|-------------|-------------|
| `pnpm test` | Run ALL tests | Full validation, CI/CD |
| `pnpm test -- --watch` | Interactive watch mode | Active development |
| `pnpm test -- src/store/auth` | Run specific folder | Testing one area |
| `pnpm test -- src/store/auth/specs/authSlice.spec.ts` | Run one file | Debugging, TDD |
| `pnpm test -- --coverage` | Run with coverage | Coverage reports |
| `pnpm test -- -t "pattern"` | Run tests matching pattern | Specific test debugging |

**Examples:**
```bash
# Run all tests
pnpm test

# Run tests in watch mode (for active development)
pnpm test -- --watch

# Run specific file
pnpm test -- src/store/auth/specs/authSlice.spec.ts

# Run tests for a module
pnpm test -- src/store/conversation

# Run with coverage
pnpm test -- --coverage

# Run specific test by pattern
pnpm test -- -t "should handle logout"

# Run tests for all slices
pnpm test -- src/store/*/specs/*Slice.spec.ts

# Run all component tests
pnpm test -- src/screens/*/specs
```

### Understanding Test Output

**When tests PASS:**
```
PASS src/store/auth/specs/authSlice.spec.ts
  authSlice
    ✓ should handle initial state (3 ms)
    ✓ should handle logout (2 ms)
    ✓ should handle setUser (1 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        2.5 s
Ran all test suites matching /src\/store\/auth\/specs\/authSlice.spec.ts/i.
```
✅ All good!

**When tests FAIL:**
```
FAIL src/store/auth/specs/authSlice.spec.ts
  authSlice
    ✕ should handle logout (15 ms)

  ● authSlice › should handle logout

    expect(received).toBeNull()

    Received: { id: 1, email: "test@example.com" }

      45 |     const state = authSlice.reducer(initialState, logout());
      46 |
    > 47 |     expect(state.user).toBeNull();
         |                        ^
      48 |   });

      at Object.<anonymous> (src/store/auth/specs/authSlice.spec.ts:47:24)

Test Suites: 1 failed, 1 total
Tests:       1 failed, 2 passed, 3 total
Snapshots:   0 total
Time:        2.8 s
```
❌ The error shows:
- Which test failed
- What the error was
- File path and line number
- Expected vs actual values

### No Setup Required

Mobile tests run directly - no database or Docker needed!

### Test File Patterns

- Tests live in `/specs` subdirectories (not co-located)
- Naming: `*.spec.ts` or `*.spec.tsx`
- Mock external dependencies in `__mocks__/`

### Example Test Structure

```typescript
// src/store/auth/specs/authSlice.spec.ts
import authSlice, { logout } from '../authSlice';

jest.mock('@/services/APIService', () => ({
  apiService: { get: jest.fn(), post: jest.fn() }
}));

describe('authSlice', () => {
  it('should handle initial state', () => {
    expect(authSlice.reducer(undefined, { type: 'unknown' })).toEqual({
      user: null,
      isAuthenticated: false,
    });
  });

  it('should handle logout', () => {
    const initialState = { user: { id: 1 }, isAuthenticated: true };
    const state = authSlice.reducer(initialState, logout());

    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
```

### Common Issues

**Issue 1: Tests not found**
```
No tests found
```
**Fix**: Check file path and ensure it matches pattern `*.spec.ts` or `*.spec.tsx`

**Issue 2: Module not found**
```
Cannot find module '@/store/auth'
```
**Fix**: Ensure dependencies are installed (`pnpm install`) and TypeScript paths are configured

**Issue 3: Metro bundler interfering**
```
Port 8081 already in use
```
**Fix**: Stop Metro bundler (`pnpm run clean`) or run tests in different terminal

**Issue 4: Out of date snapshots**
```
Snapshot Summary
 › 1 snapshot failed
```
**Fix**: Update snapshots with `pnpm test -- -u` (review changes first!)

---

## Process Checklist

### Running Tests

- [ ] Run: `pnpm test` (or specific variant)
- [ ] Capture exit code and output
- [ ] Check if tests passed (exit code 0)

### If Tests Fail

- [ ] Read error messages
- [ ] Note file paths and line numbers
- [ ] Identify which assertions failed
- [ ] Check expected vs actual values
- [ ] Fix issues and re-run

### For Active Development

- [ ] Use watch mode: `pnpm test -- --watch`
- [ ] Write test first (TDD approach)
- [ ] Implement feature
- [ ] Verify test passes
- [ ] Refactor if needed

### For Pull Requests

- [ ] Run all tests: `pnpm test`
- [ ] Check coverage: `pnpm test -- --coverage`
- [ ] Ensure coverage ≥ 80% for changed files
- [ ] No failing tests
- [ ] No skipped tests (unless documented)

---

## Pro Tips

1. **Use watch mode during development**
   ```bash
   pnpm test -- --watch
   ```

2. **Run specific tests when debugging**
   ```bash
   pnpm test -- -t "should handle logout"
   ```

3. **Check test coverage**
   ```bash
   pnpm test -- --coverage
   # Opens coverage report in browser
   ```

4. **Keep tests fast**
   - Mock API calls with `jest.mock()`
   - Mock navigation with `@react-navigation/native`
   - Use test utilities from `@testing-library/react-native`

5. **Follow TDD when adding features**
   - Write test first (red)
   - Implement feature (green)
   - Refactor (clean)

6. **Test on both platforms when needed**
   ```bash
   # Run tests, then run app to verify
   pnpm test
   pnpm run ios:dev  # or android:dev
   ```

7. **Use descriptive test names**
   ```typescript
   // Good
   it('should reset user state when logout action is dispatched', () => {})

   // Bad
   it('logout works', () => {})
   ```

8. **Group related tests**
   ```typescript
   describe('authSlice', () => {
     describe('reducers', () => {
       it('should handle logout', () => {})
       it('should handle setUser', () => {})
     });

     describe('selectors', () => {
       it('should select user', () => {})
       it('should select isAuthenticated', () => {})
     });
   });
   ```

---

## Related Documentation

### Process Documentation
- [Development Process](/processes/development/development_process.md) - Where testing fits in workflow
- [Code Review Process](/processes/code_review/code_review_process.md) - Code review procedures
- [API Testing Process](/processes/tests/api_testing_process.md) - For API integration testing

### Technical Documentation
- [CLAUDE.md](/CLAUDE.md) - Full testing guidelines and commands
- [README_CHATSCOMMERCE.md](/README_CHATSCOMMERCE.md) - Setup and environment

### External Resources
- [Jest Documentation](https://jestjs.io/) - Jest testing framework
- [React Testing Library](https://testing-library.com/docs/react-native-testing-library/intro/) - Component testing
- [Testing Best Practices](https://testing-library.com/docs/guiding-principles/) - Testing Library principles
- [React Native Testing](https://reactnative.dev/docs/testing-overview) - Official React Native testing guide

---

## Changelog

### Version 3.0.0 (2025-11-12)

**Status**: Active

**Changes:**
- **MAJOR**: Adapted for Chatwoot Mobile App (React Native + Expo + TypeScript)
- Consolidated into single Jest testing section
- Removed backend (RSpec) and frontend (Vitest) split
- Updated all commands to pnpm
- Removed database/Docker setup requirements
- Added mobile-specific test examples (Redux slices, React Native components)
- Updated file paths to mobile structure (src/store/, src/screens/)
- Added watch mode and coverage examples
- Added test file patterns and example structure
- Added Pro Tips section
- Updated all external resource links

**Migration Notes:**
- Previous version (2.0.0) had separate RSpec and Vitest sections
- This version (3.0.0) unified to Jest for all mobile testing
- All tests run without external dependencies (no database needed)

### Version 2.0.0 (2025-10-09)

**Status**: Superseded by 3.0.0

**Changes:**
- Adapted for Chatwoot (Rails + Vue.js)
- Split into Backend (RSpec) and Frontend (Vitest) sections
- Added Taskfile commands

### Version 1.0.0 (2025-10-04)

**Status**: Archived

**Changes:**
- Initial version (Python/FastAPI)

---

## Document Metadata

**Document Owner**: Development Team

**Last Reviewed**: 2025-11-12

**Next Review Due**: 2026-02-12

**Technology Stack**: React Native 0.76.9 | Expo SDK 52 | TypeScript 5.1.3 | Jest

**Contact**: Development team channel for questions

---

**End of Document**
