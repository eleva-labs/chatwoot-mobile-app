# AI Onboarding Framework: Landscape Analysis

> **Date**: 2026-02-27
> **Consolidation of**: Research 1A (Frameworks), 1B (Generative UI), 1C (Schema Renderers), 1D (Products)

---

## Executive Summary

No existing framework, library, or product combines AI-driven runtime UI composition, slide-based structured layouts, React Native support, and Vercel AI SDK v5 integration. The pieces exist separately: Vercel AI SDK v5 provides the tool-call streaming pattern, assistant-ui offers React Native chat primitives with generative UI hooks, and products like WhatsApp Flows and Typeform validate the slide-per-question UX. Our job is to combine these into a custom framework built on the Vercel AI SDK tool-call pattern, with a purpose-built React Native rendering layer for our slide/block vocabulary.

---

## Key Findings

### 1. No Existing Solution Covers Our Full Scope

Our requirements combine five capabilities that no single product or framework offers together:

| Capability | Best Existing Solution | Gap |
|-----------|----------------------|-----|
| AI-driven UI at runtime (not build-time) | JotForm AI Agents, Typeform Interaction AI | Chat-only, no structured slides |
| Slide-based structured layouts | WhatsApp Flows, Typeform | Not AI-composed, developer-configured |
| React Native rendering | assistant-ui `@assistant-ui/react-native` | No slide/block vocabulary, chat-only |
| Vercel AI SDK v5 tool-call streaming | Already in our stack | No existing RN generative UI examples |
| Cross-platform schema (RN + Web) | CopilotKit AG-UI, A2UI | No RN client for any of these protocols |

The gap is clear: generative UI frameworks (CopilotKit 29k stars, Tambo 11k stars) are React web-only. React Native form renderers are abandoned or immature. No product does AI-composed slides on mobile.

### 2. The Vercel AI SDK Tool-Call Pattern Is Our Foundation

The tool-call → component mapping pattern from AI SDK v5 is the dominant production approach for generative UI, used by v0.dev and validated by CopilotKit and assistant-ui. It maps directly to our architecture:

1. **Define tools with Zod schemas** on the server: `render_slide`, `show_progress`, `mark_step_complete`
2. **LLM calls tools** based on conversation context and onboarding goals
3. **Tool parts stream** to the client via `toUIMessageStreamResponse()` (SSE)
4. **Client renders** typed tool parts: `part.type === 'tool-render_slide'` → `<OnboardingSlide />`
5. **User input returns** via `addToolOutput()` (structured) or `sendMessage()` (free-form text)
6. **Multi-step chaining** handles slide-after-slide progression within one conversation

This works in React Native today. `@ai-sdk/react` (`useChat` hook) is a pure React hook with no DOM dependency. We already use it for our AI chat feature.

**Complementary pattern**: Custom data parts (`createUIMessageStream` + `writer.write()`) for server-driven updates (loading states, progress indicators) that don't need LLM decision-making. Same `id` enables reconciliation/update-in-place.

### 3. The Rendering Layer Must Be Custom-Built

The React Native JSON-schema form renderer ecosystem is barren:

| Library | RN Support | Stars | Status |
|---------|-----------|-------|--------|
| RJSF | No | 15.7k | Web-only (DOM elements) |
| JSON Forms | No | 2.6k | Web-only (no RN renderer set) |
| Formily | Claimed, unverified | 12.6k | `@formily/react-native` doesn't exist on npm |
| uniforms | No | ~1.9k | Web-only (has Zod bridge — useful pattern) |
| UI-Schema | Demo exists | 370 | Pre-1.0, RN demo is a quick POC |
| SurveyJS RN | POC (v0.1.1) | ~4.5k | Text-only, 0 weekly downloads |

Beyond maturity issues, none of these support our custom block vocabulary (`single-choice`, `image-choice`, `loading`, `success`, `progress`, `big-text`). None integrate with Vercel AI SDK streaming. None support twrnc/Radix styling.

A custom renderer is straightforward to build: a type→component registry, a recursive block walker, Zod validation, and per-slide form state. The patterns are well-established from Airbnb/Shopify server-driven UI, Slack Block Kit, and SurveyJS's `registerQuestionRenderer` API.

### 4. assistant-ui Is Worth Evaluating

`assistant-ui` (`@assistant-ui/react-native`) is the only open-source library with:
- First-class React Native/Expo support with shared `@assistant-ui/core`
- Vercel AI SDK v5 integration
- Tool-based generative UI (`useAssistantToolUI`, `makeAssistantTool`)
- Speech-to-text and TTS guides
- Thread management with AsyncStorage persistence
- Selector-based re-renders for performance

**The tradeoff**:

