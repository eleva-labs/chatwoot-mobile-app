/**
 * Load AI Chat Session Messages Use Case
 *
 * Loads messages for a specific chat session and maps them to UI format.
 * This use case coordinates the repository and mapper to transform
 * backend DTOs into UIMessage format for the presentation layer.
 */

import { injectable, inject } from 'tsyringe';
import type { UIMessage } from 'ai';
import { Result } from '@/domain/shared';
import type {
  ILoadAIChatSessionMessagesUseCase,
  LoadAIChatSessionMessagesParams,
} from '@/domain/interfaces/use-cases/ai-assistant';
import type { IAIChatSessionRepository } from '@/domain/interfaces/repositories/ai-assistant';
import type { IMessageMapper } from '@/domain/interfaces/mappers/ai-assistant';
import { AI_ASSISTANT_TOKENS } from '@/dependency-injection';

/**
 * Load AI Chat Session Messages Use Case Implementation
 *
 * Coordinates repository and mapper to load and transform messages.
 */
@injectable()
export class LoadAIChatSessionMessagesUseCase implements ILoadAIChatSessionMessagesUseCase {
  constructor(
    @inject(AI_ASSISTANT_TOKENS.IAIChatSessionRepository)
    private readonly sessionRepository: IAIChatSessionRepository,
    @inject(AI_ASSISTANT_TOKENS.IMessageMapper)
    private readonly messageMapper: IMessageMapper,
  ) {}

  async execute(params: LoadAIChatSessionMessagesParams): Promise<Result<UIMessage[], Error>> {
    // Fetch raw messages from repository
    const messagesResult = await this.sessionRepository.fetchMessages({
      chatSessionId: params.chatSessionId,
      limit: params.limit,
      offset: params.offset,
    });

    // If fetch failed, return the error
    if (messagesResult.isFailure) {
      return messagesResult as Result<never, Error>;
    }

    // Map DTOs to UIMessages
    const messageDTOs = messagesResult.getValue();
    const uiMessages = this.messageMapper.toUIMessages(messageDTOs);

    return Result.ok(uiMessages);
  }
}
