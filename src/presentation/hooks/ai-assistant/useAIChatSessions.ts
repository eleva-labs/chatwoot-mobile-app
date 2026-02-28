import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import {
  aiChatActions,
  selectSessionsByAgentBot,
  selectActiveSessionId,
  selectIsLoadingMessages,
  setActiveSession,
} from '@/store/ai-chat';
import type { AIChatSession } from '@/store/ai-chat/aiChatTypes';
import type { SessionsStateAdapter } from '@/types/ai-chat/sessionsAdapter';

// Stable empty array reference to prevent unnecessary rerenders
const EMPTY_SESSIONS: AIChatSession[] = [];

export interface UseAIChatSessionsReturn {
  sessions: AIChatSession[];
  activeSessionId: string | null;
  isLoadingMessages: boolean;
  showSessions: boolean;
  setShowSessions: (show: boolean) => void;
  handleSelectSession: (sessionId: string) => void;
  handleNewConversation: () => void;
  isNewConversation: boolean;
}

/**
 * Hook for managing AI chat sessions.
 *
 * Accepts an optional SessionsStateAdapter for commands. When provided,
 * the adapter's setActiveSessionId is used alongside Redux dispatch.
 *
 * NOTE on reactivity: useAppSelector is still used for reactive subscriptions
 * (sessions, activeSessionId, isLoadingMessages) because the adapter's
 * imperative getters do NOT trigger React re-renders.
 */
export function useAIChatSessions(
  adapter: SessionsStateAdapter | undefined,
  selectedBotId: number | undefined,
  options?: {
    stop?: () => void;
    clearSession?: () => Promise<void>;
    onBridgeKeyReset?: () => void;
  },
): UseAIChatSessionsReturn {
  const dispatch = useAppDispatch();
  const activeSessionId = useAppSelector(selectActiveSessionId);
  const isLoadingMessages = useAppSelector(selectIsLoadingMessages);

  // Get sessions from Redux using memoized selectors
  const sessions = useAppSelector(state =>
    selectedBotId ? selectSessionsByAgentBot(state, selectedBotId) : EMPTY_SESSIONS,
  );

  // Stable ref for adapter
  const adapterRef = useRef(adapter);
  useEffect(() => {
    adapterRef.current = adapter;
  }, [adapter]);

  // Sessions panel visibility — controlled exclusively by user interaction (header toggle button)
  const [showSessions, setShowSessions] = useState(false);

  // Flag to suppress auto-select and the reactive message bridge after user explicitly
  // starts a new conversation. Lifecycle:
  //   - Set TRUE in handleNewConversation()
  //   - Set FALSE in handleSelectSession() (user picks a session after pressing "New")
  //   - Set FALSE when activeSessionId becomes truthy (backend returned X-Chat-Session-Id)
  // Without this, setting activeSessionId=null triggers auto-select which immediately
  // re-selects the latest session, and the bridge would reload old messages into the SDK.
  //
  // Both ref (for synchronous reads within callbacks) and state (for reactive
  // dependency in the message bridge effect — INV-5) are maintained in sync.
  const isNewConversationRef = useRef(false);
  const [isNewConversation, setIsNewConversation] = useState(false);

  // Stable refs for functions received from parent to prevent cascade re-renders
  // during streaming. The parent re-renders on every streaming tick due to
  // chat.messages updates, but this hook's effects should not re-fire.
  const clearSessionRef = useRef(options?.clearSession);
  const stopRef = useRef(options?.stop);
  const onBridgeKeyResetRef = useRef(options?.onBridgeKeyReset);

  useEffect(() => {
    clearSessionRef.current = options?.clearSession;
  }, [options?.clearSession]);
  useEffect(() => {
    stopRef.current = options?.stop;
  }, [options?.stop]);
  useEffect(() => {
    onBridgeKeyResetRef.current = options?.onBridgeKeyReset;
  }, [options?.onBridgeKeyReset]);

  // Auto-select latest session when sessions are loaded
  useEffect(() => {
    if (sessions && sessions.length > 0) {
      // Auto-select latest session if no active session is set
      // Sessions are sorted by most recent first
      if (!activeSessionId && sessions.length > 0 && !isNewConversationRef.current) {
        const latestSession = sessions[0];
        if (latestSession?.chat_session_id) {
          dispatch(setActiveSession({ sessionId: latestSession.chat_session_id }));
        }
      }
    }
  }, [sessions, activeSessionId, dispatch]);

  // Clear isNewConversation when activeSessionId becomes truthy
  // (i.e. backend returned X-Chat-Session-Id for the new conversation)
  useEffect(() => {
    if (activeSessionId && isNewConversationRef.current) {
      isNewConversationRef.current = false;
      setIsNewConversation(false);
    }
  }, [activeSessionId]);

  // Fetch sessions on mount or when bot is selected
  useEffect(() => {
    if (selectedBotId) {
      dispatch(
        aiChatActions.fetchSessions({
          agentBotId: selectedBotId,
          limit: 25,
        }),
      );
    }
  }, [dispatch, selectedBotId]);

  // Load messages when session is selected
  useEffect(() => {
    if (activeSessionId) {
      dispatch(
        aiChatActions.fetchMessages({
          sessionId: activeSessionId,
          limit: 100,
        }),
      );
    }
  }, [dispatch, activeSessionId]);

  // Handle session selection
  const handleSelectSession = useCallback(
    (sessionId: string) => {
      if (sessionId === activeSessionId) {
        setShowSessions(false);
        return;
      }
      isNewConversationRef.current = false;
      setIsNewConversation(false);
      onBridgeKeyResetRef.current?.(); // Reset so bridge loads new session's messages
      if (stopRef.current) {
        stopRef.current(); // Stop any active stream before switching
      }
      dispatch(setActiveSession({ sessionId }));
      setShowSessions(false);
    },
    [dispatch, activeSessionId],
  );

  // Handle new conversation
  const handleNewConversation = useCallback(async () => {
    isNewConversationRef.current = true;
    setIsNewConversation(true);
    onBridgeKeyResetRef.current?.(); // Reset for future session loads
    if (stopRef.current) {
      stopRef.current(); // Stop any active stream
    }
    dispatch(setActiveSession({ sessionId: null }));
    // clearSession handles both setSessionId(null) and setMessages([])
    if (clearSessionRef.current) {
      await clearSessionRef.current();
    }
  }, [dispatch]);

  return {
    sessions,
    activeSessionId,
    isLoadingMessages,
    showSessions,
    setShowSessions,
    handleSelectSession,
    handleNewConversation,
    isNewConversation,
  };
}
