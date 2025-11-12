# Development Process Guide

**Version**: 3.0.0
**Last Updated**: 2025-11-12
**Status**: Active
**Document Type**: Process Guide
**Project**: Chatwoot Mobile App (React Native + Expo + TypeScript)

---

## Table of Contents

1. [Overview](#overview)
2. [Development Workflow](#development-workflow)
3. [Phase 1: Study & Analysis](#phase-1-study--analysis)
4. [Phase 2: Design Document](#phase-2-design-document)
5. [Phase 3: Design Review & Refinement](#phase-3-design-review--refinement)
6. [Phase 4: Execution Plan](#phase-4-execution-plan)
7. [Phase 5: Implementation & Tracking](#phase-5-implementation--tracking)
8. [Phase 6: Testing & Validation](#phase-6-testing--validation)
9. [Phase 7: Completion & Review](#phase-7-completion--review)
10. [Document Templates](#document-templates)
11. [File Organization](#file-organization)
12. [Quality Gates](#quality-gates)
13. [References](#references)
14. [Changelog](#changelog)

---

## Overview

This document defines the standardized development process for the Chatwoot Mobile App. It ensures consistent, high-quality implementations with proper documentation, testing, and review cycles for React Native + Expo TypeScript mobile application.

### Document Location

**IMPORTANT**: All design and execution documents MUST be created in `/docs/ignored/`

- **Design documents**: `/docs/ignored/design/<feature_name>_design.md`
- **Execution plans**: `/docs/ignored/development/<feature_name>_execution.md`
- These documents are NOT committed to the repository
- Templates remain in `/processes/` for reference

### Key Principles

1. **Study First**: Deep understanding before coding
2. **Design Before Implementation**: Document the plan before execution
3. **Iterative Refinement**: Collaborate with engineers to refine designs
4. **Track Progress**: Maintain execution documents for transparency and resumability
5. **Test Thoroughly**: Jest tests are mandatory for all implementations
6. **Document Everything**: Clear documentation for future reference
7. **Mobile-First Thinking**: Consider both iOS and Android implications
8. **Cross-Platform Compatibility**: Ensure changes work on both platforms

### Process Stages

```
User Request
    ↓
Study & Analysis (Agent)
    ↓
Design Document (Agent)
    ↓
Design Review (Human ↔ Agent)
    ↓
Execution Plan (Agent)
    ↓
Implementation (Agent + Tracking)
    ↓
Testing & Validation (Agent)
    ↓
Final Review (Human)
    ↓
Completion
```

---

## Development Workflow

### Phase Summary

| Phase | Deliverable | Owner | Duration |
|-------|-------------|-------|----------|
| 1. Study & Analysis | Analysis notes | Agent | 30-60 min |
| 2. Design Document | Design MD file | Agent | 1-2 hours |
| 3. Design Review | Approved design | Human + Agent | Variable |
| 4. Execution Plan | Execution MD file | Agent | 30 min |
| 5. Implementation | Code + Updates | Agent | Variable |
| 6. Testing | Test results | Agent | Variable |
| 7. Completion | Final report | Agent + Human | 30 min |

---

## Phase 1: Study & Analysis

### Objective
Deep understanding of the current codebase, the problem to solve, and potential solutions.

### Activities

#### 1.1 Understand User Request
- Read and parse the user's request thoroughly
- Identify the core problem or feature
- Clarify ambiguities (ask questions if needed)
- Define success criteria

#### 1.2 Study Current Implementation
- Use `@ultrathink` approach for deep investigation
- Read ALL relevant files (use Glob, Grep, Read tools extensively)
- Understand the Redux slices + React Native architecture
- Identify dependencies and impacts
- Map out state flow and component interactions
- Check for platform-specific code (iOS/Android)

#### 1.3 Research Best Practices
- Review CLAUDE.md for mobile app guidelines
- Check existing patterns in the codebase
- Consider React Native and Redux Toolkit best practices
- Review similar implementations in the codebase
- Consult README_CHATSCOMMERCE.md for setup and commands

#### 1.4 Analyze Impact
- Identify all files that will be affected (slices + components + navigation)
- Determine breaking changes
- Assess risks and mitigation strategies
- Estimate effort and complexity
- Consider AsyncStorage migration requirements (if needed)
- Check platform-specific impacts (iOS/Android)

### Key Areas to Investigate

**State Management**:
- Redux slices (`src/store/[feature]/[feature]Slice.ts`)
- Redux actions (`src/store/[feature]/[feature]Actions.ts`)
- Redux selectors (`src/store/[feature]/[feature]Selectors.ts`)
- Redux services (`src/store/[feature]/[feature]Service.ts`)
- Redux listeners (`src/store/[feature]/[feature]Listener.ts`)
- Type definitions (`src/store/[feature]/[feature]Types.ts`)

**UI Components**:
- React Native screens (`src/screens/`)
- React Native components (`src/components-next/`)
- Navigation (`src/navigation/`)
- API client (`src/services/APIService.ts`)
- i18n files (`src/i18n/`)
- Hooks (`src/hooks/`)
- Utils (`src/utils/`)
- Theme (`src/theme/`)

**Tests**:
- Slice specs (`src/store/[feature]/specs/[feature]Slice.spec.ts`)
- Action specs (`src/store/[feature]/specs/[feature]Actions.spec.ts`)
- Selector specs (`src/store/[feature]/specs/[feature]Selectors.spec.ts`)
- Component specs (`src/screens/*/specs/*.spec.tsx`)
- Hook specs (`src/hooks/specs/*.spec.ts`)
- Utility specs (`src/utils/specs/*.spec.ts`)

**Native**:
- Native modules (if any) (`android/`, `ios/`)
- Expo plugins (`plugins/`)

### Deliverable
Internal analysis notes (can be informal, used to create design document)

---

## Phase 2: Design Document

### Objective
Create a comprehensive design document that proposes the solution.

### Document Structure

#### File Naming Convention
```
/docs/ignored/design/<feature_name>_design.md

Format: <short_description>_design.md
Example: store_priority_feature_design.md
Naming: lowercase, snake_case

Note: All runtime documents are created in /docs/ignored/ to prevent
them from being committed to the repository. Templates remain in
/docs/processes/ for reference.
```

#### Required Sections

1. **Header Metadata** - Session ID, timestamps, status, author
2. **Executive Summary** - Brief overview, key benefits, effort estimate, risk summary
3. **Current State Analysis** - Current implementation, code examples, problems, files affected, platform considerations
4. **Proposed Solution** - High-level approach, architecture changes, code examples (before/after), design patterns, alignment with Redux patterns
5. **Technical Design** - Detailed implementation by component:
   - Redux slices (state shape, reducers)
   - Redux actions (async thunks, createAsyncThunk)
   - Redux services (API calls, static methods)
   - Redux selectors (memoization, createSelector)
   - React Native components (screens, components-next)
   - Navigation changes (React Navigation)
   - i18n (en.json + es.json - BOTH required, i18n-js format)
   - Local storage (AsyncStorage if needed)
6. **Impact Analysis** - Files affected, breaking changes, state shape changes, navigation changes, tests, platform compatibility
7. **Migration Strategy** - Step-by-step plan, backward compatibility, rollback plan, AsyncStorage migration (if needed)
8. **Testing Strategy** - Jest tests, scenarios, edge cases, coverage goals (≥80%)
9. **Risks & Mitigations** - Identified risks with severity, mitigation strategies, contingency plans
10. **Alternatives Considered** - Other approaches evaluated, why rejected, trade-offs
11. **Timeline & Effort** - Estimated duration, task breakdown, dependencies
12. **References** - Related documents, external resources

### Design Document Template

See: `/processes/design/DESIGN_TEMPLATE.md`

### Deliverable
Complete design document in `/docs/ignored/design/` directory

---

## Phase 3: Design Review & Refinement

### Objective
Collaborate with the human engineer to refine and approve the design.

### Activities

#### 3.1 Initial Review
- Human engineer reviews the design document
- Identifies concerns, questions, or suggestions
- Requests clarifications or alternatives

#### 3.2 Iterative Refinement
- Agent updates design based on feedback
- Back-and-forth discussion to refine approach
- Alternative solutions explored if needed
- Design evolves until approval

#### 3.3 Final Approval
- Human engineer approves the design
- Design document status updated to "Approved"
- Ready to proceed to execution planning

### Deliverable
Approved design document with status: "Approved"

---

## Phase 4: Execution Plan

### Objective
Create a detailed, trackable execution plan with tasks and subtasks.

### Document Structure

#### File Naming Convention
```
/docs/ignored/development/<feature_name>_execution.md

Format: <short_description>_execution.md
Example: store_priority_feature_execution.md
Naming: lowercase, snake_case
```

#### Required Sections

1. **Header Metadata** - Session ID, timestamps, status, design doc link
2. **Progress Overview** - Visual progress bars for each phase and overall
3. **Quick Navigation** - Links to all phases, issues, comments
4. **Phase Definitions** - Each phase with status, tasks list
5. **Task Definitions** - Each task with:
   - Unique ID
   - Status checkbox
   - Description
   - Files affected
   - Subtasks (with checkboxes)
   - Expected changes (code examples)
   - Verification commands
   - Notes section
6. **Testing Section** - RSpec tests, Vitest tests, execution commands, results, coverage
7. **Issues & Blockers** - Open issues, blockers, resolution plans
8. **Comments & Notes** - Implementation notes, gotchas, decisions
9. **Completion Checklist** - Definition of Done, final validation steps

### Execution Plan Template

See: `/processes/development/DEVELOPMENT_EXECUTION_TEMPLATE.md`

### Deliverable
Complete execution plan in `/docs/ignored/development/` directory

---

## Phase 5: Implementation & Tracking

### Objective
Implement the solution while tracking progress in the execution document.

### Activities

#### 5.1 Setup
- Create feature branch
- Initialize execution tracking document
- Set status to "In Progress"

#### 5.2 Iterative Implementation

For each task:

1. **Update Task Status** - Change checkbox from `[ ]` to `[x]` when starting, update progress bar
2. **Implement Changes** - Follow design specs, write clean code, follow CLAUDE.md standards
   - Use functional components with hooks
   - Use Redux Toolkit patterns (createSlice, createAsyncThunk)
   - Styling: Use Tailwind via twrnc ONLY (no StyleSheet.create)
   - i18n: Update BOTH en.json and es.json (i18n-js format)
3. **Update Execution Document** - Check off subtasks, add notes, document deviations, note issues
4. **Verify Changes** - Run verification commands, fix issues before next task
5. **Commit Progress** - Commit code + execution doc, use descriptive messages (no Claude references)

#### 5.3 Continuous Validation
- Run tests frequently: `pnpm test`
- Run linters regularly: `pnpm run lint`
- Test on both iOS and Android: `pnpm run ios:dev`, `pnpm run android:dev`
- Keep test coverage high

#### 5.4 Handle Issues
- Document all issues in Issues & Blockers section
- Attempt resolution
- Escalate to human if blocked
- Update execution document with resolution

#### 5.5 Platform Compatibility Checks
- Test on both iOS and Android devices/simulators
- Check for platform-specific code (Platform.OS checks)
- Avoid hardcoding platform-specific behavior unless necessary
- Use conditional logic or feature flags for platform-specific features
- Verify SafeAreaView usage on both platforms
- Test navigation flows on both platforms

### Progress Tracking Best Practices

1. **Update Frequently**: Update execution doc after each task completion
2. **Be Detailed**: Add notes about implementation decisions
3. **Document Issues**: Record all problems and solutions
4. **Keep It Current**: Progress bars should reflect reality
5. **Add Context**: Future you (or others) should understand what happened

### Deliverable
- Implemented code changes
- Updated execution document with progress

---

## Phase 6: Testing & Validation

### Objective
Ensure all changes work correctly with comprehensive testing.

### Activities

#### 6.1 Mobile Test Development (Jest)
- Create slice specs for Redux slices (reducers, state management)
- Create action specs for async thunks (API integration, error handling)
- Create service specs for API service methods
- Create selector specs for memoized selectors
- Create component specs for React Native components
- Create hook specs for custom hooks
- Follow testing patterns from CLAUDE.md:
  - Use Jest factories/fixtures for test data
  - Use descriptive test names
  - Test both success and failure scenarios
  - Group tests by functionality using `describe`/`it` blocks

#### 6.2 Component Test Development (Jest + React Testing Library)
- Create component tests for screens (`src/screens/`)
- Create component tests for UI components (`src/components-next/`)
- Follow testing patterns:
  - Use `describe`/`it` blocks
  - Mock API calls with `jest.mock()`
  - Mock navigation with `@react-navigation/native`
  - Test component rendering and user interactions
  - Test Redux integration (useAppSelector, useAppDispatch)
  - Use `@testing-library/react-native` for queries

#### 6.3 Test Execution

**All Tests (Jest)**:
```bash
# Run all tests
pnpm test

# Run in watch mode
pnpm test -- --watch

# Run specific file
pnpm test -- src/store/auth/specs/authSlice.spec.ts

# Run specific folder
pnpm test -- src/store/conversation

# Run with coverage
pnpm test -- --coverage
```

**Linting**:
```bash
# TypeScript/React Native
pnpm run lint
```

**Platform Testing**:
```bash
# Run on Android
pnpm run android:dev

# Run on iOS (macOS only)
pnpm run ios:dev
```

#### 6.4 Test Result Documentation
In execution document:
- Add test execution results
- Document coverage metrics
- Note any test failures and resolutions
- Verify all tests pass before proceeding

#### 6.5 Integration Testing
- Test end-to-end flows on both platforms
- Verify API integration works correctly
- Test ActionCable WebSocket connection
- Validate error handling (network errors, 401, 422, 500)
- Test navigation flows
- Test Redux listeners and cross-slice reactions

### Success Criteria
- [ ] All Jest tests pass
- [ ] Test coverage ≥ 80% for changed files
- [ ] No ESLint violations
- [ ] No TypeScript errors
- [ ] All verification commands successful
- [ ] Tested on both iOS and Android
- [ ] Metro bundler runs without errors
- [ ] No console warnings in development

### Deliverable
- Complete test suite (Jest)
- All tests passing
- Updated execution document with test results

---

## Phase 7: Completion & Review

### Objective
Finalize implementation and prepare for merge.

### Activities

#### 7.1 Final Validation
- Run complete test suite one final time
- Verify all tasks in execution plan are complete
- Ensure all checkboxes are marked
- Review implementation notes
- Confirm no open issues or blockers

#### 7.2 Documentation Updates
- Update CLAUDE.md if patterns changed
- Update navigation documentation if routes changed
- Create migration guides if breaking changes (state shape, AsyncStorage)
- Update relevant README files
- Update i18n files (both en.json and es.json)

#### 7.3 Code Review Preparation
- Ensure code follows all standards
- Remove debug code and console.log statements
- Verify commit messages are clear (no Claude references)
- Prepare summary of changes
- Test on both iOS and Android one final time

#### 7.4 Update Execution Document
- Set status to "Completed"
- Add completion timestamp
- Fill out completion checklist
- Add final notes and reflections

#### 7.5 Create Summary Report
In execution document, add:
- Summary of what was implemented
- Key decisions made
- Deviations from design (if any)
- Known limitations
- Recommendations for future work

### Deliverable
- Completed execution document
- Final summary report
- Code ready for review and merge

---

## Document Templates

### Design Document Template

**Location**: `/processes/design/DESIGN_TEMPLATE.md`

**Usage**: Copy template file and fill in all sections before Phase 3 review.

---

### Execution Plan Template

**Location**: `/processes/development/DEVELOPMENT_EXECUTION_TEMPLATE.md`

**Usage**: Copy template file and update in real-time during implementation.

---

## File Organization

### Directory Structure

```
/docs/
└── ignored/                         # Runtime documents (gitignored)
    ├── design/
    │   ├── feature_a_design.md
    │   └── feature_b_design.md
    ├── development/
    │   ├── feature_a_execution.md
    │   └── feature_b_execution.md
    └── archive/                     # Completed/old documents
        ├── 2024/
        └── 2025/

/processes/                          # Process templates (committed)
├── process_template.md
├── design/
│   ├── DESIGN_TEMPLATE.md
│   └── RESEARCH_TEMPLATE.md
├── development/
│   └── DEVELOPMENT_EXECUTION_TEMPLATE.md
├── tests/
│   ├── TEST_PLAN_TEMPLATE.md
│   └── TEST_RESULTS_TEMPLATE.md
└── code_review/
    ├── REVIEW_PLAN_TEMPLATE.md
    └── REVIEW_REPORT_TEMPLATE.md
```

### Naming Conventions

**Design Documents**:
- Format: `<short_description>_design.md`
- Example: `store_priority_feature_design.md`
- Lowercase, snake_case

**Execution Documents**:
- Format: `<short_description>_execution.md`
- Example: `store_priority_feature_execution.md`
- Must match corresponding design doc name

**Session IDs**:
- Format: `YYYYMMDD_HHMMSS` or UUID
- Example: `20251006_143022` or `a1b2c3d4-e5f6-...`

### Resuming Paused Work

If development is interrupted:
1. Open execution document in `/docs/ignored/development/`
2. Review progress overview and last completed task
3. Read comments section for context
4. Check issues section for any blockers
5. Continue from next unchecked task
6. Update status from "Paused" to "In Progress"
7. Add note documenting when/why work resumed

---

## Quality Gates

### Before Moving to Next Phase

#### After Study → Before Design
- [ ] All relevant files read and understood
- [ ] Redux + React Native architecture patterns identified
- [ ] Impact fully assessed (slices + components + navigation)
- [ ] Questions answered
- [ ] Platform compatibility checked (iOS/Android)

#### After Design → Before Review
- [ ] All required sections complete
- [ ] Code examples provided (TypeScript + React Native)
- [ ] Impact analysis thorough (slices, actions, components, navigation, tests)
- [ ] Testing strategy defined (Jest)
- [ ] i18n requirements documented

#### After Review → Before Execution
- [ ] Design approved by human
- [ ] All feedback incorporated
- [ ] Clarifications resolved
- [ ] Ready to implement

#### After Execution → Before Completion
- [ ] All tasks complete
- [ ] All tests passing (Jest)
- [ ] Documentation updated
- [ ] i18n updated (en.json + es.json)
- [ ] No open issues
- [ ] Both iOS and Android tested

---

## References

### Related Documents
- [CLAUDE.md](/CLAUDE.md) - Mobile app guidelines, commands, patterns, best practices
- [README_CHATSCOMMERCE.md](/README_CHATSCOMMERCE.md) - Setup guide and environment configuration
- [Design Template](/processes/design/DESIGN_TEMPLATE.md) - Design document template
- [Execution Template](/processes/development/DEVELOPMENT_EXECUTION_TEMPLATE.md) - Execution plan template
- [Research Process](/processes/design/research_and_design_process.md) - Pre-design research phase

### External Resources
- [React Native Documentation](https://reactnative.dev/) - Official React Native docs
- [Expo Documentation](https://docs.expo.dev/) - Expo SDK and tooling
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/) - State management
- [React Navigation](https://reactnavigation.org/) - Navigation library
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility-first CSS (via twrnc)
- [Jest Documentation](https://jestjs.io/) - Testing framework
- [React Testing Library](https://testing-library.com/docs/react-native-testing-library/intro/) - Component testing

---

## Changelog

### Version 3.0.0 (2025-11-12)
- **MAJOR**: Adapted for Chatwoot Mobile App (React Native + Expo + TypeScript)
- Updated all references from Rails/Vue.js to React Native/Redux
- Replaced RSpec/Vitest with Jest
- Updated architecture from Rails MVC to Redux slices
- Removed backend-specific content (Controllers, Models, Migrations, Jobs, Listeners)
- Removed Enterprise edition references
- Added mobile-specific considerations (iOS/Android, Metro, Expo, SafeAreaView)
- Updated all commands from Taskfile to pnpm scripts
- Updated all code examples to TypeScript/React Native
- Updated file paths to mobile structure (src/store/, src/screens/, etc.)
- Added platform compatibility checks
- Updated testing strategy for Jest + React Testing Library
- Updated all external resource links

### Version 2.0.0 (2025-10-06)
- **Major Update**: Adapted for Chatwoot (Rails + Vue.js) from Python/FastAPI
- Updated all references from Clean Architecture to Rails MVC + Services
- Added frontend development sections (Vue.js, Vuex, Tailwind CSS)
- Updated testing sections (RSpec + Vitest)
- Added Enterprise edition considerations throughout

### Version 1.0.0 (2025-10-04)
- Initial version (Python/FastAPI)
- Defined 7-phase development process
- Created document templates

---

## Document Metadata

**Document Owner**: Development Team
**Maintained By**: Claude Code + Human Engineers
**Review Cycle**: Quarterly or as needed
**Last Reviewed**: 2025-11-12
**Next Review Due**: 2026-02-12
**Technology Stack**: React Native 0.76.9 | Expo SDK 52 | TypeScript 5.1.3 | Redux Toolkit | Jest
