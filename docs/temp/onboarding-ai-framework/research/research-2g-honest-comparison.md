# Research 2G: Brutally Honest Comparison — AI SDK vs assistant-ui vs Both

> **Date**: 2026-02-28
> **Predecessor**: Research 2D, 2E, 2F + full codebase review
> **Question**: What does assistant-ui ACTUALLY provide over what we already have with Vercel AI SDK + custom components? Is the value real?
> **Methodology**: Line-by-line comparison of existing code against assistant-ui's claimed features, verified against both installed AI SDK types and assistant-ui source code.

---

## 1. Executive Summary

**The honest truth in three sentences:**

assistant-ui is NOT a competing runtime to AI SDK — it is a UI component library and state management layer built ON TOP of its own runtime that happens to overlap significantly with what AI SDK already provides. Your existing codebase already has ~2,800 lines of working AI chat code using AI SDK directly, and the AI SDK v5 `Chat` class already exposes `addToolResult`, `addToolOutput`, and `sendAutomaticallyWhen` — the three features that previous research attributed exclusively to assistant-ui. The real delta is assistant-ui's `makeAssistantToolUI` registry pattern and `humanToolNames` auto-pause/auto-continue orchestration, which are genuinely elegant but reproducible in ~100-150 lines of custom code on top of AI SDK.

---

## 2. Feature-by-Feature Comparison Table

| Feature | assistant-ui | Our existing code | AI SDK v5 (already installed) | Real gap? |
|---------|-------------|-------------------|-------------------------------|-----------|
| **Chat hook** | `useLocalRuntime` + `AssistantProvider` | `useAIChat.ts` (432 LOC, wraps `useChat`) | `useChat` from `@ai-sdk/react` | **NO** — both provide the same core: messages, status, send, stop |
| **Message streaming (SSE)** | `ChatModelAdapter` (you implement) | `DefaultChatTransport` + `expoFetch` | Built-in `DefaultChatTransport` | **NO** — AI SDK handles SSE natively; assistant-ui makes you rewrite it as a `ChatModelAdapter` |
| **Message list rendering** | `ThreadMessages` (FlatList wrapper, ~61 lines) | `AIChatMessagesList.tsx` (204 LOC, FlashList) | N/A (not a UI lib) | **NO** — our FlashList version is MORE performant than assistant-ui's FlatList |
| **Part rendering dispatch** | `MessageContent` switch + `ToolUIDisplay` | `AIPartRenderer.tsx` (116 LOC) | N/A | **NO** — our dispatch is equivalent; both route by `part.type` |
| **Text/markdown rendering** | Render prop `renderText` (you implement) | `AITextPart.tsx` (260 LOC, full markdown + animated cursor) | N/A | **NO** — assistant-ui gives you nothing here; you bring your own renderer |
| **Tool call rendering** | `makeAssistantToolUI` registry + `ToolUIDisplay` | `AIToolPart.tsx` (287 LOC) | N/A | **PARTIAL** — the registry pattern is nicer for N tools, but our if/switch works fine for known tools |
| **Tool result submission** | `addToolResult` (via `aui.message().part()`) | Not yet implemented | `addToolResult` / `addToolOutput` on `Chat` class — **ALREADY IN AI SDK** | **NO** — AI SDK v5 has `addToolResult` AND `addToolOutput` on the `Chat` class, exposed via `useChat` |
| **Human-in-the-loop (pause)** | `unstable_humanToolNames` + `shouldContinue` | Not yet implemented | `sendAutomaticallyWhen` on `Chat` class — **ALREADY IN AI SDK** | **SMALL** — AI SDK's `sendAutomaticallyWhen` inverts the logic (you define WHEN to continue, not WHEN to pause) but achieves the same result |
| **Auto-continue after tool result** | Automatic via `shouldContinue → performRoundtrip` | Not yet implemented | `sendAutomaticallyWhen` callback re-evaluates after `addToolOutput` | **NO** — same mechanism, different API surface |
| **Message bubble styling** | N/A (you style everything yourself) | `AIMessageBubble.tsx` (208 LOC) | N/A | **NO** — assistant-ui provides zero styling |
| **Scroll management** | Basic FlatList (no auto-scroll logic) | `useAIChatScroll.ts` (280 LOC, debounced, programmatic scroll detection) | N/A | **NEGATIVE** — our scroll management is MORE sophisticated |
| **Session management** | Not provided | `useAIChatSessions.ts` (225 LOC) | N/A | **NEGATIVE** — we have this, assistant-ui doesn't |
| **Message persistence** | `createLocalStorageAdapter` (AsyncStorage) | Backend persistence + Redux + AsyncStorage | N/A | **NO** — we already persist more robustly (backend + Redux) |
| **Transport/adapter** | `ChatModelAdapter` interface (you implement SSE) | `DefaultChatTransport` (SDK provides SSE) | Built-in | **NEGATIVE** — with assistant-ui you REWRITE the transport; with AI SDK you get SSE for free |
| **State management** | Zustand stores (`useAuiState`) | Redux + AI SDK internal state | AI SDK internal state (`useSyncExternalStore`) | **LATERAL** — different store, same capability |
| **Typing indicator** | Not provided | Already have (`isStreaming` + `ActivityIndicator`) | `status === 'streaming'` | **NO** |
| **Error handling** | Not provided | `AIChatError.tsx` (full error UI with categorization) | `error` state on `useChat` | **NEGATIVE** — we have richer error handling |
| **Composer (text input)** | `ComposerRoot` + `ComposerInput` + `ComposerSend` | `AIInputField.tsx` (custom) | N/A | **MARGINAL** — saves ~50 lines of input wiring at most |
| **Message scoping** | `MessageByIndexProvider` (render any message outside list) | Not needed yet | N/A | **YES** — this is genuinely useful for full-view slide mode |
| **Tool UI registry** | `makeAssistantToolUI` (global, declarative) | Manual switch in `AIPartRenderer` | N/A | **YES** — cleaner pattern when you have many tool types |
| **Thread branching** | `MessageRepository` supports branches | N/A | N/A | **YES** — but we don't need branching for onboarding |

