# Research Methodology Guide

**Version**: 1.0.0
**Last Updated**: 2026-01-11
**Parent**: [SKILL.md](SKILL.md)

---

## Phase 1: Request Understanding - Detailed Steps

### Step 1.1: Initial Request Parsing

1. **Read user request carefully**
2. **Identify core objective** - What is the user trying to achieve?
3. **Note mentioned constraints** - Timeline, compatibility, performance
4. **Flag ambiguous/unclear points** - What needs clarification?

### Questions Framework

**Scope Questions**:
- Is this new feature, bug fix, refactoring, or optimization?
- What layers are involved? (UI only? Redux state? Navigation? API integration?)
- What is the boundary of this work?

**Requirements Questions**:
- What are the explicit requirements?
- What are the implicit requirements?
- Are there non-functional requirements (performance, accessibility)?

**Platform Questions**:
- Platform-specific requirements? (iOS only? Android only? Both?)
- Any platform-specific APIs or behaviors needed?

**Context Questions**:
- Why is this needed? What problem does it solve?
- Is there a deadline or timeline constraint?
- Are there backward compatibility requirements?

### Step 1.2: Clarification Dialog

**Example**:
```
User: "I want to add a new screen for AI assistant"

Agent: "I'd like to understand your request better:
1. What is the purpose of this screen?
2. Should it be accessible from navigation (tab, modal, stack)?
3. What data does it need from Redux?
4. Are there any platform-specific requirements (iOS/Android)?
5. What is the timeline/urgency?
6. Any existing designs or mockups?"
```

### Step 1.3: Define Success Criteria

Collaborate with user to define:
- What "done" looks like
- Acceptance criteria
- Performance requirements (if applicable)
- Testing expectations
- Platform requirements

---

## Phase 2: Repository Analysis - Detailed Steps

### Step 2.1: Identify Relevant Code

**Use Tools Extensively**:
```bash
# Find by pattern
Glob: "src/**/*{feature_name}*.tsx"

# Search content
Grep: "function_name" --output-mode files_with_matches

# Read specific file
Read: /path/to/file.tsx
```

**Questions to Answer**:
- Where is the relevant code?
- What layers are involved?
  - Components (`src/components-next/`)
  - Screens (`src/screens/`)
  - Redux (`src/store/`)
  - Navigation (`src/navigation/`)
  - Utils (`src/utils/`)
  - Types (`src/types/`)
- What patterns are currently used?
- Are there similar features to learn from?

### Step 2.2: Study Architecture Patterns

**Files to Read**:
- Project rules (`.cursor/rules/`)
- Related component files
- Related screen files
- Related Redux slices
- Related navigation files
- Related test files

**Analyze**:
1. How are similar features implemented?
2. What design patterns are used?
3. How is Redux structured (slices, selectors, thunks)?
4. How are components structured?
5. How is navigation configured?

### Step 2.3: Map Dependencies & Impact

**Direct Dependencies**:
- What files import/use the affected code?

**Indirect Dependencies**:
- What features depend on this?

**Redux Impact**:
- State changes needed?
- Migrations required?
- Selectors to update?

**Navigation Impact**:
- New routes?
- Deep linking?
- Navigation flow changes?

**Platform Impact**:
- iOS-specific code?
- Android-specific code?
- Platform-specific APIs?

**Test Impact**:
- What test files need updates?
- New tests needed?

**Use Tools**:
```bash
# Find usages
Grep: "ComponentName" -n

# Find files with matches
Grep: "function_name" --output-mode files_with_matches

# Find tests
Glob: "__tests__/**/*{component}*.ts*"
```

### Step 2.4: Review Similar Implementations

1. Find similar features in codebase
2. Study their implementation
3. Note patterns and conventions
4. Learn from their design decisions
5. Identify what to reuse vs. improve

---

## Phase 3: Solution Exploration - Detailed Steps

### Step 3.1: Generate Alternative Approaches

**Approach Template**:
```markdown
### Approach X: [Name] ([Characteristic])

**Description**: [What this approach does]

**Implementation Summary**:
- [Key change 1]
- [Key change 2]
- [Key change 3]

**Effort**: [X-Y days] | **Risk**: [Low/Medium/High]

**Pros**:
- [Advantage 1]
- [Advantage 2]

**Cons**:
- [Disadvantage 1]
- [Disadvantage 2]

**Best When**: [Conditions where this is optimal]
```

