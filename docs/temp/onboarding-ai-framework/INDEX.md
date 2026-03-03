# AI Generative UI Framework — Document Index

> **Last Updated**: 2026-03-03
> **Terminology Note**: This framework was originally called "AI Onboarding Framework" but has been generalized. "Onboarding" should be read as "any AI-driven UI flow". "Slides" are now "views" (AI-generated views). All naming decisions are SETTLED — see Terminology Decisions table below.

---

## What This Framework Is

A system where an AI assistant dynamically generates interactive UI views (forms, choices, text displays, confirmations) within a conversational thread. The AI decides what to show via **tool calls** (`render_view`), and the client renders the view from a **Zod-validated JSON schema**. The user interacts with the view (fills forms, makes selections), and the response flows back to the AI as a tool result, continuing the conversation.

Key insight: **A complete application can be modeled as a chat thread where the AI generates views as needed** — some predefined (static), some templated (semi-static), some fully AI-composed (dynamic).

---

## Recommended Reading Order

### Phase 1: Landscape Research (External)

These documents survey existing frameworks, products, and patterns. Read for context, not for implementation decisions.

| Order | File | Summary | Status |
|-------|------|---------|--------|
| 1 | `research/research-landscape.md` | Overview of AI form builders, conversational onboarding products, JSON schema renderers | Superseded by deeper dives |
| 2 | `research/research-1a-frameworks.md` | Evaluation of existing open-source frameworks for AI-driven forms | Background |
| 3 | `research/research-1b-generative-ui.md` | Vercel AI SDK generative UI patterns, LangChain approaches | Background |
| 4 | `research/research-1c-schema-renderers.md` | React Native and React libraries for rendering forms from JSON schemas | Background |
| 5 | `research/research-1d-products.md` | Commercial products doing AI-driven onboarding/forms | Background |

### Phase 2: Deep Dive — assistant-ui Evaluation

These documents evaluated `assistant-ui` as a potential foundation library. The conclusion was to **NOT use assistant-ui** and instead build custom on our existing AI Chat UI (Vercel AI SDK v5 directly). However, several patterns from assistant-ui informed the architecture.

| Order | File | Summary | Status |
|-------|------|---------|--------|
| 6 | `research/research-2a-assistant-ui-evaluation.md` | Initial evaluation of assistant-ui for React Native | Canonical — key decision |
| 7 | `research/research-2b-assistant-ui-source-analysis.md` | Deep source code analysis of assistant-ui internals | Background |
| 8 | `research/research-2c-assistant-ui-greenfield-evaluation.md` | Would we use assistant-ui if starting from scratch? | Background |
| 9 | `research/research-2d-assistant-ui-wrapper-architecture.md` | Could we wrap assistant-ui around our existing code? | Background |
| 10 | `research/research-2e-unified-thread-architecture.md` | The unified thread concept — chat + views in one thread, dynamic mode switching | **Canonical** — core UX pattern |
| 11 | `research/research-2f-vue-support-evaluation.md` | Vue.js support analysis for cross-platform feasibility | Background |
| 12 | `research/research-2g-honest-comparison.md` | Honest comparison: AI SDK v5 direct vs assistant-ui | **Canonical** — final decision rationale |

### Phase 3: Package Extraction Design

| Order | File | Summary | Status |
|-------|------|---------|--------|
| 13 | `research/research-3a-package-extraction-design.md` | Detailed design for extracting shared packages (`@eleva/ai-chat-core`, `@eleva/ai-chat-react-native`, `@eleva/ai-chat-vue`) | **Canonical** — package structure |

### Phase 4: Requirements & Architecture (Canonical)

These are the CORE documents. Read these for implementation.

| Order | File | Summary | Status |
|-------|------|---------|--------|
| 14 | `requirements.md` | Vision, core concepts (views, blocks, schema, agent), functional/non-functional requirements, research questions. Generalized 2026-03-03 from onboarding-specific to AI-driven UI rendering. | **Canonical** — requirements baseline |
| 15 | `architecture-design.md` | v2 architecture: 3-layer design, Zod block schemas (11 types), flow config, step registry, tool taxonomy (5 tools), component architecture (dual presentation modes), state machine, AI integration, cross-platform strategy, phased implementation plan | **Canonical** — master architecture document |
| 16 | `architecture-integration-overview.md` | **v2.0** (rewritten 2026-03-03): Actual implemented architecture — Vercel AI SDK v5 `useChat` directly, no assistant-ui. Data flow, tool call pipeline, key file paths, presentation modes, rejected approaches. | **Canonical** — integration entry point |

