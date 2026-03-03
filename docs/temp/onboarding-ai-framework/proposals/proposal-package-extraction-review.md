# Proposal: Package Extraction Design Review

> **Date**: 2026-02-28
> **Reviewer**: Principal Engineer Review
> **Document Under Review**: Research 3A — Package Extraction Design
> **Supporting Documents**: Research 2G (honest comparison), Architecture Design v2
> **Methodology**: Critical review of package boundaries, interface design, patterns, and online API verification

---

## 1. Executive Summary — Top 5 Findings

1. **CRITICAL — Singleton registry is incompatible with multiple chat instances and breaks React/Vue scoping.** The `ComponentRegistry` is a module-level singleton. If a consumer renders two `AIChatInterface` components with different custom tool renderers (e.g., customer support chat + onboarding chat), they share the same global registry. This also breaks SSR, HMR, and testing isolation. TanStack and Radix both avoid global singletons — use context-scoped registries instead.

2. **CRITICAL — The "token values are strings" cross-platform styling claim is misleading.** React Native with `twrnc` consumes Tailwind class strings and returns `StyleSheet`-like objects applied via the `style` prop. Web uses CSS class strings applied via the `className` prop. These are fundamentally different application mechanisms. The design handwaves this by saying "the platform decides what strings mean," but the components still need platform-specific code to *apply* those strings (`style={tw\`...\`}` vs `className="..."`). The token type `string` is correct, but the consumption path is not interchangeable and needs explicit documentation.

3. **IMPORTANT — `ChatConfig` is a god object.** It mixes transport concerns (`streamEndpoint`, `getHeaders`, `prepareRequest`, `parseError`, `fetch`, `extractSessionId`), session management (`sendAutomaticallyWhen`), persistence, i18n, user info, bot info, and stream throttling into a single interface. This will be painful to test, painful to extend, and produces poor IDE autocomplete. Split into `TransportConfig`, `ChatOptions`, and `UserConfig` at minimum.

4. **IMPORTANT — AI SDK v5 tool part types have changed from what the design assumes.** The official docs (verified Feb 2026) show tool parts are now typed as `tool-${toolName}` (e.g., `tool-askForConfirmation`), with states `input-streaming`, `input-available`, `output-available`, `output-error`, and `approval-requested`. The design's references to `part.type.startsWith('tool-')` and `part.state !== 'result'` use the **old v4 API shape**. The part renderer dispatch logic needs updating.

5. **IMPORTANT — Missing versioning strategy will cause dependency hell.** Four packages with no declared versioning strategy (lockstep vs independent) will inevitably drift. With core defining interfaces consumed by three platform packages, a breaking change to `ChatConfig` or `AIThemeTokens` requires coordinated releases. The document mentions no monorepo tooling, no changeset automation, and no publishing workflow.

---

## 2. Findings by Category

### CRITICAL

#### C1: Singleton Registry Breaks Multi-Instance, SSR, HMR, and Testing

**Location**: Section 7 (Component/Part Registry Design), lines 544-660

**Problem**: `partRegistry` and `toolRegistry` are module-level singletons:

```typescript
const partRegistry = new ComponentRegistry<PartComponent>();
// ... module-level registration
partRegistry.register('text', AITextPart);
```

**Why this is critical**:
- **Multiple instances**: Two chat widgets on the same page share the same registry. If widget A registers a custom `search_results` tool renderer and widget B registers a different one, the last registration wins.
- **SSR/SSG**: Singletons persist across requests in server environments (Node.js module cache). Request A's registrations leak into Request B's render.
- **HMR**: Module-level side effects (import-time registration) may not re-execute during hot module replacement, causing the registry to lose registrations after a code change.
- **Testing**: Tests that register custom components pollute the shared singleton. Tests become order-dependent.
- **Tree shaking**: Import-time side effects (`import { AITextPart } from '../parts/AITextPart'` at module scope) prevent bundlers from tree-shaking unused default renderers.