### Step 3.2: Analyze Trade-offs

**Trade-off Matrix**:
| Factor | Approach 1 | Approach 2 | Approach 3 |
|--------|------------|------------|------------|
| Effort | Low | Medium | High |
| Risk | Low | Medium | High |
| Quality | Adequate | Good | Excellent |
| Future-proof | No | Partial | Yes |
| iOS Compat | Yes | Yes | Yes |
| Android Compat | Yes | Yes | Yes |

### Step 3.3: Present to User

```markdown
I've analyzed your request and generated 3 approaches:

**Approach 1: Minimal Change** - Quickest (1-2d), low risk, but doesn't improve architecture

**Approach 2: Refactoring (Recommended)** - Balanced (3-4d), improves quality, extensible

**Approach 3: Complete Redesign** - Most thorough (10-15d), but high risk

**My Recommendation**: Approach 2

**Rationale**:
1. Balances speed with quality
2. Follows existing patterns
3. Won't create technical debt
4. Works on both iOS and Android

What do you think? Any timeline constraints or other considerations?
```

### Step 3.4: Refine Based on Feedback

- Listen to user's concerns
- Adjust approaches as needed
- Explore hybrid options if requested
- Converge on best approach together

---

## Phase 4: Recommendation - Detailed Steps

### Step 4.1: Present Final Recommendation

**Structure**:
```markdown
## Final Recommendation

### Chosen Approach: [Approach Name]

### Summary
[2-3 sentence summary of what will be done]

### Why This Approach
1. [Alignment with architecture]
2. [Balances effort/quality]
3. [Follows existing patterns]
4. [Platform compatibility]

### What Will Be Changed

#### Types
- `src/types/file.ts`: [change description]

#### Redux
- `src/store/slices/file.ts`: [change description]
- State migration: [description if needed]

#### Components
- `src/components-next/file.tsx`: [change description]

#### Screens
- `src/screens/file.tsx`: [change description]

#### Navigation
- `src/navigation/file.tsx`: [change description]

### Estimated Effort
- **Duration**: X days
- **Complexity**: Low/Medium/High
- **Risk**: Low/Medium/High

### Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| {Risk 1} | Low/Med/High | Low/Med/High | {Strategy} |
| {Risk 2} | Low/Med/High | Low/Med/High | {Strategy} |
```

### Step 4.2: Get User Approval

```markdown
Does this approach look good to you?

- [ ] Yes, proceed to design document
- [ ] I have questions/concerns
- [ ] I prefer a different approach

Please confirm before I proceed with creating the design document.
```

### Step 4.3: Create Research Report

**Once Approved**:

1. Create feature folder: `/docs/ignored/<feature_name>/`
2. Create subfolders: `design/`, `development/`, `research/`
3. Create research file: `/docs/ignored/<feature_name>/research/<feature_name>_research.md`

**Research Report Contents**:
- Original request + clarifications
- Architecture analysis
- Alternative approaches (all 3+)
- Final recommendation with justification
- User approval and next steps

---

## Research Checklist

### Phase 1: Request Understanding
- [ ] Read user request thoroughly, identified core objective
- [ ] Asked clarifying questions
- [ ] Defined success criteria
- [ ] Got user confirmation

### Phase 2: Repository Analysis
- [ ] Used Glob/Grep to find relevant files
- [ ] Read all relevant files (components, screens, Redux, navigation, tests)
- [ ] Read project rules for guidelines
- [ ] Identified existing patterns
- [ ] Mapped dependencies/impacts
- [ ] Found similar implementations

### Phase 3: Solution Exploration
- [ ] Generated at least 3 alternative approaches
- [ ] Documented pros/cons, effort, risk for each
- [ ] Analyzed alignment with architecture
- [ ] Presented alternatives to user
- [ ] Incorporated feedback
- [ ] Converged on preferred approach

### Phase 4: Recommendation & Decision
- [ ] Presented final recommendation with justification
- [ ] Documented what will change
- [ ] Estimated effort/risk
- [ ] Identified risks and mitigations
- [ ] Got user approval
- [ ] Created research report

---

**End of Research Guide**
