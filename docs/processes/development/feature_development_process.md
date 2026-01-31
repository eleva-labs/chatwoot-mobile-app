# Feature Development Process Guide

**Version**: 1.2.0
**Last Updated**: 2026-01-11
**Status**: Active
**Document Type**: Process Guide
**Project**: Chatwoot Mobile App (React Native + Expo)

---

## Overview

### Purpose

This process enables complex, multi-session feature development with persistent documentation. It ensures continuity across sessions, tracks progress systematically, and allows any developer (or AI agent) to pick up work exactly where the previous session left off.

### Scope

**Covered**: Feature development, refactoring projects, architecture migrations, multi-phase implementations
**NOT Covered**: Single-file bug fixes, documentation-only changes, simple one-off tasks

### When to Use

**ALWAYS**: Multi-day features, architecture changes, projects requiring research + design + implementation phases, work that spans multiple sessions
**SKIP**: Tasks completable in a single session, simple bug fixes, minor updates

### Summary

This process creates a dedicated documentation folder for each major feature or project under `/docs/ignored/`. The folder contains an INDEX file (central navigation), SESSION_HANDOFF file (session context), design documents, execution plans, and research notes. Sub-agents are spawned for specific tasks (research, design, coding, testing) and report their work back, updating the documentation as they complete tasks.

The process ensures that:

1. Any session can start by reading INDEX.md and SESSION_HANDOFF.md
2. Progress is tracked via checkboxes and status updates in execution documents
3. Dependencies between tasks are clearly documented
4. All decisions and observations are recorded for future reference

---

## Key Principles

1. **Index as Single Source of Truth** - The INDEX.md file is the authoritative reference for project status, dependencies, and navigation
2. **Session Handoff Continuity** - Every session ends with an updated SESSION_HANDOFF.md so the next session can resume immediately
3. **Atomic Execution Documents** - Each execution task is self-contained with clear inputs, outputs, and success criteria
4. **Agent Specialization** - Sub-agents handle focused tasks (explore, design, code, test) with full context provided upfront
5. **Documentation-Driven Progress** - Work isn't "done" until the execution document reflects completion

### Success Criteria

- [ ] Any agent can resume work by reading INDEX.md + SESSION_HANDOFF.md
- [ ] All completed tasks have checked boxes in execution documents
- [ ] Dependencies are tracked and respected
- [ ] Observations and decisions are recorded with timestamps

---

## Process Workflow

### Flow Diagram

```
[New Feature Request]
        ↓
[Create Feature Folder] → /docs/ignored/{feature-name}/
        ↓
[Research Phase] → research/*.md
        ↓
[Design Phase] → design/DESIGN_##_*.md
        ↓
[Create Execution Plans] → development/EXECUTION_##_*.md
        ↓
[Create INDEX.md] ← Central navigation + dependencies
        ↓
[Execute Tasks via Sub-Agents]
        ↓
[Validation & Review] ← TypeScript, Review Agent, Tests
        ↓
[Update Documentation] → EXECUTION_##.md, INDEX.md
        ↓
[Session End] → Update SESSION_HANDOFF.md
        ↓
[Next Session] → Read INDEX.md + SESSION_HANDOFF.md → Continue
```

### Phase Summary

| Phase         | Objective                                | Deliverable                         | Typical Duration |
| ------------- | ---------------------------------------- | ----------------------------------- | ---------------- |
| 1. Setup      | Create folder structure and initial docs | Feature folder with INDEX.md        | 15-30 min        |
| 2. Research   | Understand current state, identify gaps  | Gap analysis, research notes        | 1-4 hours        |
| 3. Design     | Create solutions for identified problems | Design documents per component      | 2-6 hours        |
| 4. Planning   | Break designs into executable tasks      | Execution documents with checkboxes | 1-2 hours        |
| 5. Execution  | Implement via sub-agents                 | Working code (pending validation)   | Variable         |
| 6. Validation | Verify correctness, patterns, quality    | Validated code, updated docs        | 15-30 min        |
| 7. Handoff    | Document session state for continuity    | Updated SESSION_HANDOFF.md          | 10-15 min        |