**How established libraries solve this**:
- **Radix UI**: Components are composed via React's component tree — no global registry. Each `<DropdownMenu>` is self-contained.
- **TanStack Query**: The `QueryClient` is an instance, not a singleton. It's provided via `QueryClientProvider` context. Each provider scope gets its own instance.
- **Headless UI**: Uses render props / slots within the React/Vue component tree. No global state.

**Recommendation**: Move the registry into the context provider:

```typescript
// Instead of module-level singleton:
<AIChatProvider
  registry={{
    parts: { text: AITextPart, reasoning: AIReasoningPart },
    tools: { search_results: SearchResultsToolUI },
    blocks: { 'single-choice': SingleChoiceBlock },
  }}
>
  <AIChatInterface config={chatConfig} />
</AIChatProvider>
```

This is the TanStack pattern: instance-per-provider, not global singleton.

#### C2: Tool Part Type Shape Uses Obsolete v4 API

**Location**: Architecture Design Section 14.1, Research 3A Section 7.4

**Problem**: The design references `part.type.startsWith('tool-')` and checks `part.state !== 'result'`. The AI SDK v5 official docs (verified Feb 28, 2026) show:

- Tool parts are now typed as `tool-${toolName}` (e.g., `part.type === 'tool-askForConfirmation'`)
- Tool states are: `input-streaming`, `input-available`, `output-available`, `output-error`, `approval-requested`
- There is no `state: 'result'` — the equivalent is `state: 'output-available'`

The design's `AIPartRenderer` dispatch logic:

```typescript
if (isToolPart(part)) {
  const toolName = (part as ToolPart).toolName;
```

...should instead be:

```typescript
if (part.type.startsWith('tool-')) {
  const toolName = part.type.slice(5); // extract from 'tool-{name}'
  // part.state is one of: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
```

Or better yet, use the typed tool parts pattern from the docs where you match on specific `tool-${name}` types.

**Impact**: The core type guards (`isToolPart`, `TOOL_STATES`) in the core package are based on assumptions that need verification against the actual v5 runtime. This affects all three platform packages.

---

### IMPORTANT

#### I1: `ChatConfig` Is a God Object

**Location**: Appendix A, lines 1117-1190

**Problem**: `ChatConfig` has 12 properties spanning 4 unrelated concerns:

| Concern | Properties | Count |
|---------|-----------|-------|
| Transport | `streamEndpoint`, `getHeaders`, `prepareRequest`, `parseError`, `fetch`, `extractSessionId` | 6 |
| Behavior | `streamThrottle`, `sendAutomaticallyWhen` | 2 |
| Adapters | `persistence`, `i18n` | 2 |
| Display | `user`, `bot` | 2 |

**Why this matters**: When a consumer just wants to change the user avatar, they're editing the same object that controls SSE transport. TypeScript autocomplete will show 12 properties. Testing requires mocking all concerns.

**Recommendation**: Split into:

```typescript
interface TransportConfig {
  streamEndpoint: string | (() => string);
  getHeaders: () => Record<string, string> | Promise<Record<string, string>>;
  prepareRequest?: (...) => ...;
  parseError?: (...) => ...;
  fetch?: typeof globalThis.fetch;
  extractSessionId?: (...) => ...;
}

interface ChatBehaviorConfig {
  streamThrottle?: number;
  sendAutomaticallyWhen?: (...) => boolean;
}

interface ChatUIConfig {
  user?: { name?: string; avatarUrl?: string };
  bot?: { id: number; name?: string; avatarUrl?: string };
}

interface ChatConfig {
  transport: TransportConfig;
  behavior?: ChatBehaviorConfig;
  ui?: ChatUIConfig;
  persistence?: PersistenceAdapter;
  i18n?: I18nProvider;
}
```

#### I2: `SessionsAdapter` Should Be Optional, Not Required

**Location**: Section 8.3, lines 853-866

**Problem**: The `SessionsAdapter` interface requires `fetchSessions`, `fetchMessages`, `getActiveSessionId`, `setActiveSessionId`, `getIsLoadingSessions`, `getIsLoadingMessages`. But many consumers won't have sessions at all — a simple chatbot with a single conversation thread doesn't need session management.

