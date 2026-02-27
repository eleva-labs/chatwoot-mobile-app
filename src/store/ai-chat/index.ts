/**
 * AI Chat Store — Barrel Export
 *
 * Re-exports all public API from the ai-chat store module.
 */

// Redux slice (reducer + sync actions)
export { default as aiChatReducer } from './aiChatSlice';
export { setActiveSession, clearSessions, clearMessages, clearAllMessages } from './aiChatSlice';

// Async thunks
export { aiChatActions } from './aiChatActions';

// Selectors
export * from './aiChatSelectors';

// Types (re-exports schema types) and schemas (parse functions + schema objects)
export * from './aiChatTypes';
export {
  AIChatBotApiSchema,
  AIChatBotsResponseSchema,
  AIChatSessionApiSchema,
  AIChatSessionsResponseSchema,
  AIChatMessagePartApiSchema,
  AIChatMessageApiSchema,
  AIChatMessagesResponseSchema,
  parseBotsResponse,
  parseSessionsResponse,
  parseMessagesResponse,
} from './aiChatSchemas';

// Service class
export { AIChatService } from './aiChatService';

// Mapper functions
export { mapMessagesToUIMessages, mapMessageToUIMessage } from './aiChatMapper';
