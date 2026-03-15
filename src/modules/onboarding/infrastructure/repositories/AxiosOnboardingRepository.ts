import { injectable } from 'tsyringe';
import { apiService } from '@infrastructure/services/APIService';
import type { IOnboardingRepository } from '../../domain/repositories/IOnboardingRepository';
import { Locale } from '../../domain/entities/Locale';
import { OnboardingFlow } from '../../domain/entities/OnboardingFlow';
import { OnboardingFlowMapper } from '../../application/mappers/OnboardingFlowMapper';
import type { OnboardingFlowDTO } from '../../application/dto/OnboardingFlowDTO';
import type { Answers } from '../../domain/common';
import { Result } from '../../domain/entities/Result';
import { NetworkError, NotFoundError, DomainError } from '../../domain/entities/Errors';
import { AxiosError, AxiosResponse } from 'axios';

/**
 * Axios Onboarding Repository Implementation
 *
 * Fetches onboarding flows from any URL given.
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
      let s3Url: string | undefined;
      try {
        s3Url = `${this.getS3BaseUrl()}/onboarding/${localeStr}.json`;
      } catch (urlError) {
        return Result.fail(
          new NetworkError(
            urlError instanceof Error
              ? urlError.message
              : 'S3_BASE_URL environment variable is not set',
            urlError instanceof Error ? urlError : undefined,
          ),
        );
      }

      let response: Response;
      try {
        response = await fetch(s3Url);
      } catch (fetchError) {
        // Handle fetch errors (network failures, etc.)
        return Result.fail(
          new NetworkError(
            `Failed to fetch onboarding flow: ${fetchError instanceof Error ? fetchError.message : 'Network error'}`,
            fetchError instanceof Error ? fetchError : undefined,
          ),
        );
      }

      // Check response status
      // Response interface has ok and status properties
      // Access them directly - Jest mocks should set these properties
      if (!response.ok) {
        const status = response.status;
        if (status === 404) {
          return Result.fail(
            new NotFoundError(`Onboarding flow not found for locale: ${localeStr}`),
          );
        }
        return Result.fail(
          new NetworkError(
            `Failed to fetch onboarding flow: HTTP ${status} ${response.statusText || ''}`,
          ),
        );
      }

      let data: OnboardingFlowDTO;
      try {
        data = await response.json();
      } catch {
        // If json parsing fails, treat as not found
        return Result.fail(new NotFoundError(`Onboarding flow not found for locale: ${localeStr}`));
      }

      if (!data || !data.onboarding_flow) {
        return Result.fail(new NotFoundError(`Onboarding flow not found for locale: ${localeStr}`));
      }

      try {
        const flow: OnboardingFlow = OnboardingFlowMapper.toDomain(data);
        return Result.ok(flow);
      } catch (mapperError) {
        // If mapper throws DomainError, preserve it
        if (mapperError instanceof DomainError) {
          return Result.fail(mapperError);
        }
        // Otherwise wrap in NetworkError
        return Result.fail(
          new NetworkError(
            `Failed to map onboarding flow: ${mapperError instanceof Error ? mapperError.message : 'Unknown error'}`,
            mapperError instanceof Error ? mapperError : undefined,
          ),
        );
      }
    } catch (error) {
      // Preserve specific error types
      if (error instanceof NotFoundError || error instanceof DomainError) {
        return Result.fail(error);
      }

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
