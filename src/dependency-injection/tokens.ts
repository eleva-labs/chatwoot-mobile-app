/**
 * Dependency Injection Tokens
 *
 * Central registry for all DI tokens used across the application.
 * Tokens are used to identify dependencies when injecting interfaces.
 *
 * Usage:
 *   @inject(SHARED_TOKENS.IAuthRepository) private authRepo: IAuthRepository
 */

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
