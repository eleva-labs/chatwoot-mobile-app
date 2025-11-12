# Code Review Process Guide

**Version**: 3.0.0
**Last Updated**: 2025-11-12
**Status**: Active
**Document Type**: Process Guide
**Project**: Chatwoot Mobile App (React Native + Expo + TypeScript)

---

## Overview

**Purpose**: Systematic analysis of branch/feature changes to identify gaps, inconsistencies, and architectural violations in React Native + Expo mobile codebase.

**When to Use**:
- ✅ Branch refactorings, feature completions, pre-merge quality gates, architectural changes, mobile features
- ❌ Simple typo fixes, doc-only changes, emergency hotfixes, i18n-only updates

**Process**: 4 phases, 70-170 minutes total

**Outputs**: Review plan, detailed findings report, action items

### Document Location

**IMPORTANT**: All code review documents MUST be created in `/docs/ignored/code_review/`

- **Commit analysis**: `/docs/ignored/code_review/<branch_name>_commit_analysis.md`
- **Review plan**: `/docs/ignored/code_review/<branch_name>_review_plan.md`
- **Review report**: `/docs/ignored/code_review/<branch_name>_review_report.md`
- These documents are NOT committed to the repository
- Templates remain in `/processes/code_review/` for reference

## Key Principles

1. **Systematic Analysis** - Methodical commit-by-commit review, document all findings
2. **Context-Aware** - Understand intent behind changes, review in relation to each other
3. **Redux Architecture Compliance** - Verify Redux Toolkit patterns, slice organization, hook usage
4. **Mobile Completeness** - Check all affected components updated (Slices, Actions, Services, Selectors, Components, Navigation, i18n, Tests)
5. **Pattern Consistency** - Follow established React Native and Redux Toolkit patterns
6. **Constructive Feedback** - Actionable findings with context and examples
7. **Platform Compatibility** - Verify both iOS and Android compatibility

## Process Workflow

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **1. Commit History Analysis** | 15-30 min | Commit analysis summary |
| **2. Review Planning** | 10-20 min | Review plan with checklist |
| **3. Detailed Code Review** | 30-90 min | Findings log (tracked) |
| **4. Report Generation** | 15-30 min | Final review report |

**Prerequisites**: Git access, branch/commit range, CLAUDE.md understanding, README_CHATSCOMMERCE.md familiarity

## Phase 1: Commit History Analysis

**Objective**: Understand change progression

**Steps**:
1. **Review git log** - Analyze commits, identify patterns
   ```bash
   git log --oneline --graph development..HEAD
   git log --stat development..HEAD
   ```

2. **Map affected components** - Group by component type
   ```bash
   git diff --name-only development...HEAD
   git diff --stat development...HEAD
   ```

   **Component Categories**:
   - **State Management**: Redux slices, Actions, Services, Selectors, Listeners
   - **UI**: React Native components, Screens, Navigation
   - **API Integration**: API service, ActionCable connector
   - **Localization**: i18n files (i18n-js)
   - **Utilities**: Utils, Hooks, Theme
   - **Native**: iOS/Android native modules (if any)
   - **Tests**: Jest specs (slices, actions, components, utils)

3. **Identify change relationships** - Find cascading changes, potential gaps
   - Slice changed → Types updated?
   - Action added → Service method created?
   - Slice changed → Selectors updated?
   - State shape changed → Component updated?
   - State shape changed → Navigation params updated?
   - Component added → i18n keys added?
   - Component added → Both en.json and es.json updated?
   - Slice created → Jest specs created?
   - Component created → Component specs created?
   - Feature added → Both iOS and Android tested?

**Deliverable**: `/docs/ignored/code_review/<branch_name>_commit_analysis.md`
```markdown
# Commit Analysis: <Branch>
- Total commits: X
- Categories: features, refactors, fixes
- Affected components: [Slices, Actions, Components, Navigation, i18n, Tests]
- Change relationships: [map]
- Areas for deep review: [list]
- Platform impact: [iOS, Android, both, platform-specific code]
```

## Phase 2: Review Planning

**Objective**: Create structured review plan

