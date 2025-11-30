import { Answer } from '../entities/Answer';
import type { ValidationRule } from '../common';
import { Result } from '../entities/Result';

/**
 * Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validation Service Interface
 *
 * Defines the contract for validating answers against rules.
 */
export interface IValidationService {
  /**
   * Validate an answer against validation rules
   */
  validate(answer: Answer, rule: ValidationRule): Result<ValidationResult, Error>;

  /**
   * Validate a raw value against validation rules (for pre-submission validation)
   */
  validateValue(
    value: unknown,
    rule: ValidationRule,
    questionType: string,
  ): Result<ValidationResult, Error>;
}
