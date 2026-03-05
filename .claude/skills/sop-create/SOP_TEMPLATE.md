# SOP Template

**Purpose**: Use this template when creating new Standard Operating Procedure documents.
**Usage**: Copy this entire template, then replace all `[placeholder]` text with actual content.

---

## Template Start

```markdown
# [Process Name] Process Guide

**Version**: 1.0.0
**Last Updated**: YYYY-MM-DD
**Status**: Draft | Active | Deprecated | Archived
**Document Type**: Process Guide
**Project**: Chatwoot Mobile App (React Native + Expo)

---

## Overview

### Purpose
[Describe what this process achieves in 2-3 sentences. Answer: Why does this process exist and what outcome does it produce?]

### Scope
**Covered**: [Item 1], [Item 2], [Item 3]
**NOT Covered**: [Item 1], [Item 2]

### When to Use
**ALWAYS**: [Scenario 1], [Scenario 2], [Scenario 3]
**SKIP**: [Scenario 1], [Scenario 2]

### Summary
[2-3 paragraphs: What the process does, who is involved, main outputs, typical duration]

---

## Key Principles

1. **[Principle 1 Name]** - [Description]
2. **[Principle 2 Name]** - [Description]
3. **[Principle 3 Name]** - [Description]

### Success Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

---

## Process Workflow

### Flow Diagram
```
[Stage 1] --> [Stage 2] --> [Stage 3] --> [Decision?]
                                         |Yes    |No
                                         v       v
                                       [4a]    [4b]
                                         |       |
                                         v       v
                                       [Final Stage]
```

### Phase Summary

| Phase | Objective | Deliverable | Duration |
|-------|-----------|-------------|----------|
| 1. [Name] | [What it achieves] | [Output] | [Time] |
| 2. [Name] | [What it achieves] | [Output] | [Time] |
| 3. [Name] | [What it achieves] | [Output] | [Time] |
| **Total** | | | **[Total]** |

### Prerequisites
- [Prerequisite 1]
- [Prerequisite 2]

---

## Phase 1: [Phase Name]

**Objective**: [Clear statement of what this phase achieves]
**Duration**: [Time range]

### Step 1.1: [Step Name]
1. [Action 1]
2. [Action 2]
3. [Action 3]

**Commands** (if applicable):
```bash
[command] --option [value]
```

**Common Issues**:
- **[Issue]**: [Problem] -> [Solution]
- **[Issue]**: [Problem] -> [Solution]

### Step 1.2: [Step Name]
1. [Action 1]
2. [Action 2]

### Deliverable
**Output**: [What this phase produces]

**Quality Check**:
- [ ] [Quality criterion 1]
- [ ] [Quality criterion 2]

---

## Phase 2: [Phase Name]

**Objective**: [What this phase achieves]
**Duration**: [Time estimate]

### Step 2.1: [Step Name]
1. [Action 1]
2. [Action 2]

### Deliverable
**Output**: [What this phase produces]

**Quality Check**:
- [ ] [Quality criterion 1]
- [ ] [Quality criterion 2]

---

## Phase N: [Final Phase Name]

**Objective**: [What this phase achieves]
**Duration**: [Time estimate]

### Step N.1: [Step Name]
1. [Action 1]
2. [Action 2]

### Deliverable
**Output**: [Final output]

**Quality Check**:
- [ ] [Quality criterion 1]
- [ ] [Quality criterion 2]

---

## Process Checklist

### Pre-Process
- [ ] [Prerequisite 1] verified
- [ ] Environment prepared
- [ ] Tools available

### Phase 1: [Phase Name]
- [ ] Step 1.1 complete
- [ ] Step 1.2 complete
- [ ] Deliverable created
- [ ] Quality check passed

### Phase 2: [Phase Name]
- [ ] Step 2.1 complete
- [ ] Deliverable created
- [ ] Quality check passed

### Phase N: [Phase Name]
- [ ] All steps complete
- [ ] Final deliverable created
- [ ] Quality check passed

### Post-Process
- [ ] All phases complete
- [ ] Documentation updated
- [ ] Stakeholders notified

---

## Templates & Examples

### Template: [Template Name]
**Purpose**: [When to use]
**Location**: `/docs/processes/[type]/[template_name].md`
**Usage**: Copy template, fill placeholders, complete required sections

### Example: [Scenario Name]
**Scenario**: [Brief description]
**Walkthrough**: User requests [X] -> Process does [Y] -> Result is [Z]
**Key Takeaways**: [Takeaway 1], [Takeaway 2]

---

## Troubleshooting

| Issue | Symptoms | Solution | Prevention |
|-------|----------|----------|------------|
| **[Problem 1]** | [What you see] | [How to fix] | [How to avoid] |
| **[Problem 2]** | [What you see] | [How to fix] | [How to avoid] |
| **[Problem 3]** | [What you see] | [How to fix] | [How to avoid] |

### When to Escalate
- **[Scenario 1]**: [When to ask for help]
- **[Scenario 2]**: [When to ask for help]

---

## Quick Reference

### Common Commands
```bash
# [Command 1]: [Description]
pnpm run [command-1]

