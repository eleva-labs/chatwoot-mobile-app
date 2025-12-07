/**
 * AI Assistant Value Objects
 *
 * Branded types for type-safe identifiers and domain primitives.
 */

export {
  type AIChatSessionId,
  createAIChatSessionId,
  createAIChatSessionIdOrNull,
  isAIChatSessionId,
  isValidAIChatSessionId,
  unwrapAIChatSessionId,
  areAIChatSessionIdsEqual,
} from './AIChatSessionId';

export {
  type BotId,
  createBotId,
  createBotIdOrNull,
  isBotId,
  unwrapBotId,
  areBotIdsEqual,
} from './BotId';

// Note: ChatStatus is exported from types/ai-assistant/constants.ts
// as it's a simple union type, not a branded value object
