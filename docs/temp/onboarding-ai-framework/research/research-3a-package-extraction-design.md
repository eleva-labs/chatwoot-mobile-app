# Research 3A: Package Extraction Design — AI Chat + Generative Slides

> **Date**: 2026-02-28
> **Predecessor**: Research 2F (Vue support), 2G (honest comparison), Architecture Design v2
> **Question**: How do we extract the existing AI chat + generative slides system into reusable packages that work across React Native, Vue 3, and React web?
> **Methodology**: Line-by-line audit of all 33 source files, cross-referenced with Chatwoot Vue codebase and research documents
> **Decision baseline**: AI SDK (not assistant-ui) — per Research 2G recommendation

---

## 1. Executive Summary

The existing AI chat system consists of ~3,500 lines across 33 files in the Chatwoot mobile app. After auditing every file, we classify them into four categories: **CORE** (pure logic, shareable across all platforms), **HOOK** (React hooks needing Vue composable equivalents), **COMPONENT** (React Native UI needing per-platform reimplementation), and **APP-SPECIFIC** (tied to Chatwoot auth/navigation/Redux).

The extraction produces a four-package monorepo:

| Package | Contents | Size est. |
|---------|----------|-----------|
| `@eleva/ai-chat-core` | Types, schemas, constants, type guards, mappers, validation, registry interfaces | ~800 LOC |
| `@eleva/ai-chat-react-native` | RN hooks + components (depends on core + `@ai-sdk/react`) | ~2,400 LOC |
| `@eleva/ai-chat-react` | React web hooks + components (depends on core + `@ai-sdk/react`) | ~1,800 LOC |
| `@eleva/ai-chat-vue` | Vue 3 composables + components (depends on core + `@ai-sdk/vue`) | ~1,800 LOC |

The core package is ~25% of the total codebase but carries 100% of the type safety and validation logic. UI code is necessarily per-platform (React Native uses `View`/`Text`/`FlashList`; Vue uses `div`/`span`/CSS; React web uses `div`/`span`/CSS).

The recommended styling strategy is **Option 3: Default theme + overrides** with a token-based system. Consumers get a working UI out of the box but can override any token through a theme provider.

The component/part registry uses a type-safe `Map<string, ComponentType>` pattern that works identically across all three platforms (React components on RN/web, Vue components on Vue), with compile-time registration via imports.

---

## 2. File-by-File Audit

### Legend
- **CORE** — Pure logic, no UI framework dependency. Shareable across all platforms.
- **HOOK** — React hook. Needs a Vue composable equivalent.
- **COMPONENT** — React/RN UI component. Needs per-platform implementation.
- **APP-SPECIFIC** — Tied to Chatwoot (auth, Redux, navigation). Consumer must provide.
- **STYLE** — Styling infrastructure. Platform-specific but pattern is portable.

| # | File | LOC | Classification | What's Extractable | What's App-Specific |
|---|------|-----|----------------|-------------------|---------------------|
| 1 | `hooks/useAIChat.ts` | 432 | **HOOK + APP-SPECIFIC** | Hook structure, transport config pattern, sendMessage/stop/clearSession API, error filtering logic, session ID extraction from headers | `AIChatService.getStreamEndpoint()`, `AIChatService.getAuthHeaders()`, `AsyncStorage` persistence, `AppState` background handling, `expo/fetch`, `DefaultChatTransport` body format (Chatwoot-specific `agent_bot_id`, `chat_session_id`) |
| 2 | `hooks/useAIChatMessages.ts` | — | **N/A** | File does not exist. Message merging logic lives in `useAIChatSessions.ts` and `aiChatMessageUtils.ts` | — |
| 3 | `hooks/useAIChatScroll.ts` | 280 | **HOOK + COMPONENT** | Auto-scroll logic, near-bottom detection, debounced state updates, programmatic scroll detection | `FlashList` ref type, `NativeScrollEvent` type, RN-specific scroll methods (`scrollToEnd`, `scrollToIndex`) |
| 4 | `hooks/useAIChatSessions.ts` | 225 | **HOOK + APP-SPECIFIC** | Session selection logic, new conversation flow, bridge key deduplication pattern, auto-select latest session | `useAppDispatch`/`useAppSelector` (Redux), `aiChatActions` (Redux thunks), `selectSessionsByAgentBot`/`selectActiveSessionId` (Redux selectors), `mapMessagesToUIMessages` |
| 5 | `hooks/useAIChatBot.ts` | 66 | **HOOK + APP-SPECIFIC** | Bot selection state machine (loading → loaded → error) | `AIChatService.fetchBots()` (Chatwoot API) |
| 6 | `parts/AIPartRenderer.tsx` | 116 | **COMPONENT + CORE** | Part dispatch pattern (switch on type guards), re-export of utilities | `useAIStyles` (RN styling), `View`/`Text` imports, `__DEV__` check |
| 7 | `parts/AITextPart.tsx` | 260 | **COMPONENT** | Markdown rendering concept, cursor animation concept, role-based styling | `react-native-reanimated`, `react-native-markdown-display`, `tailwind.color()`, font families (`Inter-400-20`), `Linking.openURL` |
| 8 | `parts/AIToolPart.tsx` | 287 | **COMPONENT** | Tool state display mapping, `formatToolName`, `formatJson`, state-to-display config pattern | `Icon`/`CheckIcon`/`CloseIcon`/`LoadingIcon` (custom SVG), `tailwind.color()`, `i18n.t()` |
| 9 | `parts/AIReasoningPart.tsx` | 178 | **COMPONENT** | Reasoning content extraction, streaming/completed label switching | `react-native-markdown-display`, `ActivityIndicator`, `tailwind.color()`, `i18n.t()` |
| 10 | `parts/AICollapsible.tsx` | 178 | **COMPONENT** | Collapsible expand/collapse state, animation config, accessibility labels | `react-native-reanimated`, `Pressable`, `i18n.t()` |
| 11 | `components/AIChatMessagesList.tsx` | 204 | **COMPONENT** | Message list rendering pattern, key extraction, empty/loading/error states, scroll buttons | `FlashList`, `Animated.createAnimatedComponent`, `Platform.OS`, `i18n.t()` |
| 12 | `components/AIMessageBubble.tsx` | 208 | **COMPONENT** | Part splitting pattern (reasoning outside bubble, text inside), copy-to-clipboard, avatar layout | `Clipboard`, `useHaptic`, `Avatar` component, `i18n.t()` |
| 13 | `components/AIChatHeader.tsx` | 126 | **COMPONENT** | Header layout, status indicator (dot + label), session count badge | `Icon`/`CloseIcon`/`AddIcon`, `tailwind.color()`, `i18n.t()` |
| 14 | `components/AIInputField.tsx` | 103 | **COMPONENT** | Input state, send/cancel logic, focus state, animated layout | `TextInput`, `react-native-reanimated`, `SendIcon`, `i18n.t()` |
| 15 | `components/AIChatError.tsx` | 142 | **COMPONENT + CORE** | Error categorization logic (`categorizeError`), error config mapping | `Icon`/`WarningIcon`/`LockIcon`, `tailwind.color()`, `i18n.t()` |
| 16 | `components/AIChatEmptyState.tsx` | 78 | **COMPONENT** | Empty state layout, suggested prompt chips | `Icon`/`ChatIcon`, `tailwind.color()`, `i18n.t()` |
| 17 | `components/AIChatSessionPanel.tsx` | 85 | **COMPONENT** | Bottom sheet session panel | `@gorhom/bottom-sheet`, `i18n.t()` |
| 18 | `components/AISessionItem.tsx` | 80 | **COMPONENT + CORE** | `formatSessionTitle` date formatting logic | `date-fns`, `Animated`, `i18n.t()` |
| 19 | `components/AISessionList.tsx` | 57 | **COMPONENT** | Session list rendering, loading/empty states | `Animated`, `i18n.t()` |
| 20 | `containers/AIChatInterface.tsx` | 276 | **COMPONENT + APP-SPECIFIC** | Container orchestration pattern, error dismissal, message validation | `useSafeAreaInsets`, `KeyboardAvoidingView`, Redux (`useAppSelector`, `selectUser`, `selectIsLoadingSessions`), `validateAndNormalizeMessages` |
| 21 | `containers/FloatingAIAssistant.tsx` | 150 | **COMPONENT + APP-SPECIFIC** | FAB + expand/collapse animation | `react-native-reanimated`, `useSafeAreaInsets`, `TAB_BAR_HEIGHT`, custom SVG icons |
| 22 | `containers/types.ts` | 45 | **CORE** | Prop type interfaces (`AIMessageBubbleProps`, `AIChatInterfaceProps`, `AIInputFieldProps`, `FloatingAIAssistantProps`) | `UIMessage` from `ai`, `ToolPart` from domain types |
| 23 | `styles/tokens.ts` | 361 | **CORE (pattern) + STYLE** | Token type definitions, token values (Tailwind class strings), helper functions | Token values use `twrnc` class names. The TYPE DEFINITIONS and STRUCTURE are portable; the VALUES are RN-specific |
| 24 | `styles/useAIStyles.ts` | 162 | **HOOK + STYLE** | Style hook combining themed styles + AI tokens | `useThemedStyles` (Chatwoot-specific) |
| 25 | `store/aiChatService.ts` | 114 | **APP-SPECIFIC** | All methods: `fetchBots`, `fetchSessions`, `fetchSessionMessages`, `deleteSession`, `getStreamEndpoint`, `getAuthHeaders` | `apiService` (Chatwoot Axios instance), `getStore()` (Redux store accessor), DeviseTokenAuth headers |
| 26 | `store/aiChatSchemas.ts` | 79 | **CORE** | Zod schemas for bots, sessions, messages, parts. Parse functions. | None — pure Zod, framework-agnostic |
| 27 | `store/aiChatActions.ts` | 78 | **APP-SPECIFIC** | Redux async thunks for fetch/create/delete | `createAsyncThunk`, `AxiosError`, `AIChatService` |
| 28 | `store/aiChatSlice.ts` | 139 | **APP-SPECIFIC** | Redux slice (sessions, messages, loading, errors, activeSessionId) | `createSlice`, `PayloadAction` |
| 29 | `store/aiChatSelectors.ts` | 108 | **APP-SPECIFIC** | Redux selectors (`selectSessionsByAgentBot`, `selectActiveSessionId`, etc.) | `createSelector`, `RootState` |
| 30 | `store/aiChatMapper.ts` | 129 | **CORE** | `mapMessageToUIMessage`, `mapMessagesToUIMessages`, `mapPart` — pure functions converting backend DTOs to SDK format | Imports `UIMessage` from `ai` (peer dep), `PART_TYPES` from domain |
| 31 | `store/aiChatTypes.ts` | 64 | **CORE** | Redux state shape types, payload types, re-exports | Types only — but `AIChatState` interface is Redux-shaped |
| 32 | `types/parts.ts` | 286 | **CORE** | All part type definitions, type guards, extraction helpers, tool state helpers, message helpers | Only dependency: `UIMessage` from `ai` (peer dep), `constants.ts` |
| 33 | `types/constants.ts` | 88 | **CORE** | `PART_TYPES`, `TOOL_STATES`, `CHAT_STATUS`, `MESSAGE_ROLES` — all as `const` objects with inferred types | Zero dependencies |
| 34 | `utils/aiChatMessageUtils.ts` | 78 | **CORE** | `validateMessage`, `validateAndNormalizeParts`, `validateAndNormalizeMessages` | Only dependency: `UIMessage` from `ai` |