**Recommendation**: Make sessions entirely optional. The hooks should work without any session adapter. When no adapter is provided, the chat operates in single-session mode (no session panel, no session switching). The architecture design already shows this pattern for onboarding (which has a single flow, not multiple sessions).

#### I3: `I18nProvider` Is Insufficient

**Location**: Section 8.4, lines 870-891

**Problem**: The interface is:

```typescript
interface I18nProvider {
  t(key: string, params?: Record<string, unknown>): string;
}
```

This covers simple string lookup with interpolation, but misses:
- **Pluralization**: "1 session" vs "3 sessions" — many i18n libraries require `t(key, { count })` with plural rules
- **Locale detection**: The provider doesn't expose the current locale, which components may need for `Intl.DateTimeFormat`, `date-fns` locale, etc.
- **Namespace support**: Keys like `'AI_ASSISTANT.CHAT.TOOLS.PENDING'` are flat strings, but many i18n systems use namespaces
- **RTL support**: Arabic/Hebrew consumers need direction hints

The default i18n that strips prefixes and lowercases the last segment will produce unreadable text for keys like `AI_ASSISTANT.CHAT.ERROR.AUTHENTICATION` → `"authentication"`.

**Recommendation**: At minimum, add:

```typescript
interface I18nProvider {
  t(key: string, params?: Record<string, unknown>): string;
  locale?: string;  // for date formatting, number formatting
  dir?: 'ltr' | 'rtl';
}
```

Ship a proper English default strings map, not a key-stripping hack.

#### I4: `PersistenceAdapter` Missing Error Handling and Batch Operations

**Location**: Section 8.2, lines 821-842

**Problem**: The adapter has `get`, `set`, `remove` with no error handling strategy. `AsyncStorage` and `localStorage` can both throw (quota exceeded, private browsing, corrupt data). The adapter also has no batch operations — restoring chat state on app launch may require multiple reads.

**Recommendation**:

```typescript
interface PersistenceAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  // Optional batch for performance
  getMultiple?(keys: string[]): Promise<Record<string, string | null>>;
}
```

Document that implementations should catch and handle storage errors gracefully (return null on read failure, log on write failure).

#### I5: Deep Merge for Theme Overrides Has Performance and Correctness Concerns

**Location**: Section 5, lines 366-378

**Problem**: `deepMerge(defaultRNTheme, theme ?? {})` runs on every render if `theme` prop changes reference. The `useMemo` depends on `[theme]`, but `theme` is a `Partial<AIThemeTokens>` object — if the consumer creates this inline, it's a new reference every render, defeating memoization.

Additionally, deep merge of nested objects (`collapsible: Record<string, AICollapsibleTokens>`) can produce unexpected results if the consumer provides a partial nested object — keys they don't mention keep default values, which may not be the intent.

**Recommendation**:
1. Document that `theme` should be stable (defined outside the component or wrapped in `useMemo`)
2. Consider a simpler one-level merge (category-level override, not property-level) for performance
3. Or use `useRef` + shallow comparison of the top-level keys to avoid recomputation

#### I6: Vue `@ai-sdk/vue` Reference Page Returns 404

**Location**: Section 9.3

**Problem**: The AI SDK Vue reference docs at `https://sdk.vercel.ai/docs/reference/ai-sdk-vue/use-chat` returns 404. The AI SDK docs now list Vue under different imports:

```
import { Chat } from '@ai-sdk/vue'
```

This suggests the API may have changed from `useChat` to a `Chat` class. The polling workaround referenced in the design (`structuredClone` every 100ms) needs re-verification against the latest `@ai-sdk/vue` release.

**Impact**: The Vue package design is based on assumptions about `@ai-sdk/vue` that may be stale. The reactivity workaround is a significant DX concern — if it's still needed, it should be prominently documented.

---

### MINOR

