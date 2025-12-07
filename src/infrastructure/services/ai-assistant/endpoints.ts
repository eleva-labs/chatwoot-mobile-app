/**
 * AI Assistant API Endpoints
 *
 * Centralized endpoint definitions for AI chat APIs.
 */

/**
 * Chatwoot Rails API endpoints (proxied)
 */
export const CHATWOOT_ENDPOINTS = {
  /** List available AI bots */
  BOTS: 'ai_chat/bots',

  /** List chat sessions */
  SESSIONS: 'ai_chat/sessions',

  /** Single chat session */
  SESSION: (sessionId: string) => `ai_chat/sessions/${sessionId}`,

  /** Messages for a chat session */
  SESSION_MESSAGES: (sessionId: string) => `ai_chat/sessions/${sessionId}/messages`,
} as const;

/**
 * Python AI Backend endpoints (direct)
 */
export const AI_BACKEND_ENDPOINTS = {
  /** Chat sessions for a store */
  STORE_SESSIONS: (storeId: number) => `/api/messaging/stores/${storeId}/sessions`,

  /** Chat sessions for an agent system */
  AGENT_SYSTEM_SESSIONS: (agentSystemId: number) =>
    `/api/messaging/agent-systems/${agentSystemId}/sessions`,

  /** Messages for a store */
  STORE_MESSAGES: (storeId: number) => `/api/messaging/stores/${storeId}/messages`,

  /** Streaming chat endpoint */
  CHAT_STREAM: '/api/chat/stream',
} as const;

/**
 * Build query string from parameters
 */
export function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}