### Prerequisites

- Clear feature requirements or problem statement
- Access to the codebase for research
- Understanding of project architecture

---

## Phase 1: Setup Feature Folder

**Objective**: Create the documentation structure for tracking the feature
**Duration**: 15-30 minutes

### Step 1.1: Create Folder Structure

Create the following structure under `/docs/ignored/`:

```
/docs/ignored/{feature-name}/
├── INDEX.md                    # Central navigation + status
├── SESSION_HANDOFF.md          # Session continuity
├── research/                   # Research and analysis
│   └── *.md
├── design/                     # Design documents
│   └── DESIGN_##_*.md
└── development/                # Execution plans
    └── EXECUTION_##_*.md
```

**Naming Convention**:

- Feature folder: `snake_case` descriptive name (e.g., `ai_assistant_clean_architecture`)
- Design docs: `DESIGN_##_COMPONENT_NAME.md` (e.g., `DESIGN_01_DI_BOOTSTRAP.md`)
- Execution docs: `EXECUTION_##_TASK_NAME.md` (e.g., `EXECUTION_01_DI_BOOTSTRAP.md`)

### Step 1.2: Create INDEX.md

The INDEX.md file should contain:

```markdown
# {Feature Name} - Execution Index

**Created**: {Date}
**Branch**: `{branch-name}`
**Purpose**: {Brief description}

---

## Current Status Summary

**Last Updated**: {Date}

| Metric     | Before  | Current | Target  |
| ---------- | ------- | ------- | ------- |
| {Metric 1} | {value} | {value} | {value} |

---

## Execution Order (Dependencies Matter)

### Phase 1: {Phase Name}

| Order | Execution                                     | Design                             | Status      | Effort | Description   |
| ----- | --------------------------------------------- | ---------------------------------- | ----------- | ------ | ------------- |
| 1     | [EXECUTION_01](development/EXECUTION_01_*.md) | [DESIGN_01](design/DESIGN_01_*.md) | Not Started | X hrs  | {Description} |

### Phase 2: {Phase Name}

| Order | Execution           | Design           | Status      | Effort | Dependencies          |
| ----- | ------------------- | ---------------- | ----------- | ------ | --------------------- |
| 2     | [EXECUTION_02](...) | [DESIGN_02](...) | Not Started | X hrs  | Requires EXECUTION_01 |

---

## Dependency Graph
```

EXECUTION_01 ──────────────────┐
│ │
└──────────────────────▶ EXECUTION_02

````

---

## Quick Start for New Session

1. Read this INDEX.md for overall status
2. Read SESSION_HANDOFF.md for last session context
3. Pick next task based on dependencies
4. Read the DESIGN doc, then EXECUTION doc
5. Execute via sub-agent with full context
6. Update execution doc with progress
7. Update SESSION_HANDOFF.md before ending

---

## Validation Commands

```bash
# TypeScript check
npx tsc --noEmit

# Format and lint
task quality:format-all

# Run tests
task quality:test
````

````

### Step 1.3: Create SESSION_HANDOFF.md

```markdown
# {Feature Name} - Session Handoff

**Created**: {Date}
**Last Updated**: {Date}
**Branch**: `{branch-name}`
**Status**: In Progress - {Current Phase}

---

## Quick Start for Next Session

**Read the INDEX first**: [`INDEX.md`](INDEX.md)

**Recommended next task**: {Task name and why}

---

## Session Progress ({Date})

### Completed This Session

| Task | Status | Details |
|------|--------|---------|
| {Task} | Complete | {Details} |

### Commits Created
````

{commit-hash} {commit-message}

```

---

## Next Steps

### Option A: {Task Name} (Recommended)
**Why**: {Rationale}
1. Read design: `design/DESIGN_##_*.md`
2. Read execution: `development/EXECUTION_##_*.md`
3. Follow checkbox tasks

