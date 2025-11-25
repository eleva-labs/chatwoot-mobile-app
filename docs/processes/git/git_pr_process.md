# Pull Request Creation Process

**Version**: 1.0.0
**Last Updated**: 2025-01-27
**Status**: Active
**Document Type**: Process Guide
**Project**: Chatwoot Mobile App (React Native + Expo)

---

## Overview

Process for creating pull requests across all workflow stages: feature development to production releases.

**Scope**:
- ✅ Feature PRs (feature → develop), Bug Fix/Hotfix PRs (bugfix → develop or hotfix → main), Release PRs (develop → main)
- ❌ Draft PRs, WIP PRs, code review process, merge strategies, deployment procedures

**Repository Context**: React Native mobile app with Expo, Redux Toolkit state management, TypeScript

---

## PR Types & Decision Tree

### 1. Feature PRs 🚀

**Branch Flow**: `feature/<name>` → `develop`

**Purpose**: Introduce new functionality or significant enhancements

**Naming**: `feat: <Brief description>` or `Feature: <Name>`

**Examples**: `feat: Add AI assistant chat interface`, `Feature: Dark mode support`

**Documentation Level**: Medium - what/why/which components/how to test/related tickets

**Duration**: 5-10 min

---

### 2. Bug Fix/Hotfix PRs 🐛🔥

**Branch Flow**:
- Bug fixes: `bugfix/<name>` → `develop`
- Hotfixes: `hotfix/<name>` → `main` (urgent production fixes)

**Naming**: `fix: <What was fixed>` or `hotfix: <Critical issue>`

**Examples**: `fix: Resolve navigation crash on Android`, `hotfix: Prevent app crash on iOS 17`

**Documentation Level**: Focused - what was broken/fixed/root cause/how to verify/related incident

**Duration**: 3-7 min

---

### 3. Release PRs 🎉

**Branch Flow**: `develop` → `main`

**Purpose**: Promote accumulated changes to production

**Naming**: `Release: <Version> - <Key highlights>`

**Examples**: `Release: v4.1.0 - AI Assistant & Dark Mode`

**Documentation Level**: Comprehensive & high-level - categorized changes, business value focus, NO file-level details (unless critical), version number, deployment notes

**Duration**: 15-30 min

---

### Decision Tree

```
What are you merging?
  ├─ Production release? (develop → main) → [RELEASE PR]
  ├─ Critical production fix? (urgent) → [HOTFIX PR] (hotfix → main)
  ├─ Bug fix? (non-urgent) → [BUG FIX PR] (bugfix → develop)
  └─ New functionality? → [FEATURE PR] (feature → develop)
```

### Quick Reference

| PR Type | From → To | Urgency | Scope | Doc Level | Duration |
|---------|-----------|---------|-------|-----------|----------|
| **Feature** | feature → develop | Normal | Single feature | Medium | 5-10 min |
| **Bug Fix** | bugfix → develop | Normal | Single issue | Focused | 3-7 min |
| **Hotfix** | hotfix → main | **URGENT** | Critical issue | Focused | 3-7 min |
| **Release** | develop → main | Scheduled | Multiple changes | Comprehensive | 15-30 min |

---

## Key Principles

**Universal** (All PR Types):
1. **Right-Sized Documentation** - Match depth to PR type
2. **Clear Communication** - Write for your audience
3. **Contextual Detail** - File-level details only when clarifying critical context
4. **Traceable History** - Reference commits/tickets/incidents
5. **Platform Awareness** - Note iOS/Android considerations

**For Release PRs**: Categorized organization, high-level business value, NO file-level details unless critical, stakeholder-friendly language, version information

**For Feature PRs**: Clear scope, technical details welcome, business context, testing instructions, indicate modified areas (components, screens, Redux, etc.)

**For Bug Fix/Hotfix PRs**: Root cause identification, clear before/after behavior, verification steps, incident references, impact assessment, platform-specific notes

### Success Criteria
- [ ] PR type correctly identified
- [ ] Changes analyzed and understood
- [ ] Documentation matches PR type requirements
- [ ] PR created with appropriate title format
- [ ] Base and head branches correct
- [ ] Affected areas identified (components, screens, Redux, etc.)
- [ ] Tests passing (`pnpm test`)
- [ ] TypeScript compilation successful (`npx tsc --noEmit`)

