/**
 * AI Chat Service
 *
 * Static class for all AI chat API operations. Rails-only — NO Python backend code.
 * Follows the ConversationService pattern: static methods using apiService.
 *
 * apiService handles auth headers (DeviseTokenAuth: access-token, uid, client)
 * and URL construction (baseURL + /api/v1/accounts/{accountId}/) automatically
 * via its request interceptor.
 *
 * The getAuthHeaders() and getStreamEndpoint() methods are for the SSE streaming
 * transport in useAIChat, which uses expoFetch directly (not apiService).
 */

import { apiService } from '@/services/APIService';
import { getStore } from '@/store/storeAccessor';
import type {
  AIChatBotsResponse,
  AIChatSessionsResponse,
  AIChatMessagesResponse,
} from './aiChatSchemas';

export class AIChatService {
  // === Bots ===

  /**
   * Fetch available AI bots for the current account
   */
  static async fetchBots(): Promise<AIChatBotsResponse> {
    const response = await apiService.get<AIChatBotsResponse>('ai_chat/bots');
    return response.data;
  }

  // === Sessions ===

  /**
   * Fetch chat sessions for a specific bot
   */
  static async fetchSessions(params: {
    agentBotId: number;
    limit?: number;
    offset?: number;
  }): Promise<AIChatSessionsResponse> {
    const response = await apiService.get<AIChatSessionsResponse>('ai_chat/sessions', {
      params: {
        agent_bot_id: params.agentBotId,
        limit: params.limit ?? 25,
        offset: params.offset,
      },
    });
    return response.data;
  }

  /**
   * Fetch messages for a specific session
   */
  static async fetchSessionMessages(
    sessionId: string,
    limit = 100,
  ): Promise<AIChatMessagesResponse> {
    const response = await apiService.get<AIChatMessagesResponse>(
      `ai_chat/sessions/${sessionId}/messages`,
      { params: { limit } },
    );
    return response.data;
  }

  /**
   * Delete a chat session
   */
  static async deleteSession(sessionId: string): Promise<unknown> {
    const response = await apiService.delete(`ai_chat/sessions/${sessionId}`);
    return response.data;
  }

  // === Streaming URL (consumed by useAIChat's DefaultChatTransport) ===

  /**
   * Build the streaming endpoint URL for the SSE transport.
   * Reads installationUrl and accountId from Redux state (non-reactive).
   */
  static getStreamEndpoint(): string {
    const state = getStore().getState();
    const installationUrl = state.settings?.installationUrl || '';
    const accountId = state.auth?.user?.account_id;
    return `${installationUrl}/api/v1/accounts/${accountId}/ai_chat/stream`;
  }

  // === Auth headers for streaming transport (DeviseTokenAuth format) ===

  /**
   * Get raw auth headers for the SSE transport fetch callback.
   *
   * NOTE: The apiService (used by fetchBots/fetchSessions/etc.) handles its own auth
   * via request interceptors. This method is ONLY needed by useAIChat's transport
   * headers callback, which uses expoFetch directly.
   *
   * Returns DeviseTokenAuth headers: access-token, uid, client.
   */
  static getAuthHeaders(): Record<string, string> {
    const state = getStore().getState();
    const headers = state.auth?.headers;

    if (!headers) {
      return {};
    }

    return {
      'access-token': headers['access-token'] ?? '',
      uid: headers.uid ?? '',
      client: headers.client ?? '',
    };
  }
}
