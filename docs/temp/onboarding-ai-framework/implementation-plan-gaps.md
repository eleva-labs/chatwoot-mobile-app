# Gap Resolution Implementation Plan

> **Version**: 1.1
> **Date**: 2026-03-03
> **Status**: ALL GAPS IN THIS DOCUMENT ARE RESOLVED (as of 2026-03-03)
> **Scope**: Phase 2 gaps (G4, G5, G6, G7, G8) — all now resolved
> **Next**: See INDEX.md for Phase 1 prerequisites (SPIKE-1, SPIKE-2 must complete before Phase 1 code)

---

> ## Status as of 2026-03-03: ALL GAPS IN THIS DOCUMENT ARE RESOLVED
>
> G4 (Adapter wiring), G5 (Theme duplication), G6 (Markdown abstraction), G7 (Hook tests), and G8 (Web Vue dependencies) are all complete. The original document content below is preserved for historical record of what was done.
>
> **Phase 1 is NOT blocked by anything in this document.** Phase 1 is blocked only by SPIKE-1 and SPIKE-2. See `INDEX.md` Open Issues section and `spike-1-tool-part-shape.md` / `spike-2-openai-strict-schema.md`.

---

## Executive Summary (Historical — All Work Complete)

The AI Generative UI Framework Phase 2 ("extraction prep") is complete. The gap audit conducted 2026-03-01 identified 8 gaps; all are now resolved.

**All resolved:**
- G1 (render_view concept), G2 (view sequencing), G3 (dynamic composition) — future phases, not blocking
- G4 (Adapter wiring) — RESOLVED: hybrid pattern documented and implemented
- G5 (theme duplication) — RESOLVED: no work needed
- G6 (Markdown abstraction) — RESOLVED: registry injection pattern implemented
- G7 (Hook tests) — RESOLVED: 129 tests added across 4 hooks
- G8 (Web Vue decoupling) — RESOLVED: 3 Vue files decoupled from Chatwoot-internal imports
- G9 (AI backend render_view tool) — out of scope for this document

---

## Gap Status Overview (Final)

| Gap | Title | Status | Notes |
|-----|-------|--------|-------|
| G4 | Adapter Wiring (Mobile) | **RESOLVED** | Hybrid pattern: reactive reads use selectors, imperative commands use adapter |
| G5 | Theme Duplication (Mobile) | **RESOLVED** | No work needed |
| G6 | Markdown Registry Integration (Mobile) | **RESOLVED** | `markdownRenderer` slot in `AIChatRegistries`; no direct `import Markdown` in parts |
| G7 | Hook-Level Tests (Mobile) | **RESOLVED** | 129 tests across `useAIChat`, `useAIChatSessions`, `useAIChatScroll`, `useAIChatBot` |
| G8 | Web Vue Component Decoupling | **RESOLVED** | 3 Vue files decoupled; Chatwoot consumers pass components via slots/props |

---

## Implementation Tasks

---

### Task 0 (Non-Code): Document G4 as Resolved by Design

**File to update**: `docs/temp/onboarding-ai-framework/gap-analysis-2026-03-01.md` — mark G4 resolved.

**What to document**: The gap analysis (line 217–228) stated that `useAIChatSessions` "accepts a `SessionsStateAdapter` but still dispatches Redux actions directly." Upon reading the actual code (`useAIChatSessions.ts:97–197`), the hook has been deliberately updated to the following hybrid pattern:

- **Reactive reads** (`sessions`, `activeSessionId`, `isLoadingMessages`) use `useAppSelector` — because the adapter's imperative getters (`getSessions()`, `getActiveSessionId()`) cannot trigger React re-renders. The adapter cannot replace selectors here without a complete re-architecture.
- **Imperative commands** (`fetchSessions`, `fetchMessages`, `setActiveSessionId`) check `adapterRef.current` first and fall back to Redux dispatch if no adapter is provided.

This is the correct hybrid pattern. The code at lines 103–109, 127–137, 142–155, 170–173, and 188–191 all use `if (adapterRef.current) { adapter.method() } else { dispatch(...) }`. The hook is extraction-ready: pass any adapter conforming to `SessionsStateAdapter` and Redux is bypassed for all commands.

**No code change needed.** Mark G4 `RESOLVED` in the gap analysis.

---

### Task 1: G6 — Markdown Registry Integration (Mobile)

**Priority**: Medium (unblocks extraction; low risk)
**Effort**: 0.5 day
**Files**: 2 component files + 1 provider file + 1 type file

#### Problem

Both `AITextPart.tsx` and `AIReasoningPart.tsx` import `react-native-markdown-display` at the top level, unconditionally. Even when a `MarkdownRenderer` prop is passed (the injection point already exists), the library is still bundled and loaded. This hard-codes a markdown library into every consumer of the framework.

- `AITextPart.tsx:25` — `import Markdown, { MarkdownIt } from 'react-native-markdown-display';`
- `AIReasoningPart.tsx:19` — `import Markdown, { MarkdownIt } from 'react-native-markdown-display';`

The components already have the prop injection point (`MarkdownRenderer?: React.ComponentType<...>`), so the fix is only to:
1. Remove the direct import
2. Read the default `MarkdownRenderer` from `ComponentRegistry` (via context) instead of falling back to the hard import
3. Register the default markdown renderer in `AIChatProvider`

#### Step 1.1 — Extend `AIChatRegistries` type in `useAIChatProvider.tsx`

**File**: `src/presentation/ai-chat/hooks/ai-assistant/useAIChatProvider.tsx`

The `AIChatRegistries` interface (line 36–41) and `AIChatProviderProps.registry` (line 67–70) currently only have `parts` and `tools`. Add a `markdown` slot for the default renderer.

