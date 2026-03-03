# Research 2C: assistant-ui Greenfield Evaluation

> **Date**: 2026-02-28
> **Predecessor**: Research 2A (BUILD CUSTOM — in context of existing codebase migration)
> **Question**: If we were building a PORTABLE library from scratch, does assistant-ui change the equation?
> **Decision**: BUILD CUSTOM (narrowly)
> **Confidence**: Medium — the gap is much smaller than in Research 2A

---

## 1. Premise Change: Greenfield vs Migration

Research 2A concluded BUILD CUSTOM with high confidence. But its analysis was framed as a **migration** — discarding 80% of working code to adopt assistant-ui. The math was straightforward: why spend more time to rewrite what already works?

The user now asks a fundamentally different question:

> "What if we start from scratch? No existing code to preserve. The goal is a **portable library** — a standalone package that any React Native (or web) app can install to get AI-driven generative slide UIs."

This changes the evaluation along three axes:

| Factor | Research 2A (Migration) | This Evaluation (Greenfield) |
|--------|------------------------|------------------------------|
| **Migration cost** | 19-29 days to rewrite working code | Zero — no code to discard |
| **Code preservation** | 80% of existing code survives custom build | N/A — starting fresh |
| **Architecture freedom** | Constrained by existing patterns (Redux, FlashList, useChat) | Free to choose any architecture |
| **Portability goal** | Build inside Chatwoot mobile app | Build a standalone library usable by ANY app |
| **Web story** | Secondary concern | First-class: portable = web + RN |

The question becomes: does assistant-ui provide enough scaffolding to accelerate a greenfield portable library, or would we spend more time working around its constraints than building from scratch?

---

## 2. Documentation Findings

### 2.1 Sources Reviewed

| Source | URL | Status |
|--------|-----|--------|
| assistant-ui Overview | https://www.assistant-ui.com/docs | Fetched |
| React Native Getting Started | https://www.assistant-ui.com/docs/react-native | Fetched |
| Pick a Runtime Guide | https://www.assistant-ui.com/docs/runtimes/pick-a-runtime | Fetched |
| LocalRuntime Documentation | https://www.assistant-ui.com/docs/runtimes/custom/local | Fetched |
| ExternalStoreRuntime Documentation | https://www.assistant-ui.com/docs/runtimes/custom/external-store | Fetched |
| Tools Guide | https://www.assistant-ui.com/docs/guides/tools | Fetched |
| Generative UI / Tool UI Guide | https://www.assistant-ui.com/docs/guides/tool-ui | Fetched |
| npm: @assistant-ui/react-native | https://registry.npmjs.org/@assistant-ui/react-native | Fetched |
| npm: @assistant-ui/core | https://registry.npmjs.org/@assistant-ui/core | Fetched |
| npm: @assistant-ui/react | https://registry.npmjs.org/@assistant-ui/react | Fetched (truncated) |
| GitHub: assistant-ui/assistant-ui | https://github.com/assistant-ui/assistant-ui | Fetched |

### 2.2 Key Architectural Findings

**Package architecture has matured since Research 2A.** The project now has a clear three-package split:

```
@assistant-ui/core (v0.1.2)     — Framework-agnostic: runtime, types, state, tool registry
    ├── No React dependency (react is an optional peer dep)
    ├── No RN dependency
    ├── Pure TypeScript: ChatModelAdapter, ThreadMessage, Toolkit
    └── Depends only on: assistant-stream, nanoid

@assistant-ui/react (v0.12.x)   — Web UI primitives (DOM)
    └── Depends on: @assistant-ui/core

@assistant-ui/react-native (v0.1.1) — RN UI primitives (View, TextInput, FlatList)
    └── Depends on: @assistant-ui/core
```

**Critical insight**: `@assistant-ui/core` is framework-agnostic. It has no React dependency in production (React is optional peer dep). The runtime, type system, tool registry, and state management are all in core. This means we could theoretically depend on `@assistant-ui/core` alone and build our own UI layer.

**New RN documentation**: The React Native page now shows a clean getting-started path with `useLocalRuntime`, `AssistantProvider`, `useAuiState`, and custom components. The examples use raw RN components (View, TextInput, FlatList, Pressable) — no Expo SDK 54-specific APIs.

**Peer dependencies on react-native**:
- `@assistant-ui/react-native` v0.1.1 peer dep: `react-native: "*"` (wildcard — accepts any version)
- Dev dependency: `react-native: "^0.84.0"` (used for dev/testing only, not enforced at install time)
- This means it should install fine on RN 0.76 (Expo SDK 52). Whether it *runs* correctly is a different question.