### Phase 5: Proposals & Reviews

These review and extend the architecture based on critical analysis.

| Order | File | Summary | Status |
|-------|------|---------|--------|
| 17 | `proposals/proposal-new-requirements.md` | Three new requirements: dual presentation modes (inline/full-view), step rollback, static/semi-static/dynamic step types. All incorporated into architecture-design.md v2. | Incorporated into arch v2 |
| 18 | `proposals/proposal-architecture-review.md` | Critical review: 5 findings — tool part type mismatch (C1), OpenAI strict mode + optional fields (C2), render_view execute pattern (I1), sendAutomaticallyWhen shape (I4), FlashList performance (I5). Also 6 improvement suggestions. | **Canonical** — must-fix items |
| 19 | `proposals/proposal-package-extraction-review.md` | Review of extraction design: singleton registry is bad (C1), tool part types obsolete (C2), ChatConfig is god object (I3), missing versioning strategy (I5). Recommends context-scoped registries, split ChatConfig into TransportConfig/ChatOptions/UserConfig. | **Canonical** — extraction fixes |
| 20 | `proposals/proposal-rn-mobile-improvements.md` | Review of current RN AI chat code (34 files, 5287 LOC): 12 issues including God hook (useAIChatSessions), FlashListRef typed as any, scroll retry cascades, eagerly-evaluated JSX in STATE_CONFIG, 6 Chatwoot coupling points for extraction. | **Canonical** — mobile prep work |
| 21 | `proposals/proposal-vue-web-improvements.md` | Review of Vue AI chat code (30 files, 2877 LOC): no TypeScript, no Zod validation, JSON.parse deep clone, duplicated auth, God component (AiChatPanel), no part registry, no error categorization reuse. Estimates 8-12 dev-days to fix. | **Canonical** — web prep work |

### Phase 6: Spikes (Blocking Phase 1)

These must be completed before any Phase 1 implementation code is written.

| Order | File | Summary | Status |
|-------|------|---------|--------|
| 22 | `spike-1-tool-part-shape.md` | Verify actual runtime shape of tool call parts in Vercel AI SDK v5 (part.toolName? part.args? part.input? toolCallId key?) | **OPEN — BLOCKING Phase 1** |
| 23 | `spike-2-openai-strict-schema.md` | Validate 5-block MVP ViewSchema against OpenAI structured output `strict: true` | **OPEN — BLOCKING Phase 1** |

---

## Key Decisions Made

### Decision 1: Build Custom, Don't Use assistant-ui
- **Rationale**: assistant-ui has no React Native support, adds Zustand dependency alongside Redux, its API surface is unstable (pre-1.0), and our existing AI chat code already handles streaming, message parts, and tool calls well.
- **What we borrowed**: The `makeAssistantToolUI` pattern (block/tool registry), unified thread concept (chat + views in one stream), human-in-the-loop tool pattern.
- **Source**: research-2g-honest-comparison.md

### Decision 2: Single `render_view` Tool with Block Array
- **Rationale**: A view is a composite layout. Using separate tools per block would require multi-tool-call coordination (fragile with LLMs). A single tool with a Zod discriminated union on `type` is cleaner.
- **Source**: architecture-design.md Section 2

### Decision 3: 5 Core Tools
- `render_view` (client-side, human-in-the-loop — no execute)
- `update_progress` (display-only)
- `mark_step_complete` (server-side, persists data)
- `finish_flow` (server-side, triggers final setup)
- `undo_step` (server-side, rollback with cascading invalidation)
- **Source**: architecture-design.md Section 5

### Decision 4: Dual Presentation Modes
- **Inline**: Views render as full-width items in the message list (FlashList/FlatList)
- **Full-view**: Active view takes over the content area, AI text in collapsible MiniChatBar
- Configurable per-flow with optional per-step override
- **Source**: proposal-new-requirements.md, architecture-design.md Section 6