**Before** (`useAIChatProvider.tsx:36–41`):
```typescript
export interface AIChatRegistries {
  /** Registry for part type renderers (text, reasoning, etc.) */
  parts: ComponentRegistry<PartComponent>;
  /** Registry for tool-specific renderers (by toolName) */
  tools: ComponentRegistry<PartComponent>;
}
```

**After**:
```typescript
export type MarkdownRendererComponent = React.ComponentType<{
  children: string;
  style?: Record<string, unknown>;
}>;

export interface AIChatRegistries {
  /** Registry for part type renderers (text, reasoning, etc.) */
  parts: ComponentRegistry<PartComponent>;
  /** Registry for tool-specific renderers (by toolName) */
  tools: ComponentRegistry<PartComponent>;
  /** Default markdown renderer component (injection point for react-native-markdown-display or any alternative) */
  markdownRenderer: MarkdownRendererComponent | null;
}
```

**Before** (`useAIChatProvider.tsx:43–46`):
```typescript
const defaultRegistries: AIChatRegistries = {
  parts: new ComponentRegistry<PartComponent>(),
  tools: new ComponentRegistry<PartComponent>(),
};
```

**After**:
```typescript
const defaultRegistries: AIChatRegistries = {
  parts: new ComponentRegistry<PartComponent>(),
  tools: new ComponentRegistry<PartComponent>(),
  markdownRenderer: null,
};
```

**Before** (`useAIChatProvider.tsx:67–70`):
```typescript
  registry?: {
    parts?: Record<string, PartComponent>;
    tools?: Record<string, PartComponent>;
  };
```

**After**:
```typescript
  registry?: {
    parts?: Record<string, PartComponent>;
    tools?: Record<string, PartComponent>;
    /** Pass the Markdown component from react-native-markdown-display (or any alternative) */
    markdownRenderer?: MarkdownRendererComponent;
  };
```

**Before** (`useAIChatProvider.tsx:104–121` — the `registries` useMemo):
```typescript
  const registries = useMemo(() => {
    const parts = new ComponentRegistry<PartComponent>();
    const tools = new ComponentRegistry<PartComponent>();

    if (registryProp?.parts) {
      for (const [key, component] of Object.entries(registryProp.parts)) {
        parts.register(key, component);
      }
    }

    if (registryProp?.tools) {
      for (const [key, component] of Object.entries(registryProp.tools)) {
        tools.register(key, component);
      }
    }

    return { parts, tools };
  }, [registryProp]);
```

**After**:
```typescript
  const registries = useMemo(() => {
    const parts = new ComponentRegistry<PartComponent>();
    const tools = new ComponentRegistry<PartComponent>();

    if (registryProp?.parts) {
      for (const [key, component] of Object.entries(registryProp.parts)) {
        parts.register(key, component);
      }
    }

    if (registryProp?.tools) {
      for (const [key, component] of Object.entries(registryProp.tools)) {
        tools.register(key, component);
      }
    }

    return {
      parts,
      tools,
      markdownRenderer: registryProp?.markdownRenderer ?? null,
    };
  }, [registryProp]);
```

#### Step 1.2 — Add `useAIMarkdownRenderer` hook

Create a new small hook that reads the markdown renderer from registry context. This avoids prop-drilling and keeps the components clean.

**New file**: `src/presentation/ai-chat/hooks/ai-assistant/useAIMarkdownRenderer.ts`

```typescript
import { useAIChatRegistries } from './useAIChatProvider';

/**
 * Returns the default markdown renderer registered in AIChatProvider.
 * Returns null if no renderer has been registered (caller must handle gracefully).
 */
export function useAIMarkdownRenderer() {
  const { markdownRenderer } = useAIChatRegistries();
  return markdownRenderer;
}
```

#### Step 1.3 — Update `AITextPart.tsx`

**File**: `src/presentation/ai-chat/parts/ai-assistant/AITextPart.tsx`

**Before** (line 25):
```typescript
import Markdown, { MarkdownIt } from 'react-native-markdown-display';
```

**After**: Remove that line entirely.

**Before** (line 64–70, component signature):
```typescript
export const AITextPart: React.FC<AITextPartProps> = ({
  part,
  role = 'assistant',
  isStreaming = false,
  enableMarkdown = true,
  MarkdownRenderer: CustomMarkdownRenderer,
}) => {
```

**After** (add the hook call inside the component body, after the destructuring):
```typescript
export const AITextPart: React.FC<AITextPartProps> = ({
  part,
  role = 'assistant',
  isStreaming = false,
  enableMarkdown = true,
  MarkdownRenderer: CustomMarkdownRenderer,
}) => {
  // ... existing hooks ...
  const registryMarkdownRenderer = useAIMarkdownRenderer();
  // Prop wins over registry (allows per-instance override)
  const MarkdownRenderer = CustomMarkdownRenderer ?? registryMarkdownRenderer;
```

**Before** (lines 233–248, the markdown render block):
```typescript
        {CustomMarkdownRenderer ? (
          <CustomMarkdownRenderer style={markdownStyles as unknown as Record<string, unknown>}>
            {text}
          </CustomMarkdownRenderer>
        ) : (
          <Markdown
            mergeStyle
            markdownit={MarkdownIt({
              linkify: true,
              typographer: true,
            })}
            onLinkPress={handleLinkPress}
            style={markdownStyles}>
            {text}
          </Markdown>
        )}
```

**After**:
```typescript
        {MarkdownRenderer ? (
          <MarkdownRenderer style={markdownStyles as unknown as Record<string, unknown>}>
            {text}
          </MarkdownRenderer>
        ) : (
          // Fallback: plain text when no markdown renderer is registered.
          // Register one in AIChatProvider to enable markdown rendering.
          <Text style={markdownStyles.body as object}>{text}</Text>
        )}
```

