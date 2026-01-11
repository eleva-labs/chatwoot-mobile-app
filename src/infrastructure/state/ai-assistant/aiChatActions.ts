import { createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { resolve } from '@/dependency-injection';
import { AI_ASSISTANT_TOKENS } from '@/dependency-injection/tokens';
import type { IAIChatApiService } from '@/domain/interfaces/services/ai-assistant';
import { getDefaultAIAssistantDependencies } from '@/presentation/factory/ai-assistant';
import { createAIChatSessionId } from '@/domain/value-objects/ai-assistant';
import type {
  FetchSessionsPayload,
  FetchMessagesPayload,
  AIChatSessionsAPIResponse,
  AIChatMessagesAPIResponse,
} from './aiChatTypes';
import type { ApiErrorResponse } from '@/store/conversation/conversationTypes';

// Factory getter for use cases
const getDependencies = () => getDefaultAIAssistantDependencies();

// Keep Python backend service access for now (use cases don't cover it yet)
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
 * AI Chat Redux Actions
 * Refactored to use AIAssistantFactory and Use Cases for Clean Architecture
 */
export const aiChatActions = {
  /**
   * Fetch AI chat sessions
   * Supports both Rails proxy (via Use Case) and Python backend (direct service)
   */
  fetchSessions: createAsyncThunk<
    { sessions: AIChatSessionsAPIResponse['sessions']; key: string },
    FetchSessionsPayload
  >('aiChat/fetchSessions', async (payload, { rejectWithValue }) => {
    console.log('[AI Chat Actions] ===== FETCH SESSIONS (via Use Case) =====');
    console.log('[AI Chat Actions] Payload details:', {
      usePythonBackend: payload.usePythonBackend,
      storeId: payload.storeId,
      userId: payload.userId,
      agentBotId: payload.agentBotId,
      limit: payload.limit,
    });

    try {
      let sessions: AIChatSessionsAPIResponse['sessions'] = [];

      if (
        payload.usePythonBackend &&
        payload.storeId !== undefined &&
        payload.userId !== undefined
      ) {
        // Python backend - keep existing service call (use cases don't cover this yet)
        console.log('[AI Chat Actions] Using Python backend (direct service)');
        if (!payload.aiBackendUrl) {
          throw new Error('AI backend URL is required for Python backend');
        }
        const aiChatService = getAIChatApiService();
        const response = await aiChatService.fetchStoreSessions({
          storeId: payload.storeId,
          agentSystemId: payload.agentSystemId,
          userId: payload.userId,
          limit: payload.limit || 25,
        });
        sessions = response.sessions;
        console.log('[AI Chat Actions] Python sessions count:', sessions?.length || 0);
      } else if (payload.agentBotId !== undefined) {
        // Rails proxy - USE THE USE CASE
        console.log('[AI Chat Actions] Using Rails proxy (via Use Case)');
        const { fetchSessionsUseCase } = getDependencies();

        const result = await fetchSessionsUseCase.execute({
          agentBotId: payload.agentBotId,
          limit: payload.limit || 25,
          offset: payload.offset,
        });

        if (result.isFailure) {
          const error = result.getError();
          console.error('[AI Chat Actions] Use case failed:', error.message);
          return rejectWithValue({ message: error.message });
        }

        const domainSessions = result.getValue();

        // Map domain entities to DTOs for Redux state
        sessions = domainSessions.map(session => ({
          chat_session_id: session.id.toString(),
          agent_bot_id: session.agentBotId,
          account_id: session.accountId,
          created_at: session.createdAt.toISOString(),
          updated_at: session.updatedAt.toISOString(),
        }));

        console.log('[AI Chat Actions] Sessions fetched via use case:', sessions.length);
      } else {
        throw new Error('Either agentBotId or storeId with userId required');
      }

      const key = getSessionsKey(payload);
      console.log('[AI Chat Actions] Sessions key:', key);
      return { sessions, key };
    } catch (error) {
      console.error('[AI Chat Actions] Error:', (error as Error)?.message);
      const axiosError = error as AxiosError<ApiErrorResponse>;
      if (axiosError.response) {
        return rejectWithValue(axiosError.response.data);
      }
      return rejectWithValue({ message: (error as Error).message });
    }
  }),

  /**
   * Fetch messages from a specific AI chat session
   * Supports both Rails proxy (via Use Case) and Python backend (direct service)
   */
  fetchMessages: createAsyncThunk<
    { messages: AIChatMessagesAPIResponse['messages']; sessionId: string },
    FetchMessagesPayload
  >('aiChat/fetchMessages', async (payload, { rejectWithValue }) => {
    console.log('[AI Chat Actions] ===== FETCH MESSAGES (via Use Case) =====');

    try {
      let messages: AIChatMessagesAPIResponse['messages'] = [];

      if (
        payload.usePythonBackend &&
        payload.storeId !== undefined &&
        payload.userId !== undefined
      ) {
        // Python backend - keep existing service call
        console.log('[AI Chat Actions] Using Python backend (direct service)');
        const aiChatService = getAIChatApiService();
        const response = await aiChatService.fetchStoreMessages({
          storeId: payload.storeId,
          agentSystemId: payload.agentSystemId,
          userId: payload.userId,
          limit: payload.limit || 100,
        });
        messages = response.messages;
      } else if (payload.sessionId) {
        // Rails proxy - USE THE USE CASE
        console.log('[AI Chat Actions] Loading messages via use case');
        const { loadMessagesUseCase } = getDependencies();

        const result = await loadMessagesUseCase.execute({
          chatSessionId: createAIChatSessionId(payload.sessionId),
          limit: payload.limit || 100,
          offset: payload.offset,
        });

        if (result.isFailure) {
          const error = result.getError();
          console.error('[AI Chat Actions] Use case failed:', error.message);
          return rejectWithValue({ message: error.message });
        }

        const uiMessages = result.getValue();

        // Map UIMessages to DTO format for Redux
        messages = uiMessages.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant' | 'system',
          content:
            msg.parts
              ?.filter(
                (p): p is { type: 'text'; text: string } =>
                  'type' in p && p.type === 'text' && 'text' in p,
              )
              .map(p => p.text)
              .join('') || '',
          timestamp: new Date().toISOString(),
        }));

        console.log('[AI Chat Actions] Messages loaded via use case:', messages.length);
      } else {
        throw new Error('Session ID or Python backend params required');
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

  /**
   * Create a new AI chat session
   */
  createSession: createAsyncThunk<
    { session: AIChatSessionsAPIResponse['sessions'][0]; key: string },
    { agentBotId: number; initialMessage?: string }
  >('aiChat/createSession', async (payload, { rejectWithValue }) => {
    console.log('[AI Chat Actions] ===== CREATE SESSION (via Use Case) =====');

    try {
      const { createSessionUseCase } = getDependencies();

      const result = await createSessionUseCase.execute({
        agentBotId: payload.agentBotId,
        initialMessage: payload.initialMessage,
      });

      if (result.isFailure) {
        return rejectWithValue({ message: result.getError().message });
      }

      const session = result.getValue();

      return {
        session: {
          chat_session_id: session.id.toString(),
          agent_bot_id: session.agentBotId,
          account_id: session.accountId,
          created_at: session.createdAt.toISOString(),
          updated_at: session.updatedAt.toISOString(),
        },
        key: `agentBot_${payload.agentBotId}`,
      };
    } catch (error) {
      return rejectWithValue({ message: (error as Error).message });
    }
  }),

  /**
   * Delete an AI chat session
   */
  deleteSession: createAsyncThunk<
    { sessionId: string; key: string },
    { sessionId: string; agentBotId?: number; storeId?: number }
  >('aiChat/deleteSession', async (payload, { rejectWithValue }) => {
    console.log('[AI Chat Actions] ===== DELETE SESSION (via Use Case) =====');

    try {
      const { deleteSessionUseCase } = getDependencies();

      const result = await deleteSessionUseCase.execute({
        chatSessionId: createAIChatSessionId(payload.sessionId),
      });

      if (result.isFailure) {
        return rejectWithValue({ message: result.getError().message });
      }

      // Determine the key for the session list
      let key = 'default';
      if (payload.agentBotId !== undefined) {
        key = `agentBot_${payload.agentBotId}`;
      } else if (payload.storeId !== undefined) {
        key = `store_${payload.storeId}`;
      }

      return { sessionId: payload.sessionId, key };
    } catch (error) {
      return rejectWithValue({ message: (error as Error).message });
    }
  }),
};
