/**
 * Token System Exports
 *
 * Base types and helpers for creating feature-specific tokens.
 * Import from here when creating tokens for a new feature.
 *
 * @example
 * import { BaseMessageTokens, createRoleGetter } from '@infrastructure/theme/colors/tokens';
 */

export {
  // Base interfaces
  type BaseMessageTokens,
  type BaseTextTokens,
  type BaseStatusTokens,
  type BaseInteractiveTokens,
  type BaseCollapsibleTokens,
  // Utility types
  type FeatureTokens,
  // Helper functions
  createRoleGetter,
  createAccentGetter,
} from './base';
