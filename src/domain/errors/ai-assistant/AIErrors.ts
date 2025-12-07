/**
 * AI Assistant Domain Errors
 *
 * Custom error classes for the AI Assistant feature.
 * These provide type-safe error handling and meaningful error messages.
 */

/**
 * Base error for all AI Assistant errors
 */
export class AIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIError';
    // Maintains proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error when user is not authenticated for AI operations
 */
export class AIAuthenticationError extends AIError {
  constructor(message: string = 'Authentication required for AI operations') {
    super(message);
    this.name = 'AIAuthenticationError';
  }
}

/**
 * Error when network request fails
 */
export class AINetworkError extends AIError {
  public readonly statusCode?: number;
  public readonly originalError?: Error;

  constructor(
    message: string = 'Network error during AI operation',
    statusCode?: number,
    originalError?: Error,
  ) {
    super(message);
    this.name = 'AINetworkError';
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

/**
 * Error when chat session is not found
 */
export class AIChatSessionNotFoundError extends AIError {
  public readonly sessionId: string;

  constructor(sessionId: string) {
    super(`Chat session not found: ${sessionId}`);
    this.name = 'AIChatSessionNotFoundError';
    this.sessionId = sessionId;
  }
}

/**
 * Error when bot is not found
 */
export class AIBotNotFoundError extends AIError {
  public readonly botId: string;

  constructor(botId: string) {
    super(`AI Bot not found: ${botId}`);
    this.name = 'AIBotNotFoundError';
    this.botId = botId;
  }
}

/**
 * Error when streaming connection fails
 */
export class AIStreamingError extends AIError {
  public readonly originalError?: Error;

  constructor(message: string = 'Streaming connection failed', originalError?: Error) {
    super(message);
    this.name = 'AIStreamingError';
    this.originalError = originalError;
  }
}

/**
 * Error when message sending fails
 */
export class AISendMessageError extends AIError {
  public readonly originalError?: Error;

  constructor(message: string = 'Failed to send message', originalError?: Error) {
    super(message);
    this.name = 'AISendMessageError';
    this.originalError = originalError;
  }
}

/**
 * Error when session creation fails
 */
export class AISessionCreationError extends AIError {
  public readonly originalError?: Error;

  constructor(message: string = 'Failed to create chat session', originalError?: Error) {
    super(message);
    this.name = 'AISessionCreationError';
    this.originalError = originalError;
  }
}

/**
 * Error when configuration is invalid or missing
 */
export class AIConfigurationError extends AIError {
  public readonly configKey?: string;

  constructor(message: string = 'AI configuration error', configKey?: string) {
    super(message);
    this.name = 'AIConfigurationError';
    this.configKey = configKey;
  }
}

/**
 * Type guard to check if an error is an AI error
 */
export function isAIError(error: unknown): error is AIError {
  return error instanceof AIError;
}

/**
 * Type guard to check if an error is an authentication error
 */
export function isAIAuthenticationError(error: unknown): error is AIAuthenticationError {
  return error instanceof AIAuthenticationError;
}

/**
 * Type guard to check if an error is a network error
 */
export function isAINetworkError(error: unknown): error is AINetworkError {
  return error instanceof AINetworkError;
}