### Decision 5: Three-Layer Architecture
- **Layer 1** (platform-agnostic): Zod schemas, tool definitions, state machine, validation
- **Layer 2** (React-leaning): Redux slice, hooks (useAIViewChat, useAIViewFlow, useViewForm)
- **Layer 3** (platform-specific): UI components (RN or Vue)
- **Source**: architecture-design.md Section 1

### Decision 6: Step Types (Static / Semi-Static / Dynamic)
- **Static**: Fixed schema, fixed content (e.g., legal ToS acceptance)
- **Semi-static**: Fixed schema template, AI fills content within template
- **Dynamic**: AI generates entire schema freely
- **Source**: architecture-design.md Section 11

### Decision 7: Context-Scoped Registry (Not Module-Level Singleton)
- **Rationale**: Module-level singleton breaks multi-instance, SSR, HMR, and testing isolation. See proposal-package-extraction-review.md C1.
- **Implementation**: Registry provided via React context (`AIChatProvider`) — each provider scope gets its own instance.
- **Status**: RESOLVED — implemented in `useAIChatProvider.tsx`

### Decision 8: Split ChatConfig into Sub-Configs
- **Rationale**: ChatConfig god object mixes transport, session, persistence, i18n, user info. See proposal-package-extraction-review.md I3.
- **Implementation**: Split into `TransportConfig`, `ChatBehaviorConfig`, `ChatUIConfig` under `ChatConfig` wrapper.
- **Status**: RESOLVED — implemented in `src/domain/types/ai-chat/chatConfig.ts`

---

## Canonical Package Structure (Proposed)

```
@eleva/ai-chat-core          — Types, constants, Zod schemas, pure utilities
@eleva/ai-chat-react-native  — React Native hooks, components, parts
@eleva/ai-chat-vue            — Vue composables, components, parts
@eleva/ai-generative-ui       — View schemas, block registry, ViewRenderer, BlockRenderer
```

Note: The `@eleva/ai-generative-ui` package is the new addition for the view system. It depends on `@eleva/ai-chat-core` for shared types.

---

## Terminology Decisions (ALL SETTLED as of 2026-03-03)

| Old Term | New Term | Status |
|----------|----------|--------|
| Onboarding | AI-driven flow / AI flow | ✓ DECIDED |
| Slide | View (AI View / AI Generated View) | ✓ DECIDED |
| Onboarding Framework | AI Generative UI Framework | ✓ DECIDED |
| `render_slide` | `render_view` | ✓ DECIDED |
| `SlideSchema` | `ViewSchema` | ✓ DECIDED |
| `SlideRenderer` | `ViewRenderer` | ✓ DECIDED |
| `OnboardingScreen` | `AIViewScreen` | ✓ DECIDED |
| `onboardingSlice` | `aiViewSlice` | ✓ DECIDED |
| `useOnboardingChat` | `useAIViewChat` | ✓ DECIDED |
| "slide" everywhere | "view" everywhere | ✓ DECIDED |
| Flow | Thread / Conversation Flow | ✓ DECIDED (already generic) |
| Step | Step (keep) | ✓ DECIDED (already generic) |
| Block | Block (keep) | ✓ DECIDED (already generic) |

---

## Open Issues / Unresolved

### BLOCKING Phase 1 (must resolve before writing any Phase 1 code)

1. **SPIKE-1 — Tool part runtime shape**: Must verify actual runtime shape of tool call parts in Vercel AI SDK v5 with our Chatwoot backend. Specifically: is tool name in `part.toolName` or parsed from `part.type`? Are args in `part.args` or `part.input`? What is the `toolCallId` key name? See `spike-1-tool-part-shape.md`.

2. **SPIKE-2 — OpenAI strict mode + ViewSchema**: Must validate 5-block MVP ViewSchema against OpenAI structured output `strict: true`. The discriminated union of 11 block types may exceed schema complexity limits. See `spike-2-openai-strict-schema.md`.

### Non-blocking (future work)

3. **FlashList performance with variable-height views**: Full-width views with different block counts create variable heights — FlashList's recycling may glitch. Evaluate at Phase 1 implementation time.