### Summary

| Classification | File Count | LOC |
|---------------|-----------|-----|
| **CORE** (pure logic) | 8 files | ~770 |
| **HOOK** | 5 files | ~1,165 |
| **COMPONENT** | 16 files | ~2,400 |
| **APP-SPECIFIC** | 6 files | ~530 |
| **STYLE** | 2 files | ~523 |
| N/A (doesn't exist) | 1 file | — |

---

## 3. Package Architecture

### 3.1 Monorepo Structure

```
packages/
├── ai-chat-core/                    # @eleva/ai-chat-core
│   ├── src/
│   │   ├── types/
│   │   │   ├── parts.ts             # TextPart, ReasoningPart, ToolPart, MessagePart, BasePart
│   │   │   ├── constants.ts         # PART_TYPES, TOOL_STATES, CHAT_STATUS, MESSAGE_ROLES
│   │   │   ├── schemas.ts           # Zod schemas: bot, session, message, part
│   │   │   ├── chat.ts              # ChatConfig, TransportConfig, AuthProvider interfaces
│   │   │   ├── session.ts           # Session, SessionsState interfaces
│   │   │   ├── theme.ts             # Theme token type definitions (portable structure)
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── part-helpers.ts      # isTextPart, isToolPart, getTextParts, getDeduplicatedToolParts, etc.
│   │   │   ├── tool-helpers.ts      # deriveToolDisplayState, isToolExecuting, isToolComplete, etc.
│   │   │   ├── message-helpers.ts   # getMessageTextContent, getLastAssistantMessage, etc.
│   │   │   ├── message-validation.ts # validateMessage, validateAndNormalizeParts, validateAndNormalizeMessages
│   │   │   ├── message-mapper.ts    # mapMessageToUIMessage, mapMessagesToUIMessages (DTO → SDK)
│   │   │   ├── format.ts           # formatToolName, formatJson, formatSessionTitle
│   │   │   ├── error.ts            # categorizeError, ErrorCategory, ErrorConfig type
│   │   │   └── index.ts
│   │   ├── registry/
│   │   │   ├── part-registry.ts     # PartRegistry<TComponent> generic class
│   │   │   ├── block-registry.ts    # BlockRegistry<TComponent> generic class
│   │   │   └── index.ts
│   │   ├── theme/
│   │   │   ├── token-types.ts       # AIMessageTokens, AITextTokens, AIToolTokens, etc. (TYPES only)
│   │   │   ├── default-tokens.ts    # Default token values as plain objects (not Tailwind classes)
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── package.json                 # peerDeps: ai@^5, zod@^3||^4
│   └── tsconfig.json
│
├── ai-chat-react-native/            # @eleva/ai-chat-react-native
│   ├── src/
│   │   ├── hooks/
│   │   │   ├── useAIChat.ts         # Wraps @ai-sdk/react useChat + transport config
│   │   │   ├── useAIChatScroll.ts   # FlashList auto-scroll management
│   │   │   ├── useAIChatSessions.ts # Session selection, bridge to persistence layer
│   │   │   ├── useAIChatBot.ts      # Bot selection hook
│   │   │   ├── useAITheme.ts        # Theme provider + consumer hooks
│   │   │   └── index.ts
│   │   ├── parts/
│   │   │   ├── AIPartRenderer.tsx   # Part dispatch (uses core registry)
│   │   │   ├── AITextPart.tsx       # Markdown + streaming cursor
│   │   │   ├── AIToolPart.tsx       # Tool state display
│   │   │   ├── AIReasoningPart.tsx  # Collapsible reasoning
│   │   │   ├── AICollapsible.tsx    # Animated collapsible
│   │   │   └── index.ts
│   │   ├── components/
│   │   │   ├── AIChatMessagesList.tsx  # FlashList-based message list
│   │   │   ├── AIMessageBubble.tsx     # Message bubble + avatar
│   │   │   ├── AIChatHeader.tsx        # Header bar
│   │   │   ├── AIInputField.tsx        # Text input + send/cancel
│   │   │   ├── AIChatError.tsx         # Error display
│   │   │   ├── AIChatEmptyState.tsx    # Empty state
│   │   │   ├── AIChatSessionPanel.tsx  # Bottom sheet sessions
│   │   │   ├── AISessionItem.tsx       # Single session row
│   │   │   ├── AISessionList.tsx       # Session list
│   │   │   └── index.ts
│   │   ├── containers/
│   │   │   ├── AIChatInterface.tsx     # Main orchestrator
│   │   │   ├── FloatingAIAssistant.tsx # FAB + expand panel
│   │   │   └── index.ts
│   │   ├── theme/
│   │   │   ├── AIThemeProvider.tsx      # React context provider
│   │   │   ├── default-rn-theme.ts     # Default RN tokens (Tailwind/twrnc classes)
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── package.json                 # deps: @eleva/ai-chat-core; peerDeps: @ai-sdk/react, ai, react, react-native, react-native-reanimated
│   └── tsconfig.json
│
├── ai-chat-react/                   # @eleva/ai-chat-react
│   ├── src/
│   │   ├── hooks/
│   │   │   ├── useAIChat.ts         # Same pattern as RN, no expo/fetch
│   │   │   ├── useAIChatScroll.ts   # DOM-based scroll (IntersectionObserver)
│   │   │   ├── useAIChatSessions.ts # Same session logic
│   │   │   ├── useAIChatBot.ts
│   │   │   └── index.ts
│   │   ├── parts/
│   │   │   ├── AIPartRenderer.tsx
│   │   │   ├── AITextPart.tsx       # react-markdown or markdown-it
│   │   │   ├── AIToolPart.tsx
│   │   │   ├── AIReasoningPart.tsx
│   │   │   ├── AICollapsible.tsx    # CSS transitions
│   │   │   └── index.ts
│   │   ├── components/              # Web equivalents (div/span)
│   │   │   └── ...
│   │   ├── theme/
│   │   │   ├── AIThemeProvider.tsx
│   │   │   ├── default-web-theme.ts  # CSS class tokens or CSS custom properties
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
└── ai-chat-vue/                     # @eleva/ai-chat-vue
    ├── src/
    │   ├── composables/
    │   │   ├── useAIChat.ts         # Wraps @ai-sdk/vue Chat class
    │   │   ├── useAIChatScroll.ts   # DOM-based scroll
    │   │   ├── useAIChatSessions.ts
    │   │   ├── useAIChatBot.ts
    │   │   └── index.ts
    │   ├── parts/
    │   │   ├── AiPartRenderer.vue
    │   │   ├── AiTextPart.vue       # markdown-it (already in Chatwoot)
    │   │   ├── AiToolPart.vue
    │   │   ├── AiReasoningPart.vue
    │   │   ├── AiCollapsible.vue
    │   │   └── index.ts
    │   ├── components/
    │   │   ├── AiChatMessagesList.vue
    │   │   ├── AiMessageBubble.vue
    │   │   ├── AiChatHeader.vue
    │   │   ├── AiInputField.vue
    │   │   ├── AiChatError.vue
    │   │   ├── AiChatEmptyState.vue
    │   │   ├── AiSessionPanel.vue
    │   │   ├── AiSessionItem.vue
    │   │   ├── AiSessionList.vue
    │   │   └── index.ts
    │   ├── containers/
    │   │   ├── AiChatInterface.vue
    │   │   └── index.ts
    │   ├── theme/
    │   │   ├── useAITheme.ts        # Vue provide/inject theme
    │   │   ├── default-vue-theme.ts # Tailwind CSS class tokens
    │   │   └── index.ts
    │   └── index.ts
    ├── package.json
    └── tsconfig.json
```

### 3.2 What Goes in Each Package — Detailed

#### `@eleva/ai-chat-core` (~800 LOC)

Extracted from:
| Source File | Destination | What Moves |
|-------------|-------------|-----------|
| `types/constants.ts` (88 LOC) | `types/constants.ts` | Entire file as-is |
| `types/parts.ts` (286 LOC) | `types/parts.ts` + `utils/part-helpers.ts` + `utils/tool-helpers.ts` + `utils/message-helpers.ts` | Type definitions → `types/`, functions → `utils/` |
| `store/aiChatSchemas.ts` (79 LOC) | `types/schemas.ts` | Entire file as-is |
| `store/aiChatMapper.ts` (129 LOC) | `utils/message-mapper.ts` | Entire file as-is |
| `utils/aiChatMessageUtils.ts` (78 LOC) | `utils/message-validation.ts` | Entire file as-is |
| `containers/types.ts` (45 LOC) | `types/chat.ts` | Prop interfaces (generalized) |
| `styles/tokens.ts` — TYPE DEFS ONLY | `theme/token-types.ts` | Token interface definitions (not values) |
| NEW | `registry/part-registry.ts` | Generic registry class |
| NEW | `utils/format.ts` | `formatToolName`, `formatJson`, `formatSessionTitle` (extracted from components) |
| NEW | `utils/error.ts` | `categorizeError` (extracted from `AIChatError.tsx`) |
| NEW | `types/chat.ts` | `ChatConfig`, `TransportConfig`, `AuthProvider`, `PersistenceAdapter` interfaces |
| NEW | `theme/default-tokens.ts` | Framework-agnostic default token values (semantic, not Tailwind classes) |

---

## 4. Dependency Graph

```
                    ┌──────────────────────┐
                    │  ai (Vercel AI SDK)  │
                    │  (peer dependency)    │
                    └──────────┬───────────┘
                               │
                    ┌──────────┴───────────┐
                    │ @eleva/ai-chat-core  │
                    │                      │
                    │ peerDeps:            │
                    │  - ai@^5             │
                    │  - zod@^3 || ^4      │
                    │                      │
                    │ deps: (none)         │
                    └──┬──────┬────────┬───┘
                       │      │        │
          ┌────────────┘      │        └────────────┐
          │                   │                     │
          ▼                   ▼                     ▼
┌─────────────────┐ ┌─────────────────┐  ┌─────────────────┐
│ @eleva/         │ │ @eleva/         │  │ @eleva/         │
│ ai-chat-react-  │ │ ai-chat-react   │  │ ai-chat-vue     │
│ native          │ │                 │  │                 │
│                 │ │ peerDeps:       │  │ peerDeps:       │
│ peerDeps:       │ │  - @ai-sdk/    │  │  - @ai-sdk/vue  │
│  - @ai-sdk/     │ │    react       │  │  - vue@^3       │
│    react        │ │  - react       │  │  - zod@^3||^4   │
│  - react-native │ │  - zod@^3||^4  │  │                 │
│  - react-native-│ │                │  │ optional:       │
│    reanimated   │ │                │  │  - vuex (if     │
│  - zod@^3||^4   │ │                │  │    sessions)    │
│  - expo/fetch   │ │                │  │                 │
│    (optional)   │ │                │  │                 │
└─────────────────┘ └─────────────────┘  └─────────────────┘
```

Key principles:
- **Core has zero runtime dependencies.** Only `ai` and `zod` as peer deps.
- **Platform packages depend on core + their SDK adapter.** `@ai-sdk/react` for React/RN, `@ai-sdk/vue` for Vue.
- **No platform package depends on another platform package.**
- **Consumers provide auth, persistence, and API configuration** via interfaces defined in core.

---

## 5. Styling Strategy

### Recommendation: Option 3 — Default Theme + Overrides (via Theme Provider)

After evaluating the four options against the cross-platform requirement:

| Option | RN Compat | Vue Compat | React Web Compat | DX | Verdict |
|--------|-----------|------------|-------------------|----|---------|
| 1: Unstyled primitives | OK | OK | OK | Poor — consumer must style everything | Too much work for consumers |
| 2: Themed primitives only | OK | OK | OK | OK | No defaults means no quick start |
| **3: Default theme + overrides** | **OK** | **OK** | **OK** | **Best** | **Recommended** |
| 4: Render props / slots | OK | OK (Vue slots) | OK | Complex | Overkill for most cases |

### How It Works

#### Core: Token Type Definitions (framework-agnostic)

```typescript
// @eleva/ai-chat-core/src/theme/token-types.ts

export interface AIMessageTokens {
  userBackground: string;
  userText: string;
  userBorder: string;
  assistantBackground: string;
  assistantText: string;
  assistantBorder: string;
}

export interface AIInputTokens {
  containerBackground: string;
  containerBorder: string;
  inputBackground: string;
  inputText: string;
  placeholder: string;
  sendButtonBackground: string;
  sendButtonIcon: string;
}

export interface AIThemeTokens {
  message: AIMessageTokens;
  text: AITextTokens;
  tool: AIToolTokens;
  header: AIHeaderTokens;
  input: AIInputTokens;
  session: AISessionTokens;
  collapsible: Record<string, AICollapsibleTokens>;
}
```

The token VALUES are strings. What those strings mean depends on the platform:
- **React Native**: Tailwind class strings consumed by `twrnc` (e.g., `'bg-iris-3'`)
- **React Web**: CSS class strings consumed by Tailwind CSS (e.g., `'bg-iris-3'`)
- **Vue Web**: Same CSS class strings consumed by Tailwind CSS (e.g., `'bg-iris-3'`)

#### Platform Package: Theme Provider

```typescript
// @eleva/ai-chat-react-native — React context
import { createContext, useContext } from 'react';
import type { AIThemeTokens } from '@eleva/ai-chat-core';
import { defaultRNTheme } from './default-rn-theme';

const AIThemeContext = createContext<AIThemeTokens>(defaultRNTheme);

export const AIThemeProvider: React.FC<{
  theme?: Partial<AIThemeTokens>;
  children: React.ReactNode;
}> = ({ theme, children }) => {
  const merged = useMemo(
    () => deepMerge(defaultRNTheme, theme ?? {}),
    [theme]
  );
  return (
    <AIThemeContext.Provider value={merged}>
      {children}
    </AIThemeContext.Provider>
  );
};

export const useAITheme = () => useContext(AIThemeContext);
```

```typescript
// @eleva/ai-chat-vue — Vue provide/inject
import { provide, inject } from 'vue';
import type { AIThemeTokens } from '@eleva/ai-chat-core';
import { defaultVueTheme } from './default-vue-theme';

const AI_THEME_KEY = Symbol('ai-theme');

export function provideAITheme(overrides?: Partial<AIThemeTokens>) {
  const theme = deepMerge(defaultVueTheme, overrides ?? {});
  provide(AI_THEME_KEY, theme);
}

export function useAITheme(): AIThemeTokens {
  return inject(AI_THEME_KEY, defaultVueTheme);
}
```

#### Consumer Usage

```tsx
// RN consumer — custom brand colors
<AIThemeProvider theme={{
  message: {
    userBackground: 'bg-blue-3',  // override user bubble color
    userText: 'text-blue-12',
  },
  header: {
    background: 'bg-blue-1',
  },
}}>
  <AIChatInterface config={chatConfig} />
</AIThemeProvider>
```

```vue
<!-- Vue consumer -->
<script setup>
import { provideAITheme, AiChatInterface } from '@eleva/ai-chat-vue';

provideAITheme({
  message: {
    userBackground: 'bg-blue-50',
    userText: 'text-blue-900',
  },
});
</script>
<template>
  <AiChatInterface :config="chatConfig" />
</template>
```

### Why This Works Cross-Platform

1. **Token values are strings.** The platform decides what those strings mean. RN uses `twrnc.style()`, web uses CSS classes directly.
2. **Deep merge for overrides.** Consumer only specifies what they want to change.
3. **Defaults ship with the package.** Works out of the box with Radix-based color scheme.
4. **No CSS-in-JS dependency.** No styled-components, no emotion. Just string tokens.

### Escape Hatch: Render Props / Component Overrides

For consumers who need complete control over a specific component, each container accepts optional render props:

```tsx
<AIChatInterface
  config={chatConfig}
  renderHeader={(props) => <MyCustomHeader {...props} />}
  renderInput={(props) => <MyCustomInput {...props} />}
  renderEmptyState={() => <MyBrandedEmptyState />}
/>
```

In Vue, this maps to named slots:

```vue
<AiChatInterface :config="chatConfig">
  <template #header="headerProps">
    <MyCustomHeader v-bind="headerProps" />
  </template>
  <template #empty-state>
    <MyBrandedEmptyState />
  </template>
</AiChatInterface>
```

---

## 6. Primitives Inventory

### 6.1 Chat Primitives

| Primitive | What It Does | Props / API | Platform | Default Impl | Customization |
|-----------|-------------|-------------|----------|--------------|---------------|
| `ChatMessagesList` | Scrollable list of messages | `messages: UIMessage[]`, `isLoading`, `status`, `error`, `onScroll`, `renderMessage?` | Per-platform | FlashList (RN), virtual-scroller (Vue), div (React) | `renderMessage` override |
| `MessageBubble` | Single message with avatar + parts | `message: UIMessage`, `isStreaming`, `avatarName?`, `avatarSrc?` | Per-platform | Bubble with avatar, part splitting | Theme tokens for colors, `renderAvatar` override |
| `TextPart` | Renders markdown text + streaming cursor | `part: TextPart`, `role`, `isStreaming` | Per-platform | Markdown renderer + animated cursor | Theme tokens, `enableMarkdown` toggle |
| `ToolPart` | Renders tool call state + input/output | `part: ToolPart`, `isStreaming` | Per-platform | Collapsible with state icon + JSON | Custom tool renderers via registry |
| `ReasoningPart` | Collapsible reasoning content | `part: ReasoningPart`, `isStreaming` | Per-platform | Collapsible with markdown | Theme tokens (iris accent) |
| `PartRenderer` | Dispatches part to correct renderer | `part: MessagePart`, `role`, `isStreaming`, `isLastPart` | Per-platform | Switch on type guards + registry lookup | Part registry for custom types |
| `InputField` | Text input with send/cancel | `onSend`, `isLoading`, `onCancel?`, `placeholder?` | Per-platform | Multi-line input + send button | Theme tokens, `maxLength` |
| `SendButton` | Send action button | `disabled`, `onPress` | Per-platform | Circular button with icon | Icon override, theme tokens |

### 6.2 Status Primitives

| Primitive | What It Does | Props / API | Platform | Default Impl |
|-----------|-------------|-------------|----------|--------------|
| `StatusIndicator` | Shows chat status (dot + label) | `status: ChatStatus` | Per-platform | Colored dot (amber=submitted, teal=streaming, ruby=error) |
| `StreamingCursor` | Blinking cursor during streaming | `color?`, `isActive` | Per-platform | Animated opacity block |
| `TypingIndicator` | Loading dots/spinner for assistant | `isVisible` | Per-platform | ActivityIndicator (RN), CSS dots (web) |
| `ErrorDisplay` | Categorized error with actions | `error: Error`, `onRetry?`, `onDismiss?`, `onFreshStart?` | Per-platform | Colored card with icon + action buttons |
| `ConnectionStatus` | Online/offline indicator | `isConnected` | Per-platform | Banner or dot |

### 6.3 Session Primitives

| Primitive | What It Does | Props / API | Platform | Default Impl |
|-----------|-------------|-------------|----------|--------------|
| `SessionList` | Renders list of sessions | `sessions`, `activeSessionId`, `onSelect`, `isLoading` | Per-platform | Flat list with active highlight |
| `SessionItem` | Single session row | `session`, `isActive`, `onPress` | Per-platform | Date title + active indicator dot |
| `SessionPanel` | Container for session list | `sessions`, `isVisible`, `onClose` | Per-platform | BottomSheet (RN), dropdown/drawer (web) |
| `NewConversationButton` | Creates a new session | `onPress` | Per-platform | Icon button (+ icon) |

### 6.4 Slide Primitives (from architecture-design.md)

| Primitive | What It Does | Props / API | Platform | Default Impl |
|-----------|-------------|-------------|----------|--------------|
| `SlideRenderer` | Renders slide schema into interactive form | `slide: Slide`, `toolCallId`, `onSubmit`, `readOnly?` | Per-platform | Header + blocks + actions |
| `BlockRenderer` | Maps block type to registered component | `block: Block`, `value`, `onChange`, `error?`, `readOnly?` | Per-platform | Registry lookup + fallback |
| `SlideHeader` | Slide title + subtitle | `header`, `subheader?` | Per-platform | Large text + description |
| `SlideActions` | Submit/skip/back buttons | `actions`, `onAction` | Per-platform | Primary + secondary buttons |
| `ProgressBar` | Step progress indicator | `current`, `total`, `label?` | Per-platform | Dots or segmented bar |
| `SlideSkeleton` | Placeholder while slide streams | — | Per-platform | Shimmer skeleton |

### 6.5 Layout Primitives

| Primitive | What It Does | Props / API | Platform | Default Impl |
|-----------|-------------|-------------|----------|--------------|
| `ChatContainer` | Main chat layout (header + messages + input) | `config: ChatConfig`, all callbacks | Per-platform | Vertical stack with keyboard avoidance |
| `FloatingPanel` | FAB + expandable chat panel | `config`, `isOpen`, `onToggle` | Per-platform | FAB button + animated panel (RN), popover (web) |
| `MiniChatBar` | Collapsed chat during slide mode | `latestMessages`, `onExpand` | Per-platform | 1-2 line text with expand chevron |

### 6.6 Utility Primitives

| Primitive | What It Does | Props / API | Platform | Default Impl |
|-----------|-------------|-------------|----------|--------------|
| `Collapsible` | Animated expand/collapse container | `title`, `isExpanded`, `accentColor`, `children` | Per-platform | Animated height + chevron rotation |
| `ScrollToBottomButton` | Floating button to scroll down | `isVisible`, `onPress` | Per-platform | Circular button with arrow |
| `CopyButton` | Copy text to clipboard | `text`, `onCopy?` | Per-platform | Button with copied/copy state |

---

## 7. Component/Part Registry Design

### 7.1 Core Registry Interface (framework-agnostic)

```typescript
// @eleva/ai-chat-core/src/registry/part-registry.ts

/**
 * Generic registry for mapping string keys to components.
 * TComponent is the component type for the target framework:
 *   - React: React.ComponentType<P>
 *   - Vue: DefineComponent<P>
 */
export class ComponentRegistry<TComponent> {
  private registry = new Map<string, TComponent>();

  /**
   * Register a component for a given key.
   * Overwrites existing registration.
   */
  register(key: string, component: TComponent): void {
    this.registry.set(key, component);
  }

  /**
   * Get the component for a key. Returns undefined if not registered.
   */
  get(key: string): TComponent | undefined {
    return this.registry.get(key);
  }

  /**
   * Check if a key has a registered component.
   */
  has(key: string): boolean {
    return this.registry.has(key);
  }

  /**
   * Get all registered keys.
   */
  keys(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Register multiple components at once.
   */
  registerAll(entries: Record<string, TComponent>): void {
    for (const [key, component] of Object.entries(entries)) {
      this.registry.set(key, component);
    }
  }
}
```

### 7.2 React/RN Part Registry (type-safe)

```typescript
// @eleva/ai-chat-react-native/src/registry/index.ts

import { ComponentRegistry } from '@eleva/ai-chat-core';
import type { MessagePart } from '@eleva/ai-chat-core';

/**
 * Props passed to every custom part renderer.
 */
export interface CustomPartRendererProps<T extends MessagePart = MessagePart> {
  part: T;
  role: 'user' | 'assistant';
  isStreaming: boolean;
  isLastPart: boolean;
}

/**
 * React component type for part renderers.
 */
export type PartComponent<T extends MessagePart = MessagePart> =
  React.ComponentType<CustomPartRendererProps<T>>;

/**
 * Singleton part registry for React/RN.
 * Pre-populated with default renderers.
 * Consumers add custom renderers via registerPartRenderer().
 */
const partRegistry = new ComponentRegistry<PartComponent>();

// Pre-register defaults
import { AITextPart } from '../parts/AITextPart';
import { AIToolPart } from '../parts/AIToolPart';
import { AIReasoningPart } from '../parts/AIReasoningPart';

partRegistry.register('text', AITextPart);
partRegistry.register('reasoning', AIReasoningPart);
// Tool parts use prefix matching, not exact key — handled in PartRenderer

/**
 * Register a custom part renderer.
 *
 * @example
 * // Register a custom "image" part renderer
 * registerPartRenderer('image', ImagePartRenderer);
 *
 * // Register a custom tool UI for "search_results" tool
 * registerToolRenderer('search_results', SearchResultsToolUI);
 */
export function registerPartRenderer<T extends MessagePart>(
  type: string,
  component: PartComponent<T>,
): void {
  partRegistry.register(type, component as PartComponent);
}

/**
 * Register a custom tool renderer (keyed by tool name).
 * When AIPartRenderer encounters a tool part, it checks:
 *   1. toolRegistry for toolName match
 *   2. Falls back to default AIToolPart
 */
const toolRegistry = new ComponentRegistry<PartComponent>();

export function registerToolRenderer<T extends MessagePart>(
  toolName: string,
  component: PartComponent<T>,
): void {
  toolRegistry.register(toolName, component as PartComponent);
}

export { partRegistry, toolRegistry };
```

### 7.3 Vue Part Registry

```typescript
// @eleva/ai-chat-vue/src/registry/index.ts

import { ComponentRegistry } from '@eleva/ai-chat-core';
import type { MessagePart } from '@eleva/ai-chat-core';
import type { DefineComponent } from 'vue';

/**
 * Vue component type for part renderers.
 * Props match the React interface for consistency.
 */
export type VuePartComponent = DefineComponent<{
  part: MessagePart;
  role: 'user' | 'assistant';
  isStreaming: boolean;
  isLastPart: boolean;
}>;

const partRegistry = new ComponentRegistry<VuePartComponent>();
const toolRegistry = new ComponentRegistry<VuePartComponent>();

// Pre-register defaults
import AiTextPart from '../parts/AiTextPart.vue';
import AiToolPart from '../parts/AiToolPart.vue';
import AiReasoningPart from '../parts/AiReasoningPart.vue';

partRegistry.register('text', AiTextPart as VuePartComponent);
partRegistry.register('reasoning', AiReasoningPart as VuePartComponent);

export function registerPartRenderer(type: string, component: VuePartComponent): void {
  partRegistry.register(type, component);
}

export function registerToolRenderer(toolName: string, component: VuePartComponent): void {
  toolRegistry.register(toolName, component);
}

export { partRegistry, toolRegistry };
```

### 7.4 Block Registry (for Slides)

```typescript
// @eleva/ai-chat-core/src/registry/block-registry.ts

import { ComponentRegistry } from './part-registry';

/**
 * Block renderer props — every block component receives these.
 * TBlock is the specific block type from the Zod union.
 */
export interface BlockRendererProps<TBlock = unknown> {
  block: TBlock;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  readOnly?: boolean;
}

/**
 * Usage:
 *
 * // React/RN
 * import { registerBlock } from '@eleva/ai-chat-react-native';
 * registerBlock('single-choice', SingleChoiceBlock);
 * registerBlock('text-input', TextInputBlock);
 * registerBlock('color-picker', MyCustomColorPicker); // custom block
 *
 * // Vue
 * import { registerBlock } from '@eleva/ai-chat-vue';
 * registerBlock('single-choice', SingleChoiceBlock);
 */
```

### 7.5 How Custom Registration Works

#### Compile-Time (Recommended)

```typescript
// In the consumer's app initialization (e.g., App.tsx)
import { registerToolRenderer, registerBlock } from '@eleva/ai-chat-react-native';

// Custom tool UI for "search_results" tool
import { SearchResultsToolUI } from './ai/tools/SearchResultsToolUI';
registerToolRenderer('search_results', SearchResultsToolUI);

// Custom block type for slides
import { ColorPickerBlock } from './ai/blocks/ColorPickerBlock';
registerBlock('color-picker', ColorPickerBlock);
```

#### Runtime Registration

```typescript
// For dynamically loaded tools/blocks (e.g., from a plugin system)
async function loadPluginTools(pluginId: string) {
  const plugin = await import(`./plugins/${pluginId}/tools`);
  for (const [name, component] of Object.entries(plugin.toolRenderers)) {
    registerToolRenderer(name, component);
  }
}
```

#### The PartRenderer Uses the Registry

```typescript
// Inside AIPartRenderer.tsx
export const AIPartRenderer: React.FC<AIPartRendererProps> = ({ part, role, isStreaming, isLastPart }) => {
  const theme = useAITheme();

  // 1. Check part registry for exact type match
  const RegisteredPart = partRegistry.get(part.type);
  if (RegisteredPart) {
    return <RegisteredPart part={part} role={role} isStreaming={isStreaming} isLastPart={isLastPart} />;
  }

  // 2. For tool parts, check tool registry by toolName
  if (isToolPart(part)) {
    const toolName = (part as ToolPart).toolName;
    const RegisteredTool = toolRegistry.get(toolName);
    if (RegisteredTool) {
      return <RegisteredTool part={part} role={role} isStreaming={isStreaming} isLastPart={isLastPart} />;
    }
    // Fall back to default tool renderer
    return <AIToolPart part={part} isStreaming={isStreaming} />;
  }

  // 3. Unknown type — dev warning
  if (__DEV__) {
    return <UnknownPartWarning type={part.type} />;
  }
  return null;
};
```

---

## 8. Generalization Changes (What to Decouple Per File)

### 8.1 Transport / Auth Layer

| Current | Generalization | Interface |
|---------|---------------|-----------|
| `AIChatService.getStreamEndpoint()` — reads from Redux `state.settings.installationUrl` + `state.auth.user.account_id` | `config.getStreamEndpoint()` — consumer provides | `ChatConfig.streamEndpoint: string \| (() => string)` |
| `AIChatService.getAuthHeaders()` — reads DeviseTokenAuth headers from Redux | `config.getAuthHeaders()` — consumer provides | `ChatConfig.getHeaders: () => Record<string, string>` |
| `expoFetch` for RN streaming | Platform package selects correct fetch | RN package uses `expo/fetch` by default, web uses native `fetch` |
| `prepareSendMessagesRequest` — Chatwoot format (`agent_bot_id`, `chat_session_id`) | `config.prepareRequest(messages)` — consumer provides | `ChatConfig.prepareRequest?: (opts) => { body, headers }` |
| Error parsing — Chatwoot fields (`error_details`, `error`, `message`) | `config.parseError?.(response)` — consumer provides or uses default | `ChatConfig.parseError?: (response: Response) => Promise<string>` |

### 8.2 Persistence Layer

| Current | Generalization |
|---------|---------------|
| `AsyncStorage.getItem/setItem(AI_CHAT_SESSION_KEY)` | `PersistenceAdapter.get(key)` / `PersistenceAdapter.set(key, value)` |
| `AppState.addEventListener` (RN background/foreground) | Platform-specific, stays in RN package only |

```typescript
// @eleva/ai-chat-core/src/types/chat.ts
export interface PersistenceAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

// RN default implementation
import AsyncStorage from '@react-native-async-storage/async-storage';
export const asyncStoragePersistence: PersistenceAdapter = {
  get: (key) => AsyncStorage.getItem(key),
  set: (key, value) => AsyncStorage.setItem(key, value),
  remove: (key) => AsyncStorage.removeItem(key),
};

// Web default implementation
export const localStoragePersistence: PersistenceAdapter = {
  get: async (key) => localStorage.getItem(key),
  set: async (key, value) => localStorage.setItem(key, value),
  remove: async (key) => localStorage.removeItem(key),
};
```

### 8.3 State Management (Sessions)

| Current | Generalization |
|---------|---------------|
| Redux: `useAppDispatch`, `useAppSelector`, `aiChatActions`, selectors | `SessionsAdapter` interface |
| `aiChatActions.fetchSessions` — Chatwoot API | `sessionsAdapter.fetchSessions(botId)` |
| `aiChatActions.fetchMessages` — Chatwoot API | `sessionsAdapter.fetchMessages(sessionId)` |
| `selectActiveSessionId`, `setActiveSession` — Redux | `sessionsAdapter.getActiveSessionId()`, `sessionsAdapter.setActiveSessionId(id)` |

```typescript
// @eleva/ai-chat-core/src/types/session.ts
export interface SessionsAdapter {
  fetchSessions(params: { agentBotId: number; limit?: number }): Promise<{ sessions: ChatSession[] }>;
  fetchMessages(params: { sessionId: string; limit?: number }): Promise<{ messages: ChatMessage[] }>;
  deleteSession?(sessionId: string): Promise<void>;

  // State management — consumer provides reactive state
  getActiveSessionId(): string | null;
  setActiveSessionId(id: string | null): void;
  getIsLoadingSessions(): boolean;
  getIsLoadingMessages(): boolean;
}
```

### 8.4 i18n

| Current | Generalization |
|---------|---------------|
| `i18n.t('AI_ASSISTANT.CHAT.TOOLS.PENDING')` — i18n-js with hardcoded keys | `i18n.t(key)` via pluggable provider |

```typescript
// @eleva/ai-chat-core/src/types/chat.ts
export interface I18nProvider {
  t(key: string, params?: Record<string, unknown>): string;
}

// Default: returns the key itself (English fallback built into the key path)
export const defaultI18n: I18nProvider = {
  t: (key, params) => {
    // Strip prefix and format as readable text
    const parts = key.split('.');
    const last = parts[parts.length - 1];
    return last.replace(/_/g, ' ').toLowerCase();
  },
};
```

Each platform package ships with default English strings. Consumers override via their i18n provider.

### 8.5 Styling

| Current | Generalization |
|---------|---------------|
| `useAIStyles()` → `useThemedStyles()` (Chatwoot-specific) | `useAITheme()` → platform-specific theme context |
| `style('text-sm font-inter-normal-20')` — twrnc | Theme tokens consumed by platform's style system |
| `tailwind.color('text-iris-9')` — twrnc color extraction | `theme.getColor('iris-9')` or direct token usage |

### 8.6 Navigation / App-Specific

| Current | Generalization |
|---------|---------------|
| `TAB_BAR_HEIGHT` constant | `config.layout.bottomInset` or removed |
| `useScaleAnimation`, `useHaptic` | Optional, stays in consumer or provided via optional deps |
| `selectUser` (Redux) — for user avatar | `config.user?: { name?: string; avatarUrl?: string }` |

---

## 9. Vue-Specific Considerations

### 9.1 Chatwoot Vue Architecture Already Mirrors Ours

The Chatwoot Vue web app at `/chatwoot/app/javascript/dashboard/components-next/ai-assistant/` already has:

| Mobile (React Native) | Chatwoot Web (Vue 3) | Shared Pattern? |
|----------------------|---------------------|-----------------|
| `useAIChat.ts` | `useVercelChat.js` + `useAiAssistant.js` | YES — both wrap `Chat` class from AI SDK |
| `AIPartRenderer.tsx` | `AiPartRenderer.vue` | YES — computed component switch on `part.type` |
| `AITextPart.tsx` | `AiTextPart.vue` | YES — markdown rendering |
| `AIToolPart.tsx` | `AiToolPart.vue` | YES — tool state display |
| `AIReasoningPart.tsx` | `AiReasoningPart.vue` | YES — collapsible reasoning |
| `useAIChatSessions.ts` | `useAiChatSessionManager.js` | YES — session CRUD |
| `AIChatInterface.tsx` | `AiChatPanel.vue` | YES — container orchestration |

**Key finding**: The Vue equivalents already exist in the Chatwoot codebase. The `@eleva/ai-chat-vue` package would formalize and generalize these existing patterns, not create them from scratch.

### 9.2 Vue-Specific Differences

| Concern | React/RN Pattern | Vue Pattern |
|---------|------------------|-------------|
| State reactivity | `useState` + `useRef` | `ref()` + `computed()` |
| Side effects | `useEffect` with deps | `watch()` / `watchEffect()` |
| Context | React Context + Provider | `provide()` / `inject()` |
| Component registration | JSX import + conditional render | `<component :is="">` + `defineAsyncComponent` |
| Slots/render props | Render props (`renderHeader`) | Named slots (`<template #header>`) |
| Animation | `react-native-reanimated` | CSS transitions / `<Transition>` component |
| List virtualization | `FlashList` | `vue-virtual-scroller` (already in Chatwoot deps) |
| Markdown | `react-native-markdown-display` | `markdown-it` (already in Chatwoot deps) |

### 9.3 Reactivity Workaround

The existing `useVercelChat.js` has a polling workaround because `@ai-sdk/vue`'s `Chat` class doesn't trigger Vue's reactivity system properly during streaming. The `@eleva/ai-chat-vue` package must inherit or improve this pattern:

```javascript
// Current workaround in Chatwoot's useVercelChat.js
// Polls chat state every 100ms and deep-clones to trigger Vue reactivity
const pollInterval = setInterval(() => {
  messages.value = structuredClone(chat.messages);
  status.value = chat.status;
}, 100);
```

This is a known limitation of AI SDK Vue support and affects all Vue consumers equally.

### 9.4 Zod Version

Chatwoot uses Zod `^4.1.13`. The mobile app uses Zod `^3.x`. The core package should declare `zod` as a peer dependency with `"^3.0.0 || ^4.0.0"` to support both.

---

## 10. Migration Path

### Phase 1: Extract Core Package (3-5 days)

1. Create `packages/ai-chat-core/` in the chatscommerce monorepo
2. Move these files with minimal changes:
   - `types/ai-chat/constants.ts` → `core/src/types/constants.ts`
   - `types/ai-chat/parts.ts` → split into `core/src/types/parts.ts` + `core/src/utils/part-helpers.ts`
   - `store/ai-chat/aiChatSchemas.ts` → `core/src/types/schemas.ts`
   - `store/ai-chat/aiChatMapper.ts` → `core/src/utils/message-mapper.ts`
   - `utils/ai-assistant/aiChatMessageUtils.ts` → `core/src/utils/message-validation.ts`
3. Extract pure functions from components:
   - `formatToolName`, `formatJson` from `AIToolPart.tsx` → `core/src/utils/format.ts`
   - `categorizeError` from `AIChatError.tsx` → `core/src/utils/error.ts`
   - `formatSessionTitle` from `AISessionItem.tsx` → `core/src/utils/format.ts`
4. Create new interface files:
   - `core/src/types/chat.ts` — `ChatConfig`, `PersistenceAdapter`, `I18nProvider`
   - `core/src/types/session.ts` — `SessionsAdapter`, `ChatSession`
   - `core/src/theme/token-types.ts` — token interface definitions
5. Create registry classes:
   - `core/src/registry/part-registry.ts`
6. Write package.json with peer deps: `ai@^5`, `zod@^3 || ^4`
7. Write tests for all pure functions

**Risk**: Low. All moved code is pure functions with no framework deps.
**Effort**: 3-5 days.

### Phase 2: Create RN Package as Wrapper (5-7 days)

1. Create `packages/ai-chat-react-native/`
2. Move all hooks, parts, components, containers from the mobile app
3. Replace hardcoded dependencies with config-based:
   - `AIChatService.getStreamEndpoint()` → `config.streamEndpoint`
   - `AIChatService.getAuthHeaders()` → `config.getHeaders()`
   - `useAppDispatch`/`useAppSelector` → `sessionsAdapter` interface
   - `i18n.t()` → `i18nProvider.t()`
   - `useThemedStyles` → `useAITheme()` from package theme context
4. Add `AIThemeProvider` with default RN theme
5. Add part/tool/block registries pre-populated with defaults
6. Export everything from `index.ts`

**Risk**: Medium. The main risk is breaking the existing Chatwoot mobile app during extraction. Mitigated by:
   - Using the package from the mobile app immediately (dogfooding)
   - Keeping Chatwoot-specific config in the app's initialization code
   - Running the mobile app's test suite after extraction

**Effort**: 5-7 days.

### Phase 3: Migrate Chatwoot Mobile App (2-3 days)

1. Install `@eleva/ai-chat-core` and `@eleva/ai-chat-react-native` from the monorepo
2. Create a Chatwoot-specific config:

```typescript
// chatwoot-mobile-app/src/ai/chatwootChatConfig.ts
import type { ChatConfig } from '@eleva/ai-chat-core';
import { AIChatService } from '@/store/ai-chat/aiChatService';
import { asyncStoragePersistence } from '@eleva/ai-chat-react-native';

export const chatwootChatConfig: ChatConfig = {
  streamEndpoint: () => AIChatService.getStreamEndpoint(),
  getHeaders: () => ({
    ...AIChatService.getAuthHeaders(),
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  }),
  prepareRequest: (options) => ({
    body: {
      messages: [{ role: options.lastMessage.role, content: extractText(options.lastMessage) }],
      agent_bot_id: options.metadata.agentBotId,
      ...(options.metadata.sessionId ? { chat_session_id: options.metadata.sessionId } : {}),
    },
    headers: options.headers,
  }),
  parseError: async (response) => {
    // Chatwoot-specific error parsing
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      return json.error_details || json.error || json.message || text;
    } catch {
      return text || `HTTP ${response.status}`;
    }
  },
  persistence: asyncStoragePersistence,
};
```

3. Create a Chatwoot-specific sessions adapter wrapping Redux:

```typescript
// chatwoot-mobile-app/src/ai/chatwootSessionsAdapter.ts
import type { SessionsAdapter } from '@eleva/ai-chat-core';
import { getStore } from '@/store/storeAccessor';
// ... wrap existing Redux actions and selectors
```

4. Replace direct imports of moved files with package imports
5. Run full test suite + manual testing

**Risk**: Medium. Mostly import path changes.
**Effort**: 2-3 days.

### Phase 4: Create Vue Package (8-12 days)

1. Create `packages/ai-chat-vue/`
2. Use Chatwoot's existing Vue AI components as reference/starting point
3. Build Vue composables wrapping `@ai-sdk/vue`
4. Build Vue components with Tailwind CSS styling
5. Test against Chatwoot web app

**Risk**: Medium. The `@ai-sdk/vue` reactivity workaround is the main concern.
**Effort**: 8-12 days (this is essentially the work described in Research 2F Strategy A).

### Phase 5: Create React Web Package (5-7 days, when needed)

1. Create `packages/ai-chat-react/`
2. Port hooks from RN (remove RN-specific: `AppState`, `FlashList`, `expo/fetch`)
3. Build web components with Tailwind CSS
4. Use `IntersectionObserver` for scroll management instead of `NativeScrollEvent`
5. Use `react-markdown` or `markdown-it` instead of `react-native-markdown-display`
6. Use CSS transitions instead of `react-native-reanimated`

**Risk**: Low. React web is the simplest platform — no RN gotchas, no Vue reactivity issues.
**Effort**: 5-7 days.

---

## 11. Effort Estimate

| Phase | Work | Days | Risk |
|-------|------|------|------|
| 1. Extract core package | Types, schemas, utils, registries, interfaces | 3-5 | Low |
| 2. Create RN package | Move + generalize hooks/components | 5-7 | Medium |
| 3. Migrate mobile app | Install packages, create config, update imports | 2-3 | Medium |
| 4. Create Vue package | Composables + components, test with Chatwoot web | 8-12 | Medium |
| 5. Create React web package | Port from RN, web-specific rendering | 5-7 | Low |
| **Total** | | **23-34 days** | |

### Phasing Recommendation

- **MVP** (Phases 1-3): 10-15 days. Core + RN + mobile app migration. This validates the architecture without adding new platforms.
- **Vue** (Phase 4): 8-12 days. Can be done in parallel with Phase 3 by a different developer.
- **React web** (Phase 5): Defer until actually needed. The core + RN packages prove the pattern.

### What NOT to Do

1. **Don't extract too early.** The current code is still evolving (slides aren't built yet). Extract AFTER the slides feature is working in the mobile app.
2. **Don't try to share UI components across RN and web.** React Native's `View`/`Text`/`FlashList` and web's `div`/`span`/CSS are fundamentally different. Share types and logic, not rendering.
3. **Don't add assistant-ui.** Research 2G conclusively showed it's a parallel stack, not a complement. The AI SDK approach is simpler and already proven.
4. **Don't build the React web package until there's a concrete consumer.** It's the easiest platform to add later.