---

## Process Workflow

**Phases**:
1. **Identify Type** (1 min) - Use decision tree
2. **Analyze Changes** (3-15 min) - Common to all types
3. **Create PR Summary** (2-10 min) - Common to all types
4. **Create Pull Request** (2-5 min) - Type-specific

### Prerequisites (All Types)

- [ ] On correct source branch
- [ ] All changes committed
- [ ] Branch up-to-date with remote
- [ ] GitHub CLI (`gh`) installed and authenticated
- [ ] Target branch exists
- [ ] Tests passing (`pnpm test`)
- [ ] TypeScript compilation successful (`npx tsc --noEmit`)
- [ ] Linting passing (`pnpm run lint`)

---

## Phase 1: Analyze Changes

**Objective**: Understand complete scope between source and target branches

**Duration**: 3-15 min (Feature: 3-5 min, Bug Fix: 2-3 min, Release: 10-15 min)

### Step 1.1: Review Commit History

```bash
# Generic format
git log BASE..HEAD --oneline --no-merges

# Examples by PR type:
git log main..develop --oneline --no-merges  # Release PR
git log develop..feature/my-feature --oneline --no-merges  # Feature PR
git log main..hotfix/critical-fix --oneline --no-merges  # Hotfix PR

# Get detailed commit messages
git log BASE..HEAD --pretty=format:"%s" --no-merges

# Count commits
git rev-list --count BASE..HEAD

# See which areas affected
git log BASE..HEAD --oneline --no-merges -- src/components-next/
git log BASE..HEAD --oneline --no-merges -- src/screens/
git log BASE..HEAD --oneline --no-merges -- src/store/
```

**Actions**: Get commit list, review messages, identify patterns, note which areas affected

### Step 1.2: Analyze Code Differences

```bash
# Generic format
git diff BASE...HEAD --stat
git diff BASE...HEAD --shortstat
git diff BASE...HEAD --name-only

# Area-specific diffs
git diff BASE...HEAD --stat -- src/components-next/
git diff BASE...HEAD --stat -- src/screens/
git diff BASE...HEAD --stat -- src/store/
git diff BASE...HEAD --stat -- src/navigation/

# Check version file changes
git diff BASE...HEAD -- package.json
git diff BASE...HEAD -- app.config.ts
```

**Actions**: Review diff statistics, identify which areas modified most, look for patterns, identify affected areas

### Step 1.3: Categorize Changes

**For All PR Types**:
- Features (new functionality)
- Fixes (bug corrections)
- Refactors (code improvements)
- Infrastructure (dependencies, config)
- Tests (test coverage)
- Documentation (docs updates)

**Actions**: Group changes by category, identify area impacts (Components, Screens, Redux, Navigation, Utils, Types)

### Deliverable

Summary of:
- Number of commits
- Files changed statistics
- Areas affected
- Categorized change list
- Key highlights

---

## Phase 2: Create PR Summary

**Objective**: Document changes appropriately for PR type

**Duration**: 2-10 min (Feature: 2-5 min, Bug Fix: 2-3 min, Release: 5-10 min)

### Step 2.1: Draft PR Title

**Format by Type**:

**Feature PR**:
```
feat: <Brief description>
Feature: <Name of feature>
```

**Bug Fix/Hotfix PR**:
```
fix: <What was fixed>
hotfix: <Critical issue description>
```

**Release PR**:
```
Release: <Version> - <Key highlights>
```

**Guidelines**:
- Keep concise (< 72 characters)
- Use conventional commit prefixes
- Focus on "what" not "how"
- For releases: include version and 1-2 key highlights

### Step 2.2: Draft PR Description

**Feature PR Template**:
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
[How to test the feature]
- iOS: [steps]
- Android: [steps]

## Related
- Issue: #XXX
- Ticket: CU-XXX