#### M1: `formatSessionTitle` Has a `date-fns` Dependency Classified as CORE

**Location**: Section 3.2, line 245 — `formatSessionTitle` is moved to `core/src/utils/format.ts`

**Problem**: The audit (line 18, file #18 `AISessionItem.tsx`) notes `date-fns` as an app-specific dependency. If `formatSessionTitle` uses `date-fns`, it can't be in the core package (which claims zero runtime deps). Either remove the date formatting or add `date-fns` as an optional peer dep.

#### M2: `expo/fetch` Listed as Optional Peer Dep But Is Required for RN Streaming

**Location**: Section 4, dependency graph

**Problem**: The RN package lists `expo/fetch` as optional. But `DefaultChatTransport` needs a `fetch` function for SSE streaming, and React Native's built-in `fetch` doesn't support SSE streaming. Without `expo/fetch`, the chat won't work on RN. This should be a required peer dep, not optional.

#### M3: Naming Inconsistency Between React and Vue Packages

**Location**: Section 3.1, lines 96-227

**Problem**: React components use `AI` prefix (`AIPartRenderer.tsx`, `AITextPart.tsx`). Vue components use `Ai` prefix (`AiPartRenderer.vue`, `AiTextPart.vue`). The `@eleva/ai-chat-vue` is inconsistent: composable files use `useAI*` (camelCase) but component files use `Ai*` (PascalCase with lowercase 'i'). Pick one convention.

#### M4: The Core Package Has an Implicit Dependency on `UIMessage` from `ai`

**Location**: Throughout — `types/parts.ts`, `utils/message-mapper.ts`, `utils/message-validation.ts`

**Problem**: The core package claims "zero runtime dependencies" but imports `UIMessage` from `ai` (the Vercel AI SDK). This is listed as a peer dep, which is correct, but the document says "zero runtime deps" when it means "zero direct deps" — this should be clarified to avoid confusion.

#### M5: Block Registry Props Use `unknown` for Value and onChange

**Location**: Section 7.4, lines 715-720

**Problem**: `BlockRendererProps` uses `value: unknown` and `onChange: (value: unknown) => void`. This provides zero type safety at the consumer level. A `SingleChoiceBlock`'s value is `string`, a `MultiChoiceBlock`'s is `string[]`, a `ToggleBlock`'s is `boolean`. The generic `T extends Block` constrains the block type but not the value type.

**Recommendation**: Add a type map:

```typescript
type BlockValueMap = {
  'single-choice': string;
  'multi-choice': string[];
  'text-input': string;
  'toggle': boolean;
  // ...
};
```

---

### QUESTIONS

#### Q1: Why Four Packages Instead of Two (Core + Platform)?

The design proposes `core`, `react-native`, `react`, and `vue`. But `react-native` and `react` both use `@ai-sdk/react` and React components. The main differences are:
- Scroll management (FlashList vs IntersectionObserver)
- Animation (Reanimated vs CSS)
- Markdown rendering
- Specific RN imports (AppState, Linking, etc.)

Could `react-native` and `react` be a single `@eleva/ai-chat-react` package with platform-conditional imports? React Native for Web exists. The React web package is also deferred and may never be built.

**Counter-argument**: RN has heavy peer deps (reanimated, flash-list, expo/fetch) that web consumers shouldn't install. Separate packages keep dependency trees clean. The four-package split is likely correct.

#### Q2: What Happens When `ComponentRegistry.get()` Returns `undefined` in Production?

The `PartRenderer` shows a `<UnknownPartWarning>` in `__DEV__` and returns `null` in production. Is silently swallowing unknown parts the right behavior? Should there be an `onUnknownPart` callback or error boundary?

#### Q3: How Do Consumers Test Their Chat Integrations?

The design mentions no mock adapters, no test utilities, no `TestChatProvider`. Consumers writing tests will need to mock `ChatConfig`, `SessionsAdapter`, `PersistenceAdapter`, and `I18nProvider`. Should the core package export mock implementations?

---

## 3. Missing Concerns

### 3.1 Versioning Strategy

**Not addressed.** Options:
- **Lockstep** (all packages share a version): Simplest. TanStack does this. Downside: a bug fix in `ai-chat-vue` bumps `ai-chat-core` even if nothing changed.
- **Independent** (each package versions separately): More flexible. Requires careful peer dep ranges. Can lead to diamond dependency issues.
- **Recommendation**: Lockstep for initial releases. Switch to independent only when packages stabilize independently.

### 3.2 Monorepo Tooling

**Not addressed.** The design shows a `packages/` directory but names no tooling. Options:
- **pnpm workspaces**: Already used in the mobile app. Natural fit.
- **Turborepo**: Build orchestration, caching. Good for 4 packages.
- **Changesets**: Version management and changelog generation. Pairs with any workspace tool.
- **Recommendation**: pnpm workspaces + turborepo + changesets. This is the TanStack toolchain.

### 3.3 Publishing Workflow

**Not addressed.** Needs:
- npm scope: `@eleva/` (already decided)
- Registry: public npm? Private GitHub packages? Verdaccio for internal?
- CI/CD: Automated publishing on merge to main? Manual release?
- Pre-release versions: How do consumers test unreleased changes?

### 3.4 Bundle Size

**Not addressed.** The LOC estimates (~800 core, ~2400 RN) are code size, not bundle size. After minification:
- Core (types + utils + Zod schemas): ~5-10KB gzipped (Zod is the heavy part)
- Platform packages: ~15-25KB gzipped (excluding peer deps)
- Total for a consumer: ~20-35KB gzipped

But Zod as a peer dep is ~13KB gzipped on its own. Is Zod in the core package worth it for validation schemas that only the server truly needs? Could the client use simpler runtime validation?

### 3.5 Tree Shaking

**Partially addressed.** The singleton registry with import side effects actively prevents tree shaking (see C1). Beyond that:
- Each `index.ts` barrel export should use named exports, not `export *`
- `sideEffects: false` should be in `package.json`
- Consider sub-path exports: `@eleva/ai-chat-core/types`, `@eleva/ai-chat-core/utils`

### 3.6 Error Boundaries

**Not addressed for components.** What happens when a custom tool renderer throws? The `AIPartRenderer` has no error boundary. A crash in a custom `SearchResultsToolUI` will crash the entire message list.

**Recommendation**: Wrap each part/block renderer in an error boundary with a fallback UI.

### 3.7 SSR/SSG for Web Package

**Not addressed.** The React web package needs to work with Next.js (server components, streaming SSR). Concerns:
- Singleton registries are incompatible with SSR (see C1)
- `useContext` hooks work in client components only — needs `'use client'` directives
- Theme provider needs to handle hydration mismatch

### 3.8 Documentation Strategy

**Not addressed.** How are four packages documented?
- Storybook for each platform package?
- Docusaurus site?
- README-only?
- TypeDoc for API reference?

### 3.9 Accessibility

**Not mentioned anywhere.** The primitives inventory (Section 6) lists props but no accessibility concerns:
- `ChatMessagesList`: needs `role="log"`, `aria-live="polite"` for screen readers
- `InputField`: needs `aria-label`, form association
- `Collapsible`: needs `aria-expanded`, `aria-controls`
- `SessionPanel`: needs focus trap, escape-to-close
- Keyboard navigation through message list, tool results, slide blocks

---

## 4. Design Pattern Recommendations

### 4.1 TanStack Pattern for Multi-Framework Support

TanStack Query's architecture:
1. **`@tanstack/query-core`**: Pure TypeScript class (`QueryClient`, `QueryCache`) with no framework dependency. Uses `Subscribable` pattern (event emitter) for state changes.
2. **`@tanstack/react-query`**: Thin React wrapper — `useQuery` hook subscribes to the core `QueryClient` via `useSyncExternalStore`.
3. **`@tanstack/vue-query`**: Thin Vue wrapper — composable subscribes to the same core `QueryClient` via Vue `ref`/`watch`.

**What this means for `@eleva/ai-chat-core`**: The core package should define not just types, but also stateful classes with event-based change notification. Platform packages then subscribe:

```typescript
// Core: stateful, framework-agnostic
class ChatRegistry extends Subscribable {
  private parts = new Map<string, unknown>();
  register(key: string, component: unknown) {
    this.parts.set(key, component);
    this.notify(); // trigger re-render in framework wrapper
  }
}

// React wrapper
function useChatRegistry() {
  return useSyncExternalStore(
    registry.subscribe,
    registry.getSnapshot
  );
}
```

This eliminates the singleton problem (each `ChatRegistry` is an instance) and works across React, Vue, and Solid.

### 4.2 Radix UI Pattern for Themed Primitives

Radix separates:
1. **Unstyled primitives** (`@radix-ui/react-dialog`): Headless, accessible, composable.
2. **Themed layer** (Radix Themes): Applies design tokens to primitives.

The `@eleva/ai-chat-*` packages bundle primitives AND styling together. Consider whether the "render props / component overrides" escape hatch (Section 5, line 442) is sufficient, or whether unstyled primitives should be a separate export:

```typescript
// Option A (current design): Styled by default, override via theme
import { AIChatInterface } from '@eleva/ai-chat-react-native';

// Option B (Radix pattern): Unstyled primitives + separate theme
import { AIChatInterface } from '@eleva/ai-chat-react-native';
import { defaultTheme } from '@eleva/ai-chat-react-native/theme';
```

For this project's scope, Option A (current design) is pragmatic and correct. Just document that render props are the escape hatch for consumers who want full control.

### 4.3 Headless UI Pattern for Slots

The design correctly maps React render props to Vue named slots (Section 5, lines 442-464). This is the Headless UI pattern. One gap: the props passed to render functions need to be well-defined and stable:

```typescript
// Define what header render props contain
interface ChatHeaderRenderProps {
  status: ChatStatus;
  sessionCount: number;
  onNewSession: () => void;
  onClose: () => void;
  theme: AIHeaderTokens;
}
```

Without explicitly typed render props, consumers writing custom headers have no type safety.

---

## 5. Online Verification Results

### 5.1 AI SDK v5 `useChat` — `sendAutomaticallyWhen`

**Status: CONFIRMED with nuances**

From the official docs (https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat):

```
sendAutomaticallyWhen:
  type: (options: { messages: UIMessage[] }) => boolean | PromiseLike<boolean>
  description: When provided, this function will be called when the stream 
  is finished or a tool call is added to determine if the current messages 
  should be resubmitted.
```

**Nuance**: The docs also provide a helper `lastAssistantMessageIsCompleteWithToolCalls` which simplifies the common case. The design's custom implementation in Research 2G is correct but could use this helper instead.

### 5.2 AI SDK v5 `addToolOutput`

**Status: CONFIRMED**

```
addToolOutput:
  type: (options: { tool: string; toolCallId: string; output: unknown } 
         | { tool: string; toolCallId: string; state: "output-error", errorText: string }) => void
```

`addToolResult` is listed as deprecated with note "Use addToolOutput instead." Both work.

**Important discovery**: The tool part types in v5 use typed names:
- `part.type === 'tool-askForConfirmation'` (not `part.type.startsWith('tool-')`)
- States: `input-streaming`, `input-available`, `output-available`, `output-error`
- This affects the core package's type guards and constants

### 5.3 AI SDK v5 — React Native Compatibility

`addToolOutput` is a method on the `useChat` return object, not a separate React Native API. Since `useChat` from `@ai-sdk/react` works on React Native (confirmed by the existing codebase), `addToolOutput` works on RN. No separate `@ai-sdk/react-native` package exists — it's all `@ai-sdk/react`.

### 5.4 `@ai-sdk/vue` — Polling Workaround

**Status: CANNOT VERIFY — Vue reference docs return 404**

The URL `https://sdk.vercel.ai/docs/reference/ai-sdk-vue/use-chat` returns 404 (Feb 28, 2026). The Vue SDK is imported as `import { Chat } from '@ai-sdk/vue'` (a `Chat` class, not a `useChat` composable), suggesting a different API surface than what the design assumes.

The polling workaround (`structuredClone` every 100ms) referenced in Section 9.3 was from the Chatwoot codebase's `useVercelChat.js`. Whether this is still needed with the latest `@ai-sdk/vue` release is **unverified**. This is a risk for Phase 4 (Vue package).

**Recommendation**: Before starting Phase 4, spike the current `@ai-sdk/vue` behavior to verify:
1. Does `Chat.messages` trigger Vue reactivity during streaming?
2. Is the polling workaround still needed?
3. What's the `Chat` class API vs the old `useChat` composable?

### 5.5 TanStack Multi-Framework Approach

TanStack Query uses a three-tier architecture:
1. **`@tanstack/query-core`**: Framework-agnostic core with `QueryClient`, `QueryCache`, `MutationCache`. Uses a `Subscribable` base class with `subscribe()` / `notify()` pattern.
2. **Framework adapters** (`react-query`, `vue-query`, `solid-query`, `angular-query-experimental`): Thin wrappers (~200-400 LOC each) that subscribe to core state using framework-native primitives.
3. **Devtools** (`react-query-devtools`, `vue-query-devtools`): Framework-specific debug tools.

Key patterns:
- Core is instantiated (not singleton): `new QueryClient()`
- Core uses `useSyncExternalStore` (React) / `ref` + `watch` (Vue) for reactivity
- Framework adapters are ~10% of total code
- All share the same test suite for core logic

**Comparison with the proposed design**: The `@eleva/ai-chat-core` package contains types and pure functions but no stateful core. The "stateful logic" (session management, chat state) lives in the platform hooks. This means:
- Core is lighter (~800 LOC vs TanStack's ~3000 LOC core)
- BUT platform packages duplicate more logic (~2400 RN, ~1800 React, ~1800 Vue — with shared patterns not in core)

The design could benefit from extracting more stateful logic into core (session state machine, message normalization pipeline, error categorization state) to reduce duplication across platform packages.

---

## 6. Specific Recommendations

### 6.1 Immediate Actions (Before Implementation)

| # | Action | Priority | Effort |
|---|--------|----------|--------|
| 1 | **Replace singleton registries with context-scoped instances** (see C1) | CRITICAL | 1 day |
| 2 | **Update tool part type guards to match AI SDK v5 shape** (see C2) | CRITICAL | 0.5 days |
| 3 | **Split `ChatConfig` into `TransportConfig` + `ChatOptions` + `UIConfig`** (see I1) | IMPORTANT | 0.5 days |
| 4 | **Make `SessionsAdapter` optional** (see I2) | IMPORTANT | 0.5 days |
| 5 | **Decide on versioning strategy** (lockstep recommended) | IMPORTANT | Decision only |
| 6 | **Choose monorepo tooling** (pnpm workspaces + turborepo + changesets) | IMPORTANT | Decision only |
| 7 | **Add `locale` to `I18nProvider`; ship real English default strings** | MINOR | 0.5 days |

### 6.2 Design Changes

| # | Change | Rationale |
|---|--------|-----------|
| 1 | Add `AIChatProvider` context that holds registry instances, theme, and config | Replaces singleton registries; enables multi-instance, SSR, testing |
| 2 | Export mock adapters from core: `mockPersistence()`, `mockSessions()`, `mockI18n()` | Enables consumer testing |
| 3 | Add error boundaries around `PartRenderer` and `BlockRenderer` dispatches | Prevents custom renderer crashes from killing the UI |
| 4 | Add sub-path exports to `package.json` (`/types`, `/utils`, `/registry`) | Better tree shaking |
| 5 | Define typed render props interfaces for all customization points | Type safety for consumers using render props / slots |
| 6 | Verify `formatSessionTitle` doesn't bring `date-fns` into core | Core must have zero runtime deps |
| 7 | Consider moving Zod schemas to a separate `@eleva/ai-chat-schemas` or making them optional exports | Zod is ~13KB; not all consumers need client-side schema validation |

### 6.3 Things the Design Gets Right

For balance, the design makes several good decisions:

1. **The 4-package split is correct** (despite Q1). RN peer deps shouldn't pollute web consumers.
2. **Core is pure functions + types.** This is the right foundation. Even if a stateful core layer is added later (a la TanStack), the pure functions remain.
3. **Default theme + overrides** is the right styling strategy for a cross-platform library at this scale. Unstyled primitives are too much burden for consumers.
4. **The file audit is thorough.** Every file is classified with clear rationale. The APP-SPECIFIC classification correctly identifies what stays in the consumer.
5. **"Don't extract too early"** (Section 11, line 1110) is wise. Building slides first and extracting after validation is the right sequence.
6. **The Vue package leverages existing Chatwoot Vue components** rather than translating from RN blindly. This reduces risk significantly.
7. **The dependency graph** (Section 4) correctly ensures no platform package depends on another. This prevents transitive dependency issues.

### 6.4 The `useAIChatMessages` Question

**Finding**: The file `useAIChatMessages.ts` **does not exist** in the codebase. Grep across the entire `chatwoot-mobile-app/src/` directory returns zero matches for any `.ts` or `.tsx` file with that name.

However, `CLAUDE.md` (line 126) still references it:
```
useAIChatMessages.ts - Merges persisted + streaming messages (fingerprint memoization)
```

And earlier research docs (landscape.md, 2a-evaluation.md) reference it as if it exists.

**Conclusion**: The file was either:
1. Planned but never created (the functionality was built directly into `useAIChatSessions.ts` and `aiChatMessageUtils.ts`)
2. Created and then deleted/refactored away

The design (Research 3A, line 44) correctly identifies this: "File does not exist. Message merging logic lives in `useAIChatSessions.ts` and `aiChatMessageUtils.ts`."

**Should it exist in the extracted package?** Yes, as a concept but not necessarily as a separate hook. The message merging logic (combining persisted messages from the backend with streaming messages from the AI SDK) is a core concern for any consumer that supports sessions. It should be a utility function in `core/src/utils/message-merger.ts`:

```typescript
// Pure function, not a hook — can be used in any framework
export function mergePersistedAndStreamingMessages(
  persisted: ChatMessage[],
  streaming: UIMessage[],
  options?: { deduplicateBy?: 'id' | 'fingerprint' }
): UIMessage[]
```

The `CLAUDE.md` should be updated to reflect the actual codebase state.

---

## 7. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Singleton registry causes bugs in multi-instance scenarios | High | High | Redesign to context-scoped (rec. 6.1 #1) |
| Tool part types don't match v5 runtime | Medium | High | Spike early in Phase 1 (rec. 6.1 #2) |
| `@ai-sdk/vue` has breaking changes | Medium | Medium | Spike before Phase 4 (rec. 5.4) |
| ChatConfig becomes unmanageable as features grow | High | Medium | Split now (rec. 6.1 #3) |
| Version drift between packages | Medium | Medium | Use lockstep + changesets |
| Bundle size too large from Zod in core | Low | Medium | Measure after Phase 1 |
| Consumers struggle to test integrations | Medium | Low | Ship mock adapters |
| Extraction breaks existing mobile app | Low | High | Phase 3 has test suite as safety net |

---

## 8. Summary

The package extraction design is **well-researched and directionally correct**. The file audit is thorough, the package boundaries are sensible, and the decision to build on AI SDK (not assistant-ui) is well-justified by Research 2G.

The two critical issues — singleton registries and stale tool part type assumptions — should be addressed before implementation begins. The `ChatConfig` god object and missing operational concerns (versioning, publishing, testing) are important but can be addressed during Phase 1 without blocking the start.

**Overall assessment**: Approve with required changes (C1, C2) before proceeding to implementation.
