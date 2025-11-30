import type { IOnboardingRepository } from '../../domain/repositories/IOnboardingRepository';
import { OfflineQueue } from '../../infrastructure/queue/OfflineQueue';
import type { Answers } from '../../domain/common';
import { Result } from '../../domain/entities/Result';
import { NetworkError } from '../../domain/entities/Errors';

/**
 * Submit Onboarding Answers Use Case
 *
 * Orchestrates submitting answers to the server.
 * Handles retry logic, error recovery, and offline queueing.
 */
export class SubmitOnboardingAnswersUseCase {
  constructor(
    private readonly onboardingRepository: IOnboardingRepository,
    private readonly offlineQueue?: OfflineQueue,
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
