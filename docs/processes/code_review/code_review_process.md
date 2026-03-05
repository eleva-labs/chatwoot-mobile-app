# Code Review Process

**Version**: 1.0.0
**Last Updated**: 2025-01-27
**Status**: Active
**Document Type**: Process Guide
**Project**: Chatwoot Mobile App (React Native + Expo)

---

## Overview

**Purpose**: Systematic analysis of branch/feature changes to identify gaps, inconsistencies, and architectural violations.

**When to Use**:
- ✅ Branch refactorings, feature completions, pre-merge quality gates, architectural changes
- ❌ Simple typo fixes, doc-only changes, emergency hotfixes

**Process**: 4 phases, 60-120 minutes total

**Outputs**: Review plan, detailed findings report, action items

---

## Key Principles

1. **Systematic Analysis** - Methodical commit-by-commit review, document all findings
2. **Context-Aware** - Understand intent, review changes in relation to each other
3. **React Native Best Practices** - Verify mobile patterns, performance considerations, platform compatibility
4. **Completeness Verification** - Check all layers updated (components, screens, Redux, navigation, tests)
5. **Pattern Consistency** - Follow established codebase patterns
6. **Constructive Feedback** - Actionable findings with context and examples
7. **Platform Awareness** - Verify iOS and Android compatibility

---

## Process Workflow

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **1. Commit History Analysis** | 15-30 min | Commit analysis summary |
| **2. Review Planning** | 10-20 min | Review plan with checklist |
| **3. Detailed Code Review** | 30-60 min | Findings log (tracked) |
| **4. Report Generation** | 15-30 min | Final review report |

**Prerequisites**: Git access, branch/commit range, project rules understanding

---

## Phase 1: Commit History Analysis

**Objective**: Understand change progression

**Steps**:

1. **Review git log** - Analyze commits, identify patterns
   ```bash
   git log --oneline --graph main..HEAD
   git log --stat main..HEAD
   ```

2. **Map affected components** - Group by layer (components, screens, Redux, navigation, utils, types)
   ```bash
   git diff --name-only main...HEAD
   git diff --stat main...HEAD
   ```

3. **Identify change relationships** - Find cascading changes, potential gaps
   - Component changed → Tests updated?
   - Redux slice modified → Selectors updated?
   - Screen added → Navigation updated?
   - Type changed → All usages updated?

**Deliverable**: `/docs/ignore/code_review/<branch>_commit_analysis.md`

**Template**: `/docs/processes/code_review/COMMIT_ANALYSIS_TEMPLATE.md`

---

## Phase 2: Review Planning

**Objective**: Create structured review plan

**Steps**:

1. **Define scope** - Prioritize: High (Redux state, navigation, core components), Medium (screens, utils), Low (docs, styles)
2. **Create checklist** - Cover all layers + cross-layer + tests + patterns
3. **Define strategy** - Review order: Types → Redux → Components → Screens → Navigation → Utils → Tests

**Review Checklist**:
- **Types**: Type definitions correct, no `any` types, proper interfaces
- **Redux**: State structure correct, actions/reducers follow patterns, selectors updated, migrations if needed
- **Components**: Props typed, follow component patterns, accessibility, performance considerations
- **Screens**: Navigation props correct, safe area handling, platform-specific code
- **Navigation**: Routes defined, params typed, deep linking considered
- **Utils**: Functions typed, error handling, edge cases
- **Tests**: New/modified tests present, edge cases covered, both platforms considered
- **Patterns**: Naming conventions, absolute imports (`@/`), TypeScript strict mode, React Native best practices

**Deliverable**: `/docs/ignore/code_review/<branch>_review_plan.md`

**Template**: `/docs/processes/code_review/REVIEW_PLAN_TEMPLATE.md`

---

## Phase 3: Detailed Code Review

**Objective**: Execute review, identify gaps/issues

**Key Review Areas**:

1. **Type Definitions**
   ```bash
   git diff main...HEAD -- src/types/
   ```
   - Types properly defined? No `any` types?
   - Interfaces vs types used correctly?
   - Generic types used appropriately?

2. **Redux State**
   ```bash
   git diff main...HEAD -- src/store/
   ```
   - State structure follows patterns? Migrations needed?
   - Actions/reducers typed correctly?
   - Selectors updated? Performance optimized?
   - Redux Persist migrations if state shape changed?

3. **Components**
   ```bash
   git diff main...HEAD -- src/components-next/
   ```
   - Props typed? Component structure follows patterns?
   - Accessibility props? Performance optimized?
   - Safe area handling? Platform-specific code?

4. **Screens**
   ```bash
   git diff main...HEAD -- src/screens/
   ```
   - Navigation props typed? Safe area handled?
   - Platform-specific considerations?
   - Error handling? Loading states?

5. **Navigation**
   ```bash
   git diff main...HEAD -- src/navigation/
   ```
   - Routes defined? Params typed?
   - Deep linking considered? Navigation flow correct?

6. **Cross-Layer Completeness** - For each change, verify:
   - Type change → All usages updated
   - Redux change → Components using it updated
   - Component change → Tests updated
   - Screen change → Navigation updated

7. **Test Coverage**
   ```bash
   git diff main...HEAD -- __tests__/ src/**/*.test.ts src/**/*.test.tsx
   ```
   - New/modified tests present? Edge cases covered?
   - Both iOS and Android considered?

8. **Patterns & Architecture**
   - Naming conventions, absolute imports (`@/`), TypeScript strict mode
   - React Native best practices, performance considerations
   - Platform compatibility (iOS/Android)

**Document Findings** (by severity):
- 🚨 **Critical**: Must fix before merge
- ⚠️ **Major**: Should fix before merge
- 💡 **Minor**: Can defer

