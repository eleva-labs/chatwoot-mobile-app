import { Result } from '../entities/Result';
import { ValidationRule } from '../common';

/**
 * Validate Answer Use Case Interface
 *
 * Orchestrates answer validation against validation rules.
 */
export interface IValidateAnswerUseCase {
  execute(
    questionId: string,
    value: unknown,
    rule: ValidationRule,
    questionType: string,
  ): Promise<Result<{ valid: boolean; errors: string[] }, Error>>;
}
