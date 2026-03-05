# Design Document Template

**Version**: 1.0.0
**Last Updated**: 2026-01-11
**Parent**: [SKILL.md](SKILL.md)

---

## Usage

Copy this template to create design documents at:
`/docs/ignored/<feature_name>/design/DESIGN_##_<component_name>.md`

---

# Design ##: {Component Name}

**Status**: Draft | In Review | Approved
**Priority**: High | Medium | Low
**Estimated Effort**: X hours/days
**Author**: {Name}
**Created**: {Date}
**Last Updated**: {Date}

---

## Problem Statement

### Background
{Context and background information. Why does this problem exist?}

### Problem
{Clear, concise description of the problem being solved}

### Impact
{What is the impact of not solving this problem?}

### Goals
1. {Goal 1}
2. {Goal 2}
3. {Goal 3}

### Non-Goals
1. {What this design explicitly does NOT address}
2. {Out of scope items}

---

## Proposed Solution

### Overview
{High-level description of the proposed solution in 2-3 paragraphs}

### Architecture Diagram
```
┌─────────────────┐     ┌─────────────────┐
│   Component A   │────▶│   Component B   │
└─────────────────┘     └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│    Service A    │────▶│    Service B    │
└─────────────────┘     └─────────────────┘
```

### Key Decisions
| Decision | Rationale | Alternatives Considered |
|----------|-----------|-------------------------|
| {Decision 1} | {Why this was chosen} | {Other options} |
| {Decision 2} | {Why this was chosen} | {Other options} |

---

## Implementation Details

### Types/Interfaces

```typescript
// New types to create
interface {TypeName} {
  // Properties
}

// Types to modify
interface {ExistingType} {
  // Changes
}
```

### Redux State Changes

```typescript
// State shape changes
interface {SliceName}State {
  // New/modified properties
}

// New actions
const {actionName} = createAction<{PayloadType}>('{action/name}');

// New selectors
const select{Name} = (state: RootState) => state.{slice}.{property};
```

### Component Changes

```typescript
// New component structure
const {ComponentName}: React.FC<{Props}> = ({ ... }) => {
  // Implementation outline
};
```

### Navigation Changes

```typescript
// New routes
export type {StackName}ParamList = {
  {ScreenName}: { /* params */ };
};
```

---

## Files to Create/Modify

### Files to Create

| File | Purpose | Priority |
|------|---------|----------|
| `src/types/{name}.ts` | {Purpose} | High |
| `src/store/slices/{name}.ts` | {Purpose} | High |
| `src/components-next/{name}.tsx` | {Purpose} | Medium |
| `src/screens/{name}.tsx` | {Purpose} | Medium |

### Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `src/types/index.ts` | Export new types | High |
| `src/store/index.ts` | Add new slice | High |
| `src/navigation/{stack}.tsx` | Add new route | Medium |

---

## Testing Strategy

### Unit Tests
| Test | File | Coverage |
|------|------|----------|
| {Test 1} | `__tests__/{file}.test.ts` | {What it tests} |
| {Test 2} | `__tests__/{file}.test.ts` | {What it tests} |

### Integration Tests
| Test | Description |
|------|-------------|
| {Test 1} | {What it validates} |
| {Test 2} | {What it validates} |

### Manual Testing
| Platform | Test Case | Expected Result |
|----------|-----------|-----------------|
| iOS | {Test case} | {Expected} |
| Android | {Test case} | {Expected} |

---

## Platform Considerations

### iOS Specific
- {Consideration 1}
- {Consideration 2}

### Android Specific
- {Consideration 1}
- {Consideration 2}

### Cross-Platform
- {Shared consideration 1}
- {Shared consideration 2}

---

## Performance Considerations

| Concern | Mitigation |
|---------|------------|
| {Concern 1} | {How it's addressed} |
| {Concern 2} | {How it's addressed} |

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| {Concern 1} | {How it's addressed} |
| {Concern 2} | {How it's addressed} |

---

## Accessibility Considerations

| Requirement | Implementation |
|-------------|----------------|
| Screen reader support | {How implemented} |
| Touch targets | {How implemented} |
| Color contrast | {How implemented} |

---

## Migration Strategy

### Backward Compatibility
{How backward compatibility is maintained, if applicable}

### Migration Steps
1. {Step 1}
2. {Step 2}
3. {Step 3}

### Rollback Plan
{How to rollback if issues are discovered}

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| {Risk 1} | Low/Med/High | Low/Med/High | {Strategy} |
| {Risk 2} | Low/Med/High | Low/Med/High | {Strategy} |
| {Risk 3} | Low/Med/High | Low/Med/High | {Strategy} |

---

## Success Criteria

| Criterion | Measurement | Target |
|-----------|-------------|--------|
| {Criterion 1} | {How to measure} | {Target value} |
| {Criterion 2} | {How to measure} | {Target value} |
| {Criterion 3} | {How to measure} | {Target value} |

### Definition of Done
- [ ] All files created/modified as specified
- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] Manual testing on iOS successful
- [ ] Manual testing on Android successful
- [ ] Code review approved
- [ ] Documentation updated

---

## Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| {Phase 1} | {X days} | {None / Phase X} |
| {Phase 2} | {X days} | {Phase 1} |
| {Phase 3} | {X days} | {Phase 2} |

**Total Estimated Effort**: X days

---

## Open Questions

| Question | Owner | Due Date | Resolution |
|----------|-------|----------|------------|
| {Question 1} | {Who} | {Date} | {Pending/Resolved: answer} |
| {Question 2} | {Who} | {Date} | {Pending/Resolved: answer} |

---

## References

- [Related Document 1](/path/to/doc)
- [Related Document 2](/path/to/doc)
- [External Resource](https://example.com)

---

## Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| Author | {Name} | Submitted | {Date} |
| Reviewer | {Name} | Pending | - |
| Approver | {Name} | Pending | - |

---

## Changelog

### Version 1.0.0 ({Date})
- Initial design document

---

**End of Design Document**
