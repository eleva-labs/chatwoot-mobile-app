/**
 * AI Assistant Presentation Utilities
 *
 * Utility functions for UI-related operations in AI Assistant.
 */

export {
  NEAR_BOTTOM_THRESHOLD,
  calculateDistanceFromBottom,
  isNearBottom,
} from './aiChatScrollUtils';

export {
  validateMessage,
  validateAndNormalizeParts,
  validateAndNormalizeMessages,
} from './aiChatMessageUtils';

export { formatToolName, formatJson, formatSessionTitle } from './aiChatFormatUtils';
export { categorizeError, ERROR_DISPLAY_CONFIG } from './aiChatErrorUtils';
export type { ErrorCategory, ErrorDisplayConfig } from './aiChatErrorUtils';