---

## Context Summary

{2-3 paragraphs explaining the project context, key decisions, and current state}
```

### Deliverable

**Output**: Feature folder with INDEX.md and SESSION_HANDOFF.md templates

**Quality Check**:

- [ ] Folder structure created
- [ ] INDEX.md has execution order table
- [ ] SESSION_HANDOFF.md has quick start section

---

## Phase 2: Research

**Objective**: Understand current state, identify gaps and requirements
**Duration**: 1-4 hours

### Step 2.1: Spawn Research Agent

Use the Task tool with `subagent_type: "Explore"` for codebase exploration:

```
Prompt structure:
- Clear research question
- Specific files/patterns to investigate
- Expected output format
- Request to create research document
```

**Example**:

```
Research the current state of dependency injection in the codebase.
Investigate:
- How DI container is initialized
- What tokens are registered
- How dependencies are resolved in hooks
- Any gaps or issues

Create a research document at:
docs/ignored/{feature}/research/GAP_ANALYSIS.md
```

### Step 2.2: Document Findings

Research documents should include:

- Current state analysis
- Gap identification
- Recommendations
- Supporting evidence (file paths, code snippets)

### Deliverable

**Output**: Research documents in `/research/` folder

**Quality Check**:

- [ ] Current state documented with file references
- [ ] Gaps clearly identified
- [ ] Recommendations actionable

---

## Phase 3: Design

**Objective**: Create detailed solutions for identified problems
**Duration**: 2-6 hours

### Step 3.1: Create Design Documents

For each major component or task, create a design document:

```markdown
# Design ##: {Component Name}

**Status**: Draft | Approved
**Priority**: High | Medium | Low
**Estimated Effort**: X hours

---

## Problem Statement

{What problem this solves}

## Proposed Solution

{Architecture, approach, key decisions}

## Implementation Details

{Code examples, file changes}

## Files to Create/Modify

| Action | File            | Purpose   |
| ------ | --------------- | --------- |
| CREATE | path/to/file.ts | {Purpose} |
| MODIFY | path/to/file.ts | {Changes} |

## Testing/Validation

{How to verify the solution works}

## Risks and Mitigations

| Risk   | Mitigation   |
| ------ | ------------ |
| {Risk} | {Mitigation} |

## Success Criteria

- [ ] Criterion 1
- [ ] Criterion 2
```

### Step 3.2: Identify Dependencies

Map dependencies between designs:

- Which designs must complete before others?
- What shared components exist?
- What's the optimal execution order?

### Deliverable

**Output**: Design documents in `/design/` folder, dependency graph in INDEX.md

**Quality Check**:

- [ ] Each design has clear problem/solution
- [ ] File changes documented
- [ ] Dependencies identified

---

## Phase 4: Create Execution Plans

**Objective**: Break designs into step-by-step executable tasks
**Duration**: 1-2 hours

### Step 4.1: Create Execution Documents

For each design, create a corresponding execution document:

```markdown
# Execution ##: {Task Name}

