/**
 * AI Assistant Factory
 *
 * Creates and wires up all dependencies for the AI Assistant module.
 * Follows the OnboardingFactory pattern for consistency.
 */

import { container } from 'tsyringe';

// Use Case Implementations
import { FetchBotsUseCase } from '@/application/use-cases/ai-assistant/FetchBotsUseCase';
import { FetchAIChatSessionsUseCase } from '@/application/use-cases/ai-assistant/FetchAIChatSessionsUseCase';
import { GetAIChatSessionUseCase } from '@/application/use-cases/ai-assistant/GetAIChatSessionUseCase';
import { CreateAIChatSessionUseCase } from '@/application/use-cases/ai-assistant/CreateAIChatSessionUseCase';
import { DeleteAIChatSessionUseCase } from '@/application/use-cases/ai-assistant/DeleteAIChatSessionUseCase';
import { LoadAIChatSessionMessagesUseCase } from '@/application/use-cases/ai-assistant/LoadAIChatSessionMessagesUseCase';

// Use Case Interfaces
import type {
  IFetchBotsUseCase,
  IFetchAIChatSessionsUseCase,
  IGetAIChatSessionUseCase,
  ICreateAIChatSessionUseCase,
  IDeleteAIChatSessionUseCase,
  ILoadAIChatSessionMessagesUseCase,
} from '@/domain/interfaces/use-cases/ai-assistant';

/**
 * AI Assistant Dependencies Interface
 */
export interface AIAssistantDependencies {
  fetchBotsUseCase: IFetchBotsUseCase;
  fetchSessionsUseCase: IFetchAIChatSessionsUseCase;
  getSessionUseCase: IGetAIChatSessionUseCase;
  createSessionUseCase: ICreateAIChatSessionUseCase;
  deleteSessionUseCase: IDeleteAIChatSessionUseCase;
  loadMessagesUseCase: ILoadAIChatSessionMessagesUseCase;
}

/**
 * Create all AI Assistant dependencies from DI container
 */
export function createAIAssistantDependencies(): AIAssistantDependencies {
  return {
    fetchBotsUseCase: container.resolve(FetchBotsUseCase),
    fetchSessionsUseCase: container.resolve(FetchAIChatSessionsUseCase),
    getSessionUseCase: container.resolve(GetAIChatSessionUseCase),
    createSessionUseCase: container.resolve(CreateAIChatSessionUseCase),
    deleteSessionUseCase: container.resolve(DeleteAIChatSessionUseCase),
    loadMessagesUseCase: container.resolve(LoadAIChatSessionMessagesUseCase),
  };
}

/** Singleton instance */
let defaultDependencies: AIAssistantDependencies | null = null;

/**
 * Get or create default dependencies (singleton)
 */
export function getDefaultAIAssistantDependencies(): AIAssistantDependencies {
  if (!defaultDependencies) {
    defaultDependencies = createAIAssistantDependencies();
  }
  return defaultDependencies;
}

/**
 * Reset dependencies (for testing)
 */
export function resetDefaultAIAssistantDependencies(): void {
  defaultDependencies = null;
}
