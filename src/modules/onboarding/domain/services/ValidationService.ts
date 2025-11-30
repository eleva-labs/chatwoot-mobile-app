import { Answer } from '../entities/Answer';
import type { ValidationRule } from '../common';
import { Result } from '../entities/Result';
import { ValidationError } from '../entities/Errors';
import type { IValidationService, ValidationResult } from './IValidationService';

/**
 * Validation Service Implementation
 *
 * Validates answers against validation rules.
 * Pure domain logic with no external dependencies.
 */
export class ValidationService implements IValidationService {
  validate(answer: Answer, rule: ValidationRule): Result<ValidationResult, Error> {
    try {
      return this.validateValue(answer.value, rule, 'unknown');
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new ValidationError('Validation failed', undefined, error),
      );
    }
  }

  validateValue(
    value: unknown,
    rule: ValidationRule,
    questionType: string,
  ): Result<ValidationResult, Error> {
    const errors: string[] = [];

    try {
      // Required validation
      if (rule.required) {
        if (this.isEmpty(value)) {
          errors.push(rule.error_message || 'This field is required');
          return Result.ok({ valid: false, errors });
        }
      }

      // If not required and empty, skip other validations
      if (!rule.required && this.isEmpty(value)) {
        return Result.ok({ valid: true, errors: [] });
      }

      // Type-specific validations
      if (typeof value === 'string') {
        this.validateString(value, rule, errors);
      } else if (Array.isArray(value)) {
        this.validateArray(value, rule, errors);
      } else if (typeof value === 'number') {
        this.validateNumber(value, rule, errors);
      }

      // Pattern validation (for strings)
      if (typeof value === 'string' && rule.pattern) {
        const regex = new RegExp(rule.pattern);
        if (!regex.test(value)) {
          errors.push(rule.error_message || 'Value does not match required pattern');
        }
      }

      return Result.ok({
        valid: errors.length === 0,
        errors,
      });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new ValidationError('Validation error', undefined, error),
      );
    }
  }

  private isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    return false;
  }

  private validateString(value: string, rule: ValidationRule, errors: string[]): void {
    if (rule.min_length !== undefined && value.length < rule.min_length) {
      errors.push(`Minimum length is ${rule.min_length} characters`);
    }

    if (rule.max_length !== undefined && value.length > rule.max_length) {
      errors.push(`Maximum length is ${rule.max_length} characters`);
    }
  }

  private validateArray(value: unknown[], rule: ValidationRule, errors: string[]): void {
    if (rule.max_selection !== undefined && value.length > rule.max_selection) {
      errors.push(`Maximum ${rule.max_selection} selection(s) allowed`);
    }
  }

  private validateNumber(value: number, rule: ValidationRule, errors: string[]): void {
    if (rule.min_rating !== undefined && value < rule.min_rating) {
      errors.push(`Minimum rating is ${rule.min_rating}`);
    }
  }
}
