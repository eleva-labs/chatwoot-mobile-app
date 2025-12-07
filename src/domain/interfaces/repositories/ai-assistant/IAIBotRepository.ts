/**
 * AI Bot Repository Interface
 *
 * Contract for fetching AI bots (agents) from the backend.
 * Implementation lives in infrastructure/repositories/ai-assistant/
 */

import type { Result } from '@/domain/shared';
import type { AIBot } from '@/domain/interfaces/mappers/ai-assistant';
import type { BotId } from '@/domain/value-objects/ai-assistant';

/**
 * Parameters for fetching bots
 */
export interface FetchBotsParams {
  /** Account ID to fetch bots for */
  accountId: number;
}

/**
 * Repository interface for AI Bot operations
 */
export interface IAIBotRepository {
  /**
   * Fetch all available bots for an account
   *
   * @param params - Fetch parameters
   * @returns Result containing array of bots or error
   */
  fetchBots(params: FetchBotsParams): Promise<Result<AIBot[], Error>>;

  /**
   * Fetch a single bot by ID
   *
   * @param botId - The bot ID to fetch
   * @returns Result containing the bot or error
   */
  fetchBotById(botId: BotId): Promise<Result<AIBot | null, Error>>;
}