---

## Appendix A: ChatConfig Interface (Full)

```typescript
// @eleva/ai-chat-core/src/types/chat.ts

import type { UIMessage } from 'ai';

/**
 * Configuration for initializing an AI chat instance.
 * Consumer provides this to connect the library to their backend.
 */
export interface ChatConfig {
  /** SSE streaming endpoint URL (string or function for dynamic resolution) */
  streamEndpoint: string | (() => string);

  /** Returns auth headers for the streaming transport */
  getHeaders: () => Record<string, string> | Promise<Record<string, string>>;

  /**
   * Transform the request body before sending.
   * Use this to match your backend's expected format.
   * If not provided, sends standard AI SDK format.
   */
  prepareRequest?: (options: {
    messages: UIMessage[];
    lastMessage: UIMessage;
    headers: Record<string, string>;
    metadata: Record<string, unknown>;
  }) => { body: Record<string, unknown>; headers: Record<string, string> };

  /**
   * Parse error responses from your backend.
   * If not provided, uses generic HTTP status text.
   */
  parseError?: (response: Response) => Promise<string>;

  /** Persistence adapter for session IDs */
  persistence?: PersistenceAdapter;

  /** I18n provider for translating UI strings */
  i18n?: I18nProvider;

  /** User info for avatar display */
  user?: {
    name?: string;
    avatarUrl?: string;
  };

  /** Bot info (if not using bot selection) */
  bot?: {
    id: number;
    name?: string;
    avatarUrl?: string;
  };

  /** Throttle for streaming updates (ms). Default: 150 */
  streamThrottle?: number;

  /** Custom fetch function (for RN, use expo/fetch) */
  fetch?: typeof globalThis.fetch;

  /**
   * Extract session ID from streaming response.
   * Default: reads 'X-Chat-Session-Id' header.
   */
  extractSessionId?: (response: Response) => string | null;

  /**
   * For tool-result flows: auto-continue when condition is met.
   * Maps to AI SDK's sendAutomaticallyWhen.
   */
  sendAutomaticallyWhen?: (options: { messages: UIMessage[] }) => boolean;
}
```

