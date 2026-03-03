# AI Generative UI Framework: Requirements & Research Plan

> **Note**: Originally scoped to onboarding. Generalized 2026-03-03. The system is designed to render any AI-triggered interactive UI, not onboarding specifically. References to "onboarding" below should be read as "any AI-driven flow." References to `render_slide` / `SlideSchema` are superseded by `render_view` / `ViewSchema` (all terminology DECIDED — see INDEX.md).

## Vision

Replace traditional step-by-step wizard screens with an AI-driven conversational UI system. The AI agent guides users through any configurable process — onboarding, surveys, configuration wizards, checkout flows, support triage — dynamically selecting what to present at each step: chat messages, structured views, input forms, or combinations thereof. The system should feel like talking to an intelligent assistant that adapts to the user's responses, not clicking through a wizard.

## Context

### Current State
- Existing onboarding module (`src/modules/onboarding/`) uses strict Clean Architecture with DI/tsyringe
- Standard wizard pattern: fixed sequence of views/steps, configurable but static
- Will be deprecated in favor of this new AI-driven approach
- The AI-driven approach is general-purpose: applicable to onboarding, forms, surveys, any interactive flow

### Existing Assets to Leverage
- AI Chat UI (`src/presentation/`) — streaming, Vercel AI SDK v5, message parts, FlashList/FlatList rendering
- Radix + twrnc styling system — theme-aware, dark mode ready
- i18n infrastructure — multi-locale support
- Redux store patterns — Service -> Actions -> Slice -> Selectors with Zod

### Target Platforms
- **Primary**: React Native (iOS + Android) via Expo
- **Secondary**: Web (React) — for AI forms and web-based onboarding
- **Aspiration**: Cross-platform framework that works on both

---

## Core Concepts

### 1. Agent-Driven Step Progression

The onboarding process is defined as a set of **steps** (instructions/goals), but the AI agent decides:
- The order and pacing of steps (can skip, combine, or improvise)
- What UI to render at each step (slide type, input types, content)
- When to advance based on user responses
- How to handle ambiguity, errors, or incomplete answers

Each step has a **goal** (e.g., "collect user's business type") but the AI chooses **how** to achieve it.

### 2. View-Based UI Rendering

Each step renders as a **view** — a full-screen or prominent UI block that the agent composes. Views are NOT chat bubbles (though chat can coexist). Views are structured layouts with:

- **Header text** (large, prominent)
- **Subheader/description** (explanatory text)
- **Body content** (one or more of the UI blocks below)
- **Actions** (primary/secondary buttons, or implicit via input completion)

View transitions: sequential scroll, fade in/out, or slide animation. One active view at a time, with history scrollable above.

### 3. Dynamic UI Blocks (Agent-Selected)

The agent selects from a vocabulary of UI blocks to compose each slide. These are the "tools" the agent has for rendering:

| Block Type | Description | Example Use |
|-----------|-------------|-------------|
| `big-text` | Large display text, motivational or informational | Welcome message, step summary |
| `single-choice` | Radio-style selection from options | "What type of business?" |
| `multi-choice` | Checkbox-style multi-select | "Which channels do you use?" |
| `text-input` | Single-line or multi-line text field | "What's your company name?" |
| `dropdown` | Select from a long list | Country/timezone selection |
| `toggle` | On/off switch | "Enable notifications?" |
| `image-choice` | Visual option cards with images | Template/theme selection |
| `info-card` | Read-only informational display | Feature explanation, tips |
| `progress` | Step progress indicator | "Step 3 of 7" |
| `confirmation` | Summary of collected data for review | Pre-submission review |
| `loading` | Processing/connecting indicator | "Connecting your account..." |
| `success` | Completion celebration | "You're all set!" |

### 4. Persistent Input Bar (Chat + Voice)

A persistent input area at the bottom of the screen, always available:

- **Text input**: User can type free-form responses at any time
- **Voice input** (future): Microphone button for speech-to-text
- **Context-aware**: The input bar adapts placeholder text based on current step
- **Dual mode**: Works alongside structured inputs (buttons, dropdowns) on the same slide

