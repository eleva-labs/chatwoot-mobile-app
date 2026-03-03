# Unit Testing Architecture Guide

**Project**: `@chatwoot/mobile-app` v4.0.19  
**Stack**: React Native 0.76.9, Expo SDK 52, TypeScript, Redux Toolkit, Clean Architecture  
**Date**: March 2026  
**Purpose**: Comprehensive reference guide for unit testing practices

---

## 1. Overview

### Testing Philosophy

This React Native + Expo application uses Clean Architecture principles with distinct layers (domain, infrastructure, application, screens, presentation). The testing strategy exploits these boundaries:

**Core Principle: Test behavior, not implementation.**

Following Kent C. Dodds and the Redux official testing guide (2025), we prefer integration tests that render components with a real Redux store rather than mocking selectors or dispatch functions.

### Tech Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| Jest | ^29.6.3 | Test runner |
| @testing-library/react-native (RNTL) | ^13.3.3 | Component testing |
| react-test-renderer | ^18.3.1 | Required by RNTL v13 |
| @types/jest | ^29.5.12 | TypeScript types |
| Redux Toolkit | — | State management |
| tsyringe | — | Dependency injection |

**Notable**: We do NOT use `@testing-library/react-hooks` (deprecated) — `renderHook` is built into RNTL v13+.

### Key Principles

1. **Test behavior, not implementation**: Verify what the user sees and experiences, not internal state mechanics
2. **Layer-specific testing strategies**: Domain has different testing needs than UI components
3. **Builder pattern for test data**: Complex objects (Conversation, Notification, etc.) use fluent builders for maintainability
4. **Semantic queries**: Use `getByRole`, `getByLabelText`, `getByText` over `getByTestId` when possible
5. **Real Redux store in tests**: Use `renderWithProviders` with preloaded state instead of mocking Redux

---

## 2. Architecture Layers & Testing Strategy

| Layer | Location | What to Test | Testing Approach | Dependencies Allowed | Example Files |
|-------|----------|--------------|------------------|---------------------|---------------|
| **Domain** | `src/domain/` | Pure business logic: entities, type guards, validators, Zod schemas | Direct function calls, no providers needed | None (pure TypeScript) | `Answer.test.ts`, `Screen.test.ts`, `ConditionalLogicService.test.ts` |
| **Infrastructure** | `src/infrastructure/` | Hooks, utilities, UI components, theme system, i18n | `renderHook` for hooks, `render` for components | `@domain/`, `@application/` | `useThemedStyles.test.ts`, `dateTimeUtils.spec.ts`, `Avatar.test.tsx` |
| **Application/Store** | `src/application/store/` | Reducers, selectors, async thunks, middleware | Reducer unit tests + integration tests with real store | `@domain/`, `@infrastructure/` | `authSlice.spec.ts`, `notificationActions.test.ts`, `conversationService.spec.ts` |
| **Screens** | `src/screens/` | User flows, navigation, form submission | Full integration with `renderWithProviders` | All layers | `ConversationList.test.tsx` (future) |
| **Presentation/AI Chat** | `src/presentation/ai-chat/` | Message rendering, streaming, user interactions | Integration tests with providers | All layers | `useMessageBridge.test.ts`, `AIMessageBubble.test.tsx` (future) |

---

## 3. File Organization & Naming

### Directory Structure

```
src/
├── __tests__/                       # Global test infrastructure
│   ├── setup.ts                     # Global Jest setup (mocks RN, navigation, etc.)
│   ├── helpers/
│   │   ├── render.tsx               # renderWithProviders, createTestStore
│   │   ├── builders/                # Test data builders
│   │   │   ├── conversationBuilder.ts
│   │   │   ├── notificationBuilder.ts
│   │   │   ├── aiChatMessageBuilder.ts
│   │   │   └── index.ts             # Barrel file
│   │   ├── matchers/
│   │   │   └── resultMatchers.ts    # Custom Jest matchers
│   │   └── fixtures/
│   │       └── index.ts             # Static test data
│
├── application/store/
│   └── auth/
│       ├── authSlice.ts
│       ├── authActions.ts
│       └── __tests__/               # Co-located tests
│           ├── authSlice.test.ts
│           └── authActions.test.ts
│
├── presentation/ai-chat/
│   └── hooks/ai-assistant/
│       ├── useAIChat.ts
│       └── __tests__/
│           └── useAIChat.test.ts
│
└── modules/onboarding/              # Exemplary module with comprehensive tests
    └── __tests__/
        ├── setup.ts                 # Module-specific setup (extends global)
        └── helpers/                 # Pattern source for project-wide builders
```

### Naming Conventions

- **New tests**: Use `.test.ts` or `.test.tsx` suffix
- **Legacy Redux tests**: Use `.spec.ts` suffix (38 files exist with this pattern)
- **Test directories**: Use `__tests__/` next to source files (co-located)
- **Centralized test code**: Lives in `src/__tests__/helpers/`

**Why two conventions coexist**: `.spec.ts` is legacy from the original Chatwoot codebase. All new tests use `.test.ts` (React/RN community standard).

---

## 4. Test Utilities Reference

### 4a. Rendering Helpers (`src/__tests__/helpers/render.tsx`)

#### `renderWithProviders(ui, options)`

Renders a React component wrapped in all necessary providers (Redux, Theme, etc.).

**Parameters:**
- `ui: React.ReactElement` — Component to render
- `options?: { preloadedState?, store? }` — Optional Redux preloaded state or custom store

**Returns:** `{ store, ...renderResult }` — Store instance + all RNTL queries

**Example:**
```tsx
import { renderWithProviders, screen } from '@/__tests__/helpers/render';

test('displays user name', () => {
  renderWithProviders(<UserProfile />, {
    preloadedState: {
      auth: { user: { name: 'Alice' }, isLoggedIn: true },
    },
  });
  
  expect(screen.getByText('Alice')).toBeOnTheScreen();
});
```

#### `createTestStore(preloadedState?)`

Creates a Redux store for testing with middleware disabled.

**Parameters:**
- `preloadedState?: Partial<RootState>` — Initial Redux state

**Returns:** `Store` — Configured Redux store

**Example:**
```ts
import { createTestStore } from '@/__tests__/helpers/render';
import { notificationActions } from '@application/store/notification/notificationAction';

test('dispatches action', async () => {
  const store = createTestStore();
  await store.dispatch(notificationActions.fetchNotifications({ page: 1, sort_order: 'desc' }));
  expect(store.getState().notifications.ids).toHaveLength(0);
});
```

#### Re-exports from RNTL

For convenience, `render.tsx` re-exports:
- `screen` — Central query object (use this instead of destructuring from `render()`)
- `userEvent` — User interaction API (use this instead of `fireEvent`)
- `act` — Wrap state updates that happen outside React
- `within` — Scope queries to a subtree
- `waitFor` — Wait for async updates

**Example:**
```tsx
import { screen, userEvent, waitFor } from '@/__tests__/helpers/render';

const user = userEvent.setup();
await user.press(screen.getByRole('button', { name: 'Submit' }));
await waitFor(() => expect(screen.getByText('Success')).toBeOnTheScreen());
```

---

### 4b. Type Builders (`src/__tests__/helpers/builders/`)

Builders provide fluent APIs for creating test data with sensible defaults.

#### `aConversation()`

**Import:** `import { aConversation } from '@/__tests__/helpers/builders';`

