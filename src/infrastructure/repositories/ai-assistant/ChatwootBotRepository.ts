/**
 * Chatwoot Bot Repository
 *
 * Implements IAIBotRepository to fetch AI bots from Chatwoot backend.
 */

import { injectable, inject } from 'tsyringe';
import { Result } from '@/domain/shared';
import type {
  IAIBotRepository,
  FetchBotsParams,
} from '@/domain/interfaces/repositories/ai-assistant';
import type { AIBot, IBotMapper } from '@/domain/interfaces/mappers/ai-assistant';
import type { BotId } from '@/domain/value-objects/ai-assistant';
import { unwrapBotId } from '@/domain/value-objects/ai-assistant';
import { AINetworkError, AIAuthenticationError } from '@/domain/errors/ai-assistant';
import { AI_ASSISTANT_TOKENS } from '@/dependency-injection';
import type { IChatwootApiService } from '@/infrastructure/services/ai-assistant';
import type { AIChatBotsResponseDTO } from '@/infrastructure/dto/ai-assistant';

/**
 * Repository for fetching AI bots from Chatwoot
 */
@injectable()
export class ChatwootBotRepository implements IAIBotRepository {
  constructor(
    @inject(AI_ASSISTANT_TOKENS.IBotMapper) private readonly botMapper: IBotMapper,
    @inject(AI_ASSISTANT_TOKENS.IChatwootApiService)
    private readonly apiService: IChatwootApiService,
  ) {}

  /**
   * Fetch all available bots for an account
   */
  async fetchBots(params: FetchBotsParams): Promise<Result<AIBot[], Error>> {
    try {
      if (!params.accountId) {
        return Result.fail(new AIAuthenticationError('Account ID is required to fetch bots'));
      }

      const response = await this.apiService.get<AIChatBotsResponseDTO>('ai_chat/bots');

      const bots = this.botMapper.toAIBots(response.data.bots || []);
      return Result.ok(bots);
    } catch (error) {
      const err = error as Error;
      return Result.fail(
        new AINetworkError(`Failed to fetch bots: ${err.message}`, undefined, err),
      );
    }
  }

  /**
   * Fetch a single bot by ID
   */
  async fetchBotById(botId: BotId): Promise<Result<AIBot | null, Error>> {
    try {
      // Fetch all bots and find the one with matching ID
      // (API may not have a single-bot endpoint)
      const response = await this.apiService.get<AIChatBotsResponseDTO>('ai_chat/bots');

      const botIdValue = unwrapBotId(botId);
      const botDTO = response.data.bots?.find(b => b.id === botIdValue);

      if (!botDTO) {
        return Result.ok(null);
      }

      const bot = this.botMapper.toAIBot(botDTO);
      return Result.ok(bot);
    } catch (error) {
      const err = error as Error;
      return Result.fail(new AINetworkError(`Failed to fetch bot: ${err.message}`, undefined, err));
    }
  }
}