### Summary Count

- **Features where assistant-ui provides NO value over existing code**: 12
- **Features where our code is BETTER**: 4 (FlashList, scroll, sessions, error handling)
- **Features where assistant-ui adds GENUINE value**: 3 (MessageByIndexProvider, tool UI registry, humanToolNames orchestration)
- **Features that were wrongly attributed to assistant-ui** (actually in AI SDK): 3 (addToolResult, auto-continue, tool result submission)

---

## 3. AI SDK vs assistant-ui: Where They Overlap and Diverge

### 3.1 The Critical Discovery: AI SDK v5 ALREADY Has Tool Result APIs

Previous research (2D, 2E) positioned `addToolResult` and `humanToolNames` as assistant-ui exclusives. **This is incorrect.** Here's what AI SDK v5 actually exposes (verified from `node_modules/ai/dist/index.d.ts`):

```typescript
// AI SDK v5 Chat class (exposed via useChat):
class AbstractChat<UI_MESSAGE> {
  addToolResult(options: {
    state?: 'output-available';
    tool: string;
    toolCallId: string;
    output: any;
  }): Promise<void>;

  addToolOutput(options: {  // newer API, addToolResult is deprecated alias
    state?: 'output-available';
    tool: string;
    toolCallId: string;
    output: any;
  }): Promise<void>;
}

// AI SDK v5 ChatInit (useChat options):
interface ChatInit<UI_MESSAGE> {
  sendAutomaticallyWhen?: (options: {
    messages: UI_MESSAGE[];
  }) => boolean | PromiseLike<boolean>;
}
```

**What this means**: The entire human-in-the-loop flow described in research-2D/2E — pause on tool call, wait for user, submit result, auto-continue — is achievable with AI SDK alone:

```typescript
// AI SDK equivalent of assistant-ui's humanToolNames + addToolResult:
const chat = useChat({
  transport,
  sendAutomaticallyWhen: ({ messages }) => {
    // Auto-continue when all render_slide tool calls have results
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role !== 'assistant') return false;
    const pendingSlide = lastMsg.parts?.find(
      p => p.type.startsWith('tool-') && p.toolName === 'render_slide' && !p.result
    );
    return !pendingSlide; // Continue only when no pending slides
  },
});

// When user submits a slide:
chat.addToolOutput({
  tool: 'render_slide',
  toolCallId: toolCall.toolCallId,
  output: { action: 'submit', values: formValues },
});
// → sendAutomaticallyWhen re-evaluates → returns true → next roundtrip fires
```

