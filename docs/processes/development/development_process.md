# Development Process Guide

**Version**: 1.0.0
**Last Updated**: 2025-01-27
**Status**: Active
**Document Type**: Process Guide
**Project**: Chatwoot Mobile App (React Native + Expo)

---

## Overview

Standardized development process for Chatwoot Mobile App ensuring consistent, high-quality implementations with proper documentation, testing, and review cycles.

### Key Principles

1. **Study First** - Deep understanding before coding
2. **Design Before Implementation** - Document the plan before execution
3. **Iterative Refinement** - Collaborate with engineers to refine designs
4. **Track Progress** - Maintain execution documents for transparency and resumability
5. **Test Thoroughly** - Unit tests and manual testing on both iOS and Android
6. **Document Everything** - Clear documentation for future reference
7. **Mobile-First** - Always test on both iOS and Android platforms
8. **Performance Aware** - Consider mobile performance implications

### Process Stages

```
User Request → Study & Analysis → Design Document → Design Review → Execution Plan → Implementation → Testing & Validation → Final Review → Completion
```

---

## Development Workflow

| Phase | Deliverable | Duration |
|-------|-------------|----------|
| 1. Study & Analysis | Analysis notes | 30-60 min |
| 2. Design Document | Design MD file | 1-2 hours |
| 3. Design Review | Approved design | Variable |
| 4. Execution Plan | Execution MD file | 30 min |
| 5. Implementation | Code + Updates | Variable |
| 6. Testing | Test results | Variable |
| 7. Completion | Final report | 30 min |

---

## Phase 1: Study & Analysis

**Objective**: Deep understanding of codebase, problem, and potential solutions

**Activities**:

1. **Understand Request** - Parse user request, identify core problem, clarify ambiguities, define success criteria

2. **Study Current Implementation** - Use comprehensive approach, read ALL relevant files (Glob/Grep/Read), understand architecture/patterns, identify dependencies/impacts, map data flow

3. **Research Best Practices** - Review project rules, check existing patterns, apply React Native/Expo best practices, consider mobile-specific constraints

4. **Analyze Impact** - Identify affected files, determine breaking changes, assess risks, estimate effort, consider iOS/Android platform differences

**Deliverable**: Internal analysis notes (informal, used for design document)

---

## Phase 2: Design Document

**Objective**: Create comprehensive design document proposing the solution

### File Location

```
/docs/ignore/<feature_name>/design/<feature_name>_design.md

Format: <short_description>_design.md
Example: feature_ai_assistant/design/ai_assistant_design.md
Naming: lowercase, snake_case

Note:
- Feature folder groups all artifacts (design, development, testing)
- Feature name should be tied to branch when possible (e.g., feature_ai_assistant/)
- Runtime documents in /docs/ignore/ (not committed)
```

### Required Sections

1. **Header Metadata** - Session ID, Created date, Author, Status, Related Request
2. **Executive Summary** - Brief overview, key benefits, effort estimate, risk summary
3. **Current State Analysis** - Current implementation, code examples, problems, files affected
4. **Proposed Solution** - High-level approach, architecture changes, code examples (before/after), design patterns, React Native/Expo alignment
5. **Technical Design** - Component structure, Redux state changes, navigation changes, API integration, data models/types
6. **Impact Analysis** - Files affected by type, breaking changes, Redux state migrations, navigation changes, test updates, platform considerations (iOS/Android)
7. **Migration Strategy** - Step-by-step plan, backward compatibility, rollback plan, state migration if needed
8. **Testing Strategy** - Unit tests to create/update, integration tests, manual testing scenarios, iOS/Android testing, edge cases
9. **Risks & Mitigations** - Identified risks with severity, mitigation strategies, contingency plans, platform-specific risks
10. **Alternatives Considered** - Other approaches, why rejected, trade-offs
11. **Timeline & Effort** - Duration estimate, task breakdown, dependencies

**Template**: `/docs/processes/design/DESIGN_TEMPLATE.md`

**Deliverable**: Complete design document in `/docs/ignore/<feature_name>/design/`

---

## Phase 3: Design Review & Refinement

**Objective**: Collaborate with human engineer to refine and approve design

**Activities**:

1. **Initial Review** - Human reviews document, identifies concerns/questions, requests clarifications
2. **Iterative Refinement** - Agent updates based on feedback, discuss to refine, explore alternatives, evolve until approval
3. **Final Approval** - Human approves, status updated to "Approved", ready for execution

