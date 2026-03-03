# AI Onboarding Framework: Architecture Design

> **Version**: v2 — incorporates new requirements (NEW-1, NEW-2, NEW-3) + architecture review fixes (C1, C2, I5, I6)
> **Date**: 2026-02-28
> **Phase**: 2 (Architecture Design)
> **Prerequisite**: Phase 1 Landscape Analysis + Research 2A assistant-ui Evaluation
> **Decision baseline**: BUILD CUSTOM on existing AI Chat UI

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Zod Block Schema Specification](#2-zod-block-schema-specification)
3. [Flow Configuration Schema](#3-flow-configuration-schema)
4. [Step Registry Schema](#4-step-registry-schema)
5. [Tool Taxonomy](#5-tool-taxonomy)
6. [Component Architecture](#6-component-architecture)
7. [State Machine Design](#7-state-machine-design)
8. [AI Integration Pattern](#8-ai-integration-pattern)
9. [Data Flow](#9-data-flow)
10. [Step Rollback](#10-step-rollback)
11. [Static vs Dynamic Steps](#11-static-vs-dynamic-steps)
12. [Cross-Platform Strategy](#12-cross-platform-strategy)
13. [Reuse Assessment](#13-reuse-assessment)
14. [Cross-Cutting Concerns](#14-cross-cutting-concerns)
15. [Phased Implementation Plan](#15-phased-implementation-plan)
16. [Open Questions Resolved](#16-open-questions-resolved)

---

## 1. Architecture Overview

### Three-Layer Design

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: Schema & AI Integration (Platform-Agnostic)          │
│                                                                 │
│  • Zod schemas for all block types                             │
│  • Flow configuration schemas (step types, templates)           │
│  • Step registry schemas (step records, statuses)               │
│  • Tool definitions (render_slide, undo_step, etc.)             │
│  • Onboarding state machine (step progression logic)            │
│  • Validation utilities                                        │
│  • Type exports (z.infer<> for all schemas)                    │
│                                                                 │
│  Location: src/store/onboarding/schemas/                       │
│  Could become: @eleva/onboarding-schemas (shared package)      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│  LAYER 2: State & Hooks (React, platform-leaning)              │
│                                                                 │
│  • Redux slice (onboardingSlice) — persisted onboarding state  │
│  • useOnboardingChat hook (extends useAIChat pattern)           │
│  • useOnboardingFlow hook (state machine + step tracking)       │
│  • useSlideForm hook (per-slide form state + validation)        │
│  • Block registry (type → component map)                       │
│                                                                 │
│  Location: src/store/onboarding/, src/presentation/hooks/       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│  LAYER 3: UI Components (Platform-Specific)                    │
│                                                                 │
│  • OnboardingScreen — root screen component                    │
│  • PresentationContainer — strategy switch (inline / full-view)│
│  • InlinePresentation — chat + slides in message list          │
│  • FullViewPresentation — active slide takes over content area │
│  • SlideRenderer — renders a slide schema into RN components   │
│  • Block components (SingleChoice, TextInput, BigText, etc.)   │
│  • MiniChatBar — collapsed AI text in full-view mode           │
│  • OnboardingHeader, ProgressBar, InputBar                     │
│  • Transition animations (Reanimated)                          │
│                                                                 │
│  Location: src/presentation/components/onboarding/             │
│  Styling: twrnc + Radix tokens (same as AI chat)               │
└─────────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Schema is the contract**: The Zod schemas define what the LLM can produce and what the client can render. Everything flows from the schema.
2. **Extend, don't fork**: The onboarding UI extends the existing AI Chat UI. Slides are a new part type in the same message list (inline mode) or a full-view overlay (full-view mode), not a separate UI.
3. **Progressive complexity**: Start with 5 core block types, add more as needed. The block registry is open for extension.
4. **Fail gracefully**: If the LLM produces an invalid schema, fall back to plain text. If a block type is unknown, skip it with a dev warning. Wrap blocks in error boundaries.
5. **Server-driven but client-resilient**: The AI drives the flow, but the client can operate with cached slides if the AI is unavailable.
6. **Single active flow**: Only one onboarding flow can be active at a time. If `flowStatus === 'active'`, the user must complete or abandon it before starting a new one.

---

## 2. Zod Block Schema Specification

### Design Decision: Single Tool with Block Array

We use a **single `render_slide` tool** that accepts an array of blocks, rather than separate tools per block type. Rationale:

- A slide is a composite layout — the LLM needs to compose multiple blocks together in one atomic call
- Separate tools per block would require multi-tool-call coordination (fragile with current LLMs)
- A single tool with a discriminated union is cleaner for `strict` mode validation
- The block array maps naturally to a `FlatList` / `map()` renderer

### Block Schema Hierarchy

```
SlideSchema
├── header: string
├── subheader?: string
├── blocks: BlockSchema[]      ← discriminated union on `type`
│   ├── BigTextBlock
│   ├── SingleChoiceBlock
│   ├── MultiChoiceBlock
│   ├── TextInputBlock
│   ├── DropdownBlock
│   ├── ToggleBlock
│   ├── ImageChoiceBlock
│   ├── InfoCardBlock
│   ├── ConfirmationBlock
│   ├── LoadingBlock
│   └── SuccessBlock
├── actions?: SlideActions
└── metadata?: SlideMetadata
```

### Core Schemas

```typescript
// ============================================================================
// src/store/onboarding/schemas/blocks.ts
// ============================================================================

import { z } from 'zod';

// --- Shared primitives ---

const OptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),       // icon name from our SVG icon set
  disabled: z.boolean().optional(),
});

const ValidationSchema = z.object({
  required: z.boolean().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),     // regex string
  patternMessage: z.string().optional(),
});

// --- Block schemas (discriminated union on `type`) ---

const BigTextBlockSchema = z.object({
  type: z.literal('big-text'),
  id: z.string(),
  text: z.string(),
  alignment: z.enum(['left', 'center']).optional(),
  size: z.enum(['xl', '2xl', '3xl']).optional(),
});

const SingleChoiceBlockSchema = z.object({
  type: z.literal('single-choice'),
  id: z.string(),
  label: z.string().optional(),
  options: z.array(OptionSchema).min(2).max(12),
  defaultValue: z.string().optional(),
  layout: z.enum(['vertical', 'horizontal', 'grid']).optional(),
  validation: ValidationSchema.optional(),
});

const MultiChoiceBlockSchema = z.object({
  type: z.literal('multi-choice'),
  id: z.string(),
  label: z.string().optional(),
  options: z.array(OptionSchema).min(2).max(20),
  defaultValues: z.array(z.string()).optional(),
  minSelections: z.number().optional(),
  maxSelections: z.number().optional(),
  layout: z.enum(['vertical', 'horizontal', 'grid']).optional(),
  validation: ValidationSchema.optional(),
});

const TextInputBlockSchema = z.object({
  type: z.literal('text-input'),
  id: z.string(),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
  multiline: z.boolean().optional(),
  inputType: z.enum(['text', 'email', 'url', 'phone', 'number']).optional(),
  validation: ValidationSchema.optional(),
});

const DropdownBlockSchema = z.object({
  type: z.literal('dropdown'),
  id: z.string(),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  options: z.array(OptionSchema).min(1),
  defaultValue: z.string().optional(),
  searchable: z.boolean().optional(),
  validation: ValidationSchema.optional(),
});

const ToggleBlockSchema = z.object({
  type: z.literal('toggle'),
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  defaultValue: z.boolean().optional(),
});

const ImageChoiceBlockSchema = z.object({
  type: z.literal('image-choice'),
  id: z.string(),
  label: z.string().optional(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
    imageUrl: z.string(),          // URL to image (must come from flow config, not LLM)
    description: z.string().optional(),
  })).min(2).max(8),
  defaultValue: z.string().optional(),
  columns: z.enum(['2', '3']).optional(),
  validation: ValidationSchema.optional(),
});

const InfoCardBlockSchema = z.object({
  type: z.literal('info-card'),
  id: z.string(),
  title: z.string().optional(),
  body: z.string(),               // supports basic markdown
  icon: z.string().optional(),
  variant: z.enum(['info', 'tip', 'warning']).optional(),
});

const ConfirmationBlockSchema = z.object({
  type: z.literal('confirmation'),
  id: z.string(),
  title: z.string().optional(),
  items: z.array(z.object({
    label: z.string(),
    value: z.string(),
    editable: z.boolean().optional(),
  })),
});

const LoadingBlockSchema = z.object({
  type: z.literal('loading'),
  id: z.string(),
  message: z.string(),
  progress: z.number().min(0).max(100).optional(),  // determinate progress
});

const SuccessBlockSchema = z.object({
  type: z.literal('success'),
  id: z.string(),
  title: z.string(),
  message: z.string().optional(),
  nextAction: z.enum(['continue', 'finish', 'redirect']).optional(),
});

// --- Discriminated union ---

const BlockSchema = z.discriminatedUnion('type', [
  BigTextBlockSchema,
  SingleChoiceBlockSchema,
  MultiChoiceBlockSchema,
  TextInputBlockSchema,
  DropdownBlockSchema,
  ToggleBlockSchema,
  ImageChoiceBlockSchema,
  InfoCardBlockSchema,
  ConfirmationBlockSchema,
  LoadingBlockSchema,
  SuccessBlockSchema,
]);

// --- Slide actions ---

const SlideActionSchema = z.object({
  label: z.string(),
  action: z.enum(['submit', 'skip', 'back', 'redirect']),
  url: z.string().optional(),     // for 'redirect' action
  disabled: z.boolean().optional(),
  variant: z.enum(['primary', 'secondary', 'ghost']).optional(),
});

const SlideActionsSchema = z.object({
  primary: SlideActionSchema.optional(),
  secondary: SlideActionSchema.optional(),
});

// --- Slide metadata ---

const SlideMetadataSchema = z.object({
  stepId: z.string().optional(),
  stepIndex: z.number().optional(),
  totalSteps: z.number().optional(),
  canGoBack: z.boolean().optional(),
  autoAdvance: z.boolean().optional(),
  presentationMode: z.enum(['inline', 'full-view']).optional(),   // per-slide hint
  stepType: z.enum(['static', 'semi-static', 'dynamic']).optional(), // for debugging
});

// --- Top-level slide schema ---

const SlideSchema = z.object({
  header: z.string(),
  subheader: z.string().optional(),
  blocks: z.array(BlockSchema).min(1).max(6),
  actions: SlideActionsSchema.optional(),
  metadata: SlideMetadataSchema.optional(),
});

// --- Exports ---

export {
  // Primitives
  OptionSchema,
  ValidationSchema,
  // Blocks
  BigTextBlockSchema,
  SingleChoiceBlockSchema,
  MultiChoiceBlockSchema,
  TextInputBlockSchema,
  DropdownBlockSchema,
  ToggleBlockSchema,
  ImageChoiceBlockSchema,
  InfoCardBlockSchema,
  ConfirmationBlockSchema,
  LoadingBlockSchema,
  SuccessBlockSchema,
  BlockSchema,
  // Slide
  SlideActionSchema,
  SlideActionsSchema,
  SlideMetadataSchema,
  SlideSchema,
};

// --- Inferred types ---

export type Option = z.infer<typeof OptionSchema>;
export type Validation = z.infer<typeof ValidationSchema>;
export type BigTextBlock = z.infer<typeof BigTextBlockSchema>;
export type SingleChoiceBlock = z.infer<typeof SingleChoiceBlockSchema>;
export type MultiChoiceBlock = z.infer<typeof MultiChoiceBlockSchema>;
export type TextInputBlock = z.infer<typeof TextInputBlockSchema>;
export type DropdownBlock = z.infer<typeof DropdownBlockSchema>;
export type ToggleBlock = z.infer<typeof ToggleBlockSchema>;
export type ImageChoiceBlock = z.infer<typeof ImageChoiceBlockSchema>;
export type InfoCardBlock = z.infer<typeof InfoCardBlockSchema>;
export type ConfirmationBlock = z.infer<typeof ConfirmationBlockSchema>;
export type LoadingBlock = z.infer<typeof LoadingBlockSchema>;
export type SuccessBlock = z.infer<typeof SuccessBlockSchema>;
export type Block = z.infer<typeof BlockSchema>;
export type SlideAction = z.infer<typeof SlideActionSchema>;
export type SlideActions = z.infer<typeof SlideActionsSchema>;
export type SlideMetadata = z.infer<typeof SlideMetadataSchema>;
export type Slide = z.infer<typeof SlideSchema>;
```

### Slide Output Schema (User Response)

When the user submits a slide, the response is a key-value map of block IDs to values:

```typescript
// ============================================================================
// src/store/onboarding/schemas/slideOutput.ts
// ============================================================================

import { z } from 'zod';

/**
 * The output schema for the `render_slide` tool.
 * This is what the client sends back to the AI as the tool result.
 *
 * Keys are block IDs, values depend on block type:
 * - single-choice:  string (selected value)
 * - multi-choice:   string[] (selected values)
 * - text-input:     string
 * - dropdown:       string
 * - toggle:         boolean
 * - image-choice:   string (selected value)
 * - confirmation:   { confirmed: boolean, edits?: Record<string, string> }
 * - big-text:       never (display-only)
 * - info-card:      never (display-only)
 * - loading:        never (display-only)
 * - success:        never (display-only)
 */
const SlideOutputSchema = z.object({
  action: z.enum(['submit', 'skip', 'back']),
  values: z.record(z.string(), z.unknown()),
});

export { SlideOutputSchema };
export type SlideOutput = z.infer<typeof SlideOutputSchema>;
```

### Schema Validation Strategy

```
LLM generates tool args
        │
        ▼
  ┌─────────────────────┐
  │ Zod.safeParse()     │
  │ (server-side)       │
  └─────┬───────────────┘
        │ valid?
   ┌────┴────┐
   │ YES     │ NO → fallback to text response
   ▼         ▼
 stream    log warning,
 to        ask LLM to
 client    retry once
        │
        ▼
  ┌─────────────────────┐
  │ Zod.safeParse()     │
  │ (client-side)       │  ← defense-in-depth
  └─────┬───────────────┘
        │ valid?
   ┌────┴────┐
   │ YES     │ NO → render error card with raw text
   ▼         ▼
 render   show fallback
 slide    UI
```

With OpenAI's `strict: true` (via `providerOptions`), the LLM is constrained to produce valid JSON matching the schema. This eliminates most validation failures. The client-side validation is defense-in-depth for other providers.

### OpenAI Strict Mode Guidance

> **Review fix C2**: The block schemas use `.optional()` extensively. OpenAI strict mode requires all properties to be `required` in the JSON Schema, with optional semantics expressed via nullable types. The AI SDK's `zodSchema()` converter handles this by converting `.optional()` to `anyOf: [type, { type: "null" }]` and adding the property to `required`. This means the LLM must explicitly output `null` for every optional field — increasing token usage.

**Guidelines for schema design under strict mode**:

1. **Minimize optional fields** — Make deliberate choices. Fields the LLM will almost always set should be required with sensible defaults. Fields that are truly optional should use `z.string().nullable()` explicitly.
2. **MVP subset only** — For the MVP, use only the 5-block subset (BigText, SingleChoice, TextInput, InfoCard, Success) with strict mode. The full 11-block discriminated union may exceed OpenAI's schema complexity limits.
3. **Consider a dual-schema approach** — A simplified "LLM-facing" schema (fewer optional fields, fewer block types) used for tool definitions, and a richer "client-side" schema that applies defaults for rendering. The server maps between them.
4. **Test against OpenAI limits before implementing** — The discriminated union with 11 members, each with multiple nullable fields, may hit nesting/size constraints. Run a validation spike first.

---

## 3. Flow Configuration Schema

Flow configuration defines the structure of an onboarding flow, including step types, templates, and presentation modes.

### Step Types

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

### Presentation Modes

Each onboarding flow declares a default **presentation mode** — how slides are displayed to the user:

- **`inline`**: Slides render as full-width items in the chat message list (FlashList). The user sees slides and AI text interleaved. Scroll up to see history.
- **`full-view`**: The active slide takes over the content area. AI text appears in a collapsible MiniChatBar. Previous slides are accessible via the expanded chat history.

The mode is configurable **per-flow** with an optional **per-step override**. For the MVP, only per-flow mode is implemented; per-step switching is deferred to post-MVP.

### Schema

```typescript
// ============================================================================
// src/store/onboarding/schemas/flowConfig.ts
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

  // Step type classification
  stepType: StepTypeSchema.default('dynamic'),

  // Template for static/semi-static steps
  // For 'static': the complete slide schema (AI must use exactly this)
  // For 'semi-static': a partial template with placeholder markers
  // For 'dynamic': not used (AI generates freely)
  template: SlideSchema.optional(),

  // For semi-static steps: which fields the AI can customize
  // Keys are JSONPath-like strings pointing to fields in the template
  // Example: ["blocks[0].options", "header", "blocks[1].placeholder"]
  aiCustomizableFields: z.array(z.string()).optional(),

  // Presentation mode override (overrides flow default)
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
```

---

## 4. Step Registry Schema

The step registry tracks the state of every step in the flow. It replaces the simpler `completedSteps` record from v1, providing a richer data model that supports rollback, cascading invalidation, and step lifecycle tracking.

### Why a Separate Step Registry?

The AI SDK's `UIMessage[]` is the **transport** — it carries tool calls and responses in the streaming protocol. But messages are not the right place to store **structured step data** for rollback:

- Messages are append-only (the AI SDK doesn't support deleting/editing messages cleanly)
- A "step" may span multiple messages (AI text → `render_slide` → user submits → AI calls `mark_step_complete` → AI text)
- Rollback needs to operate on the step as a unit, not individual messages
- The AI needs a clean summary of "current valid step data" — not a message log with deletions

### Schema

```typescript
// ============================================================================
// src/store/onboarding/schemas/stepRecord.ts
// ============================================================================

import { z } from 'zod';
import { SlideSchema } from './blocks';
import { StepTypeSchema } from './flowConfig';

export const StepRecordStatusSchema = z.enum([
  'pending',      // step is in the flow but not yet presented
  'active',       // slide is currently displayed, awaiting user input
  'completed',    // user submitted, AI called mark_step_complete
  'rolled_back',  // user rolled back this step — data cleared
  'invalidated',  // cascading invalidation from a dependency rollback
]);

export const StepRecordSchema = z.object({
  stepId: z.string(),
  status: StepRecordStatusSchema,

  // Optional metadata
  stepType: StepTypeSchema.optional(),

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

export const StepRegistrySchema = z.record(z.string(), StepRecordSchema);

export type StepRecordStatus = z.infer<typeof StepRecordStatusSchema>;
export type StepRecord = z.infer<typeof StepRecordSchema>;
export type StepRegistry = z.infer<typeof StepRegistrySchema>;
```

### Step Record Lifecycle

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

### Relationship Between StepRecords and Messages

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

Step records are **derived from** messages but maintained **independently**. When the AI calls `render_slide`, we create/update a step record. When the AI calls `mark_step_complete`, we mark it completed. When the user rolls back, we update the step record and inject rollback context into the conversation.

---

## 5. Tool Taxonomy

### Decision: 4 Core Tools + 1 Rollback Tool

We define a focused set of tools the AI can call during onboarding:

| Tool | Purpose | Input Schema | Output Schema |
|------|---------|-------------|---------------|
| `render_slide` | Display a structured slide with blocks | `SlideSchema` | `SlideOutputSchema` |
| `update_progress` | Update the progress indicator | `ProgressSchema` | None (display-only) |
| `mark_step_complete` | Record step completion + collected data | `StepCompleteSchema` | `StepCompleteResult` |
| `finish_onboarding` | Complete the onboarding flow | `FinishSchema` | None |
| `undo_step` | Roll back a previously completed step | `UndoStepSchema` | `UndoStepResult` |

### Tool Definitions (Server-Side)

```typescript
// ============================================================================
// Server: tools/onboarding.ts (ai-backend or Rails)
// ============================================================================

import { tool } from 'ai';
import { z } from 'zod';
import { SlideSchema, SlideOutputSchema } from '@/schemas/blocks';

export const onboardingTools = {
  render_slide: tool({
    description: `Render a structured onboarding slide with interactive blocks. 
    The user will see this as a visual form/screen. 
    Use this to collect structured data (choices, text inputs, toggles).
    The tool result will contain the user's responses keyed by block ID.`,
    inputSchema: SlideSchema,
    outputSchema: SlideOutputSchema,
    // No execute — this is a client-side tool (human-in-the-loop)
    // The client renders the slide and calls addToolOutput with the user's response
    providerOptions: {
      openai: { strict: true },
    },
  }),

  update_progress: tool({
    description: `Update the visual progress indicator shown to the user.
    Call this to show which step the user is on.`,
    inputSchema: z.object({
      currentStep: z.number(),
      totalSteps: z.number(),
      stepLabel: z.string().optional(),
    }),
    execute: async ({ currentStep, totalSteps, stepLabel }) => {
      // Server-side: no-op, the client renders progress from the tool args
      return { acknowledged: true };
    },
    providerOptions: {
      openai: { strict: true },
    },
  }),

  mark_step_complete: tool({
    description: `Mark an onboarding step as complete and persist the collected data.
    Call this AFTER receiving the user's slide response.
    The data will be saved to the backend.`,
    inputSchema: z.object({
      stepId: z.string(),
      data: z.record(z.string(), z.unknown()),
    }),
    execute: async ({ stepId, data }, { abortSignal }) => {
      // Server-side: persist to database
      // const result = await saveOnboardingStep(stepId, data);
      return { saved: true, stepId };
    },
    providerOptions: {
      openai: { strict: true },
    },
  }),

  finish_onboarding: tool({
    description: `Complete the onboarding flow. Call this when all required steps are done.
    This triggers the final setup actions (create workspace, configure channels, etc.).`,
    inputSchema: z.object({
      summary: z.record(z.string(), z.unknown()),  // all collected data
    }),
    execute: async ({ summary }) => {
      // Server-side: trigger workspace setup
      // await finalizeOnboarding(summary);
      return { completed: true };
    },
    providerOptions: {
      openai: { strict: true },
    },
  }),

  undo_step: tool({
    description: `Undo a previously completed onboarding step.
    This clears the step's collected data and marks it for re-collection.
    Use this when the user wants to change a previous answer.
    After calling this, you should re-present the step with render_slide.`,
    inputSchema: z.object({
      stepId: z.string(),
      reason: z.string().optional(),
    }),
    execute: async ({ stepId, reason }) => {
      // Server-side: mark step as rolled back in DB
      // Also invalidate any dependent steps (cascading)
      // const invalidatedSteps = computeCascadingInvalidation(stepId, ...);
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
};
```

### Why `render_slide` Has No `execute`

`render_slide` is a **client-side tool** (human-in-the-loop pattern). The flow:

1. LLM calls `render_slide` with a slide schema
2. Server streams the tool call to the client (no server execution)
3. Client renders the slide from the tool args
4. User interacts with the slide and submits
5. Client calls `addToolOutput({ tool: 'render_slide', toolCallId, output: { action: 'submit', values: {...} } })`
6. This sends the user's response back to the AI as the tool result
7. AI processes the response and decides what to do next

The `sendAutomaticallyWhen` option on `useChat` controls whether step 5 automatically triggers the next AI generation:

```typescript
const { messages, addToolOutput, ... } = useChat({
  // ... other options
  sendAutomaticallyWhen: ({ messages }) => {
    // Auto-send when the last message has a tool result for render_slide
    // (i.e., the user submitted a slide)
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg?.parts) return false;
    return lastMsg.parts.some(
      p => isRenderSlideToolPart(p) && hasOutputAvailable(p)
    );
  },
});
```

> **Review fix C1 — Tool part type uncertainty**: The code above uses helper functions (`isRenderSlideToolPart`, `hasOutputAvailable`) rather than hard-coding a specific part shape. See [Section 14.1: Tool Part Type Spike](#141-tool-part-type-spike-review-fix-c1) for details on why this is necessary and what the spike must resolve.

---

## 6. Component Architecture

### 6.1 Dual Presentation Modes

The onboarding framework supports two presentation modes, selected per-flow via `FlowConfig.presentationMode`.

#### Mode A: Inline

Slides render as full-width items in the same FlashList that holds chat messages. This follows the WhatsApp Flows pattern.

**Why inline works well**:
- Conversation history is visible — scroll up to see previous slides and chat
- Back-navigation is natural scrolling (no state machine rewind for viewing)
- The AI can mix chat text with slides naturally
- Simpler implementation — no modal/overlay management

**Layout:**

```
┌─────────────────────────────────────────┐
│  OnboardingHeader                        │ ← branded header, can show progress
│  (progress bar optional)                 │
├─────────────────────────────────────────┤
│                                         │
│  FlashList (vertical)                   │
│  ┌─────────────────────────────────────┐│
│  │ [AI text bubble]                    ││ ← regular chat message
│  │ "Welcome! Let's get you set up..."  ││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │ [SLIDE: full-width]                 ││ ← tool-call part renders as slide
│  │ ┌─────────────────────────────────┐ ││
│  │ │ Header: "About your business"   │ ││
│  │ │ Subheader: "Tell us..."         │ ││
│  │ ├─────────────────────────────────┤ ││
│  │ │ [SingleChoice block]            │ ││
│  │ │ ○ E-commerce                    │ ││
│  │ │ ○ SaaS                          │ ││
│  │ │ ○ Services                      │ ││
│  │ │ ○ Other                         │ ││
│  │ ├─────────────────────────────────┤ ││
│  │ │ [Continue]  [Skip]              │ ││
│  │ └─────────────────────────────────┘ ││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │ [AI text bubble]                    ││ ← AI can chat between slides
│  │ "Great choice! Now let's..."        ││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │ [SLIDE: next slide]                 ││
│  │ ...                                 ││
│  └─────────────────────────────────────┘│
│                                         │
├─────────────────────────────────────────┤
│  InputBar (persistent)                   │ ← always visible, for free-form text
│  [Type a message...           ] [Send]   │
└─────────────────────────────────────────┘
```

#### Mode B: Full-View

The active slide takes over the content area. AI text messages appear in a collapsible `MiniChatBar` at the top. Previous slides are accessible via the expanded chat history.

**Layout:**

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

1. **Content area replacement**: When the AI calls `render_slide`, the content area is entirely replaced by the slide. No chat list visible (except the MiniChatBar).
2. **MiniChatBar**: AI text messages appear as 1-2 lines at the top. Tap to expand into a bottom sheet with full chat history (rendered with the same `OnboardingMessagesList`).
3. **Vertical scroll for tall slides**: If the slide content exceeds the viewport, the `ActiveSlideArea` becomes a `ScrollView`.
4. **Transitions**: When the AI sends a new slide, the previous slide animates out and the new one animates in (Reanimated layout transitions).
5. **No FlashList in main view**: The FlashList is only used inside the MiniChatBar's expanded sheet.

**Risk: MiniChatBar discoverability** — Users may not realize there's chat context behind the MiniChatBar. Mitigation: Auto-expand briefly when AI sends a text message, then collapse after a delay.

### 6.2 Component Tree

```
OnboardingScreen
├── OnboardingHeader
│   ├── BrandLogo
│   ├── ProgressBar (optional, driven by update_progress tool)
│   └── CloseButton
├── PresentationContainer (strategy switch based on mode)
│   │
│   ├── [Mode A: Inline] InlinePresentation
│   │   ├── OnboardingMessagesList (extends AIChatMessagesList)
│   │   │   ├── AIMessageBubble (existing — for text/reasoning parts)
│   │   │   ├── OnboardingSlide (for render_slide tool parts)
│   │   │   │   ├── SlideHeader
│   │   │   │   ├── SlideBody
│   │   │   │   │   ├── ErrorBoundary (per-block)
│   │   │   │   │   │   └── BlockRenderer (maps block type to component)
│   │   │   │   │   │       ├── BigTextBlock
│   │   │   │   │   │       ├── SingleChoiceBlock
│   │   │   │   │   │       ├── MultiChoiceBlock
│   │   │   │   │   │       ├── TextInputBlock
│   │   │   │   │   │       ├── DropdownBlock
│   │   │   │   │   │       ├── ToggleBlock
│   │   │   │   │   │       ├── ImageChoiceBlock
│   │   │   │   │   │       ├── InfoCardBlock
│   │   │   │   │   │       ├── ConfirmationBlock
│   │   │   │   │   │       ├── LoadingBlock
│   │   │   │   │   │       └── SuccessBlock
│   │   │   │   ├── SlideActions
│   │   │   │   ├── SlideValidationErrors
│   │   │   │   └── StepRollbackButton (on completed slides)
│   │   │   └── OnboardingProgressCard (for update_progress tool parts)
│   │   └── OnboardingInputBar (extends AIInputField)
│   │       ├── TextInput
│   │       └── SendButton
│   │
│   └── [Mode B: Full-View] FullViewPresentation
│       ├── MiniChatBar (collapsed chat overlay)
│       │   ├── LatestAIMessage (1-2 lines of latest text)
│       │   └── ExpandButton → expands to full chat history sheet
│       ├── ActiveSlideArea (takes over content area)
│       │   ├── SlideSkeleton (shown while tool args stream)
│       │   ├── SlideRenderer → BlockRenderer → Block components
│       │   │   (identical rendering pipeline, different container)
│       │   ├── SlideNavigationControls (back button, dots)
│       │   └── StepRollbackButton
│       └── OnboardingInputBar (same component, repositioned)
│
└── KeyboardAvoidingWrapper
```

### 6.3 PresentationContainer — Strategy Pattern

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

Both strategies receive the same props and use the same underlying `SlideRenderer`. The `InlinePresentation` is the current architecture extracted into its own component. The `FullViewPresentation` is new.

### 6.4 MiniChatBar Component

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
 * In full-view mode, shows the latest AI text at the top of the
 * content area. Collapsible — tap to expand into a full chat
 * history rendered as a bottom sheet.
 *
 * - Shows 1-2 lines of the latest AI text, truncated with "..."
 * - Has a subtle expand chevron
 * - When expanded, renders OnboardingMessagesList (FlashList)
 *   in a bottom sheet, showing full chat history
 * - Collapsed by default after the user dismisses
 */
```

### 6.5 Block Registry Pattern

Inspired by assistant-ui's `makeAssistantToolUI`, we build a type-safe block registry:

```typescript
// ============================================================================
// src/presentation/components/onboarding/blocks/registry.ts
// ============================================================================

import React from 'react';
import type { Block } from '@/store/onboarding/schemas/blocks';

/**
 * Block renderer props — every block component receives these
 */
export interface BlockRendererProps<T extends Block = Block> {
  /** The block schema data */
  block: T;
  /** Current value for this block (from form state) */
  value: unknown;
  /** Callback when value changes */
  onChange: (value: unknown) => void;
  /** Whether the block has a validation error */
  error?: string;
  /** Whether the slide is in read-only mode (already submitted) */
  readOnly?: boolean;
}

/**
 * Block component type
 */
type BlockComponent<T extends Block = Block> = React.ComponentType<BlockRendererProps<T>>;

/**
 * Registry: maps block type string to React component
 */
const blockRegistry = new Map<string, BlockComponent<any>>();

/**
 * Register a block renderer.
 * Called once at app startup for each block type.
 *
 * Usage:
 *   registerBlock('single-choice', SingleChoiceBlock);
 *   registerBlock('text-input', TextInputBlock);
 */
export function registerBlock<T extends Block>(
  type: T['type'],
  component: BlockComponent<T>,
): void {
  blockRegistry.set(type, component as BlockComponent<any>);
}

/**
 * Get the renderer for a block type.
 * Returns undefined if the type is not registered.
 */
export function getBlockRenderer(type: string): BlockComponent | undefined {
  return blockRegistry.get(type);
}

/**
 * Check if a block type has a registered renderer
 */
export function hasBlockRenderer(type: string): boolean {
  return blockRegistry.has(type);
}
```

### 6.6 SlideRenderer Component

```typescript
// ============================================================================
// src/presentation/components/onboarding/SlideRenderer.tsx
// ============================================================================

// Pseudocode — actual implementation in Phase 3

interface SlideRendererProps {
  slide: Slide;
  toolCallId: string;
  onSubmit: (output: SlideOutput) => void;
  readOnly?: boolean;  // true for already-submitted slides
}

const SlideRenderer: React.FC<SlideRendererProps> = ({
  slide, toolCallId, onSubmit, readOnly,
}) => {
  // Form state: { [blockId]: value }
  // IMPORTANT (Review fix I6): Form state lives in local useState,
  // NOT in Redux. This avoids a Redux dispatch per keystroke on text inputs.
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize defaults from block schemas
  useEffect(() => {
    const defaults: Record<string, unknown> = {};
    for (const block of slide.blocks) {
      if ('defaultValue' in block && block.defaultValue !== undefined) {
        defaults[block.id] = block.defaultValue;
      }
      if ('defaultValues' in block && block.defaultValues !== undefined) {
        defaults[block.id] = block.defaultValues;
      }
    }
    setFormValues(defaults);
  }, [slide]);

  // Validate all blocks
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const block of slide.blocks) {
      if ('validation' in block && block.validation?.required) {
        const value = formValues[block.id];
        if (value === undefined || value === '' || 
            (Array.isArray(value) && value.length === 0)) {
          newErrors[block.id] = 'This field is required';
        }
      }
      // Additional validation rules (minLength, maxLength, pattern, etc.)
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (action: 'submit' | 'skip' | 'back') => {
    if (action === 'submit' && !validate()) return;
    onSubmit({ action, values: formValues });
  };

  return (
    <View style={/* full-width slide container */}>
      <SlideHeader header={slide.header} subheader={slide.subheader} />
      <SlideBody>
        {slide.blocks.map((block) => (
          <BlockErrorBoundary key={block.id} blockId={block.id} blockType={block.type}>
            <BlockRenderer
              block={block}
              value={formValues[block.id]}
              onChange={(val) => setFormValues(prev => ({ ...prev, [block.id]: val }))}
              error={errors[block.id]}
              readOnly={readOnly}
            />
          </BlockErrorBoundary>
        ))}
      </SlideBody>
      {slide.actions && !readOnly && (
        <SlideActions
          actions={slide.actions}
          onAction={handleSubmit}
        />
      )}
    </View>
  );
};
```

### 6.7 Integration with AIPartRenderer

The existing `AIPartRenderer` gains a new branch for onboarding tool calls:

```typescript
// In AIPartRenderer.tsx — conceptual extension

if (isToolPart(part)) {
  // Extract tool name and args from the part.
  // See Section 14.1 for the tool part type spike — the actual
  // property names (toolName/args vs type/input) must be verified.
  const { toolName, args, toolCallId } = extractToolInfo(part);
  
  // Onboarding slide tool
  if (toolName === 'render_slide') {
    const slideData = SlideSchema.safeParse(args);
    if (slideData.success) {
      // Derive isSubmitted from tool call state, NOT Redux
      // (Review fix I6)
      const isSubmitted = getToolCallState(part) === 'output-available';
      return (
        <OnboardingSlide
          slide={slideData.data}
          toolCallId={toolCallId}
          onSubmit={onSlideSubmit}  // calls addToolOutput
          readOnly={isSubmitted}
        />
      );
    }
    // Fallback for invalid schema
    return <AIToolPart part={part} isStreaming={isStreaming} />;
  }

  // Progress update tool
  if (toolName === 'update_progress') {
    return <OnboardingProgressCard args={args} />;
  }

  // Existing tool rendering
  return <AIToolPart part={part} isStreaming={isStreaming} />;
}
```

> **Note**: The `extractToolInfo` and `getToolCallState` helpers abstract over the tool part shape uncertainty documented in [Section 14.1](#141-tool-part-type-spike-review-fix-c1). These helpers will be implemented after the spike determines the actual runtime shape.

---

## 7. State Machine Design

### 7.1 Flow States

The onboarding flow state machine includes a `ROLLING_BACK` state for step rollback:

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
       │              │            │  (prev     │    │  (retry)    │
       │              │            │   slide)   │    └─────────────┘
       │              │            └────────────┘
       │              │
       │              │  ┌─────────────────┐
       │              └──│  ROLLING_BACK   │
       │                 │  (AI processing │
       │                 │   undo_step)    │
       │                 └─────────────────┘
       │                        ▲
       │                        │ rollback triggered
       │                        │ (from COLLECTING or REVIEWING)
       │
       │    ┌──────────────┐
       └───▶│  COMPLETED   │
            │  (flow done) │
            └──────────────┘
```

States:
- **IDLE**: No onboarding in progress. Entry point.
- **AWAITING_SLIDE**: AI is generating the next slide (streaming). User sees typing indicator or slide skeleton.
- **COLLECTING**: A slide is rendered and the user is filling it out. The AI is idle, waiting for the tool result.
- **SUBMITTING**: User submitted a slide. The client is calling `addToolOutput` and the AI is processing the response.
- **REVIEWING**: User scrolled back to view a previous slide (read-only). They can edit and resubmit.
- **ROLLING_BACK**: A rollback has been requested. The AI is processing the `undo_step` tool call. The UI shows a loading state or keeps the current view. When the AI responds with a new `render_slide`, transitions to AWAITING_SLIDE.
- **ERROR**: Something went wrong (network, AI error, validation). Retry available.
- **COMPLETED**: All steps done. `finish_onboarding` tool was called.

### 7.2 State Storage (Redux Slice)

```typescript
// ============================================================================
// src/store/onboarding/onboardingSlice.ts (conceptual)
// ============================================================================

interface OnboardingState {
  // Flow state
  flowId: string | null;           // current flow identifier
  flowStatus: 'idle' | 'active' | 'completed' | 'error';
  
  // Presentation mode
  flowPresentationMode: PresentationMode;    // flow-level default
  activePresentationMode: PresentationMode;  // resolved for current step
  miniChatExpanded: boolean;                 // full-view mode only

  // Step tracking (replaces old completedSteps)
  stepRegistry: StepRegistry;
  currentStepId: string | null;

  // Rollback state
  rollbackInProgress: boolean;
  lastRollbackStepId: string | null;
  
  // Progress (from update_progress tool)
  progress: {
    currentStep: number;
    totalSteps: number;
    stepLabel?: string;
  } | null;
  
  // Persistence
  lastSavedAt: string | null;     // ISO timestamp
  resumeData: {                    // for resume-from-checkpoint
    conversationId: string;
    lastMessageId: string;
  } | null;
}
```

> **Review fix I6 — No `activeSlide` or `formValues` in Redux**: The previous architecture stored `activeSlide.formValues` and `activeSlide.submitted` in Redux. This is removed. Form state lives in local `useState` within `SlideRenderer` (see Section 6.6). The `isSlideSubmitted` flag is derived from the tool call's state (`output-available` vs `input-available`) in the AI SDK message model. This eliminates state duplication between Redux and the SDK, and avoids a Redux dispatch per keystroke on text input blocks.

### 7.3 Why Not XState?

We considered XState for the state machine but decided against it:

1. **Simplicity**: Our state model is essentially linear with retry + rollback. XState is overkill.
2. **Redux integration**: Adding XState alongside Redux creates two state management systems. We already solved this complexity in the AI Chat module — don't repeat it.
3. **Bundle size**: XState adds ~40KB. Not justified for a linear flow.
4. **Pattern alignment**: The rest of the app uses Redux slices with status enums. Stay consistent.

The "state machine" is implemented as a Redux slice with a `flowStatus` enum and reducer functions for transitions. The transition logic is simple enough to express as `if` checks in the action handlers.

### 7.4 Step Progression Logic

The AI drives step progression, but the client enforces constraints:

```
AI calls render_slide with stepId="business_type"
    │
    ├──▶ Client: is this step already completed?
    │    YES → render in read-only mode (user can see but not re-submit)
    │    NO  → render interactive slide, update currentStepId in stepRegistry
    │
User submits slide
    │
    ├──▶ Client: validate form values (required fields, etc.)
    │    FAIL → show inline errors, stay on slide
    │    PASS → call addToolOutput with form values
    │
    ├──▶ AI receives tool result
    │    AI calls mark_step_complete with stepId + data
    │    AI calls render_slide for next step (or update_progress, or chat text)
    │    AI calls finish_onboarding when all required steps done
    │
User types free-form text (at any time)
    │
    ├──▶ Client: resolve pending tool call first (see Section 9.2)
    │    THEN send as regular chat message via sendMessage()
    │    AI interprets and may:
    │    - Answer the question conversationally
    │    - Skip ahead to a different step
    │    - Re-render the current slide with adjustments
    │    - Combine the text input with the current step's data
    │
User requests rollback (tap "Edit" on completed slide)
    │
    ├──▶ Client: send rollback request message
    │    AI calls undo_step → cascading invalidation
    │    AI re-renders the step with previous values as defaults
```

### 7.5 Back Navigation

Three levels of back navigation:

1. **Visual back** (scroll up, inline mode only): User scrolls up in the FlashList to see previous slides. These render in read-only mode. No state change needed.

2. **Edit back** (re-submit without rollback): User taps "Edit" on a previous slide. This sends a chat message like "I want to change my business type." The AI re-renders the slide with the previously submitted values as defaults. The AI uses the new response going forward.

3. **Rollback** (formal undo with cascading invalidation): For cases where changing a previous answer should invalidate downstream steps. See [Section 10](#10-step-rollback) for full details.

### 7.6 Resume from Checkpoint

If the user kills the app mid-onboarding:

1. On next launch, check `onboardingState.resumeData` in Redux (persisted)
2. If non-null, restore the conversation ID and send a resume message
3. The AI has all previous tool results in the conversation history
4. The AI picks up from where it left off (re-renders current slide or advances)

The conversation history IS the checkpoint. No separate persistence layer needed beyond what the AI conversation provides.

---

## 8. AI Integration Pattern

### 8.1 Server-Side Setup

```typescript
// ============================================================================
// Server: routes/onboarding.ts (conceptual — Rails or ai-backend)
// ============================================================================

import { streamText, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';
import { onboardingTools } from './tools/onboarding';

export async function handleOnboardingChat(req, res) {
  const { messages, flowConfig } = req.body;
  
  const result = streamText({
    model: openai('gpt-4o'),
    
    system: buildOnboardingSystemPrompt(flowConfig),
    
    messages,
    
    tools: onboardingTools,
    
    toolChoice: 'auto',  // or 'required' for first message to force a slide
    
    // Multi-step: allow up to 5 tool calls per request
    // (e.g., render_slide + mark_step_complete + update_progress)
    stopWhen: stepCountIs(5),
    
    // Dynamic per-step configuration
    prepareStep: ({ steps, stepNumber }) => {
      // After receiving a tool result, allow text response + next tool call
      if (stepNumber > 0) {
        return { toolChoice: 'auto' };
      }
      return undefined;
    },
    
    providerOptions: {
      openai: { strict: true },
    },
  });

  return result.toUIMessageStreamResponse();
}
```

### 8.2 System Prompt Structure

The system prompt encodes the flow definition, including step types and rollback awareness:

```typescript
function buildOnboardingSystemPrompt(flowConfig: FlowConfig): string {
  return `
You are an onboarding assistant for ${flowConfig.productName}.
Your goal is to guide the user through setting up their account.

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
- STATIC STEP: Call render_slide with stepId "${step.id}" in metadata.
  The server will enforce the exact template — your slide args will be replaced.
  Focus on your conversational text before showing this slide.
`;
  }
  
  if (step.stepType === 'semi-static') {
    stepSection += `
- SEMI-STATIC STEP: Call render_slide using the structure below as a base.
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

1. Use the render_slide tool to show structured slides for data collection.
2. Use chat text for greetings, explanations, transitions, and answers to questions.
3. Call mark_step_complete after each successful slide submission.
4. Call update_progress to keep the progress indicator current.
5. Call finish_onboarding when all required steps are complete.
6. If the user types free-form text instead of using the slide, interpret their response and either:
   a. Map it to the current step's fields and proceed
   b. Answer their question and re-show the slide
7. Adapt your language to the user's locale (detected from their messages).
8. You may skip optional steps if the user seems eager to finish.
9. You may reorder steps if the conversation naturally leads to a different order.
10. Never show more than 4 blocks per slide — keep slides focused.
11. Always include a primary action button on interactive slides.
12. When the user requests to change a previous answer, call undo_step first,
    then re-present the step with render_slide (with previous values as defaults).
13. After a rollback, acknowledge any cascading invalidations explicitly in your text.

## Tone
- Professional but friendly
- Concise — slides should be scannable
- No jargon — explain technical terms if needed
`;
}
```

### 8.3 Client-Side Hook

```typescript
// ============================================================================
// src/presentation/hooks/onboarding/useOnboardingChat.ts (conceptual)
// ============================================================================

import { useChat } from '@ai-sdk/react';
import { useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { SlideSchema, type SlideOutput } from '@/store/onboarding/schemas/blocks';

export function useOnboardingChat(agentBotId: number) {
  const dispatch = useAppDispatch();
  
  // Reuse the same transport pattern as useAIChat
  const transport = useMemo(() => 
    new DefaultChatTransport({
      endpoint: '/api/v1/onboarding/chat',  // different endpoint
      agentBotId,
    }),
    [agentBotId]
  );

  const {
    messages,
    sendMessage,
    addToolOutput,
    status,
    error,
    stop,
  } = useChat({
    transport,
    
    // Auto-send when user submits a slide (tool result available)
    sendAutomaticallyWhen: ({ messages }) => {
      const lastMsg = messages[messages.length - 1];
      if (!lastMsg?.parts) return false;
      return lastMsg.parts.some(
        (p: any) => isRenderSlideToolPart(p) && hasOutputAvailable(p)
      );
    },
  });

  // Handle slide submission
  const handleSlideSubmit = useCallback(
    async (toolCallId: string, output: SlideOutput) => {
      await addToolOutput({
        tool: 'render_slide',
        toolCallId,
        output,
      });
      
      // Update step registry in Redux
      dispatch(onboardingActions.markStepCompleted({
        toolCallId,
        responseData: output.values,
        responseAction: output.action,
      }));
    },
    [addToolOutput, dispatch]
  );

  // Handle free-form text while a slide is pending (Review fix I5)
  const handleSendMessage = useCallback(
    async (text: string) => {
      // If there is a pending render_slide tool call, resolve it first
      const pendingSlide = findPendingRenderSlide(messages);
      if (pendingSlide) {
        await addToolOutput({
          tool: 'render_slide',
          toolCallId: pendingSlide.toolCallId,
          output: { action: 'skip', values: {} },
        });
      }
      // Then send the text message
      await sendMessage(text);
    },
    [messages, addToolOutput, sendMessage]
  );

  return {
    messages,
    sendMessage: handleSendMessage,
    handleSlideSubmit,
    status,
    error,
    stop,
  };
}
```

### 8.4 Streaming Invariants for Onboarding

The existing 5 streaming invariants from the AI Chat module apply to onboarding chat as well. Since we're extending (not replacing) the chat infrastructure, they carry forward:

1. **Session ID ref-then-state deferral** → Same pattern for onboarding session ID
2. **Bridge effect streaming guard** → Same guard applies if we bridge to Redux
3. **Stable SDK callback references** → `optionsRef` pattern for `sendAutomaticallyWhen` 
4. **Transport useMemo non-reactive deps** → `[agentBotId]` only
5. **Bridge key fingerprint dedup** → Same dedup for onboarding message persistence

No new invariants needed. The onboarding-specific addition is the `addToolOutput` callback, which is stable (comes from the SDK's `AbstractChat` instance).

---

## 9. Data Flow

### 9.1 Happy Path: Single Slide

```
USER                    CLIENT                  AI SDK              SERVER / LLM
 │                        │                       │                      │
 │  Open onboarding       │                       │                      │
 │──────────────────────▶│                       │                      │
 │                        │  sendMessage("")      │                      │
 │                        │  (initial trigger)    │                      │
 │                        │──────────────────────▶│                      │
 │                        │                       │  POST /onboarding    │
 │                        │                       │─────────────────────▶│
 │                        │                       │                      │
 │                        │                       │  SSE: text part      │
 │                        │                       │  "Welcome! Let's..." │
 │                        │                       │◀─────────────────────│
 │                        │  onMessage (text)     │                      │
 │                        │◀──────────────────────│                      │
 │  See welcome text      │                       │                      │
 │◀───────────────────────│                       │                      │
 │                        │                       │  SSE: tool-call      │
 │                        │                       │  render_slide(...)   │
 │                        │                       │◀─────────────────────│
 │                        │  onMessage (tool)     │                      │
 │                        │◀──────────────────────│                      │
 │  See slide skeleton    │                       │                      │
 │  (while args stream)   │                       │                      │
 │◀───────────────────────│                       │                      │
 │  See full slide        │                       │                      │
 │  (when input-available)│                       │                      │
 │◀───────────────────────│                       │                      │
 │                        │                       │                      │
 │  Select "E-commerce"   │                       │                      │
 │  Tap "Continue"        │                       │                      │
 │──────────────────────▶│                       │                      │
 │                        │  addToolOutput({      │                      │
 │                        │    tool: render_slide │                      │
 │                        │    output: {          │                      │
 │                        │      action: submit   │                      │
 │                        │      values: {        │                      │
 │                        │        biz: ecommerce │                      │
 │                        │      }                │                      │
 │                        │    }                  │                      │
 │                        │  })                   │                      │
 │                        │──────────────────────▶│                      │
 │                        │                       │  (sendAutomatically) │
 │                        │                       │  POST /onboarding    │
 │                        │                       │─────────────────────▶│
 │                        │                       │                      │
 │                        │                       │  SSE: tool-call      │
 │                        │                       │  mark_step_complete  │
 │                        │                       │◀─────────────────────│
 │                        │                       │  (auto-executed)     │
 │                        │                       │                      │
 │                        │                       │  SSE: text part      │
 │                        │                       │  "Great! Now..."     │
 │                        │                       │◀─────────────────────│
 │                        │                       │                      │
 │                        │                       │  SSE: tool-call      │
 │                        │                       │  render_slide(next)  │
 │                        │                       │◀─────────────────────│
 │  See next slide        │                       │                      │
 │◀───────────────────────│                       │                      │
```

### 9.2 Free-Form Text While Slide is Pending

> **Review fix I5**: When the user sends free-form text while a `render_slide` tool call is pending (state: `input-available`), the client must resolve the pending tool call **before** sending the text message. Otherwise, the conversation history contains an unresolved tool call, which may cause the AI to error out or hallucinate a tool result.

**Explicit pattern**:

```
USER                    CLIENT                        SERVER / LLM
 │                        │                              │
 │  (slide is displayed,  │                              │
 │   tool call pending)   │                              │
 │                        │                              │
 │  Types: "I sell shoes  │                              │
 │  online"               │                              │
 │──────────────────────▶│                              │
 │                        │                              │
 │                        │  STEP 1: Resolve pending     │
 │                        │  addToolOutput({             │
 │                        │    tool: 'render_slide',     │
 │                        │    toolCallId: <pending>,    │
 │                        │    output: {                 │
 │                        │      action: 'skip',         │
 │                        │      values: {}              │
 │                        │    }                         │
 │                        │  })                          │
 │                        │                              │
 │                        │  STEP 2: Send text message   │
 │                        │  sendMessage(                │
 │                        │    "I sell shoes online"     │
 │                        │  )                           │
 │                        │───────────────────────────▶│
 │                        │                              │
 │                        │  AI interprets:              │
 │                        │  business_type = "ecommerce" │
 │                        │                              │
 │                        │  SSE: mark_step_complete     │
 │                        │  SSE: text "Got it!..."      │
 │                        │  SSE: render_slide (next)    │
 │                        │◀──────────────────────────│
 │  See next slide        │                              │
 │◀───────────────────────│                              │
```

This two-step resolution (skip pending tool call, then send text) is implemented in the `handleSendMessage` wrapper in `useOnboardingChat` (see Section 8.3).

### 9.3 Error Recovery

```
USER                    CLIENT                  SERVER / LLM
 │                        │                        │
 │  Submit slide          │                        │
 │──────────────────────▶│                        │
 │                        │  addToolOutput(...)    │
 │                        │──────────────────────▶│
 │                        │                        │
 │                        │  ❌ Network error      │
 │                        │◀───────────────────────│
 │                        │                        │
 │  See error toast       │  formValues preserved  │
 │  "Connection lost.     │  in local useState     │
 │  Tap to retry."        │                        │
 │◀───────────────────────│                        │
 │                        │                        │
 │  Tap retry             │                        │
 │──────────────────────▶│                        │
 │                        │  addToolOutput(...)    │
 │                        │  (same data, retry)    │
 │                        │──────────────────────▶│
 │                        │                        │
 │                        │  ✅ Success            │
 │                        │◀───────────────────────│
```

---

## 10. Step Rollback

### 10.1 Overview

Step rollback allows users to change a previously completed step's answer, with cascading invalidation of dependent steps. This is more than a simple "re-render" — it involves:

1. Marking the step (and dependents) as rolled back in the step registry
2. Clearing persisted data server-side via `undo_step`
3. Injecting rollback context into the AI conversation
4. Re-presenting the step with previous values as defaults

### 10.2 Rollback Flow (User-Initiated)

```
USER                    CLIENT                  AI                   SERVER
 │                        │                      │                     │
 │  Tap "Edit" on         │                      │                     │
 │  completed slide       │                      │                     │
 │───────────────────────▶│                      │                     │
 │                        │  sendMessage(         │                     │
 │                        │   "I want to change   │                     │
 │                        │    my business type"   │                     │
 │                        │  )                    │                     │
 │                        │──────────────────────▶│                     │
 │                        │                       │  AI calls           │
 │                        │                       │  undo_step({        │
 │                        │                       │    stepId:          │
 │                        │                       │    "business_type"  │
 │                        │                       │  })                 │
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
 │                        │  "Sure! Changing your  │                     │
 │                        │  business type will    │                     │
 │                        │  also reset your team  │                     │
 │                        │  size answer..."       │                     │
 │                        │◀──────────────────────│                     │
 │                        │                       │                     │
 │                        │  SSE: render_slide    │                     │
 │                        │  (business_type with   │                     │
 │                        │   previous value as    │                     │
 │                        │   defaultValue)        │                     │
 │                        │◀──────────────────────│                     │
 │  See slide with        │                       │                     │
 │  previous selection    │                       │                     │
 │  pre-filled            │                       │                     │
 │◀───────────────────────│                       │                     │
```

### 10.3 Rollback Context Injection

Instead of deleting or trimming messages (which breaks the AI SDK's message model), we inject a system-level summary when constructing messages for the next AI request:

```typescript
function buildMessagesWithRollbackContext(
  messages: UIMessage[],
  stepRegistry: StepRegistry,
): UIMessage[] {
  const rolledBackSteps = Object.values(stepRegistry)
    .filter(s => s.status === 'rolled_back' || s.status === 'invalidated');

  if (rolledBackSteps.length === 0) return messages;

  const validSteps = Object.values(stepRegistry)
    .filter(s => s.status === 'completed');

  const rollbackSummary: UIMessage = {
    role: 'system',
    content: `
ROLLBACK NOTICE: The following steps have been rolled back and their data is no longer valid:
${rolledBackSteps.map(s => `- ${s.stepId} (was: ${JSON.stringify(s.responseData)})`).join('\n')}

Current valid collected data:
${validSteps.map(s => `- ${s.stepId}: ${JSON.stringify(s.responseData)}`).join('\n')}

Please re-collect data for the rolled-back steps. Do not reference the old data.
    `.trim(),
  };

  // Insert the summary before the latest user message
  const result = [...messages];
  result.splice(result.length - 1, 0, rollbackSummary);
  return result;
}
```

**Why not delete messages?**

- The AI SDK `useChat` manages the message array internally. Mutating it externally causes state desynchronization.
- Deleting tool-call messages without their results creates invalid conversation structure.
- The `sendAutomaticallyWhen` and message-merge logic depends on message ordering.
- Injecting a system message is clean, additive, and doesn't break any invariants.

### 10.4 Cascading Invalidation

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

### 10.5 Rollback UI

**Inline mode (Mode A)**:

Each completed slide renders with a subtle "Edit" button. Tapping it sends a rollback request. The new slide appears at the bottom of the list. The old slide stays in history, grayed out with a "Changed" label.

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

A "Back" affordance (button or swipe-back gesture) triggers the rollback. The rollback slide replaces the current one with a back-navigation animation.

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

### 10.6 Rollback Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI divergence after rollback | Medium | AI must acknowledge changes explicitly; context summary keeps AI aligned |
| Conversation length growth | High | Summary injection is compact; consider conversation compaction after N rollbacks |
| Server-client data sync on undo | High | Return server's actual step state in `undo_step` result for reconciliation |
| Step version conflicts | Medium | `version` field on StepRecord tracks re-completions; `mark_step_complete` overwrites |

---

## 11. Static vs Dynamic Steps

### 11.1 Rendering Path: Server-Side Template Enforcement (Option C)

The AI calls `render_slide` for **all step types**. For static and semi-static steps, the **server** intercepts the tool call and replaces/merges the AI's output with the template before streaming to the client.

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
    const merged = mergeWithTemplate(
      stepConfig.template,
      toolCall.args,
      stepConfig.aiCustomizableFields,
    );
    return {
      ...toolCall,
      args: merged,
    };
  }

  // Dynamic: pass through unchanged
  return toolCall;
}
```

**Why Option C**:
- **Uniform client pipeline** — all slides come from `render_slide`, no dual rendering paths
- **Perfect fidelity** for static slides — server enforces template regardless of AI output
- **Semi-static gets the best of both worlds** — structure from template, content from AI
- The server already has access to the flow config (used for system prompt building)

**Client-side changes are minimal** — the client doesn't need to know whether a step is static, semi-static, or dynamic. It always receives a validated `SlideSchema` from `render_slide` and renders it the same way.

### 11.2 Semi-Static Merge Algorithm

```typescript
function mergeWithTemplate(
  template: Slide,
  aiArgs: Slide,
  customizableFields: string[],
): Slide {
  const result = structuredClone(template);

  for (const fieldPath of customizableFields) {
    const aiValue = getByPath(aiArgs, fieldPath);
    if (aiValue !== undefined) {
      setByPath(result, fieldPath, aiValue);
    }
    // If AI didn't provide a value, keep the template's default
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

### 11.3 Static Step Example

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

### 11.4 Semi-Static Step Example

```typescript
const planSelectionStep: StepConfig = {
  id: 'select_plan',
  name: 'Plan Selection',
  goal: 'Help user choose the right pricing plan',
  required: true,
  stepType: 'semi-static',
  template: {
    header: '{{AI_HEADER}}',
    subheader: '{{AI_SUBHEADER}}',
    blocks: [
      {
        type: 'single-choice',
        id: 'plan',
        label: '{{AI_LABEL}}',
        options: [],           // AI generates options based on context
        layout: 'vertical',    // fixed
        validation: { required: true },  // fixed
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

> The `{{AI_*}}` placeholders are NOT rendered — they are markers in the template that the system prompt instructs the AI to replace. The actual rendered schema must pass Zod validation.

### 11.5 Optimized Prompt for Static Steps

For static steps, the system prompt can minimize token waste:

```
### Step 3: Terms of Service (ID: accept_tos)
- Type: STATIC — Call render_slide with stepId "accept_tos" in metadata.
  The server provides the slide content. Do NOT generate blocks.
  Just provide a header (it will be overridden) and an empty blocks array.
  Focus on your conversational text before the slide.
```

### 11.6 Static/Dynamic Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Template staleness | Medium | Config update pipeline; templates are config, not code |
| Semi-static merge edge cases | Low | Validation + template fallback on merge failure |
| AI ignoring step type instructions | Low | Server-side enforcement is the safety net |
| Token cost for templates in prompt | Low | Use optimized prompt with template ID reference for static steps |

---

## 12. Cross-Platform Strategy

### 12.1 Three-Package Architecture

```
packages/
├── onboarding-schemas/           ← SHARED (Layer 1)
│   ├── src/
│   │   ├── blocks.ts             # All Zod block schemas
│   │   ├── slideOutput.ts        # Output schema (user responses)
│   │   ├── flowConfig.ts         # Flow configuration schema
│   │   ├── stepRecord.ts         # Step registry schema
│   │   ├── tools.ts              # Tool definitions (server-side)
│   │   ├── validation.ts         # Validation utilities
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── onboarding-rn/                ← REACT NATIVE (Layer 3)
│   ├── src/
│   │   ├── components/
│   │   │   ├── SlideRenderer.tsx
│   │   │   ├── BlockRenderer.tsx
│   │   │   ├── PresentationContainer.tsx
│   │   │   ├── InlinePresentation.tsx
│   │   │   ├── FullViewPresentation.tsx
│   │   │   ├── MiniChatBar.tsx
│   │   │   └── blocks/           # RN block components
│   │   ├── hooks/
│   │   │   └── useOnboardingChat.ts
│   │   └── registry.ts
│   └── package.json
│
└── onboarding-web/               ← WEB (Layer 3, future)
    ├── src/
    │   ├── components/
    │   │   ├── SlideRenderer.tsx
    │   │   ├── BlockRenderer.tsx
    │   │   └── blocks/           # Web block components
    │   ├── hooks/
    │   │   └── useOnboardingChat.ts
    │   └── registry.ts
    └── package.json
```

### 12.2 What's Shared vs Platform-Specific

| Layer | Shared | RN-Specific | Web-Specific |
|-------|--------|-------------|--------------|
| Zod schemas | All schemas | — | — |
| Flow config schemas | Step types, templates | — | — |
| Step registry schemas | Step records, statuses | — | — |
| Tool definitions | Server-side tools | — | — |
| Validation logic | `validation.ts` | — | — |
| Type exports | All types via `z.infer` | — | — |
| Block components | — | twrnc + RN Views | Tailwind + DOM |
| Slide renderer | — | FlashList / full-view | CSS Grid layout |
| Presentation strategy | — | PresentationContainer | PresentationContainer |
| Form state management | — | useState/Redux | React Hook Form |
| Chat hook | — | `useChat` + RN transport | `useChat` + web transport |
| Animations | — | Reanimated | CSS transitions |
| Keyboard handling | — | KeyboardAvoidingView | N/A |

### 12.3 Practical Approach for Phase 3

For the MVP prototype, we do NOT create separate packages. All code lives in the `chatwoot-mobile-app` repo:

```
src/
├── store/onboarding/
│   ├── schemas/
│   │   ├── blocks.ts          ← the Zod block schemas (extractable later)
│   │   ├── slideOutput.ts
│   │   ├── flowConfig.ts      ← NEW: step types, templates, presentation modes
│   │   ├── stepRecord.ts      ← NEW: step registry data model
│   │   └── index.ts
│   ├── onboardingSlice.ts
│   ├── onboardingActions.ts
│   ├── onboardingSelectors.ts
│   └── index.ts
├── presentation/
│   ├── hooks/onboarding/
│   │   ├── useOnboardingChat.ts
│   │   ├── useOnboardingFlow.ts
│   │   └── useSlideForm.ts
│   ├── components/onboarding/
│   │   ├── OnboardingScreen.tsx
│   │   ├── PresentationContainer.tsx   ← NEW: mode switch
│   │   ├── InlinePresentation.tsx      ← NEW: extracted from current inline design
│   │   ├── FullViewPresentation.tsx    ← NEW: full-view mode
│   │   ├── ActiveSlideArea.tsx         ← NEW: full-view slide host
│   │   ├── MiniChatBar.tsx             ← NEW: collapsed chat in full-view
│   │   ├── OnboardingMessagesList.tsx
│   │   ├── OnboardingHeader.tsx
│   │   ├── OnboardingInputBar.tsx
│   │   ├── SlideRenderer.tsx
│   │   ├── BlockRenderer.tsx
│   │   ├── BlockErrorBoundary.tsx      ← NEW: per-block error boundary
│   │   ├── SlideSkeleton.tsx           ← NEW: skeleton while tool args stream
│   │   └── blocks/
│   │       ├── registry.ts
│   │       ├── BigTextBlock.tsx
│   │       ├── SingleChoiceBlock.tsx
│   │       ├── MultiChoiceBlock.tsx
│   │       ├── TextInputBlock.tsx
│   │       ├── DropdownBlock.tsx
│   │       ├── ToggleBlock.tsx
│   │       ├── ImageChoiceBlock.tsx
│   │       ├── InfoCardBlock.tsx
│   │       ├── ConfirmationBlock.tsx
│   │       ├── LoadingBlock.tsx
│   │       └── SuccessBlock.tsx
│   └── styles/onboarding/
│       ├── tokens.ts
│       └── useOnboardingStyles.ts
```

When the web version is needed, we extract `schemas/` into a shared package and build web-specific renderers. The schemas are designed with zero platform dependencies (pure Zod), making extraction trivial.

---

## 13. Reuse Assessment

### From Existing AI Chat UI

| Asset | Reuse | How |
|-------|-------|-----|
| `useAIChat` hook pattern | **Pattern reuse** | `useOnboardingChat` follows same structure, different endpoint |
| `DefaultChatTransport` | **Direct reuse** | Same transport, different endpoint URL |
| `useAIChatMessages` (merge logic) | **Direct reuse** | Same streaming + persisted message merging |
| `useAIChatScroll` | **Direct reuse** | Same auto-scroll behavior |
| `AIChatMessagesList` (FlashList) | **Extend** | `OnboardingMessagesList` adds `getItemType` for slides |
| `AIMessageBubble` | **Direct reuse** | Chat text messages render identically |
| `AITextPart` (markdown) | **Direct reuse** | AI text responses use same markdown renderer |
| `AIReasoningPart` | **Direct reuse** | Reasoning still works in onboarding context |
| `AIPartRenderer` | **Extend** | Add `render_slide` and `update_progress` branches |
| `AIChatError` | **Direct reuse** | Error display works the same |
| `AIChatEmptyState` | **Replace** | Onboarding has its own empty/welcome state |
| `AIInputField` | **Extend** | `OnboardingInputBar` may have different placeholder behavior |
| Redux patterns (Service→Actions→Slice) | **Direct reuse** | `onboardingSlice` follows identical patterns |
| Zod schema patterns | **Direct reuse** | Same `z.infer<>` + `safeParse` patterns |
| Auth headers (`getStore()`) | **Direct reuse** | Same DeviseTokenAuth format |
| Theme system (Radix + twrnc) | **Direct reuse** | Same tokens and styling approach |
| i18n | **Extend** | Add `ONBOARDING` namespace to `en.json` / `es.json` |

### Estimated Reuse Percentage

- **Direct reuse**: ~50% of code carries forward unchanged
- **Pattern reuse**: ~25% follows same patterns with different specifics
- **New code**: ~25% is genuinely new (block components, form state, slide renderer, presentation modes, rollback)

---

## 14. Cross-Cutting Concerns

### 14.1 Tool Part Type Spike (Review Fix C1)

> **CRITICAL**: The architecture's code examples reference tool parts using property names that may not match the actual AI SDK v5 runtime shape. A spike is required before implementation begins.

**The uncertainty**: In AI SDK v5 (`ai@5.0.93`), tool parts can have two different shapes depending on whether `UIMessage` is typed or untyped:

**Shape A — Typed `UIMessage<..., TOOLS>`** (SDK's typed tool parts):
```typescript
// part.type === 'tool-render_slide'
// part.input  (not part.args)
// toolName is encoded in the type string, not a separate property
```

**Shape B — Untyped `UIMessage`** (current codebase pattern):
```typescript
// part.type === 'tool-call' (or starts with 'tool-')
// part.toolName === 'render_slide'
// part.args  (not part.input)
```

The existing codebase uses `isToolPart()` with `startsWith('tool-')` (in `parts.ts:102-103`) and references `toolName`/`args` properties. This may or may not match what the SDK produces for typed tools with no `execute` (client-side tools).

**Spike requirement**: Before implementing any tool part rendering, stream a `render_slide` tool call to the client and log the actual part shape at runtime. Determine:
1. Does the part have `type: 'tool-render_slide'` or `type: 'tool-call'`?
2. Are the arguments in `part.input` or `part.args`?
3. Does `part.toolName` exist?
4. What does the part look like in each state (`input-streaming`, `input-available`, `output-available`)?

**Architecture approach**: All code examples in this document use abstracted helper functions (`isRenderSlideToolPart()`, `extractToolInfo()`, `hasOutputAvailable()`, `getToolCallState()`) rather than hard-coding property access. These helpers will be implemented based on spike findings.

### 14.2 Error Boundaries for Block Components

Every block is wrapped in a `BlockErrorBoundary` that:

- Catches render errors per block (not per slide)
- Shows a fallback "This block couldn't be rendered" placeholder
- Logs the error (block type, block ID, error message) for debugging
- Does NOT crash the slide or the chat

```typescript
// src/presentation/components/onboarding/BlockErrorBoundary.tsx

class BlockErrorBoundary extends React.Component<{
  blockId: string;
  blockType: string;
  children: React.ReactNode;
}> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn(`[Onboarding] Block render error: ${this.props.blockType}/${this.props.blockId}`, error);
    // Also track via analytics (see Section 14.3)
  }

  render() {
    if (this.state.hasError) {
      return <BlockFallback blockType={this.props.blockType} />;
    }
    return this.props.children;
  }
}
```

### 14.3 Analytics Event Tracking

Define event tracking points for onboarding metrics:

| Event | Trigger | Properties |
|-------|---------|------------|
| `onboarding_started` | Flow begins | `flowId`, `presentationMode` |
| `slide_rendered` | AI generates slide | `stepId`, `stepType`, `blockCount`, `presentationMode` |
| `slide_submitted` | User submits | `stepId`, `action`, `timeOnSlide`, `blocksFilled` |
| `slide_skipped` | User skips | `stepId` |
| `freeform_input` | User types instead of using slide | `stepId` (if slide was pending) |
| `step_rolled_back` | User initiates rollback | `stepId`, `invalidatedSteps` |
| `onboarding_completed` | `finish_onboarding` called | `flowId`, `totalTime`, `stepsCompleted`, `rollbackCount` |
| `onboarding_error` | Error occurred | `errorType`, `stepId` |
| `onboarding_abandoned` | User closes without completing | `flowId`, `lastStepId`, `stepsCompleted` |
| `block_render_error` | Block error boundary triggered | `blockType`, `blockId`, `errorMessage` |

### 14.4 Testing Strategy

| Layer | Approach | Example |
|-------|----------|---------|
| **Block components** | Unit tests with mock data | Render `SingleChoiceBlock` with 4 options, assert correct output, test selection callback |
| **SlideRenderer** | Unit tests with mock `Slide` objects | Assert form state management, validation, submit callback |
| **addToolOutput flow** | Integration test with mocked transport | Simulate `render_slide` tool call, submit, verify `addToolOutput` called correctly |
| **Recorded conversations** | Replay real AI conversations (tool calls + responses) | Validates full pipeline without hitting the LLM |
| **Schema validation** | Unit tests for edge cases | Test OpenAI strict mode compatibility, merge algorithm for semi-static |
| **Rollback** | Integration test | Simulate complete → rollback → re-complete, verify step registry state |
| **Visual QA** | Component catalog (Expo Story or similar) | Each block type with mock data for manual review |

### 14.5 Accessibility Requirements

| Block Type | Accessibility Attributes |
|------------|--------------------------|
| `SingleChoiceBlock` | `accessibilityRole="radio"`, `accessibilityState={{ selected }}` per option |
| `MultiChoiceBlock` | `accessibilityRole="checkbox"`, `accessibilityState={{ checked }}` per option |
| `TextInputBlock` | `accessibilityLabel` from `block.label`, `accessibilityHint` from placeholder |
| `DropdownBlock` | Accessible picker/modal with label |
| `ToggleBlock` | `accessibilityRole="switch"`, `accessibilityState={{ checked }}` |
| `ImageChoiceBlock` | `accessibilityLabel` combining label + description per option |
| `InfoCardBlock` | `accessibilityRole="text"`, read full body |
| `SlideRenderer` | `accessibilityRole="form"`, `accessibilityLabel` from header |
| Slide transitions | `AccessibilityInfo.announceForAccessibility()` when new slide appears |
| Error messages | `accessibilityLiveRegion="polite"` (Android) |

Minimum touch targets: 44x44pt for all interactive elements. VoiceOver/TalkBack testing included in acceptance criteria.

### 14.6 Slide Streaming UX

When the AI streams a `render_slide` tool call, the tool arguments arrive as partial JSON. The client should:

1. **Show a slide-shaped skeleton** while tool args are streaming (state: `input-streaming`). The skeleton matches the approximate layout of a slide (header placeholder, block placeholders).
2. **Render the full slide** when the tool call is complete (state: `input-available`). The skeleton transitions to the real slide with a subtle fade animation.
3. **Do NOT attempt partial slide rendering** — the discriminated union makes partial JSON parsing fragile. Wait for the complete schema.

This is implemented via the `SlideSkeleton` component, shown conditionally based on tool call state.

### 14.7 Single Active Flow Constraint

Only one onboarding flow can be active at a time per user. The Redux state has a single `flowId` and `stepRegistry`.

**Enforcement**:
- If `flowStatus === 'active'`, resume the existing flow. Do not allow starting a new one.
- To start a new flow, the user must complete the current one (`finish_onboarding`) or explicitly abandon it (a new action: `abandonOnboarding`).
- The `abandonOnboarding` action resets `flowStatus` to `'idle'` and clears the step registry.

---

## 15. Phased Implementation Plan

All three new requirements are **additive** — they extend the architecture, they don't replace it. Implementation is phased:

### Phase 3a: Base Architecture (Inline Only, All Dynamic, No Rollback)

Build the current architecture as-is: inline presentation mode, no rollback, all steps are dynamic. This gives a working prototype with:
- Zod block schemas (MVP 5-block subset)
- `render_slide`, `update_progress`, `mark_step_complete`, `finish_onboarding` tools
- `SlideRenderer`, `BlockRenderer`, block components
- `useOnboardingChat` hook
- `onboardingSlice` with basic step tracking
- `AIPartRenderer` extension for slides
- Slide skeleton for streaming UX
- Block error boundaries

**Deliverable**: A working onboarding flow with inline slides, all AI-generated.

### Phase 3b: Static/Dynamic Steps

Lowest risk, highest independence. Add:
- `FlowConfigSchema` with step types (`static`, `semi-static`, `dynamic`)
- Templates and `aiCustomizableFields`
- System prompt changes for step types
- Server-side template enforcement middleware (`enforceStaticTemplate`)
- Semi-static merge algorithm

**Client changes**: Minimal — the client always receives a validated `SlideSchema` regardless of step type.

### Phase 3c: Step Rollback

Add the data model and rollback mechanics:
- `StepRecordSchema` and `StepRegistrySchema`
- Replace simple step tracking with full step registry in Redux
- `undo_step` tool definition
- Rollback context injection (`buildMessagesWithRollbackContext`)
- Cascading invalidation logic (server-side)
- `ROLLING_BACK` state in state machine
- Rollback UI (edit button on completed slides)

### Phase 3d: Dual Presentation Modes

Highest effort, most visual. Refactor the component tree:
- Extract current inline rendering into `InlinePresentation`
- Build `FullViewPresentation`, `ActiveSlideArea`, `MiniChatBar`
- Build `PresentationContainer` strategy switch
- Add `presentationMode` to Redux state
- Add slide transition animations (Reanimated)
- Add `SlideNavigationControls` for full-view mode

**Why this order**: 3b and 3c modify the data model and server pipeline (harder to change later). 3d is a UI refactor (easier to change, visual, good for iteration). Starting with 3b/3c ensures the data foundations are right before building the visual layer.

---

## 16. Open Questions Resolved

### Q1: Should slides render inline or as a separate full-screen layer?

**Answer: Both — configurable per-flow via `presentationMode`.** (Section 6.1)

Inline (Mode A) is the default. Full-view (Mode B) is available for flows that benefit from focused slide interaction. Per-step switching is deferred to post-MVP.

### Q2: How does back-navigation work?

**Answer: Three levels.** (Section 7.5)

1. Visual back (scroll up, inline mode) — read-only viewing
2. Edit back (AI-driven re-render) — simple re-submit
3. Formal rollback (undo_step + cascading invalidation) — for data dependency changes

### Q3: How are onboarding flows configured per tenant?

**Answer: `FlowConfig` schema + system prompt + tool definitions.** (Sections 3, 8.2)

The flow definition (steps, types, templates, required fields, dependencies) is encoded in `FlowConfigSchema`. The system prompt is built from it. Tool schemas are static (same for all tenants).

### Q4: Single tool vs multiple tools?

**Answer: Single `render_slide` tool with block arrays, plus 4 utility tools.** (Section 5)

The 5 tools are: `render_slide`, `update_progress`, `mark_step_complete`, `finish_onboarding`, `undo_step`.

### Q5: How does partial save work?

**Answer: On each slide submission via `mark_step_complete`.** (Section 5)

The AI calls `mark_step_complete` after processing each slide's tool result. This persists the data server-side. Client-side, the step registry in Redux tracks step state, and the conversation history provides resumption.

### Q6: What about `addToolResult` vs `addToolOutput`?

**Answer: Use `addToolOutput` (the current API). `addToolResult` is deprecated.** (Section 5)

The AI SDK v5 renamed `addToolResult` → `addToolOutput`. The function signature takes `{ tool, toolCallId, output }` for success or `{ tool, toolCallId, state: 'output-error', errorText }` for errors.

### Q7: How does `sendAutomaticallyWhen` work with slides?

**Answer: Configured to auto-send when the user submits a slide.** (Section 5)

When `addToolOutput` is called, it updates the message parts. If `sendAutomaticallyWhen` returns `true` (checking for a `render_slide` tool output), the SDK automatically triggers the next AI generation. This creates the slide → submit → AI responds → next slide loop.

### Q8: What about `maxSteps` for multi-step tool calls?

**Answer: Use `stopWhen: stepCountIs(N)` — `maxSteps` is removed in AI SDK v5.** (Section 8.1)

The server uses `stopWhen: stepCountIs(5)` as a safety net. The natural flow control is `render_slide` having no `execute` — the server stops when it hits a client-side tool.

### Q9: What happens when free-form text is sent while a slide is pending?

**Answer: Resolve pending tool call first, then send text.** (Section 9.2, Review Fix I5)

The client calls `addToolOutput` with `{ action: 'skip', values: {} }` to resolve the pending `render_slide` tool call, THEN sends the text message. This prevents orphaned tool calls in conversation history.

### Q10: Where does form state live?

**Answer: Local `useState` in `SlideRenderer`, NOT Redux.** (Section 6.6, Review Fix I6)

Form values are per-slide, ephemeral, and high-frequency (text input keystrokes). Redux dispatch per keystroke is a performance concern. The `isSlideSubmitted` flag is derived from the tool call state in the SDK message model.

---

## Appendix A: Block Type Summary

| Block Type | Interactive? | Form Value Type | Default Value | Validation |
|-----------|-------------|----------------|---------------|------------|
| `big-text` | No (display) | — | — | — |
| `single-choice` | Yes | `string` | `defaultValue` | `required` |
| `multi-choice` | Yes | `string[]` | `defaultValues` | `required`, `minSelections`, `maxSelections` |
| `text-input` | Yes | `string` | `defaultValue` | `required`, `minLength`, `maxLength`, `pattern` |
| `dropdown` | Yes | `string` | `defaultValue` | `required` |
| `toggle` | Yes | `boolean` | `defaultValue` | — |
| `image-choice` | Yes | `string` | `defaultValue` | `required` |
| `info-card` | No (display) | — | — | — |
| `confirmation` | Yes | `{ confirmed: boolean }` | — | — |
| `loading` | No (display) | — | — | — |
| `success` | No (display) | — | — | — |

## Appendix B: MVP Block Set (Phase 3a)

For the prototype, implement these 5 block types first:

1. **`big-text`** — simplest, validates rendering pipeline
2. **`single-choice`** — most common onboarding interaction
3. **`text-input`** — tests form state + validation
4. **`info-card`** — display-only variant
5. **`success`** — completes the happy path

Add remaining 6 block types iteratively after the core pipeline works.

> **Note (Review fix C2)**: For the MVP, register only these 5 block types in the `BlockSchema` discriminated union used for the tool definition's `inputSchema`. This reduces schema complexity for OpenAI strict mode. The full 11-block union is available for client-side validation but should be tested against OpenAI's structured output limits before being used in the tool definition.

## Appendix C: Naming Conventions

| Concept | Convention | Example |
|---------|-----------|---------|
| Schema files | `camelCase.ts` | `blocks.ts`, `slideOutput.ts`, `flowConfig.ts` |
| Block components | `PascalCase.tsx` | `SingleChoiceBlock.tsx` |
| Hooks | `use` prefix | `useOnboardingChat.ts` |
| Redux slice | `onboardingSlice.ts` | — |
| Tool names | `snake_case` | `render_slide`, `mark_step_complete`, `undo_step` |
| Block type strings | `kebab-case` | `single-choice`, `text-input` |
| Block IDs (from AI) | `snake_case` | `business_type`, `company_name` |
| i18n namespace | `SCREAMING_CASE` | `ONBOARDING` |

## Appendix D: Estimated File Count

| Category | Files | Lines (est.) |
|----------|-------|-------------|
| Schemas (blocks, slideOutput, flowConfig, stepRecord) | 5 | ~450 |
| Redux (slice, actions, selectors) | 4 | ~350 |
| Hooks | 3 | ~400 |
| Block components (MVP 5) | 5 | ~500 |
| Block registry + error boundary | 2 | ~100 |
| SlideRenderer + BlockRenderer + SlideSkeleton | 3 | ~250 |
| Presentation strategy (Container, Inline, FullView) | 3 | ~360 |
| MiniChatBar + ActiveSlideArea | 2 | ~200 |
| Header/input/progress | 3 | ~200 |
| Styles/tokens | 2 | ~100 |
| **Total (all phases)** | **~37** | **~3,910** |

Phase 3a MVP alone: ~26 files, ~2,250 lines.

## Appendix E: Decision Log

| # | Decision | Rationale | Alternatives Considered |
|---|----------|-----------|------------------------|
| D1 | Single `render_slide` tool with block array | Atomic slide composition; cleaner for strict mode | Separate tools per block type (fragile coordination) |
| D2 | Slides inline in message list (Mode A default) | WhatsApp Flows pattern; natural scroll-back; simpler | Full-screen overlay only (loses conversation context) |
| D3 | Dual presentation modes (inline + full-view) | Different flows suit different modes; A/B testable | Single mode only (too restrictive) |
| D4 | MiniChatBar for AI text in full-view mode | Keeps slide focused; chat is secondary | Inline overlay (cluttered), no AI text (loses feel) |
| D5 | StepRegistry replaces completedSteps | Clean rollback unit; supports cascading invalidation | Messages-only (hard to rollback), simple record (no lifecycle) |
| D6 | Rollback via context injection, not message deletion | Preserves AI SDK message model; clean and additive | Delete messages (breaks SDK), conversation forking (expensive) |
| D7 | New `undo_step` tool for rollback | Server sync; cascading invalidation computed server-side | Client-only rollback (no server sync), implicit via re-render |
| D8 | Server-side template enforcement (Option C) for static steps | Uniform client pipeline, perfect fidelity | AI-only (LLM may deviate), client rendering (dual paths) |
| D9 | Semi-static uses JSONPath field customization | Expressive for common cases; template provides structure | Free-form AI (loses control), slot system (more complex) |
| D10 | Form state in local useState, not Redux | Avoid per-keystroke Redux dispatch; derive isSubmitted from SDK state | Redux (performance concern), separate form library (overkill) |
| D11 | Phased implementation: base → static → rollback → dual modes | Data model first, UI refactor last; each phase independently valuable | All at once (too risky) |

## Appendix F: File Impact Matrix

| File | Phase | Req | Change Type |
|------|-------|-----|-------------|
| `schemas/blocks.ts` | 3a | Base + metadata additions | Core block schemas |
| `schemas/slideOutput.ts` | 3a | Base | User response schema |
| `schemas/flowConfig.ts` | 3b | NEW-1, NEW-3 | **New** — step types, templates, modes |
| `schemas/stepRecord.ts` | 3c | NEW-2 | **New** — step registry data model |
| `onboardingSlice.ts` | 3a+ | All | Core + progressive additions |
| `OnboardingScreen.tsx` | 3a | Base | Root screen |
| `PresentationContainer.tsx` | 3d | NEW-1 | **New** — strategy switch |
| `InlinePresentation.tsx` | 3d | NEW-1 | **New** (extracted from base) |
| `FullViewPresentation.tsx` | 3d | NEW-1 | **New** |
| `ActiveSlideArea.tsx` | 3d | NEW-1 | **New** |
| `MiniChatBar.tsx` | 3d | NEW-1 | **New** |
| `SlideRenderer.tsx` | 3a | Base | Core slide rendering |
| `BlockRenderer.tsx` | 3a | Base | Block type dispatch |
| `BlockErrorBoundary.tsx` | 3a | Review | **New** — per-block error boundary |
| `SlideSkeleton.tsx` | 3a | Review | **New** — streaming UX |
| `useOnboardingChat.ts` | 3a+ | Base + I5 | Core hook + free-text resolution |
| `useOnboardingFlow.ts` | 3a+ | Base + NEW-2 | State machine + step registry |
| Server: system prompt builder | 3b | NEW-3 | Step types in prompt |
| Server: template enforcement | 3b | NEW-3 | **New** — middleware for static steps |
| Server: `undo_step` tool | 3c | NEW-2 | **New** — rollback tool definition |
