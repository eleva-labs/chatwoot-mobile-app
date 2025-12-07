/**
 * AI Chat Session Entity
 *
 * Domain entity representing an AI chat session (conversation thread).
 * NOT to be confused with App Session (user login session).
 */

import type { AIChatSessionId } from '@/domain/value-objects/ai-assistant';

/**
 * Domain entity representing an AI chat session (conversation thread)
 */
export interface AIChatSession {
  /** Unique identifier for this chat session */
  id: AIChatSessionId;

  /** The bot this session is associated with (optional - may not be provided by API) */
  agentBotId?: number;

  /** Account this session belongs to (optional - may not be provided by API) */
  accountId?: number;

  /** When the session was created */
  createdAt: Date;

  /** When the session was last updated */
  updatedAt: Date;

  /** Optional title/summary for the session */
  title?: string;

  /** Number of messages in the session */
  messageCount?: number;
}