**Deliverable**: Approved design document (Status: "Approved")

---

## Phase 4: Execution Plan

**Objective**: Create detailed, trackable execution plan

### File Location

```
/docs/ignore/<feature_name>/development/<feature_name>_execution.md

Format: <short_description>_execution.md
Example: feature_ai_assistant/development/ai_assistant_execution.md

Note: All execution documents for the feature go in the feature's development/ subfolder
```

### Required Sections

1. **Header Metadata** - Session ID, dates, status (Not Started | In Progress | Completed | Blocked | Paused), design doc link

2. **Progress Overview** - Visual progress bars per phase, overall tracker, legend (✅ Completed, 🔄 In Progress, ⏸️ Blocked, ❌ Failed, ░ Not Started)

3. **Phases with Tasks** - Phase 1: Redux State, Phase 2: Components, Phase 3: Screens, Phase 4: Navigation, Phase 5: API Integration, Phase 6: Testing & Validation (each with tasks and nested subtask checkboxes)

4. **Observations & Issues** - Timestamped entries, type (Observation, Issue, Decision, Note, Blocker), status (Open, Resolved), description/files/resolution

**Template**: `/docs/processes/development/DEVELOPMENT_EXECUTION_TEMPLATE.md`

**Deliverable**: Complete execution plan in `/docs/ignore/<feature_name>/development/`

---

## Phase 5: Implementation & Tracking

**Objective**: Implement solution while tracking progress

**Activities**:

### Setup
- Create feature branch
- Initialize execution document
- Set status "In Progress"

### Iterative Implementation

For each task:

1. **Update Task Status** - Check off task/subtasks `[x]`, update phase status and progress bars

2. **Implement Changes** - Follow design document, write clean/documented code, follow project rules, use TypeScript strictly, follow React Native patterns, use absolute imports (`@/`), add proper types

3. **Update Execution Document** - Update progress overview, check off completed tasks, add timestamped observations (implementation decisions, deviations from design, issues/resolutions, learnings)

4. **Verify Changes** - Run tests/validation, fix issues immediately, test on both iOS and Android

5. **Commit Progress** - Commit code + execution document, descriptive commit messages

### Continuous Validation
- Run linting frequently (`pnpm run lint`)
- Check TypeScript compilation (`npx tsc --noEmit`)
- Test on iOS simulator (`pnpm run ios:dev`)
- Test on Android emulator (`pnpm run android:dev`)
- Keep coverage high

### Handle Issues
- Document all issues as timestamped observations
- Attempt resolution
- Escalate to human if blocked
- Update observation with resolution

**Deliverable**: Implemented code + updated execution document

---

## Phase 6: Testing & Validation

**Objective**: Ensure all changes work correctly on both platforms

### Unit Test Development

**Create/Update Tests**:
- New tests for new functionality
- Update existing tests affected by changes
- Follow project patterns:
  - Use Jest for testing
  - Test components with React Native Testing Library
  - Test Redux slices and actions
  - Test utility functions
  - Test success and failure cases
  - Test all layers (components, screens, Redux, utils)

### Test Execution

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test --coverage

# Run TypeScript type checking
npx tsc --noEmit

# Run linting
pnpm run lint
```

### Manual Testing

**iOS Testing**:
```bash
# Start iOS development build
pnpm run ios:dev

# Test on physical device (requires setup)
# Test on simulator
```

**Android Testing**:
```bash
# Start Android development build
pnpm run android:dev

# Test on physical device (requires setup)
# Test on emulator
```

**Testing Checklist**:
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

### Test Result Documentation

In execution document:
- Check off testing tasks/subtasks
- Update progress bar
- Add observation with: test results, coverage metrics, failures/resolutions, platform-specific issues

### Code Quality

```bash
# Type checking
npx tsc --noEmit

# Linting
pnpm run lint