**Fluent Methods:**
- `.withId(id: number)` — Set conversation ID
- `.withStatus(status: 'open' | 'resolved' | 'pending' | 'snoozed')` — Set status
- `.withUnreadCount(count: number)` — Set unread message count
- `.withLabels(labels: string[])` — Set labels
- `.withAssignee(assignee: Agent)` — Set assigned agent
- `.withInboxId(inboxId: number)` — Set inbox ID
- `.withPriority(priority: ConversationPriority)` — Set priority
- `.withMeta(meta: ConversationMeta)` — Set metadata
- `.withLastNonActivityMessage(message: Message | null)` — Set last message
- `.withMessages(messages: Message[])` — Set all messages
- `.withMuted(muted: boolean)` — Set muted state
- `.withChannel(channel: Channel)` — Set channel type
- `.withCreatedAt(timestamp: number)` — Set creation timestamp
- `.build()` — Returns `Conversation`

**Example:**
```ts
const conversation = aConversation()
  .withId(42)
  .withStatus('open')
  .withUnreadCount(5)
  .withLabels(['urgent', 'customer-support'])
  .build();
```

#### `aNotification()`

**Import:** `import { aNotification } from '@/__tests__/helpers/builders';`

**Fluent Methods:**
- `.withId(id: number)` — Set notification ID
- `.withNotificationType(type: NotificationType)` — Set type (e.g., `'conversation_assignment'`)
- `.withRead()` — Mark as read (sets `readAt` to current timestamp)
- `.withUnread()` — Mark as unread (sets `readAt` to empty string)
- `.withPrimaryActor(actor: PrimaryActor)` — Set primary actor
- `.withPrimaryActorId(id: number)` — Set primary actor ID
- `.withPushMessageTitle(title: string)` — Set push notification title
- `.withUser(user: User)` — Set user
- `.withSnoozedUntil(timestamp: string)` — Set snooze expiration
- `.withCreatedAt(timestamp: number)` — Set creation timestamp
- `.withLastActivityAt(timestamp: number)` — Set last activity timestamp
- `.withMeta(meta: object)` — Set metadata
- `.build()` — Returns `Notification`

**Example:**
```ts
const notification = aNotification()
  .withId(1)
  .withNotificationType('assigned_conversation_new_message')
  .withUnread()
  .withPushMessageTitle('New message from John')
  .build();
```

#### `anAIChatMessage()`

**Import:** `import { anAIChatMessage } from '@/__tests__/helpers/builders';`

**Fluent Methods:**
- `.withId(id: string)` — Set message ID
- `.withRole(role: 'user' | 'assistant' | 'system')` — Set sender role
- `.withContent(content: string)` — Set message content
- `.withParts(parts: AIChatMessagePart[])` — Set message parts
- `.withSessionId(sessionId: string)` — Set chat session ID
- `.withTimestamp(timestamp: string)` — Set timestamp
- `.withTextPart(text: string)` — Add a text part
- `.withToolCallPart(toolName: string, args: object, state?: string)` — Add a tool invocation part
- `.build()` — Returns `AIChatMessage`

**Example:**
```ts
const message = anAIChatMessage()
  .withId('msg-1')
  .withRole('assistant')
  .withTextPart('Hello! How can I help you?')
  .withToolCallPart('search_orders', { query: '#123' }, 'result')
  .build();
```

#### `aContact()`, `anAgent()`, `aMessage()`

Similar builders exist for other domain types. See `src/__tests__/helpers/builders/index.ts` for full list.

#### Onboarding Builders

**Import:** `import { aScreen, anOnboardingFlow, anAnswer } from '@/__tests__/helpers/builders';`

These builders are specific to the onboarding module but are re-exported from the global barrel for backward compatibility. See `src/modules/onboarding/__tests__/helpers/builders.ts` for full API.

**Example:**
```ts
const screen = aScreen()
  .withId('q1')
  .withTitle('What is your name?')
  .withQuestionType('text')
  .withRequired()
  .build();

const flow = anOnboardingFlow()
  .withDefaultScreens()
  .withIsSkippable(false)
  .build();
```

---

### 4c. Custom Matchers (`src/__tests__/helpers/matchers/`)

#### `toBeSuccess()`, `toBeFailure()`, `toHaveValue()`, `toHaveError()`

Custom Jest matchers for testing `Result<T,E>` pattern (used in onboarding module).

**Import:** Auto-extended globally via `src/__tests__/setup.ts`

**Usage:**
```ts
import { ValidationService } from '@/modules/onboarding/domain/services/ValidationService';

test('validation returns success', () => {
  const result = ValidationService.validate('test@example.com', { pattern: '^[^@]+@[^@]+\\.[^@]+$' });
  expect(result).toBeSuccess();
  expect(result).toHaveValue('test@example.com');
});

test('validation returns failure', () => {
  const result = ValidationService.validate('invalid-email', { pattern: '^[^@]+@[^@]+\\.[^@]+$' });
  expect(result).toBeFailure();
  expect(result).toHaveError('Invalid format');
});
```

**When to use**: Only when testing code that returns `Result<T,E>` objects. Most tests use standard Jest matchers like `toBe()`, `toEqual()`, `toBeOnTheScreen()`.

---

## 5. Testing Patterns by Type

### 5a. Domain Layer Tests

Pure TypeScript — no React, no RNTL.

#### Testing Zod Schemas

```ts
// src/domain/types/ai-chat/__tests__/parts.test.ts

import { AIChatMessagePartApiSchema } from '@application/store/ai-chat/aiChatSchemas';

describe('AIChatMessagePartApiSchema', () => {
  it('parses valid text part', () => {
    const result = AIChatMessagePartApiSchema.parse({ type: 'text', text: 'Hello' });
    expect(result).toEqual({ type: 'text', text: 'Hello' });
  });

  it('rejects missing type field', () => {
    expect(() => AIChatMessagePartApiSchema.parse({ text: 'Hello' })).toThrow();
  });

  it('rejects invalid type', () => {
    expect(() => AIChatMessagePartApiSchema.parse({ type: 'invalid' })).toThrow();
  });
});
```

**What to test:**
- Valid input parses correctly
- Invalid input throws errors
- Optional fields work
- Type transformations (Zod `.transform()`, `.refine()`, etc.)

**What NOT to test:**
- Zod's internal mechanics
- Every possible invalid input combination (focus on boundary cases)

---

### 5b. Redux Store Tests

#### Pattern: Testing a Slice (Reducers)

