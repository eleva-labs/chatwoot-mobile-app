import { apiService } from '@/services/APIService';
import { fetch as expoFetch } from 'expo/fetch';
import { getStore } from '@/store/storeAccessor';
import type { AxiosRequestConfig } from 'axios';

import {
  AIChatBotsResponse,
  AIChatSessionsResponse,
  AIChatMessagesResponse,
  FetchSessionsOptions,
  FetchMessagesOptions,
  FetchStoreMessagesOptions,
  FetchStoreSessionsOptions,
} from '@/domain/ai/types';
import { AIChatServiceContract } from '@/domain/interfaces/ai/IAIChatService';

function getAuthHeaders(): Record<string, string> {
  console.log('[AIChat Service] Getting auth headers from Redux store...');
  const store = getStore();
  const state = store.getState();
  const headers = state.auth.headers;

  console.log('[AIChat Service] Raw auth headers from state:', JSON.stringify(headers, null, 2));

  if (!headers) {
    console.warn('[AIChat Service] No auth headers found in Redux state');
    return {};
  }

  const authHeaders = {
    'access-token': headers['access-token'],
    uid: headers.uid,
    client: headers.client,
  };

  console.log('[AIChat Service] Extracted auth headers:', JSON.stringify(authHeaders, null, 2));
  return authHeaders;
}

function getBaseURL(): string {
  const store = getStore();
  const state = store.getState();
  const url = state.settings?.installationUrl || '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function getAccountId(): number | null {
  const store = getStore();
  const state = store.getState();
  return state.auth.user?.account_id || null;
}

function formatError(errorText: string, defaultMessage: string) {
  let errorMessage = defaultMessage;
  try {
    const errorData = JSON.parse(errorText);
    errorMessage = errorData.message || errorData.error || errorData.detail || errorMessage;
  } catch {
    errorMessage = errorText || errorMessage;
  }
  return errorMessage;
}