Also add the import at the top of the file:
```typescript
import { useAIMarkdownRenderer } from '@presentation/ai-chat/hooks/ai-assistant/useAIMarkdownRenderer';
```

#### Step 1.4 — Update `AIReasoningPart.tsx`

**File**: `src/presentation/ai-chat/parts/ai-assistant/AIReasoningPart.tsx`

**Before** (line 19):
```typescript
import Markdown, { MarkdownIt } from 'react-native-markdown-display';
```

**After**: Remove that line.

Inside the component (after the existing hooks at line 68):
```typescript
  const registryMarkdownRenderer = useAIMarkdownRenderer();
  const MarkdownRenderer = CustomMarkdownRenderer ?? registryMarkdownRenderer;
```

**Before** (lines 141–153, the markdown render inside `ScrollView`):
```typescript
            {CustomMarkdownRenderer ? (
              <CustomMarkdownRenderer style={markdownStyles as unknown as Record<string, unknown>}>
                {reasoningText}
              </CustomMarkdownRenderer>
            ) : (
              <Markdown
                mergeStyle
                markdownit={MarkdownIt({ linkify: true, typographer: true })}
                style={markdownStyles}>
                {reasoningText}
              </Markdown>
            )}
```

**After**:
```typescript
            {MarkdownRenderer ? (
              <MarkdownRenderer style={markdownStyles as unknown as Record<string, unknown>}>
                {reasoningText}
              </MarkdownRenderer>
            ) : (
              <Text style={markdownStyles.body as object}>{reasoningText}</Text>
            )}
```

Add the import:
```typescript
import { useAIMarkdownRenderer } from '@presentation/ai-chat/hooks/ai-assistant/useAIMarkdownRenderer';
```

#### Step 1.5 — Register Markdown in the Chatwoot app bootstrap

The Chatwoot app's existing `AIChatProvider` usage (wherever it wraps the chat UI — look for `<AIChatProvider` in the `FloatingAIAssistant` container) needs to pass the renderer.

**Find the provider usage**:
```bash
# From chatwoot-mobile-app/
grep -r "AIChatProvider" src/ --include="*.tsx" -l
```

In that file, update the `registry` prop:

```typescript
// At the top of the file — the only place react-native-markdown-display is now imported
import Markdown from 'react-native-markdown-display';

// In the JSX
<AIChatProvider
  registry={{
    markdownRenderer: Markdown,
    // existing parts/tools...
  }}
  // ... rest of props
>
```

This is the **single** place in the app where `react-native-markdown-display` is imported. All components are now decoupled from the library.

#### Verification

```bash
# Confirm no direct markdown import remains in parts/
grep -r "react-native-markdown-display" src/presentation/ai-chat/parts/
# Expected: no output

# Run tests
pnpm test src/presentation/ai-chat/parts/
```

Visual smoke test: Open AI chat in simulator. Assistant message with markdown (bold, code block, list) should render correctly. Reasoning panel should expand and show formatted text.

---

### Task 2: G7 — Hook-Level Tests (Mobile)

**Priority**: HIGH — must be done before any Phase 1 framework work
**Effort**: 2.5–3 days
**Test runner**: Jest + `@testing-library/react-native` (same as `useMessageBridge.test.ts`)
**Pattern reference**: `src/presentation/ai-chat/hooks/ai-assistant/__tests__/useMessageBridge.test.ts`

The existing test pattern uses:
- `renderHook` from `@testing-library/react-native`
- `act` for state-triggering calls
- `jest.fn()` for all external dependencies (Redux dispatch, store selectors, services)
- `jest.mock(...)` at module level for deep dependencies
- A `defaultOptions(overrides?)` factory function to reduce boilerplate
- Named `describe` blocks with numbered comments for each test scenario

All new test files go in: `src/presentation/ai-chat/hooks/ai-assistant/__tests__/`

---

#### 2.1 — `useAIChat.test.ts`

**What the hook does** (from reading `useAIChat.ts:132–438`):
- Wraps `@ai-sdk/react`'s `useChat` with a `DefaultChatTransport`
- Manages session ID via state + ref (INV-1: ref updated during streaming, state flushed in `handleFinish`)
- Persists session ID to `ChatConfig.persistence` (async load on mount, async save on change)
- Provides stable `handleError` / `handleFinish` callbacks via empty-dep `useCallback` + refs (INV-3)
- Cancels streaming when app goes to background (`AppState` listener)
- Cleans up on unmount (`isMountedRef`, calls `chat.stop()`)
- Exposes: `messages`, `error`, `isLoading`, `status`, `sendMessage`, `stop`, `setMessages`, `clearSession`, `sessionId`, `addToolOutput`

**Mocking strategy**:

```typescript
// Mock the Vercel AI SDK — the hook's most complex dependency
jest.mock('@ai-sdk/react', () => ({
  useChat: jest.fn(),
}));

jest.mock('ai', () => ({
  DefaultChatTransport: jest.fn().mockImplementation(() => ({})),
}));

// Mock AppState for background lifecycle tests
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  AppState: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));
```

**`useChat` mock factory** — `useChat` returns a chat object; mock it to return controlled state:

```typescript
import { useChat } from '@ai-sdk/react';
const mockUseChat = useChat as jest.MockedFunction<typeof useChat>;

function makeMockChat(overrides = {}) {
  return {
    messages: [],
    error: undefined,
    status: 'ready',
    sendMessage: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn(),
    setMessages: jest.fn(),
    addToolOutput: jest.fn(),
    ...overrides,
  };
}
```

**`ChatConfig` factory**:

