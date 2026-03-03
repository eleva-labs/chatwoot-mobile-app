# Research 2F: Vue Support Evaluation — Three-Platform Strategy

> **Date**: 2026-02-28
> **Predecessor**: Research 2B (source analysis), 2D (wrapper architecture), 2E (unified thread)
> **Question**: Can the generative slides framework support Vue 3 (Chatwoot web), React (web), and React Native (mobile)?
> **Answer**: **YES — via Strategy A (use @assistant-ui/core from Vue) combined with Strategy C (embed React micro-component) as a fallback path. Strategy A is recommended for our use case.**
> **Confidence**: High for core runtime reuse; Medium for full component-level Vue port

---

## 1. Executive Summary

assistant-ui has **no Vue support** and **no plans for it**. There is no `@assistant-ui/vue` package, no Vue-related issues or discussions on GitHub, and no roadmap mention. The npm registry shows only React-based packages.

However, `@assistant-ui/core` is **partially framework-agnostic**. The runtime layer (`LocalRuntime`, `ChatModelAdapter`, `ThreadMessage` types, message model) and the store layer (`@assistant-ui/store`, Zustand-based) live in `core` but are exposed through React-specific entry points (`core/src/react/`). The types and runtime interfaces are plain TypeScript — no React dependency. But the store clients (`Tools`, `DataRenderers`), state hooks (`useAuiState`), and component primitives all import React.