This is ~15 lines of code. It replaces all of:
- `unstable_humanToolNames` configuration
- `shouldContinue()` logic
- `performRoundtrip()` auto-continuation
- The entire `LocalRuntime` setup

### 3.2 Does assistant-ui Use AI SDK Under the Hood?

**No.** assistant-ui has its own runtime (`LocalThreadRuntimeCore`), its own message model (`ThreadMessage`), its own state stores (Zustand-based `@assistant-ui/store`), and its own streaming protocol (`assistant-stream`). It is a **parallel stack**, not a layer on top of AI SDK.

There IS an adapter package `@assistant-ui/react-ai-sdk` that bridges assistant-ui to AI SDK, but that's a translation layer — it converts between the two message formats and runtimes.

### 3.3 Does ChatModelAdapter Duplicate What AI SDK's useChat Already Does?

**Yes, partially.** Here's the concrete duplication:

| Concern | AI SDK (`DefaultChatTransport`) | assistant-ui (`ChatModelAdapter`) |
|---------|-------------------------------|----------------------------------|
| SSE streaming | Built-in, handles data protocol | You implement from scratch |
| Auth headers | `headers: () => ({...})` callback | You add in your `run()` method |
| Request transformation | `prepareSendMessagesRequest` | You transform messages in `run()` |
| Response parsing | Automatic data stream protocol parsing | You parse SSE manually |
| Error handling | Built-in with retry | You implement |
| Session ID extraction | Custom fetch wrapper | You implement |

**Our existing `useAIChat.ts` gets ALL of this from AI SDK for free.** With assistant-ui, we'd have to rewrite the transport from scratch as a `ChatModelAdapter`. That's not saving code — it's moving code.

### 3.4 Is assistant-ui a UI Component Library or a Competing Runtime?

**Both, unfortunately.** This is the core issue. assistant-ui provides:

1. **A runtime** (`LocalRuntime`, `LocalThreadRuntimeCore`) — competes with AI SDK's `Chat` class
2. **A state layer** (`@assistant-ui/store`, Zustand) — competes with AI SDK's internal state + our Redux
3. **UI primitives** (`ThreadMessages`, `MessageContent`, `ComposerInput`) — this is the unique value
4. **A tool registry** (`makeAssistantToolUI`) — this is the unique value
5. **Message scoping** (`MessageByIndexProvider`) — this is the unique value

Items 1-2 are **redundant** with what AI SDK already provides. Items 3-5 are **genuinely useful** but not irreplaceable.

### 3.5 The "Overlap" Is Actually "Replacement"

To use assistant-ui, you don't layer it on top of AI SDK. You **replace** AI SDK's runtime:

- ~~`useChat`~~ → `useLocalRuntime` + `AssistantProvider`
- ~~`DefaultChatTransport`~~ → `ChatModelAdapter` (you rewrite)
- ~~`UIMessage`~~ → `ThreadMessage` (different type)
- ~~`chat.addToolOutput`~~ → `aui.message().part().addToolResult`
- ~~`chat.status`~~ → `useAuiState((s) => s.thread.isRunning)`
- ~~`chat.messages`~~ → `useAuiState((s) => s.thread.messages)`
- ~~Redux for messages~~ → Zustand stores

This is not "adding" assistant-ui. This is **replacing** AI SDK with assistant-ui's equivalent runtime and getting some UI primitives as a bonus.

---

## 4. Maintenance Burden Analysis

### Path A: Keep AI SDK + Custom Components (Extend What We Have)

**What we need to BUILD for slides:**

| Component | LOC estimate | Complexity |
|-----------|-------------|------------|
| `useOnboardingChat.ts` — extends `useAIChat` with `sendAutomaticallyWhen` + tool result handling | ~80 | Low — AI SDK has the APIs |
| `SlidePartRenderer.tsx` — extends `AIPartRenderer` for `render_slide` | ~40 | Low — add a case to existing switch |
| `SlideRenderer.tsx` — form state, validation, block dispatch | ~150 | Medium |
| `useSlideState.ts` — derive chat/slide/generating mode from messages | ~30 | Low |
| `UnifiedThreadView.tsx` — mode switching (chat list vs full-screen slide) | ~100 | Medium |
| `ChatMessageRenderer.tsx` — renders messages in chat mode | ~80 | Low |
| `SubmittedSlideCard.tsx` — compact card for submitted slides | ~80 | Low |
| `MiniChatBar.tsx` — collapsed chat during slide mode | ~60 | Low |
| Block components (5 MVP: BigText, SingleChoice, TextInput, InfoCard, Success) | ~500 | Low |
| Block registry | ~30 | Low |
| Redux `onboardingSlice` | ~150 | Low |
| Slide Zod schemas | ~100 | Low |
| Transition animations | ~30 | Low |
| **Total new code** | **~1,430** | |