```typescript
function makeConfig(overrides = {}): ChatConfig {
  return {
    transport: {
      streamEndpoint: 'http://localhost:8000/ai/chat',
      getHeaders: jest.fn().mockResolvedValue({ Authorization: 'Bearer test' }),
    },
    persistence: {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    },
    behavior: { streamThrottle: 50 },
    ...overrides,
  };
}
```

**Test cases to write**:

```
describe('useAIChat')

  // ── Initialization ──
  1. initializes with null sessionId when no initialSessionId and persistence returns null
  2. initializes with initialSessionId when provided as option
  3. loads sessionId from persistence on mount when no initialSessionId

  // ── sendMessage ──
  4. calls chat.sendMessage with text when sendMessage is invoked with non-empty text
  5. does NOT call chat.sendMessage when text is empty or whitespace
  6. calls onError callback when chat.sendMessage throws

  // ── Session ID lifecycle (INV-1) ──
  7. does NOT call setSessionId during streaming (ref updated, state deferred)
     — simulate: call handleFinish with { message, isAbort: false }; verify sessionId state updates
  8. does NOT flush sessionId when handleFinish is called with isAbort: true
  9. saves sessionId to persistence when sessionId state changes

  // ── clearSession ──
  10. clearSession calls persistence.remove and sets sessionId to null and clears messages

  // ── isLoading derivation ──
  11. isLoading is true when chat.status is 'submitted'
  12. isLoading is true when chat.status is 'streaming'
  13. isLoading is false when chat.status is 'ready'
  14. isLoading is false when chat.status is 'error'

  // ── AppState lifecycle ──
  15. stops streaming when AppState changes to 'background' while status is 'streaming'
  16. does NOT stop when AppState changes to 'active'

  // ── Return value shape ──
  17. exposes addToolOutput directly from chat.addToolOutput
  18. exposes stop directly from chat.stop
  19. exposes setMessages directly from chat.setMessages
```

**Key implementation note for test 7** (INV-1 verification):

`handleFinish` is created via `useCallback(fn, [])` (empty deps — captured once by SDK mock). To test it you need to capture and invoke it directly:

```typescript
it('flushes sessionId to state in handleFinish (not during streaming)', async () => {
  let capturedHandleFinish: ((opts: { message: UIMessage; isAbort: boolean }) => void) | undefined;

  mockUseChat.mockImplementation(({ onFinish }) => {
    capturedHandleFinish = onFinish;
    return makeMockChat({ status: 'streaming' });
  });

  const config = makeConfig();
  const { result } = renderHook(() => useAIChat(config));

  // Simulate: backend sends X-Chat-Session-Id — only ref is updated during stream
  // (This is internal; we verify the state hasn't changed yet)
  expect(result.current.sessionId).toBe(null);

  // Simulate stream finish — handleFinish flushes ref → state
  await act(async () => {
    capturedHandleFinish?.({ message: { id: 'msg-1', role: 'assistant', parts: [] }, isAbort: false });
  });

  // sessionId state is still null because sessionIdRef.current is null in this test
  // (no actual HTTP response to set the ref). A more complete test would mock the
  // transport fetch to set sessionIdRef — this tests the flush logic.
  expect(config.persistence?.set).not.toHaveBeenCalledWith(expect.anything(), null);
});
```

**File**: `src/presentation/ai-chat/hooks/ai-assistant/__tests__/useAIChat.test.ts`

---

#### 2.2 — `useAIChatSessions.test.ts`

**What the hook does** (from reading `useAIChatSessions.ts:1–209`):
- Selects `sessions`, `activeSessionId`, `isLoadingMessages` from Redux via `useAppSelector`
- Accepts `adapter: SessionsStateAdapter | undefined` — uses adapter methods if present, falls back to Redux dispatch
- Fetches sessions on mount (or when `selectedBotId` changes)
- Auto-selects latest session when sessions arrive and no active session is set
- Loads messages when `activeSessionId` changes
- Manages `showSessions` panel toggle (local state)
- Manages `isNewConversation` flag (ref + state in sync) to suppress auto-select after "New Chat"
- `handleSelectSession`: sets active session, resets bridge key, stops streaming
- `handleNewConversation`: sets `isNewConversation=true`, sets `activeSessionId=null`, calls `clearSession`

**Mocking strategy**:

```typescript
// Mock Redux hooks — useAppSelector returns controlled values
jest.mock('@/hooks', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

// Mock Redux selectors
jest.mock('@application/store/ai-chat', () => ({
  aiChatActions: {
    fetchSessions: jest.fn(args => ({ type: 'ai-chat/fetchSessions', payload: args })),
    fetchMessages: jest.fn(args => ({ type: 'ai-chat/fetchMessages', payload: args })),
  },
  selectSessionsByAgentBot: jest.fn(),
  selectActiveSessionId: jest.fn(),
  selectIsLoadingMessages: jest.fn(),
  setActiveSession: jest.fn(args => ({ type: 'ai-chat/setActiveSession', payload: args })),
}));
```