4. **Vue has no TypeScript**: Web AI chat codebase has no TS, no Zod validation, no type guards — significant gap vs mobile. Tracked in proposal-vue-web-improvements.md.

5. **Package versioning strategy**: No monorepo tooling, no changeset automation, no publishing workflow defined. Defer until package extraction (Phase 5).

### RESOLVED (previously open, now closed)

- ~~G4 Adapter wiring~~ → RESOLVED: Hybrid pattern (reactive reads use selectors, imperative commands use adapter). Documented in implementation-plan-gaps.md.
- ~~G5 Theme duplication~~ → RESOLVED: No work needed.
- ~~G6 Markdown abstraction~~ → RESOLVED: Registry injection pattern implemented (`markdownRenderer` slot in `AIChatRegistries`).
- ~~G7 Hook tests~~ → RESOLVED: 129 tests added across `useAIChat`, `useAIChatSessions`, `useAIChatScroll`, `useAIChatBot`.
- ~~G8 Web Vue dependencies~~ → RESOLVED: 3 Vue files decoupled from Chatwoot-internal imports.
- ~~ChatConfig god object~~ → RESOLVED: Split into `TransportConfig`, `ChatBehaviorConfig`, `ChatUIConfig`.
- ~~Block registry singleton~~ → RESOLVED: Context-scoped via `AIChatProvider`.

---

## Phase Readiness

### Phase 0: Extraction Prep — ALL COMPLETE ✓

All Phase 0 prerequisites (G4–G8) are resolved. The codebase is extraction-ready for the AI chat infrastructure.

### Phase 1: render_view MVP — BLOCKED on SPIKE-1 and SPIKE-2

Phase 1 cannot begin until both spikes are completed and documented:
- **SPIKE-1** must confirm the exact tool part shape so `AIPartRenderer` can correctly dispatch `render_view` tool parts.
- **SPIKE-2** must confirm whether the 5-block MVP ViewSchema is accepted by OpenAI `strict: true`.

Both spikes are estimated at 0.5 day each. Total blocking time: 1 day.

---

## What Has Already Been Implemented (as of 2026-03-03)

### Mobile (chatwoot-mobile-app)
- Full AI chat streaming with Vercel AI SDK v5
- Part-based message rendering (AITextPart, AIToolPart, AIReasoningPart)
- Part registry pattern (AIPartRenderer dispatches by part type — `startsWith('tool-')` for tool parts, then `toolName` lookup in tools registry)
- Context-scoped part + tool registries (via `AIChatProvider`)
- Session management (create, list, switch, delete sessions)
- Message bridge (SDK ↔ Redux persistence)
- Scroll management (auto-scroll, scroll-to-top/bottom)
- Error categorization and display
- i18n (en + es, 100% parity)
- Radix theme system (12-step color scales, semantic tokens)
- `ChatConfig` split into `TransportConfig`, `ChatBehaviorConfig`, `ChatUIConfig`
- `SessionsAdapter`, `PersistenceAdapter` interfaces
- Zod schemas for message/session validation
- Markdown abstraction: `markdownRenderer` injected via `AIChatProvider` registry (no hard dependency on `react-native-markdown-display` in framework components)
- 129 hook-level tests across 4 core hooks

### Web (chatwoot)
- Full AI chat streaming with Vercel AI SDK v5 (@ai-sdk/vue)
- Part-based rendering (AiTextPart, AiToolPart, AiReasoningPart, AiCollapsiblePart)
- Part registry (AiPartRenderer dispatches by part type)
- Session management (create, list, switch, delete)
- Auto-scroll with RAF
- Error display
- i18n (en + es via aiChatI18n composable)
- Activity message localization
- Comprehensive test coverage (17 spec files)
- Vue components decoupled from Chatwoot-internal imports (AiChatHeader, AiPromptInput, AiReasoningPart)

### What's NOT Yet Implemented
- View rendering system (ViewRenderer, BlockRenderer, block components)
- Block registry
- `render_view` tool handling
- Dual presentation modes (inline/full-view)
- Step registry and flow state machine
- MiniChatBar
- Staggered entrance animations for views
- Any package extraction