```ts
// src/application/store/notification/__tests__/notificationSlice.test.ts

import reducer, {
  resetNotifications,
  addNotification,
  removeNotification,
} from '../notificationSlice';
import { notificationActions } from '../notificationAction';
import { aNotification } from '@/__tests__/helpers/builders';

// Only mock what this module DIRECTLY depends on (not global mocks)
jest.mock('@infrastructure/utils/pushUtils', () => ({
  updateBadgeCount: jest.fn(),
}));

describe('notificationSlice', () => {
  const getInitialState = () => reducer(undefined, { type: 'unknown' });

  it('returns correct initial state', () => {
    const state = getInitialState();
    expect(state.unreadCount).toBe(0);
    expect(state.totalCount).toBe(0);
    expect(state.uiFlags.isLoading).toBe(false);
    expect(state.ids).toEqual([]);
  });

  describe('resetNotifications', () => {
    it('clears all notifications and resets counts', () => {
      // Use builder to create test data
      const notification = aNotification().withId(1).build();
      
      // Manually add notification to state
      const stateWithNotification = {
        ...getInitialState(),
        ids: [1],
        entities: { 1: notification },
        unreadCount: 5,
        totalCount: 10,
      };

      const result = reducer(stateWithNotification, resetNotifications());

      expect(result.ids).toEqual([]);
      expect(result.unreadCount).toBe(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('fetchNotifications (async thunk lifecycle)', () => {
    it('sets isLoading on pending', () => {
      const action = { type: notificationActions.fetchNotifications.pending.type };
      const state = reducer(getInitialState(), action);
      expect(state.uiFlags.isLoading).toBe(true);
    });

    it('populates notifications on fulfilled', () => {
      const notifications = [
        aNotification().withId(1).build(),
        aNotification().withId(2).build(),
      ];
      
      const action = {
        type: notificationActions.fetchNotifications.fulfilled.type,
        payload: {
          payload: notifications,
          meta: { unreadCount: 1, count: 2, currentPage: '1' },
        },
      };
      
      const state = reducer(getInitialState(), action);

      expect(state.ids).toHaveLength(2);
      expect(state.uiFlags.isLoading).toBe(false);
      expect(state.unreadCount).toBe(1);
    });

    it('clears loading on rejected', () => {
      const loadingState = {
        ...getInitialState(),
        uiFlags: { ...getInitialState().uiFlags, isLoading: true },
      };
      
      const action = { type: notificationActions.fetchNotifications.rejected.type };
      const state = reducer(loadingState, action);
      
      expect(state.uiFlags.isLoading).toBe(false);
    });
  });
});
```

**What to test:**
- Initial state
- Each synchronous reducer action
- Async thunk lifecycle: pending, fulfilled, rejected
- `extraReducers` that listen to other slices' actions

**What NOT to test:**
- Redux Toolkit's `createSlice` internals
- Immer immutability (trust the library)
- Entity adapter CRUD (unless you have custom logic)

---

#### Pattern: Testing Async Thunks

```ts
// src/application/store/notification/__tests__/notificationActions.test.ts

import { configureStore } from '@reduxjs/toolkit';
import notificationReducer from '../notificationSlice';
import { notificationActions } from '../notificationAction';
import { NotificationService } from '../notificationService';

// Mock the service layer (not the API directly)
jest.mock('../notificationService');
const mockService = NotificationService as jest.Mocked<typeof NotificationService>;

describe('notificationActions', () => {
  const createStore = () =>
    configureStore({
      reducer: { notifications: notificationReducer },
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchNotifications', () => {
    it('populates store on success', async () => {
      const mockNotifications = [
        { id: 1, readAt: null, primaryActorType: 'Conversation' },
      ];
      
      mockService.getNotifications.mockResolvedValueOnce({
        payload: mockNotifications,
        meta: { unreadCount: 1, count: 1, currentPage: '1' },
      });

      const store = createStore();
      await store.dispatch(
        notificationActions.fetchNotifications({ page: 1, sort_order: 'desc' })
      );

      const state = store.getState().notifications;
      expect(state.ids).toContain(1);
      expect(state.uiFlags.isLoading).toBe(false);
    });

    it('handles API failure', async () => {
      mockService.getNotifications.mockRejectedValueOnce(
        new Error('Network error')
      );

      const store = createStore();
      const result = await store.dispatch(
        notificationActions.fetchNotifications({ page: 1, sort_order: 'desc' })
      );

      expect(result.type).toContain('rejected');
      expect(store.getState().notifications.uiFlags.isLoading).toBe(false);
    });
  });
});
```

**What to test:**
- Success path: thunk resolves, state updates correctly
- Error path: thunk rejects, error state is set
- Side effects: toasts, navigation, analytics (verify calls)

**What NOT to test:**
- Thunk middleware internals
- Exact action order (too implementation-focused)

---

#### Pattern: Testing Services (API Layer)

```ts
// src/application/store/notification/__tests__/notificationService.test.ts

import { NotificationService } from '../notificationService';
import { apiService } from '@/services/APIService';

jest.mock('@/services/APIService', () => ({
  apiService: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@infrastructure/utils/camelCaseKeys', () => ({
  transformNotification: jest.fn(n => n),
  transformNotificationMeta: jest.fn(m => m),
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('fetches notifications with correct URL params', async () => {
      const mockResponse = {
        data: {
          data: {
            payload: [
              { id: 1, primaryActorType: 'Conversation', readAt: '' },
            ],
            meta: { unreadCount: 1, count: 1, currentPage: '1' },
          },
        },
      };
      
      (apiService.get as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await NotificationService.getNotifications(1, 'desc');

      expect(apiService.get).toHaveBeenCalledWith(
        'notifications?sort_order=desc&includes[]=snoozed&includes[]=read&page=1'
      );
      expect(result.payload).toHaveLength(1);
    });

    it('throws on network error', async () => {
      const networkError = new Error('Network request failed');
      (apiService.get as jest.Mock).mockRejectedValueOnce(networkError);

      await expect(
        NotificationService.getNotifications(1, 'desc')
      ).rejects.toThrow('Network request failed');
    });
  });

  describe('markAllAsRead', () => {
    it('sends POST to mark all notifications as read', async () => {
      (apiService.post as jest.Mock).mockResolvedValueOnce({ data: {} });

      await NotificationService.markAllAsRead();

      expect(apiService.post).toHaveBeenCalledWith('notifications/read_all');
    });
  });
});
```

**What to test:**
- Correct API endpoint called with correct params
- Response transformation (snake_case → camelCase)
- Error handling (network errors, validation errors)
- Retry logic (if applicable)

**What NOT to test:**
- Axios internals
- HTTP protocol details

---

### 5c. Hook Tests

#### Pattern: Testing Custom Hooks (No Redux)

```ts
// src/infrastructure/hooks/__tests__/useThemedStyles.test.ts

import { renderHook } from '@testing-library/react-native';

// Mock dependencies
let mockThemeVersion = 1;
jest.mock('@infrastructure/context/ThemeContext', () => ({
  useTheme: () => ({ themeVersion: mockThemeVersion, isDark: false }),
}));

const mockTailwindStyle = jest.fn(() => ({ backgroundColor: '#fff' }));
const mockTailwindColor = jest.fn(() => '#000');
jest.mock('@infrastructure/theme/tailwind', () => ({
  tailwind: {
    style: (...args: string[]) => mockTailwindStyle(...args),
    color: (c: string) => mockTailwindColor(c),
  },
}));

// Import AFTER mocking
import { useThemedStyles } from '../useThemedStyles';

describe('useThemedStyles', () => {
  beforeEach(() => {
    mockThemeVersion = 1;
    jest.clearAllMocks();
  });

  it('returns style and color functions', () => {
    const { result } = renderHook(() => useThemedStyles());

    expect(result.current).toHaveProperty('style');
    expect(result.current).toHaveProperty('color');
    expect(typeof result.current.style).toBe('function');
  });

  it('style() calls tailwind.style with joined class names', () => {
    const { result } = renderHook(() => useThemedStyles());

    result.current.style('bg-white', 'text-black');

    expect(mockTailwindStyle).toHaveBeenCalledWith('bg-white text-black');
  });

  it('style() filters out falsy values', () => {
    const { result } = renderHook(() => useThemedStyles());

    result.current.style('bg-white', undefined, false, 'p-4');

    expect(mockTailwindStyle).toHaveBeenCalledWith('bg-white p-4');
  });
});
```

**What to test:**
- Hook initialization (return value structure)
- Hook behavior with different inputs
- Hook behavior when dependencies change
- State updates triggered by hook

