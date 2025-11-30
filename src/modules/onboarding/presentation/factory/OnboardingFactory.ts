/**
 * Onboarding Factory
 *
 * Creates and wires up all dependencies for the onboarding module.
 * This factory handles all the complexity of creating repositories, services, and use cases.
 */

import { AxiosOnboardingRepository } from '../../infrastructure/api/AxiosOnboardingRepository';
import { MockOnboardingRepository } from '../../infrastructure/api/MockOnboardingRepository';
import { AsyncStorageRepository } from '../../infrastructure/storage/AsyncStorageRepository';
import { ValidationService } from '../../domain/services/ValidationService';
import { FetchOnboardingFlowUseCase } from '../../application/use-cases/FetchOnboardingFlow';
import { SubmitOnboardingAnswersUseCase } from '../../application/use-cases/SubmitOnboardingAnswers';
import { SaveProgressUseCase } from '../../application/use-cases/SaveProgress';
import { ValidateAnswerUseCase } from '../../application/use-cases/ValidateAnswer';
import { OfflineQueue } from '../../infrastructure/queue/OfflineQueue';
import { ProcessOfflineQueueUseCase } from '../../application/use-cases/ProcessOfflineQueue';
import type { IOnboardingRepository } from '../../domain/repositories/IOnboardingRepository';
import type { IStorageRepository } from '../../domain/repositories/IStorageRepository';

export interface OnboardingDependencies {
  fetchFlowUseCase: FetchOnboardingFlowUseCase;
  submitAnswersUseCase: SubmitOnboardingAnswersUseCase;
  saveProgressUseCase: SaveProgressUseCase;
  validateAnswerUseCase: ValidateAnswerUseCase;
  processOfflineQueueUseCase?: ProcessOfflineQueueUseCase;
}

export interface OnboardingFactoryOptions {
  /**
   * Custom onboarding repository (optional)
   * If not provided, uses MockOnboardingRepository
   */
  onboardingRepository?: IOnboardingRepository;

  /**
   * Custom storage repository (optional)
   * If not provided, uses AsyncStorageRepository
   */
  storageRepository?: IStorageRepository;

  /**
   * Enable offline queue (default: true)
   */
  enableOfflineQueue?: boolean;

  /**
   * Use mock repository instead of real API (default: true)
   * Set to false when backend is ready
   */
  useMock?: boolean;
}

/**
 * Factory function to create all onboarding dependencies
 *
 * This handles all the complexity of wiring up repositories, services, and use cases.
 * Users don't need to know about these internal details.
 */
export function createOnboardingDependencies(
  options: OnboardingFactoryOptions = {},
): OnboardingDependencies {
  // Create repositories with defaults
  // Use mock repository by default until backend is ready
  const useMock = options.useMock !== false; // Default: true
  const onboardingRepository =
    options.onboardingRepository ||
    (useMock ? new MockOnboardingRepository() : new AxiosOnboardingRepository());
  const storageRepository = options.storageRepository || new AsyncStorageRepository();

  // Create domain services
  const validationService = new ValidationService();

  // Create offline queue if enabled
  const enableOfflineQueue = options.enableOfflineQueue !== false; // Default: true
  const offlineQueue = enableOfflineQueue ? new OfflineQueue(storageRepository) : undefined;

  // Create use cases
  const fetchFlowUseCase = new FetchOnboardingFlowUseCase(onboardingRepository, storageRepository);

  const submitAnswersUseCase = new SubmitOnboardingAnswersUseCase(
    onboardingRepository,
    offlineQueue, // Pass offline queue if enabled
  );

  const saveProgressUseCase = new SaveProgressUseCase(storageRepository);

  const validateAnswerUseCase = new ValidateAnswerUseCase(validationService);

  const processOfflineQueueUseCase = offlineQueue
    ? new ProcessOfflineQueueUseCase(onboardingRepository, offlineQueue)
    : undefined;

  return {
    fetchFlowUseCase,
    submitAnswersUseCase,
    saveProgressUseCase,
    validateAnswerUseCase,
    processOfflineQueueUseCase,
  };
}

/**
 * Singleton instance for default dependencies
 * Can be used when you want to reuse the same dependencies across the app
 */
let defaultDependencies: OnboardingDependencies | null = null;

/**
 * Get or create default dependencies
 * Useful for apps that want to reuse the same dependencies
 */
export function getDefaultOnboardingDependencies(
  options?: OnboardingFactoryOptions,
): OnboardingDependencies {
  if (!defaultDependencies || options) {
    defaultDependencies = createOnboardingDependencies(options);
  }
  return defaultDependencies;
}

/**
 * Reset default dependencies (useful for testing)
 */
export function resetDefaultOnboardingDependencies(): void {
  defaultDependencies = null;
}
