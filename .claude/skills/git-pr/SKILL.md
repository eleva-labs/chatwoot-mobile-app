---
name: git-pr
description: >-
  Create pull requests following project conventions.
  Use when creating feature PRs, bug fix PRs, hotfix PRs, or release PRs.
  Invoked by: "create PR", "pull request", "open PR", "submit PR".
---

# Pull Request Creation SOP

**Version**: 1.0.0
**Last Updated**: 2026-01-11
**Status**: Active

---

## Overview

### Purpose
This SOP guides developers through creating pull requests that follow project conventions. It covers all PR types (feature, bug fix, hotfix, release) with proper documentation, branch flows, and templates.

### When to Use
**ALWAYS**: Creating any PR for the project
**SKIP**: Draft PRs, WIP PRs (use GitHub UI directly)

---

## Process Workflow

### Flow Diagram
```
[Identify Type] --> [Analyze Changes] --> [Create Summary] --> [Submit PR]
```

### Phase Summary
| Phase | Objective | Deliverable |
|-------|-----------|-------------|
| 1. Identify Type | Determine PR category | PR type selected |
| 2. Analyze Changes | Review commits and diffs | Change summary |
| 3. Create Summary | Draft title and description | PR documentation |
| 4. Submit PR | Execute `gh pr create` | Active GitHub PR |

---

## Quick Start

1. **Ensure branch is ready**: All changes committed, tests passing
2. **Determine PR type**: Feature, Bug Fix, Hotfix, or Release
3. **Create PR**: Use the appropriate template below
4. **Fill template**: Complete all sections
5. **Request review**: Assign reviewers

