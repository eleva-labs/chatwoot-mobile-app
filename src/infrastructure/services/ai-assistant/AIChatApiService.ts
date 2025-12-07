/**
 * AI Chat API Service
 *
 * Service for making AI chat-related API calls.
 * Extends ApiClient for common HTTP functionality.
 */

import { injectable, inject } from 'tsyringe';
import { ApiClient } from '../shared/ApiClient';
import { SHARED_TOKENS } from '@/dependency-injection';
import type { IAuthRepository, ISettingsRepository } from '@/domain/interfaces/repositories/shared';
import { AI_BACKEND_ENDPOINTS } from './endpoints';
import type {
  AIChatSessionsResponseDTO,
  AIChatMessagesResponseDTO,
} from '@/infrastructure/dto/ai-assistant';

/**
 * Parameters for fetching store sessions
 */
export interface FetchStoreSessionsParams {
  storeId: number;
  userId: number;
  agentSystemId?: number;
  limit?: number;
}

/**
 * Parameters for fetching store messages
 */
export interface FetchStoreMessagesParams {
  storeId: number;
  userId: number;
  agentSystemId?: number;
  limit?: number;
}

/**
 * Parameters for streaming chat
 */
export interface ChatStreamParams {
  sessionId: string;
  message: string;
  storeId?: number;
  userId?: number;
}

/**
 * AI Chat API Service
 *
 * Handles communication with the Python AI backend.
 */
@injectable()
export class AIChatApiService extends ApiClient {
  constructor(
    @inject(SHARED_TOKENS.IAuthRepository) authRepository: IAuthRepository,
    @inject(SHARED_TOKENS.ISettingsRepository) settingsRepository: ISettingsRepository,
  ) {
    super(authRepository, settingsRepository);
  }

  /**
   * Get the base URL for AI backend requests
   */
  protected getBaseUrl(): string {
    return this.settingsRepository.getAIBaseUrl();
  }

  // ============================================================================
  // Sessions API
  // ============================================================================

  /**
   * Fetch chat sessions for a store
   */
  async fetchStoreSessions(params: FetchStoreSessionsParams): Promise<AIChatSessionsResponseDTO> {
    const { storeId, userId, agentSystemId, limit = 25 } = params;

    const queryParams = {
      user_id: userId,
      id_type: 'external',
      limit,
      agent_system_id: agentSystemId,
    };

    // Use agent-systems endpoint if agentSystemId is provided
    const endpoint = agentSystemId
      ? AI_BACKEND_ENDPOINTS.AGENT_SYSTEM_SESSIONS(agentSystemId)
      : AI_BACKEND_ENDPOINTS.STORE_SESSIONS(storeId);

    const response = await this.get<{ sessions?: unknown[]; data?: unknown[] }>(endpoint, {
      params: queryParams,
    });

    return {
      sessions: (response.data.sessions ||
        response.data.data ||
        []) as AIChatSessionsResponseDTO['sessions'],
    };
  }

  // ============================================================================
  // Messages API
  // ============================================================================

  /**
   * Fetch messages for a store
   */
  async fetchStoreMessages(params: FetchStoreMessagesParams): Promise<AIChatMessagesResponseDTO> {
    const { storeId, userId, agentSystemId, limit = 100 } = params;

    const queryParams = {
      user_id: userId,
      id_type: 'external',
      limit,
      agent_system_id: agentSystemId,
    };

    const response = await this.get<{ messages?: unknown[]; data?: unknown[] }>(
      AI_BACKEND_ENDPOINTS.STORE_MESSAGES(storeId),
      { params: queryParams },
    );

    return {
      messages: (response.data.messages ||
        response.data.data ||
        []) as AIChatMessagesResponseDTO['messages'],
    };
  }

  // ============================================================================
  // Streaming API
  // ============================================================================

  /**
   * Start a streaming chat request
   *
   * Returns the raw Response for stream processing.
   */
  async startChatStream(params: ChatStreamParams): Promise<Response> {
    const body = {
      session_id: params.sessionId,
      message: params.message,
      store_id: params.storeId,
      user_id: params.userId,
    };

    return this.stream(AI_BACKEND_ENDPOINTS.CHAT_STREAM, body);
  }
}
