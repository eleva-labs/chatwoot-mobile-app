# Research Process Guide

**Version**: 1.0.0
**Last Updated**: 2025-01-27
**Status**: Active
**Document Type**: Process Guide
**Project**: Chatwoot Mobile App (React Native + Expo)

---

## Overview

Critical first phase before creating a design document. Ensures: user request understood, codebase analyzed, multiple solutions considered, best approach selected, solid foundation for design.

### Key Principles

1. **Conversation First** - Collaborative, not automated
2. **Deep Understanding** - Use comprehensive approach, read ALL relevant code
3. **Question Everything** - Challenge assumptions, ask clarifying questions
4. **Explore Alternatives** - Always present multiple approaches
5. **Align with Patterns** - Follow existing codebase conventions
6. **Document Findings** - Create clear, actionable research reports
7. **Mobile Considerations** - Always consider iOS/Android differences

### Process Flow

```
User Request → Request Understanding → Repository Analysis → Solution Exploration → Recommendation & Decision → Design Document
```

**Duration**: 50-90 minutes total

**When to Use**:
- ✅ New features, complex refactorings, architectural changes, breaking changes
- ❌ Simple bug fixes, trivial changes, explicit implementation instructions

---

## Research Agent Responsibilities

### Must:
- Act as consultant (advise and guide)
- Be thorough (read ALL code, no assumptions)
- Be conversational (engage, ask questions, discuss)
- Be critical (question if better approaches exist)
- Be comprehensive (consider all layers)
- Be pattern-aware (identify and follow existing patterns)
- Be honest (admit uncertainty, ask for help)
- Document everything (findings, conversations, decisions)
- Consider mobile platforms (iOS/Android differences)

### Must NOT:
- Jump to implementation (no code changes during research)
- Make unilateral decisions (always collaborate)
- Skip analysis (every request deserves investigation)
- Ignore alternatives (always present multiple options)
- Assume understanding (ask clarifying questions)
- Violate architecture (respect React Native/Redux patterns)
- Ignore platform differences (consider iOS/Android)

---

## Research Process Workflow

| Phase | Duration | Focus |
|-------|----------|-------|
| 1. Request Understanding | 10-20 min | Clarify requirements |
| 2. Repository Analysis | 20-40 min | Understand codebase |
| 3. Solution Exploration | 15-30 min | Generate alternatives |
| 4. Recommendation | 5-10 min | Document & approve |

---

## Phase 1: Request Understanding

**Goal**: Fully understand what user wants to achieve

### Step 1.1: Initial Request Parsing

1. Read user request carefully
2. Identify core objective
3. Note mentioned constraints
4. Flag ambiguous/unclear points

**Questions to Ask**:
- What is user trying to achieve?
- Is this new feature, bug fix, refactoring, or optimization?
- What is the scope? (UI only? Redux state? Navigation? API integration?)
- Are there explicit/implicit requirements?
- Platform-specific requirements? (iOS only? Android only? Both?)

### Step 1.2: Clarification Questions

**Always Ask**: Scope clarification, success criteria, constraints (timeline, backward compatibility), context (why needed? what problem solved?), platform requirements

**Example**:
```
User: "I want to add a new screen for AI assistant"

Agent: "I'd like to understand your request better:
1. What is the purpose of this screen?
2. Should it be accessible from navigation?
3. What data does it need from Redux?
4. Are there any platform-specific requirements (iOS/Android)?
5. What is the timeline/urgency?"
```

### Step 1.3: Define Success Criteria

Collaborate with user to define: What "done" looks like, acceptance criteria, performance requirements (if applicable), testing expectations, platform requirements

---

## Phase 2: Repository Analysis

**Goal**: Deeply understand current codebase and architecture

### Step 2.1: Identify Relevant Code

**Use Tools Extensively**:
```bash
Glob: "src/**/*screen*.tsx"
Grep: "Screen.*="
Read: /path/to/file.tsx
```

**Questions to Answer**: Where is relevant code? What layers involved? (Components, Screens, Redux, Navigation, Utils, Types) What patterns used? Similar features to learn from?

### Step 2.2: Study Architecture Patterns

**Read**: Project rules, related component/screen/Redux slice/navigation/test files

**Analyze**: How are similar features implemented? What design patterns used? How is Redux structured? How are components structured? How is navigation configured?

### Step 2.3: Identify Dependencies & Impact

**Map Out**:
1. **Direct Dependencies** - What files import/use affected code?
2. **Indirect Dependencies** - What features depend on this?
3. **Redux Impact** - State changes? Migrations? Selectors?
4. **Navigation Impact** - New routes? Deep linking? Navigation flow?
5. **Platform Impact** - iOS/Android specific code? Platform-specific APIs?
6. **Test Impact** - What test files need updates? New tests needed?

**Use Tools**:
```bash
Grep: "ComponentName" -n
Grep: "function_name" --output-mode files_with_matches
Glob: "__tests__/**/*component*.ts*"
```

### Step 2.4: Review Similar Implementations

Find similar features, study implementation, note patterns/conventions, learn from design decisions

---

## Phase 3: Solution Exploration

**Goal**: Generate and evaluate multiple solution approaches

### Step 3.1: Generate Alternative Approaches

**Always Create At Least 3 Alternatives**:

