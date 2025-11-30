/**
 * Tests for useValidation Hook
 *
 * useValidation manages validation errors for onboarding questions.
 * It validates answers using ValidateAnswerUseCase and tracks errors per question.
 */

// eslint-disable-next-line import/no-unresolved
import { renderHook, act } from '@testing-library/react-hooks';
import { useValidation } from '../../../presentation/hooks/useValidation';
import type { IValidateAnswerUseCase } from '../../../domain/use-cases/IValidateAnswerUseCase';
import { Result } from '../../../domain/entities/Result';
import type { ValidationRule } from '../../../domain/common';

describe('useValidation', () => {
  let mockValidateUseCase: jest.Mocked<IValidateAnswerUseCase>;

  beforeEach(() => {
    mockValidateUseCase = {
      execute: jest.fn(),
    } as jest.Mocked<IValidateAnswerUseCase>;
  });

  describe('Initial state', () => {
    it('should initialize with no errors', () => {
      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      expect(result.current.errors).toEqual({});
      expect(result.current.hasErrors).toBe(false);
    });

    it('should provide all required methods', () => {
      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      expect(typeof result.current.validate).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.clearAllErrors).toBe('function');
      expect(typeof result.current.getError).toBe('function');
    });
  });

  describe('validate()', () => {
    const rule: ValidationRule = {
      required: true,
      error_message: 'This field is required',
    };

    it('should return true when validation passes', async () => {
      mockValidateUseCase.execute.mockResolvedValue(Result.ok({ valid: true, errors: [] }));

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      let isValid: boolean = false;
      await act(async () => {
        isValid = await result.current.validate('q1', 'value', rule, 'text');
      });

      expect(isValid).toBe(true);
      expect(result.current.errors).toEqual({});
      expect(result.current.hasErrors).toBe(false);
    });

    it('should return false when validation fails', async () => {
      mockValidateUseCase.execute.mockResolvedValue(
        Result.ok({ valid: false, errors: ['Field is required'] }),
      );

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      let isValid: boolean = true;
      await act(async () => {
        isValid = await result.current.validate('q1', '', rule, 'text');
      });

      expect(isValid).toBe(false);
      expect(result.current.errors).toEqual({
        q1: ['Field is required'],
      });
      expect(result.current.hasErrors).toBe(true);
    });

    it('should store multiple error messages for a question', async () => {
      mockValidateUseCase.execute.mockResolvedValue(
        Result.ok({
          valid: false,
          errors: ['Too short', 'Invalid format'],
        }),
      );

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      await act(async () => {
        await result.current.validate('q1', 'ab', rule, 'text');
      });

      expect(result.current.errors.q1).toEqual(['Too short', 'Invalid format']);
    });

    it('should handle validation errors gracefully', async () => {
      mockValidateUseCase.execute.mockResolvedValue(
        Result.fail(new Error('Validation service error')),
      );

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      let isValid: boolean = true;
      await act(async () => {
        isValid = await result.current.validate('q1', 'value', rule, 'text');
      });

      expect(isValid).toBe(false);
      expect(result.current.errors).toEqual({
        q1: ['Validation failed'],
      });
    });

    it('should clear error when validation passes after failure', async () => {
      mockValidateUseCase.execute
        .mockResolvedValueOnce(Result.ok({ valid: false, errors: ['Error'] }))
        .mockResolvedValueOnce(Result.ok({ valid: true, errors: [] }));

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      // First validation fails
      await act(async () => {
        await result.current.validate('q1', '', rule, 'text');
      });

      expect(result.current.errors.q1).toEqual(['Error']);

      // Second validation passes
      await act(async () => {
        await result.current.validate('q1', 'valid', rule, 'text');
      });

      expect(result.current.errors.q1).toBeUndefined();
      expect(result.current.hasErrors).toBe(false);
    });

    it('should call use case with correct parameters', async () => {
      mockValidateUseCase.execute.mockResolvedValue(Result.ok({ valid: true, errors: [] }));

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      const testRule: ValidationRule = { min_length: 5, error_message: 'Too short' };

      await act(async () => {
        await result.current.validate('email', 'test@example.com', testRule, 'text');
      });

      expect(mockValidateUseCase.execute).toHaveBeenCalledWith(
        'email',
        'test@example.com',
        testRule,
        'text',
      );
    });

    it('should handle multiple questions with errors independently', async () => {
      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      // Question 1 fails
      mockValidateUseCase.execute.mockResolvedValueOnce(
        Result.ok({ valid: false, errors: ['Error 1'] }),
      );
      await act(async () => {
        await result.current.validate('q1', '', rule, 'text');
      });

      // Question 2 fails
      mockValidateUseCase.execute.mockResolvedValueOnce(
        Result.ok({ valid: false, errors: ['Error 2'] }),
      );
      await act(async () => {
        await result.current.validate('q2', '', rule, 'text');
      });

      expect(result.current.errors).toEqual({
        q1: ['Error 1'],
        q2: ['Error 2'],
      });
      expect(result.current.hasErrors).toBe(true);
    });

    it('should update error when same question validated multiple times', async () => {
      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      // First validation
      mockValidateUseCase.execute.mockResolvedValueOnce(
        Result.ok({ valid: false, errors: ['First error'] }),
      );
      await act(async () => {
        await result.current.validate('q1', '', rule, 'text');
      });

      expect(result.current.errors.q1).toEqual(['First error']);

      // Second validation with different error
      mockValidateUseCase.execute.mockResolvedValueOnce(
        Result.ok({ valid: false, errors: ['Second error'] }),
      );
      await act(async () => {
        await result.current.validate('q1', 'a', rule, 'text');
      });

      expect(result.current.errors.q1).toEqual(['Second error']);
    });

    it('should handle different validation rules', async () => {
      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      const rules: ValidationRule[] = [
        { required: true, error_message: 'Required' },
        { min_length: 5, error_message: 'Too short' },
        { pattern: '^[a-z]+$', error_message: 'Invalid pattern' },
      ];

      mockValidateUseCase.execute.mockResolvedValue(Result.ok({ valid: true, errors: [] }));

      for (const testRule of rules) {
        await act(async () => {
          await result.current.validate('q1', 'value', testRule, 'text');
        });
      }

      expect(mockValidateUseCase.execute).toHaveBeenCalledTimes(3);
    });

    it('should handle different question types', async () => {
      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      mockValidateUseCase.execute.mockResolvedValue(Result.ok({ valid: true, errors: [] }));

      const questionTypes = ['text', 'number', 'date', 'slider', 'rating', 'single_select'];

      for (const type of questionTypes) {
        await act(async () => {
          await result.current.validate('q1', 'value', rule, type);
        });
      }

      expect(mockValidateUseCase.execute).toHaveBeenCalledTimes(questionTypes.length);
    });
  });

  describe('clearError()', () => {
    const rule: ValidationRule = { required: true, error_message: 'Required' };

    it('should clear error for specific question', async () => {
      mockValidateUseCase.execute.mockResolvedValue(Result.ok({ valid: false, errors: ['Error'] }));

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      // Add error
      await act(async () => {
        await result.current.validate('q1', '', rule, 'text');
      });

      expect(result.current.errors.q1).toBeDefined();

      // Clear error
      act(() => {
        result.current.clearError('q1');
      });

      expect(result.current.errors.q1).toBeUndefined();
      expect(result.current.hasErrors).toBe(false);
    });

    it('should not affect other question errors', async () => {
      mockValidateUseCase.execute.mockResolvedValue(Result.ok({ valid: false, errors: ['Error'] }));

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      // Add errors for multiple questions
      await act(async () => {
        await result.current.validate('q1', '', rule, 'text');
        await result.current.validate('q2', '', rule, 'text');
      });

      // Clear error for q1 only
      act(() => {
        result.current.clearError('q1');
      });

      expect(result.current.errors.q1).toBeUndefined();
      expect(result.current.errors.q2).toEqual(['Error']);
      expect(result.current.hasErrors).toBe(true);
    });

    it('should handle clearing non-existent error', () => {
      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      act(() => {
        result.current.clearError('nonexistent');
      });

      expect(result.current.errors).toEqual({});
      expect(result.current.hasErrors).toBe(false);
    });

    it('should update hasErrors flag correctly', async () => {
      mockValidateUseCase.execute.mockResolvedValue(Result.ok({ valid: false, errors: ['Error'] }));

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      await act(async () => {
        await result.current.validate('q1', '', rule, 'text');
      });

      expect(result.current.hasErrors).toBe(true);

      act(() => {
        result.current.clearError('q1');
      });

      expect(result.current.hasErrors).toBe(false);
    });
  });

  describe('clearAllErrors()', () => {
    const rule: ValidationRule = { required: true, error_message: 'Required' };

    it('should clear all errors', async () => {
      mockValidateUseCase.execute.mockResolvedValue(Result.ok({ valid: false, errors: ['Error'] }));

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      // Add multiple errors
      await act(async () => {
        await result.current.validate('q1', '', rule, 'text');
        await result.current.validate('q2', '', rule, 'text');
        await result.current.validate('q3', '', rule, 'text');
      });

      expect(Object.keys(result.current.errors).length).toBe(3);

      // Clear all
      act(() => {
        result.current.clearAllErrors();
      });

      expect(result.current.errors).toEqual({});
      expect(result.current.hasErrors).toBe(false);
    });

    it('should work when no errors exist', () => {
      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      act(() => {
        result.current.clearAllErrors();
      });

      expect(result.current.errors).toEqual({});
    });

    it('should reset hasErrors flag', async () => {
      mockValidateUseCase.execute.mockResolvedValue(Result.ok({ valid: false, errors: ['Error'] }));

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      await act(async () => {
        await result.current.validate('q1', '', rule, 'text');
      });

      expect(result.current.hasErrors).toBe(true);

      act(() => {
        result.current.clearAllErrors();
      });

      expect(result.current.hasErrors).toBe(false);
    });
  });

  describe('getError()', () => {
    const rule: ValidationRule = { required: true, error_message: 'Required' };

    it('should return first error message for question', async () => {
      mockValidateUseCase.execute.mockResolvedValue(
        Result.ok({ valid: false, errors: ['Error 1', 'Error 2'] }),
      );

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      await act(async () => {
        await result.current.validate('q1', '', rule, 'text');
      });

      expect(result.current.getError('q1')).toBe('Error 1');
    });

    it('should return undefined for question with no error', () => {
      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      expect(result.current.getError('q1')).toBeUndefined();
    });

    it('should return undefined for non-existent question', async () => {
      mockValidateUseCase.execute.mockResolvedValue(Result.ok({ valid: false, errors: ['Error'] }));

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      await act(async () => {
        await result.current.validate('q1', '', rule, 'text');
      });

      expect(result.current.getError('nonexistent')).toBeUndefined();
    });

    it('should return undefined after error is cleared', async () => {
      mockValidateUseCase.execute.mockResolvedValue(Result.ok({ valid: false, errors: ['Error'] }));

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      await act(async () => {
        await result.current.validate('q1', '', rule, 'text');
      });

      expect(result.current.getError('q1')).toBe('Error');

      act(() => {
        result.current.clearError('q1');
      });

      expect(result.current.getError('q1')).toBeUndefined();
    });

    it('should handle empty error array', async () => {
      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      // Manually set empty error array (edge case)
      // For testing, we need to set errors which is readonly
      act(() => {
        Object.defineProperty(result.current, 'errors', {
          value: { q1: [] },
          writable: true,
          configurable: true,
        });
      });

      expect(result.current.getError('q1')).toBeUndefined();
    });
  });

  describe('hasErrors', () => {
    const rule: ValidationRule = { required: true, error_message: 'Required' };

    it('should be false initially', () => {
      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      expect(result.current.hasErrors).toBe(false);
    });

    it('should be true when errors exist', async () => {
      mockValidateUseCase.execute.mockResolvedValue(Result.ok({ valid: false, errors: ['Error'] }));

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      await act(async () => {
        await result.current.validate('q1', '', rule, 'text');
      });

      expect(result.current.hasErrors).toBe(true);
    });

    it('should be false after all errors cleared', async () => {
      mockValidateUseCase.execute.mockResolvedValue(Result.ok({ valid: false, errors: ['Error'] }));

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      await act(async () => {
        await result.current.validate('q1', '', rule, 'text');
      });

      act(() => {
        result.current.clearAllErrors();
      });

      expect(result.current.hasErrors).toBe(false);
    });

    it('should track multiple errors correctly', async () => {
      mockValidateUseCase.execute.mockResolvedValue(Result.ok({ valid: false, errors: ['Error'] }));

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      await act(async () => {
        await result.current.validate('q1', '', rule, 'text');
        await result.current.validate('q2', '', rule, 'text');
      });

      expect(result.current.hasErrors).toBe(true);

      // Clear one error
      act(() => {
        result.current.clearError('q1');
      });

      // Should still have errors from q2
      expect(result.current.hasErrors).toBe(true);

      // Clear remaining error
      act(() => {
        result.current.clearError('q2');
      });

      expect(result.current.hasErrors).toBe(false);
    });
  });

  describe('errors object', () => {
    const rule: ValidationRule = { required: true, error_message: 'Required' };

    it('should be empty object initially', () => {
      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      expect(result.current.errors).toEqual({});
    });

    it('should contain error entries keyed by question ID', async () => {
      mockValidateUseCase.execute.mockResolvedValue(Result.ok({ valid: false, errors: ['Error'] }));

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      await act(async () => {
        await result.current.validate('email', '', rule, 'text');
      });

      expect(result.current.errors).toHaveProperty('email');
      expect(result.current.errors.email).toEqual(['Error']);
    });

    it('should allow iteration over errors', async () => {
      mockValidateUseCase.execute.mockResolvedValue(Result.ok({ valid: false, errors: ['Error'] }));

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      await act(async () => {
        await result.current.validate('q1', '', rule, 'text');
        await result.current.validate('q2', '', rule, 'text');
      });

      const questionIds = Object.keys(result.current.errors);
      expect(questionIds).toContain('q1');
      expect(questionIds).toContain('q2');
      expect(questionIds.length).toBe(2);
    });
  });

  describe('Edge cases', () => {
    const rule: ValidationRule = { required: true, error_message: 'Required' };

    it('should handle rapid consecutive validations', async () => {
      mockValidateUseCase.execute.mockResolvedValue(Result.ok({ valid: true, errors: [] }));

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      await act(async () => {
        const promises = Array.from({ length: 10 }, (_, i) =>
          result.current.validate(`q${i}`, 'value', rule, 'text'),
        );
        await Promise.all(promises);
      });

      expect(mockValidateUseCase.execute).toHaveBeenCalledTimes(10);
    });

    it('should handle special characters in question IDs', async () => {
      mockValidateUseCase.execute.mockResolvedValue(Result.ok({ valid: false, errors: ['Error'] }));

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      const specialId = 'question-with-dashes_and_underscores.123';

      await act(async () => {
        await result.current.validate(specialId, '', rule, 'text');
      });

      expect(result.current.errors[specialId]).toEqual(['Error']);
      expect(result.current.getError(specialId)).toBe('Error');
    });

    it('should handle empty string question ID', async () => {
      mockValidateUseCase.execute.mockResolvedValue(Result.ok({ valid: false, errors: ['Error'] }));

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      await act(async () => {
        await result.current.validate('', '', rule, 'text');
      });

      expect(result.current.errors['']).toEqual(['Error']);
    });

    it('should handle very long error messages', async () => {
      const longMessage = 'a'.repeat(1000);
      mockValidateUseCase.execute.mockResolvedValue(
        Result.ok({ valid: false, errors: [longMessage] }),
      );

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      await act(async () => {
        await result.current.validate('q1', '', rule, 'text');
      });

      expect(result.current.getError('q1')).toBe(longMessage);
    });

    it('should handle many simultaneous errors', async () => {
      mockValidateUseCase.execute.mockResolvedValue(Result.ok({ valid: false, errors: ['Error'] }));

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      await act(async () => {
        for (let i = 0; i < 100; i++) {
          await result.current.validate(`q${i}`, '', rule, 'text');
        }
      });

      expect(Object.keys(result.current.errors).length).toBe(100);
      expect(result.current.hasErrors).toBe(true);
    });

    it('should handle validation with null value', async () => {
      mockValidateUseCase.execute.mockResolvedValue(
        Result.ok({ valid: false, errors: ['Value is required'] }),
      );

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      await act(async () => {
        await result.current.validate('q1', null, rule, 'text');
      });

      expect(mockValidateUseCase.execute).toHaveBeenCalledWith('q1', null, rule, 'text');
      expect(result.current.errors.q1).toEqual(['Value is required']);
    });

    it('should handle validation with undefined value', async () => {
      mockValidateUseCase.execute.mockResolvedValue(
        Result.ok({ valid: false, errors: ['Value is required'] }),
      );

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      await act(async () => {
        await result.current.validate('q1', undefined, rule, 'text');
      });

      expect(mockValidateUseCase.execute).toHaveBeenCalledWith('q1', undefined, rule, 'text');
    });

    it('should handle validation with complex objects', async () => {
      mockValidateUseCase.execute.mockResolvedValue(Result.ok({ valid: true, errors: [] }));

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      const complexValue = { nested: { data: [1, 2, 3] } };

      await act(async () => {
        await result.current.validate('q1', complexValue, rule, 'text');
      });

      expect(mockValidateUseCase.execute).toHaveBeenCalledWith('q1', complexValue, rule, 'text');
    });
  });

  describe('Memoization and re-renders', () => {
    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useValidation(mockValidateUseCase));

      const firstValidate = result.current.validate;
      const firstClearError = result.current.clearError;
      const firstClearAllErrors = result.current.clearAllErrors;

      rerender();

      expect(result.current.validate).toBe(firstValidate);
      expect(result.current.clearError).toBe(firstClearError);
      expect(result.current.clearAllErrors).toBe(firstClearAllErrors);
      // getError depends on errors state, so it may change
    });

    it('should update when use case changes', () => {
      const { result, rerender } = renderHook(({ useCase }) => useValidation(useCase), {
        initialProps: { useCase: mockValidateUseCase },
      });

      const firstValidate = result.current.validate;

      const newMockUseCase: jest.Mocked<IValidateAnswerUseCase> = {
        execute: jest.fn(),
      };

      rerender({ useCase: newMockUseCase });

      expect(result.current.validate).not.toBe(firstValidate);
    });
  });

  describe('Integration scenarios', () => {
    const rule: ValidationRule = { required: true, error_message: 'Required' };

    it('should handle typical form validation workflow', async () => {
      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      // User types invalid input
      mockValidateUseCase.execute.mockResolvedValueOnce(
        Result.ok({ valid: false, errors: ['Field is required'] }),
      );
      await act(async () => {
        await result.current.validate('email', '', rule, 'text');
      });

      expect(result.current.hasErrors).toBe(true);
      expect(result.current.getError('email')).toBe('Field is required');

      // User types valid input
      mockValidateUseCase.execute.mockResolvedValueOnce(Result.ok({ valid: true, errors: [] }));
      await act(async () => {
        await result.current.validate('email', 'test@example.com', rule, 'text');
      });

      expect(result.current.hasErrors).toBe(false);
      expect(result.current.getError('email')).toBeUndefined();
    });

    it('should handle multi-field form validation', async () => {
      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      mockValidateUseCase.execute.mockResolvedValue(
        Result.ok({ valid: false, errors: ['Required'] }),
      );

      // Validate multiple fields
      await act(async () => {
        await result.current.validate('name', '', rule, 'text');
        await result.current.validate('email', '', rule, 'text');
        await result.current.validate('phone', '', rule, 'text');
      });

      expect(Object.keys(result.current.errors).length).toBe(3);

      // Fix one field
      mockValidateUseCase.execute.mockResolvedValueOnce(Result.ok({ valid: true, errors: [] }));
      await act(async () => {
        await result.current.validate('name', 'John', rule, 'text');
      });

      expect(Object.keys(result.current.errors).length).toBe(2);
      expect(result.current.errors.name).toBeUndefined();
    });

    it('should handle form reset scenario', async () => {
      mockValidateUseCase.execute.mockResolvedValue(Result.ok({ valid: false, errors: ['Error'] }));

      const { result } = renderHook(() => useValidation(mockValidateUseCase));

      // Fill form with errors
      await act(async () => {
        await result.current.validate('q1', '', rule, 'text');
        await result.current.validate('q2', '', rule, 'text');
      });

      expect(result.current.hasErrors).toBe(true);

      // Reset form
      act(() => {
        result.current.clearAllErrors();
      });

      expect(result.current.hasErrors).toBe(false);
      expect(result.current.errors).toEqual({});
    });
  });
});