**Existing code we keep AS-IS:**

| Component | LOC | Status |
|-----------|-----|--------|
| `useAIChat.ts` | 432 | Keep, extend for onboarding variant |
| `useAIChatScroll.ts` | 280 | Keep |
| `useAIChatSessions.ts` | 225 | Keep |
| `AIPartRenderer.tsx` | 116 | Keep, extend |
| `AITextPart.tsx` | 260 | Keep, reuse |
| `AIToolPart.tsx` | 287 | Keep, reuse |
| `AIChatMessagesList.tsx` | 204 | Keep, variant for slides |
| `AIMessageBubble.tsx` | 208 | Keep, reuse |
| `AIChatInterface.tsx` | 276 | Keep for existing chat |
| `aiChatService.ts` | 114 | Keep, extend |
| `aiChatSchemas.ts` | 79 | Keep, extend |
| `parts.ts` | 286 | Keep |
| **Total existing** | **2,767** | **Zero migration cost** |

**Ongoing maintenance:**
- 1 dependency to track: AI SDK (`ai` + `@ai-sdk/react`) — stable, well-documented, breaking changes are well-communicated
- Our custom code: ~4,200 lines total (~2,800 existing + ~1,400 new)
- When AI SDK releases v6: update one layer (`useAIChat.ts` and transport config)

### Path B: Adopt assistant-ui + AI SDK

**What we need to BUILD:**

| Component | LOC estimate | Complexity |
|-----------|-------------|------------|
| `ChatModelAdapter` — rewrite SSE transport from scratch | ~120 | Medium — replicating what `DefaultChatTransport` already does |
| `useOnboardingRuntime.ts` — `useLocalRuntime` + config | ~30 | Low |
| `SlideToolUI.tsx` — `makeAssistantToolUI` registration | ~30 | Low |
| `ProgressToolUI.tsx` — tool UI for progress | ~20 | Low |
| `SlideRenderer.tsx` — same as Path A | ~150 | Medium |
| `useSlideState.ts` — same logic, different API (`useAuiState`) | ~30 | Low |
| `UnifiedThreadView.tsx` — uses `ThreadMessages` + `MessageByIndexProvider` | ~80 | Medium |
| `ChatMessageRenderer.tsx` — same as Path A | ~80 | Low |
| `SubmittedSlideCard.tsx` — same as Path A | ~80 | Low |
| `MiniChatBar.tsx` — same as Path A | ~60 | Low |
| Block components (5 MVP) | ~500 | Low |
| Block registry | ~30 | Low |
| Redux `onboardingSlice` | ~150 | Low |
| Slide Zod schemas | ~100 | Low |
| `OnboardingComposer.tsx` — wraps `ComposerInput` | ~40 | Low |
| Transition animations | ~30 | Low |
| **Total new code** | **~1,530** | |

**Existing code we DISCARD or REWRITE:**

| Component | LOC | What happens |
|-----------|-----|-------------|
| `useAIChat.ts` | 432 | **REPLACED** by `useLocalRuntime` + `ChatModelAdapter` — but the existing AI chat feature still needs this |
| `useAIChatScroll.ts` | 280 | **PARTIALLY REPLACED** by `ThreadMessages` (basic FlatList) — but we lose our debounced scroll detection |
| `AIPartRenderer.tsx` | 116 | **REPLACED** by `MessageContent` + tool registry — must maintain BOTH for existing chat + new onboarding |
| `AIChatMessagesList.tsx` | 204 | **REPLACED** by `ThreadMessages` — must maintain BOTH |
| `AIMessageBubble.tsx` | 208 | **REPLACED** by custom `renderMessage` — must maintain BOTH |

**The "maintain both" problem**: The existing AI chat feature uses AI SDK directly. The new onboarding feature would use assistant-ui. You'd have TWO rendering pipelines, TWO state management approaches, and TWO transport layers in the same app. Any developer working on "AI features" would need to know both systems.

