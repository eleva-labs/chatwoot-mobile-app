/**
 * Chatwoot API Service
 *
 * Service for making Chatwoot-related API calls (bots, sessions).
 * Extends ApiClient for common HTTP functionality.
 *
 * Implements IChatwootApiService from domain layer.
 */

import { injectable, inject } from 'tsyringe';
import { ApiClient } from '../shared/ApiClient';
import { SHARED_TOKENS } from '@/dependency-injection';
import type { IAuthRepository, ISettingsRepository } from '@/domain/interfaces/repositories/shared';
import type {
  IChatwootApiService,
  ApiResponse,
  RequestOptions,
  FetchSessionsParams,
  FetchSessionMessagesParams,
} from '@/domain/interfaces/services/ai-assistant';
import type {
  AIChatBotsResponseDTO,
  AIChatSessionsResponseDTO,
  AIChatMessagesResponseDTO,
} from '@/infrastructure/dto/ai-assistant';
import { CHATWOOT_ENDPOINTS } from './endpoints';

/**
 * Chatwoot API Service Implementation
 *
 * Handles communication with the Chatwoot backend.
 */
@injectable()
export class ChatwootApiService extends ApiClient implements IChatwootApiService {
  constructor(
    @inject(SHARED_TOKENS.IAuthRepository) authRepository: IAuthRepository,
    @inject(SHARED_TOKENS.ISettingsRepository) settingsRepository: ISettingsRepository,
  ) {
    super(authRepository, settingsRepository);
  }

  /**
   * Get the base URL for Chatwoot API requests
   */
  protected getBaseUrl(): string {
    return this.settingsRepository.getInstallationUrl();
  }

  // ============================================================================
  // Generic HTTP Methods
  // ============================================================================

  /**
   * Make a GET request to Chatwoot API
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return super.get<T>(endpoint, options);
  }

  /**
   * Make a POST request to Chatwoot API
   */
  async post<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return super.post<T>(endpoint, body, options);
  }

  /**
   * Make a DELETE request to Chatwoot API
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return super.delete<T>(endpoint, options);
  }

  // ============================================================================
  // AI Chat Methods (Rails Proxy)
  // ============================================================================

  /**
   * Fetch available AI bots
   */
  async fetchBots(): Promise<AIChatBotsResponseDTO> {
    const response = await this.get<AIChatBotsResponseDTO>(CHATWOOT_ENDPOINTS.BOTS);
    return response.data;
  }

  /**
   * Fetch chat sessions for an agent bot
   */
  async fetchSessions(params: FetchSessionsParams): Promise<AIChatSessionsResponseDTO> {
    const { agentBotId, limit = 25 } = params;

    const response = await this.get<AIChatSessionsResponseDTO>(CHATWOOT_ENDPOINTS.SESSIONS, {
      params: {
        agent_bot_id: agentBotId,
        limit,
      },
    });

    return response.data;
  }

  /**
   * Fetch messages for a session
   */
  async fetchSessionMessages(
    params: FetchSessionMessagesParams,
  ): Promise<AIChatMessagesResponseDTO> {
    const { sessionId, limit = 100 } = params;

    const response = await this.get<AIChatMessagesResponseDTO>(
      CHATWOOT_ENDPOINTS.SESSION_MESSAGES(sessionId),
      {
        params: { limit },
      },
    );

    return response.data;
  }
}
