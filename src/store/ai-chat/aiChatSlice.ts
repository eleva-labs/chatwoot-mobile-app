import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { aiChatActions } from './aiChatActions';
import type {
  AIChatState,
  AIChatSession,
  AIChatMessage,
  SetActiveSessionPayload,
  ClearSessionsPayload,
} from './aiChatTypes';

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
  },
});

export const { setActiveSession, clearSessions, clearMessages, clearAllMessages } =
  aiChatSlice.actions;

export default aiChatSlice.reducer;
