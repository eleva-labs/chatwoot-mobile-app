# {Feature Name} - Execution Index

**Created**: {Date}
**Branch**: `{branch-name}`
**Purpose**: {Brief description of the feature/project}

---

## Current Status Summary

**Last Updated**: {Date}

| Metric | Before | Current | Target |
|--------|--------|---------|--------|
| {Metric 1} | {value} | {value} | {value} |
| {Metric 2} | {value} | {value} | {value} |

---

## Execution Order (Dependencies Matter)

### Phase 1: {Phase Name}

| Order | Execution | Design | Status | Effort | Description |
|-------|-----------|--------|--------|--------|-------------|
| 1 | [EXECUTION_01](development/EXECUTION_01_*.md) | [DESIGN_01](design/DESIGN_01_*.md) | Not Started | X hrs | {Description} |
| 2 | [EXECUTION_02](development/EXECUTION_02_*.md) | [DESIGN_02](design/DESIGN_02_*.md) | Not Started | X hrs | {Description} |

### Phase 2: {Phase Name}

| Order | Execution | Design | Status | Effort | Dependencies |
|-------|-----------|--------|--------|--------|--------------|
| 3 | [EXECUTION_03](development/EXECUTION_03_*.md) | [DESIGN_03](design/DESIGN_03_*.md) | Not Started | X hrs | Requires EXECUTION_01, EXECUTION_02 |
| 4 | [EXECUTION_04](development/EXECUTION_04_*.md) | [DESIGN_04](design/DESIGN_04_*.md) | Not Started | X hrs | Requires EXECUTION_03 |

---

## Dependency Graph

```
EXECUTION_01 ──────────────────┐
     │                         │
     └──────────────────────▶ EXECUTION_03 ──────▶ EXECUTION_04
                               │
EXECUTION_02 ──────────────────┘
```

**Legend**:
- ⬜ Not Started
- 🔄 In Progress
- ✅ Complete
- ⏸️ Blocked

---

## Quick Start for New Session

1. **Read this INDEX.md** for overall status
2. **Read [SESSION_HANDOFF.md](SESSION_HANDOFF.md)** for last session context
3. **Pick next task** based on dependencies (unblocked tasks only)
4. **Read the DESIGN doc**, then EXECUTION doc
5. **Execute via sub-agent** with full context
6. **Update execution doc** with progress
7. **Update SESSION_HANDOFF.md** before ending

---

## Validation Commands

```bash
# TypeScript check
npx tsc --noEmit

# Format and lint
task format-all

# Run tests
task test

# Run specific test file
pnpm test -- --testPathPattern="{pattern}"
```

---

## Research Documents

| Document | Purpose |
|----------|---------|
| [GAP_ANALYSIS.md](research/GAP_ANALYSIS.md) | {Description} |
| [{Other Research}](research/*.md) | {Description} |

---

## Design Documents

| Document | Status | Effort |
|----------|--------|--------|
| [DESIGN_01_*.md](design/DESIGN_01_*.md) | Draft | X hrs |
| [DESIGN_02_*.md](design/DESIGN_02_*.md) | Draft | X hrs |

---

## Session History

| Date | Session | Work Completed | Commits |
|------|---------|----------------|---------|
| {Date} | 1 | {Summary} | {hash} |
| {Date} | 2 | {Summary} | {hash} |

---

## Notes

{Any important notes, decisions, or context for the project}

---

**End of Index**
