/**
 * AI Assistant Use Case Interfaces
 *
 * Contracts for AI Assistant use cases.
 * Implementations live in src/application/use-cases/ai-assistant/
 */

import type { Result } from '@/domain/shared';
import type { UIMessage } from 'ai';
import type { IUseCase } from '../IUseCase';
import type { AIBot, AIChatSession } from '@/domain/entities/ai-assistant';
import type { AIChatSessionId } from '@/domain/value-objects/ai-assistant';

// ============================================================================
// Parameter Types
// ============================================================================

/**
 * Parameters for fetching bots
 */
export interface FetchBotsParams {
  accountId: number;
}

/**
 * Parameters for fetching sessions
 */
export interface FetchAIChatSessionsParams {
  agentBotId: number;
  limit?: number;
  offset?: number;
}

/**
 * Parameters for getting a single session
 */
export interface GetAIChatSessionParams {
  chatSessionId: AIChatSessionId;
}

/**
 * Parameters for creating a session
 */
export interface CreateAIChatSessionParams {
  agentBotId: number;
  initialMessage?: string;
}

/**
 * Parameters for deleting a session
 */
export interface DeleteAIChatSessionParams {
  chatSessionId: AIChatSessionId;
}

/**
 * Parameters for loading messages
 */
export interface LoadAIChatSessionMessagesParams {
  chatSessionId: AIChatSessionId;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Bot Use Case Interfaces
// ============================================================================

/**
 * Use case for fetching all available AI bots
 */
export interface IFetchBotsUseCase extends IUseCase<FetchBotsParams, AIBot[]> {
  execute(params: FetchBotsParams): Promise<Result<AIBot[], Error>>;
}

// ============================================================================
// Session Use Case Interfaces
// ============================================================================

/**
 * Use case for fetching chat sessions for a bot
 */
export interface IFetchAIChatSessionsUseCase
  extends IUseCase<FetchAIChatSessionsParams, AIChatSession[]> {
  execute(params: FetchAIChatSessionsParams): Promise<Result<AIChatSession[], Error>>;
}

/**
 * Use case for getting a single chat session by ID
 */
export interface IGetAIChatSessionUseCase
  extends IUseCase<GetAIChatSessionParams, AIChatSession | null> {
  execute(params: GetAIChatSessionParams): Promise<Result<AIChatSession | null, Error>>;
}

/**
 * Use case for creating a new chat session
 */
export interface ICreateAIChatSessionUseCase
  extends IUseCase<CreateAIChatSessionParams, AIChatSession> {
  execute(params: CreateAIChatSessionParams): Promise<Result<AIChatSession, Error>>;
}

/**
 * Use case for deleting a chat session
 */
export interface IDeleteAIChatSessionUseCase extends IUseCase<DeleteAIChatSessionParams, void> {
  execute(params: DeleteAIChatSessionParams): Promise<Result<void, Error>>;
}

// ============================================================================
// Message Use Case Interfaces
// ============================================================================

/**
 * Use case for loading and transforming chat session messages
 */
export interface ILoadAIChatSessionMessagesUseCase
  extends IUseCase<LoadAIChatSessionMessagesParams, UIMessage[]> {
  execute(params: LoadAIChatSessionMessagesParams): Promise<Result<UIMessage[], Error>>;
}
