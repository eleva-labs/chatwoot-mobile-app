/**
 * Dependency Injection Container Configuration
 *
 * This file configures the TSyringe container for the onboarding module.
 * It registers all dependencies and their implementations.
 */

import 'reflect-metadata';
import { container } from 'tsyringe';
import { DI_TOKENS } from './tokens';

// Repositories
import { MockOnboardingRepository } from '../infrastructure/repositories/MockOnboardingRepository';
import { AxiosOnboardingRepository } from '../infrastructure/repositories/AxiosOnboardingRepository';
import { AsyncStorageRepository } from '../infrastructure/repositories/AsyncStorageRepository';

// Services
import { ValidationService } from '../domain/services/ValidationService';

// Repositories
import { OfflineQueueRepository } from '../infrastructure/repositories/OfflineQueueRepository';

export interface OnboardingContainerOptions {
  /**
   * Use mock repository instead of real API (default: false)
   * Set to true for testing or when backend is not available
   */
  useMock?: boolean;

  /**
   * Enable offline queue (default: true)
   */
  enableOfflineQueue?: boolean;
}

/**
 * Configure the DI container for the onboarding module
 */
export function configureOnboardingContainer(
  options: OnboardingContainerOptions = {},
): typeof container {
  const useMock = options.useMock === true || !process.env.EXPO_PUBLIC_S3_BASE_URL; // Fallback to mock when S3 URL is not configured
  const enableOfflineQueue = options.enableOfflineQueue !== false; // Default: true

  // Register repositories
  if (useMock) {
    container.register(DI_TOKENS.IOnboardingRepository, { useClass: MockOnboardingRepository });
  } else {
    container.register(DI_TOKENS.IOnboardingRepository, { useClass: AxiosOnboardingRepository });
  }

  container.register(DI_TOKENS.IStorageRepository, { useClass: AsyncStorageRepository });

  // Register services
  container.register(DI_TOKENS.ValidationService, { useClass: ValidationService });

  // Register offline queue repository if enabled
  if (enableOfflineQueue) {
    container.register(DI_TOKENS.IOfflineQueueRepository, {
      useClass: OfflineQueueRepository,
    });
  }

  // Use cases are @injectable and will auto-resolve their dependencies
  // No need to manually register them - TSyringe will auto-instantiate

  return container;
}

/**
 * Reset the container (useful for testing)
 */
export function resetOnboardingContainer(): void {
  container.clearInstances();
}
