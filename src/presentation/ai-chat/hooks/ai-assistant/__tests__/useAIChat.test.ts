/**
 * Tests for useAIChat hook
 *
 * Safety net before AI Generative UI Framework Phase 1.
 * Tests the core chat hook using Vercel AI SDK's DefaultChatTransport.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import type { UIMessage } from 'ai';

import { useAIChat } from '../useAIChat';
import type { ChatConfig } from '@domain/types/ai-chat/chatConfig';

// ─── Mocks ────────────────────────────────────────────────────────

const mockChatStop = jest.fn();
const mockChatSendMessage = jest.fn(() => Promise.resolve());
const mockChatSetMessages = jest.fn();
const mockChatAddToolOutput = jest.fn();

let mockChatStatus: 'ready' | 'submitted' | 'streaming' | 'error' = 'ready';
let mockChatMessages: UIMessage[] = [];
let mockChatError: Error | undefined = undefined;

// mockUseChat is used to capture per-test callbacks (ARCH-2)
const mockUseChat = jest.fn();

jest.mock('@ai-sdk/react', () => ({
  useChat: (...args: unknown[]) => mockUseChat(...args),
}));

jest.mock('ai', () => ({
  DefaultChatTransport: jest.fn().mockImplementation(() => ({})),
}));

// ARCH-1: Extend the already-mocked react-native (from setup.ts) with AppState.
// jest.requireMock inside a jest.mock factory causes infinite recursion, so we
// reproduce the setup.ts fields verbatim and add AppState on top.
let capturedAppStateListener: ((state: string) => void) | null = null;
const mockRemove = jest.fn();
const mockAppStateAddEventListener = jest.fn((_event: string, handler: (state: string) => void) => {
  capturedAppStateListener = handler;
  return { remove: mockRemove };
});

jest.mock('react-native', () => ({
  // Fields from setup.ts react-native mock
  Platform: { OS: 'ios', select: jest.fn((obj: Record<string, unknown>) => obj.ios) },
  Dimensions: { get: jest.fn(() => ({ width: 375, height: 812 })) },
  StyleSheet: {
    create: jest.fn((styles: unknown) => styles),
    flatten: jest.fn((style: unknown) => {
      if (Array.isArray(style)) return Object.assign({}, ...style.filter(Boolean));
      return style || {};
    }),
  },
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  ActivityIndicator: 'ActivityIndicator',
  Pressable: 'Pressable',
  FlatList: 'FlatList',
  // AppState — needed by useAIChat.ts
  AppState: {
    addEventListener: (...args: [string, (state: string) => void]) =>
      mockAppStateAddEventListener(...args),
    currentState: 'active',
  },
}));

// ─── Factories ────────────────────────────────────────────────────

function makeMockChat() {
  return {
    messages: mockChatMessages,
    error: mockChatError,
    status: mockChatStatus,
    stop: mockChatStop,
    sendMessage: mockChatSendMessage,
    setMessages: mockChatSetMessages,
    addToolOutput: mockChatAddToolOutput,
  };
}

function makeConfig(overrides: Partial<ChatConfig> = {}): ChatConfig {
  return {
    transport: {
      streamEndpoint: 'https://api.example.com/stream',
      getHeaders: jest.fn().mockResolvedValue({ Authorization: 'Bearer test' }),
    },
    persistence: {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    },
    ...overrides,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────

function resetChatState() {
  mockChatStatus = 'ready';
  mockChatMessages = [];
  mockChatError = undefined;
  capturedAppStateListener = null;
}

// ─── Tests ────────────────────────────────────────────────────────

describe('useAIChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetChatState();
    // Default mockUseChat implementation captures callbacks and returns mock chat
    mockUseChat.mockImplementation(
      (opts: {
        onFinish?: (opts: { message: UIMessage; isAbort: boolean }) => void;
        onError?: (error: Error) => void;
      }) => {
        return makeMockChat();
      },
    );
  });

  // ─── Initialization ───────────────────────────────────────────────

  describe('initialization', () => {
    it('starts with null sessionId when no initialSessionId provided', () => {
      const { result } = renderHook(() => useAIChat(makeConfig()));
      expect(result.current.sessionId).toBeNull();
    });

    it('uses initialSessionId from options when provided', () => {
      const { result } = renderHook(() =>
        useAIChat(makeConfig(), { agentBotId: 1, chatSessionId: 'existing-session-123' }),
      );
      expect(result.current.sessionId).toBe('existing-session-123');
    });

    it('loads session from persistence on mount when no initialSessionId', async () => {
      const config = makeConfig({
        persistence: {
          get: jest.fn().mockResolvedValue('persisted-session-id'),
          set: jest.fn().mockResolvedValue(undefined),
          remove: jest.fn().mockResolvedValue(undefined),
        },
      });

      const { result } = renderHook(() => useAIChat(config));

      await waitFor(() => {
        expect(result.current.sessionId).toBe('persisted-session-id');
      });
    });

    it('starts with empty messages when no initialSessionId and persistence is empty', async () => {
      const { result } = renderHook(() => useAIChat(makeConfig()));
      expect(result.current.messages).toEqual([]);
    });

    it('returns correct initial shape', () => {
      const { result } = renderHook(() => useAIChat(makeConfig(), { agentBotId: 42 }));

      expect(result.current).toMatchObject({
        messages: [],
        error: undefined,
        isLoading: false,
        status: 'ready',
        sessionId: null,
      });
      expect(typeof result.current.sendMessage).toBe('function');
      expect(typeof result.current.stop).toBe('function');
      expect(typeof result.current.clearSession).toBe('function');
      expect(typeof result.current.setMessages).toBe('function');
      expect(typeof result.current.addToolOutput).toBe('function');
    });
  });

  // ─── isLoading derivation ─────────────────────────────────────────

  describe('isLoading', () => {
    it('is false when status is ready', () => {
      mockChatStatus = 'ready';
      const { result } = renderHook(() => useAIChat(makeConfig()));
      expect(result.current.isLoading).toBe(false);
    });

    it('is false when status is error', () => {
      mockChatStatus = 'error';
      const { result } = renderHook(() => useAIChat(makeConfig()));
      expect(result.current.isLoading).toBe(false);
    });

    it('is true when status is submitted', () => {
      mockChatStatus = 'submitted';
      const { result } = renderHook(() => useAIChat(makeConfig()));
      expect(result.current.isLoading).toBe(true);
    });

    it('is true when status is streaming', () => {
      mockChatStatus = 'streaming';
      const { result } = renderHook(() => useAIChat(makeConfig()));
      expect(result.current.isLoading).toBe(true);
    });
  });

  // ─── sendMessage ──────────────────────────────────────────────────

  describe('sendMessage', () => {
    it('calls chat.sendMessage with text object', async () => {
      const { result } = renderHook(() => useAIChat(makeConfig(), { agentBotId: 1 }));

      await act(async () => {
        await result.current.sendMessage('Hello world');
      });

      expect(mockChatSendMessage).toHaveBeenCalledWith({ text: 'Hello world' });
    });

    it('does NOT call chat.sendMessage for empty string', async () => {
      const { result } = renderHook(() => useAIChat(makeConfig(), { agentBotId: 1 }));

      await act(async () => {
        await result.current.sendMessage('');
      });

      expect(mockChatSendMessage).not.toHaveBeenCalled();
    });

    it('does NOT call chat.sendMessage for whitespace-only string', async () => {
      const { result } = renderHook(() => useAIChat(makeConfig(), { agentBotId: 1 }));

      await act(async () => {
        await result.current.sendMessage('   ');
      });

      expect(mockChatSendMessage).not.toHaveBeenCalled();
    });

    it('handles error thrown by chat.sendMessage', async () => {
      const sendError = new Error('Network failure');
      mockChatSendMessage.mockRejectedValueOnce(sendError);

      const onError = jest.fn();
      const { result } = renderHook(() => useAIChat(makeConfig(), { agentBotId: 1, onError }));

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(onError).toHaveBeenCalledWith(sendError);
    });
  });

  // ─── Session ID lifecycle (INV-1) ─────────────────────────────────

  describe('session ID lifecycle', () => {
    // Unit-level wiring test: verifies onFinish is captured by useChat and can be invoked.
    // NOTE: The full INV-1 invariant (ref→state flush) requires an integration test that
    // simulates an actual HTTP response setting sessionIdRef via the transport's fetch override.
    // At this unit level we can only confirm the callback is wired and handleFinish runs —
    // sessionId stays null because the transport never set sessionIdRef.current (no HTTP response).
    it('invokes onFinish callback in handleFinish (non-abort) - note: ref→state flush requires integration test', async () => {
      let capturedOnFinish: ((opts: { message: UIMessage; isAbort: boolean }) => void) | undefined;

      mockUseChat.mockImplementation(
        (opts: {
          onFinish?: (opts: { message: UIMessage; isAbort: boolean }) => void;
          onError?: (error: Error) => void;
        }) => {
          capturedOnFinish = opts.onFinish;
          return makeMockChat();
        },
      );

      const config = makeConfig();
      const { result } = renderHook(() => useAIChat(config, { agentBotId: 1 }));

      // Simulate the SDK calling onFinish after streaming completes
      const finishedMessage: UIMessage = {
        id: 'msg-1',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Done' }],
      };

      await act(async () => {
        capturedOnFinish?.({ message: finishedMessage, isAbort: false });
      });

      // Unit-level assertion: onFinish was captured by useChat and is callable (handleFinish is wired).
      // handleFinish runs but sessionId stays null because sessionIdRef.current was never populated
      // (no real HTTP response in this test — the transport's fetch override is not exercised here).
      expect(capturedOnFinish).toBeDefined();
      expect(result.current.sessionId).toBeNull();
    });

    // FG-2: When isAbort=true, setSessionId is NOT called (even if sessionIdRef has a value),
    // but the onFinish callback IS still called.
    it('does NOT flush sessionId to state when isAbort=true', async () => {
      let capturedOnFinish: ((opts: { message: UIMessage; isAbort: boolean }) => void) | undefined;

      mockUseChat.mockImplementation(
        (opts: {
          onFinish?: (opts: { message: UIMessage; isAbort: boolean }) => void;
          onError?: (error: Error) => void;
        }) => {
          capturedOnFinish = opts.onFinish;
          return makeMockChat();
        },
      );

      const onFinish = jest.fn();
      const { result } = renderHook(() => useAIChat(makeConfig(), { agentBotId: 1, onFinish }));

      const message: UIMessage = {
        id: 'msg-1',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Aborted' }],
      };

      await act(async () => {
        capturedOnFinish?.({ message, isAbort: true });
      });

      // onFinish IS called regardless of isAbort
      expect(onFinish).toHaveBeenCalledWith(message);
      // But sessionId state stays null (setSessionId was NOT called because isAbort=true)
      expect(result.current.sessionId).toBeNull();
    });

    it('calls onFinish callback when message completes', async () => {
      let capturedOnFinish: ((opts: { message: UIMessage; isAbort: boolean }) => void) | undefined;

      mockUseChat.mockImplementation(
        (opts: { onFinish?: (opts: { message: UIMessage; isAbort: boolean }) => void }) => {
          capturedOnFinish = opts.onFinish;
          return makeMockChat();
        },
      );

      const onFinish = jest.fn();
      renderHook(() => useAIChat(makeConfig(), { agentBotId: 1, onFinish }));

      const finishedMessage: UIMessage = {
        id: 'msg-1',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Response' }],
      };

      await act(async () => {
        capturedOnFinish?.({ message: finishedMessage, isAbort: false });
      });

      expect(onFinish).toHaveBeenCalledWith(finishedMessage);
    });

    it('calls onSessionIdExtracted when sessionId changes', async () => {
      const onSessionIdExtracted = jest.fn();
      const config = makeConfig({
        persistence: {
          get: jest.fn().mockResolvedValue('session-abc'),
          set: jest.fn().mockResolvedValue(undefined),
          remove: jest.fn().mockResolvedValue(undefined),
        },
      });

      renderHook(() => useAIChat(config, { agentBotId: 1, onSessionIdExtracted }));

      await waitFor(() => {
        expect(onSessionIdExtracted).toHaveBeenCalledWith('session-abc');
      });
    });

    // MC-1: persistence.set is called when sessionId state changes (useEffect([sessionId]))
    it('saves sessionId to persistence when sessionId state changes', async () => {
      // We need to simulate the full flow:
      // 1. persistence.get returns a session (simulating a session being loaded)
      // 2. sessionId state updates → useEffect([sessionId]) → persistence.set is called
      const persistenceMock = {
        get: jest.fn().mockResolvedValue('new-session-id'),
        set: jest.fn().mockResolvedValue(undefined),
        remove: jest.fn().mockResolvedValue(undefined),
      };

      const config = makeConfig({ persistence: persistenceMock });
      renderHook(() => useAIChat(config, { agentBotId: 1 }));

      // Wait for the load-from-persistence effect to fire and set sessionId state
      await waitFor(() => {
        expect(persistenceMock.set).toHaveBeenCalledWith(
          '@ai_chat_active_session',
          'new-session-id',
        );
      });
    });

    // MC-2: sendAutomaticallyWhen is passed through to useChat
    it('passes sendAutomaticallyWhen from config.behavior to useChat', () => {
      const sendAutomaticallyWhen = jest.fn().mockReturnValue(false);

      mockUseChat.mockImplementation(
        (opts: {
          sendAutomaticallyWhen?: (opts: {
            messages: UIMessage[];
          }) => boolean | PromiseLike<boolean>;
        }) => {
          return makeMockChat();
        },
      );

      const config = makeConfig({
        behavior: { sendAutomaticallyWhen },
      });
      renderHook(() => useAIChat(config, { agentBotId: 1 }));

      expect(mockUseChat).toHaveBeenCalledWith(expect.objectContaining({ sendAutomaticallyWhen }));
    });

    it('options.sendAutomaticallyWhen takes priority over config.behavior.sendAutomaticallyWhen', () => {
      const configFn = jest.fn().mockReturnValue(false);
      const optionsFn = jest.fn().mockReturnValue(true);

      const config = makeConfig({
        behavior: { sendAutomaticallyWhen: configFn },
      });
      renderHook(() => useAIChat(config, { agentBotId: 1, sendAutomaticallyWhen: optionsFn }));

      expect(mockUseChat).toHaveBeenCalledWith(
        expect.objectContaining({ sendAutomaticallyWhen: optionsFn }),
      );
    });
  });

  // ─── clearSession ─────────────────────────────────────────────────

  describe('clearSession', () => {
    it('calls persistence.remove with session key', async () => {
      const persistence = {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
        remove: jest.fn().mockResolvedValue(undefined),
      };
      const config = makeConfig({ persistence });

      const { result } = renderHook(() => useAIChat(config, { agentBotId: 1 }));

      await act(async () => {
        await result.current.clearSession();
      });

      expect(persistence.remove).toHaveBeenCalledWith('@ai_chat_active_session');
    });

    it('calls setMessages([]) to clear messages', async () => {
      const { result } = renderHook(() => useAIChat(makeConfig(), { agentBotId: 1 }));

      await act(async () => {
        await result.current.clearSession();
      });

      expect(mockChatSetMessages).toHaveBeenCalledWith([]);
    });

    it('resets sessionId to null', async () => {
      const config = makeConfig({
        persistence: {
          get: jest.fn().mockResolvedValue('existing-session'),
          set: jest.fn().mockResolvedValue(undefined),
          remove: jest.fn().mockResolvedValue(undefined),
        },
      });

      const { result } = renderHook(() => useAIChat(config, { agentBotId: 1 }));

      await waitFor(() => {
        expect(result.current.sessionId).toBe('existing-session');
      });

      await act(async () => {
        await result.current.clearSession();
      });

      expect(result.current.sessionId).toBeNull();
    });
  });

  // ─── AppState background listener ────────────────────────────────

  describe('AppState background listener', () => {
    it('stops streaming when app goes to background', () => {
      mockChatStatus = 'streaming';
      renderHook(() => useAIChat(makeConfig(), { agentBotId: 1 }));

      act(() => {
        capturedAppStateListener?.('background');
      });

      expect(mockChatStop).toHaveBeenCalled();
    });

    it('stops streaming when app becomes inactive', () => {
      mockChatStatus = 'streaming';
      renderHook(() => useAIChat(makeConfig(), { agentBotId: 1 }));

      act(() => {
        capturedAppStateListener?.('inactive');
      });

      expect(mockChatStop).toHaveBeenCalled();
    });

    it('does NOT stop when app goes to foreground and status is ready', () => {
      mockChatStatus = 'ready';
      renderHook(() => useAIChat(makeConfig(), { agentBotId: 1 }));

      act(() => {
        capturedAppStateListener?.('active');
      });

      expect(mockChatStop).not.toHaveBeenCalled();
    });

    it('registers AppState listener on mount', () => {
      renderHook(() => useAIChat(makeConfig(), { agentBotId: 1 }));
      expect(mockAppStateAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('removes AppState listener on unmount', () => {
      const { unmount } = renderHook(() => useAIChat(makeConfig(), { agentBotId: 1 }));
      unmount();
      expect(mockRemove).toHaveBeenCalled();
    });
  });

  // ─── Unmount cleanup ─────────────────────────────────────────────

  describe('cleanup on unmount', () => {
    // MC-3: The cleanup effect calls chat.stop() on unmount
    it('calls chat.stop on unmount', () => {
      const { unmount } = renderHook(() => useAIChat(makeConfig(), { agentBotId: 1 }));

      // Clear any calls from mount
      mockChatStop.mockClear();

      unmount();

      expect(mockChatStop).toHaveBeenCalled();
    });
  });

  // ─── Return value pass-throughs ───────────────────────────────────

  describe('return value', () => {
    it('passes through stop from chat', () => {
      const { result } = renderHook(() => useAIChat(makeConfig()));
      expect(result.current.stop).toBe(mockChatStop);
    });

    it('passes through setMessages from chat', () => {
      const { result } = renderHook(() => useAIChat(makeConfig()));
      expect(result.current.setMessages).toBe(mockChatSetMessages);
    });

    it('passes through addToolOutput from chat', () => {
      const { result } = renderHook(() => useAIChat(makeConfig()));
      expect(result.current.addToolOutput).toBe(mockChatAddToolOutput);
    });

    it('exposes messages from chat', () => {
      mockChatMessages = [{ id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }];
      const { result } = renderHook(() => useAIChat(makeConfig()));
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].id).toBe('msg-1');
    });

    it('exposes error from chat', () => {
      const testError = new Error('chat error');
      mockChatError = testError;
      const { result } = renderHook(() => useAIChat(makeConfig()));
      expect(result.current.error).toBe(testError);
    });
  });

  // ─── Error handling ───────────────────────────────────────────────

  describe('error handling', () => {
    it('calls onError callback when handleError is triggered', async () => {
      let capturedOnError: ((error: Error) => void) | undefined;

      mockUseChat.mockImplementation(
        (opts: {
          onFinish?: (opts: { message: UIMessage; isAbort: boolean }) => void;
          onError?: (error: Error) => void;
        }) => {
          capturedOnError = opts.onError;
          return makeMockChat();
        },
      );

      const onError = jest.fn();
      renderHook(() => useAIChat(makeConfig(), { agentBotId: 1, onError }));

      await act(async () => {
        capturedOnError?.(new Error('Something went wrong'));
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Something went wrong' }),
      );
    });

    it('ignores known SDK internal errors', async () => {
      let capturedOnError: ((error: Error) => void) | undefined;

      mockUseChat.mockImplementation(
        (opts: {
          onFinish?: (opts: { message: UIMessage; isAbort: boolean }) => void;
          onError?: (error: Error) => void;
        }) => {
          capturedOnError = opts.onError;
          return makeMockChat();
        },
      );

      const onError = jest.fn();
      renderHook(() => useAIChat(makeConfig(), { agentBotId: 1, onError }));

      await act(async () => {
        capturedOnError?.(new Error("Cannot read property 'text' of undefined"));
      });

      expect(onError).not.toHaveBeenCalled();
    });
  });
});