export const AIChatService: AIChatServiceContract = {
  async fetchBots(): Promise<AIChatBotsResponse> {
    const accountId = getAccountId();

    if (!accountId) {
      throw new Error('Account ID is required to fetch AI chat bots');
    }

    const response = await apiService.get<AIChatBotsResponse>(
      'ai_chat/bots',
      {} as AxiosRequestConfig,
    );
    return response.data;
  },

  async fetchSessions(options: FetchSessionsOptions): Promise<AIChatSessionsResponse> {
    const { agentBotId, limit = 25 } = options;
    const accountId = getAccountId();

    if (!accountId) {
      throw new Error('Account ID is required to fetch AI chat sessions');
    }

    const params: Record<string, string> = {
      agent_bot_id: String(agentBotId),
      limit: String(limit),
    };

    const response = await apiService.get<AIChatSessionsResponse>('ai_chat/sessions', {
      params,
    } as AxiosRequestConfig);

    return response.data;
  },

  async fetchSessionMessages(options: FetchMessagesOptions): Promise<AIChatMessagesResponse> {
    const { sessionId, limit = 100 } = options;
    const accountId = getAccountId();

    if (!accountId) {
      throw new Error('Account ID is required to fetch AI chat messages');
    }

    const params: Record<string, string> = {
      limit: String(limit),
    };

    const response = await apiService.get<AIChatMessagesResponse>(
      `ai_chat/sessions/${sessionId}/messages`,
      {
        params,
      } as AxiosRequestConfig,
    );

    return response.data;
  },

  async fetchStoreMessages(options: FetchStoreMessagesOptions): Promise<AIChatMessagesResponse> {
    const { storeId, agentSystemId, userId, limit = 100, aiBackendUrl } = options;
    const queryParams = new URLSearchParams({
      user_id: String(userId),
      id_type: 'external',
      limit: String(limit),
    });

    if (agentSystemId) {
      queryParams.append('agent_system_id', String(agentSystemId));
    }

    const url = `${aiBackendUrl}/api/messaging/stores/${storeId}/messages?${queryParams.toString()}`;
    const headers = getAuthHeaders();

    console.log('[AIChat Service] Fetching store messages from:', url);
    console.log('[AIChat Service] Request headers:', {
      ...headers,
      'Content-Type': 'application/json',
    });

    const response = await expoFetch(url, {
      method: 'GET',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });

    console.log('[AIChat Service] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AIChat Service] Error response body:', errorText);
      const errorMessage = formatError(errorText, 'Failed to fetch store messages');
      throw new Error(`Chatwoot API error: ${errorMessage} (Status: ${response.status})`);
    }

    const data = await response.json();
    console.log('[AIChat Service] Store messages response:', data);

    return {
      messages: data.messages || data.data || [],
    };
  },

  async fetchStoreSessions(options: FetchStoreSessionsOptions): Promise<AIChatSessionsResponse> {
    console.log(
      '[AIChat Service] fetchStoreSessions called with options:',
      JSON.stringify(options, null, 2),
    );
    const { storeId, agentSystemId, userId, limit = 25, aiBackendUrl } = options;

    const queryParams = new URLSearchParams({
      user_id: String(userId),
      id_type: 'external',
      limit: String(limit),
    });

    if (agentSystemId) {
      queryParams.append('agent_system_id', String(agentSystemId));
    }

    let url: string;
    if (agentSystemId) {
      url = `${aiBackendUrl}/api/messaging/agent-systems/${agentSystemId}/sessions?${queryParams.toString()}`;
      console.log('[AIChat Service] Using agent-systems endpoint since agentSystemId is provided');
    } else {
      url = `${aiBackendUrl}/api/messaging/stores/${storeId}/sessions?${queryParams.toString()}`;
      console.log('[AIChat Service] Using stores endpoint (no agentSystemId provided)');
    }

    const headers = getAuthHeaders();

    console.log('[AIChat Service] ===== FETCH STORE SESSIONS START =====');
    console.log('[AIChat Service] URL:', url);
    console.log('[AIChat Service] Query params:', queryParams.toString());
    console.log('[AIChat Service] Store ID:', storeId);
    console.log('[AIChat Service] User ID:', userId);
    console.log('[AIChat Service] Agent System ID:', agentSystemId);
    console.log('[AIChat Service] Limit:', limit);
    console.log('[AIChat Service] Auth headers from Redux:', JSON.stringify(headers, null, 2));
    console.log(
      '[AIChat Service] Full request headers:',
      JSON.stringify({ ...headers, 'Content-Type': 'application/json' }, null, 2),
    );

    try {
      console.log('[AIChat Service] About to call expoFetch...');
      const response = await expoFetch(url, {
        method: 'GET',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      });

      console.log('[AIChat Service] ===== FETCH RESPONSE RECEIVED =====');
      console.log('[AIChat Service] Response status:', response.status);
      console.log('[AIChat Service] Response statusText:', response.statusText);
      console.log('[AIChat Service] Response ok:', response.ok);
      console.log(
        '[AIChat Service] Response headers:',
        JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2),
      );

      if (!response.ok) {
        console.log('[AIChat Service] ===== ERROR RESPONSE =====');
        let errorText = '';
        try {
          errorText = await response.text();
          console.log('[AIChat Service] Error response body (raw):', errorText);
          console.log('[AIChat Service] Error response body length:', errorText.length);
        } catch (textError) {
          console.error('[AIChat Service] Failed to read error response text:', textError);
          errorText = `Failed to read error response: ${textError}`;
        }

        const errorMessage = formatError(errorText, 'Failed to fetch store sessions');
        const fullError = `Chatwoot API error: ${errorMessage} (Status: ${response.status})`;
        console.error('[AIChat Service] Throwing error:', fullError);
        throw new Error(fullError);
      }

      console.log('[AIChat Service] ===== SUCCESS RESPONSE =====');
      let data;
      try {
        const responseText = await response.text();
        console.log('[AIChat Service] Response body (raw):', responseText);
        console.log('[AIChat Service] Response body length:', responseText.length);
        data = JSON.parse(responseText);
        console.log('[AIChat Service] Parsed response data:', JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error('[AIChat Service] Failed to parse response JSON:', parseError);
        throw new Error(`Failed to parse response: ${parseError}`);
      }

      const sessions = data.sessions || data.data || [];
      console.log('[AIChat Service] Transformed sessions count:', sessions.length);
      console.log('[AIChat Service] ===== FETCH STORE SESSIONS END (SUCCESS) =====');
      return {
        sessions,
      };
    } catch (error) {
      console.error('[AIChat Service] ===== FETCH STORE SESSIONS ERROR =====');
      const errorObj = error as Error | undefined;
      console.error('[AIChat Service] Error type:', errorObj?.constructor?.name);
      console.error('[AIChat Service] Error message:', errorObj?.message);
      console.error('[AIChat Service] Error stack:', errorObj?.stack);
      console.error(
        '[AIChat Service] Full error object:',
        JSON.stringify(error, Object.getOwnPropertyNames(error as object), 2),
      );

      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Unknown error fetching store sessions: ${error}`);
    }
  },
};
