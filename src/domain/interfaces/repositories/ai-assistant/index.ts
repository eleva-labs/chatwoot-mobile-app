/**
 * AI Assistant Repository Interfaces
 *
 * Domain contracts for data access.
 * Infrastructure layer provides concrete implementations.
 */

export type { IAIBotRepository, FetchBotsParams } from './IAIBotRepository';

export type {
  IAIChatSessionRepository,
  FetchAIChatSessionsParams,
  FetchAIChatSessionMessagesParams,
  CreateAIChatSessionParams,
} from './IAIChatSessionRepository';

export type { IActiveAIChatSessionStorage } from './IActiveAIChatSessionStorage';