# [Command 2]: [Description]
npx expo [command-2]
```

### File Locations
| Type | Location | Description |
|------|----------|-------------|
| Process Docs | `/docs/processes/` | Process documentation |
| Templates | `/docs/processes/[type]/` | Reusable templates |
| Runtime Docs | `/docs/ignored/[type]/` | Active work documents |

### Key Terminology
- **[Term 1]**: [Definition]
- **[Term 2]**: [Definition]

---

## Related Documentation

### Internal
- [Related Process 1](/docs/processes/[related_process_1].md)
- [Related Process 2](/docs/processes/[related_process_2].md)
- [Project Rules](/.cursor/rules/about.mdc) - Development guidelines

---

## Changelog

### Version 1.0.0 (YYYY-MM-DD)
**Status**: Active
**Changes**: Initial version

---

**End of Document**
```

---

## Template End

## Section Reference

### Required Sections

| Section | Purpose | Guidance |
|---------|---------|----------|
| **Title + Metadata** | Identification and versioning | Always include version, date, status |
| **Overview** | Context and usage guidance | Answer "why" and "when" |
| **Process Workflow** | Visual understanding | Include diagram AND table |
| **Phases (2-5)** | Step-by-step instructions | Each phase = objective + steps + deliverable + quality check |
| **Troubleshooting** | Problem resolution | Cover top 3-5 common issues |
| **Related Documentation** | Cross-references | Link to related SOPs and skills |

### Recommended Sections

| Section | Purpose | When to Include |
|---------|---------|-----------------|
| **Key Principles** | Design philosophy | When process has guiding values |
| **Process Checklist** | Quick validation | For complex processes |
| **Templates & Examples** | Concrete guidance | When templates exist |
| **Quick Reference** | Fast lookup | When commands/paths used frequently |
| **Changelog** | History tracking | For versioned documents |

### Section Writing Tips

**Overview Section**:
- Purpose: 2-3 sentences, start with "This process..."
- Scope: Use "Covered" and "NOT Covered" lists
- When to Use: Be specific with ALWAYS and SKIP scenarios

**Phase Sections**:
- Start with clear objective
- Number all steps
- Include commands in code blocks
- End with deliverable and quality check

**Troubleshooting**:
- Use table format for scannability
- Include prevention, not just solution
- List issues in order of frequency

---

## Quality Checklist

Before finalizing your SOP, verify:

### Structure
- [ ] Title follows convention: `[Process Name] Process Guide`
- [ ] Metadata includes Version, Last Updated, Status
- [ ] Overview has Purpose, Scope, When to Use sections
- [ ] Process Workflow has both diagram and phase table
- [ ] At least 2 phases with full structure
- [ ] Troubleshooting section with 3+ issues
- [ ] Related Documentation with at least 1 link
- [ ] Ends with `**End of Document**`

### Content
- [ ] No `[placeholder]` text remains
- [ ] All commands tested and working
- [ ] All file paths verified
- [ ] All links valid
- [ ] Quality checks are verifiable (not vague)

### Style
- [ ] Consistent heading hierarchy (h1 > h2 > h3)
- [ ] Consistent list formatting
- [ ] Imperative verbs for actions ("Run", "Create", "Verify")
- [ ] No spelling/grammar errors

---

**End of Template**