**Steps**:
1. **Define scope** - Prioritize: High (Slices, Actions, Navigation), Medium (Components, Services, Selectors), Low (docs, i18n)
2. **Create checklist** - Cover all components + cross-component + tests + patterns
3. **Define strategy** - Review order: Slices → Actions → Services → Selectors → Components → Navigation → i18n → Cross-component → Tests → Platform

**Review Checklist** (abbreviated):
- **Redux Slices**: State shape correct, reducers use Immer, proper immutability
- **Redux Actions**: createAsyncThunk usage, error handling, typing correct
- **Redux Services**: API calls correct, camelCaseKeys transformation, error handling
- **Redux Selectors**: Memoization with createSelector, proper state access
- **Redux Listeners**: Event handling correct, cross-slice reactions
- **Components**: Functional components, hooks usage, no class components
- **Styling**: Tailwind via twrnc ONLY (no StyleSheet.create)
- **Navigation**: React Navigation patterns, params typing, deep linking
- **Hooks**: Custom hooks properly structured, cleanup in useEffect
- **i18n**: BOTH en.json AND es.json updated (i18n-js format), keys follow convention
- **ActionCable**: Proper subscription/cleanup
- **Cross-Component**: Slice change → Service → Component → i18n → Tests updated
- **Tests**: Jest specs for slices, actions, components, utils
- **Patterns**: React Native conventions, Redux Toolkit patterns, naming, TypeScript
- **Platform**: Tested on both iOS and Android, platform-specific code documented

**Deliverable**: `/docs/ignored/code_review/<branch_name>_review_plan.md` with checklist and progress tracking

## Phase 3: Detailed Code Review

**Objective**: Execute review, identify gaps/issues

### Key Review Areas

#### 1. Redux Slices Layer
```bash
git diff development...HEAD -- src/store/
```

**Check**:
- State shape properly typed (TypeScript interfaces)?
- Reducers use Immer patterns (direct mutations in Redux Toolkit)?
- Initial state correct and complete?
- Slice properly exported?
- No direct mutations outside reducers?
- extraReducers handle async actions properly?

**Example Finding**:
```
⚠️ MAJOR: src/store/conversation/conversationSlice.ts:45
Direct state mutation outside reducer
Impact: Could cause state inconsistency and bugs
Fix: Move mutation to reducer or use createAsyncThunk with extraReducers
```

#### 2. Redux Actions Layer
```bash
git diff development...HEAD -- src/store/**/[!.]Actions.ts
```

**Check**:
- Using createAsyncThunk for async operations?
- Proper error handling (try/catch)?
- TypeScript types correct (arguments and return types)?
- Dispatching appropriate events/listeners?
- No business logic in components?
- Action names follow convention?

#### 3. Redux Services Layer
```bash
git diff development...HEAD -- src/store/**/[!.]Service.ts
```

**Check**:
- Using apiService singleton?
- camelCaseKeys transformation applied to responses?
- Error handling present?
- Static methods (no instances)?
- Proper TypeScript return types?
- No business logic (only API calls)?

#### 4. Redux Selectors Layer
```bash
git diff development...HEAD -- src/store/**/[!.]Selectors.ts
```

**Check**:
- Using createSelector for memoization?
- Proper state access patterns?
- Input selectors simple and focused?
- Complex computations in result function?
- Reusable selectors when possible?
- TypeScript return types correct?

#### 5. React Native Components
```bash
git diff development...HEAD -- src/screens/ src/components-next/
```

**Check**:
- Functional components only (no class components)?
- Hooks used correctly (useState, useEffect, useCallback, useMemo)?
- Tailwind via twrnc (no StyleSheet.create)?
- i18n for all user-facing text (I18n.t('KEY'))?
- useAppSelector/useAppDispatch for Redux?
- Proper cleanup in useEffect return?
- SafeAreaView used where needed?
- No business logic (in Redux actions instead)?

#### 6. Navigation
```bash
git diff development...HEAD -- src/navigation/
```

**Check**:
- React Navigation patterns followed?
- Route params properly typed?
- Navigation options correct?
- Deep linking configured (if needed)?
- Screen names consistent?
- Navigation structure organized?

