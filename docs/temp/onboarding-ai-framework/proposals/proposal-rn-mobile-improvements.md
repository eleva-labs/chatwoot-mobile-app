# Proposal: React Native AI Chat — Improvements & Extraction Preparation

> **Date**: 2026-02-28
> **Scope**: All 34 AI chat source files (~5,287 LOC) in `chatwoot-mobile-app/src/`
> **Prerequisite reading**: Research 3A (package extraction design), Research 2G (AI SDK vs assistant-ui)
> **Purpose**: (1) Identify anti-patterns and gaps in the current code, (2) Recommend changes to prepare for extraction into `@eleva/ai-chat-react-native`

---

## 1. Executive Summary

The existing AI chat implementation is **solid production-quality code**. The architecture follows a clean layered pattern (hooks → components → containers), type safety is high, and the streaming + scroll management are well-engineered. The code is ~5,287 LOC across 34 files with 4 barrel index files.

That said, there are **12 issues** to address before extraction. The most impactful:

1. **`useAIChatSessions` is a God hook** — it owns session state, message bridge logic, Redux dispatch, and lifecycle coordination all in one 225-line function with 7 parameters.
2. **`FlashListRef` is typed as `any`** — the one explicit `any` in the hooks layer, creating a type hole that propagates across the scroll system.
3. **`useAIChatScroll` has defensive retry cascades** — 3 nested try/catch blocks with `setTimeout` retries for scroll-to-end, indicating an underlying race condition rather than robust error handling.
4. **`AIToolPart` has `STATE_CONFIG` with eagerly-evaluated JSX** — icons are created at module load time, defeating tree-shaking and creating stale theme references.
5. **6 Chatwoot-specific coupling points** need interface abstraction for extraction: `AIChatService`, `useAppDispatch`/`useAppSelector`, `i18n.t()`, `useAIStyles()`, `tailwind.color()`, and `useThemedStyles`.

No critical bugs were found. The streaming invariants are not explicitly documented in code comments but are implicitly maintained through careful use of refs and deferred state updates.

---

## 2. File Inventory

| # | File | LOC | Exists? | Category |
|---|------|-----|---------|----------|
| 1 | `hooks/ai-assistant/useAIChat.ts` | 432 | Yes | Hook |
| 2 | `hooks/ai-assistant/useAIChatScroll.ts` | 280 | Yes | Hook |
| 3 | `hooks/ai-assistant/useAIChatSessions.ts` | 225 | Yes | Hook |
| 4 | `hooks/ai-assistant/useAIChatBot.ts` | 66 | Yes | Hook |
| 5 | `hooks/ai-assistant/useAIChatMessages.ts` | — | **No** | N/A |
| 6 | `hooks/ai-assistant/index.ts` | 14 | Yes | Barrel |
| 7 | `parts/ai-assistant/AIPartRenderer.tsx` | 116 | Yes | Component |
| 8 | `parts/ai-assistant/AITextPart.tsx` | 260 | Yes | Component |
| 9 | `parts/ai-assistant/AIToolPart.tsx` | 287 | Yes | Component |
| 10 | `parts/ai-assistant/AIReasoningPart.tsx` | 178 | Yes | Component |
| 11 | `parts/ai-assistant/AICollapsible.tsx` | 178 | Yes | Component |
| 12 | `components/ai-assistant/AIChatMessagesList.tsx` | 204 | Yes | Component |
| 13 | `components/ai-assistant/AIMessageBubble.tsx` | 208 | Yes | Component |
| 14 | `components/ai-assistant/AIChatHeader.tsx` | 126 | Yes | Component |
| 15 | `components/ai-assistant/AIInputField.tsx` | 103 | Yes | Component |
| 16 | `components/ai-assistant/AIChatError.tsx` | 142 | Yes | Component |
| 17 | `components/ai-assistant/AIChatEmptyState.tsx` | 78 | Yes | Component |
| 18 | `components/ai-assistant/AIChatSessionPanel.tsx` | 85 | Yes | Component |
| 19 | `components/ai-assistant/AISessionItem.tsx` | 80 | Yes | Component |
| 20 | `components/ai-assistant/AISessionList.tsx` | 57 | Yes | Component |
| 21 | `containers/ai-assistant/AIChatInterface.tsx` | 276 | Yes | Container |
| 22 | `containers/ai-assistant/FloatingAIAssistant.tsx` | 150 | Yes | Container |
| 23 | `containers/ai-assistant/types.ts` | 45 | Yes | Types |
| 24 | `styles/ai-assistant/tokens.ts` | 361 | Yes | Style |
| 25 | `styles/ai-assistant/useAIStyles.ts` | 162 | Yes | Style |
| 26 | `styles/ai-assistant/index.ts` | 46 | Yes | Barrel |
| 27 | `store/ai-chat/aiChatService.ts` | 114 | Yes | Store |
| 28 | `store/ai-chat/aiChatSchemas.ts` | 79 | Yes | Store |
| 29 | `store/ai-chat/aiChatActions.ts` | 78 | Yes | Store |
| 30 | `store/ai-chat/aiChatSlice.ts` | 139 | Yes | Store |
| 31 | `store/ai-chat/aiChatSelectors.ts` | 108 | Yes | Store |
| 32 | `store/ai-chat/aiChatMapper.ts` | 129 | Yes | Store |
| 33 | `store/ai-chat/aiChatTypes.ts` | 64 | Yes | Store |
| 34 | `store/ai-chat/index.ts` | 36 | Yes | Barrel |
| 35 | `types/ai-chat/parts.ts` | 286 | Yes | Types |
| 36 | `types/ai-chat/constants.ts` | 88 | Yes | Types |
| 37 | `utils/ai-assistant/aiChatMessageUtils.ts` | 78 | Yes | Utils |
| 38 | `utils/ai-assistant/aiChatScrollUtils.ts` | 25 | Yes | Utils |
| 39 | `utils/ai-assistant/index.ts` | 17 | Yes | Barrel |
| | **Total** | **5,287** | **34 source + 4 barrel = 38 files** | |

---

## 3. Architecture Overview

### 3.1 Dependency Graph

```
                    ┌───────────────────────┐
                    │ FloatingAIAssistant   │  Entry point
                    │ (150 LOC)             │
                    └──────────┬────────────┘
                               │
                    ┌──────────▼────────────┐
                    │   AIChatInterface     │  Container (orchestrator)
                    │   (276 LOC)           │
                    └──┬──┬──┬──┬──┬───────┘
                       │  │  │  │  │
          ┌────────────┘  │  │  │  └──────────────────┐
          │               │  │  │                     │
   ┌──────▼──────┐  ┌────▼──▼──▼─────┐       ┌──────▼──────────┐
   │  useAIChat  │  │useAIChatSessions│       │ useAIChatBot    │
   │  (432 LOC)  │  │(225 LOC)       │       │ (66 LOC)        │
   │  ┌──────┐   │  │  ┌──────────┐  │       │  ┌────────────┐ │
   │  │SDK   │   │  │  │Redux     │  │       │  │AIChatService│ │
   │  │useChat│  │  │  │dispatch  │  │       │  │.fetchBots() │ │
   │  └──────┘   │  │  │selectors │  │       │  └────────────┘ │
   └──────┬──────┘  │  └──────────┘  │       └────────────────┘
          │         └──────┬─────────┘
          │                │
   ┌──────▼──────┐  ┌─────▼───────────┐
   │AIChatService│  │ aiChatActions   │
   │.getStream   │  │ (Redux thunks)  │
   │.getAuth     │  │ + selectors     │
   └──────┬──────┘  └─────┬───────────┘
          │               │
          ▼               ▼
     Redux State    AIChatService (API calls)
```

### 3.2 Data Flow

1. **User sends message** → `AIChatInterface.handleSend()` → `useAIChat.sendMessage()` → AI SDK `chat.sendMessage()` → `DefaultChatTransport` → SSE stream
2. **Streaming response** → SDK updates `chat.messages` → React re-render → `AIChatMessagesList` → `AIMessageBubble` → `AIPartRenderer` → specific part components
3. **Session ID extracted** → `fetch` callback captures `X-Chat-Session-Id` header → stored in ref during streaming → flushed to state `onFinish` → persisted to AsyncStorage + dispatched to Redux
4. **Session switch** → `useAIChatSessions.handleSelectSession()` → stops stream → clears SDK messages → dispatches `setActiveSession` → triggers `fetchMessages` → bridge effect loads backend messages into SDK via `setMessages()`

### 3.3 The Five Streaming Invariants

These are the implicit rules the code enforces during streaming. They are NOT documented as explicit invariants:

1. **No state updates during streaming** — Session ID is captured in `sessionIdRef` during the fetch callback and only flushed to `sessionId` state in `onFinish`. This prevents re-renders that could disrupt the streaming connection.
2. **Ref-based callback stability** — `handleError` and `handleFinish` have empty dependency arrays because the SDK captures them once at `Chat` construction and never updates. They read current values from `optionsRef`.
3. **Bridge effect guards during streaming** — `useAIChatSessions`'s reactive bridge checks `chatStatus !== 'streaming' && chatStatus !== 'submitted'` before calling `setMessages()`, preventing overwrite of the live stream.
4. **Bridge key deduplication** — `loadedBridgeKeyRef` prevents the bridge effect from re-firing after `setMessages()` triggers an SDK re-render, which would cause an infinite loop.
5. **New conversation flag** — `isNewConversationRef` suppresses auto-select and bridge effects when the user explicitly starts a fresh conversation, preventing the system from immediately reverting to the latest session.

**Assessment**: These invariants are correctly implemented but fragile. They're spread across two hooks (`useAIChat` and `useAIChatSessions`) with no central documentation. A developer modifying the bridge effect or session flow could accidentally violate invariant #3 or #4 without realizing it.

---

## 4. Anti-Patterns and Issues

### CRITICAL (must fix before extraction)

#### C1: `useAIChatSessions` is a God Hook

**File**: `hooks/ai-assistant/useAIChatSessions.ts:32-41`

The hook accepts **7 parameters**, 4 of which are functions from the parent:

```typescript
export function useAIChatSessions(
  selectedBotId: number | undefined,
  accountId?: number,
  agentBotId?: number,
  setMessages?: (messages: UIMessage[] | ((messages: UIMessage[]) => UIMessage[])) => void,
  clearSession?: () => Promise<void>,
  stop?: () => void,
  chatStatus?: 'ready' | 'submitted' | 'streaming' | 'error',
): UseAIChatSessionsReturn
```

This is prop drilling through hook parameters. It mixes:
- Session CRUD (fetch, select, create)
- Message bridge logic (loading backend messages into SDK)
- Lifecycle coordination (stopping streams on session switch)
- Redux state management

**Impact**: Hard to test, hard to reuse, and the function signatures from parent to child create coupling between `useAIChat` and `useAIChatSessions` that makes extraction difficult.

**Recommendation**: Split into two hooks:
1. `useAIChatSessions` — pure session CRUD + selection (no message bridge)
2. `useMessageBridge` — loading backend messages into SDK (owns the bridge key logic)

#### C2: No `addToolOutput` / `sendAutomaticallyWhen` Exposed

**File**: `hooks/ai-assistant/useAIChat.ts`

The hook wraps `useChat` but does not expose `addToolOutput` or accept `sendAutomaticallyWhen` in its options. These are required for the slides feature (per Research 2G).

**Impact**: The slides feature cannot be built without extending this hook. The extraction design document lists these as core `ChatConfig` capabilities.

**Recommendation**: Add to `UseAIChatOptions`:
```typescript
sendAutomaticallyWhen?: (opts: { messages: UIMessage[] }) => boolean;
```
Add to `UseAIChatReturn`:
```typescript
addToolOutput: (opts: { tool: string; toolCallId: string; output: unknown }) => void;
```

### IMPORTANT (should fix before extraction)

#### I1: `FlashListRef` Typed as `any`

**File**: `hooks/ai-assistant/useAIChatScroll.ts:10`

```typescript
export type FlashListRef = any;
```

With `listRef = useRef<any>(null)` at line 32. This type hole propagates to `AIChatMessagesList.tsx` (line 46) via the `listRef` prop.

**Recommendation**: Create a proper interface:
```typescript
export interface FlashListRef {
  scrollToEnd: (opts: { animated: boolean }) => void;
  scrollToIndex: (opts: { index: number; animated: boolean }) => void;
}
```

#### I2: `AIToolPart` Eagerly Evaluates JSX in Module Scope

**File**: `parts/ai-assistant/AIToolPart.tsx:71-106`

`STATE_CONFIG` creates `<Icon>` elements at module load time:

```typescript
const STATE_CONFIG: Record<DisplayState, StateDisplayConfig> = {
  pending: {
    iconElement: (
      <Icon icon={<LoadingIcon stroke={tailwind.color('text-slate-10') ?? '#80838D'} />} size={14} />
    ),
    ...
```

**Problems**:
- `tailwind.color()` is called at module load, before the theme provider is mounted
- Icons are created once and never re-created when theme changes
- Defeats tree-shaking (all icons loaded even if only some states are used)

**Recommendation**: Convert to a factory function or move icon creation inside the component render.

**[UPDATED after cross-platform review]**: The web's `AiToolPart.vue` does NOT have state-based icons/colors at all — it uses a single neutral `slate` accent for all tool states. The mobile's richer tool state display (pending/running/completed/error with different colors) is better UX. However, the eager JSX evaluation is the wrong implementation. When fixing this, model the state config as a data-only map (icon name + color string) and create JSX elements at render time via a factory, similar to how the web uses Lucide icon class strings (`i-lucide-wrench`).

#### I3: `useAIChatScroll` Has Fragile Retry Cascades

**File**: `hooks/ai-assistant/useAIChatScroll.ts:86-120`

Three nested try/catch blocks with `setTimeout` retries for scrolling:

```typescript
try {
  listRef.current.scrollToEnd({ animated: true });
} catch (error) {
  try {
    listRef.current.scrollToIndex({ index: lastIndex, animated: true });
  } catch (scrollEndError) {
    setTimeout(() => {
      try { listRef.current.scrollToEnd({ animated: true }); } catch {}
    }, 300);
  }
}
```

This pattern appears at lines 86-120 (session load scroll) and again at lines 146-166 (streaming scroll). The root cause is likely FlashList not having rendered items yet when scroll is attempted.

**Recommendation**: Use `onContentSizeChange` or `onLayout` callbacks to detect when FlashList is ready, instead of fixed-delay retries.

#### I4: `AITextPart` Has Yoga Layout Workaround That's a Code Smell

**File**: `parts/ai-assistant/AITextPart.tsx:96-106`

```typescript
const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);
const handleInnerLayout = useCallback((e) => {
  const h = e.nativeEvent.layout.height;
  setContentHeight(prev => (prev === undefined || h > prev) ? h : prev);
}, []);
```

This `onLayout` → `setContentHeight` → `minHeight` pattern works around a known bug in `react-native-markdown-display` where Yoga under-reports height. The workaround is well-documented in comments but adds complexity and an extra render cycle.

**Recommendation**: File an issue upstream or consider migrating to `react-native-markdown-renderer` / custom markdown. For now, document this as a known workaround that the package inherits.

#### I5: `categorizeError` Logic Embedded in Component

**File**: `components/ai-assistant/AIChatError.tsx:23-30`

`categorizeError()` and `ERROR_CONFIG` are pure business logic that should live in the core package, but they're embedded in a UI component file.

**Recommendation**: Extract `categorizeError()` and `ERROR_CONFIG` to a utility module (this is already planned in the extraction design as `core/src/utils/error.ts`).

**[UPDATED after cross-platform review]**: The web's `AiChatError.vue` has the SAME problem — error categorization is an inline `computed`. Both platforms should extract to the same shared interface. The mobile's extraction should define the canonical `categorizeError(error: Error): ErrorCategory` signature that the web can also adopt. This is a prime candidate for `@eleva/ai-chat-core`.

#### I6: `formatToolName`, `formatJson`, `formatSessionTitle` Embedded in Components

**Files**:
- `AIToolPart.tsx:116-134` — `formatToolName()`, `formatJson()`
- `AISessionItem.tsx:23-39` — `formatSessionTitle()`

Pure formatting functions that should be in utilities. They have no dependency on React or RN.

**Recommendation**: Extract to `core/src/utils/format.ts` (per extraction design).

**[UPDATED after cross-platform review]**: The web's `AiChatPanel.vue` has equivalent functions (`formatSessionDate`, `formatSessionTime`) that are ALSO inline. The web's `AiToolPart.vue` does NOT have `formatToolName` — it displays `part.toolName` raw. The mobile's `formatToolName` (snake_case/camelCase → Title Case) is better UX and should be adopted by both platforms via the shared core package. Note: `formatSessionTitle` uses `date-fns` — per the extraction review §M1, this means either (a) `date-fns` becomes a peer dep of core, or (b) `formatSessionTitle` stays in platform packages and accepts a `formatDate` callback.

#### I7: `isToolPart` Type Guard Uses Loose `startsWith('tool-')`

