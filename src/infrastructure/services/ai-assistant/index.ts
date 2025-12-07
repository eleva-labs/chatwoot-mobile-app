/**
 * AI Assistant Infrastructure Services
 *
 * Service IMPLEMENTATIONS for AI chat functionality.
 * Interfaces live in src/domain/interfaces/services/ai-assistant/
 */

export { AIChatApiService } from './AIChatApiService';
export { ChatwootApiService } from './ChatwootApiService';

// Re-export interfaces from domain for convenience
export type {
  IChatwootApiService,
  IAIChatApiService,
  ApiResponse,
  RequestOptions,
  FetchStoreSessionsParams,
  FetchStoreMessagesParams,
  FetchSessionsParams,
  FetchSessionMessagesParams,
  ChatStreamParams,
} from '@/domain/interfaces/services/ai-assistant';
