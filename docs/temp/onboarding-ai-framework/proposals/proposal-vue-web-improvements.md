# Proposal: Vue Web AI Chat — Improvements & Extraction Preparation

> **Date**: 2026-02-28
> **Author**: Architecture Review (automated)
> **Predecessors**: Research 2F (Vue support evaluation), Research 3A (package extraction design)
> **Scope**: All files in `chatwoot/app/javascript/dashboard/components-next/ai-assistant/`

---

## 1. Executive Summary

The Chatwoot Vue AI chat implementation is **well-structured for an MVP** — clean separation into composables, parts, messages, conversation, feedback, input, and containers. The code is readable, follows Vue 3 Composition API conventions, and has solid test coverage (17 spec files covering all composables and most components).

However, there are **systemic gaps** when compared to the React Native mobile implementation and the extraction target (`@eleva/ai-chat-vue`):

| Category | Severity | Count |
|----------|----------|-------|
| **CRITICAL** — Must fix before production scale | 3 | No TypeScript, no Zod validation, `JSON.parse(JSON.stringify)` deep clone |
| **IMPORTANT** — Should fix before extraction | 8 | Duplicated auth logic, God component (AiChatPanel), no type guards, no part registry, no error categorization reuse, hardcoded API paths, no message validation |
| **MINOR** — Nice to have | 5 | Missing copy action impl, disabled voice/regenerate features, inconsistent naming |

**Key finding**: The Vue codebase has ~2,877 LOC (source, no specs) compared to the RN app's ~3,500 LOC across 33 files. The Vue code is **leaner** but achieves this by omitting features the RN app has: Zod schemas, type guards, message validation, error categorization as reusable logic, tool state derivation helpers, and session message merging with fingerprint memoization.

**Recommendation**: Fix anti-patterns in **two phases** — Phase 1 addresses code quality and correctness (TypeScript migration, validation, de-duping auth). Phase 2 restructures for extraction (configurable interfaces, adapter pattern, registry system). Total estimated effort: **8–12 developer-days**.

---

## 2. File Inventory

### 2.1 Source Files (30 files, 2,877 LOC)

| # | File | LOC | Category |
|---|------|-----|----------|
| 1 | `composables/useVercelChat.js` | 243 | Core — Chat transport wrapper |
| 2 | `composables/useAiAssistant.js` | 177 | App — Orchestrator composable |
| 3 | `composables/useAiChatSessionManager.js` | 295 | App — Session CRUD + persistence |
| 4 | `composables/useAutoScroll.js` | 195 | Core — RAF-based auto-scroll |
| 5 | `composables/useAiMessageMapper.js` | 104 | Core — DTO↔UIMessage transform |
| 6 | `composables/useAutoResizeTextarea.js` | 30 | Utility — Textarea auto-resize |
| 7 | `composables/index.js` | 11 | Barrel export |
| 8 | `constants.js` | 37 | Core — Constants |
| 9 | `provider.js` | 28 | Core — provide/inject context |
| 10 | `index.js` | 45 | Barrel export |
| 11 | `AiAssistant.vue` | 141 | Container — Layout orchestrator |
| 12 | `containers/AiChatPanel.vue` | 575 | Container — Main chat panel (**largest file**) |
| 13 | `conversation/AiConversation.vue` | 69 | UI — Scroll container + buttons |
| 14 | `conversation/AiConversationContent.vue` | 9 | UI — Content wrapper |
| 15 | `conversation/AiConversationEmptyState.vue` | 26 | UI — Empty state |
| 16 | `message/AiMessage.vue` | 62 | UI — Message row + avatar |
| 17 | `message/AiMessageContent.vue` | 25 | UI — Bubble wrapper |
| 18 | `message/AiMessageActions.vue` | 10 | UI — Actions container |
| 19 | `message/AiMessageAction.vue` | 43 | UI — Single action button |
| 20 | `parts/AiPartRenderer.vue` | 42 | Core — Part dispatch |
| 21 | `parts/AiTextPart.vue` | 35 | UI — Markdown text part |
| 22 | `parts/AiToolPart.vue` | 59 | UI — Tool call display |
| 23 | `parts/AiReasoningPart.vue` | 55 | UI — Reasoning/thinking display |
| 24 | `parts/AiCollapsiblePart.vue` | 138 | UI — Collapsible container |
| 25 | `input/AiPromptInput.vue` | 82 | UI — Text input + send button |
| 26 | `input/AiVoiceButton.vue` | 112 | UI — Voice input button (disabled) |
| 27 | `feedback/AiChatError.vue` | 181 | UI — Error display |
| 28 | `feedback/AiLoader.vue` | 16 | UI — Loading indicator |
| 29 | `suggestions/AiSuggestions.vue` | 16 | UI — Suggestion list container |
| 30 | `suggestions/AiSuggestion.vue` | 16 | UI — Single suggestion chip |

### 2.2 Test Files (17 files)

| # | Spec File | Tests |
|---|-----------|-------|
| 1 | `composables/specs/useVercelChat.spec.js` | 15 tests |
| 2 | `composables/specs/useAiAssistant.spec.js` | 20 tests |
| 3 | `composables/specs/useAiChatSessionManager.spec.js` | Tests session CRUD |
| 4 | `composables/specs/useAiMessageMapper.spec.js` | Tests DTO mapping |
| 5 | `composables/specs/useAutoScroll.spec.js` | Tests scroll behavior |
| 6 | `composables/specs/useAutoResizeTextarea.spec.js` | Tests textarea resize |
| 7 | `conversation/specs/AiConversation.spec.js` | Tests scroll container |
| 8 | `conversation/specs/AiConversationEmptyState.spec.js` | Tests empty state |
| 9 | `feedback/specs/AiChatError.spec.js` | Tests error display |
| 10 | `feedback/specs/AiLoader.spec.js` | Tests loader |
| 11 | `input/specs/AiPromptInput.spec.js` | Tests input field |
| 12 | `message/specs/AiMessage.spec.js` | Tests message row |
| 13 | `parts/specs/AiPartRenderer.spec.js` | Tests part dispatch |
| 14 | `parts/specs/AiTextPart.spec.js` | Tests text rendering |
| 15 | `parts/specs/AiToolPart.spec.js` | Tests tool display |
| 16 | `parts/specs/AiReasoningPart.spec.js` | Tests reasoning display |
| 17 | `parts/specs/AiCollapsiblePart.spec.js` | Tests collapsible |

### 2.3 Supporting Files

| File | LOC | Purpose |
|------|-----|---------|
| `i18n/locale/en/aiChat.json` | 103 | English translations |
| `i18n/locale/es/aiChat.json` | — | Spanish translations |
| `assets/images/eleva_ai/icon-ai-on.svg` | — | AI icon asset |

---

## 3. Architecture Overview

### 3.1 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Dashboard.vue                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    AiAssistant.vue                         │  │
│  │  useAiAssistant() composable                              │  │
│  │    ├── useVercelChat()  → Chat class (@ai-sdk/vue)        │  │
│  │    │   ├── DefaultChatTransport (SSE streaming)           │  │
│  │    │   ├── Auth headers (Devise token)                    │  │
│  │    │   ├── Polling workaround (50ms interval)             │  │
│  │    │   └── Reactive: messages, status, error (refs)       │  │
│  │    ├── useAiChatSessionManager()                          │  │
│  │    │   ├── Fetch sessions/messages (raw fetch)            │  │
│  │    │   ├── LocalStorage persistence                       │  │
│  │    │   └── toUIMessages() mapper                          │  │
│  │    ├── Bot fetching (raw fetch)                           │  │
│  │    └── Vuex store (getCurrentUser only)                   │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │          AiChatPanel.vue (575 LOC)                  │  │  │
│  │  │  ├── provideAiChatContext()                         │  │  │
│  │  │  ├── Header + bot selector + session history        │  │  │
│  │  │  ├── AiConversation → useAutoScroll()               │  │  │
│  │  │  │   ├── AiMessage → AiMessageContent               │  │  │
│  │  │  │   │   └── AiPartRenderer → computed dispatch     │  │  │
│  │  │  │   │       ├── AiTextPart (MessageFormatter)      │  │  │
│  │  │  │   │       ├── AiReasoningPart (collapsible)      │  │  │
│  │  │  │   │       └── AiToolPart (collapsible)           │  │  │
│  │  │  │   └── AiLoader                                   │  │  │
│  │  │  ├── AiChatError                                    │  │  │
│  │  │  └── AiPromptInput                                  │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Key Design Decisions

1. **No Vuex/Pinia for AI state** — All AI chat state is managed via composable-local `ref()`s and the `@ai-sdk/vue` `Chat` class. The Vuex store is only used for `getCurrentUser`. This is **good** — it avoids coupling to Chatwoot's store and makes extraction easier.