#### 7. Hooks
```bash
git diff development...HEAD -- src/hooks/
```

**Check**:
- Custom hooks start with "use" prefix?
- Proper dependencies in useEffect/useMemo/useCallback?
- Cleanup functions in useEffect return?
- Hooks extracted for reusability?
- No side effects in render?
- TypeScript types correct?

#### 8. Styling
```bash
git diff development...HEAD -- src/ | grep -i "style"
```

**Check**:
- Using tailwind() from @/theme/tailwind?
- No StyleSheet.create usage?
- No custom inline styles?
- Colors from theme (not hardcoded)?
- Responsive to theme changes (light/dark)?
- Platform-specific styles documented?

**Example Finding**:
```
🚨 CRITICAL: src/screens/chat-screen/MessageList.tsx:120
Using StyleSheet.create instead of tailwind
Impact: Violates styling standards, breaks theme consistency
Fix: Replace StyleSheet with tailwind('...')
```

#### 9. Redux Listeners
```bash
git diff development...HEAD -- src/store/**/[!.]Listener.ts
```

**Check**:
- Using createListenerMiddleware?
- Proper action/state matchers?
- Cross-slice reactions appropriate?
- No complex business logic?
- Cleanup when listener stops?

#### 10. ActionCable Integration
```bash
git diff development...HEAD -- src/utils/actionCable.ts
```

**Check**:
- Proper subscription setup?
- Cleanup on unmount/disconnect?
- Event handlers correct?
- camelCaseKeys transformation?
- Error handling for disconnections?

#### 11. i18n Files
```bash
git diff development...HEAD -- src/i18n/
```

**Check**:
- **BOTH** en.json AND es.json updated? (i18n-js format)
- Keys follow convention? (`RESOURCE.SECTION.KEY`)
- Translations accurate?
- No hardcoded strings in components?
- Pluralization handled correctly?

**Example Finding**:
```
🚨 CRITICAL: i18n translations incomplete
Found updates to en.json but es.json not updated
Impact: Spanish users will see English text or keys
Fix: Add Spanish translations for STORES.PRIORITY.* keys
```

#### 12. Cross-Component Completeness

For each feature change, verify complete propagation:

**Checklist for Feature Addition**:
- [ ] Redux slice created/updated (with types)
- [ ] Actions created (createAsyncThunk)
- [ ] Service methods created (API calls)
- [ ] Selectors created (memoized)
- [ ] Component created/updated
- [ ] Navigation updated (if new screen)
- [ ] i18n updated (en + es)
- [ ] Tests created (slice + action + component)
- [ ] Both iOS and Android tested

**Example Finding**:
```
🚨 CRITICAL: Incomplete cross-component update
Added `priority` feature to Store slice but:
- ❌ Component not updated (UI won't display priority)
- ❌ i18n not updated (labels missing)
- ❌ Selectors not created (no memoization)
- ✅ Slice updated
- ✅ Actions created
- ✅ Service method present
Fix: Update component, i18n, and add selectors
```

#### 13. Test Coverage
```bash
git diff development...HEAD -- src/**/specs/
```

**All Tests (Jest)**:
- [ ] Slice specs for reducers
- [ ] Action specs for async thunks
- [ ] Selector specs for memoization
- [ ] Component specs for rendering/interactions
- [ ] Service specs for API calls
- [ ] Utility specs for helpers
- [ ] Hook specs for custom hooks

**Check**:
- New/modified tests present?
- Edge cases covered?
- Error scenarios tested?
- Mocking appropriate (jest.mock)?
- Test coverage adequate (≥80% for changed files)?
- React Testing Library best practices followed?

#### 14. Patterns & Code Style

**React Native Patterns**:
- [ ] Functional components everywhere
- [ ] Hooks used correctly (dependencies, cleanup)
- [ ] No class components
- [ ] Tailwind via twrnc (no custom styles)
- [ ] i18n for all text
- [ ] FlashList for long lists (not FlatList)

**Redux Patterns**:
- [ ] Slices follow naming convention
- [ ] Actions use createAsyncThunk
- [ ] Services are static methods
- [ ] Selectors use createSelector (memoization)
- [ ] Listeners for cross-slice reactions