**File**: `types/ai-chat/parts.ts:102-104`

```typescript
export function isToolPart(part: MessagePart): part is ToolPart {
  return part.type?.startsWith('tool-') ?? false;
}
```

This catches ALL `tool-*` prefixed types, including potential future types like `tool-custom-ui` that might not conform to the `ToolPart` interface. The optional chaining on `part.type` also suggests `type` could be undefined, which contradicts the `BasePart` interface (`type: string`).

**Recommendation**: This is an acceptable trade-off for forward compatibility with unknown backend formats, but should be documented as intentional. The optional chaining on `type` is defensive but unnecessary given `BasePart` — consider removing `??` fallback.

### MINOR (nice to have)

#### M1: `AIPartRenderer` Re-Exports Everything from `parts.ts`

**File**: `parts/ai-assistant/AIPartRenderer.tsx:99-114`

The component file re-exports 11 functions from the domain layer "for convenience." This violates single responsibility and creates an alternative import path that makes it harder to trace dependencies.

**Recommendation**: Remove re-exports. Consumers should import domain utilities from `@/types/ai-chat/parts` directly.

#### M2: Inconsistent `any` Casts

**Files**:
- `useAIChatScroll.ts:10` — `FlashListRef = any` (see I1)
- `AIChatMessagesList.tsx:23` — `AnimatedFlashListAny: any` (justified — `Animated.createAnimatedComponent` has incomplete generic types)
- `AIToolPart.tsx:203` — `(part as any).output?.tool_name` (accessing undocumented property)

**Recommendation**: The `AnimatedFlashListAny` cast is justified. The `(part as any)` in AIToolPart should use a proper optional type extension instead.

#### M3: `useAIChatBot` Doesn't Cancel on Unmount

**File**: `hooks/ai-assistant/useAIChatBot.ts:25-57`

The `fetchBots()` async call has no abort mechanism. If the component unmounts during the fetch, `setSelectedBot(bot)` will attempt to update state on an unmounted component.

**Recommendation**: Add an `isMounted` ref guard (like `useAIChat` does) or use `AbortController`.

#### M4: `AIChatInterface` Has Inline `AIChatMessagesView`

**File**: `containers/ai-assistant/AIChatInterface.tsx:43-117`

`AIChatMessagesView` is defined as an inline `React.memo` component within the same file as `AIChatInterface`. This is acceptable for co-location but makes the file longer and harder to test independently.

**Recommendation**: Consider extracting to its own file if it grows. Current size (74 lines) is fine.

#### M5: `useAIChat` Error Filtering is Fragile

**File**: `hooks/ai-assistant/useAIChat.ts:299-313`

```typescript
const ignoredErrors = [
  "Cannot read property 'text' of undefined",
  'Cannot read properties of undefined',
];
const shouldIgnore = ignoredErrors.some(msg => error.message?.includes(msg));
```

String matching on error messages is brittle. These errors come from the AI SDK's internal text extraction during streaming, which may change message text between SDK versions.

**Recommendation**: Open an issue against `@ai-sdk/react` to fix the root cause. For now, document why these specific strings are ignored and in which SDK version they occur.

#### M6: `AICollapsible` Uses Text Chevron Characters

**File**: `parts/ai-assistant/AICollapsible.tsx:153-154`

```tsx
<Text style={style('text-sm', colors.chevron)}>▶</Text>
...
<Text style={style('text-xs', colors.chevron)}>▲</Text>
```

Unicode chevrons instead of proper SVG icons. There's a TODO comment acknowledging this.

**Recommendation**: Replace with Lucide `ChevronRight` / `ChevronUp` icons when the icon migration is complete.

#### M7: No Tests for Any AI Chat Code

No test files were found for any of the 34 source files. The pure utility functions (`parts.ts`, `constants.ts`, `aiChatMapper.ts`, `aiChatMessageUtils.ts`, `aiChatScrollUtils.ts`) are especially testable.

**Recommendation**: Add unit tests for all pure functions before extraction. This becomes critical once the code moves to a shared package.

---

## 5. The `useAIChatMessages` Question

### What Happened?

The `CLAUDE.md` documents `useAIChatMessages.ts` as an existing hook that "merges persisted + streaming messages (fingerprint memoization)." However, **this file does not exist**. The Research 3A audit also confirms it as "N/A."

### Where Did the Logic Go?

The message merging logic that `useAIChatMessages` would have contained is split across two locations:

1. **`useAIChatSessions.ts` lines 147-178** — The "reactive bridge" effect that loads backend messages into the SDK via `setMessages()`. This includes:
   - The `loadedBridgeKeyRef` fingerprint mechanism
   - The `isNewConversationRef` guard
   - The `chatStatus` streaming guard

2. **`aiChatMapper.ts`** — The `mapMessagesToUIMessages()` function that converts backend DTOs to SDK format

### Should It Exist?

