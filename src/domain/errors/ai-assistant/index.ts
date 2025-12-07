/**
 * AI Assistant Domain Errors
 *
 * Export all error classes and type guards for the AI Assistant feature.
 */

export {
  AIError,
  AIAuthenticationError,
  AINetworkError,
  AIChatSessionNotFoundError,
  AIBotNotFoundError,
  AIStreamingError,
  AISendMessageError,
  AISessionCreationError,
  AIConfigurationError,
  isAIError,
  isAIAuthenticationError,
  isAINetworkError,
} from './AIErrors';
