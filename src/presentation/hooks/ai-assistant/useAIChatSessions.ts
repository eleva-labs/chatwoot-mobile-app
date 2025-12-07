import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import {
  aiChatActions,
  selectSessionsByAgentBot,
  selectActiveSessionId,
  setActiveSession,
} from '@/infrastructure/state/ai-assistant';
import type { AIChatSession } from '@/infrastructure/dto/ai-assistant';

// Stable empty array reference to prevent unnecessary rerenders
const EMPTY_SESSIONS: AIChatSession[] = [];

export interface UseAIChatSessionsReturn {
  sessions: AIChatSession[];
  activeSessionId: string | null;
  showSessions: boolean;
  setShowSessions: (show: boolean) => void;
  handleSelectSession: (sessionId: string) => void;
  handleNewConversation: () => void;
}

/**
 * Hook for managing AI chat sessions
 */
export function useAIChatSessions(
  selectedBotId: number | undefined,
  accountId?: number,
  agentBotId?: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setMessages?: (messages: any) => void,
): UseAIChatSessionsReturn {
  const dispatch = useAppDispatch();
  const activeSessionId = useAppSelector(selectActiveSessionId);

  // Get sessions from Redux using memoized selectors
  const sessions = useAppSelector(state =>
    selectedBotId ? selectSessionsByAgentBot(state, selectedBotId) : EMPTY_SESSIONS,
  );

  // Show sessions list by default if we have sessions
  const [showSessions, setShowSessions] = useState(false);

  // Track if we've already auto-shown the sessions list to prevent interference
  const hasAutoShownRef = useRef(false);

  // Auto-select latest session and show sessions list when sessions are loaded
  useEffect(() => {
    if (sessions && sessions.length > 0) {
      // Auto-show sessions list only once when sessions are first loaded
      if (!hasAutoShownRef.current) {
        setShowSessions(true);
        hasAutoShownRef.current = true;
      }

      // Auto-select latest session if no active session is set
      // Sessions are sorted by most recent first
      if (!activeSessionId && sessions.length > 0) {
        const latestSession = sessions[0];
        if (latestSession?.id) {
          dispatch(setActiveSession({ sessionId: latestSession.id }));
        } else {
          console.warn('[useAIChatSessions] No latest session available to auto-select');
        }
      }
    }
  }, [sessions, activeSessionId, dispatch]);

  // Fetch sessions on mount or when bot is selected
  // Following Chatwoot's pattern: GET /api/v1/accounts/:account_id/ai_chat/sessions?agent_bot_id=:id&limit=:n
  useEffect(() => {
    if (selectedBotId) {
      dispatch(
        aiChatActions.fetchSessions({
          agentBotId: selectedBotId,
          limit: 25,
          usePythonBackend: false,
        }),
      );
    }
  }, [dispatch, accountId, selectedBotId, agentBotId]);

  // Load messages when session is selected
  // Following Chatwoot's pattern: GET /api/v1/accounts/:account_id/ai_chat/sessions/:session_id/messages?limit=:n
  useEffect(() => {
    if (activeSessionId) {
      dispatch(
        aiChatActions.fetchMessages({
          sessionId: activeSessionId,
          limit: 100,
          usePythonBackend: false,
        }),
      );
    }
  }, [dispatch, activeSessionId]);

  // Handle session selection
  const handleSelectSession = useCallback(
    (sessionId: string) => {
      dispatch(setActiveSession({ sessionId }));
      setShowSessions(false);
    },
    [dispatch],
  );

  // Handle new conversation
  const handleNewConversation = useCallback(() => {
    dispatch(setActiveSession({ sessionId: null }));
    if (setMessages) {
      setMessages([]);
    }
  }, [dispatch, setMessages]);

  return {
    sessions,
    activeSessionId,
    showSessions,
    setShowSessions,
    handleSelectSession,
    handleNewConversation,
  };
}