| Factor | Adopt assistant-ui | Build on raw AI SDK |
|--------|-------------------|-------------------|
| Chat UI layer | Get it free | Reuse our existing AI Chat UI |
| Tool UI registration | `useAssistantToolUI` — clean API | Custom `parts.map()` switch — more code |
| Thread persistence | Built-in | Must build ourselves |
| Dependency risk | v0.11-0.12, evolving API | Stable (AI SDK v5) |
| Customization ceiling | Limited by their component model | Unlimited |
| Migration cost | Replace our current AI Chat UI | Extend our current AI Chat UI |

**Recommendation**: Evaluate assistant-ui in a spike (2-3 days). If the tool UI registration and thread management save us significant work without constraining our slide UX, adopt it. If it forces compromises on our slide/block rendering (e.g., everything must live inside chat bubbles), build on raw AI SDK and reuse our existing chat infrastructure.

### 5. Key Patterns From the Market

| Pattern | Source | Implication |
|---------|--------|------------|
| **One-question-at-a-time** | Typeform (3.5x completion rate claim) | Validates our slide-per-step model |
| **Structured screens in chat** | WhatsApp Flows | Closest UX to our vision — slides appear inline in conversation |
| **Block-based composition** | Slack Block Kit, Tally | JSON schema with composable typed blocks is proven at scale |
| **Static Generative UI taxonomy** | CopilotKit | Our approach = "Static GenUI": finite component vocabulary, AI selects |
| **AI at interaction time** | JotForm AI Agents, Typeform Clarify | Runtime AI (not build-time) is the differentiator |
| **Slot-filling for voice** | Alexa, Google Assistant (deprecated) | Future voice phase: AI asks, user speaks, system extracts structured values |
| **Layered interaction** | Telegram Bots | Simple → inline buttons; complex → full-screen Mini Apps |
| **Zod-schema component registration** | Tambo | Register components with Zod schemas; AI picks and streams props |

---

## Technology Landscape Matrix

| Name | Type | Platform | AI Integration | Schema Format | RN Support | Maturity | Relevance |
|------|------|----------|---------------|--------------|-----------|----------|-----------|
| **Vercel AI SDK v5** | Framework | React, RN | Tool calls + streaming | Zod | Yes (`useChat`) | Production | **CRITICAL** |
| **assistant-ui** | UI Library | React + RN | AI SDK, LangGraph, Mastra | Zod / JSON Schema | **Yes** (Expo) | v0.11 (active) | **HIGH** |
| **CopilotKit** | Framework | React, Angular | AG-UI protocol | AG-UI / Zod | No | Production (web) | HIGH (patterns) |
| **Tambo** | SDK | React | Built-in agent | Zod schemas | No | v1.0 | HIGH (patterns) |
| **WhatsApp Flows** | Platform | WhatsApp | None (developer config) | Custom JSON | N/A | Production | HIGH (UX ref) |
| **Slack Block Kit** | Platform | Slack | None | Custom JSON | N/A | Production | MEDIUM (schema ref) |
| **Typeform AI** | Product | Web | Runtime (Clarify AI) | Proprietary | No | Production | MEDIUM (UX ref) |
| **JotForm AI Agents** | Product | Web + mobile | GPT-4 agent | Proprietary | Partial | Production | MEDIUM (concept) |
| **UI-Schema** | Library | React + RN demo | None | JSON Schema | POC | Pre-1.0 | LOW-MEDIUM |
| **RJSF** | Library | React web | None | JSON Schema + uiSchema | No | Production | LOW (web only) |
| **JSON Forms** | Library | React, Vue, Angular | None | JSON Schema + UI Schema | No | v3.7 | LOW (web only) |
| **SurveyJS RN** | Library | RN (POC) | None | Custom JSON | v0.1.1 | Early | LOW |
| **Open-JSON-UI** | Spec | Cross-platform | Agent output | JSON | Conceptual | Emerging | WATCH |
| **A2UI (Google)** | Spec | Cross-platform | Agent output | JSONL | Conceptual | Emerging | WATCH |

---

## Recommended Architecture Direction

### 1. Rendering Approach: Build Custom, Evaluate assistant-ui for Chat Layer

**Decision**: Build a custom slide/block renderer. Use our existing AI Chat UI for the chat layer, OR adopt assistant-ui if the spike proves it's a net win.

The slide renderer is a ~500-line module: a block registry mapping type strings to React Native components, a recursive renderer, and Zod validation. This is not complex enough to justify a dependency. Our block vocabulary (`single-choice`, `image-choice`, `loading`, `success`, etc.) is domain-specific — no library will provide these.

For the chat layer (message list, streaming text, input bar), assistant-ui may save work. Spike it.

### 2. Schema Format: Zod Schemas as Tool Input Definitions

**Decision**: Define slide/block schemas as Zod objects that serve as Vercel AI SDK tool input schemas.

This unifies three concerns:
- **AI contract**: The Zod schema IS the tool definition the LLM sees
- **Validation**: Zod validates LLM output on both server and client
- **Types**: `z.infer<typeof slideSchema>` generates TypeScript types

