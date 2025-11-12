# [Process Name] Process Guide

**Version**: X.Y.Z
**Last Updated**: YYYY-MM-DD
**Status**: Draft | Active | Deprecated | Archived
**Document Type**: Process Guide
**Project**: Chatwoot Mobile App (React Native + Expo + TypeScript)

---

## Table of Contents

1. [Overview](#overview)
2. [Key Principles](#key-principles)
3. [Process Workflow](#process-workflow)
4. [Phase 1: [Phase Name]](#phase-1-phase-name)
5. [Phase 2: [Phase Name]](#phase-2-phase-name)
6. [Phase N: [Phase Name]](#phase-n-phase-name)
7. [Process Checklist](#process-checklist)
8. [Related Documentation](#related-documentation)
9. [Changelog](#changelog)

---

## Overview

### Purpose

[Describe what this process achieves. Answer: Why does this process exist?]

**Example**: This process ensures systematic and repeatable [activity] for Chatwoot development, resulting in [outcome].

### Scope

**What is Covered**:
- Mobile app development (React Native 0.76.9 + Expo SDK 52)
- TypeScript development (TypeScript 5.1.3)
- State management (Redux Toolkit + Redux Persist)
- Testing (Jest with React Native preset)
- Documentation updates

**What is NOT Covered**:
- Backend API development (separate repository)
- Native module development (unless directly related)
- Performance optimization (separate process)

### When to Use This Process

**ALWAYS Use This Process For**:
- New feature development
- Complex refactoring tasks
- Breaking changes to state management or navigation
- Multi-component changes (slices + components + navigation)

**SKIP This Process For**:
- Trivial bug fixes (typos, obvious fixes)
- Documentation-only changes
- Emergency hotfixes (use expedited process)

### Process Summary

[2-3 paragraph overview describing:
- What the process does
- Who is involved (Development Team, Code Reviewers, QA)
- What the main outputs are (Code, Tests, Documentation)
- How long it typically takes]

---

## Key Principles

### Core Principles

1. **Principle 1: Feature-Based Redux Architecture**
   - Organize code by feature in Redux slices (`src/store/[feature]/`)
   - Extract API calls into Service files (static methods)
   - Use createAsyncThunk for async operations
   - Keep slices focused on state shape and reducers
   - **Why it matters**: Maintainable, testable, follows established patterns
   - **Example**: `authActions.ts` handles login logic, `authService.ts` calls API

2. **Principle 2: React Native Component Development**
   - Use functional components with hooks exclusively
   - Use Tailwind via twrnc only (no StyleSheet.create, custom styles)
   - Always update i18n for both `en.json` and `es.json` (i18n-js)
   - Manage state with Redux Toolkit store
   - **Why it matters**: Consistent UI, accessible, translatable, cross-platform
   - **Example**: Components use `tailwind()` helper, `I18n.t()` keys, `useAppSelector()` hooks

3. **Principle 3: Test-Driven Quality**
   - Write Jest specs for slices (reducers, state management)
   - Write Jest specs for actions (async thunks, API integration)
   - Write Jest specs for components (rendering, user interactions)
   - Test happy path + edge cases + error scenarios
   - Maintain high test coverage
   - **Why it matters**: Prevents regressions, documents behavior, enables refactoring

### Success Criteria

The process is successful when:
- [ ] All code follows CLAUDE.md guidelines
- [ ] All tests pass (Jest)
- [ ] Code review approved
- [ ] i18n updated for all UI changes (i18n-js en/es)
- [ ] Documentation updated
- [ ] Both iOS and Android tested

---

## Process Workflow

### Process Flow Diagram

```
[Stage 1: Requirements Analysis]
    ↓
[Stage 2: Design & Planning]
    ↓
[Stage 3: Implementation] → [Decision: Frontend Changes?]
    ↓ Yes                        ↓ No
[Stage 4a: Backend + Frontend]   [Stage 4b: Backend Only]
    ↓                             ↓
[Stage 5: Testing & Review]
    ↓
[Stage 6: Documentation & Deployment]
```

### Phase Summary Table

| Phase | Objective | Deliverable | Owner | Duration |
|-------|-----------|-------------|-------|----------|
| 1. [Name] | [What it achieves] | [Output] | Developer | [Time] |
| 2. [Name] | [What it achieves] | [Output] | Developer | [Time] |
| 3. [Name] | [What it achieves] | [Output] | Developer + Reviewer | [Time] |
| **Total** | | | | **[Total Time]** |

### Dependencies & Prerequisites

**Prerequisites**:
- Development environment set up (see CLAUDE.md and README_CHATSCOMMERCE.md)
- Review CLAUDE.md for mobile guidelines
- Understanding of Chatwoot Mobile's React Native + Expo stack

**Dependencies**:
- Node.js 18+ installed
- pnpm 10.x installed
- Expo CLI installed
- Android Studio (for Android) or Xcode (for iOS, macOS only)
- Access to codebase and documentation

---

## Phase 1: [Phase Name]

**Objective**: [Clear statement of what this phase achieves]

**Duration**: [Estimated time range]

**Owner**: [Who is responsible for this phase]

**Prerequisites**:
- Item 1
- Item 2

### Step 1.1: [Step Name]

**Description**: [What this step does]

**Actions**:
1. Action 1 - [Description]
2. Action 2 - [Description]
3. Action 3 - [Description]

**Tools/Commands**:
```bash
# See CLAUDE.md and package.json for all commands

# Run Jest tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Run specific test file
pnpm test -- src/path/to/file.spec.ts

# Linting: TypeScript/React Native
pnpm run lint

# Generate native code (after plugin changes)
pnpm run generate

# Start Metro bundler
pnpm start

# Run on Android
pnpm run android:dev

# Run on iOS (macOS only)
pnpm run ios:dev

# Clean Metro cache
pnpm run clean
```

**Expected Output**:
```
[Show what successful output looks like - e.g., test results, server startup logs]
```

**Verification**:
- [ ] Expected output achieved
- [ ] Tests passing
- [ ] No linting errors

**Common Issues**:
- **Issue**: [Problem] → [Solution or link to troubleshooting doc]

### Step 1.2: [Step Name]

[Repeat structure for each step]

### Phase 1 Deliverable

**Output**: [What this phase produces]

**Location**: [Where the output is stored - e.g., `src/store/[feature]/`, `src/screens/`, `src/components-next/`]

**Format**: [Structure/format - e.g., TypeScript slice, React Native component, Markdown doc]

**Quality Check**:
- [ ] Code follows React Native/Redux conventions
- [ ] Tests written and passing (Jest)
- [ ] i18n updated (if applicable)
- [ ] Documentation updated

---

## Phase 2: [Phase Name]

[Repeat structure from Phase 1]

---

## Phase N: [Final Phase Name]

[Repeat structure from Phase 1]

---

## Process Checklist

### Pre-Process Setup

- [ ] Development environment ready (Taskfile.yml commands working)
- [ ] Database running and migrated
- [ ] CLAUDE.md and ARCHITECTURE.md reviewed
- [ ] Feature branch created from `develop`

### Execution

- [ ] Phase 1 complete (see Phase 1 deliverable checklist)
- [ ] Phase 2 complete (see Phase 2 deliverable checklist)
- [ ] Phase N complete (see Phase N deliverable checklist)

### Post-Process Completion

- [ ] All tests passing (`pnpm test`)
- [ ] Linting clean (`pnpm run lint`)
- [ ] i18n updated (en/es via i18n-js)
- [ ] Documentation updated
- [ ] Code review requested
- [ ] Both iOS and Android tested

---

## Related Documentation

### Process Documentation

- [Development Process](./development/development_process.md) - Full development workflow
- [Research & Design Process](./design/research_and_design_process.md) - Feature research and design
- [Code Review Process](./code_review/code_review_process.md) - Review procedures
- [API Testing Process](./tests/api_testing_process.md) - API testing guide

### Technical Documentation

- [Development Guidelines](../CLAUDE.md) - Coding standards and conventions (includes commands, patterns, best practices)
- [Setup Guide](../README_CHATSCOMMERCE.md) - Initial setup and environment configuration

### Templates & Resources

- [Design Template](./design/DESIGN_TEMPLATE.md) - Design document template
- [Research Template](./design/RESEARCH_TEMPLATE.md) - Research report template
- [Execution Template](./development/DEVELOPMENT_EXECUTION_TEMPLATE.md) - Execution tracking
- [Test Plan Template](./tests/TEST_PLAN_TEMPLATE.md) - Test planning
- [Troubleshooting Guide](./troubleshooting.md) - Common issues and solutions

### External Resources

**React Native & Expo**:
- [React Native Documentation](https://reactnative.dev/) - Official React Native docs
- [Expo Documentation](https://docs.expo.dev/) - Expo SDK and tooling
- [React Navigation](https://reactnavigation.org/) - Navigation library

**Testing & State Management**:
- [Jest Documentation](https://jestjs.io/) - Testing framework
- [React Testing Library](https://testing-library.com/docs/react-native-testing-library/intro/) - Component testing
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/) - State management

**Styling**:
- [Tailwind CSS Documentation](https://tailwindcss.com/) - Utility-first CSS (via twrnc)

---

## Changelog

### Version X.Y.Z (YYYY-MM-DD)

**Status**: [Draft | Active | Deprecated | Archived]

**Changes**:
- Change 1
- Change 2
- Change 3

**Migration Notes**:
- [Any notes for users of previous versions]

---

### Version 3.0.0 (2025-11-12)

**Status**: Active (Template)

**Changes**:
- **MAJOR**: Adapted for Chatwoot Mobile App (React Native + Expo + TypeScript)
- Updated all references from Rails/Vue.js to React Native/Redux
- Replaced RSpec/Vitest with Jest
- Updated architecture from Rails MVC to Redux slices
- Removed backend-specific content (Controllers, Models, Migrations, etc.)
- Removed Enterprise edition references
- Added mobile-specific considerations (iOS/Android, Metro, Expo)
- Updated all commands from Taskfile to pnpm scripts
- Updated all external resource links

**Migration Notes**:
- Previous version (2.0.0) was for Rails + Vue.js backend
- This version (3.0.0) is for React Native + Expo mobile app
- Process structures remain similar, all technical content updated

---

### Version 2.0.0 (2025-10-06)

**Status**: Superseded by 3.0.0

**Changes**:
- Adapted for Chatwoot (Rails + Vue.js) from Python/FastAPI
- Initial version for full-stack development

---

### Version 1.0.0 (2025-10-04)

**Status**: Archived

**Changes**:
- Initial version (Python/FastAPI)

---

## Document Metadata

**Document Owner**: Development Team

**Maintained By**: Development Team

**Review Cycle**: Quarterly or after major architectural changes

**Last Reviewed**: 2025-11-12

**Next Review Due**: 2026-02-12

**Technology Stack**: React Native 0.76.9 | Expo SDK 52 | TypeScript 5.1.3 | Redux Toolkit | Jest

**Contact**: Development team channel for questions and feedback

---

**End of Document**