2. **Polling workaround for reactivity** — `useVercelChat.js` polls the `Chat` class every 50ms during streaming, deep-cloning messages via `JSON.parse(JSON.stringify(...))`. This is a known AI SDK Vue limitation (see [GitHub discussion #7510](https://github.com/vercel/ai/discussions/7510)).

3. **Provide/inject context** — `provideAiChatContext` shares `status`, `isStreaming`, `sendMessage`, `clearError` with child components. This is the correct Vue pattern.

4. **Lazy-loaded parts** — `AiPartRenderer.vue` uses `defineAsyncComponent` for `AiReasoningPart` and `AiToolPart` (only `AiTextPart` is eagerly loaded). Good for bundle size.

5. **Raw `fetch()` for non-streaming API calls** — Bot fetching and session CRUD use `window.fetch` directly instead of Chatwoot's Axios `apiService`. This creates separate auth header management.

---

## 4. Anti-Patterns and Issues

### 4.1 CRITICAL Issues

#### C1: No TypeScript — All Files Are Plain JavaScript

**Files affected**: All 30 source files (`.js` and `<script setup>` without `lang="ts"`)

**Problem**: The entire AI chat feature is written in plain JavaScript. Props use Vue's runtime `type` validators (e.g., `{ type: Object, required: true }`) instead of TypeScript interfaces. Function parameters have no type annotations. Return values are untyped.

**Impact**:
- No compile-time safety for message parts, tool states, or chat status
- Consumers of composables don't know what shape the return value has without reading docs
- Refactoring is error-prone — renaming a property won't surface broken references
- The RN mobile app uses full TypeScript with explicit types for every part, tool state, and message

**Comparison**: The RN app's `types/parts.ts` (286 LOC) defines `TextPart`, `ReasoningPart`, `ToolPart`, `BasePart` etc. with discriminated unions and type guards. The Vue app has zero equivalent — `part.type` is checked as raw strings everywhere.

**Recommendation**: Migrate to `<script setup lang="ts">` and `.ts` composables. Define interfaces for all core types. Effort: 2-3 days for the migration, but this is prerequisite for extraction.

#### C2: No Zod Validation for Backend Data

**Files affected**: `useAiMessageMapper.js`, `useAiChatSessionManager.js`, `useAiAssistant.js`

**Problem**: Backend API responses are consumed with zero validation. The `toUIMessage()` mapper assumes the backend returns objects with `messageRole`, `content`, `sentDate`, etc. but never validates this. The session fetching assumes `data.sessions` is an array of correctly-shaped objects.

**Impact**:
- A backend schema change silently produces malformed UI state
- No way to detect if the backend returns unexpected part types
- The RN app has `aiChatSchemas.ts` (79 LOC) with Zod schemas that parse every backend response

**Comparison**: RN has `BotSchema`, `SessionSchema`, `MessageSchema`, `PartSchema` — all Zod schemas with parse functions. Vue has none.

**Recommendation**: Add Zod schemas matching the RN app's `aiChatSchemas.ts`. Chatwoot already has `zod@^4.1.13` in `package.json`. Effort: 0.5 days.

#### C3: `JSON.parse(JSON.stringify)` for Deep Clone During Streaming

**File**: `useVercelChat.js:148`

```javascript
const syncState = () => {
  messages.value = JSON.parse(JSON.stringify(chat.messages));
  ...
};
```

**Problem**: `JSON.parse(JSON.stringify(...))` runs every 50ms during streaming. For a conversation with many messages containing tool parts with JSON input/output, this is expensive. It also silently drops `undefined` values, `Date` objects (converts to strings), `RegExp`, `Symbol`, and any non-JSON-serializable data.

**Impact**:
- Performance degrades with conversation length (O(n) serialization every 50ms)
- `Date` objects in `createdAt` fields are converted to strings silently
- Potential data loss for edge-case part types

**Recommendation**: Replace with `structuredClone()` (native, handles Dates correctly and is faster for large objects) or a targeted reactive clone that only copies changed messages. `structuredClone` is available in all modern browsers and Node 17+. Effort: 0.5 hours.

---

### 4.2 IMPORTANT Issues

#### I1: God Component — `AiChatPanel.vue` (575 LOC)

**File**: `containers/AiChatPanel.vue`

**Problem**: This single file handles:
- Bot selector dropdown UI + state
- Session history panel UI + state
- Chat message rendering with part splitting
- Error handling delegation
- Input handling delegation
- Avatar resolution
- Status computation
- Context provision
- Date formatting for sessions

This is the classic "God component" anti-pattern. It has 16 props, 5 emits, and ~20 local computed/functions.

**Impact**:
- Difficult to test in isolation (too many concerns)
- Changes to session UI risk breaking message rendering
- Cannot reuse the message rendering logic without the bot selector
- Extraction would require splitting this into multiple components

**Recommendation**: Extract into focused sub-components:
- `AiChatHeader.vue` — Header + bot selector + session controls
- `AiSessionHistoryPanel.vue` — Session history overlay
- `AiChatPanel.vue` — Slim orchestrator (passes props down)

**[UPDATED after cross-platform review]** Additionally, the part-splitting logic (`getReasoningParts`, `getToolParts`, `getTextParts`, `hasTextContent`) currently inline in `AiChatPanel.vue` (lines 194-230) should be extracted to `utils/partHelpers.ts` as pure functions that match the mobile's `types/ai-chat/parts.ts` API: `getReasoningParts()`, `getToolParts()`, `getTextParts()`, `getDeduplicatedToolParts()`, `hasReasoningParts()`, `hasToolParts()`. The mobile has 20+ such helpers already — the web currently has zero reusable part helpers. This matches the RN architecture where `AIChatHeader.tsx`, `AIChatSessionPanel.tsx`, and `AIChatInterface.tsx` are separate files. Effort: 1 day.

#### I2: Duplicated Auth Header Logic

**Files**: `useVercelChat.js:30-44`, `useAiChatSessionManager.js:30-41`, `useAiAssistant.js:35-46`

**Problem**: The `getAuthHeaders()` function is copy-pasted three times across three different files. All three implementations are nearly identical, reading from `Auth.getAuthData()`.

**Impact**:
- If the auth scheme changes, three files must be updated
- Risk of divergence (one file updated, others forgotten)
- Extraction must identify and consolidate this

**Recommendation**: Extract to a single `getAuthHeaders()` in a shared utility file (e.g., `utils/auth.js`). Effort: 0.5 hours.

#### I3: No Type Guards for Parts

**Files**: `AiChatPanel.vue:194-224`, `AiPartRenderer.vue:22-31`

**Problem**: Part type checking uses raw string comparisons:
```javascript
const isToolPart = part => part?.type?.startsWith('tool-');
```
```javascript
if (partType?.startsWith('tool-')) { return AiToolPart; }
```

These are duplicated across files and have no type narrowing. The string `'tool-'` prefix is assumed but never validated.

**Comparison**: The RN app's `types/parts.ts` has 20+ type guard functions: `isTextPart()`, `isToolPart()`, `isReasoningPart()`, `isToolExecuting()`, `isToolComplete()`, `isToolError()`, `getDeduplicatedToolParts()`, `getTextParts()`, etc. Each narrows the TypeScript type properly.

**Impact**:
- No type narrowing after the check
- Part-splitting logic in `AiChatPanel.vue` (lines 196-224) is duplicated inline instead of being reusable helpers
- Adding a new part type requires editing multiple files

**Recommendation**: Create `utils/partHelpers.ts` with typed guard functions matching the RN app's pattern. Effort: 0.5 days.

#### I4: No Part Registry Pattern

**File**: `AiPartRenderer.vue`

**Problem**: The part dispatch uses a hardcoded object map:
```javascript
const partTypeMap = {
  [PART_TYPES.TEXT]: AiTextPart,
  [PART_TYPES.REASONING]: AiReasoningPart,
};
```

Adding a new part type requires modifying `AiPartRenderer.vue`. There's no way for consumers (or the slides feature) to register custom part renderers at runtime.

**Comparison**: The RN extraction design (Research 3A Section 7) defines a `ComponentRegistry<TComponent>` class with `register()`, `get()`, `has()` methods. The Vue equivalent would use `provide`/`inject` or a module-level Map.

**Recommendation**: Add a `PartRegistry` (as designed in Research 3A Section 7.3) using a module-level `Map`. This is critical for the generative slides feature which needs to register `SlideToolRenderer` as a custom tool part. Effort: 0.5 days.

#### I5: No Error Categorization Reuse

**File**: `feedback/AiChatError.vue:46-53`

**Problem**: Error categorization logic (`categorizeError`) is embedded inside the Vue component:
```javascript
const errorCategory = computed(() => {
  const msg = props.error.message?.toLowerCase() || '';
  if (msg.includes('network') || msg.includes('fetch')) return 'network';
  ...
});
```

This logic is pure — it takes an error and returns a category. It should be a standalone function.

**Comparison**: The RN extraction design (Research 3A Section 3.1) identifies `categorizeError` as a CORE function that belongs in `@eleva/ai-chat-core/utils/error.ts`.

**Recommendation**: Extract to a pure `categorizeError(error: Error): ErrorCategory` function in `utils/errorHelpers.ts`. Effort: 0.5 hours.

#### I6: Hardcoded API Paths

**Files**: `useAiAssistant.js:58`, `useAiAssistant.js:113`, `useAiChatSessionManager.js:118,153,231`

**Problem**: API endpoints are constructed inline:
```javascript
api: `/api/v1/accounts/${accountId.value}/ai_chat/stream`,
```
```javascript
`/api/v1/accounts/${accountId}/ai_chat/sessions?agent_bot_id=${botId}&limit=${limit}`
```

**Impact**:
- Cannot use this code with a different backend URL pattern
- No centralized API path configuration
- Extraction requires replacing with configurable endpoints

**Recommendation**: Create an API client abstraction or configuration object. For now, extract paths to constants. For extraction, replace with `ChatConfig.streamEndpoint` and `SessionsAdapter` per Research 3A. Effort: 0.5 days.

#### I7: No Message Validation

**File**: `useAiMessageMapper.js`

**Problem**: The `toUIMessage()` function trusts all backend data. It doesn't validate that `role` is one of the expected values, that `parts` are properly formed, or that timestamps are valid dates.

**Comparison**: The RN app has `aiChatMessageUtils.ts` (78 LOC) with `validateMessage()`, `validateAndNormalizeParts()`, and `validateAndNormalizeMessages()`.

**Recommendation**: Add validation functions matching the RN pattern. Can use Zod schemas (from C2 fix) for this. Effort: 0.5 days.

#### I8: Session Manager Uses Non-Reactive `accountId` Parameter

**File**: `useAiChatSessionManager.js:61`

**Problem**: The `accountId` parameter is captured by value at composable creation time:
```javascript
export function useAiChatSessionManager(accountId) {
  // accountId used as closure variable, not reactive
  const fetchSessions = async (botId, limit = 25) => {
    if (!accountId || !botId) return [];
    // ...
    const response = await fetch(`/api/v1/accounts/${accountId}/ai_chat/sessions...`);
  };
```

In `useAiAssistant.js:54`, it's called as:
```javascript
const sessionManager = useAiChatSessionManager(accountId.value);
```

This captures `accountId.value` at composable creation time. If the user switches accounts (unlikely in Chatwoot's UX, but possible), the session manager would still use the old account ID.

**Recommendation**: Accept a `Ref<number>` and unwrap reactively, or accept the current behavior as acceptable for the Chatwoot use case. Low severity but matters for extraction where account switching might occur. Effort: 0.5 hours.

---

### 4.3 MINOR Issues

#### M1: Message Actions Are Disabled Stubs

**File**: `AiChatPanel.vue:526-535`

```vue
<AiMessageAction icon="i-lucide-copy" :label="t('AI_CHAT.MESSAGE.COPY')" disabled />
<AiMessageAction icon="i-lucide-refresh-ccw" :label="t('AI_CHAT.MESSAGE.REGENERATE')" disabled />
```

Both Copy and Regenerate actions are rendered but permanently disabled. The RN app has working copy-to-clipboard via `Clipboard.setString()`.

**Recommendation**: Implement copy using `navigator.clipboard.writeText()`. Regenerate can stay disabled until the backend supports it. Effort: 0.5 hours.

#### M2: Voice Input is Visual-Only

**File**: `input/AiVoiceButton.vue`

The voice button is permanently disabled (`VOICE_INPUT_STATUS.DISABLED`). The component is well-structured for future use but currently non-functional.

**Recommendation**: No action needed until voice feature is prioritized. The component structure is ready.

#### M3: `useCamelCase` Called Inside Functions (Not Composable Pattern)

**File**: `useAiChatSessionManager.js:128`, `useAiMessageMapper.js:29`

```javascript
const transformed = useCamelCase(data, { deep: true });
```

`useCamelCase` is imported from `dashboard/composables/useTransformKeys` but used as a plain function inside async methods, not as a composable with lifecycle hooks. The name is misleading.

**Recommendation**: This is a Chatwoot convention, not a bug. For extraction, replace with a plain `toCamelCase()` utility. Effort: trivial.

#### M4: `toUIMessages` Reversal Logic is Ambiguous

**File**: `useAiChatSessionManager.js:187`

```javascript
const uiMessages = toUIMessages(messages).reverse();
```

The `.reverse()` is called by the consumer, not the mapper. The JSDoc in `toUIMessages` doesn't document whether it returns chronological or reverse-chronological order. This creates a coupling: the consumer must know the backend returns newest-first.

**Recommendation**: Document the expected order or normalize inside the mapper. Effort: trivial.

#### M5: Inconsistent Naming Between RN and Vue

| Concept | RN Name | Vue Name |
|---------|---------|----------|
| Chat hook | `useAIChat` | `useVercelChat` |
| Session manager | `useAIChatSessions` | `useAiChatSessionManager` |
| Message mapper | `aiChatMapper` | `useAiMessageMapper` |
| Orchestrator composable | N/A (in AIChatInterface) | `useAiAssistant` |
| Main container | `AIChatInterface` | `AiChatPanel` |
| Message list | `AIChatMessagesList` | `AiConversation` |
| Message row | `AIMessageBubble` | `AiMessage` |

**[UPDATED after cross-platform review]** This naming divergence is more significant than originally assessed. When both platforms import from `@eleva/ai-chat-core`, the canonical names will be the CORE names. The web should rename during Phase 1 TS migration to align: `useVercelChat` → `useAIChat`, `useAiChatSessionManager` → `useAIChatSessions`, `useAiMessageMapper` → standalone functions in `utils/messageMapper.ts` (not a composable — the mobile already uses plain functions in `aiChatMapper.ts`). Effort: included in TS migration (no additional cost if done during that refactor).

---

## 5. Feature Gap Analysis: Vue vs React Native

### 5.1 Features in RN but Missing in Vue

| Feature | RN Implementation | Vue Status | Extraction Priority |
|---------|-------------------|------------|---------------------|
| **TypeScript** | Full TS with interfaces, type guards | Plain JS | CRITICAL |
| **Zod schemas** | `aiChatSchemas.ts` — validates all backend data | None | CRITICAL |
| **Type guards** | 20+ guards in `types/parts.ts` | Inline string checks | HIGH |
| **Message validation** | `validateMessage()`, `validateAndNormalizeParts()` | None | HIGH |
| **Error categorization as pure function** | `categorizeError()` in `AIChatError.tsx` | Inline in component computed | MEDIUM |
| **Tool state helpers** | `isToolExecuting()`, `isToolComplete()`, `deriveToolDisplayState()` | None — tool state not derived | MEDIUM |
| **Deduplication by toolCallId** | In `getDeduplicatedToolParts()` | Inline in `AiChatPanel.vue:203-216` | MEDIUM |
| **Session message merging** | `useAIChatMessages.ts` — fingerprint memoization | None — messages replaced wholesale | LOW |
| **Copy to clipboard** | Working via `Clipboard.setString()` | Disabled stub | LOW |
| **Streaming cursor animation** | Animated with `react-native-reanimated` | CSS `animate-pulse` block | LOW (acceptable) |
| **Part registry** | Planned in extraction (Research 3A §7) | Hardcoded map | MEDIUM |
| **Theme token system** | `styles/tokens.ts` (361 LOC) | Tailwind classes inline | LOW (Tailwind is fine) |
| **Background/foreground handling** | `AppState.addEventListener` | N/A (web doesn't need this) | N/A |
| **FlashList virtualization** | `FlashList` for large lists | DOM scroll (no virtualization) | LOW (OK for web) |

### 5.2 Features in Vue but Missing/Different in RN

| Feature | Vue Implementation | RN Status | Notes |
|---------|-------------------|-----------|-------|
| **Bot selector dropdown** | Full UI with `DropdownMenu`, avatar display | `useAIChatBot.ts` fetches bots but no dropdown UI | Vue has richer bot selection UX |
| **Session history panel** | Full overlay panel with date formatting, delete | `AIChatSessionPanel.tsx` uses BottomSheet | Similar, different presentation |
| **Layout modes** | `floating`, `sidebar`, `inline` via `AiAssistant.vue` | `FloatingAIAssistant.tsx` (floating only) | Vue supports more layout options |
| **Voice input button** | Visual stub ready for implementation | Not present | Vue is ahead (UI ready) |
| **Suggestion chips** | `AiSuggestions.vue` + `AiSuggestion.vue` | `AIChatEmptyState.tsx` has suggested prompts | Similar concept |
| **Auto-resize textarea** | `useAutoResizeTextarea.js` | Not needed (RN TextInput auto-resizes) | Web-specific |
| **RAF-based scroll** | `useAutoScroll.js` with `useRafFn` | `useAIChatScroll.ts` with `scrollToEnd` | Vue approach is more sophisticated |
| **Lazy-loaded parts** | `defineAsyncComponent` for reasoning/tool | All eagerly loaded | Vue optimizes bundle size |
| **`@vueuse/core` integration** | `useToggle`, `useRafFn`, `useEventListener`, `OnClickOutside` | N/A | Leverages Vue ecosystem well |

### 5.3 Parity Summary

```
Feature completeness:
  RN:  ████████████████████ 100% (baseline)
  Vue: ████████████████░░░░  80%

Missing in Vue: TypeScript, Zod, type guards, message validation, tool state derivation
Missing in RN:  Layout modes, bot selector UI, voice button stub, RAF scroll
```

---

## 6. Phase 1 Recommendations: Fix Anti-Patterns

These changes improve code quality **within the Chatwoot codebase** without any extraction concerns. They should be done first because extraction amplifies existing problems.

### 6.1 Migrate to TypeScript (C1)

**Scope**: All 8 `.js` source files → `.ts`, all 22 `.vue` files get `lang="ts"`

**[UPDATED after cross-platform review]** The type interfaces should NOT be invented from scratch. They should import from `@eleva/ai-chat-core` (once extracted) or replicate the exact same interfaces already defined in the mobile codebase at `types/ai-chat/parts.ts` (286 LOC) and `types/ai-chat/constants.ts` (88 LOC). Specifically: `BasePart`, `TextPart`, `ReasoningPart`, `ToolCallPart`, `ToolResultPart`, `ToolPart`, `MessagePart`, and all type guards must match the mobile's signatures exactly.

**Steps**:
1. Convert `constants.js` → `constants.ts` with `as const` assertions — **align with mobile's `constants.ts` which defines `PART_TYPES`, `TOOL_STATES`, `CHAT_STATUS`, `MESSAGE_ROLES` with 16 values (web currently has only 5 `PART_TYPES` and no `TOOL_STATES` for tool sub-states)**
2. Create `types.ts` by **porting** the mobile's `types/ai-chat/parts.ts` interfaces: `BasePart`, `TextPart`, `ReasoningPart`, `ToolCallPart`, `ToolResultPart`, `ToolPart`, `MessagePart`, plus `ChatSession`, `Bot`, `AiChatContext`
3. Convert composables from `.js` → `.ts` with parameter/return types
4. Add `lang="ts"` to all `<script setup>` blocks
5. Replace runtime prop validators with TypeScript interfaces (using `defineProps<T>()`)
6. Update spec files to match new imports (no type changes needed in tests)

**Effort**: 2–3 days

### 6.2 Add Zod Schemas (C2)

**[UPDATED after cross-platform review]** Do NOT create new schemas from scratch. Port the mobile's `store/ai-chat/aiChatSchemas.ts` (79 LOC) which already defines `AIChatBotApiSchema`, `AIChatSessionApiSchema`, `AIChatMessageApiSchema`, `AIChatMessagePartApiSchema` with parse functions. The mobile also uses `z.infer<>` to derive types from schemas — the web should follow the same pattern to ensure schema-type alignment. Note: Chatwoot web uses Zod `^4.1.13` while mobile uses `^3.x`; the schemas are compatible but the web should use Zod v4 syntax. The core package will declare `"zod": "^3.0.0 || ^4.0.0"` as peer dep.

**Port from mobile** `aiChatSchemas.ts` (79 LOC), adapting field names if the web backend returns different shapes:

```typescript
import { z } from 'zod';

export const AIChatBotApiSchema = z.object({
  id: z.number(),
  name: z.string(),
  avatar_url: z.string().optional(),
  description: z.string().optional(),
});

export const AIChatSessionApiSchema = z.object({
  chat_session_id: z.string(),
  updated_at: z.string(),
  created_at: z.string().optional(),
  agent_bot_id: z.number().optional(),
  account_id: z.number().optional(),
});

export const AIChatMessagePartApiSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
  toolName: z.string().optional(),
  toolCallId: z.string().optional(),
  args: z.record(z.string(), z.unknown()).optional(),
  result: z.unknown().optional(),
  state: z.string().optional(),
});

export const AIChatMessageApiSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.string(),
  chat_session_id: z.string().optional(),
  parts: z.array(AIChatMessagePartApiSchema).optional(),
});

// Infer types from schemas (single source of truth)
export type AIChatBot = z.infer<typeof AIChatBotApiSchema>;
export type AIChatSession = z.infer<typeof AIChatSessionApiSchema>;
export type AIChatMessage = z.infer<typeof AIChatMessageApiSchema>;

// Parse functions
export const parseBotsResponse = (raw: unknown) => AIChatBotsResponseSchema.parse(raw);
export const parseSessionsResponse = (raw: unknown) => AIChatSessionsResponseSchema.parse(raw);
export const parseMessagesResponse = (raw: unknown) => AIChatMessagesResponseSchema.parse(raw);
```

**Effort**: 0.5 days

### 6.3 Fix Deep Clone Performance (C3)

**File**: `useVercelChat.js:148`

**Change**:
```javascript
// Before
messages.value = JSON.parse(JSON.stringify(chat.messages));

// After
messages.value = structuredClone(chat.messages);
```

**Effort**: 5 minutes

### 6.4 Split AiChatPanel.vue (I1)

**Extract from** `AiChatPanel.vue` (575 LOC):
- `AiChatHeader.vue` (~120 LOC) — Bot selector, status, session/new/close buttons
- `AiSessionHistoryPanel.vue` (~100 LOC) — Session list overlay
- `AiChatPanel.vue` stays as slim orchestrator (~300 LOC)

**Effort**: 1 day

### 6.5 Consolidate Auth Headers (I2)

**Create**: `utils/auth.ts`

```typescript
import Auth from 'dashboard/api/auth';

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (Auth.hasAuthCookie()) {
    const authData = Auth.getAuthData();
    Object.assign(headers, {
      'access-token': authData['access-token'],
      'token-type': authData['token-type'],
      client: authData.client,
      expiry: authData.expiry,
      uid: authData.uid,
    });
  }
  return headers;
}
```

Replace all three duplications. **Effort**: 0.5 hours.

### 6.6 Add Type Guards and Part Helpers (I3)

**Create**: `utils/partHelpers.ts` (~100 LOC)

```typescript
import type { TextPart, ReasoningPart, ToolPart, MessagePart } from './types';
import { PART_TYPES } from '../constants';

export function isTextPart(part: MessagePart): part is TextPart {
  return part.type === PART_TYPES.TEXT;
}

export function isToolPart(part: MessagePart): part is ToolPart {
  return part.type?.startsWith('tool-') ?? false;
}

export function isReasoningPart(part: MessagePart): part is ReasoningPart {
  return part.type === PART_TYPES.REASONING;
}

export function getTextParts(parts: MessagePart[]): TextPart[] {
  return parts.filter(isTextPart);
}

export function getReasoningParts(parts: MessagePart[]): ReasoningPart[] {
  return parts.filter(isReasoningPart);
}

export function getDeduplicatedToolParts(parts: MessagePart[]): ToolPart[] {
  const toolMap = new Map<string, ToolPart>();
  parts.filter(isToolPart).forEach(part => {
    if (part.toolCallId) toolMap.set(part.toolCallId, part);
  });
  return Array.from(toolMap.values());
}
```

Then replace inline logic in `AiChatPanel.vue:194-224` with imported helpers. **Effort**: 0.5 days.

### 6.7 Implement Copy Action (M1)

**File**: `AiChatPanel.vue` (or extracted `AiMessageActions` logic)

```typescript
const handleCopy = async (message: UIMessage) => {
  const text = getTextParts(message.parts).map(p => p.text).join('');
  await navigator.clipboard.writeText(text);
  // Show toast notification
};
```

**Effort**: 0.5 hours

### Phase 1 Total Effort: **5–7 days**

---

## 7. Phase 2 Recommendations: Prepare for Extraction

These changes restructure the code to match the `@eleva/ai-chat-vue` package design from Research 3A.

### 7.1 Create Configurable Interfaces

**New files** (would live in `@eleva/ai-chat-core` after extraction):

```typescript
// types/chat.ts
export interface ChatConfig {
  streamEndpoint: string | (() => string);
  getHeaders: () => Record<string, string> | Promise<Record<string, string>>;
  prepareRequest?: (options: PrepareRequestOptions) => { body: Record<string, unknown>; headers: Record<string, string> };
  parseError?: (response: Response) => Promise<string>;
  persistence?: PersistenceAdapter;
  i18n?: I18nProvider;
  user?: { name?: string; avatarUrl?: string };
  bot?: { id: number; name?: string; avatarUrl?: string };
}

export interface PersistenceAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface I18nProvider {
  t(key: string, params?: Record<string, unknown>): string;
}
```

**Effort**: 0.5 days

### 7.2 Replace Hardcoded API Calls with Adapter Pattern

**Change** `useAiChatSessionManager.js` to accept a `SessionsAdapter`:

```typescript
export interface SessionsAdapter {
  fetchSessions(params: { agentBotId: number; limit?: number }): Promise<ChatSession[]>;
  fetchMessages(params: { sessionId: string; limit?: number }): Promise<BackendMessage[]>;
  deleteSession?(sessionId: string): Promise<void>;
}
```

The Chatwoot app would provide:
```typescript
const chatwootSessionsAdapter: SessionsAdapter = {
  fetchSessions: async ({ agentBotId, limit }) => {
    const response = await fetch(
      `/api/v1/accounts/${accountId}/ai_chat/sessions?agent_bot_id=${agentBotId}&limit=${limit}`,
      { headers: getAuthHeaders() }
    );
    return (await response.json()).sessions;
  },
  // ... etc
};
```

**Effort**: 1 day

### 7.3 Replace Hardcoded i18n with Pluggable Provider

**Change**: Components currently import `useI18n` from `vue-i18n` and call `t('AI_CHAT.HEADER.TITLE')`. For the extracted package, use `inject`:

```typescript
// Package provides a default i18n (English strings)
export function useAiI18n(): I18nProvider {
  return inject(AI_I18N_KEY, defaultEnglishI18n);
}
```

Consumers override by providing their own i18n via `provide(AI_I18N_KEY, vueI18nAdapter)`.

**Effort**: 1 day

### 7.4 Add Part Registry

**Create** a module-level `ComponentRegistry` as designed in Research 3A §7.3:

```typescript
// registry/partRegistry.ts
import { ComponentRegistry } from '@eleva/ai-chat-core';
import type { DefineComponent } from 'vue';

const partRegistry = new ComponentRegistry<DefineComponent>();
const toolRegistry = new ComponentRegistry<DefineComponent>();

// Pre-register defaults
import AiTextPart from '../parts/AiTextPart.vue';
import AiToolPart from '../parts/AiToolPart.vue';
import AiReasoningPart from '../parts/AiReasoningPart.vue';

partRegistry.register('text', AiTextPart);
partRegistry.register('reasoning', AiReasoningPart);

export function registerPartRenderer(type: string, component: DefineComponent) {
  partRegistry.register(type, component);
}

export function registerToolRenderer(toolName: string, component: DefineComponent) {
  toolRegistry.register(toolName, component);
}
```

Update `AiPartRenderer.vue` to check registries before the hardcoded map.

**Effort**: 0.5 days

### 7.5 Extract Pure Functions to Shared Utils

**Move** these from components to standalone modules:

| Function | Current Location | Target |
|----------|-----------------|--------|
| `categorizeError()` | `AiChatError.vue` (computed) | `utils/errorHelpers.ts` |
| `formatSessionDate()` | `AiChatPanel.vue` (local fn) | `utils/formatHelpers.ts` |
| `formatSessionTime()` | `AiChatPanel.vue` (local fn) | `utils/formatHelpers.ts` |
| `extractTextContent()` | `useVercelChat.js` (local fn) | `utils/messageHelpers.ts` |
| `getReasoningParts()` | `AiChatPanel.vue` (local fn) | `utils/partHelpers.ts` |
| `getToolParts()` | `AiChatPanel.vue` (local fn) | `utils/partHelpers.ts` |
| `getTextParts()` | `AiChatPanel.vue` (local fn) | `utils/partHelpers.ts` |
| `hasTextContent()` | `AiChatPanel.vue` (local fn) | `utils/partHelpers.ts` |

**Effort**: 0.5 days

### 7.6 Replace Chatwoot-Specific Dependencies

| Dependency | Current Usage | Extraction Replacement |
|------------|---------------|----------------------|
| `dashboard/api/auth` (Auth) | Auth header generation | `config.getHeaders()` |
| `dashboard/composables/store` (Vuex) | `getCurrentUser` | `config.user` |
| `shared/helpers/localStorage` (LocalStorage) | Session persistence | `config.persistence` (PersistenceAdapter) |
| `dashboard/composables/useTransformKeys` (useCamelCase) | Backend response transform | Inline `toCamelCase()` utility |
| `shared/helpers/MessageFormatter.js` | Markdown rendering | `markdown-it` directly or configurable renderer |
| `dashboard/components-next/avatar/Avatar.vue` | User/bot avatars | Package includes default avatar or uses slot |
| `dashboard/components-next/button/Button.vue` | Submit button | Package includes default button or uses slot |
| `dashboard/components-next/dropdown-menu/DropdownMenu.vue` | Bot selector | Package includes default dropdown or uses slot |
| `dashboard/components-next/panels/*` (FloatingPanel, SidebarPanel) | Layout containers | Package provides default containers; consumer can override |
| `vue-i18n` | `useI18n().t()` | `I18nProvider` interface + default English strings |
| `@vueuse/core` | Toggle, RAF, event listeners | Keep as peer dependency (widely used) |
| `@vueuse/components` | OnClickOutside | Keep as peer dependency |

**Effort**: 2 days

### Phase 2 Total Effort: **5–6 days**

---

## 8. File-by-File Recommendation Table

| File | Current Issues | Fix First (Phase 1) | Then for Extraction (Phase 2) |
|------|---------------|---------------------|-------------------------------|
| `composables/useVercelChat.js` | JS, `JSON.parse(JSON.stringify)`, duplicated auth, `extractTextContent` is local | → `.ts`, `structuredClone`, import shared auth, move `extractTextContent` to utils | Accept `ChatConfig` instead of hardcoded options; export as `useAIChat` composable |
| `composables/useAiAssistant.js` | JS, duplicated auth, hardcoded API path for bots, non-reactive `accountId` passed to session mgr | → `.ts`, shared auth, extract API path to config | Split: bot-fetching → `useAIChatBot.ts`, keep orchestration. Accept `ChatConfig`. Rename to match canonical naming |
| `composables/useAiChatSessionManager.js` | JS, duplicated auth, hardcoded API paths, no validation, `accountId` by value | → `.ts`, shared auth, Zod validation on API responses | Accept `SessionsAdapter` interface instead of raw fetch. Accept `PersistenceAdapter` instead of `LocalStorage` |
| `composables/useAutoScroll.js` | JS (minor — no types on options) | → `.ts` with typed options interface | Export as-is — this is already framework-agnostic enough. Drop `@vueuse/core` dep or keep as peer dep |
| `composables/useAiMessageMapper.js` | JS, no validation, uses `useCamelCase` (Chatwoot-specific), only maps text parts (ignores tool/reasoning parts from history) **[UPDATED: critical gap vs mobile]** | → `.ts`, add Zod schema parsing, add validation, **port `mapPart()` logic from mobile's `aiChatMapper.ts` to handle tool-call, tool-result, and reasoning parts from history** | Replace `useCamelCase` with inline transform. Export `toUIMessage`/`toUIMessages` as standalone functions |
| `composables/useAutoResizeTextarea.js` | JS (trivial) | → `.ts` | Export as-is |
| `constants.js` | JS, missing tool-specific constants vs RN — **[UPDATED: web has 5 PART_TYPES vs mobile's 11; web has 6 TOOL_STATES but missing `PENDING/RUNNING/COMPLETED/FAILED` legacy states; web lacks `MESSAGE_ROLES.SYSTEM/DATA`]** | → `.ts` with `as const`. **Port mobile's `constants.ts` (88 LOC) wholesale** to ensure full parity including `TOOL_CALL`, `TOOL_RESULT`, `TOOL_INVOCATION`, `TOOL_INPUT_STREAMING`, `STEP_START`, etc. | Move to `@eleva/ai-chat-core` as shared constants |
| `provider.js` | JS, minimal JSDoc types | → `.ts` with typed context interface | Rename `AiChatControl` → `AI_CHAT_CONTEXT_KEY`, export typed hook |
| `AiAssistant.vue` | No `lang="ts"`, 16-prop AiChatPanel passthrough | Add `lang="ts"` | Replace prop drilling with config-based props. Layout logic stays in consumer |
| `containers/AiChatPanel.vue` | **God component** (575 LOC), part-splitting inline, date formatting inline, no `lang="ts"` | Split into AiChatHeader + AiSessionHistoryPanel + slim AiChatPanel. Move part helpers to utils. `lang="ts"` | Accept `ChatConfig`. Use injected i18n. Use part registry for dispatch. Provide slots for header/input/empty state |
| `conversation/AiConversation.vue` | No `lang="ts"` (minor) | `lang="ts"` | Export as-is, clean composable-based scroll |
| `conversation/AiConversationContent.vue` | Trivial wrapper (9 LOC) | `lang="ts"` | Consider merging into AiConversation or keeping as layout slot |
| `conversation/AiConversationEmptyState.vue` | No `lang="ts"` | `lang="ts"` | Replace `useI18n` with injected i18n provider |
| `message/AiMessage.vue` | No `lang="ts"`, avatar import from Chatwoot | `lang="ts"` | Replace Chatwoot `Avatar` import with package default or slot |
| `message/AiMessageContent.vue` | No `lang="ts"` | `lang="ts"` | Theme tokens via `useAITheme()` instead of hardcoded Tailwind classes |
| `message/AiMessageActions.vue` | Trivial (10 LOC) | `lang="ts"` | Export as-is |
| `message/AiMessageAction.vue` | No `lang="ts"` | `lang="ts"` | Export as-is |
| `parts/AiPartRenderer.vue` | Hardcoded component map, no registry pattern, no `lang="ts"` | `lang="ts"`, use imported type guards | Use part registry + tool registry for dispatch. Keep `defineAsyncComponent` for lazy loading |
| `parts/AiTextPart.vue` | Uses Chatwoot's `MessageFormatter`, no `lang="ts"` | `lang="ts"` | Replace `MessageFormatter` with `markdown-it` directly or configurable markdown renderer |
| `parts/AiToolPart.vue` | No `lang="ts"`, no tool state derivation (doesn't show pending/complete/error states) | `lang="ts"`, add tool state display (per RN's `AIToolPart.tsx` pattern) | Replace `useI18n` with injected i18n |
| `parts/AiReasoningPart.vue` | Uses Chatwoot's `MessageFormatter`, no `lang="ts"` | `lang="ts"` | Replace `MessageFormatter` with configurable markdown |
| `parts/AiCollapsiblePart.vue` | No `lang="ts"` | `lang="ts"` | Export as-is — good reusable component. Theme colors via `useAITheme()` |
| `input/AiPromptInput.vue` | Uses Chatwoot `Button`, no `lang="ts"` | `lang="ts"` | Replace Chatwoot `Button` with package default or slot |
| `input/AiVoiceButton.vue` | Disabled feature, no `lang="ts"` | `lang="ts"` | Keep in package as opt-in component. Accept `onRecordStart`/`onRecordStop` callbacks |
| `feedback/AiChatError.vue` | Error categorization inline in computed, no `lang="ts"` | `lang="ts"`, extract `categorizeError()` to utils | Replace `useI18n` with injected i18n |
| `feedback/AiLoader.vue` | Trivial (16 LOC) | `lang="ts"` | Replace `useI18n` with injected i18n |
| `suggestions/AiSuggestions.vue` | Trivial (16 LOC) | `lang="ts"` | Replace `useI18n` with injected i18n |
| `suggestions/AiSuggestion.vue` | Trivial (16 LOC) | `lang="ts"` | Export as-is |

---

## 9. Effort Estimate

### Phase 1: Fix Anti-Patterns (within Chatwoot)

| Task | Days | Risk |
|------|------|------|
| TypeScript migration (all 30 files) | 2–3 | Low — mechanical |
| Add Zod schemas + validation | 0.5 | Low |
| Fix `structuredClone` | 0.1 | Negligible |
| Split `AiChatPanel.vue` | 1 | Low–Medium |
| Consolidate auth headers | 0.1 | Negligible |
| Add type guards + part helpers | 0.5 | Low |
| Implement copy action | 0.1 | Negligible |
| Update tests for TS changes | 0.5 | Low |
| **Phase 1 Total** | **5–6** | |

### Phase 2: Prepare for Extraction

| Task | Days | Risk |
|------|------|------|
| Create `ChatConfig` + `SessionsAdapter` + `PersistenceAdapter` interfaces | 0.5 | Low |
| Refactor `useVercelChat` to accept `ChatConfig` | 1 | Medium |
| Refactor `useAiChatSessionManager` to accept adapters | 1 | Medium |
| Add part + tool registry | 0.5 | Low |
| Replace `vue-i18n` with pluggable provider | 1 | Medium |
| Extract pure functions to shared utils | 0.5 | Low |
| Replace Chatwoot component dependencies (Avatar, Button, etc.) with defaults/slots | 1 | Medium |
| Update tests | 0.5 | Low |
| **Phase 2 Total** | **6** | |

### Total: **11–12 developer-days** across both phases

### Phasing Recommendation

1. **Phase 1 can start immediately** — it improves the existing Chatwoot codebase with no extraction dependency
2. **Phase 2 should start after** the RN mobile extraction is proven (Phase 1–3 of Research 3A's migration path)
3. **Phase 1 + Phase 2 can be done by one developer** with Vue expertise
4. **Phase 2 overlaps** with the `@eleva/ai-chat-core` package creation — the interfaces defined in Phase 2 should come FROM the core package, not be created independently

---

## Appendix A: Dependency Map (What Chatwoot-Specific Imports Must Be Replaced)

```
useVercelChat.js
  └── dashboard/api/auth (Auth)          → config.getHeaders()

useAiAssistant.js
  ├── vue-router (useRoute)              → config.accountId / removed
  ├── dashboard/composables/store        → config.user
  └── dashboard/api/auth (Auth)          → config.getHeaders()

useAiChatSessionManager.js
  ├── shared/helpers/localStorage         → config.persistence (PersistenceAdapter)
  ├── dashboard/composables/useTransformKeys → inline toCamelCase()
  └── dashboard/api/auth (Auth)          → config.getHeaders()

useAiMessageMapper.js
  └── dashboard/composables/useTransformKeys → inline toCamelCase()

AiAssistant.vue
  └── dashboard/components-next/panels   → package default containers

AiChatPanel.vue
  ├── dashboard/components-next/avatar   → package default avatar or <slot>
  └── dashboard/components-next/dropdown-menu → package default dropdown or <slot>

AiPromptInput.vue
  └── dashboard/components-next/button   → package default button or <slot>

AiTextPart.vue
  └── shared/helpers/MessageFormatter    → markdown-it or configurable renderer

AiReasoningPart.vue
  └── shared/helpers/MessageFormatter    → markdown-it or configurable renderer

All *.vue files
  └── vue-i18n (useI18n)                 → inject(AI_I18N_KEY) with default English
```

## Appendix B: Polling Workaround — Options for Improvement

The current 50ms polling with `JSON.parse(JSON.stringify)` is the most impactful performance concern. Options:

### Option 1: `structuredClone` (Minimal Change)
Replace `JSON.parse(JSON.stringify(...))` with `structuredClone()`. Faster, preserves Dates, fewer edge cases.
- **Effort**: 5 minutes
- **Impact**: ~2x faster cloning, correct Date handling
- **Limitation**: Still O(n) per poll

### Option 2: Targeted Shallow Clone + Changed Message Detection
Only deep-clone messages that have actually changed since the last poll. Track by message length + last message content hash.
- **Effort**: 2 hours
- **Impact**: O(1) for most polls (only new/changed messages cloned)
- **Limitation**: More complex logic

### Option 3: Vue `shallowRef` + Manual Trigger
Use `shallowRef` for messages array and `triggerRef()` after each poll. Avoids cloning entirely — Vue re-renders based on array identity change.
- **Effort**: 1 hour
- **Impact**: Zero cloning overhead
- **Limitation**: Components must access parts reactively (they already do via props)

### Option 4: Upstream Fix
Monitor the [AI SDK Vue discussion #7510](https://github.com/vercel/ai/discussions/7510) for a proper fix. If the SDK exposes reactive refs natively, the polling workaround can be removed entirely.
- **Effort**: 0 (waiting)
- **Impact**: Eliminates the problem
- **Limitation**: Depends on external team

**Recommendation**: Apply **Option 1** immediately (5 minutes). Evaluate **Option 3** if performance becomes a user-visible issue. Monitor **Option 4** long-term.

---

## Cross-Platform Alignment Review

> **Date**: 2026-02-28
> **Reviewer**: Cross-platform architecture review
> **Scope**: Comparison of Vue web AI chat code (`chatwoot/app/javascript/dashboard/components-next/ai-assistant/`) vs React Native mobile AI chat code (`chatwoot-mobile-app/src/presentation/`, `store/ai-chat/`, `types/ai-chat/`)
> **Goal**: Ensure the web refactoring plan converges toward `@eleva/ai-chat-core` rather than diverging

---

### 1. Component/Composable Mapping — Web vs Mobile

| Concern | Mobile (React Native) | Web (Vue 3) | Alignment Status |
|---------|----------------------|-------------|-----------------|
| **Chat transport hook** | `useAIChat.ts` (432 LOC) — wraps `@ai-sdk/react` `useChat`, manages session ID via refs, handles `expo/fetch`, `AppState`, `AsyncStorage` | `useVercelChat.js` (243 LOC) — wraps `@ai-sdk/vue` `Chat` class, polls at 50ms with `JSON.parse(JSON.stringify)`, manual ref syncing | **MISALIGNED** — Different SDK adapters (`useChat` vs `Chat` class), different reactivity strategies. The web's polling workaround adds complexity absent from mobile. Both handle session ID from `X-Chat-Session-Id` header. |
| **Orchestrator** | `AIChatInterface.tsx` (276 LOC) — container component, wires hooks to UI | `useAiAssistant.js` (177 LOC) — composable (not a component), fetches bots, wires chat + sessions | **STRUCTURALLY DIFFERENT** — Mobile orchestrates in a component; web orchestrates in a composable. The composable approach is better for Vue but the web should still have a container component (`AiChatInterface.vue`) that consumes it, matching mobile's pattern. |
| **Bot selection** | `useAIChatBot.ts` (66 LOC) — dedicated hook, fetches bots via `AIChatService` | Inline in `useAiAssistant.js` (lines 107-132) — `fetchBots()` is a local function | **WEB SHOULD EXTRACT** — The web should extract `useAIChatBot.ts` composable to match mobile's separation. Currently bot-fetching is tangled with the orchestrator. |
| **Session management** | `useAIChatSessions.ts` (225 LOC) — Redux-backed, includes reactive message bridge, auto-select, `isNewConversation` guard | `useAiChatSessionManager.js` (295 LOC) — `ref()`-backed, localStorage persistence, imperative `loadSession()/restoreSession()` API | **FUNDAMENTALLY DIFFERENT PATTERNS** — Mobile uses a reactive bridge effect with fingerprint deduplication (`loadedBridgeKeyRef`) to push backend messages into SDK. Web uses imperative `chat.setMessages()` calls in `loadSession()`. Mobile's pattern is more robust for streaming guards (invariants #3–#5). The web has no streaming guard — calling `loadSession()` during streaming would corrupt state. |
| **Scroll management** | `useAIChatScroll.ts` (280 LOC) — `FlashList` ref, debounced position tracking, 8+ refs | `useAutoScroll.js` (195 LOC) — DOM-based, RAF loop via `@vueuse/core`, `userScrolledAway` intent detection | **ACCEPTABLE DIVERGENCE** — Platform-specific by necessity. Web's RAF-based approach is actually more sophisticated than mobile's retry cascades. Both will stay in their respective platform packages. |
| **Message mapper** | `aiChatMapper.ts` (129 LOC) — pure functions, maps `AIChatMessage` DTO → `UIMessage`, handles text, reasoning, tool-call, tool-result part mapping | `useAiMessageMapper.js` (104 LOC) — only maps text parts, skips tool/reasoning from history, uses `useCamelCase` | **CRITICALLY MISALIGNED** — Web's mapper only creates `{ type: 'text', text: content }` parts from history messages. Mobile's mapper preserves tool calls (`tool-input-available`), tool results (`tool-output-available`), and reasoning parts. This means **web users lose tool/reasoning display when loading historical sessions**. |
| **Part renderer** | `AIPartRenderer.tsx` (116 LOC) — uses imported type guards from `@/types/ai-chat/parts` | `AiPartRenderer.vue` (42 LOC) — inline computed with `startsWith('tool-')` string check | **ALIGNED in concept, misaligned in implementation** — Both dispatch to text/reasoning/tool components. Mobile uses domain type guards; web uses ad-hoc string checks. Same fix needed (I3). |
| **Text part** | `AITextPart.tsx` (260 LOC) — `react-native-markdown-display`, animated cursor via Reanimated, Yoga height workaround | `AiTextPart.vue` (35 LOC) — `MessageFormatter` (Chatwoot helper), CSS `animate-pulse` cursor | **ACCEPTABLE DIVERGENCE** — Platform-specific rendering. Props interface is compatible: `{ part, role, isStreaming }`. |
| **Tool part** | `AIToolPart.tsx` (287 LOC) — uses `deriveToolDisplayState()` from domain layer, shows input/output in collapsible with state-specific icons/colors (pending/running/completed/error) | `AiToolPart.vue` (59 LOC) — shows input/output in collapsible, always uses `slate` accent, no state derivation | **WEB IS MISSING TOOL STATE DISPLAY** — Mobile derives display state from `deriveToolDisplayState()` → maps to icon + color + label. Web shows all tools identically with no visual state feedback. Web should adopt mobile's state derivation pattern. |
| **Reasoning part** | `AIReasoningPart.tsx` (178 LOC) — collapsible with streaming/done label, markdown, cursor | `AiReasoningPart.vue` (55 LOC) — collapsible with thinking/view label, markdown, cursor | **WELL ALIGNED** — Same concept and props interface. Minor differences in styling. |
| **Collapsible** | `AICollapsible.tsx` (178 LOC) — `react-native-reanimated` animated height, Unicode chevrons | `AiCollapsiblePart.vue` (138 LOC) — CSS transitions, Lucide icon chevrons | **WELL ALIGNED** — Same concept. Web's implementation is cleaner (CSS vs Reanimated). |
| **Error display** | `AIChatError.tsx` (142 LOC) — `categorizeError()` inline, state-specific colors | `AiChatError.vue` (181 LOC) — `categorizeError()` inline in computed | **ALIGNED** — Same pattern, same problem (pure function embedded in component). Both proposals recommend extraction. |
| **Type guards** | `types/ai-chat/parts.ts` (286 LOC) — 20+ typed guards: `isTextPart`, `isToolPart`, `isReasoningPart`, `isToolCallPart`, `isToolResultPart`, `getDeduplicatedToolParts`, `deriveToolDisplayState`, `isToolExecuting`, `isToolComplete`, `getMessageTextContent`, etc. | None — ad-hoc `part.type === 'text'` and `part.type.startsWith('tool-')` inline checks | **CRITICALLY MISALIGNED** — Mobile has a comprehensive, tested domain layer for part classification. Web has zero. This is the single highest-value alignment item. |
| **Zod schemas** | `store/ai-chat/aiChatSchemas.ts` (79 LOC) — validates all backend responses | None | **WEB HAS NONE** — Already covered in C2. |
| **Constants** | `types/ai-chat/constants.ts` (88 LOC) — `PART_TYPES` (11 values), `TOOL_STATES` (8 values), `CHAT_STATUS` (4), `MESSAGE_ROLES` (4) | `constants.js` (37 LOC) — `PART_TYPES` (5 values), `TOOL_STATES` (6), `CHAT_STATUS` (4), `MESSAGE_ROLE` (3) | **MISALIGNED** — Web is missing `TOOL_CALL`, `TOOL_RESULT`, `TOOL_INVOCATION`, `TOOL_INPUT_STREAMING`, `FILE`, `SOURCE`, `STEP_START` from PART_TYPES. Missing `PENDING`, `RUNNING`, `COMPLETED`, `FAILED` legacy states from TOOL_STATES. Missing `SYSTEM`, `DATA` from MESSAGE_ROLES. |
| **Store layer** | `store/ai-chat/` (8 files, 711 LOC) — Redux slice, selectors, actions, service, mapper, schemas, types | None — uses composable-local `ref()` only | **ACCEPTABLE** — Vue's composable-local state is a valid pattern and actually simplifies extraction (no Vuex/Pinia coupling). However, the web lacks the memoized selectors and stable empty array patterns the mobile uses to prevent re-render cascades. |

### 2. Critical Divergences That Block Shared Package Extraction

#### 2.1 Message Mapper Does Not Preserve Tool/Reasoning Parts from History

**Web**: `useAiMessageMapper.js:toUIMessage()` (line 50) creates ONLY `{ type: 'text', text: content }` parts for ALL messages from backend history. Tool calls, tool results, and reasoning parts are lost.

**Mobile**: `aiChatMapper.ts:mapPart()` (lines 76-128) handles 6 part types:
- `text` → `{ type: 'text', text }`
- `reasoning` → `{ type: 'reasoning', text, state: 'done' }`
- `tool-call` / `tool-input-available` → `{ type: 'dynamic-tool', state: 'input-available', toolCallId, toolName, input }`
- `tool-result` / `tool-output-available` → `{ type: 'dynamic-tool', state: 'output-available', toolCallId, toolName, output }`

**Impact**: Web users see plain text when loading historical conversations that contained tool usage or reasoning. This is a functional gap, not just a cosmetic one.

**Required Fix**: Port the mobile's `mapPart()` function to the web's message mapper. This should be done in Phase 1 as it's a bug, not an extraction concern.

#### 2.2 Constants Are Not a Superset

The web's `constants.js` defines only 5 `PART_TYPES` vs mobile's 11. Key missing values:
- `TOOL_CALL: 'tool-call'`
- `TOOL_RESULT: 'tool-result'`
- `TOOL_INVOCATION: 'tool-invocation'`
- `TOOL_INPUT_STREAMING: 'tool-input-streaming'`
- `FILE: 'file'`
- `SOURCE: 'source'`
- `STEP_START: 'step-start'`

Without these, any code that tries to use shared type guards from `@eleva/ai-chat-core` will fail because the constants they reference don't exist.

**Required Fix**: Replace web's `constants.js` with a port of mobile's `constants.ts` (88 LOC). This is a prerequisite for shared type guards.

#### 2.3 No Streaming Guard on Session Load

**Mobile**: The reactive bridge effect in `useAIChatSessions.ts` (line 155-162) explicitly guards against loading messages during streaming:
```typescript
chatStatus !== 'streaming' && chatStatus !== 'submitted'
```

**Web**: `useAiChatSessionManager.js:loadSession()` calls `chat.setMessages()` unconditionally. If a user clicks on a session in the history panel while streaming is active, the streaming messages will be overwritten.

**Required Fix**: Add streaming guard in `loadSession()` or adopt the mobile's reactive bridge pattern. The mobile proposal (P1.1) recommends extracting the bridge into `useMessageBridge` — the web should implement a Vue composable equivalent.

#### 2.4 Web's `extractTextContent()` Duplicated in Two Files

The function `extractTextContent(message)` exists in both `useVercelChat.js` (line 14) and implicitly in `useAiMessageMapper.js` (via the `toBackendMessage` function). The mobile centralizes this in `types/ai-chat/parts.ts:getMessageTextContent()`.

**Required Fix**: Use the shared `getMessageTextContent()` from the ported `partHelpers.ts`.

### 3. Patterns from Mobile That Web Should Adopt

#### 3.1 Domain Type Layer (`types/ai-chat/`)

The mobile has a clean domain type layer with zero framework dependencies:
- `constants.ts` (88 LOC) — all `as const` objects with inferred types
- `parts.ts` (286 LOC) — type interfaces + type guards + extraction helpers + tool state helpers + message helpers

The web should create an equivalent `types/` directory (or `utils/` directory) that mirrors this structure. These files are the primary candidates for extraction into `@eleva/ai-chat-core`.

**Priority**: HIGH — do this in Phase 1 alongside TypeScript migration.

#### 3.2 Mapper Pattern (Pure Functions, Not Composables)

The mobile's `aiChatMapper.ts` exports pure functions (`mapMessageToUIMessage`, `mapMessagesToUIMessages`) that have no React dependency. The web wraps its mapper in a composable (`useAiMessageMapper`) which uses `useCamelCase` — a Chatwoot-specific composable.

For extraction, the mapper must be a set of pure functions. The web should refactor during Phase 1 to match the mobile pattern.

#### 3.3 Tool State Derivation

The mobile's `deriveToolDisplayState(part)` function (parts.ts:208-232) maps any tool part's type/state to a canonical `ToolState` value, handling both SDK and backend formats. Then `mapToDisplayState()` in `AIToolPart.tsx` maps domain states to display states (pending/running/completed/error).

The web's `AiToolPart.vue` has no equivalent — it just shows the tool name and input/output with no visual state feedback. The web should:
1. Port `deriveToolDisplayState()` to `utils/partHelpers.ts`
2. Add state-specific icons and colors to `AiToolPart.vue` (matching mobile's pending=slate, running=slate, completed=teal, error=ruby pattern)

#### 3.4 Message Validation Pipeline

The mobile has `utils/ai-assistant/aiChatMessageUtils.ts` (78 LOC) with:
- `validateMessage()` — checks if a UIMessage has required fields
- `validateAndNormalizeParts()` — ensures parts array is well-formed
- `validateAndNormalizeMessages()` — applies validation to an array, used in `AIChatInterface.tsx` before rendering

The web has no equivalent. Invalid messages or parts from the backend could cause runtime errors in components. The web should port this validation pipeline and apply it at the container level.

#### 3.5 Stable Empty Array References

The mobile uses `const EMPTY_SESSIONS: AIChatSession[] = []` and `const EMPTY_MESSAGES: AIChatMessage[] = []` as module-level constants to prevent unnecessary re-renders when selectors return empty results. The web doesn't need this for Vue's reactivity system (Vue tracks dependencies differently from React's `useSyncExternalStore`), but the concept of stable references should be understood for the shared core package.

#### 3.6 Ref-Based Callback Stability

The mobile's `useAIChatSessions.ts` wraps parent-provided functions in refs (`setMessagesRef`, `clearSessionRef`, `stopRef`) and syncs them in effects. This prevents the session hook's effects from re-firing when the parent re-renders during streaming.

Vue doesn't have this problem because composables share the same reactive scope. However, this pattern IS relevant for the extraction: any React-based consumer of `@eleva/ai-chat-react-native` will need this pattern, and the web's Vue consumer won't. The extraction interface design should accommodate both.

### 4. Patterns from Web That Are Better Than Mobile

#### 4.1 RAF-Based Auto-Scroll

The web's `useAutoScroll.js` uses `useRafFn` from VueUse for smooth, frame-synchronized scrolling during streaming. This is more elegant than the mobile's `setTimeout`-based retry cascades in `useAIChatScroll.ts`. The mobile proposal (P1.6) already recommends fixing the retry cascades.

#### 4.2 Lazy-Loaded Parts

The web uses `defineAsyncComponent` for `AiReasoningPart` and `AiToolPart`, meaning they're only loaded when needed. The mobile eagerly imports all parts. For the extraction packages, this should be an option (not mandatory) — the web's approach is a bundle-size optimization.

#### 4.3 Composable-Local State (No Store Coupling)

The web uses `ref()` in composables without any Vuex/Pinia dependency for AI chat state. This is actually better for extraction than the mobile's Redux coupling. The mobile proposal (P2.2) recommends abstracting Redux via `SessionsAdapter` — the web's composable pattern makes this abstraction unnecessary because it's already decoupled.

#### 4.4 Provide/Inject Context

The web's `provideAiChatContext()` pattern shares `status`, `isStreaming`, `sendMessage`, `clearError` with all descendants via Vue's provide/inject. This is the correct Vue equivalent of React Context and works well. The mobile uses prop drilling to `AIChatInterface` → children, which is less clean.

#### 4.5 Session Delete Functionality

The web's `useAiChatSessionManager.js` includes `deleteSession()` which calls the backend DELETE endpoint and removes from local state. The mobile's `useAIChatSessions.ts` does not have delete functionality (it dispatches to Redux but the actual delete action was not observed in the hooks code). The web is ahead here.

### 5. Concerns About Divergence That Would Make Shared Package Extraction Harder

| Concern | Risk Level | Description |
|---------|-----------|-------------|
| **Different SDK adapters** | HIGH | Web uses `@ai-sdk/vue` `Chat` class. Mobile uses `@ai-sdk/react` `useChat`. These have fundamentally different APIs. The core package can share types/validation/helpers but NOT the transport hook. Each platform MUST have its own transport composable/hook. |
| **Different polling/reactivity strategies** | MEDIUM | Web polls at 50ms with deep clone. Mobile relies on React's native re-render cycle. The core package should NOT contain any reactivity logic. Keep it pure functions and types. |
| **Message mapper inconsistency** | HIGH | Web's mapper produces fewer part types than mobile's. If both use the same `@eleva/ai-chat-core` mapper, the web would suddenly start showing tool/reasoning parts from history — which is correct behavior but would require the web's components to handle these parts (they already can via `AiPartRenderer`, just never receive them). |
| **Session management architecture** | MEDIUM | Web uses imperative `loadSession()`. Mobile uses reactive bridge with guards. The `SessionsAdapter` interface from Research 3A can accommodate both patterns, but the web should add streaming guards before extraction. |
| **Constants gap** | HIGH | Web's constants are a strict subset of mobile's. Shared type guards won't work until constants are aligned. |
| **Naming conventions** | LOW | `AI` vs `Ai` prefix, different file names. Resolvable during extraction but adds friction. The core package should use `AI` prefix (matching the SDK convention). |

### 6. Updated Time Estimates

The cross-platform alignment review adds work to Phase 1 that was not originally scoped:

| New Task (Phase 1 additions) | Days | Rationale |
|------------------------------|------|-----------|
| Port mobile's `constants.ts` (88 LOC) to web | 0.25 | Prerequisite for shared type guards |
| Port mobile's `parts.ts` type guards + helpers (286 LOC) to web | 0.5 | Core alignment item — enables shared `partHelpers.ts` |
| Fix message mapper to handle tool/reasoning parts from history | 0.5 | Bug fix — web currently loses tool/reasoning display in historical sessions |
| Port mobile's `aiChatSchemas.ts` (79 LOC) to web (already in C2) | 0 | Already accounted for in original estimate |
| Add tool state derivation to `AiToolPart.vue` | 0.5 | Brings web tool display to feature parity with mobile |
| Add streaming guard to session loading | 0.25 | Prevents corruption if user switches sessions during streaming |
| Extract `useAIChatBot` composable from `useAiAssistant` | 0.25 | Aligns with mobile's separation of concerns |
| Add message validation pipeline (port `aiChatMessageUtils.ts`) | 0.25 | Defensive rendering, matches mobile |
| **Additional Phase 1 effort** | **2.5** | |

**Revised Phase 1 total: 7.5–8.5 days** (was 5–6 days)
**Phase 2 total: unchanged at 5–6 days**
**Revised grand total: 13.5–14.5 developer-days** (was 11–12 days)

The additional 2.5 days are justified because without them, the web codebase would diverge further from mobile during the TypeScript migration, making shared package extraction significantly harder.

### 7. Recommended Phase 1 Ordering (Updated)

1. **Port `constants.ts` from mobile** (0.25 days) — Foundation for everything else
2. **Port `types/parts.ts` type interfaces + type guards** (0.5 days) — Enables TypeScript migration
3. **TypeScript migration** (2–3 days) — Uses ported types
4. **Fix message mapper** (0.5 days) — Port `mapPart()` from mobile's `aiChatMapper.ts`
5. **Add Zod schemas** (0.5 days) — Port from mobile's `aiChatSchemas.ts`
6. **Fix `structuredClone`** (0.1 days)
7. **Split `AiChatPanel.vue`** (1 day)
8. **Add tool state derivation** (0.5 days) — Brings `AiToolPart.vue` to parity
9. **Consolidate auth headers** (0.1 days)
10. **Add streaming guard + message validation** (0.5 days)
11. **Extract `useAIChatBot` composable** (0.25 days)
12. **Update tests** (0.5 days)

This ordering ensures the foundational types are in place before the TypeScript migration, and the message mapper fix happens while the mapper code is being refactored anyway.
