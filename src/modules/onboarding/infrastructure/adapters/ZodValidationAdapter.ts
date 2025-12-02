import { onboardingFlowSchema } from '../models/schemas/OnboardingFlowSchema';
import type { OnboardingFlowDTO } from '../../application/dto/OnboardingFlowDTO';
import { Result } from '../../domain/entities/Result';
import { ValidationError } from '../../domain/entities/Errors';
import { ZodError, ZodIssue } from 'zod';

/**
 * Zod Validation Adapter
 *
 * Validates JSON configuration from the server using Zod schemas.
 */
export class ZodValidationAdapter {
  /**
   * Validate onboarding flow DTO
   */
  static validateFlowDTO(data: unknown): Result<OnboardingFlowDTO, ValidationError> {
    try {
      const validated = onboardingFlowSchema.parse(data);
      return Result.ok(validated as OnboardingFlowDTO);
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues
          .map((issue: ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
          .join(', ');
        return Result.fail(
          new ValidationError(
            `Invalid onboarding flow configuration: ${message}`,
            undefined,
            error.issues,
          ),
        );
      }

      return Result.fail(
        new ValidationError('Failed to validate onboarding flow configuration', undefined, error),
      );
    }
  }

  /**
   * Safe parse - returns result without throwing
   */
  static safeParseFlowDTO(data: unknown): Result<OnboardingFlowDTO, ValidationError> {
    const result = onboardingFlowSchema.safeParse(data);

    if (result.success) {
      return Result.ok(result.data as OnboardingFlowDTO);
    }

    const message = result.error.issues
      .map((issue: ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');

    return Result.fail(
      new ValidationError(
        `Invalid onboarding flow configuration: ${message}`,
        undefined,
        result.error.issues,
      ),
    );
  }
}
