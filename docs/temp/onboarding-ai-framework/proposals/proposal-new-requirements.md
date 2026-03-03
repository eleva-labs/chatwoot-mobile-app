# Proposal: New Requirements for AI Onboarding Framework

> **Date**: 2026-02-28
> **Phase**: 2.1 (Architecture Amendment)
> **Prerequisite**: Phase 2 Architecture Design (`architecture-design.md`)
> **Status**: DRAFT — Awaiting review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [NEW-1: Dual Presentation Modes](#2-new-1-dual-presentation-modes)
3. [NEW-2: Step Rollback](#3-new-2-step-rollback)
4. [NEW-3: Static vs Dynamic Steps](#4-new-3-static-vs-dynamic-steps)
5. [Cross-Cutting Concerns](#5-cross-cutting-concerns)
6. [Migration Path from Current Architecture](#6-migration-path-from-current-architecture)
7. [Risk Summary](#7-risk-summary)
8. [Decision Log](#8-decision-log)

---

## 1. Executive Summary

Three new requirements have been raised that extend the Phase 2 architecture design:

| Req | Title | Impact | Risk |
|-----|-------|--------|------|
| NEW-1 | Dual Presentation Modes (Inline vs Full-View) | **High** — Fundamentally changes component architecture, adds a presentation strategy layer | Medium |
| NEW-2 | Step Rollback | **Medium** — Requires new data model, new AI tool, state machine changes | Medium-High |
| NEW-3 | Static vs Dynamic Steps | **Medium** — Requires flow config schema changes, new rendering path, system prompt changes | Low |

These requirements are **independent** and can be accepted/rejected individually. However, NEW-1 and NEW-2 have a synergy: full-view mode pairs well with rollback (the full-view slide can show a "back" affordance more naturally than an inline chat bubble).

### Conflicts with Current Architecture

The current architecture makes explicit commitments that conflict with these requirements:

1. **Section 4.1**: "Slides render inline in the message list" — **conflicts with NEW-1 Mode B**
2. **Section 5.5**: "Back navigation = scroll up (visual) + AI-driven re-render (functional)" — **conflicts with NEW-2** (rollback is more than re-render; it's data deletion + step invalidation)
3. **Section 6.2**: System prompt assumes all steps are dynamic (AI decides everything) — **conflicts with NEW-3** (static steps have predefined schemas)

None of these conflicts are breaking. The proposals below extend the architecture rather than rewrite it.

---

## 2. NEW-1: Dual Presentation Modes

### 2.1 Analysis of Current Architecture

The current architecture commits hard to inline presentation:

- `OnboardingChatInterface` wraps a `FlashList` that interleaves text bubbles and slides
- `AIPartRenderer` renders `render_slide` tool calls as `OnboardingSlide` inside the list
- The layout diagram (Section 4.1) shows slides as full-width items in a vertical scroll
- Back-navigation is "scroll up" — only works if slides are in the scroll list

**What works for both modes**: The Zod block schema, `render_slide` tool, `SlideRenderer`, `BlockRenderer`, and block components are all presentation-mode agnostic. They render a `Slide` object — they don't care whether they're inside a FlashList item or a full-screen view.

**What is inline-only**: `OnboardingChatInterface`, `OnboardingMessagesList`, the FlashList `getItemType` logic, the "scroll up to see previous slides" pattern.

### 2.2 Design Proposal

#### 2.2.1 Introduce a `presentationMode` Concept

```typescript
// src/store/onboarding/schemas/flowConfig.ts

const PresentationModeSchema = z.enum(['inline', 'full-view']);
type PresentationMode = z.infer<typeof PresentationModeSchema>;
```

**Granularity decision**: The mode should be configurable **per-flow** with an optional **per-step override**.

Rationale:
- Per-flow: A/B testing between modes is done at the flow level (user gets one mode or the other)
- Per-step override: Some steps may work better full-view (e.g., image-choice with large previews) while others work better inline (e.g., a simple yes/no)
- NOT per-block: Blocks are rendered within slides — the slide's presentation mode determines the container, not individual blocks

```typescript
// Flow-level config
const FlowConfigSchema = z.object({
  // ... existing fields ...
  presentationMode: PresentationModeSchema.default('inline'),
  steps: z.array(StepConfigSchema),
});

// Step-level override
const StepConfigSchema = z.object({
  // ... existing fields ...
  presentationMode: PresentationModeSchema.optional(), // overrides flow default
});
```

#### 2.2.2 Component Architecture Change: Introduce `PresentationStrategy`

The key insight: the **rendering pipeline** (Zod → SlideRenderer → BlockRenderer → Block components) is identical for both modes. What changes is the **container** that hosts the slide.

```
Current architecture:
  OnboardingScreen → OnboardingChatInterface → FlashList → [slides + messages]

Proposed architecture:
  OnboardingScreen → PresentationStrategy
    ├── InlinePresentationStrategy  → FlashList → [slides + messages]
    └── FullViewPresentationStrategy → ActiveSlideView + MiniChatOverlay
```

**New component tree**:

```
OnboardingScreen
├── OnboardingHeader
│   ├── BrandLogo
│   ├── ProgressBar
│   └── CloseButton
├── PresentationContainer (NEW — switches strategy based on mode)
│   │
│   ├── [Mode A: Inline] InlinePresentation
│   │   ├── OnboardingMessagesList (FlashList — same as current)
│   │   │   ├── AIMessageBubble (text parts)
│   │   │   ├── OnboardingSlide (tool-call parts)
│   │   │   │   └── SlideRenderer → BlockRenderer → Block components
│   │   │   └── OnboardingProgressCard
│   │   └── OnboardingInputBar
│   │
│   └── [Mode B: Full-View] FullViewPresentation (NEW)
│       ├── ActiveSlideArea (takes over content area)
│       │   ├── SlideRenderer → BlockRenderer → Block components
│       │   │   (identical rendering pipeline, different container)
│       │   └── SlideNavigationControls (swipe hints, dots, back button)
│       ├── MiniChatBar (NEW — collapsed chat overlay)
│       │   ├── LatestAIMessage (1-2 lines of latest text)
│       │   └── ExpandButton → expands to full chat history
│       └── OnboardingInputBar (same component, repositioned)
```

#### 2.2.3 Full-View Mode: Detailed Design

**Layout for full-view mode**:

```
┌─────────────────────────────────────────┐
│  OnboardingHeader                        │ ← same header, always present
│  ● ● ● ○ ○ ○ ○  (progress dots)         │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────────┐│
│  │        MiniChatBar (collapsible)    ││ ← AI's latest text, 1-2 lines
│  │  "Great choice! Now let's talk..."  ││
│  │                              [▼]    ││ ← expand to see full chat
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  │     ACTIVE SLIDE (full area)        ││ ← scroll vertical if tall
│  │                                     ││
│  │     Header: "About your business"   ││
│  │                                     ││
│  │     [SingleChoice block]            ││
│  │     ○ E-commerce                    ││
│  │     ○ SaaS                          ││
│  │     ○ Services                      ││
│  │     ○ Other                         ││
│  │                                     ││
│  │     [Continue]  [Skip]              ││
│  │                                     ││
│  └─────────────────────────────────────┘│
│                                         │
├─────────────────────────────────────────┤
│  InputBar (persistent)                   │
│  [Type a message...           ] [Send]   │
└─────────────────────────────────────────┘
```

**Key behaviors for full-view mode**:

1. **Content area replacement**: When the AI calls `render_slide`, the content area is entirely replaced by the slide. There is no chat list visible (except the mini-bar).

2. **AI text coexistence**: AI text messages appear in the `MiniChatBar` — a collapsible overlay at the top of the content area. The user can tap to expand it into a scrollable chat history (sheet or modal). This keeps the slide focused while preserving conversational context.

3. **Vertical scroll for tall slides**: If the slide content exceeds the viewport, the `ActiveSlideArea` becomes a `ScrollView`. The slide scrolls vertically within the content area. This is standard form behavior.

4. **Horizontal swipe (optional, per-step)**: For certain step types (e.g., image-choice galleries, multi-screen tutorials), the `ActiveSlideArea` could use a horizontal `PagerView` or `FlatList`. This is a per-step configuration, not a default.

5. **Transitions**: When the AI sends a new slide, the previous slide animates out (fade/slide) and the new one animates in. Reanimated layout transitions handle this.

6. **No FlashList in full-view**: The FlashList is not used. The active slide is rendered directly in the content area. Previous slides are only accessible via the chat history (expand MiniChatBar) or rollback (see NEW-2).

#### 2.2.4 The MiniChatBar Component

```typescript
// src/presentation/components/onboarding/MiniChatBar.tsx

interface MiniChatBarProps {
  /** Latest AI text messages (filtered from message parts) */
  latestMessages: string[];
  /** Callback when user taps to expand */
  onExpand: () => void;
  /** Whether the full chat sheet is open */
  isExpanded: boolean;
}

/**
 * In full-view mode, this shows the latest AI text at the top of the
 * content area. It's collapsible — tap to expand into a full chat
 * history (rendered as a bottom sheet or modal).
 *
 * Design:
 * - Shows 1-2 lines of the latest AI text, truncated with "..."
 * - Has a subtle expand chevron
 * - When expanded, renders the same OnboardingMessagesList (FlashList)
 *   in a bottom sheet, showing full chat history
 * - Collapsed by default after the user dismisses
 */
```

#### 2.2.5 PresentationContainer — Strategy Pattern

```typescript
// src/presentation/components/onboarding/PresentationContainer.tsx

interface PresentationContainerProps {
  mode: PresentationMode;
  messages: UIMessage[];
  activeSlide: { toolCallId: string; schema: Slide } | null;
  onSlideSubmit: (toolCallId: string, output: SlideOutput) => void;
  onSendMessage: (text: string) => void;
  status: ChatStatus;
  progress: ProgressInfo | null;
}

const PresentationContainer: React.FC<PresentationContainerProps> = ({
  mode, ...props
}) => {
  if (mode === 'full-view') {
    return <FullViewPresentation {...props} />;
  }
  return <InlinePresentation {...props} />;
};
```

This is a simple strategy switch at the container level. Both strategies receive the same props and use the same underlying `SlideRenderer`.

#### 2.2.6 How the FlashList Works in Each Mode

**Inline mode**: Unchanged from current architecture. The FlashList renders all messages and slides as a vertical list. Slides are full-width items.

**Full-view mode**: The FlashList is NOT used for the main content area. It is only rendered inside the `MiniChatBar`'s expanded sheet (for viewing chat history). The active slide is rendered directly, outside any list.

This means the `OnboardingMessagesList` component is reused in both modes but in different contexts:
- Inline mode: primary content area
- Full-view mode: inside an expandable sheet (for chat history viewing)

#### 2.2.7 Transitions Between Modes

If the flow config allows per-step overrides, a transition from inline to full-view (or vice versa) can happen mid-flow:

```
Step 1 (inline) → Step 2 (full-view) → Step 3 (inline)
```

**Transition animation**: When switching from inline to full-view, the FlashList fades out and the `ActiveSlideArea` fades in (and vice versa). This is a layout transition handled by Reanimated's `LayoutAnimation` or a shared element transition.

**Recommendation**: For the MVP, support per-flow mode only (no mid-flow switching). Per-step overrides add complexity to transitions and can be added later. The architecture supports it, but the implementation can be deferred.

#### 2.2.8 Schema Changes Summary

```typescript
// NEW: Add to SlideMetadataSchema
const SlideMetadataSchema = z.object({
  stepId: z.string().optional(),
  stepIndex: z.number().optional(),
  totalSteps: z.number().optional(),
  canGoBack: z.boolean().optional(),
  autoAdvance: z.boolean().optional(),
  // NEW
  presentationMode: PresentationModeSchema.optional(), // per-slide override hint
});

// NEW: Add to FlowConfig (system prompt / server config)
const FlowConfigSchema = z.object({
  productName: z.string(),
  steps: z.array(StepConfigSchema),
  // NEW
  presentationMode: PresentationModeSchema.default('inline'),
});

const StepConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  goal: z.string(),
  required: z.boolean(),
  dependsOn: z.array(z.string()).optional(),
  fields: z.record(z.string(), z.unknown()),
  // NEW
  presentationMode: PresentationModeSchema.optional(),
});
```

#### 2.2.9 Redux State Changes

```typescript
// Add to OnboardingState
interface OnboardingState {
  // ... existing fields ...

  // NEW: Presentation mode
  presentationMode: PresentationMode;        // resolved mode for current step
  flowPresentationMode: PresentationMode;    // flow-level default

  // NEW: Mini chat state (full-view mode only)
  miniChatExpanded: boolean;
}
```

#### 2.2.10 Tradeoffs and Risks

| Tradeoff | Inline Mode | Full-View Mode |
|----------|------------|----------------|
| Conversation context | Always visible (scroll up) | Hidden behind MiniChatBar (extra tap) |
| AI text + slide mixing | Natural — interleaved in list | Requires MiniChatBar overlay |
| Previous slide viewing | Scroll up | Must expand chat history sheet |
| Implementation complexity | Low (current architecture) | Medium (new container, transitions) |
| Slide focus | Competes with chat messages for attention | Full attention on slide content |
| Accessibility | Standard list a11y | Need custom focus management for view switch |

**Risk: MiniChatBar discoverability** — Users may not realize there's chat context behind the MiniChatBar. Mitigation: Auto-expand briefly when AI sends a text message, then collapse after a delay.

**Risk: Transition jank** — Switching between FlashList and ActiveSlideArea mid-flow could cause layout thrashing. Mitigation: Use Reanimated layout animations, and defer per-step mode switching to post-MVP.

---

## 3. NEW-2: Step Rollback

### 3.1 Analysis of Current Architecture

The current architecture's approach to "going back" (Section 5.5) is:

1. **Visual back**: Scroll up in FlashList to see previous slides in read-only mode
2. **Edit back**: User asks the AI via free-text ("I want to change my business type"), AI re-renders the slide

This approach has significant limitations for true rollback:

- **No data deletion**: The old response is still in conversation history. The AI has already processed it and may have made downstream decisions based on it.
- **No cascading invalidation**: If step 3 depended on step 2's data, changing step 2 doesn't automatically invalidate step 3.
- **Ambiguous conversation history**: After an "edit," the conversation contains both the original and edited responses. The AI sees a confusing history.
- **`mark_step_complete` is irreversible**: Once called, the step data is persisted server-side. There's no `undo_step` mechanism.

### 3.2 Data Model Design

#### 3.2.1 Decision: Hybrid Model (Step Records + Messages)

The conversation messages (AI SDK's `UIMessage[]`) are the **transport** — they carry tool calls and responses in the streaming protocol. But they are not the right place to store **structured step data** for rollback.

Reasons:
- Messages are append-only (the AI SDK doesn't support deleting/editing messages cleanly)
- A "step" may span multiple messages (AI text → `render_slide` → user submits → AI calls `mark_step_complete` → AI text)
- Rollback needs to operate on the step as a unit, not individual messages
- The AI needs a clean summary of "current valid step data" — not a message log with deletions

**Proposal**: Introduce a `StepRecord` model that sits alongside the message history.

```typescript
// ============================================================================
// src/store/onboarding/schemas/stepRecord.ts
// ============================================================================

import { z } from 'zod';
import { SlideSchema } from './blocks';

const StepRecordStatusSchema = z.enum([
  'pending',      // step is in the flow but not yet presented
  'active',       // slide is currently displayed, awaiting user input
  'completed',    // user submitted, AI called mark_step_complete
  'rolled_back',  // user rolled back this step — data cleared
  'invalidated',  // cascading invalidation from a dependency rollback
]);

const StepRecordSchema = z.object({
  stepId: z.string(),
  status: StepRecordStatusSchema,

  // The slide schema that was rendered for this step
  slideSchema: SlideSchema.optional(),    // null if pending or rolled back
  toolCallId: z.string().optional(),      // links to the message tool call

  // The user's response data
  responseData: z.record(z.string(), z.unknown()).optional(),
  responseAction: z.enum(['submit', 'skip', 'back']).optional(),

  // Metadata
  completedAt: z.string().optional(),     // ISO timestamp
  rolledBackAt: z.string().optional(),    // ISO timestamp
  version: z.number().default(1),         // increments on re-completion after rollback

  // Source of the response (for logging/debugging)
  responseSource: z.enum([
    'slide',       // user filled out the slide form
    'free_text',   // AI extracted data from free-form text
    'voice',       // AI transcribed from voice input
    'rollback',    // data cleared by rollback
  ]).optional(),
});

type StepRecord = z.infer<typeof StepRecordSchema>;

// The step registry: all steps in the flow with their current state
const StepRegistrySchema = z.record(z.string(), StepRecordSchema);
type StepRegistry = z.infer<typeof StepRegistrySchema>;

export {
  StepRecordStatusSchema,
  StepRecordSchema,
  StepRegistrySchema,
};
export type { StepRecord, StepRegistry };
```

#### 3.2.2 Step Record Lifecycle

```
                        ┌───────────────────────────────┐
                        │                               │
  pending ──────▶ active ──────▶ completed ──────▶ rolled_back ──┐
                   ▲                                     │       │
                   │                                     │       │
                   └─────────────────────────────────────┘       │
                          (re-activate after rollback)           │
                                                                 │
                                                                 ▼
                                                          (re-enter active
                                                           when AI re-presents)
                                                           
  Cascading invalidation:
  completed ──────▶ invalidated ──────▶ pending
                     (when a dependency is rolled back)
```

#### 3.2.3 Relationship Between StepRecords and Messages

```
Messages (AI SDK)                    StepRecords (Redux)
─────────────────                    ───────────────────

msg[0]: AI text "Welcome!"          (no step record — just chat)

msg[1]: AI tool-call render_slide    step["business_type"] = {
  toolCallId: "tc_1"                   status: "active",
  args: { header: "About..." }         slideSchema: {...},
                                       toolCallId: "tc_1",
msg[2]: User tool-result               responseData: { biz: "ecommerce" },
  toolCallId: "tc_1"                   status: "completed",
  output: { values: {biz: "ecom"} }   completedAt: "2026-02-28T...",
                                     }
msg[3]: AI tool-call mark_step
  args: { stepId: "business_type" }

msg[4]: AI text "Great!"            (no step record — just chat)

msg[5]: AI tool-call render_slide    step["team_size"] = {
  toolCallId: "tc_2"                   status: "active",
  ...                                  ...
                                     }
```

The step records are **derived from** messages but maintained **independently**. When the AI calls `render_slide`, we create/update a step record. When the AI calls `mark_step_complete`, we mark it completed. When the user rolls back, we update the step record — and we modify the conversation context sent to the AI.

### 3.3 Rollback Mechanics

#### 3.3.1 New Tool: `undo_step`

```typescript
// Add to onboardingTools

undo_step: tool({
  description: `Undo a previously completed onboarding step.
  This clears the step's collected data and marks it for re-collection.
  Use this when the user wants to change a previous answer.
  After calling this, you should re-present the step with render_slide.`,
  inputSchema: z.object({
    stepId: z.string(),
    reason: z.string().optional(), // why the rollback happened
  }),
  execute: async ({ stepId, reason }) => {
    // Server-side: mark step as rolled back in DB
    // Also invalidate any dependent steps
    return {
      rolledBack: true,
      stepId,
      invalidatedSteps: [], // list of step IDs that were cascading-invalidated
    };
  },
  providerOptions: {
    openai: { strict: true },
  },
}),
```

**Result schema** for `undo_step`:

```typescript
const UndoStepResultSchema = z.object({
  rolledBack: z.boolean(),
  stepId: z.string(),
  invalidatedSteps: z.array(z.string()),
});
```

#### 3.3.2 Rollback Flow (User-Initiated)

```
USER                    CLIENT                  AI                   SERVER
 │                        │                      │                     │
 │  Tap "Change" on       │                      │                     │
 │  step "business_type"  │                      │                     │
 │───────────────────────▶│                      │                     │
 │                        │                      │                     │
 │                        │  sendMessage(         │                     │
 │                        │   "I want to change   │                     │
 │                        │    my business type"   │                     │
 │                        │  )                    │                     │
 │                        │  + context: {          │                     │
 │                        │    rollbackRequest:    │                     │
 │                        │    "business_type"     │                     │
 │                        │  }                    │                     │
 │                        │──────────────────────▶│                     │
 │                        │                       │                     │
 │                        │                       │  AI decides to      │
 │                        │                       │  undo the step:     │
 │                        │                       │                     │
 │                        │                       │  tool: undo_step    │
 │                        │                       │  { stepId:          │
 │                        │                       │    "business_type"} │
 │                        │                       │────────────────────▶│
 │                        │                       │                     │
 │                        │                       │  result: {          │
 │                        │                       │    rolledBack: true │
 │                        │                       │    invalidated:     │
 │                        │                       │    ["team_size"]    │
 │                        │                       │  }                  │
 │                        │                       │◀────────────────────│
 │                        │                       │                     │
 │                        │  SSE: text            │                     │
 │                        │  "Sure! I see you     │                     │
 │                        │  want to change your   │                     │
 │                        │  business type. This   │                     │
 │                        │  will also reset your  │                     │
 │                        │  team size answer..."  │                     │
 │                        │◀──────────────────────│                     │
 │                        │                       │                     │
 │                        │  SSE: tool-call       │                     │
 │                        │  render_slide(         │                     │
 │                        │    business_type slide │                     │
 │                        │    with previous value │                     │
 │                        │    as defaultValue)    │                     │
 │                        │◀──────────────────────│                     │
 │  See slide with        │                       │                     │
 │  previous selection    │                       │                     │
 │  pre-filled            │                       │                     │
 │◀───────────────────────│                       │                     │
```

#### 3.3.3 Rollback and AI Conversation History

This is the most nuanced part. The AI's conversation history contains all the old tool calls and results. If we don't handle this, the AI will be confused by seeing two different responses for the same step.

**Approach: "Rollback summary" injection**

Instead of deleting or trimming messages (which breaks the AI SDK's message model and confuses context), we inject a system-level summary when constructing the messages for the next AI request:

```typescript
// When building messages for the AI after a rollback:

function buildMessagesWithRollbackContext(
  messages: UIMessage[],
  stepRegistry: StepRegistry,
): UIMessage[] {
  // Find all rolled-back/invalidated steps
  const rolledBackSteps = Object.values(stepRegistry)
    .filter(s => s.status === 'rolled_back' || s.status === 'invalidated');

  if (rolledBackSteps.length === 0) return messages;

  // Inject a system message summarizing the current valid state
  const validSteps = Object.values(stepRegistry)
    .filter(s => s.status === 'completed');

  const rollbackSummary: UIMessage = {
    role: 'system',
    content: `
ROLLBACK NOTICE: The following steps have been rolled back and their data is no longer valid:
${rolledBackSteps.map(s => `- ${s.stepId} (was: ${JSON.stringify(s.responseData)})`).join('\n')}

Current valid collected data:
${validSteps.map(s => `- ${s.stepId}: ${JSON.stringify(s.responseData)}`).join('\n')}

Please re-collect data for the rolled-back steps. Do not reference the old data from these steps.
    `.trim(),
  };

  // Insert the summary before the latest user message
  const result = [...messages];
  result.splice(result.length - 1, 0, rollbackSummary);
  return result;
}
```

**Why not trim/delete messages?**

- The AI SDK `useChat` manages the message array internally. Mutating it externally causes state desynchronization.
- Deleting tool-call messages without their results creates invalid conversation structure (orphaned tool results).
- The `sendAutomaticallyWhen` and message-merge logic depends on message ordering.
- Injecting a system message is clean, additive, and doesn't break any invariants.

**Alternative considered: Conversation forking**

Start a new conversation from scratch, replaying only the valid step data as a summary. This would give the AI a completely clean context. However:
- Loses conversational nuance (tone, user preferences expressed in free text)
- Requires a new session ID (breaks resume-from-checkpoint)
- More expensive (new conversation = no KV cache reuse)

**Recommendation**: Use the injection approach for MVP. Consider conversation forking as an optimization if context gets too long after many rollbacks.

#### 3.3.4 Cascading Rollback

Steps can have dependencies (defined in `FlowConfig.steps[].dependsOn`). Rolling back step B should invalidate step C if C depends on B.

```typescript
// Cascading invalidation logic (server-side in undo_step execute)

function computeCascadingInvalidation(
  stepId: string,
  flowConfig: FlowConfig,
  stepRegistry: StepRegistry,
): string[] {
  const invalidated: string[] = [];
  const queue = [stepId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    // Find all steps that depend on `current`
    for (const step of flowConfig.steps) {
      if (
        step.dependsOn?.includes(current) &&
        stepRegistry[step.id]?.status === 'completed'
      ) {
        invalidated.push(step.id);
        queue.push(step.id); // Check transitive dependencies
      }
    }
  }

  return invalidated;
}
```

The `undo_step` tool returns the list of invalidated steps. The AI then decides how to handle them:
- Re-present them in order
- Skip them if they're optional and the user wants to move fast
- Combine them if the context allows

#### 3.3.5 Client UI for Rollback

**Inline mode (Mode A)**:

Each completed slide renders with a subtle "Edit" button in the top-right corner. Tapping it sends a rollback request message. The new slide appears at the bottom of the list (the old one stays in history, grayed out with a "Changed" label).

```
┌─────────────────────────────────────┐
│ [SLIDE: business_type] (completed)  │ ← grayed out, "Changed" label
│ ○ E-commerce ✓                      │
│ ○ SaaS                              │
│                          [Changed]  │
└─────────────────────────────────────┘
... other messages ...
┌─────────────────────────────────────┐
│ [SLIDE: business_type] (active)     │ ← new slide at bottom, editable
│ ○ E-commerce (pre-selected)         │
│ ○ SaaS                              │
│ ○ Services                          │
│ ○ Other                             │
│                [Continue] [Skip]    │
└─────────────────────────────────────┘
```

**Full-view mode (Mode B)**:

A "Back" affordance (button or swipe-back gesture) on the active slide triggers the rollback. The previous slide animates in from the left (or the rollback slide replaces the current one). This feels like navigating backward in a wizard.

```
┌─────────────────────────────────────┐
│  ← Back    Step 2 of 7     Close   │
│  ● ● ○ ○ ○ ○ ○                     │
├─────────────────────────────────────┤
│                                     │
│  "I see you want to change your     │
│   business type..."                 │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ What type of business?          ││
│  │ ○ E-commerce (pre-selected)     ││
│  │ ○ SaaS                          ││
│  │ ○ Services                      ││
│  │ ○ Other                         ││
│  │                                 ││
│  │ [Continue]  [Skip]              ││
│  └─────────────────────────────────┘│
│                                     │
├─────────────────────────────────────┤
│  [Type a message...        ] [Send] │
└─────────────────────────────────────┘
```

#### 3.3.6 Redux State Changes

```typescript
interface OnboardingState {
  // ... existing fields ...

  // CHANGED: Replace simple completedSteps with step registry
  // OLD:
  // completedSteps: Record<string, { stepId: string; completedAt: string; data: Record<string, unknown> }>;
  // NEW:
  stepRegistry: StepRegistry;

  // NEW: Rollback state
  rollbackInProgress: boolean;
  lastRollbackStepId: string | null;
}
```

#### 3.3.7 State Machine Changes

Add two new transitions to the flow state diagram:

```
                                  ┌──────────────────────────────────────────────────┐
                                  │                                                  │
  ┌─────────┐    ┌───────────┐   │  ┌────────────┐    ┌─────────────┐              │
  │  IDLE   │───▶│ AWAITING  │───┘  │ COLLECTING │───▶│  SUBMITTING │──────────────┘
  │         │    │  _SLIDE    │◀────│            │    │             │
  └─────────┘    └───────────┘     └─────┬──────┘    └──────┬──────┘
       │              ▲                   │                   │
       │              │                   │ back              │ error
       │              │                   ▼                   ▼
       │              │            ┌────────────┐    ┌─────────────┐
       │              │            │  REVIEWING │    │   ERROR     │
       │              │            └────────────┘    └─────────────┘
       │              │
       │              │  ┌─────────────────┐
       │              └──│  ROLLING_BACK   │  ← NEW STATE
       │                 │  (AI processing │
       │                 │   undo_step)    │
       │                 └─────────────────┘
       │                        ▲
       │                        │ rollback triggered
       │                        │ (from COLLECTING or REVIEWING)
       │
       │    ┌──────────────┐
       └───▶│  COMPLETED   │
            └──────────────┘
```

New state:
- **ROLLING_BACK**: A rollback has been requested. The AI is processing the `undo_step` tool call. The UI shows a loading state or keeps the current view. When the AI responds with a new `render_slide`, transitions to AWAITING_SLIDE.

#### 3.3.8 Tradeoffs and Risks

**Risk: AI divergence after rollback** — Since the AI is generative, the steps after a rollback may be completely different from the original sequence. The user might be confused if they roll back step 2 and step 3 disappears (because it was invalidated) but a different step 3 appears. Mitigation: The AI should acknowledge the change explicitly in its text response.

**Risk: Conversation length** — Each rollback adds messages (rollback request, undo_step, re-rendered slide). After several rollbacks, the conversation history grows significantly, potentially exceeding context window limits. Mitigation: Use the summary injection approach (which is compact) and consider conversation compaction after N rollbacks.

**Risk: Server-side data consistency** — `mark_step_complete` persists data, and `undo_step` must reverse it. If the server-side handler for `undo_step` fails, the client and server are out of sync. Mitigation: Return the server's actual step state in the `undo_step` result so the client can reconcile.

**Risk: Step version conflicts** — If the user completes step 2, rolls back, re-completes with different data, then the server has version 1 and version 2. Need to ensure `mark_step_complete` overwrites (not appends). The `version` field on `StepRecord` tracks this.

---

## 4. NEW-3: Static vs Dynamic Steps

### 4.1 Analysis of Current Architecture

The current architecture assumes all steps are dynamic:

- Section 6.2: The system prompt lists steps with goals, and the AI decides what blocks to render
- Section 3: `render_slide` is a client-side tool — the AI generates the full slide schema at runtime
- Section 4: The AI composes blocks freely (limited only by the Zod schema)

There is no concept of "the developer predefined this slide's layout." Every slide's schema comes from the LLM.

### 4.2 Step Type Taxonomy

```
┌────────────────────────────────────────────────────────────────┐
│                         Step Types                             │
├──────────────────┬──────────────────┬─────────────────────────┤
│  STATIC          │  SEMI-STATIC     │  DYNAMIC                │
│                  │                  │                         │
│  Schema: fixed   │  Schema: fixed   │  Schema: AI-generated   │
│  Content: fixed  │  Content: AI     │  Content: AI-generated  │
│  AI role: none   │  AI role: fill   │  AI role: full compose  │
│  (except         │  in content      │                         │
│   mark_complete) │  within template │                         │
│                  │                  │                         │
│  Example:        │  Example:        │  Example:               │
│  "Accept ToS"    │  "Choose plan"   │  "Tell us about         │
│  checkbox with   │  where plan      │   your business"        │
│  exact legal     │  names come from │  where the AI decides   │
│  text            │  AI based on     │  what to ask based on   │
│                  │  context         │  conversation so far    │
└──────────────────┴──────────────────┴─────────────────────────┘
```

### 4.3 Design Proposal

#### 4.3.1 Flow Config Schema: Step Templates

Static and semi-static steps have a **template** — a predefined `SlideSchema` (or partial schema) embedded in the flow configuration.

```typescript
// ============================================================================
// src/store/onboarding/schemas/flowConfig.ts
// ============================================================================

import { z } from 'zod';
import { SlideSchema } from './blocks';

const StepTypeSchema = z.enum(['static', 'semi-static', 'dynamic']);

const StepConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  goal: z.string(),
  required: z.boolean().default(true),
  dependsOn: z.array(z.string()).optional(),
  fields: z.record(z.string(), z.unknown()).optional(),

  // NEW: Step type classification
  stepType: StepTypeSchema.default('dynamic'),

  // NEW: Template for static/semi-static steps
  // For 'static': the complete slide schema (AI must use exactly this)
  // For 'semi-static': a partial template with placeholder markers
  // For 'dynamic': not used (AI generates freely)
  template: SlideSchema.optional(),

  // NEW: For semi-static steps, which fields the AI can customize
  // Keys are JSONPath-like strings pointing to fields in the template
  // Example: ["blocks[0].options", "header", "blocks[1].placeholder"]
  aiCustomizableFields: z.array(z.string()).optional(),

  // NEW: Presentation mode override (from NEW-1)
  presentationMode: z.enum(['inline', 'full-view']).optional(),
});

const FlowConfigSchema = z.object({
  productName: z.string(),
  locale: z.string().optional(),
  presentationMode: z.enum(['inline', 'full-view']).default('inline'),
  steps: z.array(StepConfigSchema),
});

export { StepTypeSchema, StepConfigSchema, FlowConfigSchema };
export type StepType = z.infer<typeof StepTypeSchema>;
export type StepConfig = z.infer<typeof StepConfigSchema>;
export type FlowConfig = z.infer<typeof FlowConfigSchema>;
```

#### 4.3.2 Static Step Example

```typescript
const tosStep: StepConfig = {
  id: 'accept_tos',
  name: 'Terms of Service',
  goal: 'Get user to accept terms of service',
  required: true,
  stepType: 'static',
  template: {
    header: 'Terms of Service',
    subheader: 'Please review and accept our terms to continue.',
    blocks: [
      {
        type: 'info-card',
        id: 'tos_summary',
        title: 'What you\'re agreeing to',
        body: '- Your data is stored securely\n- You can delete your account at any time\n- We never sell your data to third parties',
        variant: 'info',
      },
      {
        type: 'toggle',
        id: 'accept_tos',
        label: 'I accept the Terms of Service and Privacy Policy',
        defaultValue: false,
      },
    ],
    actions: {
      primary: { label: 'Continue', action: 'submit' },
      secondary: { label: 'Read full terms', action: 'redirect', url: '/terms' },
    },
    metadata: {
      stepId: 'accept_tos',
      canGoBack: false,
    },
  },
};
```

#### 4.3.3 Semi-Static Step Example

```typescript
const planSelectionStep: StepConfig = {
  id: 'select_plan',
  name: 'Plan Selection',
  goal: 'Help user choose the right pricing plan',
  required: true,
  stepType: 'semi-static',
  template: {
    header: '{{AI_HEADER}}',                    // AI fills this
    subheader: '{{AI_SUBHEADER}}',              // AI fills this
    blocks: [
      {
        type: 'single-choice',
        id: 'plan',
        label: '{{AI_LABEL}}',                  // AI fills this
        options: '{{AI_OPTIONS}}' as any,        // AI generates options based on context
        layout: 'vertical',                      // fixed
        validation: { required: true },          // fixed
      },
    ],
    actions: {
      primary: { label: 'Select plan', action: 'submit' },    // fixed
      secondary: { label: 'Compare plans', action: 'skip' },  // fixed
    },
  },
  aiCustomizableFields: [
    'header',
    'subheader',
    'blocks[0].label',
    'blocks[0].options',
  ],
};
```

> **Note on the `{{AI_*}}` placeholders**: These are NOT rendered. They are markers in the template that tell the AI which fields to fill. The system prompt instructs the AI to replace them. The actual rendered schema must pass Zod validation (no placeholder strings).

#### 4.3.4 Rendering Path: Who Calls `render_slide`?

**Option A: AI always calls `render_slide`** (even for static steps)

The AI calls `render_slide` for every step. For static steps, the system prompt instructs it to use the exact template. For semi-static, it fills in the customizable fields.

Pros:
- Uniform rendering pipeline — client always receives slides via the same tool call
- AI can add conversational text before/after the slide
- No special client-side logic for different step types

Cons:
- **LLM compliance risk**: The AI might deviate from the static template. Even with `strict: true`, the AI could change the text content, option labels, or block ordering. `strict` only enforces JSON structure against the Zod schema, not the exact content values.
- More token usage for static slides (the AI has to produce the full schema even though it's predetermined)

**Option B: Client renders static slides directly (no tool call)**

For static steps, the client renders the template directly from the flow config. The AI never calls `render_slide` — instead, it just calls `mark_step_complete` or `update_progress`. The slide appears because the client knows (from the flow config) that this step has a static template.

Pros:
- **Perfect fidelity**: Static slides render exactly as defined, zero LLM deviation
- Faster rendering (no round-trip to AI for the slide schema)
- Lower token cost

Cons:
- Dual rendering paths (tool-call-based and config-based) — more complex client logic
- The AI can't precede the slide with contextual text (unless we add a separate mechanism)
- Breaks the "slides come from `render_slide` tool calls" invariant

**Option C (Recommended): AI calls `render_slide` with server-side enforcement**

The AI calls `render_slide` for all steps. For static and semi-static steps, the **server** intercepts the tool call and replaces/merges the AI's output with the template before streaming to the client.

```typescript
// Server-side middleware in the streaming pipeline

function enforceStaticTemplate(
  toolCall: ToolCall,
  stepConfig: StepConfig,
): ToolCall {
  if (stepConfig.stepType === 'static') {
    // Replace the entire slide schema with the template
    return {
      ...toolCall,
      args: stepConfig.template,
    };
  }

  if (stepConfig.stepType === 'semi-static') {
    // Merge: use template as base, overlay AI-generated fields
    const merged = deepMerge(stepConfig.template, {
      // Only copy AI-customizable fields from the tool call args
      ...pickFields(toolCall.args, stepConfig.aiCustomizableFields),
    });
    return {
      ...toolCall,
      args: merged,
    };
  }

  // Dynamic: pass through unchanged
  return toolCall;
}
```

Pros:
- Uniform client pipeline (all slides come from `render_slide`)
- Perfect fidelity for static slides (server enforces template)
- AI can still add conversational text before/after
- Semi-static gets the best of both worlds (structure from template, content from AI)

Cons:
- Server-side middleware adds complexity
- The AI's tool call args are partially discarded (could cause confusion if debugging)
- The server needs access to the flow config (already has it for system prompt building)

**Recommendation**: Option C. It keeps the client simple, ensures template fidelity, and handles the semi-static case elegantly. The server already builds the system prompt from the flow config, so it has the templates available.

#### 4.3.5 System Prompt Changes

The system prompt must communicate step types to the AI:

```typescript
function buildOnboardingSystemPrompt(flowConfig: FlowConfig): string {
  return `
You are an onboarding assistant for ${flowConfig.productName}.
...

## Available Steps

${flowConfig.steps.map((step, i) => {
  let stepSection = `
### Step ${i + 1}: ${step.name} (ID: ${step.id})
- Goal: ${step.goal}
- Required: ${step.required ? 'Yes' : 'No'}
- Type: ${step.stepType}
- Depends on: ${step.dependsOn?.join(', ') || 'None'}
`;
  
  if (step.stepType === 'static') {
    stepSection += `
- STATIC STEP: Call render_slide with the exact template below. Do NOT modify the schema.
  The server will enforce the template — your slide args will be replaced.
  You should still provide conversational text before showing this slide.
  Template: ${JSON.stringify(step.template, null, 2)}
`;
  }
  
  if (step.stepType === 'semi-static') {
    stepSection += `
- SEMI-STATIC STEP: Call render_slide using the template below as a base.
  You MUST keep the structure identical. You CAN customize these fields:
  ${step.aiCustomizableFields?.map(f => `  - ${f}`).join('\n')}
  Fill customizable fields based on the user's context and locale.
  Template: ${JSON.stringify(step.template, null, 2)}
`;
  }
  
  if (step.stepType === 'dynamic') {
    stepSection += `
- DYNAMIC STEP: Compose the slide freely using render_slide.
  Use the block types that best serve the goal.
  Data to collect: ${JSON.stringify(step.fields)}
`;
  }
  
  return stepSection;
}).join('\n')}

## Rules
...
`;
}
```

#### 4.3.6 Does the AI Know About Enforcement?

Yes. The system prompt tells the AI that static templates are enforced server-side. This prevents the AI from "trying hard" to match the template exactly (wasting tokens) — it can just call `render_slide` with approximate args, and the server will fix it.

For semi-static steps, the AI should focus on generating high-quality content for the customizable fields. The system prompt lists which fields are customizable.

#### 4.3.7 Client-Side Changes

Minimal. The client doesn't need to know whether a step is static, semi-static, or dynamic. It always receives a validated `SlideSchema` from `render_slide` and renders it the same way.

The only client-side addition is storing the step type in the `StepRecord`:

```typescript
const StepRecordSchema = z.object({
  // ... existing fields ...

  // NEW: Step type (for debugging/logging, not rendering logic)
  stepType: StepTypeSchema.optional(),
});
```

#### 4.3.8 The Semi-Static Merge Algorithm

```typescript
// Server-side utility

function mergeWithTemplate(
  template: Slide,
  aiArgs: Slide,
  customizableFields: string[],
): Slide {
  // Start with the template as the base
  const result = structuredClone(template);

  for (const fieldPath of customizableFields) {
    const aiValue = getByPath(aiArgs, fieldPath);
    if (aiValue !== undefined) {
      setByPath(result, fieldPath, aiValue);
    }
    // If AI didn't provide a value for a customizable field,
    // keep the template's default (or placeholder)
  }

  // Validate the merged result
  const parsed = SlideSchema.safeParse(result);
  if (!parsed.success) {
    // Merge produced invalid schema — fall back to template only
    console.warn('Semi-static merge failed validation, using template', parsed.error);
    return template;
  }

  return parsed.data;
}
```

The `getByPath` / `setByPath` utilities handle JSONPath-like access:
- `"header"` → `result.header`
- `"blocks[0].options"` → `result.blocks[0].options`
- `"blocks[1].placeholder"` → `result.blocks[1].placeholder`

#### 4.3.9 Tradeoffs and Risks

**Risk: Template staleness** — Static templates are hardcoded. If the product changes (new plan names, updated ToS text), the templates must be updated in the flow config. This is a configuration change, not a code change, but it requires a deploy/update pipeline.

**Risk: Semi-static merge complexity** — The JSONPath-based field customization is powerful but fragile. If the template structure changes, the `aiCustomizableFields` paths may break. Mitigation: Validate paths at flow config load time.

**Risk: AI ignoring step type** — Even with the system prompt, the AI might try to "improve" a static slide. The server-side enforcement is the safety net, but it means the AI wastes tokens generating args that are discarded. Mitigation: Keep static templates short in the system prompt (show the template ID, not the full JSON) so the AI doesn't try to reproduce it.

**Risk: Token cost for templates in system prompt** — Including full template JSON in the system prompt uses tokens. For flows with many static steps, this could be significant. Mitigation: For static steps, the system prompt could reference the template by ID only. The server fills it in without the AI needing the details.

**Optimization opportunity**: For static steps, the system prompt only says "Call `render_slide` for step ID `accept_tos`. The server will provide the exact slide content." The AI's render_slide call can have minimal args (just the step ID), and the server replaces everything. This minimizes token waste.

```typescript
// Optimized system prompt for static steps
`
### Step 3: Terms of Service (ID: accept_tos)
- Type: STATIC — Call render_slide with stepId "accept_tos" in metadata.
  The server provides the slide content. Do NOT generate blocks.
  Just provide a header (it will be overridden) and an empty blocks array.
  Focus on your conversational text before the slide.
`
```

---

## 5. Cross-Cutting Concerns

### 5.1 How NEW-1, NEW-2, and NEW-3 Interact

```
┌───────────────────────────────────────────────────────────────────┐
│                      Flow Config                                  │
│  presentationMode: "full-view" ← NEW-1                           │
│  steps: [                                                        │
│    { id: "tos", stepType: "static", template: {...} } ← NEW-3   │
│    { id: "biz", stepType: "dynamic" }                 ← NEW-3   │
│    { id: "plan", stepType: "semi-static", ... }       ← NEW-3   │
│  ]                                                               │
└──────────────┬────────────────────────────────────────────────────┘
               │
               ▼
┌───────────────────────────────────────────────────────────────────┐
│                    Server Pipeline                                │
│                                                                   │
│  1. Build system prompt with step types ← NEW-3                  │
│  2. AI calls render_slide                                        │
│  3. Server enforces template (if static/semi-static) ← NEW-3    │
│  4. Stream to client                                             │
│  5. If undo_step called, compute cascading invalidation ← NEW-2  │
└──────────────┬────────────────────────────────────────────────────┘
               │
               ▼
┌───────────────────────────────────────────────────────────────────┐
│                    Client Pipeline                                │
│                                                                   │
│  1. PresentationContainer selects mode ← NEW-1                   │
│  2. SlideRenderer renders slide (same for all modes/types)       │
│  3. StepRegistry tracks step state ← NEW-2                       │
│  4. Rollback UI affordance available on completed slides ← NEW-2 │
│  5. Rollback injects context summary into messages ← NEW-2       │
└───────────────────────────────────────────────────────────────────┘
```

**Key interaction**: A static step in full-view mode with rollback support. This should "just work" because:
- Static step → server enforces template → client receives a normal `SlideSchema`
- Full-view mode → `PresentationContainer` renders it in `ActiveSlideArea`
- Rollback → user taps "Back" on the full-view slide → `undo_step` → AI re-renders (server re-enforces template)

### 5.2 Combined Schema Changes

All new and modified schemas in one view:

```typescript
// ============================================================================
// NEW FILE: src/store/onboarding/schemas/flowConfig.ts
// ============================================================================

import { z } from 'zod';
import { SlideSchema } from './blocks';

export const PresentationModeSchema = z.enum(['inline', 'full-view']);
export const StepTypeSchema = z.enum(['static', 'semi-static', 'dynamic']);

export const StepConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  goal: z.string(),
  required: z.boolean().default(true),
  dependsOn: z.array(z.string()).optional(),
  fields: z.record(z.string(), z.unknown()).optional(),
  stepType: StepTypeSchema.default('dynamic'),
  template: SlideSchema.optional(),
  aiCustomizableFields: z.array(z.string()).optional(),
  presentationMode: PresentationModeSchema.optional(),
});

export const FlowConfigSchema = z.object({
  productName: z.string(),
  locale: z.string().optional(),
  presentationMode: PresentationModeSchema.default('inline'),
  steps: z.array(StepConfigSchema),
});

export type PresentationMode = z.infer<typeof PresentationModeSchema>;
export type StepType = z.infer<typeof StepTypeSchema>;
export type StepConfig = z.infer<typeof StepConfigSchema>;
export type FlowConfig = z.infer<typeof FlowConfigSchema>;


// ============================================================================
// NEW FILE: src/store/onboarding/schemas/stepRecord.ts
// ============================================================================

import { z } from 'zod';
import { SlideSchema } from './blocks';
import { StepTypeSchema } from './flowConfig';

export const StepRecordStatusSchema = z.enum([
  'pending',
  'active',
  'completed',
  'rolled_back',
  'invalidated',
]);

export const StepRecordSchema = z.object({
  stepId: z.string(),
  status: StepRecordStatusSchema,
  stepType: StepTypeSchema.optional(),
  slideSchema: SlideSchema.optional(),
  toolCallId: z.string().optional(),
  responseData: z.record(z.string(), z.unknown()).optional(),
  responseAction: z.enum(['submit', 'skip', 'back']).optional(),
  completedAt: z.string().optional(),
  rolledBackAt: z.string().optional(),
  version: z.number().default(1),
  responseSource: z.enum(['slide', 'free_text', 'voice', 'rollback']).optional(),
});

export const StepRegistrySchema = z.record(z.string(), StepRecordSchema);

export type StepRecordStatus = z.infer<typeof StepRecordStatusSchema>;
export type StepRecord = z.infer<typeof StepRecordSchema>;
export type StepRegistry = z.infer<typeof StepRegistrySchema>;


// ============================================================================
// MODIFIED: src/store/onboarding/schemas/blocks.ts — SlideMetadataSchema
// ============================================================================

// Add to existing SlideMetadataSchema:
const SlideMetadataSchema = z.object({
  stepId: z.string().optional(),
  stepIndex: z.number().optional(),
  totalSteps: z.number().optional(),
  canGoBack: z.boolean().optional(),
  autoAdvance: z.boolean().optional(),
  // NEW fields:
  presentationMode: z.enum(['inline', 'full-view']).optional(),  // NEW-1
  stepType: z.enum(['static', 'semi-static', 'dynamic']).optional(), // NEW-3
});
```

### 5.3 Combined Tool Taxonomy

Updated tool table:

| Tool | Purpose | New? | Input Schema | Output Schema |
|------|---------|------|-------------|---------------|
| `render_slide` | Display a structured slide | Existing | `SlideSchema` | `SlideOutputSchema` |
| `update_progress` | Update progress indicator | Existing | `ProgressSchema` | `{ acknowledged }` |
| `mark_step_complete` | Record step completion | Existing | `{ stepId, data }` | `{ saved, stepId }` |
| `finish_onboarding` | Complete the flow | Existing | `{ summary }` | `{ completed }` |
| `undo_step` | Roll back a step | **NEW** (NEW-2) | `{ stepId, reason? }` | `UndoStepResultSchema` |

### 5.4 Combined Redux State

```typescript
interface OnboardingState {
  // Flow state
  flowId: string | null;
  flowStatus: 'idle' | 'active' | 'completed' | 'error';

  // NEW-1: Presentation mode
  flowPresentationMode: PresentationMode;     // flow-level default
  activePresentationMode: PresentationMode;   // resolved for current step
  miniChatExpanded: boolean;                  // full-view mode only

  // NEW-2: Step registry (replaces completedSteps)
  stepRegistry: StepRegistry;
  currentStepId: string | null;
  rollbackInProgress: boolean;
  lastRollbackStepId: string | null;

  // Slide state
  activeSlide: {
    toolCallId: string;
    schema: Slide;
    formValues: Record<string, unknown>;
    submitted: boolean;
  } | null;

  // Progress (from update_progress tool)
  progress: {
    currentStep: number;
    totalSteps: number;
    stepLabel?: string;
  } | null;

  // Persistence
  lastSavedAt: string | null;
  resumeData: {
    conversationId: string;
    lastMessageId: string;
  } | null;
}
```

### 5.5 New Component Count Estimate

| Component | Req | New/Modified | Lines (est.) |
|-----------|-----|-------------|-------------|
| `PresentationContainer` | NEW-1 | New | ~60 |
| `InlinePresentation` | NEW-1 | New (extract from current) | ~100 |
| `FullViewPresentation` | NEW-1 | New | ~200 |
| `ActiveSlideArea` | NEW-1 | New | ~80 |
| `MiniChatBar` | NEW-1 | New | ~120 |
| `SlideNavigationControls` | NEW-1 | New | ~60 |
| `StepRollbackButton` | NEW-2 | New | ~40 |
| `RolledBackSlideOverlay` | NEW-2 | New | ~50 |
| `flowConfig.ts` schema | NEW-3 | New | ~80 |
| `stepRecord.ts` schema | NEW-2 | New | ~60 |
| `OnboardingScreen` | ALL | Modified | +30 |
| `onboardingSlice.ts` | ALL | Modified | +100 |
| `useOnboardingChat.ts` | NEW-2 | Modified | +50 |
| System prompt builder | NEW-3 | Modified (server) | +80 |
| Template enforcement middleware | NEW-3 | New (server) | ~100 |
| **Total new/modified** | | | **~1,210** |

Added to the base estimate of ~2,250 lines, the total MVP with all three requirements is approximately **~3,460 lines** across **~35 files**.

---

## 6. Migration Path from Current Architecture

All three requirements are **additive** — they extend the architecture, they don't replace it. The migration is:

### Phase 3a: Implement Base Architecture (as designed)
Build the current architecture as-is: inline mode, no rollback, all dynamic steps. This gives a working prototype.

### Phase 3b: Add NEW-3 (Static/Dynamic Steps)
Lowest risk, highest independence. Add the `FlowConfig` schema, step types, system prompt changes, and server-side template enforcement. The client pipeline is unchanged.

### Phase 3c: Add NEW-2 (Step Rollback)
Add the `StepRecord` model, `undo_step` tool, rollback UI, and conversation context injection. This modifies the state model (replaces `completedSteps` with `stepRegistry`).

### Phase 3d: Add NEW-1 (Dual Presentation Modes)
Highest effort, most visual. Extract the current inline rendering into `InlinePresentation`, build `FullViewPresentation`, add `PresentationContainer`. This is a refactor of the component tree but doesn't change data flow.

**Why this order**: 3b and 3c modify the data model and server pipeline (harder to change later). 3d is a UI refactor (easier to change, visual, good for iteration). Starting with 3b/3c ensures the data foundations are right before building the visual layer.

---

## 7. Risk Summary

| Risk | Likelihood | Impact | Mitigation | Req |
|------|-----------|--------|------------|-----|
| MiniChatBar discoverability | Medium | Medium | Auto-expand on AI text, visual cues | NEW-1 |
| Mode transition jank | Medium | Low | Defer per-step overrides to post-MVP | NEW-1 |
| AI divergence after rollback | High | Medium | Explicit AI acknowledgment, context summary | NEW-2 |
| Conversation length after rollbacks | Medium | High | Summary injection, conversation compaction | NEW-2 |
| Server-client data sync on undo | Low | High | Return server state in undo_step result | NEW-2 |
| LLM deviating from static templates | High | Low | Server-side enforcement (Option C) | NEW-3 |
| Template staleness | Low | Medium | Config update pipeline | NEW-3 |
| Semi-static merge edge cases | Medium | Low | Validation + template fallback | NEW-3 |
| Token cost for templates in prompt | Low | Low | Optimize prompt for static steps | NEW-3 |
| Combined complexity of all 3 requirements | Medium | High | Phased implementation (3a → 3b → 3c → 3d) | ALL |

---

## 8. Decision Log

| # | Decision | Rationale | Alternatives Considered |
|---|----------|-----------|------------------------|
| D1 | Presentation mode is per-flow (default) with per-step override (optional) | A/B testing at flow level; some steps suit one mode better | Per-block (too granular), global only (too restrictive) |
| D2 | Full-view mode uses MiniChatBar for AI text | Keeps slide focused; chat is secondary in full-view | Inline overlay (cluttered), separate chat screen (loses context), no AI text in full-view (loses conversational feel) |
| D3 | FlashList not used in full-view mode | Full-view = one active slide, not a list | Use FlashList with single-item (unnecessary abstraction) |
| D4 | Step rollback uses hybrid model (StepRegistry + Messages) | StepRecords give clean rollback unit; messages are transport | Messages-only (hard to rollback), StepRecords-only (loses conversation context) |
| D5 | Rollback injects context summary, does not delete messages | Preserves AI SDK message model; clean and additive | Delete messages (breaks SDK), conversation forking (expensive, loses nuance) |
| D6 | New `undo_step` tool for rollback | Server needs to undo `mark_step_complete`; cascading invalidation computed server-side | Client-only rollback (no server sync), implicit rollback via re-rendering (no data cleanup) |
| D7 | Static step rendering uses server-side template enforcement (Option C) | Uniform client pipeline, perfect fidelity, handles semi-static elegantly | AI-only with instructions (LLM may deviate), client-side rendering from config (dual rendering paths) |
| D8 | Semi-static uses JSONPath-based field customization | Expressive enough for common cases; template provides structure | Free-form AI with validation (loses structure control), slot-based system (more complex schema) |
| D9 | Phased implementation: base → static/dynamic → rollback → dual modes | Data model changes first, UI refactor last; each phase is independently valuable | All at once (too risky), different ordering (rollback needs step registry, which needs step types) |

---

## Appendix A: File Impact Matrix

| File | NEW-1 | NEW-2 | NEW-3 | Change Type |
|------|-------|-------|-------|-------------|
| `schemas/blocks.ts` | Modify (metadata) | — | Modify (metadata) | Add fields to `SlideMetadataSchema` |
| `schemas/flowConfig.ts` | — | — | **New** | Step types, templates, flow config |
| `schemas/stepRecord.ts` | — | **New** | — | Step registry data model |
| `onboardingSlice.ts` | Modify | Modify | — | Add presentation mode + step registry |
| `OnboardingScreen.tsx` | Modify | — | — | Use `PresentationContainer` |
| `PresentationContainer.tsx` | **New** | — | — | Strategy pattern switch |
| `InlinePresentation.tsx` | **New** (extract) | — | — | Current inline logic |
| `FullViewPresentation.tsx` | **New** | — | — | Full-view container |
| `ActiveSlideArea.tsx` | **New** | — | — | Full-view slide host |
| `MiniChatBar.tsx` | **New** | — | — | Collapsed chat in full-view |
| `SlideRenderer.tsx` | — | Modify | — | Rollback state display |
| `useOnboardingChat.ts` | — | Modify | — | Rollback context injection |
| `useOnboardingFlow.ts` | Modify | Modify | — | Step registry management |
| Server: system prompt builder | — | — | Modify | Step types in prompt |
| Server: template enforcement | — | — | **New** | Middleware for static steps |
| Server: `undo_step` tool | — | **New** | — | Rollback tool definition |

## Appendix B: Open Questions for Review

1. **NEW-1**: Should the MiniChatBar support voice playback of AI text (read aloud)? This would add accessibility value in full-view mode where text is less prominent.

2. **NEW-2**: How many rollbacks should be allowed before triggering conversation compaction? Is there a practical limit (e.g., 3 rollbacks per step, 10 total)?

3. **NEW-2**: Should the `undo_step` tool be AI-callable only, or should the client be able to invoke it directly (bypassing the AI)? Direct invocation would be faster but loses the AI's ability to react conversationally.

4. **NEW-3**: Should static step templates be stored in the database (per-tenant configurable) or in code (deployed with the app)? Database storage enables tenant customization without deploys.

5. **NEW-3**: For the optimized system prompt (static steps referenced by ID only), does the AI need any content from the template at all? Or can it be completely blind to the template contents and just call `render_slide` with a step ID marker?

6. **ALL**: Should the flow config be delivered to the client at onboarding start (so it knows about presentation modes and step types ahead of time), or should the client be fully server-driven (learns about each step only when the AI presents it)?