**Code Style**:
- [ ] ESLint/Prettier passes
- [ ] No console.log statements (use logger)
- [ ] No commented-out code
- [ ] TypeScript strict mode compliance

#### 15. Platform Compatibility

```bash
# Check for platform-specific code
git diff development...HEAD | grep -i "Platform.OS"
```

**Check**:
- [ ] Platform-specific code documented?
- [ ] Both iOS and Android tested?
- [ ] No iOS-only or Android-only features (unless intentional)?
- [ ] SafeAreaView used appropriately?
- [ ] Navigation works on both platforms?
- [ ] Native modules work on both (if any)?

**Example Finding**:
```
🚨 CRITICAL: Platform-specific code without Android support
src/screens/settings/SettingsScreen.tsx uses iOS-only API
Impact: Android app will crash
Fix: Add Platform.OS check or use cross-platform alternative
```

### Finding Severity Levels

**Document Findings** (by severity):
- 🚨 **Critical**: Must fix before merge (breaking changes, data loss, API contract violations)
- ⚠️ **Major**: Should fix before merge (pattern violations, missing tests, incomplete features)
- 💡 **Minor**: Can defer (style issues, minor optimizations, documentation)

**Deliverable**: Update `/docs/ignored/code_review/<branch_name>_review_plan.md` with findings

## Phase 4: Report Generation

**Objective**: Compile actionable final report

**Steps**:
1. **Categorize findings** - Group by severity (critical, major, minor) and type (gaps, violations, inconsistencies)
2. **Create executive summary** - Overall assessment, strengths, critical issues, go/no-go recommendation
3. **Document detailed findings** - Each issue with: severity, location (file:line), description, impact, evidence, fix
4. **Generate action items** - Prioritized tasks: Must Do (critical), Should Do (major), Can Defer (minor) with effort estimates
5. **Add metadata** - Files reviewed, metrics, sign-off section

**Report Template Structure**:
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
- By component: models, services, controllers, vue, vuex, tests, i18n

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
- Files reviewed: X backend, Y frontend, Z tests
- Lines: +A/-B
- Metrics: test coverage %, RuboCop compliance, ESLint compliance
- Sign-off: Reviewer, approvals needed
```

**Deliverable**: `/docs/ignored/code_review/<branch_name>_review_report.md`

## Templates

### Template Locations

**Process Templates** (committed to repo):
- **Commit Analysis Template**: `/processes/code_review/COMMIT_ANALYSIS_TEMPLATE.md`
- **Review Plan Template**: `/processes/code_review/REVIEW_PLAN_TEMPLATE.md`
- **Review Report Template**: `/processes/code_review/REVIEW_REPORT_TEMPLATE.md`

**Runtime Documents** (created in `/docs/ignored/code_review/`):
- Commit Analysis: `<branch>_commit_analysis.md`
- Review Plan: `<branch>_review_plan.md`
- Final Report: `<branch>_review_report.md`

### Template Key Sections

**1. Commit Analysis Template**
- Commits: total, categories (features/refactors/fixes)
- Affected components: slices, actions, services, selectors, components, navigation, i18n, tests
- Change relationships
- Areas for review
- Potential issues identified
- Platform impact
- Review strategy

**2. Review Plan Template**
- Scope: in/out, prioritized
- Checklist: slices, actions, services, selectors, listeners, components, navigation, hooks, styling, i18n, cross-component, tests, patterns, platform
- Strategy: review order, approach
- Progress tracking with findings log
- Blockers and questions

**3. Review Report Template**
- Executive summary: overall assessment, go/no-go
- Findings: critical/major/minor with location, evidence, fix
- Action items: must do/should do/can defer
- Metadata: files reviewed (slices + components + tests), metrics, sign-off

### Example Workflow

```
5 commits: 2 features, 2 refactors, 1 fix
→ Affected: Slices (storeSlice), Actions (updatePriority), Services (storeService), Components (StorePriorityBadge), i18n (en + es)
→ GAPS FOUND:
  - Missing selector for priority (major)
  - Missing Jest component test (major)
  - Spanish i18n missing (critical)
