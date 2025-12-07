/**
 * AI Bot Entity
 *
 * Domain entity representing an AI bot (agent).
 */

import type { BotId } from '@/domain/value-objects/ai-assistant';

/**
 * Domain entity representing an AI bot (agent)
 */
export interface AIBot {
  /** Unique identifier for this bot */
  id: BotId;

  /** Display name of the bot */
  name: string;

  /** Optional description */
  description?: string;

  /** Avatar URL */
  avatarUrl?: string;

  /** Account this bot belongs to (optional - may not be provided by API) */
  accountId?: number;

  /** Whether the bot is currently active/available (defaults to true if not provided) */
  isActive?: boolean;

  /** Bot capabilities/features */
  capabilities?: string[];
}