Do not use raw JSON Schema — Zod is strictly more expressive and we already use it everywhere. The AI SDK converts Zod to JSON Schema for the LLM wire format automatically.

### 3. AI Integration: Tool Calls via Vercel AI SDK v5

**Decision**: Confirmed. Use `streamText` + tools + `toUIMessageStreamResponse()` on the server, `useChat` + `message.parts` on the client.

Supplement with custom data parts for non-LLM-driven updates (progress bars, loading states). Use `strict: true` on tool definitions to guarantee valid schemas from the LLM (eliminates most client-side fallback logic).

### 4. Cross-Platform Strategy: Shared Schema + Platform-Specific Renderers

**Decision**: Three-layer architecture:

```
┌────────────────────────────────────┐
│  Shared (TypeScript package)       │
│  • Zod schemas (slide, blocks)     │
│  • Tool definitions                │
│  • State machine logic             │
│  • useChat hook integration        │
│  • Validation utilities            │
└──────────────┬─────────────────────┘
               │
    ┌──────────┴──────────┐
    ▼                     ▼
┌────────────┐    ┌────────────┐
│ RN Renderer│    │Web Renderer│
│ twrnc/Radix│    │ Tailwind   │
│ Reanimated │    │ CSS        │
│ FlashList  │    │ (future)   │
└────────────┘    └────────────┘
```

The shared layer is ~80% of the logic. Platform renderers are thin component maps.

### 5. Reuse From Existing AI Chat UI

| Asset | Reuse? | How |
|-------|--------|-----|
| `useAIChat` hook (Vercel AI SDK wrapper) | **Yes** | Extend with onboarding-specific tool handling |
| `useAIChatMessages` (merged streaming + persisted) | **Yes** | Same message merging pattern |
| `AIMessageBubble` + parts rendering | **Extend** | Add `tool-render_slide` part type alongside existing `text`, `reasoning`, `tool` parts |
| `AIChatMessagesList` (FlashList) | **Extend** | Slides render as full-width items in the same list |
| `AIChatHeader` / `AIChatError` / `AIChatEmptyState` | **Replace** | Onboarding needs its own header, empty state, error UI |
| Redux store patterns | **Yes** | New slice for onboarding state, same Zod-validated pattern |
| Radix theme + twrnc styling | **Yes** | Same theming system |
| `DefaultChatTransport` (HTTP + SSE) | **Yes** | Same transport, different endpoint |

---

## Risks and Open Questions

| Risk | Severity | Mitigation |
|------|----------|------------|
| LLM produces invalid slide schemas | Medium | `strict: true` on tool defs + Zod validation + fallback to plain text |
| LLM ignores tool calls, responds with text only | Medium | `tool_choice: "required"` + strong system prompt + retry logic |
| assistant-ui dependency becomes abandoned or diverges | Medium | Evaluate in spike; if adopted, our slide renderer is independent of it |
| Streaming interruptions on mobile | Low | AI SDK handles reconnection; persist partial state in Redux |
| Performance on low-end devices (complex slide rendering) | Medium | Profile early; use FlashList, memoize blocks, lazy-load heavy components |
| Cross-platform schema divergence over time | Low | Shared TypeScript package with CI validation |
| Voice input integration (future) | Deferred | assistant-ui has STT guides; design schema to accept voice-extracted values |

**Open questions for Phase 2**:
1. Should slides render inline in the message list (WhatsApp Flows style) or as a separate full-screen layer?
2. How does back-navigation work — scroll up in list, or state machine rewind?
3. How are onboarding flow definitions configured per tenant (system prompt? tool definitions? both?)
4. What is the exact tool taxonomy — one `render_slide` tool with block arrays, or separate tools per block type?
5. How does partial save work — on each block completion, each slide submission, or agent-triggered?

---

## Next Steps for Phase 2

1. **Spike assistant-ui** (2-3 days): Build a minimal onboarding flow with `@assistant-ui/react-native` + one `render_slide` tool. Evaluate: does it constrain our slide UX? Does it save meaningful effort?

2. **Define the slide/block schema spec**: Formalize Zod schemas for all 12 block types. Define the `render_slide` tool input schema. Decide on single-tool vs multi-tool approach.

3. **Design the state machine**: Step progression, branching, back-navigation, resume-from-checkpoint. Evaluate XState or a lightweight custom FSM.

4. **Design the renderer architecture**: Block registry, recursive renderer, form state management (react-hook-form or Zustand), validation integration.

5. **Design the AI integration layer**: System prompt structure, tool definitions, how flow config maps to agent instructions, how collected data feeds back to context.

6. **Define the chat+slide coexistence model**: How slides and chat messages interleave in the UI. Layout decisions, transition animations, scroll behavior.