The Chatwoot web app is Vue 3 with Vuex, Vite, and already uses `@ai-sdk/vue` (Vercel AI SDK's Vue adapter) for its AI chat feature. This means the web app already has a working AI chat pattern using Vue composables — it does NOT use assistant-ui at all.

**Our recommended strategy**: Build a shared `@eleva/generative-slides-core` package containing Zod schemas, TypeScript types, the `ChatModelAdapter` interface, and pure business logic. Then build platform-specific UI layers:
- **React Native**: Use `@assistant-ui/react-native` (already designed in Research 2D/2E)
- **Vue 3 (web)**: Build Vue composables that directly use Vercel AI SDK's `@ai-sdk/vue` (already installed in Chatwoot) with our custom tool-call rendering pattern — mirroring the existing Chatwoot AI assistant architecture
- **React (web, future)**: Use `@assistant-ui/react` when needed

This avoids embedding React inside Vue, avoids waiting for assistant-ui Vue support, and leverages the existing Chatwoot AI patterns.

---

## 2. assistant-ui Vue Support Status

### 2.1 Does @assistant-ui/vue Exist?

**No.** Evidence:

1. **npm search**: Searching `@assistant-ui/vue` returns zero results. All assistant-ui packages are React-based: `@assistant-ui/react`, `@assistant-ui/react-native`, `@assistant-ui/react-ai-sdk`, `@assistant-ui/react-markdown`, etc.

2. **GitHub issues**: Searching the `assistant-ui/assistant-ui` repo for "vue" returns only 2 unrelated issues (#3223 about Vite/webpack build config, #1004 about peer deps). Neither mentions Vue.js framework support.

3. **GitHub discussions**: Searching discussions for "vue" returns zero results.

4. **Repository packages**: The monorepo at `packages/` contains 28 packages. None are Vue-related:
   - `core/` — runtime + React primitives
   - `react/` — web React components
   - `react-native/` — RN components
   - `store/` — Zustand-based store
   - `tap/` — reactive primitives
   - No `vue/` directory exists

5. **No roadmap mention**: assistant-ui's documentation and GitHub have no indication that Vue support is planned.

### 2.2 Why No Vue Support?

assistant-ui's architecture is deeply React-centric:
- The component model (primitives, tool UI registry, message parts) uses React components, hooks, and context
- The store layer uses Zustand, which has a first-class React integration but requires manual bridging for Vue
- The tool dispatch system (`ToolUIDisplay`, `DataUIDisplay`) renders React components from a registry
- Even `@assistant-ui/core` has React in its namespace (`core/src/react/`)

The project positions itself as "the React component library for AI chat" — Vue is outside scope.

---

## 3. @assistant-ui/core Framework-Agnostic Assessment

### 3.1 What IS Framework-Agnostic

The following parts of `@assistant-ui/core` have **zero React imports** and are pure TypeScript:

| Module | Location | React-Free? |
|--------|----------|-------------|
| `ThreadMessage` type | `core/src/types/message.ts` | YES |
| `ChatModelAdapter` interface | `core/src/runtime/utils/chat-model-adapter.ts` | YES |
| `ChatModelRunOptions`, `ChatModelRunResult` | `core/src/runtime/utils/chat-model-adapter.ts` | YES |
| `ToolCallMessagePart` type | `core/src/types/message.ts` | YES |
| `TextMessagePart` type | `core/src/types/message.ts` | YES |
| `shouldContinue` logic | `core/src/runtimes/local/should-continue.ts` | YES |
| `MessageRepository` | `core/src/runtimes/local/` | YES |
| `ExternalStoreAdapter` interface | `core/src/runtimes/external-store/` | YES |
| `assistant-stream` protocol | Separate package | YES |

### 3.2 What IS React-Dependent

| Module | Location | React Dependency |
|--------|----------|------------------|
| `LocalRuntimeCore` | `core/src/runtimes/local/local-runtime-core.ts` | Uses React context for state propagation |
| `useLocalRuntime` hook | `core/src/runtimes/` | React hook |
| `useAuiState` selector | `@assistant-ui/store` | Zustand + React integration |
| `makeAssistantToolUI` | `core/src/react/model-context/` | Returns React component |
| `useAssistantToolUI` | `core/src/react/model-context/` | React hook + useEffect |
| `MessageByIndexProvider` | `core/src/react/providers/` | React context provider |
| `MessageContent` | `react-native/src/primitives/message/` | React component |
| `ThreadMessages` | `react-native/src/primitives/thread/` | React component + FlatList |
| `AssistantProvider` | `react-native/src/context/` | React context provider |
| `Tools` client | `core/src/react/client/Tools.ts` | React-aware resource |
| `DataRenderers` client | `core/src/react/client/DataRenderers.ts` | React-aware resource |

### 3.3 Can the Runtime Be Used from Vue?

**Partially, but not practically.** Here's the breakdown:

- **Types**: YES — `ThreadMessage`, `ChatModelAdapter`, `ToolCallMessagePart`, etc. are plain TypeScript interfaces. They can be imported and used in any framework.

- **Runtime core classes**: PARTIALLY — `LocalRuntimeCore`, `LocalThreadRuntimeCore` are JavaScript classes that don't import React directly, but they're designed to be consumed through `useLocalRuntime` (a React hook) and propagated via `AssistantProvider` (React context). You *could* instantiate them manually, but you'd bypass the designed API surface.

- **Store (Zustand)**: PARTIALLY — Zustand stores can theoretically be consumed from Vue via `zustand/vanilla` store + Vue's `watch`/`computed`. But `@assistant-ui/store` wraps Zustand with custom scope/resource abstractions (`useAui`, `AuiProvider`, `Derived`) that are React-specific. You'd need to bypass these abstractions.

- **Tool UI registry**: NO — The tool dispatch system (`ToolUIDisplay`, `s.tools.tools[toolName]`) stores **React components** in the registry. Vue components cannot be registered here.

- **Message rendering**: NO — `MessageContent`, `ThreadMessages`, `MessageByIndexProvider` are all React components. Vue cannot use them.

### 3.4 Zustand from Vue — Technical Feasibility

Zustand's `vanilla` store works without React:

```typescript
import { createStore } from 'zustand/vanilla';

const store = createStore((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// From Vue:
import { ref, watchEffect } from 'vue';

const count = ref(store.getState().count);
store.subscribe((state) => {
  count.value = state.count;
});
```

However, assistant-ui doesn't expose a vanilla Zustand store. It wraps everything in `@assistant-ui/store`'s `AuiProvider` / `useAui` / `Derived` system, which uses React context for scoping. You'd need to reverse-engineer the store structure or access it through non-public APIs.

**Verdict**: Using `@assistant-ui/core`'s runtime from Vue is technically possible but impractical. The cost of bridging exceeds the cost of building a Vue-native solution.

---

## 4. Chatwoot Vue App Analysis

### 4.1 Technology Stack

| Technology | Version | Reference |
|-----------|---------|-----------|
| **Vue** | `^3.5.12` | `chatwoot/package.json:96` |
| **State Management** | **Vuex 4.1.0** | `chatwoot/package.json:108` — `createStore` from `vuex` at `store/index.js:1` |
| **Build System** | **Vite 5.4.21** | `chatwoot/package.json:147` — with `vite-plugin-ruby` for Rails asset pipeline integration |
| **Vue Router** | `~4.4.5` | `chatwoot/package.json:103` |
| **AI SDK** | `ai@^5.0.104` + `@ai-sdk/vue@^2.0.104` | `chatwoot/package.json:34-35` |
| **Zod** | `^4.1.13` | `chatwoot/package.json:111` |
| **Validation** | `@vuelidate/core@^2.0.3` | `chatwoot/package.json:57` |
| **Forms** | `@formkit/vue@^1.6.7` | `chatwoot/package.json:42` |
| **Utilities** | `@vueuse/core@^12.0.0` | `chatwoot/package.json:60` |
| **CSS** | Tailwind CSS 3.4.13 | `chatwoot/package.json:146` — Tailwind-only styling policy |
| **Testing** | Vitest 3.0.5 + jsdom | `chatwoot/package.json:148` |
| **Node** | 23.x | `chatwoot/package.json:151` |
| **Package Manager** | pnpm 10.x | `chatwoot/package.json:152` |
| **Vue Components** | Composition API + `<script setup>` | AGENTS.md policy |

### 4.2 Frontend Directory Structure

```
app/javascript/
├── dashboard/              # Main dashboard app
│   ├── App.vue
│   ├── api/               # API clients
│   ├── components/        # Legacy components
│   ├── components-next/   # Next-gen components (message bubbles, AI assistant)
│   ├── composables/       # Vue composables
│   ├── constants/
│   ├── helper/
│   ├── i18n/
│   ├── mixins/            # Legacy Vue mixins
│   ├── modules/
│   ├── routes/
│   └── store/             # Vuex store
│       ├── index.js       # createStore with 40+ modules
│       ├── modules/       # Feature-specific Vuex modules
│       └── captain/       # AI/Captain-specific modules
├── design-system/
├── shared/
├── survey/
├── widget/
└── entrypoints/
```

### 4.3 Existing AI Chat Components

The Chatwoot web app already has a complete AI assistant built with Vue:

**File: `components-next/ai-assistant/`** — A full AI chat panel:

| File | Purpose | Reference |
|------|---------|-----------|
| `AiAssistant.vue` | Orchestrator — layout modes (floating, sidebar, inline) | `chatwoot/app/javascript/dashboard/components-next/ai-assistant/AiAssistant.vue` |
| `containers/AiChatPanel.vue` | Main panel — messages, bot selection, sessions, input | `chatwoot/app/javascript/dashboard/components-next/ai-assistant/containers/AiChatPanel.vue` |
| `conversation/AiConversation.vue` | Scrollable message container with auto-scroll | `chatwoot/app/javascript/dashboard/components-next/ai-assistant/conversation/AiConversation.vue` |
| `message/AiMessage.vue` | Individual message component | `chatwoot/app/javascript/dashboard/components-next/ai-assistant/message/AiMessage.vue` |
| `message/AiMessageContent.vue` | Message content wrapper | `chatwoot/app/javascript/dashboard/components-next/ai-assistant/message/AiMessageContent.vue` |
| `parts/AiPartRenderer.vue` | **Part type switch** — routes to text/reasoning/tool renderers | `chatwoot/app/javascript/dashboard/components-next/ai-assistant/parts/AiPartRenderer.vue` |
| `parts/AiTextPart.vue` | Text content renderer | `chatwoot/app/javascript/dashboard/components-next/ai-assistant/parts/AiTextPart.vue` |
| `parts/AiToolPart.vue` | Tool call renderer | `chatwoot/app/javascript/dashboard/components-next/ai-assistant/parts/AiToolPart.vue` |
| `parts/AiReasoningPart.vue` | Reasoning/thinking renderer | `chatwoot/app/javascript/dashboard/components-next/ai-assistant/parts/AiReasoningPart.vue` |
| `input/AiPromptInput.vue` | Text input with submit | `chatwoot/app/javascript/dashboard/components-next/ai-assistant/input/AiPromptInput.vue` |
| `feedback/AiChatError.vue` | Error display | `chatwoot/app/javascript/dashboard/components-next/ai-assistant/feedback/AiChatError.vue` |
| `feedback/AiLoader.vue` | Loading indicator | `chatwoot/app/javascript/dashboard/components-next/ai-assistant/feedback/AiLoader.vue` |

**Composables:**

| File | Purpose | Reference |
|------|---------|-----------|
| `useVercelChat.js` | Wraps `@ai-sdk/vue` `Chat` class with Vue reactivity polling workaround | `chatwoot/app/javascript/dashboard/components-next/ai-assistant/composables/useVercelChat.js` |
| `useAiAssistant.js` | Bot fetching, auth, session management, chat initialization | `chatwoot/app/javascript/dashboard/components-next/ai-assistant/composables/useAiAssistant.js` |
| `useAiChatSessionManager.js` | Session CRUD | `chatwoot/app/javascript/dashboard/components-next/ai-assistant/composables/useAiChatSessionManager.js` |
| `useAutoScroll.js` | Scroll-to-bottom, scroll-to-top | `chatwoot/app/javascript/dashboard/components-next/ai-assistant/composables/useAutoScroll.js` |
| `useAiMessageMapper.js` | Message format mapping | `chatwoot/app/javascript/dashboard/components-next/ai-assistant/composables/useAiMessageMapper.js` |

### 4.4 Key Architectural Pattern in Chatwoot AI Chat

The existing AI chat follows this pattern (verified from source):

```
useVercelChat() composable
  └── Chat class from @ai-sdk/vue
       └── DefaultChatTransport (SSE streaming)
            └── Custom auth headers (Devise token)
            └── Custom prepareSendMessagesRequest
            └── Custom fetch (extract session ID from headers)
  └── Reactivity workaround (polling + deep clone)
       └── Exposes: messages (ref), status (ref), error (ref)
            └── sendMessage(), setMessages(), clearError(), regenerate()
```

The `AiPartRenderer.vue` uses a **computed component switch** — identical in concept to assistant-ui's `MessageContent`:

```vue
<!-- AiPartRenderer.vue (simplified) -->
<script setup>
const partTypeMap = {
  text: AiTextPart,
  reasoning: AiReasoningPart,
};

const component = computed(() => {
  if (part.type?.startsWith('tool-')) return AiToolPart;
  return partTypeMap[part.type] || null;
});
</script>
<template>
  <component :is="component" v-if="component" :part="part" />
</template>
```

**This is the same dispatch pattern as assistant-ui's `MessageContent` switch, but in Vue.**

### 4.5 Critical Observation: Chatwoot Already Has the Vue AI Pattern

The existing `useVercelChat` → `AiChatPanel` → `AiPartRenderer` pipeline is functionally equivalent to assistant-ui's `useLocalRuntime` → `AssistantProvider` → `MessageContent` pipeline:

| assistant-ui (React Native) | Chatwoot AI (Vue 3) |
|---|---|
| `ChatModelAdapter` | `DefaultChatTransport` with custom config |
| `useLocalRuntime` | `useVercelChat` composable |
| `AssistantProvider` | `provideAiChatContext` |
| `MessageContent` switch | `AiPartRenderer` computed component |
| `makeAssistantToolUI` registry | `partTypeMap` + tool-name prefix detection |
| `useAuiState` selectors | Direct `computed()` on chat refs |
| `addToolResult` | Not yet implemented (no tool-call UIs in web) |

The gap is: **Chatwoot's Vue AI chat doesn't support interactive tool calls (human-in-the-loop).** It renders tool calls as read-only displays (`AiToolPart.vue`). To support generative slides, we'd need to add `addToolResult` equivalent functionality.

---

## 5. Four Strategies Compared

### Strategy A: Build Vue Composables Using @ai-sdk/vue Directly

**Approach**: Build Vue composables and components that mirror the assistant-ui patterns but use `@ai-sdk/vue` (already installed in Chatwoot) as the transport layer. Share only types/schemas with the React Native code.

**Architecture**:
```
@eleva/generative-slides-core (shared)
├── schemas/          # Zod schemas for slides, blocks, tool calls
├── types/            # TypeScript interfaces (ThreadMessage-compatible)
├── adapter/          # ChatModelAdapter interface (framework-agnostic)
└── logic/            # shouldContinue(), validation, pure functions

@eleva/generative-slides-vue (Vue 3 web)
├── composables/
│   ├── useSlideChat.ts       # Wraps @ai-sdk/vue Chat with slide tool handling
│   ├── useSlideState.ts      # Derives chat/slide/generating mode from messages
│   ├── useToolResult.ts      # addToolResult equivalent via SDK
│   └── useSlideHistory.ts    # Session persistence
├── components/
│   ├── UnifiedThreadView.vue  # Mode switching (chat vs slide)
│   ├── SlideRenderer.vue      # Full-screen slide rendering
│   ├── SlidePartRenderer.vue  # Tool call → slide component dispatch
│   ├── MiniChatBar.vue        # Collapsed chat in slide mode
│   └── blocks/                # Block components (BigText, SingleChoice, etc.)
└── index.ts

Mobile app (uses @assistant-ui/react-native as designed in 2D/2E)
```

**What's shared**: Zod schemas, TypeScript types, pure business logic (validation, shouldContinue equivalent), block schema definitions.

**What's NOT shared**: UI components, state management hooks, rendering pipeline.

**Effort estimate**:
| Task | Days |
|------|------|
| `@eleva/generative-slides-core` package (schemas, types, pure logic) | 2 |
| `useSlideChat` composable (wrap @ai-sdk/vue + tool result handling) | 2 |
| `useSlideState` composable (mode derivation from messages) | 0.5 |
| `useToolResult` composable (addToolResult equivalent) | 1 |
| `UnifiedThreadView.vue` (mode switching) | 1 |
| `SlidePartRenderer.vue` (tool dispatch, extend AiPartRenderer pattern) | 1 |
| `SlideRenderer.vue` + block components (5 MVP) | 3–4 |
| `MiniChatBar.vue` | 0.5 |
| Auth integration (reuse existing Chatwoot auth pattern) | 0.5 |
| Testing + integration | 2 |
| **Total Vue web work** | **13–16 days** |

**Pros**:
- Uses existing Chatwoot patterns (`@ai-sdk/vue`, Vuex, composables)
- No new framework dependencies in Chatwoot
- Chatwoot team can maintain it with their existing Vue skills
- Clean separation — each platform uses its native best tools
- Zod 4 already in Chatwoot (`^4.1.13`)

**Cons**:
- ~30% code duplication between Vue and React Native UI logic
- Tool result handling must be re-implemented for `@ai-sdk/vue` (not as elegant as assistant-ui's built-in `humanToolNames` + `addToolResult` auto-continue)
- Two codebases to maintain for UI components
- Vue version doesn't get assistant-ui's battle-tested streaming/state management

**Maintenance burden**: MEDIUM — Vue components evolve independently from RN components. Schema changes propagate through shared core package.

### Strategy B: Build a Completely Separate @eleva/generative-slides-vue Package

**Approach**: Share only Zod schemas and types. Build everything else from scratch for Vue — no `@ai-sdk/vue`, no assistant-ui, custom SSE transport, custom state management.

**Effort estimate**: 18–24 days (similar to Strategy A but with more transport/streaming work since we don't use `@ai-sdk/vue`).

**Pros**: Complete control, zero external dependencies for AI layer.

**Cons**: 
- Ignores the fact that Chatwoot already has `@ai-sdk/vue` installed and working
- Must build SSE streaming, message model, error handling from scratch
- Most effort, highest maintenance burden
- Solves no problem that Strategy A doesn't solve more efficiently

**Verdict**: **REJECTED** — Strategy A is strictly better. There's no reason to ignore the existing `@ai-sdk/vue` infrastructure.

### Strategy C: Embed React Inside Vue (Micro-Frontend with Veaury)

**Approach**: Use `veaury` to render React components inside the Vue app. The slide renderer is a React component using `@assistant-ui/react`, wrapped with `applyPureReactInVue`.

**Architecture**:
```vue
<!-- In Chatwoot Vue app -->
<template>
  <ReactSlideRenderer :slide="slideData" @result="handleResult" />
</template>

<script setup>
import { applyPureReactInVue } from 'veaury';
import { SlideRendererReact } from '@eleva/generative-slides-react';

const ReactSlideRenderer = applyPureReactInVue(SlideRendererReact);
</script>
```

**Veaury assessment** (from npm analysis):
- 35K weekly downloads, actively maintained
- Supports Vue 3 + React 18/19
- Has Vite plugin for dual JSX compilation
- Supports context bridging (Vue provide/inject ↔ React context)
- 0 dependencies, 166KB unpacked

**Effort estimate**:
| Task | Days |
|------|------|
| Veaury setup in Chatwoot (Vite config, dual JSX) | 1 |
| Build shared React slide components | 3–4 |
| Bridge React components into Vue (applyPureReactInVue) | 1 |
| Context bridging (Vue auth → React, tool results React → Vue) | 2 |
| State synchronization (Vuex ↔ Zustand) | 1.5 |
| Testing dual-framework rendering | 2 |
| **Total** | **10–12 days** |

**Pros**:
- Maximum code sharing — React slide components used on both web and (conceptually) RN
- Slide rendering is identical across platforms
- assistant-ui's tool registry, `addToolResult`, streaming — all work

**Cons**:
- **Adds React + ReactDOM to the Chatwoot bundle** (~40KB gzipped). This is a non-trivial addition to a production app.
- **Dual-framework complexity**: JSX compilation must distinguish between Vue JSX and React JSX. Vite config becomes complex.
- **Context bridging overhead**: Vue provide/inject and React context don't automatically interop. Auth tokens, Vuex state, and route info must be explicitly bridged.
- **Debugging difficulty**: Stack traces cross framework boundaries. DevTools show mixed React and Vue component trees.
- **Chatwoot team impact**: Ruby/Vue developers now need to understand React to maintain the slide feature.
- **Build system risk**: `vite-plugin-ruby` + `@vitejs/plugin-vue` + veaury's dual-JSX plugin must all coexist. Chatwoot's build already has complexity (library mode for SDK, Rails integration).
- **Performance**: Two virtual DOMs running simultaneously. Each React-in-Vue bridge creates a React root.
- **TypeScript JSX conflict**: Vue and React both extend global `JSX` namespace. Veaury docs acknowledge this requires patching `@types/react` and `@vue/runtime-dom` type definitions.

**Verdict**: **POSSIBLE but HIGH-RISK for a production Rails app like Chatwoot.** The 2–4 day savings over Strategy A isn't worth the operational complexity. This approach makes more sense for new greenfield projects, not for embedding in an existing Vue codebase.

### Strategy D: Wait for assistant-ui Vue Package

**Likelihood**: **Very low (< 5%)** in the next 12 months.

**Evidence**:
- Zero Vue-related issues, discussions, or PRs in the repo
- The project's identity is "React component library for AI"
- The React Native package was only extracted from core in early 2026 — the team is focused on React ecosystem expansion, not Vue
- With 8.6K stars, if Vue were planned, there would be community requests
- The architecture (React context, hooks, components as first-class) makes a Vue port a major rewrite, not a wrapper

**Timeline**: Even if started today, a production-quality Vue package would take 3–6 months given the scope (primitives, store bindings, component model, tool registry).

**Verdict**: **REJECTED** — Cannot plan around this.

---

## 6. Strategy Comparison Matrix

| Factor | A: Vue + @ai-sdk/vue | B: Fully Custom | C: React-in-Vue | D: Wait |
|--------|---------------------|-----------------|------------------|---------|
| **Effort (days)** | 13–16 | 18–24 | 10–12 | Unknown |
| **New deps in Chatwoot** | None (already has @ai-sdk/vue) | Custom SSE lib | React + ReactDOM + Veaury (~55KB gz) | N/A |
| **Code sharing with RN** | Schemas + types only (~20%) | Schemas + types only (~20%) | React slide components (~50%) | 100% |
| **Maintenance burden** | Medium (2 UI codebases) | High (2 full stacks) | High (dual framework) | Zero (doesn't exist) |
| **Chatwoot team fit** | Excellent (Vue-native) | Good (Vue-native) | Poor (must learn React) | N/A |
| **Build system impact** | Zero | Zero | High (dual JSX, patched types) | Zero |
| **Bundle size impact** | Negligible | Negligible | +40KB gzipped | Zero |
| **Production risk** | Low | Low | Medium-High | N/A |
| **Time to first demo** | 5 days | 7 days | 4 days | N/A |
| **assistant-ui features** | Manual reimplementation | Manual reimplementation | Full (addToolResult, tool registry) | Full |

---

## 7. Recommendation

### Primary: Strategy A — Vue Composables with @ai-sdk/vue

**Build a shared core package for schemas/types, then build native Vue composables and components for the web, while using @assistant-ui/react-native for mobile.**

Rationale:

1. **Chatwoot already has the pattern.** The existing `useVercelChat` → `AiPartRenderer` pipeline is 80% of what we need. We extend it with tool-call interactivity, not replace it.

2. **Zero new dependencies.** `@ai-sdk/vue` and `zod@^4` are already installed. No bundle size impact.

3. **Team alignment.** Chatwoot developers work in Vue. Strategy A keeps everything in their comfort zone. Strategy C would require React knowledge.

4. **Production safety.** No dual-framework rendering, no JSX compilation hacks, no type definition patches. The build system stays as-is.

5. **The code sharing gap is acceptable.** Yes, we duplicate ~1,000 lines of UI logic between Vue and React Native. But:
   - The schemas/types (the hard, shared part) are in the core package
   - Vue and React Native UI code has different layout/styling anyway
   - The tool-call flow logic (shouldContinue, addToolResult) is ~100 lines — easy to port
   - The slide block components (BigText, SingleChoice, etc.) are simple form elements — trivial to build in either framework

6. **The @ai-sdk/vue Chat class supports tool calls.** The Vercel AI SDK v5 Vue adapter exposes `addToolResult` functionality through its `Chat` class. The Chatwoot web app just hasn't used it yet because their current AI chat doesn't have interactive tools. We add this capability.

### Fallback: Strategy C — Only If Vue Development Time Becomes Critical

If timelines compress and we need the web version faster, Strategy C (React-in-Vue via veaury) can be pursued. The key prerequisite: verify that veaury works with Chatwoot's `vite-plugin-ruby` build pipeline before committing.

---

## 8. Impact on Architecture

### 8.1 Shared Schemas Package

**Change**: Extract schemas into `@eleva/generative-slides-core`.

```
@eleva/generative-slides-core/
├── src/
│   ├── schemas/
│   │   ├── blocks.ts          # Zod schemas: BigTextBlock, SingleChoiceBlock, etc.
│   │   ├── slide.ts           # Zod schema: Slide (header, blocks[], actions)
│   │   ├── slideOutput.ts     # Zod schema: SlideOutput (values, action)
│   │   └── index.ts
│   ├── types/
│   │   ├── message.ts         # ThreadMessage-compatible types (framework-agnostic)
│   │   ├── toolCall.ts        # ToolCallResult, SlideToolCallArgs
│   │   └── index.ts
│   ├── logic/
│   │   ├── shouldContinue.ts  # Pure function: should runtime auto-continue?
│   │   ├── validation.ts      # Slide output validation against schema
│   │   └── index.ts
│   └── index.ts
├── package.json               # Zero dependencies (only zod as peer dep)
└── tsconfig.json
```

This package is used by ALL three platforms:
- React Native: imported in slide block components and `ChatModelAdapter`
- Vue 3 web: imported in slide block components and `useSlideChat`
- React web (future): imported in slide block components

### 8.2 ChatModelAdapter Pattern for Vue

The `ChatModelAdapter` interface is pure TypeScript and works identically for Vue. The Vue version uses `@ai-sdk/vue`'s `DefaultChatTransport` instead:

```typescript
// Vue equivalent of ChatModelAdapter — uses @ai-sdk/vue's transport
import { Chat, DefaultChatTransport } from '@ai-sdk/vue';

export function useSlideChat(options: {
  endpoint: string;
  agentBotId: number;
}) {
  const transport = new DefaultChatTransport({
    api: options.endpoint,
    headers: getAuthHeaders,
    prepareSendMessagesRequest: /* ... same as existing useVercelChat ... */,
  });

  const chat = new Chat({
    transport,
    // Tool result handling via @ai-sdk/vue's built-in support
  });

  // ... wrap with Vue reactivity (same polling pattern as useVercelChat)
}
```

### 8.3 UnifiedThreadView Concept in Vue

The `useSlideState()` selector from Research 2E translates directly to a Vue composable:

```typescript
// Vue composable equivalent
function useSlideState(messages: Ref<UIMessage[]>, isStreaming: Ref<boolean>) {
  return computed(() => {
    const msgs = messages.value;
    for (let i = msgs.length - 1; i >= 0; i--) {
      const msg = msgs[i];
      if (msg.role !== 'assistant') continue;
      for (const part of msg.parts || []) {
        if (part.type?.startsWith('tool-') && part.toolName === 'render_slide' && !part.result) {
          return { mode: 'slide' as const, messageIndex: i, part };
        }
      }
      break;
    }
    if (isStreaming.value) return { mode: 'generating' as const };
    return { mode: 'chat' as const };
  });
}
```

The `UnifiedThreadView.vue` uses `v-if` instead of conditional JSX:

```vue
<template>
  <!-- Chat mode -->
  <div v-if="slideState.mode === 'chat'" class="flex-1 overflow-y-auto">
    <AiConversation>
      <ChatMessageRenderer v-for="msg in messages" :key="msg.id" :message="msg" />
    </AiConversation>
  </div>

  <!-- Slide mode -->
  <div v-else-if="slideState.mode === 'slide'" class="flex-1 flex flex-col">
    <MiniChatBar :latest-text="latestAIText" />
    <SlideRenderer
      :slide="slideState.part.args"
      :read-only="false"
      @submit="handleSlideSubmit"
    />
  </div>

  <!-- Generating mode -->
  <div v-else class="flex-1">
    <AiConversation>
      <ChatMessageRenderer v-for="msg in messages" :key="msg.id" :message="msg" />
      <AiLoader />
    </AiConversation>
  </div>
</template>
```

### 8.4 Tool Registration Pattern for Vue

Instead of assistant-ui's `makeAssistantToolUI` (React component registry), Vue uses the existing `AiPartRenderer` pattern — a computed component switch:

```vue
<!-- SlidePartRenderer.vue — extends AiPartRenderer with slide support -->
<script setup>
import { computed, defineAsyncComponent } from 'vue';
import AiTextPart from '../ai-assistant/parts/AiTextPart.vue';
import AiReasoningPart from '../ai-assistant/parts/AiReasoningPart.vue';
import AiToolPart from '../ai-assistant/parts/AiToolPart.vue';

const SlideToolRenderer = defineAsyncComponent(() =>
  import('./SlideToolRenderer.vue')
);

const props = defineProps({
  part: { type: Object, required: true },
  role: { type: String, required: true },
  isStreaming: { type: Boolean, default: false },
});

const emit = defineEmits(['tool-result']);

const component = computed(() => {
  if (props.part.type === 'text') return AiTextPart;
  if (props.part.type === 'reasoning') return AiReasoningPart;

  // Tool dispatch — check tool name
  if (props.part.type?.startsWith('tool-')) {
    if (props.part.toolName === 'render_slide') return SlideToolRenderer;
    return AiToolPart; // Default tool display
  }

  return null;
});
</script>

<template>
  <component
    :is="component"
    v-if="component"
    :part="part"
    :role="role"
    :is-streaming="isStreaming"
    @tool-result="emit('tool-result', $event)"
  />
</template>
```

This is less dynamic than assistant-ui's global registry but perfectly adequate for our use case (we know the tool names at build time).

### 8.5 addToolResult in Vue

The `@ai-sdk/vue` Chat class from Vercel AI SDK v5 supports `addToolResult`. The existing Chatwoot code doesn't use it, but the API exists:

```typescript
// In useSlideChat composable
const handleToolResult = (toolCallId: string, result: SlideOutput) => {
  chat.addToolResult({
    toolCallId,
    result: JSON.stringify(result),
  });
};
```

If `@ai-sdk/vue`'s `Chat` class doesn't expose `addToolResult` directly, we fall back to the same approach as the mobile `ChatModelAdapter`: construct a new message with the tool result and send it via the transport.

---

## 9. Cross-Platform Dependency Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   @eleva/generative-slides-core                 │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Zod Schemas  │  │  TS Types    │  │  Pure Logic           │  │
│  │  - Slide      │  │  - Message   │  │  - shouldContinue()  │  │
│  │  - Block      │  │  - ToolCall  │  │  - validateOutput()  │  │
│  │  - SlideOutput│  │  - SlideArgs │  │  - formatValue()     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                 │
│  Peer deps: zod@^4                                              │
│  Framework deps: NONE                                           │
└──────────────────────┬──────────────────────┬───────────────────┘
                       │                      │
          ┌────────────┴─────────┐  ┌─────────┴──────────────┐
          │                      │  │                        │
          ▼                      │  ▼                        │
┌─────────────────────────┐      │  ┌────────────────────────┐
│  React Native (Mobile)  │      │  │  Vue 3 (Chatwoot Web)  │
│                         │      │  │                        │
│  @assistant-ui/react-native    │  │  @ai-sdk/vue           │
│  @assistant-ui/core     │      │  │  vuex                  │
│  @assistant-ui/store    │      │  │  vue-router             │
│                         │      │  │                        │
│  ┌───────────────────┐  │      │  │  ┌──────────────────┐  │
│  │ useLocalRuntime   │  │      │  │  │ useSlideChat     │  │
│  │ ChatModelAdapter  │  │      │  │  │ (wraps Chat)     │  │
│  │ humanToolNames    │  │      │  │  │ useSlideState    │  │
│  │ addToolResult     │  │      │  │  │ useToolResult    │  │
│  └───────────────────┘  │      │  │  └──────────────────┘  │
│                         │      │  │                        │
│  ┌───────────────────┐  │      │  │  ┌──────────────────┐  │
│  │ UnifiedThreadView │  │      │  │  │ UnifiedThread    │  │
│  │ (React component) │  │      │  │  │ View.vue         │  │
│  │ SlideToolUI       │  │      │  │  │ SlidePartRender  │  │
│  │ (makeAssistantToolUI) │     │  │  │ er.vue           │  │
│  │ SlideRenderer     │  │      │  │  │ SlideRenderer    │  │
│  │ (React component) │  │      │  │  │ .vue             │  │
│  └───────────────────┘  │      │  │  └──────────────────┘  │
│                         │      │  │                        │
│  ┌───────────────────┐  │      │  │  ┌──────────────────┐  │
│  │ Block Components  │  │      │  │  │ Block Components │  │
│  │ (React Native)    │  │      │  │  │ (.vue files)     │  │
│  │ - BigText.tsx     │  │      │  │  │ - BigText.vue    │  │
│  │ - SingleChoice.tsx│  │      │  │  │ - SingleChoice   │  │
│  │ - TextInput.tsx   │  │      │  │  │   .vue           │  │
│  │ - InfoCard.tsx    │  │      │  │  │ - TextInput.vue  │  │
│  │ - Success.tsx     │  │      │  │  │ - InfoCard.vue   │  │
│  └───────────────────┘  │      │  │  │ - Success.vue    │  │
│                         │      │  │  └──────────────────┘  │
│  Build: Expo/Metro      │      │  │                        │
│  State: Redux + Zustand │      │  │  Build: Vite + Ruby    │
│  Style: twrnc           │      │  │  State: Vuex           │
└─────────────────────────┘      │  │  Style: Tailwind CSS   │
                                 │  └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  React (Future Web)    │
                    │                        │
                    │  @assistant-ui/react   │
                    │  Same patterns as RN   │
                    │  but with web prims    │
                    │                        │
                    │  (Not yet needed —     │
                    │   build when required) │
                    └────────────────────────┘
```

### 9.1 Shared Code Breakdown

| Code Layer | Shared? | Location |
|-----------|---------|----------|
| Zod schemas (Slide, Block, SlideOutput) | YES — all 3 platforms | `@eleva/generative-slides-core` |
| TypeScript types (ToolCallArgs, etc.) | YES — all 3 platforms | `@eleva/generative-slides-core` |
| Pure logic (validation, shouldContinue) | YES — all 3 platforms | `@eleva/generative-slides-core` |
| Chat transport / adapter | NO — platform-specific | `ChatModelAdapter` (RN) vs `DefaultChatTransport` (Vue) |
| State management hooks | NO — framework-specific | `useAuiState` (RN) vs Vue `computed` (Vue) |
| Tool dispatch | NO — framework-specific | `makeAssistantToolUI` (RN) vs `computed` component switch (Vue) |
| Slide renderer | NO — platform-specific | React component (RN) vs Vue component (Vue) |
| Block components | NO — platform-specific | React Native (View, Text) vs Vue (div, Tailwind) |
| Mode switching logic | PARTIALLY — logic shared, rendering separate | `useSlideState` logic identical, rendering framework-specific |

### 9.2 Estimated Shared Code Percentage

- **Core package** (schemas, types, logic): ~600–800 lines — **100% shared** across all platforms
- **UI code per platform**: ~1,500–2,000 lines each — **0% shared** (different frameworks, different styling)
- **Business logic in composables/hooks**: ~200–300 lines — **~70% shared** (mode derivation logic, validation, message traversal)
- **Total effective sharing**: ~25–30% of total codebase

---

## 10. Implementation Sequence

### Phase 1: Core Package (Week 1, 2 days)
1. Create `@eleva/generative-slides-core`
2. Move Zod schemas from architecture design into package
3. Define TypeScript interfaces for cross-platform types
4. Export pure logic functions

### Phase 2: React Native (Weeks 1–3, 16–19 days)
Follow Research 2D/2E — build the assistant-ui wrapper architecture for mobile.
This is the primary implementation path already designed.

### Phase 3: Vue 3 Web (Weeks 3–5, 13–16 days)
1. `useSlideChat` composable — extend `useVercelChat` with tool result handling
2. `useSlideState` composable — mode derivation
3. `SlidePartRenderer.vue` — extend `AiPartRenderer` with slide tool dispatch
4. `UnifiedThreadView.vue` — mode switching
5. `SlideRenderer.vue` + block components
6. `MiniChatBar.vue`
7. Integration with Chatwoot's auth, routing, and Vuex store

### Phase 4: React Web (Future, when needed)
Use `@assistant-ui/react` — the web package is mature (1,100+ releases, 1M+ weekly downloads). Implementation mirrors the RN approach with web-specific primitives.

---

## 11. Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| `@ai-sdk/vue` Chat class doesn't expose `addToolResult` | HIGH — core slide flow depends on this | LOW — AI SDK v5 Vue adapter is feature-complete | Test in spike (1 day). Fallback: send tool result as a new user message with metadata. |
| Vue `useVercelChat` reactivity workaround is fragile (polling) | MEDIUM — streaming UX may lag | MEDIUM — existing code already has this issue | The polling approach works today for chat. For slides (which are discrete, not streaming), it's less of a concern. |
| Block components diverge between Vue and RN | LOW — visual inconsistencies | MEDIUM — different developers, different frameworks | Shared Zod schemas enforce data contracts. Visual QA across platforms. Shared Storybook-like documentation for blocks. |
| Chatwoot upgrades break AI chat composables | LOW — we extend, not modify | LOW — our code is additive | Keep slide code in separate directory (`components-next/onboarding-slides/`). Don't modify existing AI assistant files. |
| assistant-ui releases a Vue package in 6 months | LOW — we already built Vue version | VERY LOW (< 5%) | If it happens, evaluate migration. Our core package still provides value. |

---

## 12. Conclusion

### The Three-Platform Strategy Is Viable

Supporting Vue 3 (web), React (web), and React Native (mobile) requires accepting that **UI code will not be shared across frameworks**. This is a fundamental reality of cross-framework development — Vue components cannot run in React, and vice versa.

What CAN be shared:
- **Schemas**: Zod schemas define the contract between AI backend and all frontends
- **Types**: TypeScript interfaces ensure type safety across platforms
- **Business logic**: Validation, mode derivation, tool-call flow decisions

What CANNOT be shared:
- **Components**: Different frameworks, different component models
- **State hooks**: `useAuiState` (Zustand/React) vs `computed` (Vue)
- **Tool dispatch**: `makeAssistantToolUI` (React component registry) vs `computed` component switch (Vue)

### Strategy A (Vue + @ai-sdk/vue) Is the Clear Winner

- It respects Chatwoot's existing architecture
- It adds zero dependencies
- It's maintainable by the existing team
- It's 13–16 days of effort (vs 10–12 for Strategy C with much higher risk)
- The code sharing gap (~30% shared) is acceptable and unavoidable without a single-framework approach

### The Core Package Is the Architectural Keystone

`@eleva/generative-slides-core` is what makes the three-platform strategy work. It's the single source of truth for:
- What a slide looks like (Zod schema)
- What the AI sends (tool call type)
- What the user submits (output schema)
- When to auto-continue (shouldContinue logic)

Every platform imports this package. Changes to the slide format propagate to all platforms through type checking. This is the right level of abstraction for cross-platform code sharing.