**What NOT to test:**
- React's `useState`/`useEffect` internals
- Dependency array mechanics (trust React)

---

#### Pattern: Testing Hooks with Redux

```ts
// If a hook uses useSelector or useDispatch, wrap in a Redux provider

import { renderHook } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { createTestStore } from '@/__tests__/helpers/render';
import { useNotificationCount } from '../useNotificationCount';

describe('useNotificationCount', () => {
  it('returns unread count from Redux', () => {
    const store = createTestStore({
      notifications: { unreadCount: 5, ids: [], entities: {}, uiFlags: {} },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useNotificationCount(), { wrapper });

    expect(result.current).toBe(5);
  });
});
```

---

### 5d. Component Tests

```tsx
// src/presentation/ai-chat/components/ai-assistant/__tests__/AIMessageBubble.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { AIMessageBubble } from '../AIMessageBubble';
import type { UIMessage } from 'ai';

// Mock dependencies
jest.mock('@presentation/ai-chat/hooks/ai-assistant/useAITheme', () => ({
  useAITheme: () => ({
    colors: {
      assistantBubble: '#f0f0f0',
      userBubble: '#0066ff',
      text: '#000000',
    },
  }),
}));

jest.mock('react-native-markdown-display', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: string }) => <Text>{children}</Text>,
  };
});

describe('AIMessageBubble', () => {
  const baseMessage: UIMessage = {
    id: 'msg-1',
    role: 'assistant',
    parts: [{ type: 'text', text: 'Hello! How can I help you today?' }],
  };

  it('renders assistant text message', () => {
    render(<AIMessageBubble message={baseMessage} />);
    expect(screen.getByText(/Hello! How can I help you today/)).toBeOnTheScreen();
  });

  it('renders user message with different styling', () => {
    const userMessage: UIMessage = {
      id: 'msg-2',
      role: 'user',
      parts: [{ type: 'text', text: 'What is the status of order #123?' }],
    };
    
    render(<AIMessageBubble message={userMessage} />);
    expect(screen.getByText(/What is the status of order #123/)).toBeOnTheScreen();
  });

  it('renders tool invocation part', () => {
    const messageWithTool: UIMessage = {
      id: 'msg-4',
      role: 'assistant',
      parts: [
        {
          type: 'dynamic-tool',
          toolCallId: 'tc-1',
          toolName: 'search_orders',
          state: 'output-available',
          input: { query: '#123' },
          output: { found: true },
        } as any,
      ],
    };
    
    render(<AIMessageBubble message={messageWithTool} />);
    expect(screen.getByText(/search_orders/)).toBeOnTheScreen();
  });
});
```

**What to test:**
- Component renders with required props
- Component renders different variants (states, props)
- User interactions trigger correct behavior
- Conditional rendering works
- Accessibility props are present

**What NOT to test:**
- Styling details (e.g., exact colors, padding) unless critical
- Third-party library internals (e.g., react-native-markdown-display parsing)

---

### 5e. Service/API Tests

See "Pattern: Testing Services (API Layer)" in section 5b above.

---

### 5f. Integration Tests (Screen-Level)

```tsx
// src/screens/conversations/__tests__/ConversationList.test.tsx

import React from 'react';
import { screen, userEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/__tests__/helpers/render';
import { aConversation } from '@/__tests__/helpers/builders';
import ConversationListScreen from '../ConversationListScreen';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
    setOptions: jest.fn(),
  }),
  useRoute: () => ({ params: {} }),
  useIsFocused: () => true,
}));

describe('ConversationListScreen', () => {
  const user = userEvent.setup();

  const conversations = [
    aConversation()
      .withId(1)
      .withStatus('open')
      .withUnreadCount(2)
      .build(),
    aConversation()
      .withId(2)
      .withStatus('resolved')
      .withUnreadCount(0)
      .build(),
  ];

  it('renders conversation list', () => {
    renderWithProviders(<ConversationListScreen />, {
      preloadedState: {
        conversations: {
          ids: [1, 2],
          entities: { 1: conversations[0], 2: conversations[1] },
          uiFlags: { isLoading: false },
          meta: { mineCount: 2, unassignedCount: 0, allCount: 2 },
        },
      },
    });

    expect(screen.getByText(/Test Contact/)).toBeOnTheScreen();
  });

  it('shows unread badge for conversations with unread messages', () => {
    renderWithProviders(<ConversationListScreen />, {
      preloadedState: {
        conversations: {
          ids: [1],
          entities: { 1: conversations[0] },
          uiFlags: { isLoading: false },
          meta: { mineCount: 1, unassignedCount: 0, allCount: 1 },
        },
      },
    });

    expect(screen.getByText('2')).toBeOnTheScreen(); // unread badge
  });

  it('shows loading indicator when fetching', () => {
    renderWithProviders(<ConversationListScreen />, {
      preloadedState: {
        conversations: {
          ids: [],
          entities: {},
          uiFlags: { isLoading: true },
          meta: { mineCount: 0, unassignedCount: 0, allCount: 0 },
        },
      },
    });

    expect(screen.getByTestId('conversation-list-loader')).toBeOnTheScreen();
  });
});
```

**What to test:**
- User flow: user sees X, clicks Y, sees Z
- Data flows from Redux to UI correctly
- Navigation happens on user action
- Loading/error states render correctly

**What NOT to test:**
- Redux store internals (tested separately)
- Navigation library internals

---

## 6. Mocking Strategy

### 6a. Global Mocks (`src/__tests__/setup.ts`)

The global setup file mocks frameworks and native modules used by nearly all tests.

**React Native Core:**
- `react-native`: Platform, Dimensions, StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Pressable, FlatList

**Framework Mocks:**
- `@sentry/react-native`: `captureException`, `setUser`, `addBreadcrumb`
- `@infrastructure/i18n`: `t(key)` returns the key as-is
- `@infrastructure/utils/toastUtils`: `showToast` as jest.fn()

**Navigation:**
- `@react-navigation/native`: `useNavigation`, `useRoute`, `useFocusEffect`, `useIsFocused` with default mock implementations

**Native Modules:**
- `react-native-reanimated`: All hooks (`useSharedValue`, `useAnimatedStyle`, `withTiming`, etc.)
- `react-native-safe-area-context`: Providers and hooks
- `expo-haptics`: All haptic feedback functions
- `@react-native-community/netinfo`: Network state
- `react-native-keyboard-controller`: Keyboard handlers
- `@react-native-async-storage/async-storage`: Storage methods
- `@react-native-firebase/analytics`: Firebase analytics
- `react-native-svg`: All SVG components
- `tsyringe`: DI container
- `axios`: HTTP client with AxiosError class
- `i18n-js`: i18n with basic translation map for onboarding

**Console Suppression:**
- Filters out `Animated`, `NativeModule`, `Warning:`, `Act` console messages to reduce test noise

**Global Cleanup:**
- `afterEach(() => jest.clearAllMocks())` — Clears all mock call history after each test

**Timeout:**
- `jest.setTimeout(10000)` — 10 second timeout for all tests

---

### 6b. Per-Test Mocks

**When to override globals:**

1. **Module-level `jest.mock()`** — When you need different behavior than the global mock:
   ```ts
   jest.mock('@react-navigation/native', () => ({
     ...jest.requireActual('@react-navigation/native'),
     useNavigation: () => ({
       navigate: mockNavigateCustom, // Your custom mock
     }),
   }));
   ```

