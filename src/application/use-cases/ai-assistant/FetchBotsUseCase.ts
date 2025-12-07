/**
 * Fetch Bots Use Case
 *
 * Retrieves all available AI bots for an account.
 */

import { injectable, inject } from 'tsyringe';
import type { Result } from '@/domain/shared';
import type {
  IFetchBotsUseCase,
  FetchBotsParams,
} from '@/domain/interfaces/use-cases/ai-assistant';
import type { IAIBotRepository } from '@/domain/interfaces/repositories/ai-assistant';
import type { AIBot } from '@/domain/entities/ai-assistant';
import { AI_ASSISTANT_TOKENS } from '@/dependency-injection';

/**
 * Fetch Bots Use Case Implementation
 *
 * Retrieves all available AI bots for an account.
 */
@injectable()
export class FetchBotsUseCase implements IFetchBotsUseCase {
  constructor(
    @inject(AI_ASSISTANT_TOKENS.IAIBotRepository)
    private readonly botRepository: IAIBotRepository,
  ) {}

  async execute(params: FetchBotsParams): Promise<Result<AIBot[], Error>> {
    return this.botRepository.fetchBots(params);
  }
}