**Deliverable**: Update `/docs/ignore/code_review/<branch>_review_plan.md` with findings

---

## Phase 4: Report Generation

**Objective**: Compile actionable final report

**Steps**:

1. **Categorize findings** - Group by severity (critical, major, minor) and type (gaps, violations, inconsistencies)
2. **Create executive summary** - Overall assessment, strengths, critical issues, go/no-go recommendation
3. **Document detailed findings** - Each issue with: severity, location (file:line), description, impact, evidence, fix
4. **Generate action items** - Prioritized tasks: Must Do (critical), Should Do (major), Can Defer (minor) with effort estimates
5. **Add metadata** - Files reviewed, metrics, sign-off section

**Report Structure**:
```markdown
# Code Review Report: <Branch>

## Executive Summary
- Overall: ✅ PASS / ⚠️ CONDITIONAL PASS / ❌ FAIL
- Strengths: [list]
- Critical issues: [list]
- Recommendation: [go/no-go with rationale]

## Findings Summary
- Total: X (Y critical, Z major, W minor)
- By type: gaps, violations, inconsistencies
- By layer: types, Redux, components, screens, navigation, tests

## Detailed Findings
### 🚨 Critical (must fix before merge)
[Each with: location, description, impact, evidence code, fix]

### ⚠️ Major (should fix)
[Same structure]

### 💡 Minor (can defer)
[Same structure]

## Action Items
- Must Do (X hours): [tasks with owners, files, steps]
- Should Do (Y hours): [tasks]
- Can Defer (Z hours): [tasks]

## Metadata
- Files reviewed: X, Lines: +A/-B
- Metrics: coverage %, compliance %, consistency %
- Sign-off: Reviewer, approvals needed
```

**Deliverable**: `/docs/ignore/code_review/<branch>_review_report.md`

**Template**: `/docs/processes/code_review/REVIEW_REPORT_TEMPLATE.md`

---

## Best Practices

**For Reviewers**: Be systematic, provide context/evidence, be constructive, think holistically, use git diff/Grep/Glob effectively, document everything, consider both platforms

**For Authors**: Write clear commits, keep atomic, update tests, be receptive to feedback, test on both platforms

**General**: Schedule focused time (60-120 min), take breaks for long reviews, encourage dialogue, track common issues

---

## Quick Checklist

**Setup**: Branch identified, tools ready, time allocated (60-120 min)

**Phase 1**: ✅ Git log → commits categorized → components mapped → relationships identified → summary created

**Phase 2**: ✅ Scope defined → checklist created → strategy documented → tracking setup

**Phase 3**: ✅ Review all layers (types, Redux, components, screens, navigation) → cross-layer completeness → tests → patterns → document findings

**Phase 4**: ✅ Categorize findings → executive summary → detailed report → action items → metadata → deliver

**Completion**: Report delivered, critical issues flagged, re-review if needed

---

## Templates

**Process Templates** (committed to repo):
- **Commit Analysis**: `/docs/processes/code_review/COMMIT_ANALYSIS_TEMPLATE.md`
- **Review Plan**: `/docs/processes/code_review/REVIEW_PLAN_TEMPLATE.md`
- **Review Report**: `/docs/processes/code_review/REVIEW_REPORT_TEMPLATE.md`

**Runtime Documents** (created in `/docs/ignore/code_review/`):
- Commit Analysis: `<branch>_commit_analysis.md`
- Review Plan: `<branch>_review_plan.md`
- Final Report: `<branch>_review_report.md`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Too many commits** | Group by theme (`git log --grep`), focus on key commits, request squashing |
| **Unclear commit messages** | Read diffs (`git show <sha>`), ask author for clarification |
| **Missing cross-layer changes** | Use systematic checklist (type → Redux → component → screen → navigation → tests), search with Grep |
| **Intentional vs accidental gaps** | Mark as question not issue, review docs/comments, ask author |
| **Review fatigue** | Take breaks (45-min chunks), split across sessions, get second reviewer |
| **Platform-specific issues** | Verify both iOS and Android tested, check for platform-specific code |

---

## Quick Reference

**Git Commands**:
```bash
# Commit analysis
git log --oneline --graph main..HEAD
git log --stat main..HEAD

# File changes
git diff --name-only main...HEAD
git diff --stat main...HEAD

# Diffs
git diff main...HEAD -- path/to/file.tsx
git show <commit-sha>

# Search
git log -p -S "search_term" main..HEAD
git log --grep="pattern" main..HEAD
```

**Search Patterns**:
```bash
# Types: Glob "src/types/**/*.ts" | Grep "interface|type"
# Redux: Glob "src/store/**/*.ts" | Grep "createSlice|createAction"
# Components: Glob "src/components-next/**/*.tsx" | Grep "export.*Component"
# Screens: Glob "src/screens/**/*.tsx" | Grep "Screen.*="
# Tests: Glob "**/*.test.ts*" | Grep "describe|it|test"
```

**Review Checklist** (30 min minimum):
- Types (5 min): Properly typed, no `any`, interfaces correct
- Redux (5 min): State structure, actions/reducers, selectors, migrations
- Components (5 min): Props typed, patterns followed, accessibility
- Screens (5 min): Navigation props, safe area, platform considerations
- Navigation (5 min): Routes defined, params typed, deep linking
- Tests (5 min): New/modified tests, coverage adequate, both platforms

---

## Related Documentation

- [Development Process](/docs/processes/development/development_process.md) - Full development workflow
- [Testing Process](/docs/processes/tests/mobile_testing_process.md) - Mobile testing procedures
- [Project Rules](/.cursor/rules/about.mdc) - Project architecture and guidelines

---

## Changelog

### Version 1.0.0 (2025-01-27)
**Status**: Active
**Changes**: Initial version for React Native/Expo mobile app code review

---

**End of Document**

