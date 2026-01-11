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
    console.log('[SubmitOnboardingAnswersUseCase] execute - Starting submission');
    console.log('[SubmitOnboardingAnswersUseCase] Flow ID:', flowId);
    console.log('[SubmitOnboardingAnswersUseCase] Answers count:', Object.keys(answers).length);

    try {
      const result: Result<void, Error> = await this.onboardingRepository.submitAnswers(
        flowId,
        answers,
      );

      if (result.isFailure) {
        // Handle specific error types
        const error: Error = result.getError();

        // DEBUG: Log the actual error before handling
        console.error('[SubmitOnboardingAnswersUseCase] Submission failed with error:');
        console.error('[SubmitOnboardingAnswersUseCase] - Error name:', error.name);
        console.error('[SubmitOnboardingAnswersUseCase] - Error message:', error.message);
        console.error('[SubmitOnboardingAnswersUseCase] - Error stack:', error.stack);
        if (error instanceof NetworkError && error.cause) {
          console.error('[SubmitOnboardingAnswersUseCase] - Original cause:', error.cause);
        }

        if (error instanceof NetworkError) {
          // Queue for offline submission if offline queue is available
          if (this.offlineQueue) {
            console.log('[SubmitOnboardingAnswersUseCase] Attempting to queue for offline submission');
            const queueResult: Result<void, Error> = await this.offlineQueue.enqueue(
              flowId,
              answers,
            );
            if (queueResult.isSuccess) {
              console.log('[SubmitOnboardingAnswersUseCase] Successfully queued for offline submission');
              return Result.fail(
                new NetworkError(
                  'No internet connection. Answers will be submitted when you come back online.',
                  error,
                ),
              );
            }
            console.error('[SubmitOnboardingAnswersUseCase] Failed to queue for offline submission');
          }

          return Result.fail(
            new NetworkError('Failed to submit answers. Please check your connection.', error),
          );
        }
      }

      console.log('[SubmitOnboardingAnswersUseCase] Submission completed successfully');
      return result;
    } catch (error) {
      console.error('[SubmitOnboardingAnswersUseCase] Unexpected exception:', error);
      return Result.fail(
        error instanceof Error ? error : new Error('Failed to submit onboarding answers'),
      );
    }
  }
}
