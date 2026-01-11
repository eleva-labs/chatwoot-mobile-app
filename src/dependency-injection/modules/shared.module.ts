/**
 * Shared Module - DI Registration
 *
 * Registers shared infrastructure dependencies used across features.
 */

import type { DependencyContainer } from 'tsyringe';
import { SHARED_TOKENS } from '../tokens';

// Repository Implementations
import { ReduxAuthRepository } from '@/infrastructure/repositories/shared/ReduxAuthRepository';
import { ReduxSettingsRepository } from '@/infrastructure/repositories/shared/ReduxSettingsRepository';
import { ReduxStateRepository } from '@/infrastructure/repositories/shared/ReduxStateRepository';

// Service Implementations
import { AIChatConfigService } from '@/infrastructure/services/shared/AIChatConfigService';

/**
 * Register shared module dependencies
 */
export function registerSharedModule(container: DependencyContainer): void {
  // --------------------------------------------------------------------------
  // Repositories (Singletons - shared across app)
  // --------------------------------------------------------------------------

  container.registerSingleton(SHARED_TOKENS.IAuthRepository, ReduxAuthRepository);
  container.registerSingleton(SHARED_TOKENS.ISettingsRepository, ReduxSettingsRepository);
  container.registerSingleton(SHARED_TOKENS.IStateRepository, ReduxStateRepository);

  // --------------------------------------------------------------------------
  // Services (Singletons - shared across app)
  // --------------------------------------------------------------------------

  container.registerSingleton(SHARED_TOKENS.IAIChatConfigService, AIChatConfigService);
}
