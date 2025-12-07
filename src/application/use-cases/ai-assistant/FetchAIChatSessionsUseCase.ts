/**
 * Fetch AI Chat Sessions Use Case
 *
 * Retrieves chat sessions for a specific bot.
 */

import { injectable, inject } from 'tsyringe';
import type { Result } from '@/domain/shared';
import type {
  IFetchAIChatSessionsUseCase,
  FetchAIChatSessionsParams,
} from '@/domain/interfaces/use-cases/ai-assistant';
import type { IAIChatSessionRepository } from '@/domain/interfaces/repositories/ai-assistant';
import type { AIChatSession } from '@/domain/entities/ai-assistant';
import { AI_ASSISTANT_TOKENS } from '@/dependency-injection';

/**
 * Fetch AI Chat Sessions Use Case Implementation
 *
 * Retrieves chat sessions for a specific bot.
 */
@injectable()
export class FetchAIChatSessionsUseCase implements IFetchAIChatSessionsUseCase {
  constructor(
    @inject(AI_ASSISTANT_TOKENS.IAIChatSessionRepository)
    private readonly sessionRepository: IAIChatSessionRepository,
  ) {}

  async execute(params: FetchAIChatSessionsParams): Promise<Result<AIChatSession[], Error>> {
    return this.sessionRepository.fetchSessions(params);
  }
}
