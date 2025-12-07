/**
 * Dependency Injection Tokens
 *
 * Central registry for all DI tokens in the AI Assistant module.
 * Tokens are used to identify dependencies when injecting interfaces.
 *
 * Usage:
 *   @inject(DI_TOKENS.IBotMapper) private botMapper: IBotMapper
 */

/**
 * AI Assistant DI Tokens
 */
export const AI_ASSISTANT_TOKENS = {
  // ============================================================================
  // Repositories
  // ============================================================================

  /** Repository for fetching AI bots */
  IAIBotRepository: Symbol.for('IAIBotRepository'),

  /** Repository for managing chat sessions */
  IAIChatSessionRepository: Symbol.for('IAIChatSessionRepository'),

  /** Storage for active chat session ID */
  IActiveAIChatSessionStorage: Symbol.for('IActiveAIChatSessionStorage'),

  // ============================================================================
  // Mappers
  // ============================================================================

  /** Maps bot DTOs to domain entities */
  IBotMapper: Symbol.for('IBotMapper'),

  /** Maps session DTOs to domain entities */
  IAIChatSessionMapper: Symbol.for('IAIChatSessionMapper'),

  /** Maps message DTOs to UI messages */
  IMessageMapper: Symbol.for('IMessageMapper'),

  // ============================================================================
  // Services
  // ============================================================================

  /** API client for Chatwoot backend */
  IChatwootApiService: Symbol.for('IChatwootApiService'),

  /** API client for AI backend */
  IAIChatApiService: Symbol.for('IAIChatApiService'),

  // ============================================================================
  // Use Cases
  // ============================================================================

  /** Fetch bots use case */
  FetchBotsUseCase: Symbol.for('FetchBotsUseCase'),

  /** Fetch chat sessions use case */
  FetchAIChatSessionsUseCase: Symbol.for('FetchAIChatSessionsUseCase'),

  /** Get single chat session use case */
  GetAIChatSessionUseCase: Symbol.for('GetAIChatSessionUseCase'),

  /** Create chat session use case */
  CreateAIChatSessionUseCase: Symbol.for('CreateAIChatSessionUseCase'),

  /** Delete chat session use case */
  DeleteAIChatSessionUseCase: Symbol.for('DeleteAIChatSessionUseCase'),

  /** Load chat session messages use case */
  LoadAIChatSessionMessagesUseCase: Symbol.for('LoadAIChatSessionMessagesUseCase'),
} as const;

/**
 * Shared DI Tokens (used across modules)
 */
export const SHARED_TOKENS = {
  // ============================================================================
  // Repositories
  // ============================================================================

  /** Auth state access */
  IAuthRepository: Symbol.for('IAuthRepository'),

  /** Settings access */
  ISettingsRepository: Symbol.for('ISettingsRepository'),

  /** Redux state access */
  IStateRepository: Symbol.for('IStateRepository'),
} as const;

/**
 * Combined tokens for convenience
 * @deprecated Use AI_ASSISTANT_TOKENS or SHARED_TOKENS directly
 */
export const DI_TOKENS = {
  ...AI_ASSISTANT_TOKENS,
  ...SHARED_TOKENS,
} as const;
