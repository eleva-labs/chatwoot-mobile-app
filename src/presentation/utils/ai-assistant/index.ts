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
  createThoughtsAnchor,
  injectThoughtsAnchor,
  prepareListData,
} from './aiChatMessageUtils';

export {
  convertBackendMessageToUIMessage,
  convertBackendMessagesToUIMessages,
} from './aiChatUtils';