**Yes.** The bridge logic in `useAIChatSessions` is the most complex and fragile part of the entire system (invariants #3, #4, #5). It deserves its own hook for these reasons:

1. **Separation of concerns** — `useAIChatSessions` should own session CRUD and selection. The bridge is message-level logic.
2. **Testability** — The bridge logic is currently untestable because it's entangled with Redux selectors and session state.
3. **Extraction** — For the package, the bridge needs a `SessionsAdapter` interface instead of Redux. Having it in its own hook makes this substitution cleaner.

### Recommended Shape

```typescript
// useMessageBridge.ts
export function useMessageBridge(options: {
  activeSessionId: string | null;
  isLoadingMessages: boolean;
  backendMessages: BackendMessage[];
  chatStatus: ChatStatus;
  setMessages: (messages: UIMessage[]) => void;
  isNewConversation: boolean;
}): void
```

This hook would own `loadedBridgeKeyRef` and the bridge effect, consuming its inputs as parameters rather than reaching into Redux.

---

## 6. Phase 1 Recommendations: Fix Anti-Patterns First

These changes improve the code independently of extraction. They should be done first.

### P1.1: Split `useAIChatSessions` (Priority: High)

**Current**: 225 LOC doing session management + message bridge + lifecycle coordination.

**Target**:
- `useAIChatSessions` (~120 LOC) — session CRUD, selection, `showSessions` state
- `useMessageBridge` (~80 LOC) — bridge effect, `loadedBridgeKeyRef`, `isNewConversationRef`

**[UPDATED after cross-platform review]**: The new hook split should align with how the web splits concerns. The web has `useAiChatSessionManager` (pure session CRUD + persistence, no reactive bridge) and the bridge logic lives as a simple imperative call in `loadSession()` / `restoreSession()`. The mobile's reactive bridge is more complex because Redux is involved (messages arrive asynchronously via selectors), but the naming and interface should converge. Recommended names: `useAIChatSessions` (matching web's `useAiChatSessionManager`) + `useMessageBridge` (no web equivalent — web doesn't need this because it calls `chat.setMessages()` imperatively in `loadSession()`).

**Why first**: This simplifies the extraction in Phase 2 because `useMessageBridge` can be tested and adapted to `SessionsAdapter` independently.

**Effort**: 0.5 day

### P1.2: Add `addToolOutput` + `sendAutomaticallyWhen` to `useAIChat` (Priority: High)

**Current**: These capabilities exist in the AI SDK but are not exposed.

**Target**: Extend `UseAIChatOptions` and `UseAIChatReturn` as described in C2.

**Why first**: Blocks the slides feature and validates the extraction design's `ChatConfig.sendAutomaticallyWhen` interface.

**Effort**: 0.5 day

### P1.3: Fix `FlashListRef` Type (Priority: Medium)

**Current**: `type FlashListRef = any`

**Target**: Proper interface with `scrollToEnd`, `scrollToIndex` methods.

**Effort**: 0.25 day

### P1.4: Fix `STATE_CONFIG` Eager JSX (Priority: Medium)

**Current**: Module-scope JSX evaluation.

**Target**: Factory function `getStateIcon(state: DisplayState): React.ReactNode` called inside the component.

**Effort**: 0.25 day

### P1.5: Extract Pure Functions from Components (Priority: Medium)

**Current**: `categorizeError`, `formatToolName`, `formatJson`, `formatSessionTitle` live in component files.

**Target**: Move to `utils/ai-assistant/` (or directly to where `@eleva/ai-chat-core` will import from).

**Effort**: 0.5 day

### P1.6: Fix `useAIChatScroll` Retry Cascades (Priority: Low)

**Current**: 3-level try/catch with `setTimeout`.

**Target**: Single scroll attempt with `onContentSizeChange` guard, or simplify to `scrollToEnd` with silent catch.

**Effort**: 0.5 day

### P1.7: Add Unit Tests for Pure Functions (Priority: Medium)

**Current**: Zero tests.

**Target**: Tests for `parts.ts` type guards, `aiChatMapper.ts`, `aiChatMessageUtils.ts`, `aiChatScrollUtils.ts`, `categorizeError`, `formatToolName`, `formatSessionTitle`.

**Effort**: 1.5 days

### P1.8: Document Streaming Invariants (Priority: Medium)

**Current**: Invariants are implicit across two files.

**Target**: Add a block comment in `useAIChat.ts` and `useAIChatSessions.ts` (or the new `useMessageBridge.ts`) explicitly listing the 5 invariants.

**Effort**: 0.25 day

**Phase 1 Total: ~4.75 days**

---

## 7. Phase 2 Recommendations: Prepare for Extraction

These changes decouple the code from Chatwoot-specific infrastructure. They should be done after Phase 1 and after the slides feature is working.

### P2.1: Replace `AIChatService` with `ChatConfig` Interface

**Files affected**: `useAIChat.ts`, `useAIChatBot.ts`

**Current coupling**:
```typescript
const apiEndpoint = AIChatService.getStreamEndpoint();
// ...
headers: () => ({ ...AIChatService.getAuthHeaders(), ... }),
```

**Target**: Accept a `ChatConfig` object:
```typescript
export function useAIChat(config: ChatConfig, options?: UseAIChatOptions)
```

Where `ChatConfig.streamEndpoint`, `ChatConfig.getHeaders()`, `ChatConfig.prepareRequest()` replace the static calls. The Chatwoot app creates a `chatwootChatConfig` object that wraps `AIChatService`.

**[UPDATED after cross-platform review]**: Per the package extraction review (proposal-package-extraction-review.md §I1), `ChatConfig` should NOT be a flat god object. Split into `TransportConfig` (streamEndpoint, getHeaders, prepareRequest, parseError, fetch), `ChatBehaviorConfig` (streamThrottle, sendAutomaticallyWhen), and `ChatUIConfig` (user, bot). The web's `useVercelChat` already accepts a flat options bag — both platforms should converge toward the split `ChatConfig` from the extraction review. The mobile refactoring is an opportunity to establish this split early.

**Effort**: 1 day (unchanged — split is cleaner to implement than a flat object)

### P2.2: Replace Redux with `SessionsAdapter` Interface

**Files affected**: `useAIChatSessions.ts` (or the split hooks), `AIChatInterface.tsx`

**Current coupling**:
```typescript
const dispatch = useAppDispatch();
const activeSessionId = useAppSelector(selectActiveSessionId);
const sessions = useAppSelector(state => selectSessionsByAgentBot(state, selectedBotId));
dispatch(aiChatActions.fetchSessions({ agentBotId }));
```

**Target**: Accept a `SessionsAdapter` parameter:
```typescript
export function useAIChatSessions(adapter: SessionsAdapter, ...)
```

Where `SessionsAdapter` exposes `fetchSessions()`, `getActiveSessionId()`, `setActiveSessionId()`, etc. The Chatwoot app creates a `chatwootSessionsAdapter` that wraps the Redux store.

**Effort**: 1.5 days

### P2.3: Replace `i18n.t()` with `I18nProvider`

**Files affected**: 13 component/part files use `i18n.t()` directly.

**Current coupling**:
```typescript
import i18n from '@/i18n';
// ...
<Text>{i18n.t('AI_ASSISTANT.CHAT.TOOLS.PENDING')}</Text>
```

**Target**: Accept an `I18nProvider` via React Context:
```typescript
const { t } = useAIi18n(); // reads from context, falls back to English defaults
```

The package ships with default English strings keyed by the same paths. Consumers override via `<AII18nProvider i18n={chatwootI18n}>`.

**Effort**: 1 day

### P2.4: Replace `useAIStyles()` / `tailwind.color()` with Theme Provider

**Files affected**: All 13 component/part files use `useAIStyles()`, 6 use `tailwind.color()` directly.

**Current coupling**:
```typescript
import { useAIStyles } from '@/presentation/styles/ai-assistant';
import { tailwind } from '@/theme/tailwind';
// ...
const { style, tokens } = useAIStyles();
const cursorColor = tailwind.color('text-slate-9') ?? 'rgb(139, 141, 152)';
```

**Target**: `useAITheme()` reads from an `AIThemeProvider` context:
```typescript
const theme = useAITheme();
// theme.message.userBackground → Tailwind class string
// theme.getColor('slate-9') → resolved color value
```

The current `tokens.ts` file already defines the correct token structure — it just needs to be consumed via context instead of direct import, and `tailwind.color()` calls need a `getColor()` abstraction.

**Effort**: 2 days

### P2.5: Add Component/Part Registry

**Files affected**: `AIPartRenderer.tsx`

**Current**: Hardcoded switch on type guards:
```typescript
if (isTextPart(part)) return <AITextPart ... />;
if (isReasoningPart(part)) return <AIReasoningPart ... />;
if (isToolPart(part)) return <AIToolPart ... />;
```

**Target**: Registry-based dispatch (per Research 3A §7):
```typescript
const RegisteredPart = partRegistry.get(part.type);
if (RegisteredPart) return <RegisteredPart ... />;
if (isToolPart(part)) {
  const RegisteredTool = toolRegistry.get(part.toolName);
  if (RegisteredTool) return <RegisteredTool ... />;
  return <AIToolPart ... />; // default
}
```

This enables consumers to register custom part renderers and tool-specific UIs without forking the package.

**[UPDATED after cross-platform review]**: Per the package extraction review (proposal-package-extraction-review.md §C1), the registry MUST NOT be a module-level singleton. Use context-scoped registries (TanStack pattern) where the registry is passed via `<AIChatProvider registry={...}>`. The web's current `AiPartRenderer.vue` uses a hardcoded `partTypeMap` object — both platforms should adopt context-scoped registries simultaneously to stay aligned. Also add error boundary wrapping around each part render to prevent custom renderer crashes from killing the message list.

**Effort**: 1.5 days (increased from 1 day due to context-scoped design + error boundaries)

### P2.6: Generalize `FloatingAIAssistant` Away from Chatwoot Layout

**Files affected**: `FloatingAIAssistant.tsx`

**Current coupling**:
```typescript
import { TAB_BAR_HEIGHT } from '@/constants';
import { useScaleAnimation } from '@/utils';
import { AIAssisst } from '@/svg-icons';
```

**Target**: Accept `bottomInset`, `fabIcon`, and `scaleAnimation` as props or config. The Chatwoot app passes its specific values.

**Effort**: 0.5 day

### P2.7: Generalize `AIMessageBubble` Away from Chatwoot Components

**Files affected**: `AIMessageBubble.tsx`

**Current coupling**:
```typescript
import { Avatar } from '@/components-next/common/avatar/Avatar';
import { useHaptic } from '@/utils';
import Clipboard from '@react-native-clipboard/clipboard';
```

**Target**: Accept `renderAvatar`, `onCopy`, `onHaptic` as optional props. Defaults to built-in avatar and clipboard. The Chatwoot app passes its custom `Avatar` component.

**Effort**: 0.5 day

**Phase 2 Total: ~8.5 days**

---

## 8. File-by-File Recommendation Table

| # | File | LOC | Current Issues | Fix First (Phase 1) | Then for Extraction (Phase 2) |
|---|------|-----|----------------|---------------------|-------------------------------|
| 1 | `useAIChat.ts` | 432 | Error filtering by string match (M5); no `addToolOutput`/`sendAutomaticallyWhen` (C2); stale-closure pattern well-handled but not documented | P1.2: Add `addToolOutput` + `sendAutomaticallyWhen`; P1.8: Document streaming invariants | P2.1: Replace `AIChatService` calls with `ChatConfig` interface; replace `AsyncStorage` with `PersistenceAdapter`; replace `AppState` with optional RN-specific behavior |
| 2 | `useAIChatScroll.ts` | 280 | `FlashListRef = any` (I1); retry cascades (I3); 8+ refs — complex but well-structured | P1.3: Fix `FlashListRef` type; P1.6: Simplify retry cascades | Minor: stays RN-specific. Replace `FlashListRef` with package-defined interface. Stays in `@eleva/ai-chat-react-native` |
| 3 | `useAIChatSessions.ts` | 225 | God hook (C1) — 7 params, mixes session CRUD + message bridge + lifecycle | P1.1: Split into `useAIChatSessions` + `useMessageBridge` | P2.2: Replace `useAppDispatch`/`useAppSelector` with `SessionsAdapter` interface |
| 4 | `useAIChatBot.ts` | 66 | No unmount guard (M3); directly calls `AIChatService.fetchBots()` | P1: Add `isMounted` guard | P2.1: Replace `AIChatService.fetchBots()` with `ChatConfig.fetchBots()` or separate `BotAdapter` |
| 5 | `useAIChatMessages.ts` | N/A | File doesn't exist; logic split across `useAIChatSessions` and `aiChatMapper` | P1.1: Create `useMessageBridge` to house bridge logic | P2.2: Bridge hook accepts `SessionsAdapter` instead of Redux |
| 6 | `AIPartRenderer.tsx` | 116 | Re-exports 11 functions from domain (M1); hardcoded switch (works but not extensible) | P1: Remove convenience re-exports | P2.5: Add registry-based dispatch for custom parts/tools |
| 7 | `AITextPart.tsx` | 260 | Yoga height workaround (I4); direct `tailwind.color()` calls; `useTheme()` for `themeVersion` | None critical — workaround is well-documented | P2.4: Replace `tailwind.color()` with `theme.getColor()`; replace `useTheme()` with `useAITheme()` |
| 8 | `AIToolPart.tsx` | 287 | `STATE_CONFIG` eager JSX (I2); `(part as any)` cast (M2); `formatToolName`/`formatJson` embedded (I6); direct `i18n.t()` | P1.4: Fix eager JSX; P1.5: Extract format functions | P2.3: Replace `i18n.t()` with `useAIi18n()`; P2.4: Replace style coupling |
| 9 | `AIReasoningPart.tsx` | 178 | Direct `tailwind.color()` calls; direct `i18n.t()`; duplicate markdown config (same as AITextPart) | None critical | P2.3: Replace `i18n.t()`; P2.4: Replace `tailwind.color()`; consider shared markdown config |
| 10 | `AICollapsible.tsx` | 178 | Unicode chevron characters (M6); direct `i18n.t()` | None critical (M6 is tracked TODO) | P2.3: Replace `i18n.t()`; P2.4: Theme via context |
| 11 | `AIChatMessagesList.tsx` | 204 | `AnimatedFlashListAny: any` cast (justified); proper `React.memo` and `ItemSeparator` memo | None | P2.3: Replace `i18n.t()`; stays RN-specific (FlashList) |
| 12 | `AIMessageBubble.tsx` | 208 | Direct `Clipboard` import; `useHaptic`; `Avatar` from Chatwoot components; copy-to-clipboard timer (no cleanup on unmount) | P1: Add timer cleanup in copy `setTimeout` | P2.7: Accept `renderAvatar`, `onCopy`, `onHaptic` as props |
| 13 | `AIChatHeader.tsx` | 126 | `AIChatBot` type from store (coupling); direct `i18n.t()`, `tailwind.color()` | None | P2.3: Replace `i18n.t()`; P2.4: Theme via context; generalize `AIChatBot` → `BotInfo` interface |
| 14 | `AIInputField.tsx` | 103 | Direct `i18n.t()`, `tailwind.color()` | None — clean component | P2.3: Replace `i18n.t()`; P2.4: Theme via context |
| 15 | `AIChatError.tsx` | 142 | `categorizeError` embedded (I5); direct `i18n.t()`, `tailwind.color()` | P1.5: Extract `categorizeError` + `ERROR_CONFIG` | P2.3: Replace `i18n.t()`; P2.4: Theme via context |
| 16 | `AIChatEmptyState.tsx` | 78 | Suggested prompts are i18n keys, not configurable | None | P2.3: Replace `i18n.t()`; accept `suggestedPrompts` as prop |
| 17 | `AIChatSessionPanel.tsx` | 85 | `AIChatSession` type from store; `@gorhom/bottom-sheet` coupling | None — well-structured | P2.2: Use generic `ChatSession` type; bottom-sheet stays RN-specific |
| 18 | `AISessionItem.tsx` | 80 | `formatSessionTitle` embedded (I6); `date-fns` imported locally | P1.5: Extract `formatSessionTitle` | P2.3: Replace `i18n.t()`; `date-fns` stays as peer dep |
| 19 | `AISessionList.tsx` | 57 | None — clean, simple component | None | P2.3: Replace `i18n.t()` |
| 20 | `AIChatInterface.tsx` | 276 | Inline `AIChatMessagesView` (M4); `selectUser` from auth store; `validateAndNormalizeMessages` at container level | None critical | P2.1: Accept `ChatConfig` + user info instead of reading Redux; P2.2: Accept `SessionsAdapter`; this becomes the main entry point for `@eleva/ai-chat-react-native` |
| 21 | `FloatingAIAssistant.tsx` | 150 | `TAB_BAR_HEIGHT` constant; `useScaleAnimation`; `AIAssisst` SVG (typo in name) | None | P2.6: Generalize layout props; accept `fabIcon` as prop |
| 22 | `types.ts` (containers) | 45 | `ToolPart` from domain types — clean | None | Moves to core package as `ChatComponentProps` |
| 23 | `tokens.ts` | 361 | Token VALUES are Tailwind class strings (works for RN+twrnc but not portable as-is) | None — good structure | P2.4: Token TYPE DEFS → core package; token VALUES stay in RN package as `default-rn-theme.ts` |
| 24 | `useAIStyles.ts` | 162 | `useThemedStyles` from Chatwoot hooks; tokens are module-scope constants (not from context) | None | P2.4: Replace with `useAITheme()` context-based hook; merge `useThemedStyles` into the package |
| 25 | `aiChatService.ts` | 114 | `getStore().getState()` — reads Redux directly (non-reactive); `apiService` coupling | None | P2.1: This file stays in Chatwoot app, NOT extracted. It becomes the `ChatConfig` implementation |
| 26 | `aiChatSchemas.ts` | 79 | None — pure Zod, clean | None | Moves to `@eleva/ai-chat-core` as `types/schemas.ts` |
| 27 | `aiChatActions.ts` | 78 | None — clean Redux thunks | None | Stays in Chatwoot app (Redux-specific). Wrapped by `chatwootSessionsAdapter` |
| 28 | `aiChatSlice.ts` | 139 | None — standard Redux slice | None | Stays in Chatwoot app |
| 29 | `aiChatSelectors.ts` | 108 | None — proper memoized selectors with stable empty arrays | None | Stays in Chatwoot app |
| 30 | `aiChatMapper.ts` | 129 | `as UIMessage['parts'][number]` casts (lines 104, 116) — SDK types are complex | None — casts are justified | Moves to `@eleva/ai-chat-core` as `utils/message-mapper.ts` |
| 31 | `aiChatTypes.ts` | 64 | `AIChatState` interface is Redux-shaped | None | Redux-specific types stay in Chatwoot app; generic `ChatSession`/`ChatMessage` types go to core |
| 32 | `parts.ts` | 286 | `isToolPart` uses loose `startsWith` (I7); `as MessagePart` casts when calling type guards | P1.7: Add unit tests | Moves to `@eleva/ai-chat-core` as `types/parts.ts` + `utils/part-helpers.ts` |
| 33 | `constants.ts` | 88 | None — clean `as const` objects | None | Moves to `@eleva/ai-chat-core` as `types/constants.ts` |
| 34 | `aiChatMessageUtils.ts` | 78 | None — clean validation functions | P1.7: Add unit tests | Moves to `@eleva/ai-chat-core` as `utils/message-validation.ts` |
| 35 | `aiChatScrollUtils.ts` | 25 | None — simple, clean | None | Stays in `@eleva/ai-chat-react-native` (NativeScrollEvent is RN-specific) |

---

## 9. Effort Estimate

### Phase 1: Fix Anti-Patterns (before slides feature)

| Task | Effort | Priority |
|------|--------|----------|
| P1.1: Split `useAIChatSessions` → `useAIChatSessions` + `useMessageBridge` + orchestrator hook | 0.75 day | High |
| P1.2: Add `addToolOutput` + `sendAutomaticallyWhen` to `useAIChat` | 0.5 day | High |
| P1.3: Fix `FlashListRef` type | 0.25 day | Medium |
| P1.4: Fix `STATE_CONFIG` eager JSX in `AIToolPart` | 0.25 day | Medium |
| P1.5: Extract pure functions (`categorizeError`, `formatToolName`, etc.) | 0.5 day | Medium |
| P1.6: Simplify `useAIChatScroll` retry cascades (adopt RAF/intent pattern from web) | 1 day | Low |
| P1.7: Add unit tests for pure functions | 1.5 days | Medium |
| P1.8: Document streaming invariants | 0.25 day | Medium |
| **Phase 1 Total** | **4.75 days** | |

### Phase 2: Prepare for Extraction (after slides feature works)

| Task | Effort | Priority |
|------|--------|----------|
| P2.1: Replace `AIChatService` with `ChatConfig` interface | 1 day | High |
| P2.2: Replace Redux with `SessionsAdapter` interface | 1.5 days | High |
| P2.3: Replace `i18n.t()` with `I18nProvider` (13 files) | 1 day | High |
| P2.4: Replace `useAIStyles()`/`tailwind.color()` with theme provider (13 files) | 2 days | High |
| P2.5: Add part/tool component registry (context-scoped + error boundaries) | 1.5 days | Medium |
| P2.6: Generalize `FloatingAIAssistant` layout props | 0.5 day | Low |
| P2.7: Generalize `AIMessageBubble` dependencies | 0.5 day | Low |
| P2.8: Add `AIChatProvider` context (chat state + theme + registry + i18n) | 0.5 day | Medium |
| **Phase 2 Total** | **8.5 days** | |

### Combined Total: ~13.25 days

This does NOT include the actual package extraction (moving files to `packages/`, setting up the monorepo, writing package.json, etc.) — that's covered in Research 3A's Phase 1-3 estimate of 10-15 days. These 13.25 days are the preparatory work that makes the extraction possible and safe.

### Recommended Sequencing

1. **Now** (before slides): P1.1, P1.2, P1.8 (2.25 days) — unblocks slides and documents invariants [UPDATED: P1.1 increased to 0.75 day per cross-platform review R2]
2. **During slides development**: P1.3, P1.4, P1.5, P1.6, P1.7 (3.5 days) — clean as you go [UPDATED: P1.6 increased to 1 day per cross-platform review R4]
3. **After slides ship**: P2.1 through P2.8 (8.5 days) — full extraction prep [UPDATED: P2.5 at 1.5 days, new P2.8 at 0.5 day per cross-platform review R1]
4. **Coordinate with web**: Ensure web TypeScript migration starts before or during step 3
5. **Then**: Research 3A Phase 1-3 (10-15 days) — actual package extraction

---

## Appendix A: Coupling Inventory

Summary of all Chatwoot-specific imports across AI chat files:

| Import | Used In | Replacement |
|--------|---------|-------------|
| `AIChatService` | useAIChat, useAIChatBot | `ChatConfig` interface |
| `useAppDispatch` / `useAppSelector` | useAIChatSessions, AIChatInterface | `SessionsAdapter` interface |
| `aiChatActions` | useAIChatSessions | `SessionsAdapter` interface |
| `selectSessionsByAgentBot` + 5 selectors | useAIChatSessions, AIChatInterface | `SessionsAdapter` interface |
| `setActiveSession` | useAIChatSessions, AIChatInterface | `SessionsAdapter.setActiveSessionId()` |
| `selectUser` | AIChatInterface | `ChatConfig.user` |
| `selectIsLoadingSessions` | AIChatInterface | `SessionsAdapter.getIsLoadingSessions()` |
| `i18n.t()` | 13 component/part files | `I18nProvider` via context |
| `useAIStyles()` | 13 component/part files | `useAITheme()` via context |
| `tailwind.color()` | AITextPart, AIToolPart, AIReasoningPart, AIChatHeader, AIInputField, AIChatEmptyState | `theme.getColor()` via theme provider |
| `useThemedStyles` | useAIStyles | Absorbed into package's `useAITheme()` |
| `useTheme` (ThemeContext) | AITextPart, AIReasoningPart | `useAITheme()` (theme version tracking) |
| `Avatar` | AIMessageBubble | `renderAvatar` prop |
| `Clipboard` | AIMessageBubble | `onCopy` prop |
| `useHaptic` | AIMessageBubble, FloatingAIAssistant | `onHaptic` optional prop |
| `useScaleAnimation` | FloatingAIAssistant | Optional config prop |
| `TAB_BAR_HEIGHT` | FloatingAIAssistant | `config.layout.bottomInset` |
| `apiService` | aiChatService | Stays in Chatwoot app |
| `getStore()` | aiChatService | Stays in Chatwoot app |
| `@gorhom/bottom-sheet` | AIChatSessionPanel | Stays in RN package (peer dep) |
| `AsyncStorage` | useAIChat | `PersistenceAdapter` interface |
| `AppState` | useAIChat | Stays in RN package (platform-specific) |
| `expo/fetch` | useAIChat | `ChatConfig.fetch` or stays in RN package |

**Total unique Chatwoot-specific coupling points: 22**
**Of which stay in Chatwoot app after extraction: 4** (apiService, getStore, Redux store files, auth selectors)
**Of which need interface abstraction: 18**

## Appendix B: What's Already Good

For balance, here are the patterns that are well-done and should be preserved:

1. **Token-based design system** — `tokens.ts` has clean type definitions and semantic naming. The extraction just needs to wrap them in a context.
2. **Memoized selectors with stable empty arrays** — `aiChatSelectors.ts` uses `const EMPTY_SESSIONS: AIChatSession[] = []` to prevent re-render cascades. Same pattern in `useAIChatSessions`.
3. **Part splitting in `AIMessageBubble`** — Reasoning and tools outside the bubble, text inside. Matches Vue pattern exactly.
4. **Type guards in `parts.ts`** — The `isTextPart`/`isToolPart`/`isReasoningPart` system is well-designed with `startsWith('tool-')` for forward compatibility.
5. **Stale closure handling in `useAIChat`** — The ref-based pattern for `handleError`/`handleFinish` correctly handles the SDK's one-time callback capture.
6. **Message validation pipeline** — `validateAndNormalizeMessages` provides defensive normalization before FlashList rendering.
7. **`React.memo` usage** — Properly applied to `AIChatMessagesList`, `AIChatHeader`, `AISessionItem`, `AISessionList`, `AIChatSessionPanel`, `AIChatInterface`, `FloatingAIAssistant`.
8. **Accessibility** — Consistent `accessibilityRole`, `accessibilityLabel`, `accessibilityState` throughout components.
9. **Zod schemas** — Clean, framework-agnostic, with inferred types eliminating manual type duplication.
10. **Clean Architecture adherence** — `types/ai-chat/` has zero framework deps, `store/ai-chat/` depends only on Redux + domain types, `presentation/` depends on both but keeps logic in hooks.

---

## Cross-Platform Alignment Review

> **Date**: 2026-02-28
> **Scope**: Comparison of mobile (React Native) vs web (Vue 3) AI chat implementations and alignment toward `@eleva/ai-chat-core` shared package
> **Source files reviewed**: All composables, components, parts, and containers in both `chatwoot-mobile-app/src/presentation/` and `chatwoot/app/javascript/dashboard/components-next/ai-assistant/`

### 1. Component / Hook Mapping Table

| Concern | Mobile (React Native) | Web (Vue 3) | Aligned? | Notes |
|---------|----------------------|-------------|----------|-------|
| **Chat transport wrapper** | `useAIChat.ts` (432 LOC) | `useVercelChat.js` (243 LOC) | Partial | Both wrap AI SDK transport. Mobile uses `useChat` hook + `expoFetch`; web creates `Chat` class + polling workaround. Mobile has session persistence in-hook; web delegates to session manager. |
| **Orchestrator** | `AIChatInterface.tsx` (276 LOC, container) | `useAiAssistant.js` (177 LOC, composable) + `AiAssistant.vue` (141 LOC) | Different pattern | Mobile puts orchestration in a container component. Web splits it: composable owns logic, `AiAssistant.vue` handles layout. Web pattern is cleaner for extraction — orchestration as a composable/hook is reusable without UI coupling. |
| **Session management** | `useAIChatSessions.ts` (225 LOC) | `useAiChatSessionManager.js` (295 LOC) | Structurally similar | Both manage session CRUD, selection, and persistence. Key difference: mobile uses Redux + reactive bridge effect; web uses raw `fetch()` + imperative `loadSession()`. Mobile's bridge is more complex but handles async state more robustly. |
| **Message bridge** | Embedded in `useAIChatSessions.ts` (lines 147-178) | Imperative in `useAiChatSessionManager.js:loadSession()` | **Divergent** | Mobile has a reactive bridge that watches Redux selectors and auto-loads messages when they arrive. Web does an imperative fetch+transform+setMessages in one call. The mobile approach handles edge cases (streaming guard, dedup) better but is harder to reason about. |
| **Message mapper** | `aiChatMapper.ts` (129 LOC, store layer) | `useAiMessageMapper.js` (104 LOC, composable) | Similar | Both convert backend DTOs to UIMessage format. Mobile also handles part mapping at the field level. Web wraps in a composable unnecessarily (it's used as a plain function). |
| **Bot selection** | `useAIChatBot.ts` (66 LOC) | Embedded in `useAiAssistant.js` (lines 107-132) | Divergent | Mobile has a dedicated hook. Web inlines it in the orchestrator. The mobile pattern is better for extraction — bot fetching should be a standalone concern. |
| **Scroll management** | `useAIChatScroll.ts` (280 LOC) | `useAutoScroll.js` (195 LOC) | Similar concept, different impl | Mobile uses FlashList refs + retry cascades. Web uses RAF-based scroll + `@vueuse/core`. Web approach (RAF loop during streaming, user-intent detection) is more sophisticated and doesn't need retry cascades. |
| **Part renderer** | `AIPartRenderer.tsx` (116 LOC) | `AiPartRenderer.vue` (42 LOC) | **Aligned** | Both dispatch based on part type. Mobile uses imported type guards; web uses inline `startsWith('tool-')`. Same structure, props (`part`, `role`, `isStreaming`). |
| **Text part** | `AITextPart.tsx` (260 LOC) | `AiTextPart.vue` (35 LOC) | Divergent size | Mobile has Yoga workaround, streaming cursor animation (Reanimated), markdown config. Web is lean — `MessageFormatter` + CSS cursor. Size difference is RN complexity, not feature divergence. |
| **Tool part** | `AIToolPart.tsx` (287 LOC) | `AiToolPart.vue` (59 LOC) | **Divergent** | Mobile has rich state display (pending/running/completed/error), `deriveToolDisplayState()`, state-colored icons. Web only shows tool name + collapsible input/output with neutral styling. Mobile is significantly ahead. |
| **Reasoning part** | `AIReasoningPart.tsx` (178 LOC) | `AiReasoningPart.vue` (55 LOC) | Aligned | Both use collapsible with streaming/completed labels. Size difference is RN complexity (markdown lib, layout workarounds). |
| **Collapsible** | `AICollapsible.tsx` (178 LOC) | `AiCollapsiblePart.vue` (138 LOC) | Aligned | Both provide expand/collapse with animation. Mobile uses Reanimated; web uses CSS transitions. Interface (title, icon, accent color, isStreaming) is nearly identical. |
| **Message list** | `AIChatMessagesList.tsx` (204 LOC) | `AiConversation.vue` (69 LOC) | Platform-specific | Mobile uses FlashList; web uses DOM scroll. Both have scroll-to-bottom buttons. This will always be per-platform. |
| **Message bubble** | `AIMessageBubble.tsx` (208 LOC) | `AiMessage.vue` (62 LOC) + `AiMessageContent.vue` (25 LOC) | Aligned pattern | Both split reasoning/tools outside bubble, text inside. Mobile has copy-to-clipboard; web has it disabled. |
| **Header** | `AIChatHeader.tsx` (126 LOC) | Inline in `AiChatPanel.vue` (lines 279-383) | **Divergent** | Mobile has a standalone component. Web inlines the header in the God component. The web proposal (I1) recommends extracting `AiChatHeader.vue` — which would align with mobile. |
| **Session panel** | `AIChatSessionPanel.tsx` + `AISessionList.tsx` + `AISessionItem.tsx` | Inline in `AiChatPanel.vue` (lines 386-470) | **Divergent** | Same issue — mobile has dedicated components, web inlines everything. Web proposal recommends extraction. |
| **Input field** | `AIInputField.tsx` (103 LOC) | `AiPromptInput.vue` (82 LOC) | Aligned | Both have text input + send/cancel. Similar props interface. |
| **Error display** | `AIChatError.tsx` (142 LOC) | `AiChatError.vue` (181 LOC) | Aligned | Both categorize errors and show retry/dismiss actions. |
| **Empty state** | `AIChatEmptyState.tsx` (78 LOC) | `AiConversationEmptyState.vue` (26 LOC) | Aligned | Both show suggested prompts. Mobile is more elaborate. |
| **Suggestions** | In `AIChatEmptyState.tsx` | `AiSuggestions.vue` + `AiSuggestion.vue` | Divergent pattern | Web has dedicated suggestion components; mobile embeds in empty state. |
| **Floating entry** | `FloatingAIAssistant.tsx` (150 LOC) | `AiAssistant.vue` (141 LOC) with layout prop | Different | Mobile is a dedicated FAB component. Web supports `floating`/`sidebar`/`inline` via a layout prop + generic panel wrappers. Web's layout flexibility is better for extraction. |
| **Context/Provider** | None (prop drilling through containers) | `provider.js` — `provideAiChatContext` | **Divergent** | Web uses Vue provide/inject to share `status`, `isStreaming`, `sendMessage`, `clearError` with children. Mobile passes everything as props through the container. For extraction, the mobile should adopt a `<AIChatProvider>` context pattern, which also aligns with the context-scoped registry recommendation. |
| **Types** | `types/ai-chat/parts.ts` (286 LOC) + `constants.ts` (88 LOC) | `constants.js` (37 LOC) — no types | Mobile far ahead | Mobile has TypeScript interfaces, discriminated unions, 20+ type guards, tool state helpers. Web has zero TypeScript. This is the biggest parity gap — but it means the mobile defines the canonical types for `@eleva/ai-chat-core`. |
| **Schemas** | `aiChatSchemas.ts` (79 LOC, Zod) | None | Mobile only | Mobile validates all backend data; web trusts it. Web proposal recommends adding Zod. |
| **Tests** | None | 17 spec files | Web far ahead | Web has comprehensive test coverage for composables and components. Mobile has zero tests. |

### 2. Specific Recommendations for Mobile Refactoring Plan

#### R1: Adopt a Provider/Context Pattern (NEW — add to Phase 2)

**Finding**: The web uses `provideAiChatContext` to share `status`, `isStreaming`, `sendMessage`, `clearError` with deep child components. The mobile passes everything via props through `AIChatInterface` → components. This is fine now but becomes unwieldy after extraction when consumers compose the chat differently.

**Recommendation**: Add an `<AIChatProvider>` context in Phase 2 that wraps the container and provides:
- Chat state (status, isStreaming, error)
- Chat actions (sendMessage, stop, clearError)
- Theme tokens (from P2.4)
- Part/tool registry (from P2.5, context-scoped per extraction review)
- i18n provider (from P2.3)

This aligns with both the web pattern and the extraction review's recommendation for context-scoped registries. **Effort**: 0.5 day (can be done alongside P2.4/P2.5).

#### R2: Extract Orchestration Logic into a Dedicated Hook (NEW — consider for Phase 1)

**Finding**: The web has `useAiAssistant.js` as an orchestrator composable that wires together chat, sessions, bots, and user info. The mobile puts this orchestration in `AIChatInterface.tsx` (a container component). For extraction, the logic should be in a hook so consumers can wire their own UI.

**Recommendation**: Create `useAIChatOrchestrator` (or rename to `useAIAssistant` for web parity) that returns all the wired-up state: chat instance, session state, bot state, user info. `AIChatInterface.tsx` becomes a thin UI shell that calls this hook.

**Impact on existing plan**: This doesn't add new work — it restructures the existing P1.1 split to include extraction of orchestration logic from `AIChatInterface.tsx` into a hook. **Effort**: included in P1.1 (adds ~0.25 day).

#### R3: Align `constants.ts` with Web (minor update to P1.5)

**Finding**: The constants diverge between platforms:

| Constant | Mobile | Web |
|----------|--------|-----|
| `TOOL_STATES` | 8 values (SDK + legacy) | 6 values (SDK only, different naming) |
| `PART_TYPES` | 11 values | 5 values |
| `MESSAGE_ROLES` | 4 values | 3 values (includes `TOOL`) |
| Naming | `MESSAGE_ROLES` | `MESSAGE_ROLE` |

The web has `TOOL_STATES.INPUT_START` and `TOOL_STATES.OUTPUT_STREAMING` which the mobile doesn't. The mobile has legacy states (`PENDING`, `RUNNING`, `COMPLETED`, `FAILED`) which the web doesn't.

**Recommendation**: When extracting pure functions in P1.5, also normalize constants. The canonical set for `@eleva/ai-chat-core` should be the mobile's superset (SDK states + legacy fallbacks), with both platforms importing from the same source after extraction. Add missing web constants (`INPUT_START`, `OUTPUT_STREAMING`) to mobile. Rename `MESSAGE_ROLES` → align with a single canonical name.

#### R4: The Mobile's `useAIChatScroll` Retry Cascade Should Adopt Web's RAF Pattern (update P1.6)

**Finding**: The web's `useAutoScroll.js` uses `requestAnimationFrame` via `useRafFn` for smooth streaming scroll, with user-scroll-intent detection (pausing auto-scroll when user scrolls up, resuming when they scroll back to bottom). This is fundamentally superior to the mobile's retry cascade approach (`try scrollToEnd → catch → try scrollToIndex → catch → setTimeout → try again`).

**Recommendation**: P1.6 should not just simplify the retry cascades — it should adopt the web's conceptual approach where possible:
1. Use `onContentSizeChange` callback (RN equivalent of RAF loop for scroll) to drive auto-scroll during streaming
2. Add user-scroll-intent detection (the web's `userScrolledAway` pattern)
3. Remove the nested try/catch retry pattern entirely

This is more work than originally scoped but produces a better result that aligns with the web. **Effort**: increase P1.6 from 0.5 day to 1 day.

#### R5: Web's Lazy-Loading Pattern for Part Renderers (adopt in P2.5)

**Finding**: The web uses `defineAsyncComponent` to lazy-load `AiReasoningPart` and `AiToolPart`, eagerly loading only `AiTextPart`. The mobile eagerly loads all three.

**Recommendation**: When implementing the part registry (P2.5), consider React's `React.lazy()` for non-text part renderers. This is a minor optimization but aligns with web and reduces initial bundle for consumers who don't use tool/reasoning parts. **Effort**: included in P2.5.

### 3. Patterns from Web Code the Mobile Should Adopt

#### W1: Imperative Session Loading (Simpler Than Reactive Bridge)

The web's `useAiChatSessionManager.loadSession()` is a single imperative function:
```javascript
const loadSession = async (sessionId, botId, chat) => {
  activeSessionId.value = sessionId;
  storeSessionId(botId, sessionId);
  const messages = await fetchSessionMessages(sessionId);
  const uiMessages = toUIMessages(messages).reverse();
  chat.setMessages(uiMessages);
};
```

Compare this to the mobile's reactive bridge (30+ lines of effect logic with fingerprinting, guards, and deduplication). The mobile's complexity exists because Redux state arrives asynchronously (dispatch → thunk → selector update → effect fires). If the mobile moves to `SessionsAdapter` (P2.2) with direct async methods (like the web uses), the reactive bridge can be simplified to an imperative pattern, eliminating invariants #3, #4, and #5.

**Recommendation**: When implementing P2.2, design the `SessionsAdapter` interface so that `fetchMessages()` returns messages directly (like the web), rather than dispatching to Redux and waiting for selector updates. This would allow replacing the reactive bridge with an imperative `loadSession()` call, dramatically simplifying the most fragile part of the codebase.

#### W2: Layout Flexibility via Composition

The web's `AiAssistant.vue` supports `floating`, `sidebar`, and `inline` layouts by composing generic panel wrappers (`FloatingPanel`, `SidebarPanel`). The mobile only supports floating via `FloatingAIAssistant.tsx`.

**Recommendation**: For the extracted package, `AIChatInterface` should be layout-agnostic. The floating behavior should be a separate wrapper component (`FloatingAIChatPanel`) that composes `AIChatInterface`, not a peer. This matches the web architecture.

#### W3: Provide/Inject Pattern for Deep Component Access

The web's `provideAiChatContext` is a clean pattern that avoids prop drilling. The mobile currently passes `status`, `isStreaming`, `sendMessage`, etc. through 2-3 levels of components.

**Recommendation**: Adopt a React context equivalent in P2.5 (the `<AIChatProvider>` from R1 above). This is the natural home for the context-scoped registry, theme, i18n, and chat state.

### 4. Divergence Concerns for Shared Package Extraction

#### D1: Constants Divergence (Medium Risk)

The web and mobile define `PART_TYPES`, `TOOL_STATES`, and `MESSAGE_ROLE(S)` independently with overlapping but non-identical values. The mobile has a superset. When `@eleva/ai-chat-core` defines the canonical constants, the web will need to update its constants file to import from core. Both platforms should freeze their constant definitions now and only add (never remove) values.

#### D2: Session Management Architecture (High Risk)

The mobile uses Redux (dispatch/selectors/thunks) for session state. The web uses raw `fetch()` + composable-local `ref()`s. These are fundamentally different state management approaches. The `SessionsAdapter` interface must abstract over both:
- Mobile's `chatwootSessionsAdapter` wraps Redux dispatch + selectors
- Web's `chatwootSessionsAdapter` wraps raw fetch + local refs

The interface designed in Research 3A handles this correctly, but the reactive bridge on mobile is the complication. If the mobile doesn't simplify the bridge (per W1), the `SessionsAdapter` interface will need additional reactive hooks that the web doesn't need, creating asymmetry.

#### D3: Tool State Display (Low Risk, but Feature Gap)

The mobile has rich tool state display (4 states with icons + colors) via `deriveToolDisplayState()`. The web shows tools with uniform neutral styling and no state differentiation. After extraction, the core package should export `deriveToolDisplayState` and the platform packages should use it. The web needs to adopt the mobile's tool state display for parity.

#### D4: Streaming Reactivity Workaround (Medium Risk)

The web requires a polling workaround (`JSON.parse(JSON.stringify)` every 50ms) because `@ai-sdk/vue`'s `Chat` class doesn't trigger Vue reactivity during streaming. The mobile has no such workaround — `@ai-sdk/react`'s `useChat` hook is natively reactive.

This means the Vue package will always have a performance/architecture overhead that the React packages don't. The `@eleva/ai-chat-vue` composable (`useAIChat`) must internalize this workaround. This is a known limitation documented in the web proposal (Appendix B) and doesn't affect the core package, but consumers should be warned.

#### D5: Type System Gap (Blocking for Extraction)

The mobile defines the canonical types in `types/ai-chat/parts.ts` (286 LOC) and `constants.ts` (88 LOC). The web has ZERO TypeScript. The `@eleva/ai-chat-core` package will be TypeScript. This means:
- The mobile's type definitions ARE the core package types (with minor adjustments)
- The web must adopt TypeScript before it can consume the core package
- The web proposal's Phase 1 (TypeScript migration, 2-3 days) is a prerequisite for extraction

**Sequencing implication**: The mobile should extract its types to `@eleva/ai-chat-core` first. The web TypeScript migration (web proposal Phase 1) then imports FROM core instead of creating independent type definitions.

#### D6: Test Coverage Asymmetry (Medium Risk)

The web has 17 spec files. The mobile has zero. For extraction, the core package needs tests. The pure functions being extracted (type guards, mappers, validators, formatters) should be tested BEFORE extraction to establish the contract. The mobile proposal's P1.7 (unit tests, 1.5 days) is correctly prioritized.

### 5. Updated Time Estimates

Changes from cross-platform review:

| Task | Original | Updated | Reason |
|------|----------|---------|--------|
| P1.1: Split `useAIChatSessions` | 0.5 day | 0.75 day | Include orchestrator hook extraction (R2) |
| P1.6: Simplify scroll retries | 0.5 day | 1 day | Adopt web's RAF/intent-detection pattern (R4) |
| P2.5: Part/tool registry | 1 day | 1.5 days | Context-scoped + error boundaries (extraction review C1) |
| **NEW** P2.8: Add `AIChatProvider` context | — | 0.5 day | Provider pattern (R1, W3) |
| **Phase 1 revised total** | 4.25 days | **4.75 days** | |
| **Phase 2 revised total** | 7.5 days | **8.5 days** | |
| **Combined revised total** | 11.75 days | **13.25 days** | |

The 1.5-day increase is justified by better cross-platform alignment, which reduces rework during the actual extraction phase (Research 3A Phase 1-3).

### 6. Recommended Sequencing (Revised)

1. **Now** (before slides): P1.1 (split sessions + orchestrator hook), P1.2 (addToolOutput), P1.8 (document invariants) — **2.25 days**
2. **During slides development**: P1.3 (FlashList type), P1.4 (eager JSX), P1.5 (extract pure functions + align constants), P1.6 (scroll, adopt RAF pattern), P1.7 (unit tests) — **3.5 days**
3. **After slides ship, Phase 2 prep**: P2.1 (ChatConfig, split per extraction review), P2.2 (SessionsAdapter, simplify bridge per W1), P2.3 (i18n), P2.4 (theme), P2.5 (context-scoped registry), P2.8 (AIChatProvider context), P2.6 (floating layout), P2.7 (message bubble) — **8.5 days**
4. **Coordinate with web**: Ensure web TypeScript migration (web proposal Phase 1) starts before or during step 3, so both platforms can consume `@eleva/ai-chat-core` simultaneously
5. **Then**: Research 3A Phase 1-3 (actual package extraction) — **10-15 days**
