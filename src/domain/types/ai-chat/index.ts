/**
 * AI Chat Domain Types
 *
 * Pure domain entities for AI chat functionality.
 * These types represent the core business concepts.
 */

/**
 * AI Chat Session Entity
 *
 * Represents a conversation session with an AI agent bot.
 */
export interface AIChatSession {
  /** Unique session identifier */
  chat_session_id: string;
  /** Last update timestamp (ISO 8601) */
  updated_at: string;
  /** Creation timestamp (ISO 8601) */
  created_at?: string;
  /** Agent bot ID this session belongs to */
  agent_bot_id?: number;
  /** Account ID (Chatwoot account) */
  account_id?: number;
}
