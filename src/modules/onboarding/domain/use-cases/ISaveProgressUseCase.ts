import { Result } from '../entities/Result';
import { Answers } from '../common';

/**
 * Save Progress Use Case Interface
 *
 * Saves onboarding progress locally so users can resume later.
 */
export interface ISaveProgressUseCase {
  execute(flowId: string, currentStep: number, answers: Answers): Promise<Result<void, Error>>;

  loadProgress(
    flowId: string,
  ): Promise<Result<{ flowId: string; currentStep: number; answers: Answers } | null, Error>>;

  clearProgress(flowId: string): Promise<Result<void, Error>>;
}