## Appendix B: Chatwoot Vue Files That Map to Our Mobile Files

| Mobile File | Chatwoot Vue Equivalent | Notes |
|-------------|------------------------|-------|
| `useAIChat.ts` | `useVercelChat.js` + `useAiAssistant.js` | Vue wraps `Chat` class with polling workaround |
| `AIPartRenderer.tsx` | `AiPartRenderer.vue` | Identical pattern: computed component switch |
| `AITextPart.tsx` | `AiTextPart.vue` | Both render markdown, cursor differs |
| `AIToolPart.tsx` | `AiToolPart.vue` | Both show state + collapsible JSON |
| `AIReasoningPart.tsx` | `AiReasoningPart.vue` | Both collapsible with markdown |
| `AICollapsible.tsx` | (inline in Vue parts) | Vue uses `<Transition>` |
| `AIChatMessagesList.tsx` | `AiConversation.vue` | FlashList vs DOM scroll |
| `AIMessageBubble.tsx` | `AiMessage.vue` + `AiMessageContent.vue` | Split differently but same concept |
| `AIChatHeader.tsx` | Part of `AiChatPanel.vue` | Inlined in Vue |
| `AIInputField.tsx` | `AiPromptInput.vue` | Same: input + send button |
| `AIChatError.tsx` | `AiChatError.vue` | Same: categorized error display |
| `useAIChatSessions.ts` | `useAiChatSessionManager.js` | Same: CRUD + active session |
| `AIChatInterface.tsx` | `AiChatPanel.vue` | Main container |
| `FloatingAIAssistant.tsx` | `AiAssistant.vue` | Layout modes: floating, sidebar, inline |
| `aiChatService.ts` | API calls in `useAiAssistant.js` | Both use Axios with auth |
| `aiChatSchemas.ts` | (no Zod in Vue currently) | Vue uses runtime validation |
| `aiChatMapper.ts` | `useAiMessageMapper.js` | Same: DTO → SDK format |
| `parts.ts` / `constants.ts` | `constants.js` in ai-assistant | Same constants, JS vs TS |
