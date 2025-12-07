/**
 * AI Chat Session Repository Interface
 *
 * Contract for managing AI chat sessions (conversation threads).
 * NOT to be confused with App Session (user login session).
 *
 * Implementation lives in infrastructure/repositories/ai-assistant/
 */

import type { Result } from '@/domain/shared';
import type { AIChatSession } from '@/domain/interfaces/mappers/ai-assistant';
import type { AIChatSessionId } from '@/domain/value-objects/ai-assistant';

/**
 * Parameters for fetching chat sessions
 */
export interface FetchAIChatSessionsParams {
  /** Bot ID to fetch sessions for */
  agentBotId: number;

  /** Maximum number of sessions to fetch */
  limit?: number;

  /** Offset for pagination */
  offset?: number;
}

/**
 * Parameters for fetching messages from a session
 */
export interface FetchAIChatSessionMessagesParams {
  /** The chat session ID */
  chatSessionId: AIChatSessionId;

  /** Maximum number of messages to fetch */
  limit?: number;

  /** Offset for pagination */
  offset?: number;
}

/**
 * Parameters for creating a new chat session
 */
export interface CreateAIChatSessionParams {
  /** Bot ID to create session with */
  agentBotId: number;

  /** Optional initial message */
  initialMessage?: string;
}

/**
 * Repository interface for AI Chat Session operations
 */
export interface IAIChatSessionRepository {
  /**
   * Fetch chat sessions for a bot
   *
   * @param params - Fetch parameters
   * @returns Result containing array of sessions or error
   */
  fetchSessions(params: FetchAIChatSessionsParams): Promise<Result<AIChatSession[], Error>>;

  /**
   * Fetch messages for a specific chat session
   *
   * Returns raw message DTOs - use IMessageMapper to convert to UIMessage
   *
   * @param params - Fetch parameters
   * @returns Result containing array of message DTOs or error
   */
  fetchMessages(params: FetchAIChatSessionMessagesParams): Promise<Result<unknown[], Error>>;

  /**
   * Create a new chat session
   *
   * @param params - Creation parameters
   * @returns Result containing the new session or error
   */
  createSession(params: CreateAIChatSessionParams): Promise<Result<AIChatSession, Error>>;

  /**
   * Delete a chat session
   *
   * @param chatSessionId - The session ID to delete
   * @returns Result indicating success or error
   */
  deleteSession(chatSessionId: AIChatSessionId): Promise<Result<void, Error>>;

  /**
   * Get a single chat session by ID
   *
   * @param chatSessionId - The session ID to fetch
   * @returns Result containing the session or null if not found
   */
  getSession(chatSessionId: AIChatSessionId): Promise<Result<AIChatSession | null, Error>>;
}