2. **`jest.spyOn()`** — When you want to spy on a specific method without mocking the entire module:
   ```ts
   const spy = jest.spyOn(NotificationService, 'getNotifications');
   spy.mockResolvedValueOnce({ payload: [], meta: {} });
   ```

3. **Service layer mocks** — Always mock at the service layer, not at the API layer:
   ```ts
   // ✅ Good: Mock the service
   jest.mock('../notificationService');
   
   // ❌ Bad: Mock axios globally (interferes with other tests)
   jest.mock('axios');
   ```

---

### 6c. Mock Data Management

**Use builders, not inline objects:**

```ts
// ✅ Good: Use builder
const conversation = aConversation().withStatus('open').withUnreadCount(5).build();

// ❌ Bad: Inline object with 25+ fields
const conversation = {
  id: 1,
  accountId: 1,
  additionalAttributes: {},
  agentLastSeenAt: 0,
  assigneeLastSeenAt: 0,
  // ... 20+ more fields
};
```

**Snake_case for API responses, camelCase for domain objects:**

The transformation happens in services (`camelCaseKeys` utility). In tests:
- **Service tests**: Mock API responses with `snake_case` keys
- **Store/domain tests**: Use `camelCase` objects (post-transformation)

**Extract reusable mocks to `*MockData.ts` files:**

Some store modules have shared mock data files (e.g., `authMockData.ts`, `conversationMockData.ts`). These are acceptable for complex fixtures, but prefer builders when possible.

---

## 7. Best Practices

### 7a. DO's

1. **Use builders for all test data** — Reduces boilerplate, ensures valid objects
   ```ts
   const notification = aNotification().withUnread().withId(42).build();
   ```

2. **Test behavior, not implementation** — Verify what the user experiences
   ```ts
   // ✅ Good
   expect(screen.getByText('Success message')).toBeOnTheScreen();
   
   // ❌ Bad
   expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'SUCCESS' }));
   ```

3. **Use semantic queries** — Prioritize accessibility
   ```ts
   // ✅ Best
   screen.getByRole('button', { name: 'Submit' })
   
   // ✅ Good
   screen.getByLabelText('Email address')
   
   // ⚠️ OK
   screen.getByText('Submit')
   
   // ❌ Last resort
   screen.getByTestId('submit-button')
   ```

4. **Use `userEvent` over `fireEvent`** — More realistic user interactions
   ```ts
   const user = userEvent.setup();
   await user.press(screen.getByRole('button'));
   ```

5. **Use `waitFor` for async assertions**
   ```ts
   await waitFor(() => expect(screen.getByText('Loaded')).toBeOnTheScreen());
   ```

6. **Use `act()` for state updates outside React**
   ```ts
   act(() => {
     store.dispatch(someAction());
   });
   ```

7. **Test error paths** — Don't just test the happy path
   ```ts
   it('shows error message on API failure', async () => {
     mockService.fetch.mockRejectedValueOnce(new Error('Network error'));
     // ... assert error UI appears
   });
   ```

8. **Descriptive test names** — Use "should X when Y" format
   ```ts
   it('should show unread badge when conversation has unread messages', () => {
     // ...
   });
   ```

9. **Group with `describe` blocks** — Organize related tests
   ```ts
   describe('notificationSlice', () => {
     describe('resetNotifications', () => {
       it('clears all notifications', () => { /* ... */ });
       it('resets unread count', () => { /* ... */ });
     });
   });
   ```

---

### 7b. DON'Ts

1. **Don't use `any` types** — Type your test data properly
   ```ts
   // ❌ Bad
   const notification: any = { id: 1 };
   
   // ✅ Good
   const notification = aNotification().withId(1).build();
   ```

2. **Don't test implementation details** — Focus on behavior
   ```ts
   // ❌ Bad: Testing Redux action types
   expect(mockDispatch).toHaveBeenCalledWith({ type: 'notifications/add' });
   
   // ✅ Good: Testing UI outcome
   expect(screen.getByText('New notification')).toBeOnTheScreen();
   ```

3. **Don't use `waitForNextUpdate`** — It's deprecated (from old `@testing-library/react-hooks`)
   ```ts
   // ❌ Bad
   await waitForNextUpdate();
   
   // ✅ Good
   await waitFor(() => expect(result.current.data).toBe(expected));
   ```

4. **Don't duplicate global mocks** — Check `src/__tests__/setup.ts` first
   ```ts
   // ❌ Bad: Sentry is already globally mocked
   jest.mock('@sentry/react-native', () => ({ captureException: jest.fn() }));
   ```

5. **Don't mock the code under test** — Mock dependencies, not the subject
   ```ts
   // ❌ Bad
   jest.mock('../MyComponent');
   import MyComponent from '../MyComponent';
   // Now you're testing the mock, not the component!
   ```

6. **Don't use magic numbers** — Use named constants
   ```ts
   // ❌ Bad
   expect(result).toBe(42);
   
   // ✅ Good
   const EXPECTED_COUNT = 42;
   expect(result).toBe(EXPECTED_COUNT);
   ```

7. **Don't skip or comment out tests** — Fix or delete them
   ```ts
   // ❌ Bad
   it.skip('test that sometimes fails', () => { /* ... */ });
   ```

---

## 8. CI/CD

### GitHub Actions Workflow

**File:** `.github/workflows/test.yml`

**Triggers:**
- Pull requests to `development` and `main`
- Pushes to `development` and `main`

**Steps:**
1. Checkout code (`actions/checkout@v4`)
2. Setup Node & pnpm via Volta (`volta-cli/action@v4`)
3. Install dependencies (`pnpm install --frozen-lockfile`)
4. Run linter (`pnpm lint`)
5. Run tests with coverage (`pnpm test -- --coverage --ci --maxWorkers=2 --forceExit`)
6. Upload coverage report as artifact (`actions/upload-artifact@v4`, 30 day retention)

**Coverage Thresholds:**
- Branches: 20%
- Functions: 20%
- Lines: 25%
- Statements: 25%

**Local Commands:**
- Run tests: `pnpm test`
- With coverage: `pnpm test -- --coverage`
- Single file: `npx jest path/to/test.ts`
- Watch mode: `pnpm test -- --watch`
- Update snapshots: `pnpm test -- -u`

---

## 9. Troubleshooting

### Module not found → check jest.config moduleNameMapper

**Symptom:** `Cannot find module '@domain/types/Conversation'`

**Solution:**
1. Verify `jest.config.js` has the path alias mapping:
   ```js
   moduleNameMapper: {
     '^@domain/(.*)$': '<rootDir>/src/domain/$1',
   }
   ```
2. Verify `tsconfig.json` has the same alias in `paths`

---

### Cannot access .root on unmounted → use act() boundaries

**Symptom:** `Can't access .root on unmounted test renderer`

**Cause:** State update happened after component unmounted, or outside React's act boundaries

**Solution:**
```ts
import { act } from '@testing-library/react-native';

act(() => {
  store.dispatch(someAction());
});
```

---

### Multiple queries returned X → use more specific queries

**Symptom:** `Found multiple elements with the text: "Submit"`

**Solution:** Use `within()` to scope the query, or use a more specific query:
```ts
// Option 1: Scope with within()
const form = screen.getByTestId('login-form');
within(form).getByRole('button', { name: 'Submit' });

// Option 2: More specific query
screen.getByRole('button', { name: 'Submit login form' });
```

---

### Type errors with builders → ensure all required fields have defaults

**Symptom:** TypeScript error: `Property 'xyz' is missing in type 'X'`

