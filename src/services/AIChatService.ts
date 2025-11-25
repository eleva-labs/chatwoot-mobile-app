import { apiService } from '@/services/APIService';
import { fetch as expoFetch } from 'expo/fetch';
import { getStore } from '@/store/storeAccessor';
import type { AxiosRequestConfig } from 'axios';

/**
 * AI Chat Bot from backend
 */
export interface AIChatBot {
  id: number;
  name: string;
  avatar_url?: string;
  description?: string;
}

/**
 * AI Chat Session from backend
 */
export interface AIChatSession {
  chat_session_id: string;
  updated_at: string;
  created_at?: string;
  agent_bot_id?: number;
  account_id?: number;
}

/**
 * AI Chat Message from backend
 */
export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  chat_session_id?: string;
}

/**
 * Response for fetching bots
 */
export interface AIChatBotsResponse {
  bots: AIChatBot[];
}

/**
 * Response for fetching sessions
 */
export interface AIChatSessionsResponse {
  sessions: AIChatSession[];
}

/**
 * Response for fetching messages
 */
export interface AIChatMessagesResponse {
  messages: AIChatMessage[];
}

/**
 * Options for fetching sessions
 */
export interface FetchSessionsOptions {
  agentBotId: number;
  limit?: number;
}

/**
 * Options for fetching messages
 */
export interface FetchMessagesOptions {
  sessionId: string;
  limit?: number;
}

/**
 * Service for AI Chat operations
 * Handles both Rails proxy endpoints and Python backend direct calls
 */
export class AIChatService {
  /**
   * Get authentication headers from Redux store
   */
  private static getAuthHeaders(): Record<string, string> {
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

  /**
   * Get base URL from Redux store
   */
  private static getBaseURL(): string {
    const store = getStore();
    const state = store.getState();
    const url = state.settings?.installationUrl || '';
    // Remove trailing slash to avoid double slashes in URLs
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }

  /**
   * Get account ID from Redux store
   */
  private static getAccountId(): number | null {
    const store = getStore();
    const state = store.getState();
    return state.auth.user?.account_id || null;
  }

  /**
   * Fetch available AI chat bots
   * Uses Rails proxy endpoint: GET /api/v1/accounts/:account_id/ai_chat/bots
   * Following Chatwoot's pattern - first bot is auto-selected if none is provided
   *
   * @returns List of available AI chat bots
   */
  static async fetchBots(): Promise<AIChatBotsResponse> {
    const accountId = this.getAccountId();

    if (!accountId) {
      throw new Error('Account ID is required to fetch AI chat bots');
    }

    const response = await apiService.get<AIChatBotsResponse>('ai_chat/bots', {} as AxiosRequestConfig);

    return response.data;
  }

  /**
   * Fetch available AI chat sessions for a given agent bot
   * Uses Rails proxy endpoint: GET /api/v1/accounts/:account_id/ai_chat/sessions
   *
   * @param options - Options including agentBotId and optional limit
   * @returns List of chat sessions
   */
  static async fetchSessions(
    options: FetchSessionsOptions,
  ): Promise<AIChatSessionsResponse> {
    const { agentBotId, limit = 25 } = options;
    const accountId = this.getAccountId();

    if (!accountId) {
      throw new Error('Account ID is required to fetch AI chat sessions');
    }

    const params: Record<string, string> = {
      agent_bot_id: String(agentBotId),
      limit: String(limit),
    };

    const response = await apiService.get<AIChatSessionsResponse>(
      'ai_chat/sessions',
      {
        params,
      } as AxiosRequestConfig,
    );

    return response.data;
  }

  /**
   * Fetch messages from a specific AI chat session
   * Uses Rails proxy endpoint: GET /api/v1/accounts/:account_id/ai_chat/sessions/:session_id/messages
   *
   * @param options - Options including sessionId and optional limit
   * @returns List of messages from the session
   */
  static async fetchSessionMessages(
    options: FetchMessagesOptions,
  ): Promise<AIChatMessagesResponse> {
    const { sessionId, limit = 100 } = options;
    const accountId = this.getAccountId();

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
  }

  /**
   * Fetch messages directly from Python backend store
   * Uses Python backend endpoint: GET /api/messaging/stores/:store_id/messages
   *
   * @param options - Options including storeId, agentSystemId, userId, and optional limit
   * @returns List of messages from the store
   */
  static async fetchStoreMessages(options: {
    storeId: number;
    agentSystemId?: number;
    userId: number;
    limit?: number;
    aiBackendUrl: string;
  }): Promise<AIChatMessagesResponse> {
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
    const headers = this.getAuthHeaders();

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
      let errorMessage = 'Failed to fetch store messages';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorData.detail || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(`Chatwoot API error: ${errorMessage} (Status: ${response.status})`);
    }

    const data = await response.json();
    console.log('[AIChat Service] Store messages response:', data);

    // Transform Python backend response to our format
    // Assuming the backend returns: { messages: [...] }
    return {
      messages: data.messages || data.data || [],
    };
  }

