import { injectable, inject } from 'tsyringe';
import type { IOnboardingRepository } from '../../domain/repositories/IOnboardingRepository';
import type { IOfflineQueueRepository } from '../../domain/repositories/IOfflineQueueRepository';
import type { Answers } from '../../domain/common';
import { Result } from '../../domain/entities/Result';
import { NetworkError } from '../../domain/entities/Errors';
import { DI_TOKENS } from '../../dependency_injection/tokens';
import type { ISubmitOnboardingAnswersUseCase } from '../../domain/use-cases/ISubmitOnboardingAnswersUseCase';

/**
 * Submit Onboarding Answers Use Case
 *
 * Orchestrates submitting answers to the server.
 * Handles retry logic, error recovery, and offline queueing.
 */
@injectable()
export class SubmitOnboardingAnswersUseCaseImpl implements ISubmitOnboardingAnswersUseCase {
  constructor(
    @inject(DI_TOKENS.IOnboardingRepository)
    private readonly onboardingRepository: IOnboardingRepository,
    @inject(DI_TOKENS.IOfflineQueueRepository)
    private readonly offlineQueue?: IOfflineQueueRepository,
  ) {}

  async execute(flowId: string, answers: Answers): Promise<Result<void, Error>> {
    try {
      const result: Result<void, Error> = await this.onboardingRepository.submitAnswers(
        flowId,
        answers,
      );

      if (result.isFailure) {
        // Handle specific error types
        const error: Error = result.getError();
        if (error instanceof NetworkError) {
          // Queue for offline submission if offline queue is available
          if (this.offlineQueue) {
            const queueResult: Result<void, Error> = await this.offlineQueue.enqueue(
              flowId,
              answers,
            );
            if (queueResult.isSuccess) {
              return Result.fail(
                new NetworkError(
                  'No internet connection. Answers will be submitted when you come back online.',
                  error,
                ),
              );
            }
          }

          return Result.fail(
            new NetworkError('Failed to submit answers. Please check your connection.', error),
          );
        }
      }

      return result;
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Failed to submit onboarding answers'),
      );
    }
  }
}