```

## Quick Checklist

**Setup**: Branch identified, tools ready, time allocated (70-170 min)

**Phase 1**: ✅ Git log → commits categorized → components mapped (slices + components + navigation) → relationships identified → Platform impact assessed → summary created

**Phase 2**: ✅ Scope defined → checklist created (slices, actions, services, selectors, listeners, components, navigation, hooks, i18n, tests, platform) → strategy documented → tracking setup

**Phase 3**: ✅ Review all components (slices, actions, services, selectors, components, navigation, hooks, styling, listeners, i18n) → cross-component completeness → tests (Jest) → patterns (React Native + Redux) → code style (ESLint) → platform compatibility → document findings

**Phase 4**: ✅ Categorize findings → executive summary → detailed report → action items → metadata → deliver

**Completion**: Report delivered, critical issues flagged, re-review if needed

## Related Documentation

### Internal Documentation

**Process Documentation**:
- [Research Process](/processes/design/research_and_design_process.md) - For initial feature research
- [Development Process](/processes/development/development_process.md) - Full development workflow
- [API Testing Process](/processes/tests/api_testing_process.md) - API integration testing procedures

**Technical Documentation**:
- [CLAUDE.md](/CLAUDE.md) - Mobile app guidelines, commands, patterns, best practices
- [README_CHATSCOMMERCE.md](/README_CHATSCOMMERCE.md) - Setup and environment configuration

**Templates**:
- [Process Template](/processes/process_template.md) - Template for creating new processes
- [Research Template](/processes/design/RESEARCH_TEMPLATE.md) - Research report template
- [Design Template](/processes/design/DESIGN_TEMPLATE.md) - Design document template

### External Resources

- [Git Diff Documentation](https://git-scm.com/docs/git-diff) - Official git diff reference
- [React Native Documentation](https://reactnative.dev/) - Official React Native docs
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/) - State management
- [Conventional Commits](https://www.conventionalcommits.org/) - Commit message standards
- [Code Review Best Practices](https://google.github.io/eng-practices/review/) - Google's engineering practices

---

## Changelog

### Version 3.0.0 (2025-11-12)

**Status**: Active

**Changes**:
- **MAJOR**: Adapted for Chatwoot Mobile App (React Native + Expo + TypeScript)
- Updated all references from Rails/Vue.js to React Native/Redux
- Replaced backend review sections with mobile review sections
- Added Redux Toolkit review areas (Slices, Actions, Services, Selectors, Listeners)
- Added React Native component review (functional components, hooks, Tailwind via twrnc)
- Added Navigation review (React Navigation)
- Added platform compatibility checks (iOS/Android)
- Removed Enterprise edition references
- Updated i18n checks for i18n-js format
- Updated testing sections (Jest + React Testing Library)
- Updated all code examples to TypeScript/React Native
- Updated file paths to mobile structure (src/store/, src/screens/, etc.)
- Updated all external resource links

**Migration Notes**:
- Previous version (2.0.0) was for Rails + Vue.js backend
- This version (3.0.0) is for React Native + Expo mobile app
- Review checklists now focus on mobile architecture (Redux, React Native)
- Update existing review templates to use new mobile component categories

### Version 2.0.0 (2025-10-06)

**Status**: Superseded by 3.0.0

**Changes**:
- **Major Update**: Adapted for Chatwoot (Rails + Vue.js) from Python/FastAPI
- Added full-stack review requirements (backend + frontend)
- Updated component categories: Models, Services, Controllers, Vue, Vuex
- Added Enterprise compatibility checks

### Version 1.0.0 (2025-10-04)

**Status**: Archived

**Changes**:
- Initial version (Python/FastAPI)
- Defined 4-phase review workflow

---

## Document Metadata

**Document Owner**: Development Team

**Maintained By**: Claude Code + Human Engineers

**Review Cycle**: Quarterly or after significant process changes

**Last Reviewed**: 2025-11-12

**Next Review Due**: 2026-02-12

**Technology Stack**: React Native 0.76.9 | Expo SDK 52 | TypeScript 5.1.3 | Redux Toolkit | Jest

**Contact**: Development team channel for questions and feedback

---

**End of Document**
