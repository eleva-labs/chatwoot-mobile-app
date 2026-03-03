# Gap Analysis: AI Generative UI Framework vs. Current Implementation

> **Date**: 2026-03-01
> **Scope**: Cross-platform analysis (React Native mobile + Vue web) comparing framework proposals against current `feature/vercel-sdk-streaming-standardization` (mobile) and `feature/vercel-ai-sdk-streaming` (web) branches
> **Framework documents reviewed**: 6 (mobile + web implementation plans, cycle plans, branch review reports)
> **Code files audited**: 12 key files across both platforms

---

## Table of Contents

1. [What Already Exists That Aligns With the Framework](#1-what-already-exists-that-aligns-with-the-framework)
2. [Gaps — What's Missing](#2-gaps--whats-missing)
3. [Generalization Opportunities](#3-generalization-opportunities)
4. [Contradictions & Risks](#4-contradictions--risks)
5. [Recommended Implementation Order](#5-recommended-implementation-order)

---

## 1. What Already Exists That Aligns With the Framework

The framework vision is: **an entire application modeled as a chat thread where the AI generates views as needed** — some predefined (static), some templated (semi-static), some fully AI-composed (dynamic). The current codebase has significant infrastructure that directly supports this vision, even though nothing was built with "views" in mind.

### 1.1 Part Registry System (DONE on both platforms)

The single most important framework prerequisite — a registry-based dispatch system for rendering arbitrary part types — is fully implemented.

| Aspect | Mobile (React Native) | Web (Vue) |
|--------|----------------------|-----------|
| **Registry class** | `ComponentRegistry<TComponent>` in `registry.ts` — generic, framework-agnostic class | `partRegistry.ts` — Vue `provide/inject` with `InjectionKey<PartRegistryConfig>` |
| **Dispatch component** | `AIPartRenderer.tsx` — checks (1) parts registry by `part.type`, (2) tools registry by `toolName`, (3) built-in fallbacks | `AiPartRenderer.vue` — registry-first lookup, then built-in fallbacks |
| **Error boundaries** | `PartErrorBoundary` wraps custom registry components | Not yet — listed as extraction review G10 |
| **Registration API** | `useAIChatRegistries()` from context | `usePartRegistry()` from `provide/inject` |

**Framework alignment**: This is the exact mechanism needed to register a `render_view` tool renderer. When the AI returns a tool call with `toolName: 'render_view'`, the registry can dispatch it to a custom `AIViewPart` component. **No changes to the dispatch system are needed** — only a new registered renderer.

**File references**:
- Mobile: `chatwoot-mobile-app/src/presentation/parts/ai-assistant/AIPartRenderer.tsx:104-142`
- Web: `chatwoot/app/javascript/dashboard/components-next/ai-assistant/parts/AiPartRenderer.vue:26-42`

### 1.2 ChatConfig + Adapter Pattern (DONE on both platforms)

The configuration system cleanly separates framework concerns from business logic, which is essential for the generalized view framework.

| Interface | Mobile | Web | Core-extractable? |
|-----------|--------|-----|-------------------|
| `TransportConfig` | `chatConfig.ts` | `types/chatConfig.ts` | YES — identical |
| `ChatBehaviorConfig` | Same | Same | YES — identical |
| `ChatUIConfig` | Same | Same | YES — identical |
| `PersistenceAdapter` | Same | Same | YES — identical |
| `SessionsAdapter` | `sessionsAdapter.ts` (data-returning) + `SessionsStateAdapter` (RN-specific reactive extension) | `types/chatConfig.ts` (optional, graceful degradation) | YES — core interface aligned |
| `I18nProvider` | `useAIi18n.ts` | `aiChatI18n.ts` | YES — identical |
| `ChatConfig` (unified) | Composes all sub-configs | Same | YES — identical |

**Framework alignment**: The `ChatBehaviorConfig` already has `sendAutomaticallyWhen` — the hook that enables automatic tool output submission. This is the mechanism the framework needs for tool call → `render_view` → user interaction → tool result → automatic re-send cycles.

**File references**:
- Mobile: `chatwoot-mobile-app/src/types/ai-chat/chatConfig.ts` (85 lines)
- Web: `chatwoot/app/javascript/dashboard/components-next/ai-assistant/types/chatConfig.ts` (137 lines)

### 1.3 Constants + Types + Zod Schemas (ALIGNED across platforms)

The type system is identical on both platforms, forming the foundation for `@eleva/ai-chat-core`.

| Asset | Mobile | Web | Status |
|-------|--------|-----|--------|
| `PART_TYPES` (14 keys) | `constants.ts` | `constants.ts` | UNION of both platforms |
| `TOOL_STATES` (10 keys) | Same | Same | Identical |
| `CHAT_STATUS` (4 keys) | Same | Same | Identical |
| `MESSAGE_ROLES` (5 keys) | Same | Same | Identical |
| `VOICE_INPUT_STATUS` | Same | Same | Identical |
| Type guards (5 functions) | `parts.ts` | `types.ts` | Same predicates |
| Part helpers (8 functions) | `parts.ts` | `types.ts` | Same API |
| Zod schemas (7 schemas) | `aiChatSchemas.ts` | `schemas.ts` | Same shape |

**Framework alignment**: The constants already include `TOOL_INVOCATION`, `TOOL_CALL`, `TOOL_RESULT` part types that cover the current tool rendering. For `render_view`, new constants would be additive — the existing pattern (add to `PART_TYPES`, add to UNION) is proven.

### 1.4 Unified Provider (DONE on both platforms)

Both platforms have a unified provider that composes theme, i18n, and registry contexts:

- **Mobile**: `AIChatProvider` in `useAIChatProvider.tsx` — composes `AIThemeProvider`, `I18nProvider`, and `ComponentRegistry`
- **Web**: `provideAiChat()` in `provider.ts` — composes `provideAiI18n()` and `providePartRegistry()`

**Framework alignment**: A generalized view framework needs exactly this pattern — a provider that gives all views access to theme tokens, i18n strings, and a component registry. The existing providers are the right shape.

### 1.5 `addToolOutput` + `sendAutomaticallyWhen` (DONE on both platforms)

The framework's core interaction cycle for AI-generated views is:

```
AI sends tool_call(render_view, {...}) ->
  UI renders the view ->
    User interacts ->
      addToolOutput(toolCallId, result) ->
        sendAutomaticallyWhen triggers ->
          AI processes result -> next message
```

Both platforms expose `addToolOutput` from their chat hooks:

- **Mobile**: `useAIChat.ts:434` exposes `addToolOutput`; `sendAutomaticallyWhen` accepted via `UseAIChatOptions.sendAutomaticallyWhen`
- **Web**: `useVercelChat.ts:251-260` exposes `addToolOutput`; `sendAutomaticallyWhen` accepted via `ChatBehaviorConfig`

**Framework alignment**: This is the exact mechanism the framework needs. The missing piece is a view component that knows how to call `addToolOutput` when the user completes an interaction.

### 1.6 Streaming Invariants (ALL 5 preserved)

The framework MUST NOT break streaming. All 5 invariants are present and verified:

| Invariant | What it protects | Location (Mobile) | Location (Web) |
|-----------|------------------|--------------------|-----------------|
| INV-1: Session ID ref-then-state deferral | Prevents session ID write during SSE stream | `useAIChat.ts:136-152, 236-238` | `useVercelChat.ts` (via `ChatConfig` + callbacks) |
| INV-2: Bridge streaming guard | Prevents backend messages overwriting SDK state during streaming | `useMessageBridge.ts:50-70` | `useAiChatSessionManager.ts:156-162` |
| INV-3: Stable SDK callback refs | Prevents re-render cascades killing SSE connection | `useAIChat.ts:138-144, 300-318` | N/A (Vue reactivity model differs) |
| INV-4: Transport useMemo non-reactive deps | Prevents transport recreation mid-stream | `useAIChat.ts:208-289` | Module-scope config constant |
| INV-5: Bridge key fingerprint dedup | Prevents duplicate message bridge loads | `useMessageBridge.ts:47, 60-68` | Session manager internal state |

**Framework alignment**: Any new view rendering MUST respect these invariants. Specifically, `render_view` tool calls arrive as parts within a streaming message — the view must render progressively as parts arrive, not trigger re-renders that break the stream.

### 1.7 Phase Completion Summary

| Phase | Mobile | Web |
|-------|--------|-----|
| **Phase 1** (Anti-pattern fixes) | 8/8 DONE | 16/17 DONE (1.9 N/A — project enforces runtime props) |
| **Phase 2** (Extraction prep) | 5/9 DONE, 3 PARTIAL, 1 MISSING | 8/9 DONE, 1 PARTIAL |

**Mobile partial items**: Adapter wiring (2.2), theme migration (2.4), markdown abstraction (2.7b)
**Web partial items**: Chatwoot component replacement (2.7 — AiChatHeader, AiPromptInput, AiReasoningPart still have hardcoded imports)

---

## 2. Gaps — What's Missing

### Gap G1: No `render_view` Tool Call Concept

**What the framework proposes**: A tool call named `render_view` (or similar) that the AI invokes to generate an entire UI view. The tool call's `args` would contain a view definition — either a reference to a predefined view, a template with data bindings, or a fully dynamic component tree.

**What exists**: The current system renders message "parts" — text, reasoning, and tool invocations. Tool invocations are rendered as collapsible panels showing input/output JSON. There is no concept of a tool call that renders a full-screen view, a form, a carousel, or any interactive UI.

**What needs building**:

1. **View definition schema** — A Zod schema defining what `render_view` args look like:
   ```typescript
   // Conceptual — needs design
   const ViewDefinitionSchema = z.object({
     viewType: z.enum(['static', 'templated', 'dynamic']),
     viewId: z.string().optional(),     // For static/templated views
     template: z.string().optional(),    // For templated views
     data: z.record(z.unknown()).optional(), // Binding data
     components: z.array(ComponentSchema).optional(), // For dynamic views
   });
   ```

2. **View renderer component** — A React/Vue component registered in the part/tool registry that:
   - Receives the view definition from the tool call `args`
   - Resolves the view (static lookup, template hydration, or dynamic composition)
   - Renders the view inline within the chat message or as a full-screen overlay
   - Captures user interactions and calls `addToolOutput(toolCallId, result)` when done

3. **View lifecycle management** — States beyond tool execution:
   - `loading` -> view definition received, resolving/rendering
   - `interactive` -> view rendered, awaiting user input
   - `completed` -> user submitted result, `addToolOutput` called
   - `expired` -> timeout or navigation away

4. **View type resolution** — How to go from `viewId: 'onboarding-welcome'` to an actual component:
   - Static views: pre-registered components in the registry
   - Templated views: a template engine that hydrates a layout with data
   - Dynamic views: a component composition system (highest complexity)

**Complexity estimate**: HIGH (3-5 developer-weeks for MVP across both platforms)

**Why it's hard**: This isn't just "render a component" — it's render a component that lives inside a streaming message, survives re-renders from subsequent streaming parts, captures user interaction state, and feeds results back into the conversation flow. The streaming invariants constrain the design significantly.

---

### Gap G2: No View Navigation / Sequencing

**What the framework proposes**: Views can be sequenced — the AI generates view A, the user completes it, the AI generates view B based on the result. This is the "onboarding flow" use case generalized.

**What exists**: The chat is a linear message list. Each message is independent. There's no concept of "this message's view connects to the next message's view."

**What needs building**:

1. **Conversation context threading** — The AI backend already handles context (it sees the full conversation history). The gap is on the frontend: how to present sequential views as a coherent flow rather than a chat history.
2. **View transition UI** — Animations/transitions between views in a sequence.
3. **Back navigation** — Can the user go back to a previous view in the sequence? What does "editing a previous answer" mean for the conversation?

**Complexity estimate**: MEDIUM (1-2 developer-weeks, mostly UI/UX)

**Why it might be simpler than expected**: If each view is just a tool call in the conversation, the AI naturally handles sequencing. The backend sees `tool_result` from view A and decides to call `render_view` for view B. The frontend just renders each view as it arrives. The "flow" emerges from the conversation, not from client-side navigation state.

---

### Gap G3: No Component Composition System for Dynamic Views

**What the framework proposes**: Fully dynamic views where the AI composes a component tree on the fly — "render a form with these fields, a header with this text, and a submit button."

**What exists**: The part registry can render pre-registered components by type. It cannot compose arbitrary component trees from a JSON definition.

**What needs building**:

1. **Block registry** — A registry of atomic UI blocks (text, image, button, form field, card, list, etc.) that can be composed.
2. **Layout system** — How blocks are arranged (stack, grid, flex).
3. **Data binding** — How blocks reference data from the tool call args.
4. **Interaction model** — How block interactions (button press, form submit) are collected into a tool result.

**Complexity estimate**: VERY HIGH (4-8 developer-weeks for a meaningful implementation)

**Recommendation**: Start with static views (Gap G1 items 1-3), then templated views, then dynamic. Dynamic composition is the end goal but should not be the first milestone.

---

### Gap G4: Incomplete Adapter Wiring (Mobile Step 2.2)

> **STATUS: RESOLVED** (2026-03-03) — see audit below.

**What the framework proposes**: All state management goes through adapter interfaces for decoupling.

**What existed**: Mobile's `useAIChatSessions` accepted a `SessionsStateAdapter` but dispatched Redux actions directly. The adapter was accepted, stored in a ref, and ignored for all 6 operations.

**Resolution**: The hook has been updated to a deliberate hybrid pattern:

- **Imperative commands** (`fetchSessions`, `fetchMessages`, `setActiveSessionId`) check `adapterRef.current` first and fall back to Redux dispatch when no adapter is provided. See `useAIChatSessions.ts:103–109, 127–137, 142–155, 170–173, 188–191`.
- **Reactive reads** (`sessions`, `activeSessionId`, `isLoadingMessages`) remain on `useAppSelector` — the adapter's imperative getters cannot trigger React re-renders. This is the correct architectural boundary; replacing selectors with adapter getters would require a complete re-architecture without benefit.

This hybrid pattern is explicitly documented in the hook's JSDoc (`useAIChatSessions.ts:27–38`). The hook is extraction-ready: pass any `SessionsStateAdapter`-conforming object and Redux is bypassed for all commands.

**Complexity estimate**: ~~LOW (0.5 day)~~ **DONE — no further work needed**

**File reference**: `src/presentation/ai-chat/hooks/ai-assistant/useAIChatSessions.ts:27–38, 103–191`

---

### Gap G5: Theme System Duplication (Mobile Step 2.4)

**What the framework proposes**: A single theme provider for all components.

**What exists**: Mobile has two coexisting systems:
- `useAIStyles()` — 19 files use it (layout + spacing + Tailwind class composition)
- `useAITheme()` / `useResolveColor()` — 0 component files use it (only in hook definitions)
- 20 direct `tailwind.color()` calls in 8 component files

**What needs building**: Migrate the 20 `tailwind.color()` calls to `useResolveColor()`. The `useAIStyles()` hook can coexist — it provides layout utilities that `useAITheme()` doesn't.

**Complexity estimate**: LOW (1 day)

**Why it matters for the framework**: View components need theme tokens. If they can only get them from `tailwind.color()`, they're coupled to Chatwoot's Tailwind singleton.

---

### Gap G6: Markdown Renderer Abstraction (Mobile Step 2.7b)

**What the framework proposes**: No hard dependency on a specific markdown library.

**What exists**:
- Mobile: `AITextPart.tsx` and `AIReasoningPart.tsx` import `react-native-markdown-display` directly. They DO accept a `MarkdownRenderer` prop for injection, but the import is always present (hard bundling dependency).
- Web: `AiTextPart.vue` has `renderMarkdown` prop + `#content` slot. `AiReasoningPart.vue` has `renderMarkdown` prop but NO slot.

**What needs building**: 
- Mobile: Register default markdown renderer via `ComponentRegistry` instead of direct import
- Web: Add `#content` slot to `AiReasoningPart.vue`

**Complexity estimate**: LOW (0.5 day per platform)

---

### Gap G7: Missing Hook-Level Tests (Both Platforms)

**What the framework proposes**: Robust, tested infrastructure before adding views.

**What exists**:
- Mobile: 9 test files, 1,631 lines — covers pure functions but ZERO hook tests for `useAIChat` (438 lines), `useAIChatSessions`, `useAIChatScroll`, `useAIChatBot`
- Web: 19 test files, 341 tests — covers composables well, but no tests for `AiChatPanel.vue`, `AiChatHeader.vue`, `AiSessionHistoryPanel.vue`, `chatwootChatConfig.ts`, `types.ts` guards, `schemas.ts`

**What needs building**: 
- Mobile: Tests for `useAIChat` (critical), `useAIChatSessions` (high)
- Web: Tests for container components and pure function modules

**Complexity estimate**: MEDIUM (2-3 developer-days per platform)

**Why it matters for the framework**: Adding `render_view` changes the tool call pipeline. Without tests on `useAIChat`, regressions in streaming lifecycle will be invisible until manual testing. The framework work should NOT proceed without at least `useAIChat` test coverage.

---

### Gap G8: Web Chatwoot Component Dependencies (Web Step 2.7)

**What the framework proposes**: All components replaceable via slots/props.

**What exists**: Three web components still have hardcoded Chatwoot imports:

| Component | Import | Has slot/prop? |
|-----------|--------|----------------|
| `AiChatHeader.vue` | `Avatar`, `DropdownMenu` | NO |
| `AiPromptInput.vue` | `Button` | NO |
| `AiReasoningPart.vue` | `MessageFormatter` | PARTIAL (prop, no slot) |

Plus global directives: `v-tooltip` (7 locations), `v-dompurify-html` (2 locations)

**What needs building**: Add slots (`#bot-selector`, `#submit-button`, `#content`) to these components.

**Complexity estimate**: LOW (1 day)

---

### Gap G9: No AI Backend Support for `render_view`

**What the framework proposes**: The AI backend sends `render_view` tool calls.

**What exists**: The FastAPI backend (`ai-backend/`) serves as the AI orchestration layer. It currently supports text streaming, tool calls for knowledge retrieval, and reasoning parts. There is no `render_view` tool definition.

**What needs building**:
1. A `render_view` tool definition in the AI backend's tool registry
2. View definition schemas in the backend (matching frontend Zod schemas)
3. Prompt engineering to teach the AI when to render views vs. send text
4. Backend view template registry (for templated views)

**Complexity estimate**: MEDIUM (1-2 developer-weeks)

**Note**: This analysis focuses on frontend. Backend work is out of scope but listed for completeness.

---

## 3. Generalization Opportunities

### 3.1 Extending the Part/Block Registry for Arbitrary View Types

The current `ComponentRegistry<TComponent>` is already generic. The generalization path:

```
Current state:
  registry.parts -> { 'text': AITextPart, 'reasoning': AIReasoningPart, ... }
  registry.tools -> { 'search': SearchToolPart, ... }

Generalized:
  registry.parts -> { 'text': AITextPart, 'reasoning': AIReasoningPart, ... }
  registry.tools -> { 'search': SearchToolPart, 'render_view': AIViewRenderer, ... }
  registry.views -> { 'onboarding-welcome': WelcomeView, 'product-card': ProductCard, ... }
  registry.blocks -> { 'heading': HeadingBlock, 'form-field': FormFieldBlock, ... }  // Phase 3
```

**Implementation approach**:

1. **Phase 1 — Add `registry.views`**: A new registry namespace for pre-registered view components, keyed by `viewId`. The `AIViewRenderer` tool renderer looks up `registry.views[args.viewId]` and renders it.

2. **Phase 2 — Add `registry.blocks`**: For templated views, a registry of atomic UI blocks that a template engine can compose. The template definition references block types; the engine looks them up in `registry.blocks`.

3. **Phase 3 — Dynamic composition**: The block registry becomes the vocabulary for AI-composed views. The AI sends a component tree as JSON; the renderer walks the tree, looking up each node in `registry.blocks`.

**Mobile implementation** (`ComponentRegistry` class):
```typescript
// Current — already generic
class ComponentRegistry<TComponent> {
  private components = new Map<string, TComponent>();
  register(key: string, component: TComponent): void;
  get(key: string): TComponent | undefined;
}

// Generalized — add a views registry to AIChatProvider
const registries = {
  parts: new ComponentRegistry<PartComponent>(),
  tools: new ComponentRegistry<PartComponent>(),
  views: new ComponentRegistry<ViewComponent>(), // NEW
  blocks: new ComponentRegistry<BlockComponent>(), // FUTURE
};
```

**Web implementation** (`partRegistry.ts`):
```typescript
// Current
interface PartRegistryConfig {
  parts: Record<string, Component>;
  tools: Record<string, Component>;
}

// Generalized
interface PartRegistryConfig {
  parts: Record<string, Component>;
  tools: Record<string, Component>;
  views: Record<string, Component>; // NEW
  blocks: Record<string, Component>; // FUTURE
}
```

**Impact on existing `AIPartRenderer`**: Minimal. The tool dispatch already checks `toolsRegistry.get(toolName)`. When `toolName === 'render_view'`, it will find the registered `AIViewRenderer` component and render it. The `AIViewRenderer` then internally resolves the specific view from `registry.views`. This is a two-level dispatch: tool registry -> view registry.

### 3.2 Extending Tool Calls for `render_view`

The `render_view` tool call follows the existing tool call pattern:

```typescript
// Existing tool call (e.g., search)
{
  type: 'tool-invocation',
  toolCallId: 'call_123',
  toolName: 'search',
  args: { query: 'shipping policy' },
  state: 'output-available',
  result: { documents: [...] }
}

// New render_view tool call
{
  type: 'tool-invocation',
  toolCallId: 'call_456',
  toolName: 'render_view',
  args: {
    viewType: 'static',          // or 'templated' or 'dynamic'
    viewId: 'onboarding-welcome', // for static/templated
    data: { userName: 'Alice' },  // binding data
  },
  state: 'input-available',       // view definition received
  // result is set LATER by addToolOutput when user completes the view
}
```

**Key difference from existing tools**: Existing tool calls go `input -> backend processes -> output`. The `render_view` tool call goes `input -> UI renders -> USER interacts -> output`. The tool result comes from the client, not the server. This is what `addToolOutput` was designed for.

**State machine for render_view**:
```
AI sends tool_call -> state: 'input-available'
  |
AIViewRenderer resolves and renders view -> state: 'view-rendering' (new?)
  |
User interacts with view -> state: 'view-interactive' (new?)
  |
User submits -> addToolOutput(callId, result) -> state: 'output-available'
  |
sendAutomaticallyWhen fires -> AI receives result -> next message
```

**Design decision needed**: Do we need new `TOOL_STATES` for view-specific states (`view-rendering`, `view-interactive`), or can we reuse `input-available` for the entire user interaction period? The existing `AIToolPart` renders input-available as "executing" — this would need different treatment for views.

### 3.3 Abstraction Layers for Static / Templated / Dynamic Views

**Static views** (simplest, build first):
- Pre-registered React/Vue components in `registry.views`
- The AI just says "show this view" with some data
- Example: onboarding welcome screen, product detail card, settings form
- The component is authored by developers, not generated by AI
- Data passed via props from the tool call `args`

**Templated views** (medium complexity):
- A template definition (JSON/YAML) that describes layout + block types + data bindings
- Blocks are pre-registered in `registry.blocks`
- The template engine assembles blocks according to the layout
- Example: a form where field types/labels/validation come from the AI but the form shell is a template
- The AI can customize the template by providing different data

**Dynamic views** (highest complexity, build last):
- The AI generates a full component tree as JSON
- Each node in the tree maps to a block in `registry.blocks`
- The renderer walks the tree depth-first, rendering each block
- Example: the AI composes a multi-section page with headers, text, images, forms, and buttons — all from scratch
- Requires a robust block vocabulary and safety constraints (what blocks can the AI use?)

**Abstraction layer design**:

```typescript
// Core interface — same on both platforms
interface ViewDefinition {
  viewType: 'static' | 'templated' | 'dynamic';
  viewId?: string;
  template?: TemplateDefinition;
  componentTree?: ComponentNode[];
  data?: Record<string, unknown>;
  metadata?: {
    title?: string;
    description?: string;
    allowBack?: boolean;
    timeout?: number;
  };
}

// Resolution chain
function resolveView(definition: ViewDefinition, registries: Registries): ResolvedView {
  switch (definition.viewType) {
    case 'static':
      return registries.views.get(definition.viewId!);
    case 'templated':
      return hydrateTemplate(definition.template!, definition.data, registries.blocks);
    case 'dynamic':
      return composeFromTree(definition.componentTree!, registries.blocks);
  }
}
```

### 3.4 Impact on Existing `AIToolPart`

The existing `AIToolPart` (both platforms) renders tool invocations as collapsible panels:
- Header with tool name, state icon, and execution status
- Collapsible body showing JSON input and output

For `render_view`, this is wrong — you don't want to show a collapsible JSON panel. You want to render the actual view.

**Options**:

A. **Tool registry override (recommended)**: Register `render_view` in `registry.tools` with a custom `AIViewRenderer` component. The `AIPartRenderer` already checks the tool registry before falling back to `AIToolPart`. This means `render_view` never hits `AIToolPart` at all. Zero changes to existing `AIToolPart` code.

B. **AIToolPart enhancement**: Add a `renderContent` prop or slot to `AIToolPart` that overrides the default JSON display. Less clean — mixes concerns.

C. **Part type override**: Register `render_view` as a custom part type in `registry.parts`. Possible but semantically wrong — it IS a tool call, not a new part type.

**Recommendation**: Option A. The tool registry was designed for exactly this use case.

---

## 4. Contradictions & Risks

### 4.1 C1: Tool Part Type Mismatch (RESOLVED in current code)

**Original concern**: The Vercel AI SDK uses different type strings for tool parts than the backend:
- SDK: `tool-invocation` with nested `state` field
- Backend: `tool-input-streaming`, `tool-input-available`, `tool-output-available`, `tool-output-error` (state encoded in type string)

**Current status**: RESOLVED. Both platforms' `PART_TYPES` constants include all variants. The `isToolPart` type guard handles both formats (`part.type?.startsWith('tool-')`). The `deriveToolDisplayState` helper normalizes both formats into a consistent `ToolState`.

**Impact on render_view**: The `render_view` tool call will arrive as a `tool-invocation` part from the SDK during streaming, then be persisted as `tool-input-available` / `tool-output-available` in the backend. The existing normalization handles this transparently.

### 4.2 Risk: Streaming Invariant Violations from View Rendering

**Severity: HIGH**

The most dangerous risk in the generalized view framework is breaking streaming. Scenarios:

1. **View component triggers re-renders during streaming**: If the `AIViewRenderer` uses stateful hooks that update during the streaming phase, it could violate INV-3 (stable callback refs) or cause the transport to be recreated (INV-4).

2. **View interaction during streaming**: If the user interacts with a view (from a previous message) while a new message is streaming, calling `addToolOutput` could corrupt the message state.

3. **View data references going stale**: During streaming, message parts are progressively added. The `render_view` tool call's `args` might be partially available (streaming input). Rendering a view from partial args is dangerous.

**Mitigations**:
- Views should only render when the tool state reaches `input-available` (not during `input-streaming`)
- `addToolOutput` calls should be guarded: if `chatStatus === 'streaming'`, queue the result and submit after streaming completes
- View components should be memoized and should not read from conversation-level state during render

### 4.3 Risk: View State Persistence Across Re-renders

**Severity: MEDIUM**

Chat messages are re-rendered when:
- The message list scrolls (FlashList recycling on mobile, virtual list on web)
- New messages arrive (the whole list re-renders)
- Session switching
- Theme changes

If a user is filling out a form in a `render_view` and the component gets recycled or re-rendered, their input is lost.

**Mitigations**:
- View components must persist their interaction state externally (not in local component state)
- Options: store in the tool call's `args` (immutable), use a separate view state store, or use `addToolOutput` with intermediate results
- Mobile's FlashList `estimatedItemSize` (currently 300) may need adjustment for tall view components

### 4.4 Risk: Mobile Adapter Wiring Gap

**Severity: LOW-MEDIUM**

Mobile's `useAIChatSessions` uses Redux directly despite accepting an adapter. If the framework is extracted to `@eleva/ai-chat-react-native`, this coupling prevents reuse outside Chatwoot.

**Mitigation**: Complete adapter wiring (Gap G4) before starting framework work. This is a prerequisite, not a parallel task.

### 4.5 Risk: Web Polling Workaround Fragility

**Severity: MEDIUM**

The web uses a 50ms polling loop to sync `@ai-sdk/vue`'s `Chat` class state into Vue refs (the SDK doesn't expose reactive refs). This is well-engineered but:

1. During `render_view` flows with frequent `addToolOutput` calls, the polling may not keep up
2. SDK updates could change the internal state structure, breaking the sync
3. The `structuredClone` of the entire message array on every poll tick becomes more expensive as messages contain rich view definitions

**Mitigation**: Monitor `@ai-sdk/vue` releases for reactive ref exposure. Consider caching/partial-clone optimizations if view definitions are large.

### 4.6 Risk: Dynamic View Security

**Severity: HIGH (for dynamic views only)**

If the AI can compose arbitrary component trees, there are security implications:
- Can the AI render a component that executes JavaScript?
- Can the AI compose a view that looks like a login form for phishing?
- Can the AI access data it shouldn't via block data bindings?

**Mitigation**: The block registry acts as a whitelist — only pre-registered blocks can be rendered. The AI cannot create new block types, only compose existing ones. Data bindings should be sandboxed (no access to global state, only to data explicitly passed in tool call args).

### 4.7 Contradiction: "Slides" vs. "Views" Terminology

The framework documents use "slides" (from the onboarding origin) but the generalization uses "views." The codebase must consistently use "views" — no code or types should reference "slides."

**Action**: All new code uses `View`, `ViewDefinition`, `render_view`, `registry.views`. No `Slide`, `SlideDefinition`, `render_slide`.

---

## 5. Recommended Implementation Order

### Guiding Principles

1. **Don't break streaming** — every phase produces a working app with all 5 invariants intact
2. **Generalize incrementally** — start with the simplest view type (static), prove the pipeline, then add complexity
3. **Get to a demo fast** — a working `render_view` with a static view is more valuable than a perfect design that takes months
4. **Both platforms advance together** — each phase has a cross-platform sync point

### Phase 0: Prerequisites (1.5 developer-weeks)

Complete the remaining Phase 2 items that the framework depends on. These are all LOW complexity and well-documented:

| Task | Platform | Effort | Why it's a prerequisite |
|------|----------|--------|------------------------|
| Complete adapter wiring (Gap G4) | Mobile | 0.5d | Can't extract hooks without it |
| Complete theme migration (Gap G5) | Mobile | 1.0d | View components need theme tokens |
| Markdown abstraction (Gap G6) | Both | 1.0d | Proves the "injectable renderer" pattern |
| Add `useAIChat` hook tests (Gap G7) | Mobile | 1.5d | Safety net before modifying tool pipeline |
| Web component slots (Gap G8) | Web | 1.0d | View components need same pattern |
| Add container component tests | Web | 1.0d | Safety net |
| **Cross-platform sync**: verify all tests pass, constants identical, hook interfaces aligned | Both | 0.5d | Foundation verification |

**Exit criteria**: All Phase 2 items complete on both platforms. Test suites green. Constants byte-for-byte identical.

### Phase 1: Static Views MVP (2-3 developer-weeks)

The first `render_view` implementation — AI sends a tool call, frontend renders a pre-registered component, user interacts, result flows back.

#### 1.1 Define View Framework Types (Both platforms, 2 days)

Add to `@eleva/ai-chat-core` candidates:

```typescript
// New file: types/viewDefinition.ts (or extend existing types)

export const VIEW_TYPES = {
  STATIC: 'static',
  TEMPLATED: 'templated',
  DYNAMIC: 'dynamic',
} as const;

export interface ViewDefinition {
  viewType: typeof VIEW_TYPES[keyof typeof VIEW_TYPES];
  viewId: string;
  data?: Record<string, unknown>;
  metadata?: ViewMetadata;
}

export interface ViewMetadata {
  title?: string;
  description?: string;
  allowBack?: boolean;
  allowDismiss?: boolean;
  timeout?: number; // ms
}

export interface ViewResult {
  viewId: string;
  action: 'completed' | 'dismissed' | 'expired' | 'error';
  data?: Record<string, unknown>;
  timestamp: string;
}

// View component contract
export interface ViewComponentProps {
  definition: ViewDefinition;
  onComplete: (result: ViewResult) => void;
  onDismiss?: () => void;
}
```

Add `render_view` to `PART_TYPES` or define it as a well-known tool name constant.

#### 1.2 Add `registry.views` Namespace (Both platforms, 1 day)

Extend the existing registry system:

- **Mobile**: Add `views: ComponentRegistry<ViewComponent>` to the registries provided by `AIChatProvider`
- **Web**: Add `views: Record<string, Component>` to `PartRegistryConfig`

Both registries use the same `viewId` string key.

#### 1.3 Build `AIViewRenderer` Tool Component (Both platforms, 3-4 days)

The core new component. Registered in `registry.tools` under the key `render_view`.

Responsibilities:
- Receive the tool call part (with `args` containing `ViewDefinition`)
- Validate `args` with Zod (`ViewDefinitionSchema.safeParse`)
- Look up the view component in `registry.views` by `viewId`
- Render the view component, passing `definition` and `onComplete` callback
- On `onComplete`: call `addToolOutput(toolCallId, JSON.stringify(result))`
- Handle error states: unknown `viewId`, invalid args, render errors

State machine (rendered visually):
```
[tool-input-streaming] -> Show loading skeleton
[input-available] -> Resolve view -> Render view component
[user interacts] -> View handles internally
[user completes] -> onComplete -> addToolOutput -> [output-available]
```

#### 1.4 Build 1-2 Example Static Views (Both platforms, 2-3 days)

Prove the pipeline with concrete examples:

1. **Welcome view** — simple card with greeting text and a "Continue" button
2. **Preference form** — 3-4 form fields (name, language, interest) with a "Submit" button

Register these in the view registry during app initialization.

#### 1.5 Wire `sendAutomaticallyWhen` for View Results (Both platforms, 1 day)

Configure `sendAutomaticallyWhen` to detect when `addToolOutput` has been called for a `render_view` tool and automatically submit the next message to the AI.

#### 1.6 Cross-Platform Sync + Integration Test (Both platforms, 2 days)

- Verify the same `render_view` tool call renders correctly on both platforms
- Verify the `addToolOutput` -> `sendAutomaticallyWhen` cycle works end-to-end
- Verify streaming is not affected (run the 7-point smoke test from implementation plans)
- Document the view registration API

**Exit criteria**: A working demo where the AI sends `render_view` -> the user sees a form -> submits -> the AI responds based on the form data. Both platforms.

### Phase 2: Templated Views + View Lifecycle (2-3 developer-weeks)

#### 2.1 Block Registry + Basic Blocks (Both platforms, 3-4 days)

Add `registry.blocks` with a set of atomic UI blocks:
- `heading`, `text`, `image`, `button`, `text-input`, `select`, `radio-group`, `checkbox`, `divider`, `card`, `stack` (vertical layout), `row` (horizontal layout)

Each block is a simple, well-tested component on each platform.

#### 2.2 Template Engine (Both platforms, 3-4 days)

A function that takes a `TemplateDefinition` + data + block registry and produces a rendered component tree:
- Template defines layout (stack of blocks)
- Each block reference includes a `blockType` and `props`
- Data bindings: `{{ data.userName }}` in block props resolves from the tool call data
- The engine is platform-specific (React elements vs. Vue VNodes) but the template format is cross-platform

#### 2.3 View State Persistence (Both platforms, 2-3 days)

Solve the re-render problem (Risk 4.3):
- External view state store keyed by `toolCallId`
- State survives message list re-renders, FlashList recycling, and theme changes
- Cleanup when the tool call reaches `output-available` or the session ends

#### 2.4 View Lifecycle Management (Both platforms, 2 days)

Implement the full lifecycle:
- Timeout handling (views that expire)
- Dismiss handling (user closes without completing)
- Error handling (view render failures)
- "Completed" visual state (view grayed out or collapsed after submission)

**Exit criteria**: A working templated view where the AI specifies "render a form with fields X, Y, Z" and the frontend assembles the form from registered blocks. User submits, AI responds.

### Phase 3: Dynamic Views + AI Backend (Future — scope TBD)

- AI-composed component trees
- Safety/sandboxing layer
- Backend view template registry
- Prompt engineering for view generation
- Performance optimization (lazy loading of view components, incremental rendering)

This phase requires significant AI backend work and should be scoped after Phase 2 proves the template model.

---

### Timeline Summary

| Phase | Effort | Calendar (1 dev) | Calendar (2 devs, cross-platform) |
|-------|--------|-------------------|-----------------------------------|
| **Phase 0**: Prerequisites | 6.5 dev-days | ~1.5 weeks | ~1 week (parallel) |
| **Phase 1**: Static Views MVP | 11-14 dev-days | ~3 weeks | ~2 weeks (parallel) |
| **Phase 2**: Templated Views | 10-13 dev-days | ~3 weeks | ~2 weeks (parallel) |
| **Phase 3**: Dynamic Views | TBD | TBD | TBD |
| **Total (Phases 0-2)** | **27.5-33.5 dev-days** | **~7.5 weeks** | **~5 weeks** |

### Critical Path

```
Phase 0 (prerequisites)
    |
Phase 1.1 (types) -> Phase 1.2 (registry) -> Phase 1.3 (AIViewRenderer) -> Phase 1.4 (examples)
    |                                                                         |
Phase 1.5 (auto-send)                                                   Phase 1.6 (sync)
    |
Phase 2 (templates, blocks, lifecycle)
```

The bottleneck is Phase 1.3 (AIViewRenderer) — it's the core component where streaming invariants, registry dispatch, tool output lifecycle, and view resolution all intersect. Allocate the most experienced developer here.