**Cause:** Builder's default object doesn't satisfy the type's required fields

**Solution:** Check the type definition and ensure the builder provides defaults for all required fields:
```ts
// Read the actual type definition
// src/domain/types/Conversation.ts

// Update builder defaults to match
class ConversationBuilder {
  private conversation: Conversation = {
    id: 1,
    accountId: 1,
    // ... all required fields
  };
}
```

---

### Tests pass locally, fail in CI → check Node version, use --ci flag

**Symptom:** Tests pass on dev machine, fail in GitHub Actions

**Possible causes:**
1. **Timing differences** — CI is slower, timeouts are hit
   - Solution: Increase `jest.setTimeout(10000)` or use `waitFor` more liberally
2. **Node version mismatch** — Local uses different Node than CI
   - Solution: Use Volta to lock Node version (check `package.json` `volta` field)
3. **Missing `--ci` flag** — CI environments need `--ci` for proper behavior
   - Solution: Run `pnpm test -- --ci` in CI
4. **Frozen lockfile** — Dependencies differ between local and CI
   - Solution: Always use `pnpm install --frozen-lockfile` in CI

---

## 10. Decision Trees

### Tree 1: "How Should I Test This?"

```
Is it pure business logic (no React)?
  Yes → Domain test (no RNTL, just Jest)
        Example: Testing a Zod schema, type guard, or pure function
        
  No  → Does it use Redux (useSelector/useDispatch)?
          Yes → Does it render UI?
                  Yes → Use renderWithProviders with preloadedState
                        Example: Screen component that displays Redux data
                        
                  No  → Is it a hook?
                          Yes → Use renderHook with Redux provider wrapper
                                Example: useNotificationCount hook
                                
                          No  → Use createTestStore + dispatch
                                Example: Testing async thunk directly
          
          No  → Is it a hook?
                  Yes → Use renderHook from RNTL
                        Example: useThemedStyles, useHeaderAnimation
                        
                  No  → Is it a component?
                          Yes → Use render from RNTL
                                Example: Avatar, Button, Icon
                                
                          No  → Standard Jest test
                                Example: Utility function, mapper
```

---

### Tree 2: "What Builder Should I Use?"

| Type | Builder | Import |
|------|---------|--------|
| Conversation | `aConversation()` | `@/__tests__/helpers/builders` |
| Notification | `aNotification()` | `@/__tests__/helpers/builders` |
| Contact | `aContact()` | `@/__tests__/helpers/builders` |
| Agent | `anAgent()` | `@/__tests__/helpers/builders` |
| Message | `aMessage()` | `@/__tests__/helpers/builders` |
| AIChatMessage | `anAIChatMessage()` | `@/__tests__/helpers/builders` |
| Onboarding Screen | `aScreen()` | `@/__tests__/helpers/builders` |
| Onboarding Flow | `anOnboardingFlow()` | `@/__tests__/helpers/builders` |
| Onboarding Answer | `anAnswer()` | `@/__tests__/helpers/builders` |

---

## 11. Code Examples

### Example 1: Testing a Redux Slice

**Full test for notificationSlice with extraReducers:**

```ts
// src/application/store/notification/__tests__/notificationSlice.test.ts

import reducer, {
  resetNotifications,
  addNotification,
  removeNotification,
  type NotificationState,
} from '../notificationSlice';
import { notificationActions } from '../notificationAction';
import { aNotification } from '@/__tests__/helpers/builders';

jest.mock('@infrastructure/utils/pushUtils', () => ({
  updateBadgeCount: jest.fn(),
}));

describe('notificationSlice', () => {
  const getInitialState = (): NotificationState => ({
    ids: [],
    entities: {},
    unreadCount: 0,
    totalCount: 0,
    currentPage: '1',
    error: null,
    uiFlags: {
      isLoading: false,
      isAllNotificationsRead: false,
      isAllNotificationsFetched: false,
    },
  });

  // 1. Test initial state
  it('returns the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(getInitialState());
  });

  // 2. Test synchronous reducers
  describe('resetNotifications', () => {
    it('clears all notifications and resets counts', () => {
      const stateWithData = {
        ...getInitialState(),
        ids: [1, 2],
        entities: {
          1: aNotification().withId(1).build(),
          2: aNotification().withId(2).build(),
        },
        unreadCount: 5,
        totalCount: 10,
      };

      const state = reducer(stateWithData, resetNotifications());

      expect(state.ids).toEqual([]);
      expect(state.entities).toEqual({});
      expect(state.unreadCount).toBe(0);
      expect(state.totalCount).toBe(0);
    });
  });

  describe('addNotification', () => {
    it('adds a notification and updates unread count', () => {
      const notification = aNotification().withId(42).withUnread().build();
      
      const state = reducer(
        getInitialState(),
        addNotification({ notification, unreadCount: 3 })
      );

      expect(state.ids).toContain(42);
      expect(state.entities[42]).toEqual(notification);
      expect(state.unreadCount).toBe(3);
    });
  });

  describe('removeNotification', () => {
    it('removes a notification by id', () => {
      const stateWithNotification = {
        ...getInitialState(),
        ids: [1],
        entities: { 1: aNotification().withId(1).build() },
      };

      const state = reducer(stateWithNotification, removeNotification(1));

      expect(state.ids).not.toContain(1);
      expect(state.entities[1]).toBeUndefined();
    });
  });

  // 3. Test async thunk lifecycle (extraReducers)
  describe('fetchNotifications', () => {
    it('sets isLoading to true when pending', () => {
      const action = { type: notificationActions.fetchNotifications.pending.type };
      const state = reducer(getInitialState(), action);
      
      expect(state.uiFlags.isLoading).toBe(true);
    });

    it('populates entities when fulfilled', () => {
      const notifications = [
        aNotification().withId(1).build(),
        aNotification().withId(2).build(),
      ];
      
      const action = {
        type: notificationActions.fetchNotifications.fulfilled.type,
        payload: {
          payload: notifications,
          meta: { currentPage: '1', unreadCount: 2, count: 2 },
        },
      };
      
      const state = reducer(getInitialState(), action);

      expect(state.ids).toEqual([1, 2]);
      expect(state.uiFlags.isLoading).toBe(false);
      expect(state.totalCount).toBe(2);
      expect(state.unreadCount).toBe(2);
    });

    it('sets isLoading to false when rejected', () => {
      const loadingState = {
        ...getInitialState(),
        uiFlags: { ...getInitialState().uiFlags, isLoading: true },
      };
      
      const action = { type: notificationActions.fetchNotifications.rejected.type };
      const state = reducer(loadingState, action);
      
      expect(state.uiFlags.isLoading).toBe(false);
    });
  });
});
```

---

### Example 2: Testing an Async Thunk

**Full test for async thunk with service mock:**

