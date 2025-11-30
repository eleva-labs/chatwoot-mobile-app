import { Locale } from '../entities/Locale';
import { OnboardingFlow } from '../entities/OnboardingFlow';
import type { Answers } from '../common';
import { Result } from '../entities/Result';

/**
 * Onboarding Repository Interface (Port)
 *
 * Defines the contract for fetching and submitting onboarding data.
 * Implementations will be in the infrastructure layer.
 */
export interface IOnboardingRepository {
  /**
   * Fetch onboarding flow for a given locale
   */
  fetchFlow(locale: Locale): Promise<Result<OnboardingFlow, Error>>;

  /**
   * Submit answers for a flow
   */
  submitAnswers(flowId: string, answers: Answers): Promise<Result<void, Error>>;

  /**
   * Validate a field value asynchronously (if async validation is configured)
   */
  validateField(
    fieldId: string,
    value: unknown,
  ): Promise<Result<{ valid: boolean; message?: string }, Error>>;
}