```markdown
### Approach 1: Minimal Change (Simplest)
**Description**: Add feature with minimal refactoring
**Effort**: 1-2 days | **Risk**: Low
**Pros**: Quick, low risk, backward compatible
**Cons**: Doesn't address technical debt, may not be extensible

### Approach 2: Refactoring (Recommended)
**Description**: Add feature + refactor to improve architecture
**Effort**: 3-4 days | **Risk**: Medium
**Pros**: Improves code quality, follows best practices, extensible
**Cons**: More work upfront, touches more files

### Approach 3: Complete Redesign (Thorough)
**Description**: Redesign system entirely
**Effort**: 10-15 days | **Risk**: High
**Pros**: Solves underlying issues, future-proof
**Cons**: High effort and risk, many breaking changes
```

### Step 3.2: Analyze Trade-offs

**For Each Approach Document**:
1. **Alignment with Architecture** - React Native/Redux patterns compliance?
2. **Complexity** - Implementation complexity, files affected, risk?
3. **Maintainability** - Easy to understand/extend, technical debt?
4. **Performance** - Mobile performance implications?
5. **Testing** - How testable? Coverage needed? Platform testing?
6. **Migration** - Rollback strategy? Backward compatibility?
7. **Platform Compatibility** - Works on both iOS and Android?

### Step 3.3: Discuss with User

**Present Alternatives**:
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

What do you think? Timeline constraints or other considerations?
```

### Step 3.4: Refine Based on Feedback

Listen to user's concerns, adjust approaches, explore hybrid options if needed, converge on best approach

---

## Phase 4: Recommendation & Decision

**Goal**: Make final recommendation and get user approval

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
- File 1: [change description]

#### Redux
- File 1: [change description]
- State migration: [description if needed]

#### Components
- File 1: [change description]

#### Screens
- File 1: [change description]

#### Navigation
- File 1: [change description]

### Estimated Effort
- **Duration**: X days
- **Complexity**: Low/Medium/High
- **Risk**: Low/Medium/High

### Risks & Mitigations
#### Risk 1: [Description]
**Mitigation**: [Strategy]
```

### Step 4.2: Get User Approval

**Ask**:
```markdown
Does this approach look good to you?
- [ ] Yes, proceed to design document
- [ ] I have questions/concerns
- [ ] I prefer a different approach
```

### Step 4.3: Create Research Report

**Once Approved**:
1. Create feature folder: `/docs/ignore/<feature_name>/`
2. Create subfolders: `design/`, `development/`, `testing/`
3. Create research file: `/docs/ignore/<feature_name>/design/<feature_name>_research.md`

**Note**: Feature folder groups all artifacts (research, design, execution, testing) for better organization. Feature name should be tied to the branch when possible (e.g., `feature_ai_assistant/`).

**Template**: `/docs/processes/design/RESEARCH_TEMPLATE.md`

**Include**: Original request + clarifications, architecture analysis, alternative approaches, final recommendation with justification, user approval + next steps

---

## Conversation Guidelines

**DO**: Be conversational and friendly, use clear plain language, ask questions liberally, explain reasoning, show work (code examples, file paths), present options not just answers

**DON'T**: Make assumptions without asking, jump to conclusions, overwhelm with jargon, present only one option, make unilateral decisions

**Presenting Information**:
```markdown
### Current vs Proposed
**Current**: [Description + code]
**Proposed**: [Description + code]
**Why Better**: [Reasons]
```

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
- [ ] Identified existing patterns, mapped dependencies/impacts, found similar implementations

### Phase 3: Solution Exploration
- [ ] Generated at least 3 alternative approaches
- [ ] Documented pros/cons, effort, risk for each
- [ ] Analyzed alignment with architecture
- [ ] Presented alternatives to user, incorporated feedback, converged on preferred approach

### Phase 4: Recommendation & Decision
- [ ] Presented final recommendation with justification
- [ ] Documented what will change, estimated effort/risk
- [ ] Identified risks and mitigations
- [ ] Got user approval, created research report

---

## Quick Reference

### Common Search Patterns

```bash
# Find component definitions
Glob: "src/components-next/**/*{component_name}*.tsx"
Grep: "export.*{ComponentName}"

# Find screens
Glob: "src/screens/**/*{screen_name}*.tsx"

# Find Redux slices
Glob: "src/store/**/*{slice_name}*.ts"
Grep: "createSlice"

# Find navigation
Glob: "src/navigation/**/*.tsx"
Grep: "Screen.*name"

# Find tests
Glob: "__tests__/**/*{feature}*.ts*"
```

### Decision Criteria

**Choose Minimal Approach When**: Timeline very tight (< 2 days), low complexity, temporary solution acceptable

**Choose Refactoring Approach When**: Moderate timeline (2-5 days), medium complexity, quality improvement opportunity, reasonable effort/benefit ratio

**Choose Redesign Approach When**: Ample timeline (> 1 week), high complexity, existing design fundamentally flawed, long-term benefits justify cost

---

## Research Report Template

**Template**: `/docs/processes/design/RESEARCH_TEMPLATE.md`

**Runtime Documents**: `/docs/ignore/<feature_name>/design/<feature_name>_research.md`

**Key Sections**: Request Understanding (original request, clarifications, success criteria), Repository Analysis (files analyzed, patterns, similar implementations, impact), Alternative Approaches (3+ with description, pros/cons, effort), Trade-off Analysis (comparison table), Final Recommendation (chosen approach, justification, implementation summary, risks), User Approval (status, date, comments), Next Steps (design document, timeline)

---

## Changelog

### Version 1.0.0 (2025-01-27)
**Status**: Active
**Changes**: Initial version for React Native/Expo mobile app research

---

**End of Document**

