/**
 * Tests for ValidateAnswerUseCaseImpl
 *
 * This use case orchestrates answer validation against validation rules.
 */

import { ValidateAnswerUseCaseImpl } from '../../../application/use-cases/ValidateAnswerUseCaseImpl';
import { ValidationService } from '../../../domain/services/ValidationService';
import { Result } from '../../../domain/entities/Result';
import { DomainError } from '../../../domain/entities/Errors';

describe('ValidateAnswerUseCaseImpl', () => {
  let useCase: ValidateAnswerUseCaseImpl;
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
    useCase = new ValidateAnswerUseCaseImpl(validationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute()', () => {
    it('should validate answer successfully with valid value', async () => {
      const result = await useCase.execute('q1', 'test answer', { required: true }, 'text');

      expect(result.isSuccess).toBe(true);
      const validationResult = result.getValue();
      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
    });

    it('should return validation errors for invalid value', async () => {
      const result = await useCase.execute('q1', '', { required: true, min_length: 5 }, 'text');

      expect(result.isSuccess).toBe(true);
      const validationResult = result.getValue();
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
    });

    it('should handle required validation', async () => {
      const result = await useCase.execute('q1', null, { required: true }, 'text');

      expect(result.isSuccess).toBe(true);
      const validationResult = result.getValue();
      expect(validationResult.valid).toBe(false);
    });

    it('should handle min_length validation', async () => {
      const result = await useCase.execute('q1', 'abc', { min_length: 5 }, 'text');

      expect(result.isSuccess).toBe(true);
      const validationResult = result.getValue();
      expect(validationResult.valid).toBe(false);
    });

    it('should handle max_length validation', async () => {
      const result = await useCase.execute('q1', 'a'.repeat(101), { max_length: 100 }, 'text');

      expect(result.isSuccess).toBe(true);
      const validationResult = result.getValue();
      expect(validationResult.valid).toBe(false);
    });

    it('should handle pattern validation', async () => {
      const result = await useCase.execute(
        'q1',
        'invalid-email',
        { pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
        'text',
      );

      expect(result.isSuccess).toBe(true);
      const validationResult = result.getValue();
      expect(validationResult.valid).toBe(false);
    });

    it('should validate email pattern successfully', async () => {
      const result = await useCase.execute(
        'q1',
        'test@example.com',
        { pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
        'text',
      );

      expect(result.isSuccess).toBe(true);
      const validationResult = result.getValue();
      expect(validationResult.valid).toBe(true);
    });

    it('should handle number validation', async () => {
      const result = await useCase.execute('q1', 42, { required: true }, 'number');

      expect(result.isSuccess).toBe(true);
      const validationResult = result.getValue();
      expect(validationResult.valid).toBe(true);
    });

    it('should handle array validation for multi_select', async () => {
      const result = await useCase.execute(
        'q1',
        ['option1', 'option2'],
        { required: true },
        'multi_select',
      );

      expect(result.isSuccess).toBe(true);
      const validationResult = result.getValue();
      expect(validationResult.valid).toBe(true);
    });

    it('should handle empty array validation', async () => {
      const result = await useCase.execute('q1', [], { required: true }, 'multi_select');

      expect(result.isSuccess).toBe(true);
      const validationResult = result.getValue();
      expect(validationResult.valid).toBe(false);
    });

    it('should fallback to validateValue when Answer creation fails', async () => {
      // Create a mock validation service that throws on validate but works on validateValue
      const mockValidationService = {
        validate: jest.fn(() => {
          throw new DomainError('Invalid question ID');
        }),
        validateValue: jest.fn(() => Result.ok({ valid: true, errors: [] })),
      };

      const useCaseWithMock = new ValidateAnswerUseCaseImpl(
        mockValidationService as unknown as ValidationService,
      );

      // Use invalid question ID to trigger Answer creation failure
      const result = await useCaseWithMock.execute('', 'test', { required: true }, 'text');

      expect(result.isSuccess).toBe(true);
      expect(mockValidationService.validateValue).toHaveBeenCalledWith(
        'test',
        { required: true },
        'text',
      );
    });

    it('should return failure when both validate and validateValue fail', async () => {
      const mockValidationService = {
        validate: jest.fn(() => {
          throw new DomainError('Invalid question ID');
        }),
        validateValue: jest.fn(() => Result.fail(new Error('Validation failed'))),
      };

      const useCaseWithMock = new ValidateAnswerUseCaseImpl(
        mockValidationService as unknown as ValidationService,
      );

      const result = await useCaseWithMock.execute('', 'test', { required: true }, 'text');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(Error);
    });

    it('should handle non-Error exceptions', async () => {
      const mockValidationService = {
        validate: jest.fn(() => {
          throw 'String error';
        }),
        validateValue: jest.fn(() => Result.ok({ valid: true, errors: [] })),
      };

      const useCaseWithMock = new ValidateAnswerUseCaseImpl(
        mockValidationService as unknown as ValidationService,
      );

      const result = await useCaseWithMock.execute('q1', 'test', { required: true }, 'text');

      expect(result.isSuccess).toBe(true);
      expect(mockValidationService.validateValue).toHaveBeenCalled();
    });
  });
});
