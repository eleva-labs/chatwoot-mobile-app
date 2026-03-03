# Research 2A: assistant-ui Deep Technical Evaluation

> **Date**: 2026-02-27
> **Decision**: BUILD CUSTOM
> **Confidence**: High

---

## 1. What assistant-ui Is and How It Works

### Overview

assistant-ui is a Y Combinator-backed open-source TypeScript/React library (8.6k GitHub stars) for building AI chat interfaces. It provides composable primitives inspired by shadcn/ui and Radix, with a runtime abstraction layer that decouples UI from state management.

### Architecture (Three Layers)

```
┌─────────────────────────────────────────────────┐
│  UI Layer                                       │
│  Primitives: Thread, Composer, Message, etc.    │
│  Web: DOM elements (div, input, button)         │
│  RN:  Native elements (View, TextInput, etc.)   │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────┐
│  Core Layer (@assistant-ui/core)                │
│  Runtime: AssistantRuntime → ThreadRuntime       │
│  State: Zustand stores with selector-based subs │
│  Types: ThreadMessage, MessagePart, etc.        │
│  Tools: useAssistantTool, makeAssistantToolUI   │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────┐
│  Runtime Adapters                               │
│  LocalRuntime (built-in state)                  │
│  ExternalStoreRuntime (bring your own Redux)    │
│  AI SDK Integration (@assistant-ui/react-ai-sdk)│
│  LangGraph, Mastra, etc.                        │
└─────────────────────────────────────────────────┘
```

**Key design principle**: The runtime owns all state. UI components subscribe to runtime state via Zustand selectors. You pick a runtime (Local, ExternalStore, AI SDK) and the UI components "just work."

### Package Structure

| Package | Purpose | Latest Version |
|---------|---------|---------------|
| `@assistant-ui/core` | Shared runtime, types, state management | 0.1.1 |
| `@assistant-ui/store` | Zustand-based store with scoped selectors | 0.2.1 |
| `@assistant-ui/react` | Web UI primitives (DOM) | 0.12.x |
| `@assistant-ui/react-native` | **RN UI primitives** | **0.1.1** |
| `@assistant-ui/react-ai-sdk` | AI SDK v6 integration | 0.12.x |
| `@assistant-ui/react-data-stream` | Data stream protocol | 0.12.x |
| `assistant-stream` | Streaming utilities | 0.3.x |

---

## 2. React Native Support: Reality Check

### The Facts

- **Package**: `@assistant-ui/react-native` v0.1.1
- **First published**: 2026-02-20 (7 days ago)
- **Last published**: 2026-02-25 (2 days ago)
- **Total versions**: 2 (0.1.0 and 0.1.1)
- **Dev dependency**: `react-native@^0.84.0` (current is 0.76.x for Expo SDK 52; 0.84.0 is bleeding edge or future)
- **Expo example**: Uses Expo SDK 54 with React 19.2 and RN 0.84.0
- **No `@assistant-ui/react-ai-sdk` for RN**: The AI SDK integration package is web-only (`@assistant-ui/react-ai-sdk` requires `@assistant-ui/react`, not `react-native`)

### What the RN Package Actually Provides

Based on the source index and documentation:

**Included (legitimate RN primitives):**
- `AssistantProvider` + `useLocalRuntime` — Runtime setup
- `ThreadRoot`, `ThreadMessages`, `ThreadEmpty`, `ThreadIf` — FlatList-based message list
- `ComposerRoot`, `ComposerInput`, `ComposerSend`, `ComposerCancel` — TextInput wiring
- `MessageRoot`, `MessageContent`, `MessageIf` — Message rendering with part dispatching
- `ActionBarCopy`, `ActionBarEdit`, `ActionBarReload` — Message actions
- `BranchPickerPrevious/Next` — Branch navigation
- `ThreadListRoot`, `ThreadListItems`, `ThreadListNew` — Multi-thread management
- `ChainOfThought` primitives — Collapsible reasoning
- `Attachment` primitives — File handling
- `Suggestion` primitives — Suggested prompts
- `useAssistantTool`, `useAssistantToolUI`, `makeAssistantTool` — Tool registration
- `useAuiState`, `useAui` — Selector-based state access
- Thread persistence via AsyncStorage adapter
- `useRemoteThreadListRuntime` — Backend thread management

