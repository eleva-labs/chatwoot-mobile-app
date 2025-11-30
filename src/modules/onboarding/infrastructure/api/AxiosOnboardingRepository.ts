import { injectable } from 'tsyringe';
import { apiService } from '@/services/APIService';
import type { IOnboardingRepository } from '../../domain/repositories/IOnboardingRepository';
import { Locale } from '../../domain/entities/Locale';
import { OnboardingFlow } from '../../domain/entities/OnboardingFlow';
import { OnboardingFlowMapper } from '../../application/mappers/OnboardingFlowMapper';
import type { OnboardingFlowDTO } from '../../application/dto/OnboardingFlowDTO';
import type { Answers } from '../../domain/common';
import { Result } from '../../domain/entities/Result';
import { NetworkError, NotFoundError } from '../../domain/entities/Errors';
import { AxiosError, AxiosResponse } from 'axios';

/**
 * Axios Onboarding Repository Implementation
 *
 * Uses the existing APIService to fetch and submit onboarding data.
 */
@injectable()
export class AxiosOnboardingRepository implements IOnboardingRepository {
  private readonly BASE_URL = 'onboarding/flows';

  async fetchFlow(locale: Locale): Promise<Result<OnboardingFlow, Error>> {
    try {
      const response: AxiosResponse<OnboardingFlowDTO> = await apiService.get<OnboardingFlowDTO>(
        `${this.BASE_URL}/${locale.toString()}`,
      );

      if (!response.data) {
        return Result.fail(
          new NotFoundError(`Onboarding flow not found for locale: ${locale.toString()}`),
        );
      }

      const flow: OnboardingFlow = OnboardingFlowMapper.toDomain(response.data);
      return Result.ok(flow);
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          return Result.fail(
            new NotFoundError(`Onboarding flow not found for locale: ${locale.toString()}`),
          );
        }
        return Result.fail(
          new NetworkError(`Failed to fetch onboarding flow: ${error.message}`, error),
        );
      }

      return Result.fail(
        error instanceof Error ? error : new NetworkError('Failed to fetch onboarding flow'),
      );
    }
  }

  async submitAnswers(flowId: string, answers: Answers): Promise<Result<void, Error>> {
    try {
      await apiService.post<void>(`${this.BASE_URL}/${flowId}/submit`, {
        answers,
      });

      return Result.ok(undefined);
    } catch (error) {
      if (error instanceof AxiosError) {
        return Result.fail(new NetworkError(`Failed to submit answers: ${error.message}`, error));
      }

      return Result.fail(
        error instanceof Error ? error : new NetworkError('Failed to submit answers'),
      );
    }
  }

  async validateField(
    fieldId: string,
    value: unknown,
  ): Promise<Result<{ valid: boolean; message?: string }, Error>> {
    try {
      const response: AxiosResponse<{
        valid: boolean;
        message?: string;
      }> = await apiService.post<{
        valid: boolean;
        message?: string;
      }>(`onboarding/validate/${fieldId}`, {
        value,
      });

      return Result.ok(response.data);
    } catch (error) {
      if (error instanceof AxiosError) {
        return Result.fail(new NetworkError(`Failed to validate field: ${error.message}`, error));
      }

      return Result.fail(
        error instanceof Error ? error : new NetworkError('Failed to validate field'),
      );
    }
  }
}
