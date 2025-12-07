/**
 * Create AI Chat Session Use Case
 *
 * Creates a new chat session with a specific bot.
 */

import { injectable, inject } from 'tsyringe';
import type { Result } from '@/domain/shared';
import type {
  ICreateAIChatSessionUseCase,
  CreateAIChatSessionParams,
} from '@/domain/interfaces/use-cases/ai-assistant';
import type { IAIChatSessionRepository } from '@/domain/interfaces/repositories/ai-assistant';
import type { AIChatSession } from '@/domain/entities/ai-assistant';
import { AI_ASSISTANT_TOKENS } from '@/dependency-injection';

/**
 * Create AI Chat Session Use Case Implementation
 *
 * Creates a new chat session with a specific bot.
 */
@injectable()
export class CreateAIChatSessionUseCase implements ICreateAIChatSessionUseCase {
  constructor(
    @inject(AI_ASSISTANT_TOKENS.IAIChatSessionRepository)
    private readonly sessionRepository: IAIChatSessionRepository,
  ) {}

  async execute(params: CreateAIChatSessionParams): Promise<Result<AIChatSession, Error>> {
    return this.sessionRepository.createSession(params);
  }
}