**Test store setup helper** (since we're mocking selectors, not using Redux store):

```typescript
import { useAppDispatch, useAppSelector } from '@/hooks';
const mockDispatch = jest.fn();
const mockUseAppSelector = useAppSelector as jest.MockedFunction<typeof useAppSelector>;
const mockUseAppDispatch = useAppDispatch as jest.MockedFunction<typeof useAppDispatch>;

function setupSelectorMocks({ sessions = [], activeSessionId = null, isLoadingMessages = false } = {}) {
  mockUseAppDispatch.mockReturnValue(mockDispatch);
  // useAppSelector is called 3 times: activeSessionId, isLoadingMessages, sessions
  mockUseAppSelector
    .mockReturnValueOnce(activeSessionId)     // selectActiveSessionId
    .mockReturnValueOnce(isLoadingMessages)   // selectIsLoadingMessages
    .mockReturnValue(sessions);               // selectSessionsByAgentBot
}
```

**Test cases to write**:

```
describe('useAIChatSessions')

  // ── Initial state ──
  1. returns showSessions=false and isNewConversation=false on init

  // ── Session fetching ──
  2. dispatches fetchSessions when selectedBotId is provided (no adapter)
  3. calls adapter.fetchSessions when adapter is provided and selectedBotId is set
  4. does NOT dispatch fetchSessions when selectedBotId is undefined

  // ── Message loading ──
  5. dispatches fetchMessages when activeSessionId is set (no adapter)
  6. calls adapter.fetchMessages when adapter is provided and activeSessionId is set
  7. does NOT dispatch fetchMessages when activeSessionId is null

  // ── Auto-select ──
  8. auto-selects latest session (sessions[0]) when no activeSessionId and isNewConversation is false
  9. does NOT auto-select when isNewConversation is true
  10. dispatches setActiveSession for auto-select when no adapter
  11. calls adapter.setActiveSessionId for auto-select when adapter is provided

  // ── handleSelectSession ──
  12. setShowSessions(false) and dispatches setActiveSession for a new session
  13. does nothing (early return) when selecting the already-active session
  14. calls options.stop() before switching sessions (stops streaming)
  15. calls options.onBridgeKeyReset() on session switch
  16. uses adapter.setActiveSessionId when adapter is provided

  // ── handleNewConversation ──
  17. sets isNewConversation=true and activeSessionId=null
  18. calls options.stop() when stop is provided
  19. calls options.clearSession() when clearSession is provided
  20. uses adapter.setActiveSessionId(null) when adapter is provided

  // ── isNewConversation lifecycle ──
  21. clears isNewConversation when activeSessionId becomes truthy after a new conversation
```

**File**: `src/presentation/ai-chat/hooks/ai-assistant/__tests__/useAIChatSessions.test.ts`

---

#### 2.3 — `useAIChatScroll.test.ts`

**What the hook does** (from reading `useAIChatScroll.ts:62–259`):
- Manages a `listRef` for FlashList
- Tracks `shouldAutoScrollRef` (internal ref — auto-scroll enabled/disabled)
- Triggers `scrollToEnd` after session load (300ms debounce) when messages become available
- Triggers `scrollToIndex(last)` when new messages arrive during streaming (32ms debounce)
- `handleScroll`: detects if user scrolled up (disables auto-scroll) or near bottom (re-enables)
- Debounced `isAtBottom` / `isAtTop` reactive state (150ms) for scroll button UI
- `scrollToBottom` / `scrollToTop` — programmatic scroll helpers
- `shouldAutoScroll()` — returns current ref value

**Mocking strategy**:

The hook uses `useRef` for FlashList; tests need to inject a mock list ref. Since refs aren't directly injectable via `renderHook` args, you need to access `result.current.listRef` and assign to it.

```typescript
function makeListRef() {
  return {
    scrollToEnd: jest.fn(),
    scrollToIndex: jest.fn(),
    scrollToOffset: jest.fn(),
  };
}

// Assign mock list ref after render
const { result } = renderHook(() => useAIChatScroll(sessionId, isLoading, msgLength, listDataLen));
// Inject the mock ref
(result.current.listRef as React.MutableRefObject<FlashListRef>).current = makeListRef();
```

**Note on timers**: This hook uses `setTimeout` for scroll debouncing. Use `jest.useFakeTimers()` in `beforeEach` and `jest.runAllTimers()` in tests.

**Test cases to write**:

```
describe('useAIChatScroll')

  beforeEach → jest.useFakeTimers()
  afterEach → jest.useRealTimers()

  // ── Initial state ──
  1. isAtBottom is true and isAtTop is true on init
  2. shouldAutoScroll() returns true on init

  // ── Session-load scroll ──
  3. calls scrollToEnd after 300ms when messages load (isLoading=false, messagesLength > 0)
  4. does NOT call scrollToEnd when isLoadingMessages is true
  5. does NOT call scrollToEnd when messagesLength is 0
  6. resets scroll tracking when activeSessionId changes

  // ── Streaming scroll ──
  7. calls scrollToIndex(last) after 32ms when messagesLength increases (auto-scroll enabled)
  8. does NOT call scrollToIndex when shouldAutoScroll is false (user scrolled up)

  // ── handleScroll ──
  9. disables auto-scroll (shouldAutoScroll returns false) when user scrolls far from bottom
  10. re-enables auto-scroll when user scrolls back near bottom
  11. updates isAtBottom state (debounced 150ms) when scroll position changes

  // ── Programmatic scrolls ──
  12. scrollToBottom calls scrollToIndex on the list ref
  13. scrollToTop calls scrollToIndex({index: 0}) on the list ref
  14. programmatic scroll does NOT disable shouldAutoScroll

  // ── Cleanup ──
  15. clears all timeouts on unmount (no timer leak)
```

**File**: `src/presentation/ai-chat/hooks/ai-assistant/__tests__/useAIChatScroll.test.ts`

---

#### 2.4 — `useAIChatBot.test.ts`

**What the hook does** (from reading `useAIChatBot.ts:19–66`):
- Calls `AIChatService.fetchBots()` on mount when `accountId` is provided
- If `agentBotId` is provided: finds the matching bot and sets `selectedBotId` + `selectedBot`
- If no `agentBotId`: selects `bots[0]` (first available bot)
- If no bots: logs a warning, leaves `selectedBot` null
- Manages `isLoading` and `error` state
- Exposes `setSelectedBotId` for manual override

**Mocking strategy**:

```typescript
jest.mock('@application/store/ai-chat/aiChatService', () => ({
  AIChatService: {
    fetchBots: jest.fn(),
  },
}));

import { AIChatService } from '@application/store/ai-chat/aiChatService';
const mockFetchBots = AIChatService.fetchBots as jest.MockedFunction<typeof AIChatService.fetchBots>;

function makeBot(id: number, name = `Bot ${id}`): AIChatBot {
  return { id, name, avatar_url: `https://example.com/bot-${id}.png` };
}
```

**Test cases to write**:

```
describe('useAIChatBot')

  // ── No fetch without accountId ──
  1. does NOT call AIChatService.fetchBots when accountId is undefined
  2. isLoading is false and error is null when accountId is undefined

  // ── Successful fetch ──
  3. sets isLoading=true during fetch then false after completion
  4. selects the bot matching agentBotId when agentBotId is provided
  5. selects bots[0] (first bot) when no agentBotId is provided
  6. sets selectedBot to null and logs warning when bots array is empty
  7. sets error when AIChatService.fetchBots throws

  // ── setSelectedBotId ──
  8. setSelectedBotId updates selectedBotId immediately (local state)

  // ── Re-fetch on agentBotId change ──
  9. re-fetches when agentBotId changes (effect dep)
  10. re-fetches when accountId changes (effect dep)
