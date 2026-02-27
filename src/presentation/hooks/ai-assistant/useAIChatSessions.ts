import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import {
  aiChatActions,
  selectSessionsByAgentBot,
  selectActiveSessionId,
  selectIsLoadingMessages,
  selectMessagesBySession,
  setActiveSession,
} from '@/store/ai-chat';
import type { UIMessage } from 'ai';
import type { AIChatSession, AIChatMessage } from '@/store/ai-chat/aiChatTypes';
import { mapMessagesToUIMessages } from '@/store/ai-chat/aiChatMapper';

// Stable empty array references to prevent unnecessary rerenders
const EMPTY_SESSIONS: AIChatSession[] = [];
const EMPTY_MESSAGES: AIChatMessage[] = [];

export interface UseAIChatSessionsReturn {
  sessions: AIChatSession[];
  activeSessionId: string | null;
  isLoadingMessages: boolean;
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
  setMessages?: (messages: UIMessage[] | ((messages: UIMessage[]) => UIMessage[])) => void,
  clearSession?: () => Promise<void>,
  stop?: () => void,
  /** Current chat status — used to guard the bridge effect during streaming */
  chatStatus?: 'ready' | 'submitted' | 'streaming' | 'error',
): UseAIChatSessionsReturn {
  const dispatch = useAppDispatch();
  const activeSessionId = useAppSelector(selectActiveSessionId);
  const isLoadingMessages = useAppSelector(selectIsLoadingMessages);

  // Get sessions from Redux using memoized selectors
  const sessions = useAppSelector(state =>
    selectedBotId ? selectSessionsByAgentBot(state, selectedBotId) : EMPTY_SESSIONS,
  );

  // Read messages from Redux for the active session
  const backendMessages = useAppSelector(state =>
    activeSessionId ? selectMessagesBySession(state, activeSessionId) : EMPTY_MESSAGES,
  );

  // Sessions panel visibility — controlled exclusively by user interaction (header toggle button)
  const [showSessions, setShowSessions] = useState(false);

  // Flag to suppress auto-select and the reactive message bridge after user explicitly
  // starts a new conversation. Lifecycle:
  //   - Set TRUE in handleNewConversation()
  //   - Set FALSE in handleSelectSession() (user picks a session after pressing "New")
  //   - Set FALSE when activeSessionId becomes truthy (backend returned X-Chat-Session-Id)
  // Without this, setting activeSessionId=null triggers auto-select which immediately
  // re-selects the latest session, and the bridge would reload old messages into the SDK.
  const isNewConversationRef = useRef(false);

  // Stable refs for functions received from parent to prevent cascade re-renders
  // during streaming. The parent re-renders on every streaming tick due to
  // chat.messages updates, but this hook's effects should not re-fire.
  const setMessagesRef = useRef(setMessages);
  const clearSessionRef = useRef(clearSession);
  const stopRef = useRef(stop);

  useEffect(() => {
    setMessagesRef.current = setMessages;
  }, [setMessages]);
  useEffect(() => {
    clearSessionRef.current = clearSession;
  }, [clearSession]);
  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  // Track which session+messages combo we've already loaded into the SDK.
  // This prevents the bridge from re-firing after setMessages() triggers an SDK
  // re-render. Without this guard, any dep instability (e.g. selector cache miss)
  // causes: setMessages → re-render → bridge fires again → infinite loop.
  const loadedBridgeKeyRef = useRef<string | null>(null);

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

  // Clear isNewConversationRef when activeSessionId becomes truthy
  // (i.e. backend returned X-Chat-Session-Id for the new conversation)
  useEffect(() => {
    if (activeSessionId && isNewConversationRef.current) {
      isNewConversationRef.current = false;
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

  // Reactive bridge: load backend messages into SDK when they arrive.
  //
  // IMPORTANT: This effect must be idempotent. Calling setMessages() triggers an SDK
  // re-render (useSyncExternalStore). If any dependency gets a new reference on that
  // re-render (e.g. backendMessages via selector cache miss), the effect would fire
  // again → setMessages again → infinite loop ("Maximum update depth exceeded").
  //
  // The loadedBridgeKeyRef guard ensures we only call setMessages() ONCE per unique
  // session+messages combination. The key is reset when activeSessionId changes
  // (handled below) or when a new conversation starts.
  useEffect(() => {
    // Only load when:
    // 1. We have an active session
    // 2. Messages are no longer loading (fetch completed)
    // 3. We have backend messages to load
    // 4. setMessages is available
    // 5. Not a new conversation (user explicitly started fresh)
    // 6. Not actively streaming (bridge would be overwritten by SDK anyway)
    if (
      activeSessionId &&
      !isLoadingMessages &&
      backendMessages.length > 0 &&
      setMessagesRef.current &&
      !isNewConversationRef.current &&
      chatStatus !== 'streaming' &&
      chatStatus !== 'submitted'
    ) {
      // Build a stable key to check if we already loaded these exact messages.
      // Using session ID + message count + first/last message IDs as a fingerprint.
      const firstId = backendMessages[0]?.id ?? '';
      const lastId = backendMessages[backendMessages.length - 1]?.id ?? '';
      const bridgeKey = `${activeSessionId}:${backendMessages.length}:${firstId}:${lastId}`;

      if (loadedBridgeKeyRef.current === bridgeKey) {
        // Already loaded this exact set of messages — skip to prevent re-render loop
        return;
      }

      const converted = mapMessagesToUIMessages(backendMessages);
      setMessagesRef.current(converted);
      loadedBridgeKeyRef.current = bridgeKey;
    }
  }, [activeSessionId, isLoadingMessages, backendMessages, chatStatus]);

  // Handle session selection
  const handleSelectSession = useCallback(
    (sessionId: string) => {
      if (sessionId === activeSessionId) {
        setShowSessions(false);
        return;
      }
      isNewConversationRef.current = false;
      loadedBridgeKeyRef.current = null; // Reset so bridge loads new session's messages
      if (stopRef.current) {
        stopRef.current(); // Stop any active stream before switching
      }
      if (setMessagesRef.current) {
        setMessagesRef.current([]);
      }
      dispatch(setActiveSession({ sessionId }));
      setShowSessions(false);
    },
    [dispatch, activeSessionId],
  );

  // Handle new conversation
  const handleNewConversation = useCallback(async () => {
    isNewConversationRef.current = true;
    loadedBridgeKeyRef.current = null; // Reset for future session loads
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
  };
}