**NOT included (must build yourself):**
- AI SDK v5/v6 integration (no `useChatRuntime` for RN — web only)
- Streaming transport (you write your own `ChatModelAdapter` that does fetch + SSE parsing)
- Markdown rendering
- Any styling whatsoever (primitives are unstyled View/TextInput/Pressable)
- FlashList support (uses FlatList)
- Keyboard avoiding behavior
- Scroll management (auto-scroll, scroll-to-bottom)
- Error UI
- Typing indicators
- Any animation

### Compatibility Assessment

| Factor | Status | Notes |
|--------|--------|-------|
| Expo SDK 52 | **INCOMPATIBLE** | Example uses SDK 54 + RN 0.84. Our app is SDK 52 + RN 0.76. Peer dep says `react-native: "*"` so it *might* work but is untested. |
| React 18 | **Likely OK** | Peer dep: `react: "^18 \|\| ^19"`. Core logic should work. |
| AI SDK v5 integration | **NOT AVAILABLE** | AI SDK integration is web-only. No `useChatRuntime` for RN. `@assistant-ui/react-ai-sdk` now requires AI SDK v6 (v5 marked "no longer supported"). |
| Custom backend | **Available** | `ChatModelAdapter` pattern works, but you write all streaming logic yourself. |
| twrnc/Radix styling | **No conflict** | Primitives are unstyled — you can style however you want. But you get zero visual components. |

### Verdict on RN Maturity

**The React Native package is 7 days old, at version 0.1.1, with 2 total releases.** It was clearly built for Expo SDK 54 / RN 0.84 (a version that doesn't exist in stable Expo yet). It has no AI SDK integration — the integration package (`@assistant-ui/react-ai-sdk`) is web-only and now requires AI SDK v6 (we're on v5).

