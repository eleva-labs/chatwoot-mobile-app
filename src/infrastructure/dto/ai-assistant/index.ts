/**
 * AI Assistant DTOs (Data Transfer Objects)
 *
 * Backend API types with snake_case naming convention.
 * These are transformed to domain models by mappers.
 */

export type { AIChatBotDTO, AIChatBotsResponseDTO } from './AIChatBotDTO';

export type { AIChatSessionDTO, AIChatSessionsResponseDTO } from './AIChatSessionDTO';

export type {
  AIChatMessageDTO,
  AIChatMessagePartDTO,
  AIChatMessagesResponseDTO,
} from './AIChatMessageDTO';

// ============================================================================
// Legacy Type Aliases (for backwards compatibility)
// ============================================================================

/**
 * @deprecated Use AIChatBotDTO instead
 */
export type { AIChatBotDTO as AIChatBot } from './AIChatBotDTO';

/**
 * @deprecated Use AIChatSessionDTO instead
 */
export type { AIChatSessionDTO as AIChatSession } from './AIChatSessionDTO';

/**
 * @deprecated Use AIChatMessageDTO instead
 */
export type { AIChatMessageDTO as AIChatMessage } from './AIChatMessageDTO';

/**
 * @deprecated Use AIChatBotsResponseDTO instead
 */
export type { AIChatBotsResponseDTO as AIChatBotsResponse } from './AIChatBotDTO';

/**
 * @deprecated Use AIChatSessionsResponseDTO instead
 */
export type { AIChatSessionsResponseDTO as AIChatSessionsResponse } from './AIChatSessionDTO';

/**
 * @deprecated Use AIChatMessagesResponseDTO instead
 */
export type { AIChatMessagesResponseDTO as AIChatMessagesResponse } from './AIChatMessageDTO';

// ============================================================================
// Request Options Types
// ============================================================================

export interface FetchSessionsOptions {
  agentBotId: number;
  limit?: number;
}

export interface FetchMessagesOptions {
  sessionId: string;
  limit?: number;
}

export interface FetchStoreMessagesOptions {
  storeId: number;
  agentSystemId?: number;
  userId: number;
  limit?: number;
  aiBackendUrl: string;
}

export interface FetchStoreSessionsOptions {
  storeId: number;
  agentSystemId?: number;
  userId: number;
  limit?: number;
  aiBackendUrl: string;
}
