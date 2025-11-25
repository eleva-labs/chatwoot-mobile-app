import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/reducers';
import type { AIChatSession, AIChatMessage } from '@/services/AIChatService';

/**
 * Select the entire AI chat state
 */
export const selectAIChatState = (state: RootState) => state.aiChat;

// Stable empty array reference to prevent unnecessary rerenders
const EMPTY_SESSIONS: AIChatSession[] = [];
const EMPTY_MESSAGES: AIChatMessage[] = [];

/**
 * Select sessions for a specific agent bot or store
 */
export const selectSessionsByKey = createSelector(
  [selectAIChatState, (_state: RootState, key: string) => key],
  (aiChatState, key) => {
    const sessions = aiChatState.sessions[key];
    return sessions && sessions.length > 0 ? sessions : EMPTY_SESSIONS;
  },
);

/**
 * Select sessions for an agent bot (Rails proxy)
 */
export const selectSessionsByAgentBot = createSelector(
  [selectAIChatState, (_state: RootState, agentBotId: number) => agentBotId],
  (aiChatState, agentBotId) => {
    const key = `agentBot_${agentBotId}`;
    const sessions = aiChatState.sessions[key];
    return sessions && sessions.length > 0 ? sessions : EMPTY_SESSIONS;
  },
);

/**
 * Select sessions for a store (Python backend)
 */
export const selectSessionsByStore = createSelector(
  [selectAIChatState, (_state: RootState, storeId: number) => storeId],
  (aiChatState, storeId) => {
    const key = `store_${storeId}`;
    const sessions = aiChatState.sessions[key];
    return sessions && sessions.length > 0 ? sessions : EMPTY_SESSIONS;
  },
);

/**
 * Select messages for a specific session
 */
export const selectMessagesBySession = createSelector(
  [selectAIChatState, (_state: RootState, sessionId: string) => sessionId],
  (aiChatState, sessionId) => {
    const messages = aiChatState.messages[sessionId];
    return messages && messages.length > 0 ? messages : EMPTY_MESSAGES;
  },
);

/**
 * Select the active session ID
 */
export const selectActiveSessionId = createSelector([selectAIChatState], aiChatState => aiChatState.activeSessionId);

/**
 * Select the active session
 */
export const selectActiveSession = createSelector(
  [selectAIChatState, selectActiveSessionId],
  (aiChatState, activeSessionId) => {
    if (!activeSessionId) return null;

    // Search through all sessions to find the active one
    for (const sessions of Object.values(aiChatState.sessions)) {
      const session = sessions.find(s => s.chat_session_id === activeSessionId);
      if (session) return session;
    }
    return null;
  },
);

/**
 * Select messages for the active session
 */
export const selectActiveSessionMessages = createSelector(
  [selectAIChatState, selectActiveSessionId],
  (aiChatState, activeSessionId) => {
    if (!activeSessionId) return [];
    return aiChatState.messages[activeSessionId] || [];
  },
);

/**
 * Select loading states
 */
export const selectIsLoadingSessions = createSelector(
  [selectAIChatState],
  aiChatState => aiChatState.isLoadingSessions,
);

export const selectIsLoadingMessages = createSelector(
  [selectAIChatState],
  aiChatState => aiChatState.isLoadingMessages,
);

/**
 * Select error states
 */
export const selectSessionsError = createSelector(
  [selectAIChatState],
  aiChatState => aiChatState.sessionsError,
);

export const selectMessagesError = createSelector(
  [selectAIChatState],
  aiChatState => aiChatState.messagesError,
);

