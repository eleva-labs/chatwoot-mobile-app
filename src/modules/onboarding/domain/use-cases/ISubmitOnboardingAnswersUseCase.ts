import { Result } from '../entities/Result';
import { Answers } from '../common';

/**
 * Submit Onboarding Answers Use Case Interface
 *
 * Orchestrates submitting answers to the server.
 * Handles retry logic, error recovery, and offline queueing.
 */
export interface ISubmitOnboardingAnswersUseCase {
  execute(flowId: string, answers: Answers): Promise<Result<void, Error>>;
}
