import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { resolve } from '@/dependency-injection';
import { AI_ASSISTANT_TOKENS } from '@/dependency-injection/tokens';
import type {
  IChatwootApiService,
  IAIChatApiService,
} from '@/domain/interfaces/services/ai-assistant';
import type {
  FetchSessionsPayload,
  FetchMessagesPayload,
  AIChatSessionsAPIResponse,
  AIChatMessagesAPIResponse,
} from './aiChatTypes';
import type { ApiErrorResponse } from '@/store/conversation/conversationTypes';

// Resolve services from DI container
const getChatwootApiService = () =>
  resolve<IChatwootApiService>(AI_ASSISTANT_TOKENS.IChatwootApiService);
const getAIChatApiService = () => resolve<IAIChatApiService>(AI_ASSISTANT_TOKENS.IAIChatApiService);

/**
 * Generate a key for storing sessions in Redux
 * Format: "agentBot_{id}" for Rails or "store_{id}" for Python backend
 */
function getSessionsKey(payload: FetchSessionsPayload): string {
  if (payload.usePythonBackend && payload.storeId !== undefined) {
    return `store_${payload.storeId}`;
  }
  if (payload.agentBotId !== undefined) {
    return `agentBot_${payload.agentBotId}`;
  }
  return 'default';
}

/**
 * Fetch AI chat sessions
 * Supports both Rails proxy and Python backend
 */
export const aiChatActions = {
  fetchSessions: createAsyncThunk<
    { sessions: AIChatSessionsAPIResponse['sessions']; key: string },
    FetchSessionsPayload
  >('aiChat/fetchSessions', async (payload, { rejectWithValue }) => {
    console.log('[AI Chat Actions] ===== FETCH SESSIONS ACTION START =====');
    console.log('[AI Chat Actions] Full payload:', JSON.stringify(payload, null, 2));
    console.log('[AI Chat Actions] Payload details:', {
      usePythonBackend: payload.usePythonBackend,
      storeId: payload.storeId,
      userId: payload.userId,
      agentBotId: payload.agentBotId,
      agentSystemId: payload.agentSystemId,
      aiBackendUrl: payload.aiBackendUrl,
      limit: payload.limit,
    });

    try {
      let sessions: AIChatSessionsAPIResponse['sessions'] = [];

      if (
        payload.usePythonBackend &&
        payload.storeId !== undefined &&
        payload.userId !== undefined
      ) {
        // Use Python backend
        console.log('[AI Chat Actions] ===== USING PYTHON BACKEND =====');
        console.log('[AI Chat Actions] Validating required parameters...');

        if (!payload.aiBackendUrl) {
          const error = 'AI backend URL is required for Python backend';
          console.error('[AI Chat Actions]', error);
          throw new Error(error);
        }

        console.log(
          '[AI Chat Actions] All required parameters present, calling AIChatApiService.fetchStoreSessions...',
        );
        const aiChatService = getAIChatApiService();
        const response = await aiChatService.fetchStoreSessions({
          storeId: payload.storeId,
          agentSystemId: payload.agentSystemId,
          userId: payload.userId,
          limit: payload.limit || 25,
        });

        console.log('[AI Chat Actions] ===== PYTHON BACKEND RESPONSE RECEIVED =====');
        console.log('[AI Chat Actions] Response object:', JSON.stringify(response, null, 2));
        sessions = response.sessions;
        console.log('[AI Chat Actions] Sessions array:', sessions);
        console.log('[AI Chat Actions] Sessions count:', sessions?.length || 0);
      } else if (payload.agentBotId !== undefined) {
        // Use Rails proxy
        console.log('[AI Chat Actions] ===== USING RAILS PROXY =====');
        console.log('[AI Chat Actions] Calling ChatwootApiService.fetchSessions...');
        const chatwootService = getChatwootApiService();
        const response = await chatwootService.fetchSessions({
          agentBotId: payload.agentBotId,
          limit: payload.limit || 25,
        });

        console.log('[AI Chat Actions] ===== RAILS PROXY RESPONSE RECEIVED =====');
        sessions = response.sessions;
        console.log('[AI Chat Actions] Sessions count:', sessions?.length || 0);
      } else {
        const errorMsg =
          'Either agentBotId (for Rails) or storeId with userId (for Python backend) is required';
        console.error('[AI Chat Actions]', errorMsg);
        throw new Error(errorMsg);
      }

      const key = getSessionsKey(payload);
      console.log('[AI Chat Actions] Sessions key:', key);
      console.log('[AI Chat Actions] ===== FETCH SESSIONS ACTION END (SUCCESS) =====');
      return { sessions, key };
    } catch (error) {
      console.error('[AI Chat Actions] ===== FETCH SESSIONS ACTION ERROR =====');
      console.error('[AI Chat Actions] Error type:', error?.constructor?.name);
      console.error('[AI Chat Actions] Error message:', error?.message);
      console.error('[AI Chat Actions] Error stack:', error?.stack);
      console.error(
        '[AI Chat Actions] Full error:',
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      );

      const axiosError = error as AxiosError<ApiErrorResponse>;
      if (axiosError.response) {
        console.error(
          '[AI Chat Actions] Axios error response:',
          JSON.stringify(axiosError.response.data, null, 2),
        );
        return rejectWithValue(axiosError.response.data);
      }
      const errorMessage = (error as Error).message;
      console.error('[AI Chat Actions] Rejecting with value:', errorMessage);
      return rejectWithValue({ message: errorMessage });
    }
  }),

  /**
   * Fetch messages from a specific AI chat session
   * Supports both Rails proxy and Python backend
   */
  fetchMessages: createAsyncThunk<
    { messages: AIChatMessagesAPIResponse['messages']; sessionId: string },
    FetchMessagesPayload
  >('aiChat/fetchMessages', async (payload, { rejectWithValue }) => {
    try {
      let messages: AIChatMessagesAPIResponse['messages'] = [];

      if (
        payload.usePythonBackend &&
        payload.storeId !== undefined &&
        payload.userId !== undefined
      ) {
        // Use Python backend - fetch all messages from store
        const aiChatService = getAIChatApiService();
        const response = await aiChatService.fetchStoreMessages({
          storeId: payload.storeId,
          agentSystemId: payload.agentSystemId,
          userId: payload.userId,
          limit: payload.limit || 100,
        });
        messages = response.messages;
      } else if (payload.sessionId) {
        // Use Rails proxy - fetch messages from specific session
        const chatwootService = getChatwootApiService();
        const response = await chatwootService.fetchSessionMessages({
          sessionId: payload.sessionId,
          limit: payload.limit || 100,
        });
        messages = response.messages;
      } else {
        throw new Error(
          'Session ID is required for Rails proxy, or storeId with userId for Python backend',
        );
      }

      return { messages, sessionId: payload.sessionId };
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      if (axiosError.response) {
        return rejectWithValue(axiosError.response.data);
      }
      return rejectWithValue({ message: (error as Error).message });
    }
  }),
};