**Status**: Not Started | In Progress | Completed
**Design Document**: [DESIGN\_##](../design/DESIGN_##_*.md)

---

## Progress Overview
```

Phase 1: {Name} ░░░░░░░░░░ 0%
Phase 2: {Name} ░░░░░░░░░░ 0%
─────────────────────────────────
TOTAL ░░░░░░░░░░ 0%

```

---

## Phase 1: {Phase Name}

**Objective**: {What this achieves}

### Tasks

- [ ] Task 1.1: {Description}
  - [ ] Sub-task a
  - [ ] Sub-task b
- [ ] Task 1.2: {Description}

### Verification
- [ ] TypeScript compiles
- [ ] Tests pass

---

## Observations & Issues

### [YYYY-MM-DD HH:MM] - Type: Observation
**Status**: Open | Resolved
**Description**: {What was observed}
**Resolution**: {How it was resolved}

---

## Success Criteria

| Criterion | Status | Notes |
|-----------|--------|-------|
| {Criterion} | ⬜ | |
```

### Step 4.2: Update INDEX.md

Add all execution documents to INDEX.md with:

- Execution order
- Dependencies
- Status tracking

### Deliverable

**Output**: Execution documents in `/development/` folder

**Quality Check**:

- [ ] Each execution has checkable tasks
- [ ] Progress tracking included
- [ ] Success criteria defined

---

## Phase 5: Execute via Sub-Agents

**Objective**: Implement the planned work using specialized agents
**Duration**: Variable (tracked per execution)

### Step 5.1: Select Next Task

Check INDEX.md for:

1. Tasks with completed dependencies
2. Highest priority unblocked task
3. Current session goals

### Step 5.2: Spawn Execution Agent

Use the Task tool with `subagent_type: "general-purpose"`:

```
Prompt structure:
1. Task summary (what to do)
2. Full design context (copy relevant sections)
3. Current file contents (if modifying)
4. Expected deliverables
5. Validation commands to run
6. Request to report back with summary
```

**Example prompt**:

```
## Task: Implement EXECUTION_01 - DI Bootstrap

You are implementing {task description}.

### Problem
{Problem from design doc}

### Solution
{Solution from design doc}

### Files to Create
{File details with expected content}

### Files to Modify
{Current content + expected changes}

### Validation
Run: npx tsc --noEmit && task quality:format-all

### Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
```

### Step 5.3: Verify Agent Output

When agent completes:

1. Verify reported changes match expectations
2. Note any issues mentioned by agent
3. Proceed to Phase 6 (Validation)

### Deliverable

**Output**: Working code (pending validation)

---

## Phase 6: Validation & Review

**Objective**: Verify implementation correctness, patterns, and quality before documenting completion
**Duration**: 15-30 minutes

This phase is **mandatory** after every execution. It catches issues early and ensures consistent quality.

### Step 6.1: TypeScript Compilation

Run TypeScript check on modified files:

```bash
npx tsc --noEmit
```

**Check for:**

- Zero errors in modified files
- No implicit `any` types
- Proper type imports (`import type` for type-only)

### Step 6.2: Spawn Review Agent

Use the Task tool with `subagent_type: "general-purpose"` to review the implementation:

```
## Task: Review EXECUTION_## Implementation

Review all files created/modified for correctness and patterns.

### Files to Review
- {list files created}
- {list files modified}

### Review Checklist

1. **TypeScript Compilation** - Run `npx tsc --noEmit`
2. **Pattern Compliance** - Verify follows established patterns
3. **Clean Architecture** - No layer violations
4. **Code Quality** - JSDoc, error handling, logging format
5. **Backwards Compatibility** - Existing interfaces preserved
6. **Edge Cases** - Error paths handled

### Expected Output
1. Issues Found - with file path and line numbers
2. Fixes Applied - if any issues fixed
3. Recommendations - optional improvements

Fix any issues found, then report results.
```

### Step 6.3: Run Tests (if applicable)

```bash
# Run tests for modified modules
pnpm test -- --testPathPattern="{module-name}"

# Or run full test suite
pnpm test
```

### Step 6.4: Address Review Findings

If review agent finds issues:

1. Have agent fix them, OR
2. Resume agent to apply fixes
3. Re-run validation after fixes

### Step 6.5: Update Documentation (REQUIRED)

After successful validation, **ALL THREE documents MUST be updated**:

```
Spawn agent to:
1. Update EXECUTION_##.md - mark tasks complete, update progress bars
2. Update SESSION_HANDOFF.md - add to completed work
3. Update INDEX.md - update status table, metrics, dependency graph

CRITICAL: INDEX.md must reflect current state after EVERY execution.
This is the single source of truth for project status.
```

**INDEX.md Required Updates:**

- Status column in execution order table
- Current metrics (CA compliance %, use case utilization, etc.)
- Dependency graph (mark completed dependencies with ✅)
- "Quick Start" section with correct next recommended task

### Deliverable

**Output**: Validated code, updated documentation

**Quality Check**:

- [ ] TypeScript compiles without errors
- [ ] Review agent reports all PASS
- [ ] Tests pass (if applicable)
- [ ] Execution document shows completion
- [ ] INDEX.md reflects new status

---

## Phase 7: Session Handoff

**Objective**: Ensure next session can resume seamlessly
**Duration**: 10-15 minutes

### Step 6.1: Update SESSION_HANDOFF.md

Before ending any session:

1. **Update session progress table** with completed work
2. **Record commits** created during session
3. **Update "Next Steps"** with recommended continuation
4. **Add any blockers** or open questions
5. **Update timestamp**

### Step 6.2: Update INDEX.md

Ensure INDEX.md reflects:

- Current status of all executions
- Any new dependencies discovered
- Updated metrics

### Step 6.3: Commit Documentation

```bash
git add docs/ignored/{feature}/
git commit -m "docs: update {feature} session handoff"
```

### Deliverable

**Output**: Updated SESSION_HANDOFF.md and INDEX.md

**Quality Check**:

- [ ] Next session can start from SESSION_HANDOFF.md
- [ ] All completed work documented
- [ ] Recommended next task clear

---

## Process Checklist

### Pre-Process

- [ ] Feature requirements understood
- [ ] Feature folder created under `/docs/ignored/`
- [ ] INDEX.md template created
- [ ] SESSION_HANDOFF.md template created

### Research Phase

- [ ] Codebase explored via Explore agent
- [ ] Gaps identified and documented
- [ ] Research docs created in `/research/`

### Design Phase

- [ ] Design docs created for each component
- [ ] Dependencies mapped
- [ ] Execution order determined

### Planning Phase

- [ ] Execution docs created for each design
- [ ] Tasks broken into checkable items
- [ ] INDEX.md updated with all executions

### Execution Phase (per task)

- [ ] Agent spawned with full context
- [ ] Work completed by agent
- [ ] Agent reports summary of changes

### Validation Phase (per task)

- [ ] TypeScript compiles without errors
- [ ] Review agent spawned and reports PASS
- [ ] Tests pass (if applicable)
- [ ] Issues fixed (if any found)
- [ ] Execution doc updated with progress
- [ ] INDEX.md status updated

### Session End

- [ ] SESSION_HANDOFF.md updated
- [ ] INDEX.md current
- [ ] Changes committed

---

## Templates & Examples

### Template: INDEX.md

**Purpose**: Central navigation and status tracking
**Location**: `/docs/ignored/{feature}/INDEX.md`
**Usage**: Copy template, customize for feature

### Template: SESSION_HANDOFF.md

**Purpose**: Session continuity and context
**Location**: `/docs/ignored/{feature}/SESSION_HANDOFF.md`
**Usage**: Update at end of each session

### Template: DESIGN\_##.md

**Purpose**: Detailed solution design
**Location**: `/docs/ignored/{feature}/design/DESIGN_##_*.md`
**Usage**: One per major component

### Template: EXECUTION\_##.md

**Purpose**: Step-by-step implementation plan
**Location**: `/docs/ignored/{feature}/development/EXECUTION_##_*.md`
**Usage**: One per design, with checkboxes

### Example: AI Assistant Clean Architecture

**Scenario**: Refactoring AI Assistant feature to proper Clean Architecture
**Location**: `/docs/ignored/ai_assistant_clean_architecture/`
**Structure**:

```
ai_assistant_clean_architecture/
├── INDEX.md
├── SESSION_HANDOFF.md
├── research/
│   ├── CONSOLIDATED_GAP_ANALYSIS_REPORT.md
│   └── MIGRATION_GAP_ANALYSIS_RESEARCH_PLAN.md
├── design/
│   ├── DESIGN_01_DI_BOOTSTRAP.md
│   ├── DESIGN_02_USE_CASE_INTEGRATION.md
│   └── ...
└── development/
    ├── EXECUTION_01_DI_BOOTSTRAP.md
    ├── EXECUTION_02_USE_CASE_INTEGRATION.md
    └── ...
```

---

## Troubleshooting

| Issue                   | Symptoms                                    | Solution                                  | Prevention                                 |
| ----------------------- | ------------------------------------------- | ----------------------------------------- | ------------------------------------------ |
| **Agent lacks context** | Agent asks questions already answered       | Provide full design doc content in prompt | Include all relevant context upfront       |
| **Dependency not met**  | Execution fails due to missing prerequisite | Check INDEX.md dependency graph           | Always verify dependencies before starting |
| **Lost session state**  | Can't remember what was done                | Read SESSION_HANDOFF.md                   | Always update handoff before ending        |
| **Stale documentation** | Docs don't match code                       | Run documentation update agent            | Update docs immediately after code changes |
| **Conflicting changes** | Agent work conflicts with manual changes    | Coordinate via SESSION_HANDOFF.md         | Document all changes in handoff            |

### When to Escalate

- **Blocker discovered**: Document in execution doc, update SESSION_HANDOFF.md with blocker
- **Design flaw found**: Create observation in execution doc, may need design revision
- **Dependency cycle**: Revisit INDEX.md dependency graph, restructure if needed

---

## Quick Reference

### Agent Spawn Patterns

```bash
# Exploration/Research
Task tool with subagent_type: "Explore"
- Codebase questions
- Finding files/patterns
- Understanding architecture

# Implementation
Task tool with subagent_type: "general-purpose"
- Creating files
- Modifying code
- Running validations

# Planning
Task tool with subagent_type: "Plan"
- Designing implementation approach
- Identifying critical files
- Architectural decisions
```

### Folder Structure

| Type         | Location                                     | Description               |
| ------------ | -------------------------------------------- | ------------------------- |
| Feature Docs | `/docs/ignored/{feature}/`                   | All feature documentation |
| Index        | `/docs/ignored/{feature}/INDEX.md`           | Central navigation        |
| Handoff      | `/docs/ignored/{feature}/SESSION_HANDOFF.md` | Session context           |
| Research     | `/docs/ignored/{feature}/research/`          | Analysis documents        |
| Design       | `/docs/ignored/{feature}/design/`            | Solution designs          |
| Execution    | `/docs/ignored/{feature}/development/`       | Implementation plans      |

### Key Commands

```bash
# Validate changes
npx tsc --noEmit
task quality:format-all
task quality:test

# Check current status
cat docs/ignored/{feature}/INDEX.md
cat docs/ignored/{feature}/SESSION_HANDOFF.md
```

### Status Indicators

| Symbol     | Meaning           |
| ---------- | ----------------- |
| ░░░░░░░░░░ | Not started (0%)  |
| █████░░░░░ | In progress (50%) |
| ██████████ | Complete (100%)   |
| ✅         | Task complete     |
| ⬜         | Task pending      |
| 🔄         | In progress       |
| ⏸️         | Blocked           |

---

## Related Documentation

### Internal

- [Development Process](/docs/processes/development/development_process.md)
- [Process Template](/docs/processes/process_template.md)
- [Project Rules](/.cursor/rules/about.mdc) - Development guidelines

### Example Implementation

- [AI Assistant Clean Architecture](/docs/ignored/ai_assistant_clean_architecture/INDEX.md) - Live example of this process

---

## Changelog

### Version 1.2.0 (2026-01-11)

**Status**: Active
**Changes**: Made INDEX.md updates REQUIRED after every execution - INDEX is single source of truth

### Version 1.1.0 (2026-01-11)

**Status**: Superseded
**Changes**: Added explicit Phase 6: Validation & Review - mandatory review agent step after each execution

### Version 1.0.0 (2026-01-11)

**Status**: Superseded
**Changes**: Initial version based on AI Assistant Clean Architecture refactoring experience

---

**End of Process Guide**
