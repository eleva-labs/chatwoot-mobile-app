/**
 * AI Assistant Module - DI Registration
 *
 * Registers all AI Assistant feature dependencies.
 */

import type { DependencyContainer } from 'tsyringe';
import { AI_ASSISTANT_TOKENS } from '../tokens';

// ============================================================================
// Service Implementations
// ============================================================================

import { ChatwootApiService } from '@/infrastructure/services/ai-assistant/ChatwootApiService';
import { AIChatApiService } from '@/infrastructure/services/ai-assistant/AIChatApiService';

// ============================================================================
// Mapper Implementations
// ============================================================================

import { BotMapper } from '@/infrastructure/mappers/ai-assistant/BotMapper';
import { AIChatSessionMapper } from '@/infrastructure/mappers/ai-assistant/AIChatSessionMapper';
import { MessageMapper } from '@/infrastructure/mappers/ai-assistant/MessageMapper';

// ============================================================================
// Repository Implementations
// ============================================================================

import { ChatwootBotRepository } from '@/infrastructure/repositories/ai-assistant/ChatwootBotRepository';
import { ChatwootAIChatSessionRepository } from '@/infrastructure/repositories/ai-assistant/ChatwootAIChatSessionRepository';
import { AsyncStorageActiveAIChatSessionStorage } from '@/infrastructure/repositories/ai-assistant/AsyncStorageActiveAIChatSessionStorage';

// ============================================================================
// Use Case Implementations
// ============================================================================

import { FetchBotsUseCase } from '@/application/use-cases/ai-assistant/FetchBotsUseCase';
import { FetchAIChatSessionsUseCase } from '@/application/use-cases/ai-assistant/FetchAIChatSessionsUseCase';
import { GetAIChatSessionUseCase } from '@/application/use-cases/ai-assistant/GetAIChatSessionUseCase';
import { CreateAIChatSessionUseCase } from '@/application/use-cases/ai-assistant/CreateAIChatSessionUseCase';
import { DeleteAIChatSessionUseCase } from '@/application/use-cases/ai-assistant/DeleteAIChatSessionUseCase';
import { LoadAIChatSessionMessagesUseCase } from '@/application/use-cases/ai-assistant/LoadAIChatSessionMessagesUseCase';

/**
 * Register AI Assistant module dependencies
 */
export function registerAIAssistantModule(container: DependencyContainer): void {
  // --------------------------------------------------------------------------
  // Services (Singletons - expensive to create)
  // --------------------------------------------------------------------------

  container.registerSingleton(AI_ASSISTANT_TOKENS.IChatwootApiService, ChatwootApiService);
  container.registerSingleton(AI_ASSISTANT_TOKENS.IAIChatApiService, AIChatApiService);

  // --------------------------------------------------------------------------
  // Mappers (Singletons - stateless, reusable)
  // --------------------------------------------------------------------------

  container.registerSingleton(AI_ASSISTANT_TOKENS.IBotMapper, BotMapper);
  container.registerSingleton(AI_ASSISTANT_TOKENS.IAIChatSessionMapper, AIChatSessionMapper);
  container.registerSingleton(AI_ASSISTANT_TOKENS.IMessageMapper, MessageMapper);

  // --------------------------------------------------------------------------
  // Repositories (Singletons - maintain state/cache)
  // --------------------------------------------------------------------------

  container.registerSingleton(AI_ASSISTANT_TOKENS.IAIBotRepository, ChatwootBotRepository);
  container.registerSingleton(
    AI_ASSISTANT_TOKENS.IAIChatSessionRepository,
    ChatwootAIChatSessionRepository,
  );
  container.registerSingleton(
    AI_ASSISTANT_TOKENS.IActiveAIChatSessionStorage,
    AsyncStorageActiveAIChatSessionStorage,
  );

  // --------------------------------------------------------------------------
  // Use Cases (Transient - new instance per resolve)
  // --------------------------------------------------------------------------

  container.register(AI_ASSISTANT_TOKENS.FetchBotsUseCase, { useClass: FetchBotsUseCase });
  container.register(AI_ASSISTANT_TOKENS.FetchAIChatSessionsUseCase, {
    useClass: FetchAIChatSessionsUseCase,
  });
  container.register(AI_ASSISTANT_TOKENS.GetAIChatSessionUseCase, {
    useClass: GetAIChatSessionUseCase,
  });
  container.register(AI_ASSISTANT_TOKENS.CreateAIChatSessionUseCase, {
    useClass: CreateAIChatSessionUseCase,
  });
  container.register(AI_ASSISTANT_TOKENS.DeleteAIChatSessionUseCase, {
    useClass: DeleteAIChatSessionUseCase,
  });
  container.register(AI_ASSISTANT_TOKENS.LoadAIChatSessionMessagesUseCase, {
    useClass: LoadAIChatSessionMessagesUseCase,
  });
}
