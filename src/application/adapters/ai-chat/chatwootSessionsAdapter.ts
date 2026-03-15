/**
 * Chatwoot Sessions Adapter [APP]
 *
 * Wraps Redux store into the SessionsStateAdapter interface.
 * This file stays in the Chatwoot app; it is NOT extracted into the package.
 */

import type { SessionsStateAdapter } from '@domain/types/ai-chat/sessionsAdapter';
import type { AppDispatch } from '@application/store';
import { getStore } from '@application/store/storeAccessor';
import {
  aiChatActions,
  setActiveSession,
  selectSessionsByAgentBot,
  selectActiveSessionId,
  selectIsLoadingSessions,
  selectIsLoadingMessages,
  selectMessagesBySession,
} from '@application/store/ai-chat';
import { AIChatService } from '@application/store/ai-chat/aiChatService';

/**
 * Factory function to create a Chatwoot sessions adapter.
 * The adapter wraps Redux dispatch/selectors.
 */
export function createChatwootSessionsAdapter(): SessionsStateAdapter {
  const dispatch = getStore().dispatch as AppDispatch;
  return {
    fetchSessions: async params => {
      await dispatch(aiChatActions.fetchSessions(params));
      return selectSessionsByAgentBot(getStore().getState(), params.agentBotId);
    },

    fetchMessages: async params => {
      await dispatch(aiChatActions.fetchMessages(params));
      return selectMessagesBySession(getStore().getState(), params.sessionId);
    },

    deleteSession: async sessionId => {
      await AIChatService.deleteSession(sessionId);
    },

    getSessions: agentBotId => selectSessionsByAgentBot(getStore().getState(), agentBotId),

    getActiveSessionId: () => selectActiveSessionId(getStore().getState()),

    setActiveSessionId: id => getStore().dispatch(setActiveSession({ sessionId: id })),

    getIsLoadingSessions: () => selectIsLoadingSessions(getStore().getState()),

    getIsLoadingMessages: () => selectIsLoadingMessages(getStore().getState()),

    getMessagesBySession: sessionId => selectMessagesBySession(getStore().getState(), sessionId),
  };
}