```

**File**: `src/presentation/ai-chat/hooks/ai-assistant/__tests__/useAIChatBot.test.ts`

---

#### Running the tests

```bash
# All new hook tests
pnpm test src/presentation/ai-chat/hooks/ai-assistant/__tests__/

# Single hook
npx jest src/presentation/ai-chat/hooks/ai-assistant/__tests__/useAIChat.test.ts

# With coverage
pnpm test -- --coverage src/presentation/ai-chat/hooks/ai-assistant/
```

---

### Task 3: G8 — Web Vue Component Decoupling

**Priority**: Medium
**Effort**: 1 day
**Files**: 3 Vue files in `chatwoot/app/javascript/dashboard/components-next/ai-assistant/`

The goal is that these three components can be published as part of `@eleva/ai-chat-vue` without importing anything from `dashboard/components-next/` (Chatwoot-internal). All three already have slot/prop escape hatches for *some* things — the gaps are where slots/props are absent and Chatwoot components are used as the only option.

---

#### 3.1 — `AiChatHeader.vue`

**File**: `chatwoot/app/javascript/dashboard/components-next/ai-assistant/containers/AiChatHeader.vue`

**Current imports to remove**:
- Line 17: `import Avatar from 'dashboard/components-next/avatar/Avatar.vue';`
- Line 18: `import DropdownMenu from 'dashboard/components-next/dropdown-menu/DropdownMenu.vue';`

**Analysis of usage**:
- `Avatar` is used at lines 87–94 as the **default content** inside `<slot name="bot-avatar">` — the slot already exists. The fallback Avatar simply needs to be replaced with a minimal inline fallback using an `<img>` tag or a CSS-only avatar.
- `DropdownMenu` is used at lines 119–126 inside `<slot name="bot-selector">` — the slot already exists. The fallback needs to become a minimal inline `<ul>` dropdown.

**Strategy**: Replace both Chatwoot components with minimal inline HTML fallbacks inside the existing slots. No new slots needed — the slots were added correctly. The fallback just can't import Chatwoot components.

**Before** (lines 17–18):
```javascript
import Avatar from 'dashboard/components-next/avatar/Avatar.vue';
import DropdownMenu from 'dashboard/components-next/dropdown-menu/DropdownMenu.vue';
```

**After**: Remove both import lines.

**Before** (lines 86–95, inside `<slot name="bot-avatar">`):
```html
<slot name="bot-avatar" :bot="currentBot" :size="28">
  <Avatar
    :src="currentBot?.avatar_url"
    :name="currentBot?.name || 'AI'"
    :size="28"
    rounded-full
    icon-name="i-lucide-bot"
    class="flex-shrink-0"
  />
</slot>
```

**After**:
```html
<slot name="bot-avatar" :bot="currentBot" :size="28">
  <!-- Minimal inline avatar fallback: shows image or initials -->
  <span
    class="flex-shrink-0 size-7 rounded-full bg-n-slate-3 flex items-center justify-center overflow-hidden"
  >
    <img
      v-if="currentBot?.avatar_url"
      :src="currentBot.avatar_url"
      :alt="currentBot?.name || 'AI'"
      class="size-full object-cover"
    />
    <span v-else class="text-xs font-medium text-n-slate-11 uppercase">
      {{ (currentBot?.name || 'AI').charAt(0) }}
    </span>
  </span>
</slot>
```

**Before** (lines 113–127, inside `<slot name="bot-selector">`):
```html
<slot
  name="bot-selector"
  :is-open="isBotSelectorOpen"
  :items="botMenuItems"
  :on-select="handleBotSelect"
>
  <DropdownMenu
    v-if="isBotSelectorOpen"
    :menu-items="botMenuItems"
    :thumbnail-size="24"
    class="top-full mt-1 left-0"
    @action="handleBotSelect"
  />
</slot>
```

**After**:
```html
<slot
  name="bot-selector"
  :is-open="isBotSelectorOpen"
  :items="botMenuItems"
  :on-select="handleBotSelect"
>
  <!-- Minimal inline dropdown fallback -->
  <ul
    v-if="isBotSelectorOpen"
    class="absolute top-full mt-1 left-0 z-50 min-w-40 bg-n-solid-2 border border-n-weak rounded-lg shadow-lg py-1"
    role="listbox"
  >
    <li
      v-for="item in botMenuItems"
      :key="item.value"
      role="option"
      :aria-selected="item.isSelected"
      class="flex items-center gap-2 px-3 py-2 text-sm text-n-slate-12 hover:bg-n-alpha-1 cursor-pointer"
      @click="handleBotSelect({ value: item.value })"
    >
      <img
        v-if="item.thumbnail?.src"
        :src="item.thumbnail.src"
        :alt="item.label"
        class="size-6 rounded-full object-cover"
      />
      <span class="size-6 rounded-full bg-n-slate-3 flex-shrink-0" v-else />
      <span>{{ item.label }}</span>
      <span v-if="item.isSelected" class="i-lucide-check size-4 ml-auto text-n-brand" />
    </li>
  </ul>
