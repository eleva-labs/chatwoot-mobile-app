/**
 * Onboarding Factory
 *
 * Creates and wires up all dependencies for the onboarding module using TSyringe DI container.
 * This factory provides a simple API over the DI container.
 */

import { container } from 'tsyringe';
import {
  configureOnboardingContainer,
  type OnboardingContainerOptions,
} from '../../dependency_injection/container';
import { FetchOnboardingFlowUseCaseImpl } from '../../application/use-cases/FetchOnboardingFlowUseCaseImpl';
import { SubmitOnboardingAnswersUseCaseImpl } from '../../application/use-cases/SubmitOnboardingAnswersUseCaseImpl';
import { SaveProgressUseCaseImpl } from '../../application/use-cases/SaveProgressUseCaseImpl';
import { ValidateAnswerUseCaseImpl } from '../../application/use-cases/ValidateAnswerUseCaseImpl';
import { ProcessOfflineQueueUseCaseImpl } from '../../application/use-cases/ProcessOfflineQueueUseCaseImpl';
import type { IFetchOnboardingFlowUseCase } from '../../domain/use-cases/IFetchOnboardingFlowUseCase';
import type { ISubmitOnboardingAnswersUseCase } from '../../domain/use-cases/ISubmitOnboardingAnswersUseCase';
import type { ISaveProgressUseCase } from '../../domain/use-cases/ISaveProgressUseCase';
import type { IValidateAnswerUseCase } from '../../domain/use-cases/IValidateAnswerUseCase';
import type { IProcessOfflineQueueUseCase } from '../../domain/use-cases/IProcessOfflineQueueUseCase';

export interface OnboardingDependencies {
  fetchFlowUseCase: IFetchOnboardingFlowUseCase;
  submitAnswersUseCase: ISubmitOnboardingAnswersUseCase;
  saveProgressUseCase: ISaveProgressUseCase;
  validateAnswerUseCase: IValidateAnswerUseCase;
  processOfflineQueueUseCase?: IProcessOfflineQueueUseCase;
}

export type OnboardingFactoryOptions = OnboardingContainerOptions;

/**
 * Factory function to create all onboarding dependencies using DI container
 *
 * This configures the DI container and resolves all use cases.
 * Users don't need to know about the internal wiring.
 */
export function createOnboardingDependencies(
  options: OnboardingFactoryOptions = {},
): OnboardingDependencies {
  // Configure the DI container
  configureOnboardingContainer(options);

  // Resolve use cases from the container by class (auto-injection)
  const fetchFlowUseCase = container.resolve(FetchOnboardingFlowUseCaseImpl);
  const submitAnswersUseCase = container.resolve(SubmitOnboardingAnswersUseCaseImpl);
  const saveProgressUseCase = container.resolve(SaveProgressUseCaseImpl);
  const validateAnswerUseCase = container.resolve(ValidateAnswerUseCaseImpl);

  const processOfflineQueueUseCase =
    options.enableOfflineQueue !== false
      ? container.resolve(ProcessOfflineQueueUseCaseImpl)
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
  container.clearInstances();
}
