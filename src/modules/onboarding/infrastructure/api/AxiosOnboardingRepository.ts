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
 * Fetches onboarding flows from S3 buckets and submits answers via API.
 */
@injectable()
export class AxiosOnboardingRepository implements IOnboardingRepository {
  private readonly BASE_URL = 'onboarding/flows';

  /**
   * Gets the S3 base URL from environment variable
   */
  private getS3BaseUrl(): string {
    // Try EXPO_PUBLIC_S3_BASE_URL first (Expo convention for public env vars)
    const s3BaseUrl = process.env.EXPO_PUBLIC_S3_BASE_URL || process.env.S3_BASE_URL;

    if (!s3BaseUrl) {
      throw new Error(
        'S3_BASE_URL environment variable is not set. Please set EXPO_PUBLIC_S3_BASE_URL or S3_BASE_URL in your environment configuration.',
      );
    }

    return s3BaseUrl;
  }

  /**
   * Fetches onboarding flow from S3 bucket
   */
  async fetchFlow(locale: Locale): Promise<Result<OnboardingFlow, Error>> {
    try {
      const localeStr = locale.toString();
      const s3Url = `${this.getS3BaseUrl()}/onboarding/${localeStr}.json`;

      const response = await fetch(s3Url);

      if (!response.ok) {
        if (response.status === 404) {
          return Result.fail(
            new NotFoundError(`Onboarding flow not found for locale: ${localeStr}`),
          );
        }
        return Result.fail(
          new NetworkError(
            `Failed to fetch onboarding flow: HTTP ${response.status} ${response.statusText}`,
          ),
        );
      }

      const data: OnboardingFlowDTO = await response.json();

      if (!data) {
        return Result.fail(new NotFoundError(`Onboarding flow not found for locale: ${localeStr}`));
      }

      const flow: OnboardingFlow = OnboardingFlowMapper.toDomain(data);
      return Result.ok(flow);
    } catch (error) {
      if (error instanceof Error) {
        // Check if it's a network error (fetch failures)
        if (error.message.includes('fetch') || error.message.includes('network')) {
          return Result.fail(
            new NetworkError(`Failed to fetch onboarding flow: ${error.message}`, error),
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
