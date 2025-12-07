/**
 * Delete AI Chat Session Use Case
 *
 * Deletes a specific chat session.
 */

import { injectable, inject } from 'tsyringe';
import type { Result } from '@/domain/shared';
import type {
  IDeleteAIChatSessionUseCase,
  DeleteAIChatSessionParams,
} from '@/domain/interfaces/use-cases/ai-assistant';
import type { IAIChatSessionRepository } from '@/domain/interfaces/repositories/ai-assistant';
import { AI_ASSISTANT_TOKENS } from '@/dependency-injection';

/**
 * Delete AI Chat Session Use Case Implementation
 *
 * Deletes a specific chat session.
 */
@injectable()
export class DeleteAIChatSessionUseCase implements IDeleteAIChatSessionUseCase {
  constructor(
    @inject(AI_ASSISTANT_TOKENS.IAIChatSessionRepository)
    private readonly sessionRepository: IAIChatSessionRepository,
  ) {}

  async execute(params: DeleteAIChatSessionParams): Promise<Result<void, Error>> {
    return this.sessionRepository.deleteSession(params.chatSessionId);
  }
}