</slot>
```

**v-tooltip directive**: Lines 137, 147, 159 use `v-tooltip` which is a Chatwoot global directive. This is a separate concern from the component imports — the directive is registered globally in the Chatwoot app and will work in-app. For extraction, it would need to be replaced with a `:title` attribute or a slot. For now, this is **out of scope** for this task (it's a directive, not a component import).

---

#### 3.2 — `AiPromptInput.vue`

**File**: `chatwoot/app/javascript/dashboard/components-next/ai-assistant/input/AiPromptInput.vue`

**Current import to remove**:
- Line 4: `import Button from 'dashboard/components-next/button/Button.vue';`

**Analysis of usage**: `Button` is used at lines 87–97 as the **default content** inside `<slot name="send-button">` — the slot already exists and already passes the correct scoped slot props (`disabled`, `is-loading`, `label`). The fallback just needs to become a native `<button>` element.

**Before** (line 4):
```javascript
import Button from 'dashboard/components-next/button/Button.vue';
```

**After**: Remove this import line.

**Before** (lines 80–98, the submit slot):
```html
<slot
  v-else
  name="send-button"
  :disabled="!canSubmit"
  :is-loading="isLoading"
  :label="t('AI_CHAT.INPUT.SEND')"
>
  <Button
    type="submit"
    :disabled="!canSubmit"
    :is-loading="isLoading"
    :aria-label="t('AI_CHAT.INPUT.SEND')"
    icon="i-lucide-send"
    sm
    solid
    blue
    class="flex-shrink-0"
  />
</slot>
```

**After**:
```html
<slot
  v-else
  name="send-button"
  :disabled="!canSubmit"
  :is-loading="isLoading"
  :label="t('AI_CHAT.INPUT.SEND')"
>
  <!-- Minimal inline submit button fallback -->
  <button
    type="submit"
    :disabled="!canSubmit"
    :aria-label="t('AI_CHAT.INPUT.SEND')"
    class="flex-shrink-0 size-8 rounded-full flex items-center justify-center transition-colors bg-n-brand text-white hover:bg-n-brand-dark disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <span v-if="isLoading" class="i-lucide-loader-2 size-4 animate-spin" />
    <span v-else class="i-lucide-send size-4" />
  </button>
</slot>
```

This fallback is visually equivalent to the Chatwoot `Button` component for this use case (solid blue with send icon). No Chatwoot dependency.

---

#### 3.3 — `AiReasoningPart.vue`

**File**: `chatwoot/app/javascript/dashboard/components-next/ai-assistant/parts/AiReasoningPart.vue`

**Current import to remove**:
- Line 10: `import MessageFormatter from 'shared/helpers/MessageFormatter.js';`

**Analysis of usage**: `MessageFormatter` is used at lines 24–25 as the **fallback** when no `renderMarkdown` prop is provided:
```javascript
const formattedContent = computed(() => {
  if (props.renderMarkdown) return props.renderMarkdown(text.value);
  return new MessageFormatter(text.value).formattedMessage;  // ← Chatwoot dep
});
```

The component already has a `#content` slot at line 45 that receives `:formatted="formattedContent"`. The extraction blocker is that `formattedContent` falls back to `MessageFormatter` when no prop is passed.

**Strategy**: Replace the `MessageFormatter` fallback with a `v-dompurify-html` inline render of the raw text. The `v-dompurify-html` directive is available globally in Chatwoot (it sanitizes HTML), so the default behavior stays safe in-app. Consumers outside Chatwoot must provide `renderMarkdown` prop or use the `#content` slot.

**Before** (line 10):
```javascript
import MessageFormatter from 'shared/helpers/MessageFormatter.js';
```

**After**: Remove this import line.

**Before** (lines 23–26):
```javascript
const formattedContent = computed(() => {
  if (props.renderMarkdown) return props.renderMarkdown(text.value);
  return new MessageFormatter(text.value).formattedMessage;
});
```

**After**:
```javascript
const formattedContent = computed(() => {
  if (props.renderMarkdown) return props.renderMarkdown(text.value);
  // Fallback: return raw text. Consumers should provide renderMarkdown or use #content slot.
  // In-app: v-dompurify-html in the template will sanitize and render HTML if present.
  return text.value;
});
```

The template already has `v-dompurify-html="formattedContent"` at line 47, so the rendered output remains sanitized. The difference: in-app without `renderMarkdown`, text renders as raw text instead of `MessageFormatter`-formatted HTML. If Chatwoot needs the formatted output in production, the `AiChatPanel.vue` that instantiates `AiReasoningPart` should pass `renderMarkdown` explicitly using the Chatwoot formatter:

```javascript
// In AiChatPanel.vue (or wherever AiReasoningPart is used):
import MessageFormatter from 'shared/helpers/MessageFormatter.js';
const renderMarkdown = (text) => new MessageFormatter(text).formattedMessage;

// In template:
// <AiReasoningPart :render-markdown="renderMarkdown" ... />
```

This keeps `MessageFormatter` in the app layer, not in the framework component.

**Verification**:

