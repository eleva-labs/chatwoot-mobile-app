/**
 * AI Chat Session DTO
 *
 * Backend representation of a chat session.
 * Uses snake_case to match backend API.
 */

export interface AIChatSessionDTO {
  chat_session_id: string;
  updated_at: string;
  created_at?: string;
  agent_bot_id?: number;
  account_id?: number;
}

/**
 * Response structure for fetching sessions
 */
export interface AIChatSessionsResponseDTO {
  sessions: AIChatSessionDTO[];
}