See [Process Workflow](#process-workflow) for detailed steps.

---

## PR Types & Decision Tree

### Decision Tree

```
What are you merging?
  |-- Production release? (development -> main) -> [RELEASE PR]
  |-- Critical production fix? (urgent) -> [HOTFIX PR] (hotfix -> main)
  |-- Bug fix? (non-urgent) -> [BUG FIX PR] (bugfix -> development)
  |-- New functionality? -> [FEATURE PR] (feature -> development)
```

### Quick Reference

| PR Type | From -> To | Urgency | Title Format | Duration |
|---------|------------|---------|--------------|----------|
| **Feature** | feature -> development | Normal | `feat: <description>` | 5-10 min |
| **Bug Fix** | bugfix -> development | Normal | `fix: <description>` | 3-7 min |
| **Hotfix** | hotfix -> main | **URGENT** | `hotfix: <description>` | 3-7 min |
| **Release** | development -> main | Scheduled | `Release: <version>` | 15-30 min |

### Branch Naming Convention

- `development` - Eleva Labs development branch (target for feature/bugfix PRs)
- `develop` - Chatwoot upstream branch (do NOT use for our PRs)
- `main` - Production branch (target for hotfix/release PRs)

---

## Phase 1: Analyze Changes

### Step 1.1: Review Commit History

```bash
# Generic format
git log BASE..HEAD --oneline --no-merges

# Examples by PR type:
git log development..feature/my-feature --oneline --no-merges  # Feature PR
git log development..bugfix/my-fix --oneline --no-merges       # Bug Fix PR
git log main..hotfix/critical-fix --oneline --no-merges        # Hotfix PR
git log main..development --oneline --no-merges                # Release PR

# Get detailed commit messages
git log BASE..HEAD --pretty=format:"%s" --no-merges

# Count commits
git rev-list --count BASE..HEAD
```

### Step 1.2: Analyze Code Differences

```bash
# View diff statistics
git diff BASE...HEAD --stat
git diff BASE...HEAD --shortstat
git diff BASE...HEAD --name-only

# Area-specific diffs
git diff BASE...HEAD --stat -- src/components-next/
git diff BASE...HEAD --stat -- src/screens/
git diff BASE...HEAD --stat -- src/store/
```

### Step 1.3: Categorize Changes

Group changes by type:
- **Features**: New functionality
- **Fixes**: Bug corrections
- **Refactors**: Code improvements
- **Infrastructure**: Dependencies, config
- **Tests**: Test coverage
- **Documentation**: Docs updates

---

## Phase 2: Create PR Summary

### Step 2.1: Draft PR Title

**Feature PR**:
```
feat: Add AI assistant chat interface
Feature: Dark mode support
```

**Bug Fix PR**:
```
fix: Resolve navigation crash on Android
```

**Hotfix PR**:
```
hotfix: Prevent app crash on iOS 17
```

**Release PR**:
```
Release: v4.1.0 - AI Assistant & Dark Mode
```

### Step 2.2: Draft PR Description

Use the appropriate template below.

---

## PR Templates

### Feature PR Template

```markdown
## Summary
[Brief overview of feature]

## Changes
- Change 1
- Change 2

## Affected Areas
- [ ] Components
- [ ] Screens
- [ ] Redux State
- [ ] Navigation
- [ ] Utils/Types

## Testing
- iOS: [steps]
- Android: [steps]

## Related
- Issue: #XXX
- Ticket: CU-XXX

Generated with [Claude Code](https://claude.com/claude-code)
```

### Bug Fix / Hotfix PR Template

```markdown
## Issue
[What was broken]

## Fix
[What was fixed]

## Root Cause
[If known and relevant]

## Affected Areas
- [ ] Components
- [ ] Screens
- [ ] Redux State
- [ ] Navigation
- [ ] Utils/Types

## Verification
- iOS: [steps]
- Android: [steps]

## Related
- Incident: #XXX
- Issue: #XXX

Generated with [Claude Code](https://claude.com/claude-code)
```

### Release PR Template

```markdown
## Release: v{version}

### Overview
[High-level summary of release]

### Features
- Feature 1 - [Brief description]
- Feature 2 - [Brief description]

### Fixes
- Fix 1 - [Brief description]
- Fix 2 - [Brief description]

### Improvements
- Improvement 1
- Improvement 2

### Affected Areas
- [ ] Components
- [ ] Screens
- [ ] Redux State
- [ ] Navigation
- [ ] Utils/Types

### Testing Summary
- iOS: [summary]
- Android: [summary]

### Deployment Notes
[Any special deployment considerations]

### Breaking Changes
[If any, list here]

Generated with [Claude Code](https://claude.com/claude-code)
```

---

## Phase 3: Create Pull Request

### Step 3.1: Verify Prerequisites

Before creating PR:

```bash
# Run tests
pnpm test

# Type check
npx tsc --noEmit

# Lint
pnpm run lint
```

### Step 3.2: Push Branch (if needed)

```bash
git push origin <branch-name>
```

### Step 3.3: Execute PR Creation

**Feature PR Example**:
```bash
gh pr create \
  --base development \
  --head feature/ai-assistant \
  --title "feat: Add AI assistant chat interface" \
  --body "$(cat <<'EOF'
## Summary
Implemented AI assistant chat interface with streaming support.

## Changes
- Added AIChatInterface component
- Created aiChat Redux slice
- Added AI assistant screen

## Affected Areas
- [x] Components
- [x] Screens
- [x] Redux State

## Testing
- iOS: Open app -> Navigate to AI assistant -> Send message
- Android: Same as iOS

## Related
- Ticket: CU-12345

Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Bug Fix PR Example**:
```bash
gh pr create \
  --base development \
  --head bugfix/navigation-crash \
  --title "fix: Resolve navigation crash on Android" \
  --body "$(cat <<'EOF'
## Issue
App crashes when navigating to conversation screen on Android.

## Fix
Updated navigation params type definition.

## Root Cause
Type mismatch between navigation params and screen props.

## Verification
- Android: Navigate to conversation -> Should not crash

## Related
- Issue: #456

Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Release PR Example**:
```bash
gh pr create \
  --base main \
  --head development \
  --title "Release: v4.1.0 - AI Assistant & Dark Mode" \
  --body "$(cat <<'EOF'
## Release: v4.1.0

### Overview
Major release adding AI assistant and dark mode.

### Features
- AI assistant chat interface
- Dark mode support

### Fixes
- Navigation crash on Android
- Redux state persistence

### Testing Summary
- All unit tests passing
- Manual testing completed

### Deployment Notes
- EAS build required for both platforms

Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Quick Reference

### Git Commands

```bash
# Review commits
git log BASE..HEAD --oneline --no-merges

# Review diffs
git diff BASE...HEAD --stat

# Push branch
git push origin <branch-name>
```

### GitHub CLI Commands

```bash
# Install (macOS)
brew install gh

# Authenticate
gh auth login

# Create PR
gh pr create --base <target> --head <source> --title "<title>" --body "<body>"

# List PRs
gh pr list

# View PR
gh pr view <number>
```

### Common Branch Flows

| From | To | PR Type |
|------|----|---------|
| feature/* | development | Feature |
| bugfix/* | development | Bug Fix |
| hotfix/* | main | Hotfix |
| development | main | Release |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `gh` not found | Install: `brew install gh` |
| Auth required | Run `gh auth login` |
| Branch not found | Push first: `git push origin <branch>` |
| Invalid base branch | Verify target exists: `git branch -r` |
| Tests failing | Run `pnpm test`, fix failures |
| TypeScript errors | Run `npx tsc --noEmit`, fix errors |
| Linting errors | Run `pnpm run lint`, fix violations |
| Description too long | Use `--body-file` instead of inline |

---

## Success Checklist

### All PR Types
- [ ] PR type identified correctly
- [ ] Commit history reviewed
- [ ] Code diffs analyzed
- [ ] Affected areas identified
- [ ] PR title follows format
- [ ] PR description uses template
- [ ] Tests passing
- [ ] TypeScript passes
- [ ] Linting passes
- [ ] PR created successfully

### Additional for Release PRs
- [ ] Version number verified
- [ ] All changes categorized
- [ ] Breaking changes noted
- [ ] Deployment notes included

---

## Related SOPs
- [dev-feature](../dev-feature/SKILL.md) - Feature development workflow
- [review-code](../review-code/SKILL.md) - Code review process
- [test-mobile](../test-mobile/SKILL.md) - Testing workflow

---

**End of SOP**