**License**: MIT. Fork-friendly.

### 2.3 New API: Tools() and Toolkit

Since Research 2A, assistant-ui has introduced a new `Tools()` API (recommended over the legacy `makeAssistantToolUI`):

```tsx
const myToolkit: Toolkit = {
  render_slide: {
    description: "Render an onboarding slide",
    parameters: z.object({ /* slide schema */ }),
    execute: async (args) => { /* optional client-side execution */ },
    render: ({ args, result, addResult, status }) => {
      return <SlideRenderer schema={args} onSubmit={addResult} />;
    },
  },
};

const aui = useAui({ tools: Tools({ toolkit: myToolkit }) });
```

This is cleaner than the legacy pattern and maps well to our use case. The `render` function receives `addResult` for human-in-the-loop, which is exactly what we need for slide submissions.

### 2.4 React Native Runtime

The RN docs confirm that `@assistant-ui/react-native` shares its runtime core with `@assistant-ui/react` via `@assistant-ui/core`:

> "The type system, state management, and runtime logic are identical — only the UI layer differs."

The RN package provides:
- `useLocalRuntime(chatModel)` — creates runtime with ChatModelAdapter
- `AssistantProvider` — wraps the app with runtime context
- `useAuiState((s) => s.thread.messages)` — selector-based state access
- `useAui()` — imperative API (`aui.composer().send()`, `aui.composer().setText()`)
- Primitives: `ThreadRoot`, `ThreadMessages`, `ComposerRoot`, `ComposerInput`, `MessageContent`, etc.
- Tool system: `useAssistantTool`, `makeAssistantTool`