```ts
// src/application/store/notification/__tests__/notificationActions.test.ts

import { configureStore } from '@reduxjs/toolkit';
import notificationReducer from '../notificationSlice';
import { notificationActions } from '../notificationAction';
import { NotificationService } from '../notificationService';
import { aNotification } from '@/__tests__/helpers/builders';

jest.mock('../notificationService');
const mockService = NotificationService as jest.Mocked<typeof NotificationService>;

describe('notificationActions', () => {
  const createStore = () =>
    configureStore({
      reducer: { notifications: notificationReducer },
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchNotifications', () => {
    it('dispatches fulfilled and populates store on success', async () => {
      // Arrange: Mock service response
      const mockNotifications = [
        aNotification().withId(1).withUnread().build(),
        aNotification().withId(2).withRead().build(),
      ];
      
      mockService.getNotifications.mockResolvedValueOnce({
        payload: mockNotifications,
        meta: { unreadCount: 1, count: 2, currentPage: '1' },
      });

      // Act: Dispatch thunk
      const store = createStore();
      await store.dispatch(
        notificationActions.fetchNotifications({ page: 1, sort_order: 'desc' })
      );

      // Assert: Verify service was called with correct params
      expect(mockService.getNotifications).toHaveBeenCalledWith(1, 'desc');
      
      // Assert: Verify state was updated correctly
      const state = store.getState().notifications;
      expect(state.ids).toEqual([1, 2]);
      expect(state.unreadCount).toBe(1);
      expect(state.uiFlags.isLoading).toBe(false);
    });

    it('dispatches rejected on API failure', async () => {
      // Arrange: Mock service error
      mockService.getNotifications.mockRejectedValueOnce(
        new Error('Network request failed')
      );

      // Act: Dispatch thunk
      const store = createStore();
      const result = await store.dispatch(
        notificationActions.fetchNotifications({ page: 1, sort_order: 'desc' })
      );

      // Assert: Thunk was rejected
      expect(result.type).toContain('rejected');
      
      // Assert: Loading flag was cleared
      expect(store.getState().notifications.uiFlags.isLoading).toBe(false);
    });
  });

  describe('markAllAsRead', () => {
    it('marks all notifications as read and updates state', async () => {
      // Arrange: Store with unread notifications
      const store = createStore();
      store.dispatch({
        type: notificationActions.fetchNotifications.fulfilled.type,
        payload: {
          payload: [aNotification().withId(1).withUnread().build()],
          meta: { unreadCount: 1, count: 1, currentPage: '1' },
        },
      });

      // Mock service success
      mockService.markAllAsRead.mockResolvedValueOnce(undefined);

      // Act: Mark all as read
      await store.dispatch(notificationActions.markAllAsRead());

      // Assert: Service was called
      expect(mockService.markAllAsRead).toHaveBeenCalled();
      
      // Assert: Unread count updated
      expect(store.getState().notifications.unreadCount).toBe(0);
    });
  });
});
```

---

### Example 3: Testing a Component with Redux

**Full component test using renderWithProviders:**

```tsx
// src/screens/notifications/__tests__/NotificationListItem.test.tsx

import React from 'react';
import { screen, userEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/__tests__/helpers/render';
import { aNotification } from '@/__tests__/helpers/builders';
import NotificationListItem from '../NotificationListItem';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe('NotificationListItem', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders notification title and message', () => {
    const notification = aNotification()
      .withPushMessageTitle('New message from John')
      .withUnread()
      .build();

    renderWithProviders(<NotificationListItem notification={notification} />);

    expect(screen.getByText('New message from John')).toBeOnTheScreen();
  });

  it('shows unread indicator for unread notifications', () => {
    const notification = aNotification().withUnread().build();

    renderWithProviders(<NotificationListItem notification={notification} />);

    expect(screen.getByTestId('unread-indicator')).toBeOnTheScreen();
  });

  it('does not show unread indicator for read notifications', () => {
    const notification = aNotification().withRead().build();

    renderWithProviders(<NotificationListItem notification={notification} />);

    expect(screen.queryByTestId('unread-indicator')).not.toBeOnTheScreen();
  });

  it('navigates to conversation when tapped', async () => {
    const notification = aNotification()
      .withPrimaryActorId(42)
      .build();

    renderWithProviders(<NotificationListItem notification={notification} />);

    await user.press(screen.getByTestId('notification-item'));

    expect(mockNavigate).toHaveBeenCalledWith('ConversationDetails', {
      conversationId: 42,
    });
  });

  it('marks notification as read when tapped', async () => {
    const notification = aNotification().withId(1).withUnread().build();

    const { store } = renderWithProviders(
      <NotificationListItem notification={notification} />,
      {
        preloadedState: {
          notifications: {
            ids: [1],
            entities: { 1: notification },
            unreadCount: 1,
            totalCount: 1,
            currentPage: '1',
            error: null,
            uiFlags: {
              isLoading: false,
              isAllNotificationsRead: false,
              isAllNotificationsFetched: false,
            },
          },
        },
      }
    );

    await user.press(screen.getByTestId('notification-item'));

    // Verify Redux action was dispatched
    // (This is a simplified check - in real test, mock the service and verify thunk)
    expect(store.getState().notifications.unreadCount).toBeLessThanOrEqual(1);
  });
});
```

---

### Example 4: Testing a Custom Hook

**Full hook test with dependencies:**

```ts
// src/infrastructure/hooks/__tests__/useThemedStyles.test.ts

import { renderHook } from '@testing-library/react-native';

// Mock dependencies BEFORE importing the hook
let mockIsDark = false;
let mockThemeVersion = 1;

jest.mock('@infrastructure/context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: mockIsDark,
    themeVersion: mockThemeVersion,
    toggleTheme: jest.fn(),
  }),
}));

const mockTailwindStyle = jest.fn((classNames: string) => ({
  backgroundColor: classNames.includes('bg-white') ? '#fff' : '#000',
}));

const mockTailwindColor = jest.fn((className: string) => {
  if (className === 'bg-red-500') return '#ef4444';
  return '#000000';
});

jest.mock('@infrastructure/theme/tailwind', () => ({
  tailwind: {
    style: (classNames: string) => mockTailwindStyle(classNames),
    color: (className: string) => mockTailwindColor(className),
  },
}));

// Import AFTER mocking
import { useThemedStyles } from '../useThemedStyles';

describe('useThemedStyles', () => {
  beforeEach(() => {
    mockIsDark = false;
    mockThemeVersion = 1;
    jest.clearAllMocks();
  });

  it('returns style and color functions', () => {
    const { result } = renderHook(() => useThemedStyles());

    expect(result.current).toHaveProperty('style');
    expect(result.current).toHaveProperty('color');
    expect(typeof result.current.style).toBe('function');
    expect(typeof result.current.color).toBe('function');
  });

  it('style() calls tailwind.style with joined class names', () => {
    const { result } = renderHook(() => useThemedStyles());

    result.current.style('bg-white', 'text-black', 'p-4');

    expect(mockTailwindStyle).toHaveBeenCalledWith('bg-white text-black p-4');
  });

  it('style() filters out falsy class names', () => {
    const { result } = renderHook(() => useThemedStyles());

    result.current.style('bg-white', undefined, false, null, 'p-4');

    expect(mockTailwindStyle).toHaveBeenCalledWith('bg-white p-4');
  });

  it('color() delegates to tailwind.color', () => {
    const { result } = renderHook(() => useThemedStyles());

    const color = result.current.color('bg-red-500');

    expect(mockTailwindColor).toHaveBeenCalledWith('bg-red-500');
    expect(color).toBe('#ef4444');
  });

  it('memoizes style function based on themeVersion', () => {
    const { result, rerender } = renderHook(() => useThemedStyles());

    const firstStyleFn = result.current.style;

    // Rerender without changing themeVersion
    rerender();

    expect(result.current.style).toBe(firstStyleFn); // Same reference

    // Change themeVersion
    mockThemeVersion = 2;
    rerender();

    expect(result.current.style).not.toBe(firstStyleFn); // New reference
  });
});
```

---

### Example 5: Using Builders Together

**Test demonstrating multiple builders composing:**

