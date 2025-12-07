/**
 * AI Assistant Service Interfaces
 *
 * Contracts for external services used by AI Assistant.
 * Implementations live in src/infrastructure/services/ai-assistant/
 */

import type {
  AIChatBotsResponseDTO,
  AIChatSessionsResponseDTO,
  AIChatMessagesResponseDTO,
} from '@/infrastructure/dto/ai-assistant';

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
}

/**
 * Request options for API calls
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | undefined>;
  timeout?: number;
}

/**
 * Parameters for fetching sessions via Rails proxy
 */
export interface FetchSessionsParams {
  agentBotId: number;
  limit?: number;
}

/**
 * Parameters for fetching messages via Rails proxy
 */
export interface FetchSessionMessagesParams {
  sessionId: string;
  limit?: number;
}

/**
 * Interface for Chatwoot API Service
 *
 * Handles communication with the Chatwoot Rails backend.
 */
export interface IChatwootApiService {
  /**
   * Make a GET request to Chatwoot API
   */
  get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>>;

  /**
   * Make a POST request to Chatwoot API
   */
  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>>;

  /**
   * Make a DELETE request to Chatwoot API
   */
  delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>>;

  /**
   * Fetch available AI bots
   */
  fetchBots(): Promise<AIChatBotsResponseDTO>;

  /**
   * Fetch chat sessions for an agent bot
   */
  fetchSessions(params: FetchSessionsParams): Promise<AIChatSessionsResponseDTO>;

  /**
   * Fetch messages for a session
   */
  fetchSessionMessages(params: FetchSessionMessagesParams): Promise<AIChatMessagesResponseDTO>;
}

/**
 * Parameters for fetching store sessions
 */
export interface FetchStoreSessionsParams {
  storeId: number;
  userId: number;
  agentSystemId?: number;
  limit?: number;
}

/**
 * Parameters for fetching store messages
 */
export interface FetchStoreMessagesParams {
  storeId: number;
  userId: number;
  agentSystemId?: number;
  limit?: number;
}

/**
 * Parameters for streaming chat
 */
export interface ChatStreamParams {
  sessionId: string;
  message: string;
  storeId?: number;
  userId?: number;
}

/**
 * Interface for AI Chat API Service
 *
 * Handles communication with the Python AI backend.
 */
export interface IAIChatApiService {
  /**
   * Fetch chat sessions for a store
   */
  fetchStoreSessions(params: FetchStoreSessionsParams): Promise<AIChatSessionsResponseDTO>;

  /**
   * Fetch messages for a store
   */
  fetchStoreMessages(params: FetchStoreMessagesParams): Promise<AIChatMessagesResponseDTO>;

  /**
   * Start a streaming chat request
   */
  startChatStream(params: ChatStreamParams): Promise<Response>;
}