The RN getting-started example shows building a complete chat UI with raw RN components — no pre-built styled components. This is actually ideal for a portable library (we'd style it ourselves anyway).

---

## 3. Answers to the 8 Evaluation Questions

### Q1: Portability — Can it be used in ANY React Native app?

**Answer: Mostly yes, with caveats.**

**Evidence for**:
- Peer dependency on `react-native: "*"` — no version constraint
- Core logic is in `@assistant-ui/core` which has zero RN dependency
- The RN package uses standard RN APIs: `View`, `TextInput`, `FlatList`, `Pressable`, `Animated`
- React peer dep: `^18 || ^19` — covers all current Expo SDKs

**Evidence against**:
- Dev-tested only against RN 0.84 / Expo SDK 54
- The with-expo example uses Expo SDK 54 specific APIs (e.g., `fetch` from `expo/fetch`)
- Only 2 npm releases (v0.1.0 and v0.1.1). Zero production users outside the core team (that we know of)
- No compatibility matrix published

**Verdict**: The peer deps allow installation anywhere, but runtime compatibility with RN 0.76 (our SDK) is untested. For a **portable library**, this is a risk — we'd be shipping a dependency to our consumers that's untested on most RN versions.

**Mitigation**: Depend on `@assistant-ui/core` only (no RN dep at all), build our own UI layer. This eliminates the RN version risk entirely.

### Q2: Full-View Rendering — Can slides render full-screen (not in chat bubbles)?

**Answer: Not out of the box, but achievable.**

assistant-ui's architecture is fundamentally a **chat message list**. Tool UIs render inside message parts:

```
Thread → Messages → MessageContent → [text parts, tool-call parts] → tool UI renderer
```

To render a tool UI full-screen, you'd need to:
1. Read the current tool-call state from the runtime
2. Render it in a completely separate view hierarchy (outside the Thread)
3. Manage the transition between chat and full-view yourself

The `useAuiState` selector API makes this possible:
```tsx
const messages = useAuiState((s) => s.thread.messages);
// Find the last tool call, render it full-screen
```

But this is working **against the grain** of the library. assistant-ui's primitives (Thread, Messages, MessageContent) assume a vertical scrolling chat layout. The full-view mode would bypass all of them, using only the runtime/state layer.

**For a portable library**: This means we'd use ~30% of assistant-ui (core runtime, tool registry, state) and build 70% ourselves (full-view layout, slide transitions, presentation mode switching). The question is whether that 30% is worth the dependency.

### Q3: Dual Mode Support (Inline + Full-View)?

**Answer: Possible but requires significant custom work.**

The inline (chat-with-slides) mode maps naturally to assistant-ui's Thread + tool UI pattern. The full-view mode (slide-takes-over) does not.

To support both:
- **Inline mode**: Use `ThreadMessages` with custom `renderMessage` that renders slides as full-width items → this works well with assistant-ui
- **Full-view mode**: Subscribe to runtime state via `useAuiState`, extract the current slide tool call, render it in a completely custom view → this uses only the core layer

The **switching logic** between modes is entirely our responsibility. assistant-ui has no concept of "presentation modes."

**For a portable library**: We'd build a `PresentationModeProvider` that wraps either an assistant-ui `Thread` (inline) or our custom full-view renderer. The Thread component saves us work in inline mode. In full-view mode, assistant-ui is just a state container.

### Q4: AI SDK v5 Compatibility?

**Answer: Not directly, but the custom runtime bridge is straightforward.**

**The situation**:
- `@assistant-ui/react-ai-sdk` requires AI SDK v6 and is web-only. Not applicable.
- For RN, the documented path is `useLocalRuntime` with a `ChatModelAdapter`.
- The `ChatModelAdapter` is framework-agnostic — it's just an async generator that yields `{ content: [...] }`.

**What a custom adapter looks like for our backend**:
```tsx
const SlidesAdapter: ChatModelAdapter = {
  async *run({ messages, abortSignal, context }) {
    const response = await fetch('https://our-api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ messages: convertMessages(messages) }),
      signal: abortSignal,
    });
    
    // SSE parsing loop
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    const toolCalls = new Map();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      // ... parse SSE events, accumulate text + tool calls
      yield { content: [...textParts, ...toolCallParts] };
    }
  }
};
```

**Effort estimate**: 1-2 days. This is comparable to writing our own transport from scratch. The `ChatModelAdapter` pattern is clean and well-documented.

**For a greenfield library**: The adapter pattern actually **decouples** us from any specific AI SDK version. Our library would define its own adapter interface (or use assistant-ui's). Consumers pass their own adapter. This is better for portability than depending on AI SDK v5 directly.

### Q5: Standardization Value?

**Answer: Moderate, but conditional.**

**What we'd inherit**:
- `ThreadMessage` type system — well-designed, with text/tool-call/tool-result parts
- Tool registry (`Toolkit` + `Tools()`) — clean, type-safe, handles human-in-the-loop
- `ChatModelAdapter` pattern — clean abstraction for any LLM backend
- `useAuiState` selector model — efficient, prevents unnecessary re-renders
- State management (thread state, composer state, message status)

**What we'd NOT inherit** (must build regardless):
- Slide/block schema and Zod definitions
- Block component registry (SingleChoice, TextInput, BigText, etc.)
- Form state management per slide
- Presentation mode system (inline vs full-view)
- Transition animations
- Step progression logic / state machine
- Progress tracking
- Rollback capability

**The standardization question**: If other teams or products want to build "AI chat with custom tool UIs," using assistant-ui's `ThreadMessage` + `Toolkit` types makes our library instantly compatible with the broader ecosystem. Any assistant-ui user could plug in our slide renderers.

**Counter-argument**: Our library is specialized (generative slides for onboarding/surveys). The overlap with "general AI chat" is limited. Forcing our architecture into assistant-ui's message-list paradigm may add friction when what we really want is a slide-first, chat-optional system.

### Q6: Extension Points — What Can We Customize?

**Answer: The RN package is highly customizable; the constraints are conceptual, not technical.**

**Fully customizable**:
- All UI components (primitives are unstyled View/TextInput/Pressable)
- Message rendering (`useAuiState` gives raw access to all state)
- Tool UI rendering (full control via `render` in Toolkit)
- Transport layer (ChatModelAdapter)
- State persistence (bring your own via history adapter)
- Composer behavior (imperative API via `useAui()`)
- Styling (no CSS, no Tailwind — raw style props, compatible with twrnc)

**Partially customizable**:
- Message list layout (FlatList-based in their primitives, but you can build your own with `useAuiState`)
- Thread management (built-in patterns, but you can override with ExternalStoreRuntime)

**Locked in**:
- Message model: `ThreadMessage` with typed `content` parts (text, tool-call, tool-result, etc.)
- Runtime architecture: Zustand-based stores under the hood
- Thread paradigm: conversations as message arrays with branching support

**For a portable library**: The message model constraint is the most significant. If our slides are tool calls within messages, we're bound to the chat paradigm. This works for inline mode but is awkward for full-view mode where a "slide" shouldn't be "a tool call inside a message in a thread."

### Q7: Community Trajectory?

**Answer: Strong for web, nascent for RN.**

**Web package (@assistant-ui/react)**:
- 8.6k GitHub stars (up from ~7k a few months ago)
- 115 contributors
- 2,751 commits
- 1,132 releases
- 2.3k dependents on npm
- Y Combinator backed
- Used by LangChain, Browser Use, Helicone, Stack AI, and others
- Active Discord community

**RN package (@assistant-ui/react-native)**:
- v0.1.1 (2 releases total)
- First published: 2026-02-20 (8 days ago)
- Last published: 2026-02-25 (3 days ago)
- No known production users
- One example (`with-expo`) targeting SDK 54 / RN 0.84
- Core team clearly investing (documentation, example, primitives)

**Core package (@assistant-ui/core)**:
- v0.1.2 (3 releases in 8 days — active development)
- Framework-agnostic — this is the foundation for both web and RN
- The fact that they extracted core from react suggests a commitment to multi-platform

**Trajectory assessment**: The web package is mature and growing. The RN package is in its first week. The core extraction is a positive signal — it suggests they're building toward a multi-platform architecture. But for production use today, the RN story is a bet on the future.

### Q8: Build On, Fork, or Use Core Only?

**Answer: "Use core only" is the most compelling option for a greenfield library.**

**Option A: Depend on @assistant-ui/react-native**
- Pros: Get primitives (ThreadMessages, ComposerInput, etc.), tool registration
- Cons: v0.1.1, untested on our SDK, chat-paradigm UI we'd mostly bypass in full-view mode
- Verdict: Too risky for a library we ship to consumers

**Option B: Fork relevant parts**
- License: MIT (fork-friendly)
- What we'd fork: `@assistant-ui/core` (runtime, types, tool registry)
- Pros: Full control, no dependency risk, can trim to what we need
- Cons: Maintenance burden (must track upstream manually), lose npm semver updates
- Verdict: Viable but premature — the core package API is still at v0.1.x

**Option C: Depend on @assistant-ui/core only** ← Most interesting
- `@assistant-ui/core` has no React dependency (optional peer) and no RN dependency
- We'd get: `ChatModelAdapter`, `ThreadMessage` types, tool registry, runtime logic
- We'd build: All UI (both web and RN), presentation modes, slide renderer, block components
- Pros: Leverage battle-tested runtime logic without UI coupling; compatible with broader ecosystem
- Cons: Core is also v0.1.x; the API surface for direct core consumption (without react/react-native wrappers) is less documented

**Verdict**: Option C is architecturally clean but practically risky at v0.1.2. For a portable library, depending on a v0.1.x package that might change its API is a significant commitment.

---

## 4. Cost/Benefit Comparison Table

| Factor | Build Custom from Scratch | Build on assistant-ui (RN pkg) | Use @assistant-ui/core Only | Fork Core |
|--------|--------------------------|-------------------------------|---------------------------|-----------|
| **Initial effort** | 18-26 days | 14-20 days | 15-22 days | 16-23 days |
| **Slide/block renderer** | 5-7 days (same) | 5-7 days (same) | 5-7 days (same) | 5-7 days (same) |
| **Chat UI** | 4-6 days | 1-2 days (primitives) | 4-6 days (build own) | 4-6 days |
| **Runtime + state** | 3-4 days | 0 days (provided) | 0 days (provided) | 0 days (included) |
| **Transport/adapter** | 2-3 days | 1-2 days (ChatModelAdapter) | 1-2 days (ChatModelAdapter) | 1-2 days |
| **Tool registry** | 2-3 days | 0 days (provided) | 0 days (provided) | 0 days (included) |
| **Full-view mode** | 2-3 days | 3-4 days (against the grain) | 2-3 days | 2-3 days |
| **Maintenance burden** | Low (own everything) | High (track v0.1.x breaking changes) | Medium (core is smaller) | Medium-High (manual merges) |
| **Portability (RN)** | Guaranteed (our code) | Risky (untested on most RN versions) | Guaranteed (no RN dep) | Guaranteed (our fork) |
| **Portability (Web)** | Must build separately | Easy (use @assistant-ui/react) | Must build separately | Must build separately |
| **Standardization** | None (proprietary types) | Full ecosystem compat | Full ecosystem compat | Partial (diverges over time) |
| **Flexibility** | Total | Limited by chat paradigm | High (core is agnostic) | Total |
| **Dependency risk** | Zero | High (v0.1.1, 8 days old) | Medium (v0.1.2, API may change) | Zero (snapshot) |
| **Community leverage** | None | 8.6k stars, active Discord | Same community, less surface | None (forked) |
| **Future web support** | Build from scratch | Strong (share core) | Strong (share core) | Moderate |
| **Consumer trust** | Our reputation only | Backed by YC, established project | Same | Our reputation only |
| **Debug transparency** | Full | Medium (Zustand internals) | Medium | Full |

### Effort Breakdown Notes

**Why is "Build on assistant-ui (RN pkg)" faster?**
- We skip building: chat message list (~2 days), composer/input (~1 day), runtime/state management (~3 days), tool registry (~2 days)
- But we spend extra time: working around chat paradigm for full-view mode (+1-2 days), debugging RN compatibility (+1-2 days)
- Net savings: ~4-6 days

**Why is "Use core only" nearly as fast as custom?**
- We save: runtime logic (~2 days), tool types/registry (~2 days), ChatModelAdapter pattern (~1 day)
- We still build: all UI (both modes), transport parsing, state persistence
- Net savings: ~3-5 days

---

## 5. Recommendation

### Decision: BUILD CUSTOM — but steal aggressively from assistant-ui's patterns

**Confidence: Medium** (down from High in Research 2A, because the greenfield case genuinely narrows the gap)

### Rationale

**Why not adopt @assistant-ui/react-native?**

1. **It's 8 days old at v0.1.1.** For a portable library that we ship to consumers, depending on a v0.1.x package with 2 total releases is irresponsible. Our consumers inherit this dependency risk.

2. **The chat paradigm doesn't fit full-view mode.** Our "Generative Slides UI" framework is slide-first, chat-optional. assistant-ui is chat-first, tools-optional. In full-view mode (which the proposals identify as high priority), we'd bypass most of assistant-ui's UI primitives, using only the core layer. Paying the dependency cost for 30% utilization is poor ROI.

3. **Portability contradiction.** We want a library that works on any RN version. assistant-ui/react-native is tested on one RN version (0.84) that isn't even in stable Expo yet. We'd be telling consumers "install this library that depends on a package tested only on a future RN version."

**Why not depend on @assistant-ui/core?**

This was the closest call. `@assistant-ui/core` is genuinely well-designed:
- Framework-agnostic runtime
- Clean `ChatModelAdapter` pattern  
- Type-safe `Toolkit` with human-in-the-loop
- `ThreadMessage` types that are becoming a de facto standard

The arguments against:
1. **v0.1.2 with 3 releases in 8 days** — API is still solidifying
2. **Our library would inherit core's Zustand dependency** (peer dep `zustand: ^5.0.11`) — consumers must install Zustand even if they use Redux or MobX
3. **The core API surface for direct consumption (without the react/react-native wrappers) is underdocumented** — we'd be an unusual consumer
4. **Our tool UI model diverges significantly** — we want slides (full-screen structured forms), not tool UIs (inline widgets in chat messages). Forcing slides into the `ToolCallContentPart` model adds impedance mismatch.

**Why build custom?**

1. **The hard work is the same regardless.** Slide schema, block components, form state, validation, presentation modes, transitions, step state machine — we build all of this no matter what. This is ~60-70% of the total effort.

2. **The savings from assistant-ui are modest (~4-6 days).** And they come with dependency risk, API instability, and architectural compromises.

3. **A portable library should minimize dependencies.** Our consumers want to `npm install @eleva/generative-slides-ui` and get a focused package with few transitive deps. Adding `@assistant-ui/core` + `zustand` + `assistant-stream` + `nanoid` as transitive deps is unnecessary weight.

4. **We control our own destiny.** API changes in assistant-ui can't break our consumers. We can optimize for RN 0.76+ without worrying about upstream's focus on 0.84.

### What We Should Steal

Even building custom, assistant-ui's architecture provides excellent patterns to adopt:

| Pattern | From assistant-ui | Our Adaptation |
|---------|-------------------|----------------|
| **ChatModelAdapter** | `async *run({ messages, abortSignal, context })` | Define our own `SlideModelAdapter` with identical signature |
| **Toolkit pattern** | `Toolkit = { [name]: { parameters, execute, render } }` | Our `BlockRegistry = { [type]: { schema, render, validate } }` |
| **Selector-based state** | `useAuiState((s) => s.thread.messages)` | Our `useSlideState((s) => s.currentSlide)` with Zustand |
| **Tool status model** | `running | complete | incomplete | requires-action` | Our slide status: `streaming | ready | submitted | error` |
| **Human-in-the-loop** | `addResult()` callback in tool render | Our `onSubmit()` callback in slide render |
| **Message content parts** | `{ type: "text" | "tool-call" | "tool-result" }` | Our `{ type: "text" | "slide" | "slide-result" }` |
| **Thread persistence** | History adapter with `load()` / `append()` | Our onboarding persistence with same pattern |

### When to Reassess

Revisit this decision if:

1. **@assistant-ui/core reaches v1.0** with a stable API guarantee — then the dependency risk drops significantly
2. **@assistant-ui/react-native reaches v0.5+** with a compatibility matrix across RN versions
3. **We decide web is equally important to RN** — assistant-ui's web story is mature, and sharing core between web and RN becomes a real advantage
4. **The ecosystem converges on `ThreadMessage` as a standard** — if multiple tools (LangChain, Mastra, etc.) standardize on assistant-ui's types, compatibility becomes more valuable

---

## 6. Decision Matrix: Under What Conditions Does Each Option Win?

### Build Custom Wins When:

- **Portability is paramount**: You need the library to work on any RN version without qualification
- **Full-view mode is primary**: Your UX is slide-first, not chat-first
- **Minimal dependencies matter**: Your consumers want a focused package
- **You need production stability now**: You can't wait for v0.1.x to stabilize
- **Your team has the capacity** to build and maintain runtime + state management (~3-4 days extra)

**This is our current situation.** ← Recommending this.

### Build on assistant-ui (RN) Wins When:

- **Chat-first UX**: Your primary mode is inline chat with tool UIs embedded in messages
- **Web + RN from day one**: You're building both platforms simultaneously and want shared runtime
- **Expo SDK 54+**: Your app is on the latest Expo SDK, eliminating compatibility concerns
- **Speed over stability**: You need a working prototype in < 1 week and accept the v0.1.x risk
- **You're building a ChatGPT-like app**: Not a slide-based onboarding framework

### Use @assistant-ui/core Only Wins When:

- **Ecosystem compatibility matters most**: You want your tool UIs to work with any assistant-ui consumer
- **You have both web and RN** and want to share the runtime layer while building platform-specific UIs
- **Core reaches v1.0** with a stable API guarantee
- **Your UX fits the ThreadMessage model**: Your slides can be modeled as tool calls within a message thread
- **You're OK with the Zustand dependency**: Your consumers already use Zustand or don't mind it

### Fork Core Wins When:

- **You want core's code but not the dependency**: Snapshot the logic, own it forever
- **You're diverging significantly from assistant-ui's model**: You'll modify the runtime to fit your paradigm
- **Maintenance capacity is high**: You can track upstream changes manually when useful
- **Legal requires vendored dependencies**: Some enterprises prefer vendored code

---

## 7. Summary

| Question | Answer |
|----------|--------|
| Does greenfield change the equation? | **Partially.** The savings are real (~4-6 days) and the architectural fit is better than a migration. But the dependency risks and paradigm mismatch remain. |
| Is assistant-ui worth adopting for a portable library? | **Not yet.** The RN package is v0.1.1 (8 days old), the core is v0.1.2, and our slide-first architecture doesn't align with their chat-first paradigm. |
| Best path for greenfield? | **Build custom, steal patterns.** Use assistant-ui's architectural patterns (ChatModelAdapter, Toolkit, selector state) without the dependency. Revisit when core reaches v1.0. |
| Biggest risk of building custom? | **Web story.** When we build the web version, we'll wish we had assistant-ui's mature web primitives. Plan for this by keeping our runtime layer assistant-ui-compatible (same `ThreadMessage` shape, same adapter pattern) so migration is easy later. |
| Confidence level? | **Medium.** The gap between custom and assistant-ui is smaller in greenfield (~4-6 days, not 0-5 days net negative). If assistant-ui's core stabilizes quickly, this decision should be revisited. |

---

## Appendix: Package Version Timeline (as of 2026-02-28)

| Package | Version | First Published | Last Published | Releases |
|---------|---------|-----------------|----------------|----------|
| `@assistant-ui/core` | 0.1.2 | 2026-02-20 | 2026-02-26 | 3 |
| `@assistant-ui/react-native` | 0.1.1 | 2026-02-20 | 2026-02-25 | 2 |
| `@assistant-ui/react` | 0.12.x | Mature (1100+ releases) | Active | 1100+ |
| `@assistant-ui/store` | 0.2.1 | Recent | Recent | ~3 |
| `assistant-stream` | 0.3.x | Recent | Recent | ~4 |

The web package is production-ready. Everything else is <2 weeks old.
