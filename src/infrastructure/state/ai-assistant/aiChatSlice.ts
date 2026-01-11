import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { aiChatActions } from './aiChatActions';
import type { AIChatState, SetActiveSessionPayload, ClearSessionsPayload } from './aiChatTypes';

const initialState: AIChatState = {
  sessions: {},
  messages: {},
  isLoadingSessions: false,
  isLoadingMessages: false,
  sessionsError: null,
  messagesError: null,
  activeSessionId: null,
  selectedAgentBotId: undefined,
  selectedStoreId: undefined,
};

const aiChatSlice = createSlice({
  name: 'aiChat',
  initialState,
  reducers: {
    setActiveSession: (state, action: PayloadAction<SetActiveSessionPayload>) => {
      state.activeSessionId = action.payload.sessionId;
    },
    clearSessions: (state, action: PayloadAction<ClearSessionsPayload>) => {
      const { agentBotId, storeId } = action.payload;
      if (agentBotId !== undefined) {
        const key = `agentBot_${agentBotId}`;
        delete state.sessions[key];
      }
      if (storeId !== undefined) {
        const key = `store_${storeId}`;
        delete state.sessions[key];
      }
      // If no specific key provided, clear all
      if (agentBotId === undefined && storeId === undefined) {
        state.sessions = {};
      }
    },
    clearMessages: (state, action: PayloadAction<{ sessionId: string }>) => {
      delete state.messages[action.payload.sessionId];
    },
    clearAllMessages: state => {
      state.messages = {};
    },
  },
  extraReducers: builder => {
    // Fetch Sessions
    builder
      .addCase(aiChatActions.fetchSessions.pending, state => {
        state.isLoadingSessions = true;
        state.sessionsError = null;
      })
      .addCase(aiChatActions.fetchSessions.fulfilled, (state, action) => {
        state.isLoadingSessions = false;
        const { sessions, key } = action.payload;
        state.sessions[key] = sessions;
        state.sessionsError = null;
      })
      .addCase(aiChatActions.fetchSessions.rejected, (state, action) => {
        state.isLoadingSessions = false;
        state.sessionsError = action.error.message || 'Failed to fetch sessions';
      });

    // Fetch Messages
    builder
      .addCase(aiChatActions.fetchMessages.pending, state => {
        state.isLoadingMessages = true;
        state.messagesError = null;
      })
      .addCase(aiChatActions.fetchMessages.fulfilled, (state, action) => {
        state.isLoadingMessages = false;
        const { messages, sessionId } = action.payload;
        // Store messages in reverse order (newest first) as per Chatwoot pattern
        state.messages[sessionId] = messages.reverse();
        state.messagesError = null;
      })
      .addCase(aiChatActions.fetchMessages.rejected, (state, action) => {
        state.isLoadingMessages = false;
        state.messagesError = action.error.message || 'Failed to fetch messages';
      });

    // Create Session
    builder
      .addCase(aiChatActions.createSession.pending, state => {
        state.isLoadingSessions = true;
        state.sessionsError = null;
      })
      .addCase(aiChatActions.createSession.fulfilled, (state, action) => {
        state.isLoadingSessions = false;
        const { session, key } = action.payload;
        // Add the new session to the beginning of the list
        if (!state.sessions[key]) {
          state.sessions[key] = [];
        }
        state.sessions[key].unshift(session);
        state.activeSessionId = session.chat_session_id;
        state.sessionsError = null;
      })
      .addCase(aiChatActions.createSession.rejected, (state, action) => {
        state.isLoadingSessions = false;
        state.sessionsError = action.error.message || 'Failed to create session';
      });

    // Delete Session
    builder
      .addCase(aiChatActions.deleteSession.pending, state => {
        state.isLoadingSessions = true;
        state.sessionsError = null;
      })
      .addCase(aiChatActions.deleteSession.fulfilled, (state, action) => {
        state.isLoadingSessions = false;
        const { sessionId, key } = action.payload;
        // Remove the session from the list
        if (state.sessions[key]) {
          state.sessions[key] = state.sessions[key].filter(s => s.chat_session_id !== sessionId);
        }
        // Clear messages for this session
        delete state.messages[sessionId];
        // Clear active session if it was the deleted one
        if (state.activeSessionId === sessionId) {
          state.activeSessionId = null;
        }
        state.sessionsError = null;
      })
      .addCase(aiChatActions.deleteSession.rejected, (state, action) => {
        state.isLoadingSessions = false;
        state.sessionsError = action.error.message || 'Failed to delete session';
      });
  },
});

export const { setActiveSession, clearSessions, clearMessages, clearAllMessages } =
  aiChatSlice.actions;

export default aiChatSlice.reducer;
