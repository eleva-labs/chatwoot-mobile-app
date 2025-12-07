/**
 * AI Assistant Use Cases - Barrel Export
 *
 * Application layer use case IMPLEMENTATIONS.
 * Interfaces live in src/domain/interfaces/use-cases/ai-assistant/
 */

// Bot use cases
export { FetchBotsUseCase } from './FetchBotsUseCase';

// Session use cases
export { FetchAIChatSessionsUseCase } from './FetchAIChatSessionsUseCase';
export { GetAIChatSessionUseCase } from './GetAIChatSessionUseCase';
export { CreateAIChatSessionUseCase } from './CreateAIChatSessionUseCase';
export { DeleteAIChatSessionUseCase } from './DeleteAIChatSessionUseCase';

// Message use cases
export { LoadAIChatSessionMessagesUseCase } from './LoadAIChatSessionMessagesUseCase';

// Re-export interfaces and types from domain for convenience
export type {
  // Interfaces
  IFetchBotsUseCase,
  IFetchAIChatSessionsUseCase,
  IGetAIChatSessionUseCase,
  ICreateAIChatSessionUseCase,
  IDeleteAIChatSessionUseCase,
  ILoadAIChatSessionMessagesUseCase,
  // Param types
  FetchBotsParams,
  FetchAIChatSessionsParams,
  GetAIChatSessionParams,
  CreateAIChatSessionParams,
  DeleteAIChatSessionParams,
  LoadAIChatSessionMessagesParams,
} from '@/domain/interfaces/use-cases/ai-assistant';
