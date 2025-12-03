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

export interface FetchStoreMessagesOptions {
  storeId: number;
  agentSystemId?: number;
  userId: number;
  limit?: number;
  aiBackendUrl: string;
}

export interface FetchStoreSessionsOptions {
  storeId: number;
  agentSystemId?: number;
  userId: number;
  limit?: number;
  aiBackendUrl: string;
}