```bash
# From chatwoot/ directory
grep -r "from 'dashboard/components-next" \
  app/javascript/dashboard/components-next/ai-assistant/ \
  --include="*.vue"
# Should return 0 results after this task

grep -r "from 'shared/helpers" \
  app/javascript/dashboard/components-next/ai-assistant/ \
  --include="*.vue"
# Should return 0 results after this task

# Run existing tests
pnpm test -- --testPathPattern="ai-assistant"
```

---

## Sequencing & Dependencies

```
Task 0 (G4 docs)         → 0 days — do first, parallel with everything
         │
Task 2 (G7 tests)        → 2.5–3 days — do FIRST before any framework code change
         │                  (useAIChat tests especially — safety net for Phase 1)
         ├─────────────────────────────────────────────┐
Task 1 (G6 markdown)     → 0.5 days               Task 3 (G8 Vue)  → 1 day
         │                  (can run after tests)        │           (independent of mobile)
         └────────────────────────────────────┬──────────┘
                                              │
                                    Phase 1: Static Views MVP
                                    (render_view infrastructure)
```

**Why Task 2 must come first**: `useAIChat` is the hook that handles `addToolOutput`, streaming lifecycle, session ID extraction, and `sendAutomaticallyWhen`. Phase 1 of the generative UI framework modifies or extends exactly these paths. Without tests, any regression introduced in Phase 1 will be invisible until manual QA.

**Task 1 and Task 3 are independent** of each other — they can be done in parallel by two developers after Task 2 is complete.

**Task 0** is a 30-minute documentation update — do it any time.

---

## Acceptance Criteria

### G4 (Adapter Wiring) — DONE when:
- [ ] Gap analysis document updated: G4 status changed to `RESOLVED`
- [ ] Comment added to `useAIChatSessions.ts` JSDoc (already partially present at line 36–38) explaining the hybrid pattern explicitly: "reactive reads use selectors, imperative commands use adapter"

### G6 (Markdown Registry) — DONE when:
- [ ] `grep -r "react-native-markdown-display" src/presentation/ai-chat/parts/` returns no results
- [ ] `AITextPart.tsx` has no top-level `import Markdown` statement
- [ ] `AIReasoningPart.tsx` has no top-level `import Markdown` statement
- [ ] `useAIMarkdownRenderer.ts` exists and exports the hook
- [ ] `AIChatProvider` accepts `registry.markdownRenderer` prop
- [ ] Chatwoot app bootstrap passes `Markdown` from `react-native-markdown-display` as `markdownRenderer`
- [ ] Assistant messages with markdown render correctly in simulator (bold, code, lists)
- [ ] Reasoning panel content renders correctly when expanded
- [ ] Existing tests still pass: `pnpm test src/presentation/ai-chat/`

### G7 (Hook Tests) — DONE when:
- [ ] `useAIChat.test.ts` exists with ≥ 15 passing tests covering the cases listed in §2.1
- [ ] `useAIChatSessions.test.ts` exists with ≥ 18 passing tests covering cases in §2.2
- [ ] `useAIChatScroll.test.ts` exists with ≥ 12 passing tests covering cases in §2.3
- [ ] `useAIChatBot.test.ts` exists with ≥ 8 passing tests covering cases in §2.4
- [ ] All new tests pass: `pnpm test src/presentation/ai-chat/hooks/ai-assistant/__tests__/`
- [ ] No existing tests broken: `pnpm test`
- [ ] INV-1 (session ID deferred flush) is explicitly tested in `useAIChat.test.ts`
- [ ] Adapter vs. Redux dispatch branching is explicitly tested in `useAIChatSessions.test.ts`

### G8 (Web Vue Decoupling) — DONE when:
- [ ] `grep -r "from 'dashboard/components-next" chatwoot/app/javascript/dashboard/components-next/ai-assistant/ --include="*.vue"` returns no results
- [ ] `grep -r "from 'shared/helpers" chatwoot/app/javascript/dashboard/components-next/ai-assistant/ --include="*.vue"` returns no results
- [ ] `AiChatHeader.vue` renders its bot avatar and dropdown with the inline fallback when no slots are provided
- [ ] `AiPromptInput.vue` renders the inline send button when no `#send-button` slot is provided
- [ ] `AiReasoningPart.vue` renders reasoning text when no `renderMarkdown` prop is provided
- [ ] `AiChatPanel.vue` (the consumer) is updated to pass `renderMarkdown` to `AiReasoningPart`
- [ ] Existing Vue tests pass: `pnpm test -- --testPathPattern="ai-assistant"` (from `chatwoot/`)

---

## Total Effort Estimate

| Task | Gap | Effort | Notes |
|------|-----|--------|-------|
| Task 0 | G4 doc | 0.5h | Update gap analysis, add JSDoc comment |
| Task 1 | G6 markdown | 0.5d | 4–5 files, low risk |
| Task 2 | G7 hook tests | 2.5–3d | Highest value; `useAIChat` is most complex |
| Task 3 | G8 Vue decoupling | 1d | 3 files + 1 consumer update |
| **Total** | | **~4–4.5 days** | Serial: 4.5d; parallel (2 devs after Task 2): ~3d |

**After these tasks are complete**, all Phase 2 prerequisites are satisfied and Phase 1 (Static Views MVP) can begin with the `render_view` tool call infrastructure.

---

## Next Steps

All gaps in this document are resolved. Phase 1 is now blocked only by two spikes:

- **SPIKE-1**: Verify actual `part` shape for no-execute tool calls in Vercel AI SDK v5. See `spike-1-tool-part-shape.md`.
- **SPIKE-2**: Test 5-block MVP ViewSchema against OpenAI structured output `strict: true`. See `spike-2-openai-strict-schema.md`.

Both spikes are estimated at 0.5 day each. Once complete, Phase 1 (render_view infrastructure) can begin.

See `INDEX.md` for the full phase readiness status.
