import { useState, useCallback } from 'react';
import { ValidateAnswerUseCase } from '../../application/use-cases/ValidateAnswer';
import type { ValidationRule } from '../../domain/common';
import { Result } from '../../domain/entities/Result';

export interface UseValidationReturn {
  errors: Record<string, string[]>;
  validate: (
    questionId: string,
    value: unknown,
    rule: ValidationRule,
    questionType: string,
  ) => Promise<boolean>;
  clearError: (questionId: string) => void;
  clearAllErrors: () => void;
  hasErrors: boolean;
  getError: (questionId: string) => string | undefined;
}

/**
 * Hook for validating answers
 */
export function useValidation(validateAnswerUseCase: ValidateAnswerUseCase): UseValidationReturn {
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const validate: (
    questionId: string,
    value: unknown,
    rule: ValidationRule,
    questionType: string,
  ) => Promise<boolean> = useCallback(
    async (
      questionId: string,
      value: unknown,
      rule: ValidationRule,
      questionType: string,
    ): Promise<boolean> => {
      const result: Result<{ valid: boolean; errors: string[] }, Error> =
        await validateAnswerUseCase.execute(questionId, value, rule, questionType);

      return result.match(
        validationResult => {
          if (validationResult.valid) {
            // Clear error if validation passes
            setErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors[questionId];
              return newErrors;
            });
            return true;
          } else {
            // Set errors if validation fails
            setErrors(prev => ({
              ...prev,
              [questionId]: validationResult.errors,
            }));
            return false;
          }
        },
        () => {
          // On error, assume invalid
          setErrors(prev => ({
            ...prev,
            [questionId]: ['Validation failed'],
          }));
          return false;
        },
      );
    },
    [validateAnswerUseCase],
  );

  const clearError: (questionId: string) => void = useCallback((questionId: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[questionId];
      return newErrors;
    });
  }, []);

  const clearAllErrors: () => void = useCallback(() => {
    setErrors({});
  }, []);

  const hasErrors: boolean = Object.keys(errors).length > 0;

  const getError: (questionId: string) => string | undefined = useCallback(
    (questionId: string): string | undefined => {
      const questionErrors: string[] | undefined = errors[questionId];
      return questionErrors && questionErrors.length > 0 ? questionErrors[0] : undefined;
    },
    [errors],
  );

  return {
    errors,
    validate,
    clearError,
    clearAllErrors,
    hasErrors,
    getError,
  };
}