```ts
// src/application/store/conversation/__tests__/conversationSelectors.test.ts

import { aConversation, aContact, anAgent, aMessage } from '@/__tests__/helpers/builders';
import {
  selectConversationById,
  selectUnreadConversations,
  selectOpenConversations,
} from '../conversationSelectors';

describe('conversationSelectors', () => {
  it('selectConversationById returns conversation with full metadata', () => {
    // Compose multiple builders to create rich test data
    const agent = anAgent()
      .withId(10)
      .withName('Agent Smith')
      .withEmail('smith@agency.com')
      .build();

    const contact = aContact()
      .withId(20)
      .withName('John Doe')
      .withEmail('john@example.com')
      .withPhone('+1234567890')
      .build();

    const lastMessage = aMessage()
      .withId(100)
      .withContent('Hello, I need help with my order')
      .withSender(contact)
      .build();

    const conversation = aConversation()
      .withId(1)
      .withStatus('open')
      .withUnreadCount(5)
      .withAssignee(agent)
      .withMeta({
        sender: contact,
        assignee: agent,
        team: null,
        hmacVerified: false,
        channel: 'Channel::WebWidget',
      })
      .withLastNonActivityMessage(lastMessage)
      .withLabels(['urgent', 'billing'])
      .build();

    const state = {
      conversations: {
        ids: [1],
        entities: { 1: conversation },
        uiFlags: { isLoading: false },
        meta: { mineCount: 1, unassignedCount: 0, allCount: 1 },
      },
    };

    const result = selectConversationById(state, 1);

    expect(result).toBeDefined();
    expect(result?.id).toBe(1);
    expect(result?.meta.assignee?.name).toBe('Agent Smith');
    expect(result?.meta.sender.name).toBe('John Doe');
    expect(result?.lastNonActivityMessage?.content).toBe('Hello, I need help with my order');
    expect(result?.labels).toContain('urgent');
  });

  it('selectUnreadConversations filters by unread count', () => {
    const conversations = [
      aConversation().withId(1).withUnreadCount(5).build(),
      aConversation().withId(2).withUnreadCount(0).build(),
      aConversation().withId(3).withUnreadCount(2).build(),
    ];

    const state = {
      conversations: {
        ids: [1, 2, 3],
        entities: {
          1: conversations[0],
          2: conversations[1],
          3: conversations[2],
        },
        uiFlags: { isLoading: false },
        meta: { mineCount: 3, unassignedCount: 0, allCount: 3 },
      },
    };

    const result = selectUnreadConversations(state);

    expect(result).toHaveLength(2);
    expect(result.map(c => c.id)).toEqual([1, 3]);
  });
});
```

---

## 12. Future Improvements

**Planned but not yet implemented:**

1. **MSW v2 for API mocking** — Replace `jest.mock` on service layer with Mock Service Worker for more realistic integration tests. MSW v2 has [React Native integration](https://mswjs.io/docs/integrations/react-native).

2. **Snapshot testing strategy** — Determine when/if to use snapshot tests. Current consensus: avoid for UI (brittle), consider for complex data structures (Zod schemas, Redux state shapes).

3. **Coverage increase to 60%+** — Progressive thresholds:
   - Q1 2026: 25% (current)
   - Q2 2026: 35%
   - Q3 2026: 50%
   - Q4 2026: 60%

4. **Additional builders as needed** — Create builders for other complex types when tests require them (Team, Inbox, Label, Macro, CustomAttribute, etc.).

5. **E2E tests with Detox** — Separate from unit testing, but important for critical user flows (login, send message, create conversation).

6. **Visual regression testing** — Use tools like Storybook + Chromatic or Percy for UI components.

7. **Performance testing** — Test component render performance, Redux selector memoization, list virtualization.

8. **Accessibility testing** — Automated a11y checks using `@testing-library/react-native`'s accessibility queries as baseline.

---

## 13. Quick Reference

### Cheat Sheet

**Run tests:**
```bash
pnpm test                    # All tests
pnpm test -- --coverage      # With coverage report
npx jest path/to/test.ts     # Single test file
pnpm test -- --watch         # Watch mode
pnpm test -- -u              # Update snapshots
```

**Common imports:**
```ts
// Rendering
import { renderWithProviders, screen, userEvent, waitFor } from '@/__tests__/helpers/render';

// Builders
import { aConversation, aNotification, anAIChatMessage } from '@/__tests__/helpers/builders';

// RNTL (if not using render.tsx re-exports)
import { render, screen, userEvent, act, within, waitFor } from '@testing-library/react-native';
```

**File naming:**
- New tests: `.test.ts` or `.test.tsx`
- Legacy Redux: `.spec.ts` (38 files)

**Where to find examples:**
- **Domain tests**: `src/modules/onboarding/__tests__/domain/`
- **Hook tests**: `src/modules/onboarding/__tests__/presentation/hooks/`
- **Component tests**: `src/modules/onboarding/__tests__/presentation/components/`
- **Redux tests**: `src/application/store/auth/specs/` (legacy) and `src/application/store/ai-chat/__tests__/` (modern)
- **Service tests**: `src/application/store/conversation/specs/conversationService.spec.ts`

---

## 14. Appendix: File Inventory

### Test Infrastructure Files

```
src/__tests__/
├── setup.ts                                    # Global Jest setup
├── helpers/
│   ├── render.tsx                              # renderWithProviders, createTestStore
│   ├── builders/
│   │   ├── index.ts                            # Barrel file
│   │   ├── conversationBuilder.ts              # 181 lines
│   │   ├── notificationBuilder.ts              # 121 lines
│   │   ├── contactBuilder.ts                   # ~80 lines
│   │   ├── agentBuilder.ts                     # ~70 lines
│   │   ├── messageBuilder.ts                   # ~90 lines
│   │   └── aiChatMessageBuilder.ts             # 73 lines
│   └── matchers/
│       └── resultMatchers.ts                   # Custom Jest matchers
```

### Example Test Files by Layer

**Domain Layer:**
- `src/modules/onboarding/__tests__/domain/entities/Answer.test.ts`
- `src/modules/onboarding/__tests__/domain/entities/Screen.test.ts`
- `src/modules/onboarding/__tests__/domain/services/ConditionalLogicService.test.ts` (1264 lines!)

**Application Layer (Redux):**
- `src/application/store/auth/specs/authSlice.spec.ts`
- `src/application/store/auth/specs/authActions.spec.ts`
- `src/application/store/conversation/specs/conversationService.spec.ts`
- `src/application/store/ai-chat/__tests__/aiChatMapper.test.ts`

**Infrastructure Layer:**
- `src/infrastructure/specs/dateTimeUtils.spec.ts`
- `src/infrastructure/specs/conversationUtils.spec.ts`
- `src/infrastructure/specs/pushUtils.spec.ts`

**Presentation Layer (AI Chat):**
- `src/presentation/ai-chat/hooks/ai-assistant/__tests__/useMessageBridge.test.ts`
- `src/presentation/ai-chat/utils/ai-assistant/__tests__/aiChatFormatUtils.test.ts`
- `src/application/store/ai-chat/__tests__/aiChatSchemas.test.ts`

---

**End of Unit Testing Architecture Guide**

For questions or updates, refer to:
- [Unit Test Audit Report](./unit-test-audit-report.md)
- [Unit Test Improvement Proposal](./unit-test-improvement-proposal.md)
- [Unit Test Implementation Plan](./unit-test-implementation-plan.md)
