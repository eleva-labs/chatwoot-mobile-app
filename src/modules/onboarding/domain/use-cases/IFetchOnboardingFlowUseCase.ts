import { Result } from '../entities/Result';
import { OnboardingFlow } from '../entities/OnboardingFlow';

/**
 * Fetch Onboarding Flow Use Case Interface
 *
 * Orchestrates fetching an onboarding flow with caching support.
 */
export interface IFetchOnboardingFlowUseCase {
  execute(locale: string): Promise<Result<OnboardingFlow, Error>>;
}
