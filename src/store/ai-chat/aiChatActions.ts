/**
 * AI Chat Redux Actions
 *
 * Async thunks for AI chat operations. Rails-only — NO DI, NO Python backend.
 * Uses AIChatService static methods directly (matches app convention).
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { AIChatService } from './aiChatService';
import type { FetchSessionsPayload, FetchMessagesPayload, AIChatErrorPayload } from './aiChatTypes';
import type { AIChatSession, AIChatMessage } from './aiChatSchemas';

/**
 * Factory for AI chat thunks with consistent error handling.
 * Extracts AxiosError response data when available.
 */
const createAIChatThunk = <TResponse, TPayload = void>(
  type: string,
  handler: (payload: TPayload) => Promise<TResponse>,
) =>
  createAsyncThunk<TResponse, TPayload, { rejectValue: AIChatErrorPayload }>(
    type,
    async (payload, { rejectWithValue }) => {
      try {
        return await handler(payload);
      } catch (error) {
        if (error instanceof AxiosError && error.response) {
          return rejectWithValue({
            message:
              error.response.data?.message || error.response.data?.error || error.message,
            errors: error.response.data?.errors,
          });
        }
        return rejectWithValue({ message: (error as Error).message });
      }
    },
  );

export const aiChatActions = {
  fetchSessions: createAIChatThunk<
    { sessions: AIChatSession[]; key: string },
    FetchSessionsPayload
  >('aiChat/fetchSessions', async payload => {
    const response = await AIChatService.fetchSessions(payload);
    return { sessions: response.sessions, key: `agentBot_${payload.agentBotId}` };
  }),

  fetchMessages: createAIChatThunk<
    { messages: AIChatMessage[]; sessionId: string },
    FetchMessagesPayload
  >('aiChat/fetchMessages', async payload => {
    const response = await AIChatService.fetchSessionMessages(payload.sessionId, payload.limit);
    return { messages: response.messages, sessionId: payload.sessionId };
  }),

  createSession: createAIChatThunk<
    { session: AIChatSession; key: string },
    { agentBotId: number }
  >('aiChat/createSession', async payload => {
    // Session creation happens implicitly during first stream.
    // This thunk is kept for explicit creation if needed.
    const response = await AIChatService.fetchSessions({ agentBotId: payload.agentBotId, limit: 1 });
    const session = response.sessions[0];
    return { session, key: `agentBot_${payload.agentBotId}` };
  }),

  deleteSession: createAIChatThunk<
    { sessionId: string; key: string },
    { sessionId: string; agentBotId?: number }
  >('aiChat/deleteSession', async payload => {
    await AIChatService.deleteSession(payload.sessionId);
    const key =
      payload.agentBotId !== undefined ? `agentBot_${payload.agentBotId}` : 'default';
    return { sessionId: payload.sessionId, key };
  }),
};
