import { Locale } from '../../domain/entities/Locale';
import { OnboardingFlow } from '../../domain/entities/OnboardingFlow';
import type { IOnboardingRepository } from '../../domain/repositories/IOnboardingRepository';
import type { IStorageRepository } from '../../domain/repositories/IStorageRepository';
import { Result } from '../../domain/entities/Result';
import { NetworkError } from '../../domain/entities/Errors';
import { OnboardingFlowMapper } from '../mappers/OnboardingFlowMapper';
import type { OnboardingFlowDTO } from '../dto/OnboardingFlowDTO';

/**
 * Fetch Onboarding Flow Use Case
 *
 * Orchestrates fetching an onboarding flow with caching support.
 * This is the main use case for loading onboarding configuration.
 */
export class FetchOnboardingFlowUseCase {
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds
  private readonly CACHE_KEY_PREFIX = 'onboarding_flow_';

  constructor(
    private readonly onboardingRepository: IOnboardingRepository,
    private readonly storageRepository: IStorageRepository,
  ) {}

  async execute(locale: string): Promise<Result<OnboardingFlow, Error>> {
    try {
      const localeVO: Locale = Locale.create(locale);
      const cacheKey: string = `${this.CACHE_KEY_PREFIX}${localeVO.toString()}`;

      // Try cache first
      const cachedResult: Result<{ flow: OnboardingFlow; cachedAt: number } | null, Error> =
        await this.getCachedFlow(cacheKey);
      if (cachedResult.isSuccess) {
        const cached = cachedResult.getValue();
        if (cached && !this.isCacheExpired(cached)) {
          return Result.ok(cached.flow);
        }
      }

      // Fetch from server
      const fetchResult: Result<OnboardingFlow, Error> =
        await this.onboardingRepository.fetchFlow(localeVO);
      if (fetchResult.isFailure) {
        // If network error, try to serve cached version
        if (fetchResult.getError() instanceof NetworkError) {
          const cached = cachedResult.isSuccess ? cachedResult.getValue() : null;
          if (cached) {
            return Result.ok(cached.flow);
          }
          return fetchResult;
        }
        return fetchResult;
      }

      const flow: OnboardingFlow = fetchResult.getValue();

      // Cache for offline use
      await this.cacheFlow(cacheKey, flow);

      return Result.ok(flow);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Failed to fetch onboarding flow'),
      );
    }
  }

  private async getCachedFlow(
    cacheKey: string,
  ): Promise<Result<{ flow: OnboardingFlow; cachedAt: number } | null, Error>> {
    const result = await this.storageRepository.get<{
      flowDTO: OnboardingFlowDTO;
      cachedAt: number;
    }>(cacheKey);

    if (result.isFailure) {
      return Result.fail(result.getError());
    }

    const cached = result.getValue();
    if (!cached) {
      return Result.ok(null);
    }

    // Re-hydrate the DTO back to a proper OnboardingFlow class instance
    try {
      const flow = OnboardingFlowMapper.toDomain(cached.flowDTO);
      return Result.ok({ flow, cachedAt: cached.cachedAt });
    } catch (error) {
      // If re-hydration fails, return null to force a fresh fetch
      console.warn('Failed to re-hydrate cached flow:', error);
      return Result.ok(null);
    }
  }

  private async cacheFlow(cacheKey: string, flow: OnboardingFlow): Promise<Result<void, Error>> {
    // Convert the flow back to DTO format for storage to preserve structure
    const flowDTO: OnboardingFlowDTO = this.flowToDTO(flow);

    const cacheData = {
      flowDTO,
      cachedAt: Date.now(),
    };

    return this.storageRepository.save(cacheKey, cacheData);
  }

  private flowToDTO(flow: OnboardingFlow): OnboardingFlowDTO {
    return {
      onboarding_flow: {
        id: flow.id,
        version: flow.version.toString(),
        locale: flow.locale.toString(),
        title: flow.title,
        skip_config: flow.skipConfig,
        screens: flow.screens.map(screen => ({
          id: screen.id.toString(),
          type: screen.type,
          title: screen.title,
          description: screen.description,
          placeholder: screen.placeholder,
          options: screen.options,
          validation: screen.validation,
          conditional_logic: screen.conditionalLogic,
          ui_config: screen.uiConfig,
          default_value: screen.defaultValue,
        })),
      },
    };
  }

  private isCacheExpired(cached: { flow: OnboardingFlow; cachedAt: number }): boolean {
    return Date.now() - cached.cachedAt > this.CACHE_TTL;
  }
}
