/**
 * Get AI Chat Session Use Case
 *
 * Retrieves a single chat session by ID.
 */

import { injectable, inject } from 'tsyringe';
import type { Result } from '@/domain/shared';
import type {
  IGetAIChatSessionUseCase,
  GetAIChatSessionParams,
} from '@/domain/interfaces/use-cases/ai-assistant';
import type { IAIChatSessionRepository } from '@/domain/interfaces/repositories/ai-assistant';
import type { AIChatSession } from '@/domain/entities/ai-assistant';
import { AI_ASSISTANT_TOKENS } from '@/dependency-injection';

/**
 * Get AI Chat Session Use Case Implementation
 *
 * Retrieves a single chat session by ID.
 */
@injectable()
export class GetAIChatSessionUseCase implements IGetAIChatSessionUseCase {
  constructor(
    @inject(AI_ASSISTANT_TOKENS.IAIChatSessionRepository)
    private readonly sessionRepository: IAIChatSessionRepository,
  ) {}

  async execute(params: GetAIChatSessionParams): Promise<Result<AIChatSession | null, Error>> {
    return this.sessionRepository.getSession(params.chatSessionId);
  }
}