Generated with [Claude Code](https://claude.com/claude-code)
```

**Bug Fix/Hotfix PR Template**:
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
[How to verify the fix]
- iOS: [steps]
- Android: [steps]

## Related
- Incident: #XXX
- Issue: #XXX

Generated with [Claude Code](https://claude.com/claude-code)
```

**Release PR Template**:
```markdown
## Release: v{version}

### Overview
[High-level summary of release]

### Features ✨
- Feature 1 - [Brief description]
- Feature 2 - [Brief description]

### Fixes 🐛
- Fix 1 - [Brief description]
- Fix 2 - [Brief description]

### Improvements 🔧
- Improvement 1
- Improvement 2

### Affected Areas
- [ ] Components
- [ ] Screens
- [ ] Redux State
- [ ] Navigation
- [ ] Utils/Types

### Testing Summary
[Summary of testing performed]
- iOS: [summary]
- Android: [summary]

### Deployment Notes
[Any special deployment considerations]

### Breaking Changes
[If any, list here]

Generated with [Claude Code](https://claude.com/claude-code)
```

### Deliverable

Complete PR title and description draft matching PR type requirements

---

## Phase 3: Create Pull Request (Type-Specific)

**Objective**: Format and submit PR via GitHub CLI

**Duration**: 2-5 min

### Step 3.1: Prepare PR Command

**Generic Format**:
```bash
gh pr create \
  --base <target-branch> \
  --head <source-branch> \
  --title "<PR title>" \
  --body "$(cat <<'EOF'
<PR description>
EOF
)"
```

**Feature PR Example**:
```bash
gh pr create \
  --base develop \
  --head feature/ai-assistant \
  --title "feat: Add AI assistant chat interface" \
  --body "$(cat <<'EOF'
## Summary
Implemented AI assistant chat interface with streaming support.

## Changes
- Added AIChatInterface component
- Created aiChat Redux slice
- Added AI assistant screen
- Integrated with backend API

## Affected Areas
- [x] Components
- [x] Screens
- [x] Redux State
- [ ] Navigation
- [ ] Utils/Types

## Testing
- iOS: Open app → Navigate to AI assistant → Send message → Verify streaming
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
  --base develop \
  --head bugfix/navigation-crash \
  --title "fix: Resolve navigation crash on Android" \
  --body "$(cat <<'EOF'
## Issue
App crashes when navigating to conversation screen on Android devices.

## Fix
Updated navigation params type definition to handle optional parameters correctly.

## Root Cause
Type mismatch between navigation params and screen props on Android.

## Affected Areas
- [x] Navigation
- [ ] Components
- [ ] Screens
- [ ] Redux State

## Verification
- iOS: Navigate to conversation → Should work
- Android: Navigate to conversation → Should not crash

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
  --head develop \
  --title "Release: v4.1.0 - AI Assistant & Dark Mode" \
  --body "$(cat <<'EOF'
## Release: v4.1.0

### Overview
Major release adding AI assistant capabilities and dark mode support.

### Features ✨
- AI assistant chat interface - Full chat interface with streaming support
- Dark mode support - Complete dark theme implementation
- Enhanced navigation - Improved navigation flow and deep linking

### Fixes 🐛
- Navigation crash on Android - Resolved type mismatch issue
- Redux state persistence - Fixed state migration bug

### Improvements 🔧
- Performance optimizations for message list
- Enhanced error handling
- Updated dependencies

### Affected Areas
- [x] Components
- [x] Screens
- [x] Redux State
- [x] Navigation
- [x] Utils/Types

### Testing Summary
- All unit tests passing (85% coverage)
- Manual testing completed on iOS and Android
- Integration tests validated

### Deployment Notes
- EAS build required for both iOS and Android
- No database migrations needed
- Environment variables: No changes

### Breaking Changes
None

Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### Step 3.2: Execute PR Creation

**Actions**:
1. Run the `gh pr create` command
2. Verify PR created successfully
3. Note PR URL from command output

**Troubleshooting**:
- **gh not installed**: Install via `brew install gh` (macOS) or see https://cli.github.com/
- **Not authenticated**: Run `gh auth login`
- **Branch not pushed**: Run `git push origin <branch-name>`
- **Invalid base branch**: Verify target branch exists

### Step 3.3: Verify and Share

**Actions**:
1. Open PR URL in browser
2. Verify title, description, base/head branches correct
3. Share PR URL with team if needed

**Example Output**:
```
https://github.com/org/repo/pull/123
```

### Deliverable

Active GitHub PR with proper documentation

---

## Best Practices

**General**:
- Always run tests before creating PR (`pnpm test`, `npx tsc --noEmit`, `pnpm run lint`)
- Keep PRs focused (single feature/fix per PR)
- Write clear commit messages
- Update documentation if API/behavior changes
- Reference related tickets/issues
- Test on both iOS and Android

**For Release PRs**:
- Review all commits since last release
- Categorize changes by type
- Use high-level, stakeholder-friendly language
- Highlight breaking changes
- Include version number from package.json/app.config.ts
- Verify deployment notes are complete

**For Feature PRs**:
- Include testing instructions for both platforms
- Document any new configuration needed
- Explain technical decisions if non-obvious
- Link to design docs if applicable

**For Bug Fix/Hotfix PRs**:
- Clearly describe the problem
- Explain root cause if known
- Provide verification steps for both platforms
- For hotfixes: coordinate with team before merging to main

---

## Process Checklist

### All PR Types
- [ ] Identified PR type using decision tree
- [ ] Reviewed commit history
- [ ] Analyzed code diffs
- [ ] Identified affected areas
- [ ] Categorized changes
- [ ] Drafted PR title (correct format)
- [ ] Drafted PR description (matches type requirements)
- [ ] Tests passing (`pnpm test`)
- [ ] TypeScript compilation successful (`npx tsc --noEmit`)
- [ ] Linting passing (`pnpm run lint`)
- [ ] Created PR via `gh pr create`
- [ ] Verified PR created successfully

### Additional for Release PRs
- [ ] Checked version numbers in package.json and app.config.ts
- [ ] Categorized ALL changes (Features, Fixes, Improvements, etc.)
- [ ] Used high-level, business-value language
- [ ] Noted breaking changes (if any)
- [ ] Included deployment notes
- [ ] Testing summary added

---

## Quick Reference

### Git Commands

```bash
# Review commits
git log BASE..HEAD --oneline --no-merges

# Review diffs
git diff BASE...HEAD --stat

# Area-specific analysis
git log BASE..HEAD --oneline -- src/components-next/
git diff BASE...HEAD --stat -- src/screens/
```

### GitHub CLI Commands

```bash
# Install
brew install gh  # macOS

# Authenticate
gh auth login

# Create PR
gh pr create --base <target> --head <source> --title "<title>" --body "<body>"

# Create PR from file
gh pr create --base develop --head feature/my-feature --title "feat: My feature" --body-file pr_description.md

# List PRs
gh pr list

# View PR
gh pr view <number>
```

### Common Branch Flows

| From | To | PR Type | Command Example |
|------|----|---------|-----------------|
| feature/* | develop | Feature | `gh pr create --base develop --head feature/my-feat` |
| bugfix/* | develop | Bug Fix | `gh pr create --base develop --head bugfix/fix-issue` |
| hotfix/* | main | Hotfix | `gh pr create --base main --head hotfix/critical` |
| develop | main | Release | `gh pr create --base main --head develop` |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **gh not found** | Install: `brew install gh` (macOS) or see https://cli.github.com/ |
| **gh auth required** | Run `gh auth login` and follow prompts |
| **Branch not found** | Push branch first: `git push origin <branch-name>` |
| **Invalid base branch** | Verify target branch exists: `git branch -r` |
| **Tests failing** | Run `pnpm test`, fix failures before PR |
| **TypeScript errors** | Run `npx tsc --noEmit`, fix errors |
| **Linting errors** | Run `pnpm run lint`, fix violations |
| **PR description too long** | Use `--body-file` instead of inline body |
| **Wrong PR type** | Review decision tree, update title/description format |

---

## Related Documentation

- [Project Rules](/.cursor/rules/about.mdc) - Project guidelines and commands
- [Development Process](/docs/processes/development/development_process.md) - Full development workflow
- [Code Review Process](/docs/processes/code_review/code_review_process.md) - Code review workflow

---

## Changelog

### Version 1.0.0 (2025-01-27)
**Status**: Active
**Changes**: Initial version for React Native/Expo mobile app PR creation

---

**End of Document**