This is a tech preview, not a production-ready library. The documentation is good (suggesting they're investing in it), but the codebase is days old.

---

## 3. Generative UI Capabilities Assessment

### Tool UI System (Web)

The web version of assistant-ui has a mature tool UI system:

```tsx
// Register a tool UI renderer
const WeatherToolUI = makeAssistantToolUI<
  { location: string },
  { temperature: number }
>({
  toolName: "getWeather",
  render: ({ args, result, status, addResult }) => {
    if (status.type === "running") return <Loading />;
    return <WeatherCard data={result} />;
  },
});

// Mount inside provider to register
<AssistantRuntimeProvider runtime={runtime}>
  <Thread />
  <WeatherToolUI />
</AssistantRuntimeProvider>
```

**How it works**:
1. `makeAssistantToolUI` creates a component that registers a renderer in the runtime's tool registry
2. When `MessageContent` encounters a `tool-call` part with matching `toolName`, it renders your component instead of the fallback
3. The `render` function receives: `args`, `result`, `status` (running/complete/incomplete/requires-action), `addResult` (for human-in-the-loop), `resume`/`interrupt` (for tool pausing)

**Key capabilities**:
- Streaming partial results during tool execution
- Human-in-the-loop: `addResult()` sends user input back as the tool result
- Tool interrupts: `human()` in execute function pauses for user input, renders UI with `interrupt.payload`
- Field-level validation via `useToolArgsFieldStatus`
- Status handling: running, complete, incomplete (error/cancelled), requires-action

### Tool UI in React Native

The RN package re-exports `useAssistantTool`, `useAssistantToolUI`, and `makeAssistantTool` from `@assistant-ui/core`. The `MessageContent` primitive supports `renderToolCall` render prop. **This means tool UI registration should work in RN** — the registration is in core, and the rendering happens via the primitive.

However:
- **No examples of tool UI in RN exist** in their docs or repo
- All tool UI documentation and examples are web-only with DOM elements
- The `addResult` callback works at the core level, but there are zero RN examples of human-in-the-loop

### Mapping to Our Slide/Block System

Our vision: the AI calls `render_slide` with a JSON schema containing blocks (`single-choice`, `text-input`, `big-text`, etc.). The client renders this as a full-screen slide.

With assistant-ui's tool UI system:
```tsx
// Hypothetical: Register slide renderer
const SlideToolUI = makeAssistantToolUI<SlideSchema, SlideResult>({
  toolName: "render_slide",
  render: ({ args, addResult, status }) => {
    // args.blocks = [{ type: "single-choice", ... }]
    // Render full-width slide with blocks
    // On submit: addResult({ business_type: "ecommerce" })
    return <OnboardingSlide schema={args} onSubmit={addResult} />;
  },
});
```

**This could work in theory**, but:
1. It renders inside a chat message bubble — not as a standalone full-screen slide
2. The tool UI is scoped to a message part; breaking out of the message list layout requires custom work
3. `addResult` sends the result back and resumes the AI — this maps well to our flow
4. But the entire slide rendering, block registry, form state, validation — we build all of that ourselves regardless

---

## 4. Integration with Our Existing Stack

### The Critical Incompatibility: AI SDK v5 vs assistant-ui's Requirements

**Our stack**: Vercel AI SDK v5 (`ai@5.0.93`, `@ai-sdk/react@^2.0.93`)
**assistant-ui's position**: AI SDK v5 is "no longer supported." `@assistant-ui/react-ai-sdk` requires AI SDK v6+.

This means:
1. We cannot use `useChatRuntime` (the bridge between AI SDK and assistant-ui) — it's web-only AND requires v6
2. To use assistant-ui with our backend, we'd use `useLocalRuntime` with a custom `ChatModelAdapter`
3. This means **completely rewriting our transport layer** — our `DefaultChatTransport` + `useChat` + all 5 streaming invariants would be replaced by a custom adapter

### What We'd Keep vs Rewrite

| Component | Keep? | Why |
|-----------|-------|-----|
| `useAIChat` hook (432 lines) | **DISCARD** | Replaced by assistant-ui's `useLocalRuntime` + `ChatModelAdapter` |
| `useAIChatMessages` | **DISCARD** | assistant-ui manages message state internally |
| `useAIChatSessions` (bridge effect, 5 invariants) | **DISCARD** | assistant-ui has its own thread management |
| `useAIChatScroll` | **DISCARD** | Must build from scratch (assistant-ui RN has no scroll management) |
| `useAIChatBot` | **KEEP** | Bot selection is independent |
| `AIChatMessagesList` (FlashList) | **DISCARD** | Replaced by `ThreadMessages` (FlatList). We lose FlashList performance. |
| `AIMessageBubble` | **DISCARD** | Replaced by custom `renderMessage` in `ThreadMessages` |
| `AIPartRenderer` | **PARTIALLY** | Tool UI registration replaces per-part dispatch, but we'd still need text/reasoning renderers |
| `AITextPart` (markdown + cursor) | **REBUILD** | assistant-ui RN has no markdown. We'd rewrite our markdown renderer to work with their primitives. |
| `AIToolPart` | **DISCARD** | Replaced by tool UI system |
| `AIReasoningPart` | **REBUILD** | assistant-ui RN has `ChainOfThought` primitives but they're basic containers |
| `AIChatHeader` / `AIChatError` | **REBUILD** | Not provided by assistant-ui |
| `AIInputField` | **DISCARD** | Replaced by `ComposerInput` + `ComposerSend` |
| Redux store (`aiChatSlice`) | **UNCLEAR** | assistant-ui uses Zustand internally. `ExternalStoreRuntime` exists but is web-only. Our Redux patterns may conflict. |
| `DefaultChatTransport` + SSE streaming | **DISCARD** | Replaced by `ChatModelAdapter` — we'd rewrite SSE parsing inside the adapter |
| Auth headers pattern (`getStore()`) | **ADAPT** | Move into the `ChatModelAdapter`'s fetch calls |
| AsyncStorage session persistence | **REPLACE** | assistant-ui has its own AsyncStorage adapter |

### The 5 Streaming Safety Invariants

This is the hardest part. Our invariants solve real bugs:

1. **Session ID ref-then-state deferral** — assistant-ui manages threads differently (thread IDs assigned client-side via `useLocalRuntime`). This invariant becomes N/A but only because we lose server-assigned session IDs.

2. **Bridge effect streaming guard** — assistant-ui doesn't have a bridge effect (no Redux ↔ SDK bridging). The problem disappears because we're not bridging two state systems. But we lose the Redux persistence model.

3. **Stable SDK callback refs** — assistant-ui's `useLocalRuntime` uses Zustand internally, which has its own stability guarantees. Different patterns, different bugs.

4. **Transport useMemo non-reactive deps** — Replaced by `ChatModelAdapter`. We'd need to ensure the adapter doesn't recreate on re-render (same problem, different shape).

5. **Bridge key fingerprint dedup** — N/A without the bridge. But we'd need equivalent dedup logic if we build our own persistence.

**Bottom line**: The invariants don't "survive" — they become irrelevant because the entire streaming architecture changes. But we'd likely discover new, equivalent bugs with assistant-ui's Zustand-based state management that we'd have to solve from scratch.

### ExternalStoreRuntime — The Redux Bridge

assistant-ui does have an `ExternalStoreRuntime` that works with Redux. It bridges your existing state manager with assistant-ui components. However:

1. **It's documented and designed for web** — all examples use `@assistant-ui/react`
2. **The RN package doesn't export it** — the RN `index.ts` exports `useLocalRuntime` and `useRemoteThreadListRuntime`, not `useExternalStoreRuntime`
3. Even if we import it from core, we'd need to validate it works with RN primitives
4. The adapter pattern requires implementing `onNew`, `onEdit`, `onReload`, `onCancel`, `convertMessage`, `setMessages` — essentially rebuilding all our logic in assistant-ui's interface

---

## 5. Migration Cost Analysis

### Effort Estimate: Adopting assistant-ui

| Task | Effort | Risk |
|------|--------|------|
| Write `ChatModelAdapter` to replace `DefaultChatTransport` + SSE streaming | 2-3 days | Medium — must handle SSE parsing, auth headers, session ID extraction ourselves |
| Rewrite message rendering using assistant-ui primitives | 3-4 days | Low — primitives are well-designed |
| Reimplement markdown rendering for RN (assistant-ui has none) | 1-2 days | Low — we can port our existing `AITextPart` |
| Reimplement scroll management (assistant-ui RN has none) | 1-2 days | Medium — their FlatList has no auto-scroll |
| Reimplement error handling + display | 1 day | Low |
| Migrate session management from Redux to assistant-ui threads | 2-3 days | High — different paradigm, new bugs |
| Build slide/block renderer (same effort regardless) | 5-7 days | N/A — same either way |
| Test + debug new streaming bugs with Zustand runtime | 3-5 days | **High** — we'd discover new race conditions |
| Verify Expo SDK 52 compatibility (untested) | 1-2 days | **High** — package built for SDK 54 / RN 0.84 |
| **Total adoption effort** | **19-29 days** | |

### Effort Estimate: Building Custom

| Task | Effort | Risk |
|------|--------|------|
| Add `tool-render_slide` part type to `AIPartRenderer` | 0.5 days | Low — extending existing switch |
| Build slide renderer (schema → React Native components) | 5-7 days | Medium — core custom work |
| Build block components (single-choice, multi-choice, text-input, etc.) | 5-7 days | Low — standard RN components |
| Add `addToolOutput` for user responses back to AI | 1-2 days | Low — AI SDK v5 supports this |
| Add slide transitions / animations | 2-3 days | Low |
| Add onboarding state machine (step progression, back-nav) | 2-3 days | Medium |
| Session persistence for onboarding (extend Redux patterns) | 1-2 days | Low — proven patterns |
| **Total custom build effort** | **16-24 days** | |

### Key Insight

The slide/block renderer is 5-7 days of work **regardless of which path we choose**. assistant-ui provides zero slide/block components. The only thing assistant-ui saves us is reimplementing what we already have (chat UI, message list, input bar, tool rendering). And adopting it requires us to rewrite things we already have that work.

---

## 6. Build vs Adopt Comparison Table

| Criterion | Adopt assistant-ui | Build Custom |
|-----------|-------------------|-------------|
| **Integration effort** | 19-29 days (rewrite everything) | 16-24 days (extend what we have) |
| **Code preservation** | ~10% survives (bot hook, theme, i18n) | ~80% survives (all hooks, store, components) |
| **Streaming stability** | Unknown — new Zustand runtime, untested | Proven — 5 invariants battle-tested |
| **Slide/block rendering** | Build it ourselves regardless | Build it ourselves regardless |
| **RN maturity** | v0.1.1, 7 days old, untested on our SDK | N/A — our own code |
| **AI SDK compatibility** | v5 not supported, would need custom adapter | v5 fully integrated and working |
| **FlashList support** | No (FlatList only) | Yes (already using) |
| **Scroll management** | None in RN package | Already built (`useAIChatScroll`) |
| **Markdown rendering** | None in RN package | Already built (`AITextPart`) |
| **Error handling** | None in RN package | Already built (`AIChatError`) |
| **Tool UI registration** | Clean API (`makeAssistantToolUI`) | Manual per-part switch (more code, more control) |
| **Thread persistence** | Built-in AsyncStorage adapter | We build (but simple — proven patterns) |
| **Redux compatibility** | Unclear — ExternalStoreRuntime is web-focused | Full — same patterns as rest of app |
| **Expo SDK 52 compat** | **Untested** (built for SDK 54 / RN 0.84) | **Guaranteed** (it's our app) |
| **Dependency risk** | v0.1 library with evolving API | Zero dependency risk |
| **Cross-platform (web)** | Strong web story (main package) | Need separate web implementation |
| **Maintenance burden** | Track upstream breaking changes | Own everything |
| **Debug transparency** | Black box (Zustand internals, core logic) | Full visibility (our code) |
| **Community/support** | Active Discord, Y Combinator backed | Self-supported |

---

## 7. Recommendation: BUILD CUSTOM

### The Decision

**Build custom on top of our existing AI Chat UI.** Do not adopt assistant-ui for the onboarding framework.

### Justification

**1. The RN package is not ready.**
`@assistant-ui/react-native` is 7 days old at v0.1.1, built for Expo SDK 54 / RN 0.84 (we're on SDK 52 / RN 0.76). It has 2 total npm releases, zero production users we know of, and is missing fundamental features we already have: FlashList, scroll management, markdown rendering, error handling, keyboard avoidance. Betting our onboarding framework on this would be irresponsible.

**2. The adoption cost exceeds the custom build cost.**
Adopting assistant-ui means discarding 80% of our working AI Chat UI (all 5 hooks, all components, all part renderers, the streaming transport) and rewriting it in assistant-ui's paradigm. The migration estimate is 19-29 days. Building custom is 16-24 days. The math doesn't work — we spend *more* time to adopt than to build, and we lose proven, battle-tested code.

**3. The slide renderer — the hard part — is the same either way.**
assistant-ui provides zero slide/block components. Whether we adopt or build custom, we're writing: the block registry, the 12+ block components (`single-choice`, `image-choice`, `text-input`, etc.), the form state management, validation, transitions, and the slide layout. This is 5-7 days of work that's identical in both paths.

**4. AI SDK v5 incompatibility.**
assistant-ui has dropped AI SDK v5 support. The AI SDK integration package (`@assistant-ui/react-ai-sdk`) requires v6, and there is no RN equivalent anyway. To use assistant-ui, we'd write a custom `ChatModelAdapter` that reimplements our SSE transport from scratch. This loses all 5 streaming invariants we spent cycles hardening.

**5. Our existing architecture maps cleanly to the onboarding use case.**
The extension path is straightforward:
- Add `tool-render_slide` as a new part type in `AIPartRenderer`
- Slides render as full-width items in the existing FlashList message list
- `addToolOutput()` from AI SDK v5 sends user responses back to the AI
- Our existing streaming, session management, error handling, scroll logic all carry forward unchanged
- New onboarding-specific state goes in a new Redux slice following our proven patterns

**6. assistant-ui's value proposition is for web.**
The web package (`@assistant-ui/react`) is mature at v0.12.x with excellent composable primitives. If/when we build the web version of AI onboarding, assistant-ui web is worth evaluating. But for React Native today, there's nothing to adopt — just risk.

### What We Should Take From assistant-ui

Even though we're not adopting the library, several patterns are worth stealing:

1. **Tool UI registration API** (`makeAssistantToolUI` pattern): We should build a similar registry where tools register renderers by name. Our current per-part switch is fine for 3 part types but won't scale to 12+ block types. A registry pattern is better.

2. **`addResult` / `resume` pattern for human-in-the-loop**: The callback pattern where tool UI sends user input back as the tool result is exactly right for our slide submissions. We implement this with AI SDK v5's `addToolResult`.

3. **Selector-based re-renders** (`useAuiState((s) => s.thread.isRunning)`): Their Zustand selector pattern is more granular than our Redux selectors. Consider this for performance-critical paths.

4. **Thread persistence adapter pattern**: Their `AsyncStorage` + `storagePrefix` pattern is clean. We can adopt this pattern in our Redux layer.

### When to Reassess

Revisit this decision if:
- We upgrade to Expo SDK 54+ and `@assistant-ui/react-native` reaches v1.0+
- We migrate to AI SDK v6+ and the RN AI SDK integration becomes available
- We start building the web onboarding UI (assistant-ui web is worth using there)
- The custom build proves harder than estimated (unlikely given our existing codebase)

### Next Step

Proceed to Phase 2 Architecture Design:
1. Define the slide/block Zod schemas
2. Design the tool-call → slide rendering pipeline using our existing `AIPartRenderer`
3. Build the block component registry (inspired by assistant-ui's `makeAssistantToolUI`)
4. Extend our Redux store with onboarding state
5. Prototype with one end-to-end flow: AI calls `render_slide` → client renders `single-choice` block → user selects → `addToolResult` sends response → AI processes and renders next slide