The user can always "break out" of the structured flow and type/speak naturally. The AI interprets free-form input and maps it to the current step's requirements.

### 5. Streaming Responses

The AI's text responses stream in real-time (leveraging existing Vercel AI SDK streaming infrastructure):
- Thinking/reasoning indicators while processing
- Token-by-token text rendering
- Smooth transitions between agent messages and slide rendering

### 6. Schema-Driven Layout

The agent produces a **layout schema** for each step — a JSON structure that the client renders. This is the contract between the LLM and the UI:

```json
{
  "type": "slide",
  "header": "Let's set up your workspace",
  "subheader": "Tell us about your business so we can customize your experience",
  "blocks": [
    {
      "type": "single-choice",
      "id": "business_type",
      "label": "What type of business do you run?",
      "options": [
        { "value": "ecommerce", "label": "E-commerce", "icon": "shopping-bag" },
        { "value": "saas", "label": "SaaS / Software", "icon": "code" },
        { "value": "services", "label": "Services", "icon": "briefcase" },
        { "value": "other", "label": "Other", "icon": "more" }
      ],
      "required": true
    }
  ],
  "actions": {
    "primary": { "label": "Continue", "action": "submit" },
    "secondary": { "label": "Skip for now", "action": "skip" }
  }
}
```

The schema could be delivered as a **tool call** from the Vercel AI SDK, where the "tool" is `render_view`. This maps cleanly to the existing AI chat parts system.

### 7. State Management & Persistence

