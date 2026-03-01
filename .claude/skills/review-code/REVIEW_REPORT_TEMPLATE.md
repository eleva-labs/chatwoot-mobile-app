# Code Review Report Template

**Version**: 1.0.0
**Last Updated**: 2026-01-11
**Parent**: [SKILL.md](SKILL.md)

---

## Usage

Copy this template to create review reports at:
`/docs/ignored/code_review/<branch>_review_report.md`

---

# Code Review Report: {Branch Name}

**Review Date**: {Date}
**Reviewer**: {Name}
**Author**: {Name}
**Base Branch**: {main/development}
**Commits Reviewed**: {count} ({first-sha}...{last-sha})

---

## Executive Summary

### Overall Assessment

| Verdict | Icon |
|---------|------|
| **PASS** | :white_check_mark: Ready to merge |
| **CONDITIONAL PASS** | :warning: Merge after addressing major issues |
| **FAIL** | :x: Requires significant changes |

**Overall**: {PASS / CONDITIONAL PASS / FAIL}

### Strengths
- {Strength 1}
- {Strength 2}
- {Strength 3}

### Critical Issues
- {Critical issue 1} - [Link to finding](#finding-1)
- {Critical issue 2} - [Link to finding](#finding-2)

### Recommendation
{Go/No-go recommendation with brief rationale}

---

## Findings Summary

### By Severity

| Severity | Count | Action Required |
|----------|-------|-----------------|
| :rotating_light: Critical | {X} | Must fix before merge |
| :warning: Major | {Y} | Should fix before merge |
| :bulb: Minor | {Z} | Can defer |
| **Total** | **{X+Y+Z}** | |

### By Type

| Type | Count |
|------|-------|
| Gaps (missing changes) | {X} |
| Violations (pattern/architecture) | {Y} |
| Inconsistencies | {Z} |
| Performance | {W} |
| Security | {V} |

### By Layer

| Layer | Critical | Major | Minor |
|-------|----------|-------|-------|
| Types | {X} | {Y} | {Z} |
| Redux | {X} | {Y} | {Z} |
| Components | {X} | {Y} | {Z} |
| Screens | {X} | {Y} | {Z} |
| Navigation | {X} | {Y} | {Z} |
| Tests | {X} | {Y} | {Z} |

---

## Detailed Findings

### :rotating_light: Critical (Must Fix Before Merge)

#### Finding 1: {Title}
{#finding-1}

**Location**: `{file-path}:{line-number}`
**Type**: {Gap / Violation / Inconsistency}
**Layer**: {Types / Redux / Components / Screens / Navigation / Tests}

**Description**:
{Clear description of the issue}

**Impact**:
{Why this is critical, what could go wrong}

**Evidence**:
```typescript
// Current code
{problematic code snippet}
```

**Recommended Fix**:
```typescript
// Fixed code
{corrected code snippet}
```

**Effort**: {Low / Medium / High}

---

#### Finding 2: {Title}
{#finding-2}

**Location**: `{file-path}:{line-number}`
**Type**: {Gap / Violation / Inconsistency}
**Layer**: {Types / Redux / Components / Screens / Navigation / Tests}

**Description**:
{Clear description of the issue}

**Impact**:
{Why this is critical}

**Evidence**:
```typescript
{problematic code}
```

**Recommended Fix**:
```typescript
{corrected code}
```

**Effort**: {Low / Medium / High}

---

### :warning: Major (Should Fix Before Merge)

#### Finding 3: {Title}

**Location**: `{file-path}:{line-number}`
**Type**: {Gap / Violation / Inconsistency}
**Layer**: {Types / Redux / Components / Screens / Navigation / Tests}

**Description**:
{Description}

**Impact**:
{Impact}

**Evidence**:
```typescript
{code}
```

**Recommended Fix**:
{Fix description or code}

**Effort**: {Low / Medium / High}

---

### :bulb: Minor (Can Defer)

#### Finding 4: {Title}

**Location**: `{file-path}:{line-number}`
**Type**: {Gap / Violation / Inconsistency}

**Description**:
{Description}

**Recommendation**:
{Suggestion for improvement}

---

## Action Items

### Must Do (Before Merge)

**Total Effort**: {X hours}

| # | Task | File(s) | Effort | Owner |
|---|------|---------|--------|-------|
| 1 | {Task description} | `{file-path}` | {X min} | {Author} |
| 2 | {Task description} | `{file-path}` | {X min} | {Author} |

### Should Do (Before Merge)

**Total Effort**: {Y hours}

| # | Task | File(s) | Effort | Owner |
|---|------|---------|--------|-------|
| 1 | {Task description} | `{file-path}` | {X min} | {Author} |
| 2 | {Task description} | `{file-path}` | {X min} | {Author} |

### Can Defer (Post-Merge)

**Total Effort**: {Z hours}

| # | Task | File(s) | Effort | Notes |
|---|------|---------|--------|-------|
| 1 | {Task description} | `{file-path}` | {X min} | {Notes} |
| 2 | {Task description} | `{file-path}` | {X min} | {Notes} |

---

## Files Reviewed

### Summary

| Metric | Value |
|--------|-------|
| Files Changed | {X} |
| Lines Added | +{Y} |
| Lines Removed | -{Z} |
| Commits | {W} |

### Files by Layer

#### Types
- `src/types/{file}.ts` - {summary of changes}

#### Redux
- `src/store/slices/{file}.ts` - {summary of changes}

#### Components
- `src/components-next/{file}.tsx` - {summary of changes}

#### Screens
- `src/screens/{file}.tsx` - {summary of changes}

#### Navigation
- `src/navigation/{file}.tsx` - {summary of changes}

#### Tests
- `__tests__/{file}.test.ts` - {summary of changes}

---

## Verification Results

| Check | Status | Notes |
|-------|--------|-------|
| TypeScript Compilation | :white_check_mark: / :x: | `npx tsc --noEmit` |
| Lint | :white_check_mark: / :x: | `pnpm lint` |
| Unit Tests | :white_check_mark: / :x: | `pnpm test` |
| iOS Build | :white_check_mark: / :x: | |
| Android Build | :white_check_mark: / :x: | |

---

## Platform Testing Notes

### iOS
- {Observation 1}
- {Observation 2}

### Android
- {Observation 1}
- {Observation 2}

---

## Comments for Author

{Any additional feedback, suggestions, or positive observations}

---

## Re-Review Required

- [ ] All critical findings addressed
- [ ] All major findings addressed
- [ ] Tests pass
- [ ] Builds succeed

**Re-review requested by**: {Date}

---

## Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| Reviewer | {Name} | {Date} | Complete |
| Author (Fixes Applied) | {Name} | - | Pending |
| Final Approval | {Name} | - | Pending |

---

## Appendix

### Commit Analysis Summary

```
{git log --oneline output}
```

### Additional Notes

{Any additional context or notes}

---

**End of Review Report**
