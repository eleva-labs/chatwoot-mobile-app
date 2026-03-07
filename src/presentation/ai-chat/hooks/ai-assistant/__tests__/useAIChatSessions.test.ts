/**
 * Tests for useAIChatSessions hook
 *
 * Safety net before AI Generative UI Framework Phase 1.
 * Tests session management, adapter vs Redux branching, and lifecycle.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import type { AIChatSession } from '@application/store/ai-chat/aiChatTypes';
import type { SessionsStateAdapter } from '@domain/types/ai-chat/sessionsAdapter';

import {
  aiChatActions,
  selectActiveSessionId,
  selectIsLoadingMessages,
  selectSessionsByAgentBot,
  setActiveSession,
} from '@application/store/ai-chat';

import { useAIChatSessions } from '../useAIChatSessions';

// ─── Redux mocks ──────────────────────────────────────────────────

const mockDispatch = jest.fn();
const mockUseAppDispatch = jest.fn(() => mockDispatch);
const mockUseAppSelector = jest.fn();

jest.mock('@/hooks', () => ({
  useAppDispatch: (...args: unknown[]) => mockUseAppDispatch(...(args as [])),
  useAppSelector: (...args: unknown[]) => mockUseAppSelector(...(args as [])),
}));

jest.mock('@application/store/ai-chat', () => ({
  aiChatActions: {
    fetchSessions: jest.fn((payload: unknown) => ({ type: 'aiChat/fetchSessions', payload })),
    fetchMessages: jest.fn((payload: unknown) => ({ type: 'aiChat/fetchMessages', payload })),
  },
  selectSessionsByAgentBot: jest.fn(),
  selectActiveSessionId: jest.fn(),
  selectIsLoadingMessages: jest.fn(),
  setActiveSession: jest.fn((payload: unknown) => ({ type: 'aiChat/setActiveSession', payload })),
}));

// ─── Factories ────────────────────────────────────────────────────

const EMPTY_SESSIONS: AIChatSession[] = [];

function makeSessions(count: number): AIChatSession[] {
  return Array.from({ length: count }, (_, i) => ({
    chat_session_id: `session-${i + 1}`,
    updated_at: `2026-01-0${i + 1}T00:00:00Z`,
    agent_bot_id: 42,
  }));
}

function makeAdapter(overrides: Partial<SessionsStateAdapter> = {}): SessionsStateAdapter {
  return {
    fetchSessions: jest.fn().mockResolvedValue([]),
    fetchMessages: jest.fn().mockResolvedValue([]),
    setActiveSessionId: jest.fn(),
    getSessions: jest.fn().mockReturnValue([]),
    getActiveSessionId: jest.fn().mockReturnValue(null),
    getIsLoadingSessions: jest.fn().mockReturnValue(false),
    getIsLoadingMessages: jest.fn().mockReturnValue(false),
    getMessagesBySession: jest.fn().mockReturnValue([]),
    ...overrides,
  };
}

// FG-4: Use selector-identity-based dispatch to avoid fragile mockReturnValueOnce chaining.
function setupSelectorMocks({
  sessions = EMPTY_SESSIONS,
  activeSessionId = null,
  isLoadingMessages = false,
}: {
  sessions?: AIChatSession[];
  activeSessionId?: string | null;
  isLoadingMessages?: boolean;
} = {}) {
  mockUseAppDispatch.mockReturnValue(mockDispatch);
  mockUseAppSelector.mockImplementation((selector: unknown) => {
    if (selector === selectActiveSessionId) return activeSessionId;
    if (selector === selectIsLoadingMessages) return isLoadingMessages;
    if (selector === selectSessionsByAgentBot) return sessions;
    // The hook uses a state-based selector (state => ...) for sessions when selectedBotId is set.
    // For function selectors (not reference-equal to the named selectors), return sessions.
    if (typeof selector === 'function') return sessions;
    return undefined;
  });
}

// ─── Tests ────────────────────────────────────────────────────────

describe('useAIChatSessions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Initial state ────────────────────────────────────────────────

  describe('initial state', () => {
    it('returns showSessions=false initially', () => {
      setupSelectorMocks({});
      const { result } = renderHook(() => useAIChatSessions(undefined, 42));
      expect(result.current.showSessions).toBe(false);
    });

    it('returns isNewConversation=false initially', () => {
      setupSelectorMocks({});
      const { result } = renderHook(() => useAIChatSessions(undefined, 42));
      expect(result.current.isNewConversation).toBe(false);
    });

    it('returns activeSessionId from redux selector', () => {
      setupSelectorMocks({ activeSessionId: 'session-abc' });
      const { result } = renderHook(() => useAIChatSessions(undefined, 42));
      expect(result.current.activeSessionId).toBe('session-abc');
    });

    it('returns isLoadingMessages from redux selector', () => {
      setupSelectorMocks({ isLoadingMessages: true });
      const { result } = renderHook(() => useAIChatSessions(undefined, 42));
      expect(result.current.isLoadingMessages).toBe(true);
    });

    it('returns sessions from redux selector', () => {
      const sessions = makeSessions(2);
      setupSelectorMocks({ sessions });
      const { result } = renderHook(() => useAIChatSessions(undefined, 42));
      expect(result.current.sessions).toHaveLength(2);
    });
  });

  // ─── fetchSessions ────────────────────────────────────────────────

  describe('fetchSessions', () => {
    it('dispatches fetchSessions when no adapter and botId is provided', () => {
      setupSelectorMocks({});
      renderHook(() => useAIChatSessions(undefined, 42));

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'aiChat/fetchSessions' }),
      );
      expect(aiChatActions.fetchSessions).toHaveBeenCalledWith({ agentBotId: 42, limit: 25 });
    });

    it('calls adapter.fetchSessions when adapter is provided', () => {
      setupSelectorMocks({});
      const adapter = makeAdapter();
      renderHook(() => useAIChatSessions(adapter, 42));

      expect(adapter.fetchSessions).toHaveBeenCalledWith({ agentBotId: 42, limit: 25 });
    });

    it('skips fetchSessions when no botId is provided', () => {
      setupSelectorMocks({});
      renderHook(() => useAIChatSessions(undefined, undefined));

      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'aiChat/fetchSessions' }),
      );
    });
  });

  // ─── fetchMessages ────────────────────────────────────────────────

  describe('fetchMessages', () => {
    it('dispatches fetchMessages when no adapter and activeSessionId is set', () => {
      setupSelectorMocks({ activeSessionId: 'session-1' });
      renderHook(() => useAIChatSessions(undefined, 42));

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'aiChat/fetchMessages' }),
      );
      expect(aiChatActions.fetchMessages).toHaveBeenCalledWith({
        sessionId: 'session-1',
        limit: 100,
      });
    });

    it('calls adapter.fetchMessages when adapter is provided', () => {
      setupSelectorMocks({ activeSessionId: 'session-1' });
      const adapter = makeAdapter();
      renderHook(() => useAIChatSessions(adapter, 42));

      expect(adapter.fetchMessages).toHaveBeenCalledWith({ sessionId: 'session-1', limit: 100 });
    });

    it('skips fetchMessages when activeSessionId is null', () => {
      setupSelectorMocks({ activeSessionId: null });
      renderHook(() => useAIChatSessions(undefined, 42));

      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'aiChat/fetchMessages' }),
      );
    });
  });

  // ─── Auto-select ──────────────────────────────────────────────────

  describe('auto-select', () => {
    it('dispatches setActiveSession for sessions[0] when no activeSessionId and not new conversation', () => {
      const sessions = makeSessions(2);
      setupSelectorMocks({ sessions, activeSessionId: null });
      renderHook(() => useAIChatSessions(undefined, 42));

      expect(setActiveSession).toHaveBeenCalledWith({ sessionId: 'session-1' });
    });

    it('calls adapter.setActiveSessionId for sessions[0] when adapter is provided', () => {
      const sessions = makeSessions(2);
      setupSelectorMocks({ sessions, activeSessionId: null });
      const adapter = makeAdapter();
      renderHook(() => useAIChatSessions(adapter, 42));

      expect(adapter.setActiveSessionId).toHaveBeenCalledWith('session-1');
    });

    it('does NOT auto-select when activeSessionId already set', () => {
      const sessions = makeSessions(2);
      setupSelectorMocks({ sessions, activeSessionId: 'session-1' });
      const adapter = makeAdapter();
      renderHook(() => useAIChatSessions(adapter, 42));

      expect(adapter.setActiveSessionId).not.toHaveBeenCalled();
    });

    it('does NOT auto-select when sessions list is empty', () => {
      setupSelectorMocks({ sessions: [], activeSessionId: null });
      const adapter = makeAdapter();
      renderHook(() => useAIChatSessions(adapter, 42));

      expect(adapter.setActiveSessionId).not.toHaveBeenCalled();
    });

    // MC-7: isNewConversation=true suppresses auto-select
    it('does NOT auto-select when isNewConversation=true', async () => {
      const sessions = makeSessions(2);
      setupSelectorMocks({ sessions, activeSessionId: null });

      const { result } = renderHook(() => useAIChatSessions(undefined, 42));

      // Clear auto-select calls from initial render
      mockDispatch.mockClear();
      jest.mocked(setActiveSession).mockClear();

      // handleNewConversation sets isNewConversationRef.current = true
      await act(async () => {
        await result.current.handleNewConversation();
      });

      // Re-render with same sessions (still no activeSessionId)
      // Auto-select effect should NOT fire because isNewConversationRef.current=true
      // Clear dispatch calls made by handleNewConversation itself
      mockDispatch.mockClear();
      jest.mocked(setActiveSession).mockClear();

      // Trigger a re-render without changing sessions (isNewConversation guard should block auto-select)
      act(() => {
        // Force a re-render by toggling a value that causes re-render but doesn't affect auto-select
        result.current.setShowSessions(false);
      });

      // setActiveSession should NOT have been called because isNewConversation is true
      expect(setActiveSession).not.toHaveBeenCalledWith({ sessionId: 'session-1' });
    });

    // FG-5: No-op for already-active session also prevents Redux dispatch
    it('does NOT dispatch setActiveSession when selecting already-active session (no adapter)', () => {
      setupSelectorMocks({ sessions: makeSessions(2), activeSessionId: 'session-1' });
      const { result } = renderHook(() => useAIChatSessions(undefined, 42));

      // Clear any dispatch calls from initial effects
      mockDispatch.mockClear();
      jest.mocked(setActiveSession).mockClear();

      act(() => {
        result.current.handleSelectSession('session-1');
      });

      // Should not dispatch setActiveSession for same session
      expect(setActiveSession).not.toHaveBeenCalledWith({ sessionId: 'session-1' });
    });
  });

  // ─── handleSelectSession ──────────────────────────────────────────

  describe('handleSelectSession', () => {
    it('calls adapter.setActiveSessionId with new sessionId', () => {
      setupSelectorMocks({ activeSessionId: 'session-old' });
      const adapter = makeAdapter();
      const stop = jest.fn();
      const onBridgeKeyReset = jest.fn();

      const { result } = renderHook(() =>
        useAIChatSessions(adapter, 42, { stop, onBridgeKeyReset }),
      );

      act(() => {
        result.current.handleSelectSession('session-new');
      });

      expect(adapter.setActiveSessionId).toHaveBeenCalledWith('session-new');
    });

    it('calls stop() when switching sessions', () => {
      setupSelectorMocks({ activeSessionId: 'session-old' });
      const stop = jest.fn();

      const { result } = renderHook(() => useAIChatSessions(undefined, 42, { stop }));

      act(() => {
        result.current.handleSelectSession('session-new');
      });

      expect(stop).toHaveBeenCalled();
    });

    it('calls onBridgeKeyReset when switching sessions', () => {
      setupSelectorMocks({ activeSessionId: 'session-old' });
      const onBridgeKeyReset = jest.fn();

      const { result } = renderHook(() => useAIChatSessions(undefined, 42, { onBridgeKeyReset }));

      act(() => {
        result.current.handleSelectSession('session-new');
      });

      expect(onBridgeKeyReset).toHaveBeenCalled();
    });

    it('is a no-op when selecting the already-active session', () => {
      setupSelectorMocks({ activeSessionId: 'session-1' });
      const adapter = makeAdapter();
      const stop = jest.fn();

      const { result } = renderHook(() => useAIChatSessions(adapter, 42, { stop }));

      act(() => {
        result.current.handleSelectSession('session-1');
      });

      // Should not re-dispatch since it's already active
      expect(adapter.setActiveSessionId).not.toHaveBeenCalled();
      expect(stop).not.toHaveBeenCalled();
    });

    it('closes sessions panel after selecting', () => {
      setupSelectorMocks({ activeSessionId: 'session-old' });
      const { result } = renderHook(() => useAIChatSessions(undefined, 42));

      act(() => {
        result.current.setShowSessions(true);
      });

      act(() => {
        result.current.handleSelectSession('session-new');
      });

      expect(result.current.showSessions).toBe(false);
    });

    it('dispatches setActiveSession via Redux when no adapter', () => {
      setupSelectorMocks({ activeSessionId: 'session-old' });
      const { result } = renderHook(() => useAIChatSessions(undefined, 42));

      act(() => {
        result.current.handleSelectSession('session-new');
      });

      expect(setActiveSession).toHaveBeenCalledWith({ sessionId: 'session-new' });
    });

    it('sets isNewConversation to false after selecting', () => {
      setupSelectorMocks({ activeSessionId: 'session-old' });
      const { result } = renderHook(() => useAIChatSessions(undefined, 42));

      act(() => {
        result.current.handleSelectSession('session-new');
      });

      expect(result.current.isNewConversation).toBe(false);
    });
  });

  // ─── handleNewConversation ────────────────────────────────────────

  describe('handleNewConversation', () => {
    it('sets isNewConversation to true', async () => {
      setupSelectorMocks({});
      const { result } = renderHook(() => useAIChatSessions(undefined, 42));

      await act(async () => {
        await result.current.handleNewConversation();
      });

      expect(result.current.isNewConversation).toBe(true);
    });

    it('calls stop()', async () => {
      setupSelectorMocks({});
      const stop = jest.fn();
      const { result } = renderHook(() => useAIChatSessions(undefined, 42, { stop }));

      await act(async () => {
        await result.current.handleNewConversation();
      });

      expect(stop).toHaveBeenCalled();
    });

    it('calls clearSession()', async () => {
      setupSelectorMocks({});
      const clearSession = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useAIChatSessions(undefined, 42, { clearSession }));

      await act(async () => {
        await result.current.handleNewConversation();
      });

      expect(clearSession).toHaveBeenCalled();
    });

    it('calls onBridgeKeyReset()', async () => {
      setupSelectorMocks({});
      const onBridgeKeyReset = jest.fn();
      const { result } = renderHook(() => useAIChatSessions(undefined, 42, { onBridgeKeyReset }));

      await act(async () => {
        await result.current.handleNewConversation();
      });

      expect(onBridgeKeyReset).toHaveBeenCalled();
    });

    it('clears activeSessionId via adapter when adapter is provided', async () => {
      setupSelectorMocks({});
      const adapter = makeAdapter();
      const { result } = renderHook(() => useAIChatSessions(adapter, 42));

      await act(async () => {
        await result.current.handleNewConversation();
      });

      expect(adapter.setActiveSessionId).toHaveBeenCalledWith(null);
    });

    it('dispatches setActiveSession(null) via Redux when no adapter', async () => {
      setupSelectorMocks({});
      const { result } = renderHook(() => useAIChatSessions(undefined, 42));

      await act(async () => {
        await result.current.handleNewConversation();
      });

      expect(setActiveSession).toHaveBeenCalledWith({ sessionId: null });
    });

    // MC-8: isNewConversation clears when activeSessionId becomes truthy
    it('clears isNewConversation when activeSessionId becomes truthy', async () => {
      // Start with no activeSessionId
      setupSelectorMocks({ activeSessionId: null });

      const { result, rerender } = renderHook(() => useAIChatSessions(undefined, 42));

      // Set isNewConversation to true
      await act(async () => {
        await result.current.handleNewConversation();
      });

      expect(result.current.isNewConversation).toBe(true);

      // Now update mock so activeSessionId becomes truthy (simulating backend returning X-Chat-Session-Id)
      setupSelectorMocks({ activeSessionId: 'new-session-from-backend' });

      // Re-render to trigger the effect
      rerender(undefined);

      // isNewConversation should be cleared because activeSessionId became truthy
      await waitFor(() => {
        expect(result.current.isNewConversation).toBe(false);
      });
    });
  });

  // ─── handleNewConversation panel behavior ─────────────────────────

  describe('handleNewConversation panel behavior', () => {
    // N5: Documents that handleNewConversation does NOT close the sessions panel.
    // useAIChatSessions.ts/handleNewConversation never calls setShowSessions(false).
    // Only handleSelectSession closes the panel. If you want the panel to close
    // on "New Conversation", that change must be made in the implementation.
    it('does NOT close sessions panel on handleNewConversation', async () => {
      setupSelectorMocks({});
      const { result } = renderHook(() => useAIChatSessions(undefined, 42));

      // Open the sessions panel first
      act(() => {
        result.current.setShowSessions(true);
      });
      expect(result.current.showSessions).toBe(true);

      // Trigger new conversation
      await act(async () => {
        await result.current.handleNewConversation();
      });

      // Panel remains open — handleNewConversation does not call setShowSessions(false)
      expect(result.current.showSessions).toBe(true);
    });
  });

  // ─── setShowSessions ──────────────────────────────────────────────

  describe('setShowSessions', () => {
    it('toggles showSessions to true', () => {
      setupSelectorMocks({});
      const { result } = renderHook(() => useAIChatSessions(undefined, 42));

      act(() => {
        result.current.setShowSessions(true);
      });

      expect(result.current.showSessions).toBe(true);
    });

    it('toggles showSessions back to false', () => {
      setupSelectorMocks({});
      const { result } = renderHook(() => useAIChatSessions(undefined, 42));

      act(() => {
        result.current.setShowSessions(true);
      });
      act(() => {
        result.current.setShowSessions(false);
      });

      expect(result.current.showSessions).toBe(false);
    });
  });
});