  /**
   * Fetch all sessions from Python backend store
   * Uses Python backend endpoint: GET /api/messaging/stores/:store_id/sessions
   *
   * @param options - Options including storeId, agentSystemId, userId, and optional limit
   * @returns List of chat sessions from the store
   */
  static async fetchStoreSessions(options: {
    storeId: number;
    agentSystemId?: number;
    userId: number;
    limit?: number;
    aiBackendUrl: string;
  }): Promise<AIChatSessionsResponse> {
    console.log('[AIChat Service] fetchStoreSessions called with options:', JSON.stringify(options, null, 2));

    const { storeId, agentSystemId, userId, limit = 25, aiBackendUrl } = options;

    const queryParams = new URLSearchParams({
      user_id: String(userId),
      id_type: 'external',
      limit: String(limit),
    });

    if (agentSystemId) {
      queryParams.append('agent_system_id', String(agentSystemId));
    }

    // Try different possible endpoint paths for Python backend
    // Option 1: /api/messaging/stores/:store_id/sessions (current attempt)
    // Option 2: /api/messaging/agent-systems/:agent_system_id/sessions (if agentSystemId is provided)
    // Option 3: /api/v1/messaging/stores/:store_id/sessions (with version prefix)
    let url: string;
    if (agentSystemId) {
      // Try agent-systems endpoint if we have agentSystemId
      url = `${aiBackendUrl}/api/messaging/agent-systems/${agentSystemId}/sessions?${queryParams.toString()}`;
      console.log('[AIChat Service] Using agent-systems endpoint since agentSystemId is provided');
    } else {
      // Default to stores endpoint
      url = `${aiBackendUrl}/api/messaging/stores/${storeId}/sessions?${queryParams.toString()}`;
      console.log('[AIChat Service] Using stores endpoint (no agentSystemId provided)');
    }
    const headers = this.getAuthHeaders();

    console.log('[AIChat Service] ===== FETCH STORE SESSIONS START =====');
    console.log('[AIChat Service] URL:', url);
    console.log('[AIChat Service] Query params:', queryParams.toString());
    console.log('[AIChat Service] Store ID:', storeId);
    console.log('[AIChat Service] User ID:', userId);
    console.log('[AIChat Service] Agent System ID:', agentSystemId);
    console.log('[AIChat Service] Limit:', limit);
    console.log('[AIChat Service] Auth headers from Redux:', JSON.stringify(headers, null, 2));
    console.log('[AIChat Service] Full request headers:', JSON.stringify({
      ...headers,
      'Content-Type': 'application/json',
    }, null, 2));

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
      console.log('[AIChat Service] Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

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

        let errorMessage = 'Failed to fetch store sessions';
        try {
          if (errorText) {
            const errorData = JSON.parse(errorText);
            console.log('[AIChat Service] Parsed error data:', JSON.stringify(errorData, null, 2));
            errorMessage = errorData.message || errorData.error || errorData.detail || errorMessage;
          }
        } catch (parseError) {
          console.log('[AIChat Service] Error response is not JSON, using raw text');
          errorMessage = errorText || errorMessage;
        }

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

      // Transform Python backend response to our format
      const sessions = data.sessions || data.data || [];
      console.log('[AIChat Service] Transformed sessions count:', sessions.length);
      console.log('[AIChat Service] ===== FETCH STORE SESSIONS END (SUCCESS) =====');
      return {
        sessions,
      };
    } catch (error) {
      console.error('[AIChat Service] ===== FETCH STORE SESSIONS ERROR =====');
      console.error('[AIChat Service] Error type:', error?.constructor?.name);
      console.error('[AIChat Service] Error message:', error?.message);
      console.error('[AIChat Service] Error stack:', error?.stack);
      console.error('[AIChat Service] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      // Re-throw with more context
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Unknown error fetching store sessions: ${error}`);
    }
  }
}