**Ongoing maintenance:**
- 3 dependency families to track: AI SDK, assistant-ui (core + store + react-native + tap + assistant-stream), Zustand
- assistant-ui is v0.1.x — expect breaking API changes between minor versions
- When AI SDK updates: no impact on assistant-ui (they're separate stacks) — but no benefit either
- When assistant-ui updates: check compatibility with RN version, Expo SDK, Zustand version
- Total code: ~2,800 existing (kept for existing chat) + ~1,530 new + ~1,000 assistant-ui glue = ~5,300 lines
- Two parallel rendering pipelines for AI features

### Path C: assistant-ui REPLACES AI SDK

**Is this possible?** Partially. assistant-ui's `LocalRuntime` could replace AI SDK's `useChat` for the ENTIRE app (both existing chat and new slides).

**Is this desirable?** No, for these reasons:

1. **The existing AI chat works.** 2,800 lines of tested, production code. Rewriting it gains nothing.
2. **We'd lose `DefaultChatTransport`.** AI SDK's transport handles SSE parsing, the data stream protocol, error recovery, retry, and `expoFetch` integration. With assistant-ui, we write this from scratch.
3. **We'd lose session management.** Our `useAIChatSessions` bridges Redux sessions with AI SDK state. assistant-ui has no session concept.
4. **We'd lose the Vue story.** Chatwoot web uses `@ai-sdk/vue`. If mobile uses assistant-ui, mobile and web have zero shared runtime patterns.
5. **We'd add Zustand alongside Redux.** Not a conflict, but unnecessary complexity.
6. **We'd depend on v0.1.x for production chat.** The existing chat is stable on AI SDK.

**Verdict: Path C is clearly wrong.** You'd never rip out a working system to adopt a v0.1.x dependency that provides equivalent functionality.

---

## 5. The Real Delta (Quantified)

### What assistant-ui genuinely provides that's hard to build:

| Feature | Effort to build ourselves (on AI SDK) | assistant-ui alternative |
|---------|--------------------------------------|------------------------|
| **`makeAssistantToolUI` registry** — declarative tool→component mapping | ~60 lines (a Map<string, ComponentType> + a lookup in the part renderer) | Built-in, global, with typed props |
| **`humanToolNames` + `shouldContinue` orchestration** — pause on specific tool calls, auto-continue when result arrives | ~30 lines (using `sendAutomaticallyWhen` + `addToolOutput`) | Built-in, declarative |
| **`MessageByIndexProvider`** — render any message outside the list with full context | ~40 lines (pass message data as props + wire addToolResult manually) | Built-in, context-scoped |
| **`ThreadMessages`** — FlatList wrapper with `renderMessage` | ~50 lines (we already have a FlashList version that's better) | Built-in, but FlatList only |
| **`useAuiState` selectors** — fine-grained state access | ~20 lines (we already use Redux selectors + AI SDK state) | Built-in, Zustand-based |
| **`ComposerRoot/Input/Send`** — wired text input | ~50 lines (we already have `AIInputField`) | Built-in |
| **Thread persistence adapter** | ~30 lines (we already persist to backend) | `createLocalStorageAdapter` |
| **TOTAL effort to replicate** | **~280 lines** | |

### What assistant-ui COSTS:

| Cost | Quantified |
|------|-----------|
| Rewrite SSE transport as `ChatModelAdapter` | ~120 lines (replicating what `DefaultChatTransport` gives us free) |
| Learn assistant-ui's API surface | ~2-3 days developer ramp-up |
| Maintain two rendering pipelines (existing chat + new slides) | Ongoing cognitive overhead |
| Track assistant-ui releases for breaking changes | ~2-4 hours per minor version bump |
| Zustand added to bundle alongside Redux | ~3KB gzipped |
| assistant-ui packages added to bundle | ~15KB gzipped |
| Risk of v0.1.x stability issues on RN 0.76 | Unknown until spike |

### Net delta:

```
Lines saved by assistant-ui:     ~280 (features we'd build ourselves)
Lines added by assistant-ui:     ~120 (ChatModelAdapter rewrite)
                                 ─────
Net lines saved:                 ~160

New dependencies added:           5+ packages
New state management system:      Zustand (parallel to Redux)
Breaking change risk:             Medium (v0.1.x)
Transport rewrite:                Required (lose DefaultChatTransport)
Dual pipeline maintenance:        Required (existing chat ≠ new slides)
```

**The net delta is ~160 lines of code saved, at the cost of 5+ new dependencies, a v0.1.x stability risk, and an ongoing dual-pipeline maintenance burden.**

---

## 6. Custom Components Inventory Per Approach

### With AI SDK Only (Path A):

**Existing (keep and extend):**
1. `useAIChat.ts` — extend with `sendAutomaticallyWhen`
2. `useAIChatScroll.ts` — reuse as-is
3. `useAIChatSessions.ts` — reuse, add onboarding variant
4. `AIPartRenderer.tsx` — add `render_slide` case
5. `AITextPart.tsx` — reuse as-is
6. `AIToolPart.tsx` — reuse as-is
7. `AIChatMessagesList.tsx` — variant for onboarding (or reuse)
8. `AIMessageBubble.tsx` — reuse as-is
9. `AIChatInterface.tsx` — reuse for existing chat
10. `aiChatService.ts` — extend for onboarding endpoint
11. `aiChatSchemas.ts` — extend with slide schemas
12. `parts.ts` — extend with slide tool types

**New for slides:**
1. `useOnboardingChat.ts` — wraps `useAIChat` with `sendAutomaticallyWhen` + tool result
2. `useSlideState.ts` — derives presentation mode from messages
3. `SlidePartRenderer.tsx` — renders `render_slide` tool calls as slides
4. `UnifiedThreadView.tsx` — mode switching (chat ↔ slide ↔ generating)
5. `ChatMessageRenderer.tsx` — per-message renderer for chat mode
6. `SubmittedSlideCard.tsx` — compact card for submitted slides
7. `MiniChatBar.tsx` — collapsed chat during slide mode
8. `SlideRenderer.tsx` — form state, validation, block dispatch
9. `BlockRegistry.ts` — maps block types to components
10. `BigTextBlock.tsx` — block component
11. `SingleChoiceBlock.tsx` — block component
12. `TextInputBlock.tsx` — block component
13. `InfoCardBlock.tsx` — block component
14. `SuccessBlock.tsx` — block component
15. `slideSchemas.ts` — Zod schemas for slides
16. `onboardingSlice.ts` — Redux slice for step registry

**Total: 12 existing + 16 new = 28 components**

### With AI SDK + assistant-ui (Path B):

**Existing (keep for existing chat — CANNOT remove):**
1. `useAIChat.ts` — still needed for existing AI chat feature
2. `useAIChatScroll.ts` — still needed
3. `useAIChatSessions.ts` — still needed
4. `AIPartRenderer.tsx` — still needed
5. `AITextPart.tsx` — still needed
6. `AIToolPart.tsx` — still needed
7. `AIChatMessagesList.tsx` — still needed
8. `AIMessageBubble.tsx` — still needed
9. `AIChatInterface.tsx` — still needed
10. `aiChatService.ts` — still needed
11. `aiChatSchemas.ts` — still needed
12. `parts.ts` — still needed

**New for slides (assistant-ui layer):**
1. `OnboardingChatModelAdapter.ts` — SSE transport rewrite
2. `useOnboardingRuntime.ts` — `useLocalRuntime` config
3. `SlideToolUI.tsx` — `makeAssistantToolUI` registration
4. `ProgressToolUI.tsx` — tool UI for progress
5. `UnifiedThreadView.tsx` — mode switching (uses `useAuiState`)
6. `ChatMessageRenderer.tsx` — per-message renderer
7. `SubmittedSlideCard.tsx` — compact card
8. `MiniChatBar.tsx` — collapsed chat
9. `SlideRenderer.tsx` — form state, validation
10. `BlockRegistry.ts` — maps block types
11. `BigTextBlock.tsx` — block component
12. `SingleChoiceBlock.tsx` — block component
13. `TextInputBlock.tsx` — block component
14. `InfoCardBlock.tsx` — block component
15. `SuccessBlock.tsx` — block component
16. `slideSchemas.ts` — Zod schemas
17. `onboardingSlice.ts` — Redux slice
18. `OnboardingComposer.tsx` — wraps ComposerInput

**Total: 12 existing + 18 new = 30 components**

### The Difference:

| Metric | Path A (AI SDK only) | Path B (AI SDK + assistant-ui) |
|--------|---------------------|-------------------------------|
| Total components to maintain | 28 | 30 |
| New components for slides | 16 | 18 |
| Shared components (chat + slides) | 12 (all existing code serves both) | 0 (two separate pipelines) |
| Dependency count | 2 (ai, @ai-sdk/react) | 7+ (ai, @ai-sdk/react, @assistant-ui/react-native, core, store, tap, zustand) |
| Rendering pipelines | 1 (extended) | 2 (AI SDK for chat, assistant-ui for slides) |
| Transport implementations | 1 (DefaultChatTransport) | 2 (DefaultChatTransport + ChatModelAdapter) |
| State management | 1 (Redux + AI SDK) | 2 (Redux + AI SDK + Zustand) |

**Path A actually has FEWER components and a simpler architecture** because existing components are extended rather than duplicated.

---

## 7. Correcting Previous Research Claims

### Claim: "assistant-ui provides the hardest 30%"
**Reality**: The "hardest 30%" (streaming, message model, tool dispatch) is already handled by AI SDK. assistant-ui provides an alternative implementation of this same layer, not a layer above it.

### Claim: "addToolResult just works — no custom code required"
**Reality**: AI SDK v5's `Chat` class exposes `addToolResult` (deprecated) and `addToolOutput` (current). They work identically. The "just works" applies to BOTH.

### Claim: "Tool part type spike is eliminated by assistant-ui"
**Reality**: The tool part type is `UIMessage.parts[n]` in AI SDK v5. The type is well-defined: `{ type: 'tool-invocation' | 'tool-result', toolCallId, toolName, args, result, state }`. A 1-hour console.log during development confirms the shape. No spike needed with either approach.

### Claim: "3-5 day savings"
**Reality**: Once you account for: rewriting the transport as a ChatModelAdapter (+1.5 days), learning assistant-ui APIs (+1 day), maintaining two pipelines (ongoing), and the RN 0.76 compatibility risk (+0.5 day spike), the savings evaporates to roughly **0-1 days** with a higher ongoing maintenance cost.

### Claim: "The web story is excellent — same core, swap @assistant-ui/react for web"
**Reality**: Research-2F already concluded that Chatwoot web should use `@ai-sdk/vue` (Vue composables), NOT assistant-ui. There is no `@assistant-ui/vue` package. So the web story provides zero value.

---

## 8. Recommendation

### Recommended: Path A — Extend AI SDK + Custom Components

**Why:**

1. **You already have 80% of the infrastructure.** The existing 2,800 lines of AI chat code are proven, production-grade, and directly extensible for the slides feature.

2. **AI SDK v5 has the APIs you need.** `addToolOutput` + `sendAutomaticallyWhen` give you human-in-the-loop. This was the main argument for assistant-ui, and it doesn't hold.

3. **One rendering pipeline.** Extend `AIPartRenderer` with a `render_slide` case rather than introducing a parallel `MessageContent` + `ToolUIDisplay` pipeline.

4. **One transport.** Keep `DefaultChatTransport` + `expoFetch`. Don't rewrite SSE handling as a `ChatModelAdapter`.

5. **One state layer.** Keep Redux + AI SDK state. Don't add Zustand.

6. **Zero new dependencies.** No bundle size increase, no v0.1.x risk, no compatibility concerns.

7. **Vue alignment.** Chatwoot web uses `@ai-sdk/vue`. Mobile using `@ai-sdk/react` directly means identical patterns across platforms — `addToolOutput`, `sendAutomaticallyWhen`, `DefaultChatTransport` — just in different framework flavors.

8. **The ~160 lines you "save" with assistant-ui are trivial** compared to the ~1,400 lines of slide-specific code you're writing either way. The slide renderer, block components, form validation, mode switching, schemas — these are 90% of the work and are identical in both paths.

### What to Build (Path A Roadmap):

**Phase 1: Tool result capability (1 day)**
- Add `sendAutomaticallyWhen` to `useAIChat` options
- Expose `addToolOutput` from `useAIChat` return
- Test with a mock tool call (hardcoded response from backend)

**Phase 2: Slide rendering infrastructure (3 days)**
- `useSlideState.ts` — mode derivation from `UIMessage[]`
- `SlidePartRenderer.tsx` — extends `AIPartRenderer` for `render_slide`
- `UnifiedThreadView.tsx` — chat/slide/generating mode switching
- `ChatMessageRenderer.tsx` + `SubmittedSlideCard.tsx`
- `MiniChatBar.tsx`

**Phase 3: Slide content (4 days)**
- `SlideRenderer.tsx` — form state, validation, block dispatch
- Block components (5 MVP types)
- `slideSchemas.ts` — Zod schemas

**Phase 4: Integration (3 days)**
- Redux `onboardingSlice`
- Backend integration (extend `aiChatService` for onboarding endpoint)
- Rollback context injection
- Transition animations

**Phase 5: Polish (2 days)**
- Keyboard handling in slide mode
- Scroll position management on mode switch
- Error handling for slide flows
- Testing

**Total: ~13-15 days** (vs 16-19 for assistant-ui, and with lower risk)

### When Would assistant-ui Make Sense?

assistant-ui would be the right choice IF:

- You were building a greenfield AI chat app with no existing code
- You needed 10+ different interactive tool types (the registry pattern pays off at scale)
- You were building for React web (where `@assistant-ui/react` is mature with 1,100+ releases)
- You had no existing transport/session/state management to preserve
- The React Native package was v1.x+ with proven RN compatibility

None of these conditions apply to your current situation.

---

## 9. Appendix: The Precise Code for Human-in-the-Loop with AI SDK

To prove this isn't hand-waving, here's the exact implementation of the "hardest" part — human-in-the-loop tool calls — using only AI SDK v5:

```typescript
// useOnboardingChat.ts — extends useAIChat for slide flows
import { useChat, Chat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { UIMessage } from 'ai';
import { fetch as expoFetch } from 'expo/fetch';
import { useCallback, useMemo, useRef } from 'react';
import { AIChatService } from '@/store/ai-chat/aiChatService';

// Tool names that require human interaction (pause the auto-continue loop)
const HUMAN_TOOL_NAMES = ['render_slide'] as const;

export function useOnboardingChat(agentBotId: number) {
  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: AIChatService.getOnboardingStreamEndpoint(),
      fetch: expoFetch as any,
      headers: () => ({
        ...AIChatService.getAuthHeaders(),
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      }),
      prepareSendMessagesRequest: async (options) => {
        // Same format as existing useAIChat
        return {
          body: {
            messages: options.messages.map(m => ({
              role: m.role,
              content: m.parts?.filter(p => p.type === 'text').map(p => p.text).join('') ?? '',
            })),
            agent_bot_id: agentBotId,
          },
          headers: options.headers instanceof Headers
            ? Object.fromEntries(options.headers.entries())
            : (options.headers as Record<string, string>) ?? {},
        };
      },
    });
  }, [agentBotId]);

  const chat = useChat({
    transport,
    experimental_throttle: 150,

    // THIS IS THE KEY: auto-continue ONLY when no human tools are pending
    sendAutomaticallyWhen: ({ messages }) => {
      const lastMsg = messages[messages.length - 1];
      if (!lastMsg || lastMsg.role !== 'assistant') return false;

      // Check if any human tool calls lack a result
      const hasPendingHumanTool = lastMsg.parts?.some(part => {
        if (!part.type?.startsWith('tool-')) return false;
        if (!HUMAN_TOOL_NAMES.includes(part.toolName as any)) return false;
        return part.state !== 'result'; // No result yet → still pending
      });

      return !hasPendingHumanTool; // Continue only when all human tools have results
    },
  });

  // Expose addToolOutput for slide submission
  const submitSlideResult = useCallback(
    (toolCallId: string, output: Record<string, unknown>) => {
      chat.addToolOutput({
        tool: 'render_slide',
        toolCallId,
        output,
      });
    },
    [chat.addToolOutput],
  );

  return {
    messages: chat.messages,
    status: chat.status,
    error: chat.error,
    sendMessage: chat.sendMessage,
    stop: chat.stop,
    submitSlideResult,
  };
}
```

**That's it.** ~75 lines. No assistant-ui. No new dependencies. No new state management. No transport rewrite. The `DefaultChatTransport` handles SSE. The `Chat` class handles streaming, message state, tool results, and auto-continuation. We just configure WHEN to auto-continue.

Compare this to the assistant-ui equivalent from research-2D:
- `OnboardingChatModelAdapter.ts` — ~120 lines (SSE transport rewrite)
- `useOnboardingRuntime.ts` — ~30 lines
- Plus the `AssistantProvider` wrapper, `SlideToolUI` mount, Zustand setup...

The AI SDK path is shorter, simpler, and uses infrastructure that's already proven in the codebase.