# Format code (if using Prettier)
npx prettier --write .
```

### Success Criteria
- [ ] All unit tests pass
- [ ] Test coverage ≥ 80% for changed files
- [ ] No TypeScript errors
- [ ] No linting violations
- [ ] Manual testing complete on iOS
- [ ] Manual testing complete on Android
- [ ] All verification commands successful

**Deliverable**: Complete test suite, all tests passing, updated execution document

---

## Phase 7: Completion & Review

**Objective**: Finalize implementation and prepare for merge

**Activities**:

### Final Validation
- Run complete test suite
- Verify all phases 100% complete
- Ensure all checkboxes marked
- Review observations for unresolved issues
- Confirm no open blockers
- Test on both iOS and Android one final time

### Documentation Updates
- Update project rules if patterns changed
- Update README if setup changed
- Create migration guides for breaking changes
- Update relevant documentation files

### Code Review Preparation
- Code follows all standards
- Remove debug code/comments
- Verify clear commit messages
- Prepare summary of changes
- Ensure both platforms tested

### Update Execution Document
- Set status "Completed"
- Add completion timestamp
- Verify all checklist items
- Add final observation summarizing: accomplishments, key decisions, deviations, limitations, recommendations, platform-specific notes

**Deliverable**: Completed execution document + code ready for review/merge

---

## Document Templates

- **Design Document**: `/docs/processes/design/DESIGN_TEMPLATE.md`
- **Execution Plan**: `/docs/processes/development/DEVELOPMENT_EXECUTION_TEMPLATE.md`

---

## Resuming Paused Work

### Steps to Resume

1. **Open Execution Document** - Find in `/docs/ignore/<feature_name>/development/`
2. **Review Progress Overview** - Check progress bars for phase completion
3. **Review Phase Checklists** - See completed `[x]` vs unchecked tasks
4. **Read Recent Observations** - Understand latest decisions/issues/context
5. **Check for Blockers** - Review for blockers, resolve before continuing
6. **Update Status** - Change "Paused" to "In Progress", update timestamp
7. **Add Resumption Note** - Timestamped observation documenting resumption
8. **Continue Implementation** - Pick up from next unchecked task

### Resumability Tips
- Keep execution doc updated after each task
- Write clear observations for context
- Mark blockers clearly (type: Blocker)
- Use descriptive task names

---

## Troubleshooting

| Issue | Symptoms | Solution | Prevention |
|-------|----------|----------|------------|
| **Design review delays** | Doc unreviewed for days | Schedule sync, set 24-48h timeline | Involve stakeholders early |
| **Execution doc outdated** | Progress bars wrong | Commit doc with code changes | Update after each task |
| **Tests failing late** | Implementation done but tests fail | Run tests continuously | Run `pnpm test` after each change |
| **Missing platform testing** | Works on iOS but not Android | Test on both platforms during development | Test on both platforms after each major change |
| **TypeScript errors** | Type errors after merge | Fix types incrementally | Run `npx tsc --noEmit` frequently |
| **Redux state issues** | State not persisting or updating | Check Redux Persist config, verify actions | Test Redux state changes immediately |

### When to Escalate
- **Blockers**: Can't resolve after 30 min
- **Design Questions**: Unclear requirements
- **Breaking Changes**: Impact not in design doc
- **Test Failures**: Existing tests fail, reason unclear
- **Platform-Specific Issues**: Issues only on one platform that can't be resolved

---

## Quick Reference

### Development Commands

```bash
# Start development server
pnpm start

# iOS development
pnpm run ios:dev

# Android development
pnpm run android:dev

# Run tests
pnpm test

# Type checking
npx tsc --noEmit

# Linting
pnpm run lint

# Generate native code
pnpm run generate

# Check Expo config
pnpm run check:config

# Expo doctor
pnpm run run:doctor
```

### File Naming

| Document Type | Format | Example | Location |
|---------------|--------|---------|----------|
| Design Document | `{feature}_design.md` | `ai_assistant_design.md` | `/docs/ignore/<feature_name>/design/` |
| Execution Plan | `{feature}_execution.md` | `ai_assistant_execution.md` | `/docs/ignore/<feature_name>/development/` |
| Testing Artifacts | Various | `test_plan.md`, `test_results.md` | `/docs/ignore/<feature_name>/testing/` |

### Session ID Format
- **Timestamp**: `YYYYMMDD_HHMMSS` (e.g., `20250127_143022`)
- **UUID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Quality Gates
- **Before Design Review**: All sections complete, code examples provided
- **Before Implementation**: Design approved by human
- **Before Completion**: All tests pass, no open issues, both platforms tested

---

## Related Documentation

- [Project Rules](/.cursor/rules/about.mdc) - Project guidelines and conventions
- [Research Process](/docs/processes/design/research_and_design_process.md) - Research phase guide
- [Code Review Process](/docs/processes/code_review/code_review_process.md) - Code review workflow

---

## Changelog

### Version 1.0.0 (2025-01-27)
**Status**: Active
**Changes**: Initial version for React Native/Expo mobile app development

---

**End of Document**

