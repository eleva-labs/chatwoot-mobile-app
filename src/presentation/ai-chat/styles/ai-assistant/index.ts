/**
 * AI Assistant Styles
 *
 * Exports all AI styling tokens and hooks.
 *
 * @example
 * // Import the hook (recommended)
 * import { useAIStyles } from '../styles';
 *
 * // Or import specific tokens
 * import { aiMessageTokens, getCollapsibleTokens } from '../styles';
 *
 * // Or from absolute path
 * import { useAIStyles, aiTextTokens } from '@infrastructure/ui/ai-assistant/styles';
 */

// Token exports
export {
  // Types
  type AIAccentColor,
  type AICollapsibleTokens,
  type AIMessageTokens,
  type AITextTokens,
  type AIToolTokens,
  type AIHeaderTokens,
  type AIInputTokens,
  type AISessionTokens,
  type AIFabTokens,
  // Token objects
  aiMessageTokens,
  aiTextTokens,
  aiToolTokens,
  aiCollapsibleTokens,
  aiHeaderTokens,
  aiInputTokens,
  aiSessionTokens,
  aiFabTokens,
  // Helper functions
  getMessageTokens,
  getCollapsibleTokens,
  getCursorToken,
  getTextColorByRole,
} from './tokens';

// Hook exports
export { useAIStyles, default as useAIStylesDefault, type AIStylesResult } from './useAIStyles';
