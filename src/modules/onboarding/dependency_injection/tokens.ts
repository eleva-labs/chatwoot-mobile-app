/**
 * Dependency Injection Tokens
 *
 * These tokens are used to identify dependencies in the DI container.
 * They allow us to inject interfaces instead of concrete implementations.
 */

export const DI_TOKENS = {
  // Repositories
  IOnboardingRepository: Symbol.for('IOnboardingRepository'),
  IStorageRepository: Symbol.for('IStorageRepository'),

  // Services
  ValidationService: Symbol.for('ValidationService'),

  // Repositories
  IOfflineQueueRepository: Symbol.for('IOfflineQueueRepository'),

  // Use Cases
  FetchOnboardingFlowUseCase: Symbol.for('FetchOnboardingFlowUseCase'),
  SubmitOnboardingAnswersUseCase: Symbol.for('SubmitOnboardingAnswersUseCase'),
  SaveProgressUseCase: Symbol.for('SaveProgressUseCase'),
  ValidateAnswerUseCase: Symbol.for('ValidateAnswerUseCase'),
  ProcessOfflineQueueUseCase: Symbol.for('ProcessOfflineQueueUseCase'),
} as const;