- All collected data persists across sessions (user can close and resume)
- Step progress tracked in Redux + backend
- Partial responses saved (don't lose data on app kill)
- Backend receives structured data as the user completes each step
- AI has access to all previously collected data for context

---

## Functional Requirements

### FR-1: AI-Driven Flow Definition
- Flows defined as a set of steps with goals, constraints, and validation rules
- Configurable per tenant/product/use-case (different contexts get different flows)
- Steps can have dependencies (step B requires data from step A)
- Steps can be optional or required
- The AI can reorder, skip, or combine steps based on user responses

### FR-2: Agent Rendering
- Agent selects UI blocks from the vocabulary to compose each step
- Agent can mix chat messages with structured views
- Agent can show multiple blocks per view (e.g., header + choice + text input)
- Agent can show streaming text alongside structured UI
- Agent adapts language and content based on user's locale

### FR-3: User Input
- Structured inputs: buttons, dropdowns, checkboxes, text fields, toggles
- Free-form text input always available
- Voice input (future phase)
- Input validation with inline error messages
- Defaults and suggestions pre-filled by the agent

### FR-4: Navigation & Progress
- Visual progress indicator (optional, agent-controlled)
- Back navigation to review/edit previous steps
- Skip functionality for optional steps
- Resume from where the user left off
- Smooth transitions between steps (animation)

### FR-5: Data Collection & Submission
- Each step's data submitted to backend as structured JSON
- Partial saves on each step completion
- Final submission aggregates all step data
- Validation at both client (inline) and server (on submit)
- Error recovery: retry failed submissions without data loss

### FR-6: Streaming & Real-Time
- LLM responses stream token-by-token
- Thinking/processing indicators during agent computation
- Real-time validation feedback
- Optimistic UI updates

### FR-7: Theming & Styling
- Full dark mode support via Radix/twrnc
- Brand-customizable colors and typography
- Accessible: screen reader support, minimum touch targets
- Responsive: works on all phone sizes and tablets

### FR-8: Internationalization
- All agent-generated text comes from the LLM (inherently multi-lingual)
- UI chrome (buttons, labels, placeholders) uses i18n
- RTL support (future consideration)

---

## Non-Functional Requirements

### NFR-1: Performance
- Slide transitions < 200ms
- Input response time < 50ms
- Streaming first token < 500ms
- Works on low-end devices (iPhone SE, budget Android)

### NFR-2: Offline Resilience
- Collected data persists locally if network drops
- Queued submissions retry automatically
- Graceful degradation: show cached slides if AI unavailable

### NFR-3: Cross-Platform Potential
- Core logic (schema parsing, state management, AI communication) should be platform-agnostic
- UI rendering layer is platform-specific (React Native vs React DOM)
- Shared TypeScript types and Zod schemas between platforms

---

## Research Questions

### RQ-1: Existing Frameworks
- Are there existing open-source frameworks for AI-driven onboarding/forms?
- Are there commercial products doing this (AI form builders, conversational onboarding)?
- What patterns exist in the Vercel AI SDK ecosystem for structured UI rendering?
- Are there React Native libraries for dynamic form rendering from JSON schemas?

### RQ-2: Schema Design
- What is the optimal schema format for agent-generated UI?
- How do we handle the LLM producing invalid schemas (validation, fallbacks)?
- Should the schema be a tool call result, a special message part, or a separate channel?
- How do existing AI SDK "generative UI" patterns work (Vercel AI SDK, LangChain)?

### RQ-3: Architecture
- Can we extend the existing AI Chat UI or should this be a separate module?
- How does the slide-based UI coexist with chat messages in the same view?
- What is the state machine for step progression (linear, branching, free-form)?
- How do we handle the AI "improvising" vs following a strict step sequence?

### RQ-4: Cross-Platform Strategy
- Can we share the core logic between React Native and React web?
- What rendering abstraction would work for both platforms?
- Are there existing cross-platform form/UI schema renderers?

### RQ-5: Backend Integration
- How does the onboarding flow configuration reach the AI (system prompt, tool definitions)?
- How are step results submitted and validated on the backend?
- How does the AI access previously collected data mid-flow?
- Can we use the existing Rails + AI backend infrastructure?

---

## Research Phases

### Phase 1: Landscape Analysis (External Research)
**Goal**: Understand what exists in the market and open-source ecosystem.

Sub-tasks:
1. **AI form/onboarding frameworks**: Search for existing solutions (open-source and commercial)
2. **Generative UI patterns**: How Vercel AI SDK, LangChain, and others handle agent-generated UI
3. **JSON schema form renderers**: React Native and React libraries for rendering forms from schemas
4. **Conversational AI-driven UI products**: Commercial products that do AI-driven interactive forms/flows

Deliverable: `docs/temp/onboarding-ai-framework/research-landscape.md`

### Phase 2: Architecture Design
**Goal**: Design the framework architecture based on research findings.

Sub-tasks:
1. **Schema specification**: Define the JSON schema format for views and blocks (`ViewSchema`)
2. **Component architecture**: How views, blocks, and chat coexist
3. **State machine design**: Step progression, branching, resumption
4. **AI integration**: How the LLM produces schemas (tool calls via `render_view`, structured output)
5. **Cross-platform strategy**: What's shared, what's platform-specific

Deliverable: `docs/temp/onboarding-ai-framework/architecture-design.md`

### Phase 3: Prototype Plan
**Goal**: Define the implementation plan for a proof-of-concept.

Sub-tasks:
1. **MVP scope**: Minimal set of block types and features for first iteration
2. **Reuse assessment**: What can we reuse from the AI Chat UI
3. **File structure**: Where the code lives in the repo
4. **Implementation sequence**: What to build first
5. **Testing strategy**: How to test agent-generated UI

Deliverable: `docs/temp/onboarding-ai-framework/prototype-plan.md`

---

## Glossary

| Term | Definition |
|------|-----------|
| **Flow** | A complete AI-driven process, defined as a set of steps with a goal (onboarding, survey, wizard, etc.) |
| **Step** | A unit of the flow with a specific data-collection or display goal |
| **View** | The visual representation of a step — a full-screen layout composed by the agent (replaces "slide") |
| **Block** | A UI component within a view (text input, choice list, info card, etc.) |
| **Schema** | The JSON structure the agent produces to describe a view's layout and content (`ViewSchema`) |
| **Agent** | The LLM that drives the flow, selecting what to show and how to respond |
| **Input bar** | The persistent text/voice input at the bottom of the screen |
