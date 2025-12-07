/**
 * Chatwoot AI Chat Session Repository
 *
 * Implements IAIChatSessionRepository to manage chat sessions via Chatwoot backend.
 */

import { injectable, inject } from 'tsyringe';
import { Result } from '@/domain/shared';
import type {
  IAIChatSessionRepository,
  FetchAIChatSessionsParams,
  FetchAIChatSessionMessagesParams,
  CreateAIChatSessionParams,
} from '@/domain/interfaces/repositories/ai-assistant';
import type { AIChatSession, IAIChatSessionMapper } from '@/domain/interfaces/mappers/ai-assistant';
import type { AIChatSessionId } from '@/domain/value-objects/ai-assistant';
import { unwrapAIChatSessionId } from '@/domain/value-objects/ai-assistant';
import { AINetworkError, AIAuthenticationError } from '@/domain/errors/ai-assistant';
import { AI_ASSISTANT_TOKENS } from '@/dependency-injection';
import type { IChatwootApiService } from '@/infrastructure/services/ai-assistant';
import type {
  AIChatSessionsResponseDTO,
  AIChatMessagesResponseDTO,
} from '@/infrastructure/dto/ai-assistant';

/**
 * Repository for managing AI chat sessions via Chatwoot
 */
@injectable()
export class ChatwootAIChatSessionRepository implements IAIChatSessionRepository {
  constructor(
    @inject(AI_ASSISTANT_TOKENS.IAIChatSessionMapper)
    private readonly sessionMapper: IAIChatSessionMapper,
    @inject(AI_ASSISTANT_TOKENS.IChatwootApiService)
    private readonly apiService: IChatwootApiService,
  ) {}

  /**
   * Fetch chat sessions for a bot
   */
  async fetchSessions(params: FetchAIChatSessionsParams): Promise<Result<AIChatSession[], Error>> {
    try {
      const queryParams: Record<string, string> = {
        agent_bot_id: String(params.agentBotId),
        limit: String(params.limit ?? 25),
      };

      if (params.offset) {
        queryParams.offset = String(params.offset);
      }

      const response = await this.apiService.get<AIChatSessionsResponseDTO>('ai_chat/sessions', {
        params: queryParams,
      });

      const sessions = this.sessionMapper.toAIChatSessions(response.data.sessions || []);
      return Result.ok(sessions);
    } catch (error) {
      const err = error as Error;
      return Result.fail(
        new AINetworkError(`Failed to fetch sessions: ${err.message}`, undefined, err),
      );
    }
  }

  /**
   * Fetch messages for a specific chat session
   * Returns raw DTOs - use IMessageMapper to convert to UIMessage
   */
  async fetchMessages(params: FetchAIChatSessionMessagesParams): Promise<Result<unknown[], Error>> {
    try {
      const sessionId = unwrapAIChatSessionId(params.chatSessionId);

      const queryParams: Record<string, string> = {
        limit: String(params.limit ?? 100),
      };

      if (params.offset) {
        queryParams.offset = String(params.offset);
      }

      const response = await this.apiService.get<AIChatMessagesResponseDTO>(
        `ai_chat/sessions/${sessionId}/messages`,
        { params: queryParams },
      );

      return Result.ok(response.data.messages || []);
    } catch (error) {
      const err = error as Error;
      return Result.fail(
        new AINetworkError(`Failed to fetch messages: ${err.message}`, undefined, err),
      );
    }
  }

  /**
   * Create a new chat session
   */
  async createSession(params: CreateAIChatSessionParams): Promise<Result<AIChatSession, Error>> {
    try {
      if (!params.agentBotId) {
        return Result.fail(new AIAuthenticationError('Bot ID is required to create session'));
      }

      const body = {
        agent_bot_id: params.agentBotId,
        initial_message: params.initialMessage,
      };

      const response = await this.apiService.post<{ session: unknown }>('ai_chat/sessions', body);

      const session = this.sessionMapper.toAIChatSession(response.data.session);
      return Result.ok(session);
    } catch (error) {
      const err = error as Error;
      return Result.fail(
        new AINetworkError(`Failed to create session: ${err.message}`, undefined, err),
      );
    }
  }

  /**
   * Delete a chat session
   */
  async deleteSession(chatSessionId: AIChatSessionId): Promise<Result<void, Error>> {
    try {
      const sessionId = unwrapAIChatSessionId(chatSessionId);

      await this.apiService.delete(`ai_chat/sessions/${sessionId}`);

      return Result.ok(undefined);
    } catch (error) {
      const err = error as Error;
      return Result.fail(
        new AINetworkError(`Failed to delete session: ${err.message}`, undefined, err),
      );
    }
  }

  /**
   * Get a single chat session by ID
   */
  async getSession(chatSessionId: AIChatSessionId): Promise<Result<AIChatSession | null, Error>> {
    try {
      const sessionId = unwrapAIChatSessionId(chatSessionId);

      const response = await this.apiService.get<{ session: unknown }>(
        `ai_chat/sessions/${sessionId}`,
      );

      if (!response.data.session) {
        return Result.ok(null);
      }

      const session = this.sessionMapper.toAIChatSession(response.data.session);
      return Result.ok(session);
    } catch (error) {
      const err = error as Error & { statusCode?: number };

      // 404 means session not found - not an error
      if (err.statusCode === 404) {
        return Result.ok(null);
      }

      return Result.fail(
        new AINetworkError(`Failed to get session: ${err.message}`, undefined, err),
      );
    }
  }
}
