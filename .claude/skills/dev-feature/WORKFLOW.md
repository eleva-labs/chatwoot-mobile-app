# Feature Development Workflow - Detailed Phases

**Version**: 1.0.0
**Last Updated**: 2026-01-11
**Parent**: [SKILL.md](SKILL.md)

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

**Naming Conventions**:
- Feature folder: `snake_case` descriptive name (e.g., `ai_assistant_clean_architecture`)
- Design docs: `DESIGN_##_COMPONENT_NAME.md` (e.g., `DESIGN_01_DI_BOOTSTRAP.md`)
- Execution docs: `EXECUTION_##_TASK_NAME.md` (e.g., `EXECUTION_01_DI_BOOTSTRAP.md`)

### Step 1.2: Create INDEX.md

Use template: [templates/INDEX_TEMPLATE.md](templates/INDEX_TEMPLATE.md)

The INDEX.md must contain:
- Current status summary with metrics
- Execution order table with dependencies
- Dependency graph
- Quick start for new sessions
- Validation commands

### Step 1.3: Create SESSION_HANDOFF.md

Use template: [templates/SESSION_HANDOFF_TEMPLATE.md](templates/SESSION_HANDOFF_TEMPLATE.md)

The SESSION_HANDOFF.md must contain:
- Quick start pointing to INDEX
- Session progress table
- Commits created
- Next steps with recommendations
- Context summary

### Deliverable
- Feature folder with INDEX.md and SESSION_HANDOFF.md

### Quality Check
- [ ] Folder structure created
- [ ] INDEX.md has execution order table
- [ ] SESSION_HANDOFF.md has quick start section

---

## Phase 2: Research

**Objective**: Understand current state, identify gaps and requirements
**Duration**: 1-4 hours

### Step 2.1: Spawn Research Agent

Invoke the `/design-research` skill or use the Task tool with `subagent_type: "Explore"`:

```
Prompt structure:
- Clear research question
- Specific files/patterns to investigate
- Expected output format
- Request to create research document
```

**Example Prompt**:
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
- Research documents in `/research/` folder

### Quality Check
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
| Action | File | Purpose |
|--------|------|---------|
| CREATE | path/to/file.ts | {Purpose} |
| MODIFY | path/to/file.ts | {Changes} |

## Testing/Validation
{How to verify the solution works}

## Risks and Mitigations
| Risk | Mitigation |
|------|------------|
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
- Design documents in `/design/` folder
- Dependency graph in INDEX.md

### Quality Check
- [ ] Each design has clear problem/solution
- [ ] File changes documented
- [ ] Dependencies identified

---

## Phase 4: Create Execution Plans

**Objective**: Break designs into step-by-step executable tasks
**Duration**: 1-2 hours

### Step 4.1: Create Execution Documents

Use template: [templates/EXECUTION_TEMPLATE.md](templates/EXECUTION_TEMPLATE.md)

For each design, create a corresponding execution document with:
- Progress overview with progress bars
- Phase breakdown with checkable tasks
- Verification steps
- Observations section
- Success criteria

### Step 4.2: Update INDEX.md

Add all execution documents to INDEX.md with:
- Execution order
- Dependencies
- Status tracking

### Deliverable
- Execution documents in `/development/` folder

### Quality Check
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

**Example Prompt**:
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
Run: npx tsc --noEmit && task format-all

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
- Working code (pending validation)

---

## Phase 6: Validation & Review

**Objective**: Verify implementation correctness, patterns, and quality
**Duration**: 15-30 minutes

This phase is **mandatory** after every execution.

### Step 6.1: TypeScript Compilation

```bash
npx tsc --noEmit
```

**Check for:**
- Zero errors in modified files
- No implicit `any` types
- Proper type imports (`import type` for type-only)

### Step 6.2: Spawn Review Agent

Invoke the `/review-code` skill or use Task tool:

```
## Task: Review EXECUTION_## Implementation

Review all files created/modified for correctness and patterns.

### Files to Review
- {list files created}
- {list files modified}

### Review Checklist
1. TypeScript Compilation - Run `npx tsc --noEmit`
2. Pattern Compliance - Verify follows established patterns
3. Clean Architecture - No layer violations
4. Code Quality - JSDoc, error handling, logging format
5. Backwards Compatibility - Existing interfaces preserved
6. Edge Cases - Error paths handled

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

1. **EXECUTION_##.md** - Mark tasks complete, update progress bars
2. **SESSION_HANDOFF.md** - Add to completed work
3. **INDEX.md** - Update status table, metrics, dependency graph

**CRITICAL**: INDEX.md must reflect current state after EVERY execution.

### Deliverable
- Validated code
- Updated documentation

### Quality Check
- [ ] TypeScript compiles without errors
- [ ] Review agent reports all PASS
- [ ] Tests pass (if applicable)
- [ ] Execution document shows completion
- [ ] INDEX.md reflects new status

---

## Phase 7: Session Handoff

**Objective**: Ensure next session can resume seamlessly
**Duration**: 10-15 minutes

### Step 7.1: Update SESSION_HANDOFF.md

Before ending any session:

1. **Update session progress table** with completed work
2. **Record commits** created during session
3. **Update "Next Steps"** with recommended continuation
4. **Add any blockers** or open questions
5. **Update timestamp**

### Step 7.2: Update INDEX.md

Ensure INDEX.md reflects:
- Current status of all executions
- Any new dependencies discovered
- Updated metrics

### Step 7.3: Commit Documentation

```bash
git add docs/ignored/{feature}/
git commit -m "docs: update {feature} session handoff"
```

### Deliverable
- Updated SESSION_HANDOFF.md and INDEX.md

### Quality Check
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

## When to Escalate

- **Blocker discovered**: Document in execution doc, update SESSION_HANDOFF.md with blocker
- **Design flaw found**: Create observation in execution doc, may need design revision
- **Dependency cycle**: Revisit INDEX.md dependency graph, restructure if needed

---

**End of Workflow Document**
