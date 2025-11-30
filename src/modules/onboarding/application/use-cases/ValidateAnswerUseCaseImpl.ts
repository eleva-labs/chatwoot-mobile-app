import { injectable, inject } from 'tsyringe';
import { Answer } from '../../domain/entities/Answer';
import { QuestionId } from '../../domain/entities/QuestionId';
import type {
  IValidationService,
  ValidationResult,
} from '../../domain/services/IValidationService';
import type { AnswerValue, ValidationRule } from '../../domain/common';
import { Result } from '../../domain/entities/Result';
import { DI_TOKENS } from '../../di/tokens';
import type { IValidateAnswerUseCase } from '../../domain/use-cases/IValidateAnswerUseCase';

/**
 * Validate Answer Use Case
 *
 * Orchestrates answer validation against validation rules.
 */
@injectable()
export class ValidateAnswerUseCaseImpl implements IValidateAnswerUseCase {
  constructor(
    @inject(DI_TOKENS.ValidationService) private readonly validationService: IValidationService,
  ) {}

  async execute(
    questionId: string,
    value: unknown,
    rule: ValidationRule,
    questionType: string,
  ): Promise<Result<{ valid: boolean; errors: string[] }, Error>> {
    try {
      const questionIdVO: QuestionId = QuestionId.create(questionId);
      const answer: Answer = new Answer(questionIdVO, value as AnswerValue);

      const validationResult: Result<ValidationResult, Error> = this.validationService.validate(
        answer,
        rule,
      );

      if (validationResult.isFailure) {
        return validationResult;
      }

      const result: { valid: boolean; errors: string[] } = validationResult.getValue();
      return Result.ok(result);
    } catch (error) {
      // Fallback to value validation if Answer creation fails
      const validationResult = this.validationService.validateValue(value, rule, questionType);

      if (validationResult.isFailure) {
        return Result.fail(error instanceof Error ? error : new Error('Validation failed'));
      }

      return validationResult;
    }
  }
}
