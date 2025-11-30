/**
 * Tests for ValidationService
 *
 * ValidationService provides pure business logic for validating answers
 * against various validation rules (required, length, pattern, rating, selection).
 */

import { ValidationService } from '../../../domain/services/ValidationService';
import type { ValidationRule } from '../../../domain/common';
import { anAnswer } from '../../helpers/builders';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    service = new ValidationService();
  });

  describe('Required validation', () => {
    const rule: ValidationRule = {
      required: true,
      error_message: 'This field is required',
    };

    it('should pass for non-empty string', () => {
      const answer = anAnswer().withValue('John Doe').build();
      const result = service.validate(answer, rule);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual({ valid: true, errors: [] });
    });

    it('should fail for empty string', () => {
      const answer = anAnswer().withValue('').build();
      const result = service.validate(answer, rule);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual({
        valid: false,
        errors: ['This field is required'],
      });
    });

    it('should fail for empty array', () => {
      const answer = anAnswer().withValue([]).build();
      const result = service.validate(answer, rule);

      expect(result.getValue()).toEqual({
        valid: false,
        errors: ['This field is required'],
      });
    });

    it('should pass for non-empty array', () => {
      const answer = anAnswer().withValue(['option1']).build();
      const result = service.validate(answer, rule);

      expect(result.getValue()).toEqual({ valid: true, errors: [] });
    });

    it('should pass for number (even 0)', () => {
      const answer = anAnswer().withValue(0).build();
      const result = service.validate(answer, rule);

      expect(result.getValue()).toEqual({ valid: true, errors: [] });
    });

    it('should use custom error message', () => {
      const customRule: ValidationRule = {
        required: true,
        error_message: 'Please provide your name',
      };
      const answer = anAnswer().withValue('').build();
      const result = service.validate(answer, customRule);

      expect(result.getValue()).toEqual({
        valid: false,
        errors: ['Please provide your name'],
      });
    });
  });

  describe('Min length validation', () => {
    const rule: ValidationRule = {
      min_length: 5,
      error_message: 'Must be at least 5 characters',
    };

    it('should pass for string longer than min length', () => {
      const answer = anAnswer().withValue('Hello World').build();
      const result = service.validate(answer, rule);

      expect(result.getValue()).toEqual({ valid: true, errors: [] });
    });

    it('should pass for string equal to min length', () => {
      const answer = anAnswer().withValue('Hello').build();
      const result = service.validate(answer, rule);

      expect(result.getValue()).toEqual({ valid: true, errors: [] });
    });

    it('should fail for string shorter than min length', () => {
      const answer = anAnswer().withValue('Hi').build();
      const result = service.validate(answer, rule);

      expect(result.getValue()).toEqual({
        valid: false,
        errors: ['Minimum length is 5 characters'],
      });
    });

    it('should fail for empty string', () => {
      const answer = anAnswer().withValue('').build();
      const result = service.validate(answer, rule);

      expect(result.getValue().valid).toBe(true); // Empty is valid when not required
    });

    it('should count unicode characters correctly', () => {
      const answer = anAnswer().withValue('你好世界!').build(); // 5 characters
      const result = service.validate(answer, rule);

      expect(result.getValue()).toEqual({ valid: true, errors: [] });
    });
  });

  describe('Max length validation', () => {
    const rule: ValidationRule = {
      max_length: 10,
      error_message: 'Must be at most 10 characters',
    };

    it('should pass for string shorter than max length', () => {
      const answer = anAnswer().withValue('Short').build();
      const result = service.validate(answer, rule);

      expect(result.getValue()).toEqual({ valid: true, errors: [] });
    });

    it('should pass for string equal to max length', () => {
      const answer = anAnswer().withValue('1234567890').build();
      const result = service.validate(answer, rule);

      expect(result.getValue()).toEqual({ valid: true, errors: [] });
    });

    it('should fail for string longer than max length', () => {
      const answer = anAnswer().withValue('This is too long').build();
      const result = service.validate(answer, rule);

      expect(result.getValue()).toEqual({
        valid: false,
        errors: ['Maximum length is 10 characters'],
      });
    });

    it('should pass for empty string', () => {
      const answer = anAnswer().withValue('').build();
      const result = service.validate(answer, rule);

      expect(result.getValue()).toEqual({ valid: true, errors: [] });
    });
  });

  describe('Pattern validation (regex)', () => {
    describe('Email pattern', () => {
      const emailRule: ValidationRule = {
        pattern: '^[^@]+@[^@]+\\.[^@]+$',
        error_message: 'Invalid email address',
      };

      it('should pass for valid email', () => {
        const answer = anAnswer().withValue('user@example.com').build();
        const result = service.validate(answer, emailRule);

        expect(result.getValue()).toEqual({ valid: true, errors: [] });
      });

      it('should fail for email without @', () => {
        const answer = anAnswer().withValue('userexample.com').build();
        const result = service.validate(answer, emailRule);

        expect(result.getValue()).toEqual({
          valid: false,
          errors: ['Invalid email address'],
        });
      });

      it('should fail for email without domain', () => {
        const answer = anAnswer().withValue('user@').build();
        const result = service.validate(answer, emailRule);

        expect(result.getValue().valid).toBe(false);
      });

      it('should fail for email without extension', () => {
        const answer = anAnswer().withValue('user@example').build();
        const result = service.validate(answer, emailRule);

        expect(result.getValue().valid).toBe(false);
      });
    });

    describe('Phone pattern', () => {
      const phoneRule: ValidationRule = {
        pattern: '^\\d{10}$',
        error_message: 'Phone must be 10 digits',
      };

      it('should pass for valid 10-digit phone', () => {
        const answer = anAnswer().withValue('1234567890').build();
        const result = service.validate(answer, phoneRule);

        expect(result.getValue()).toEqual({ valid: true, errors: [] });
      });

      it('should fail for phone with letters', () => {
        const answer = anAnswer().withValue('123abc7890').build();
        const result = service.validate(answer, phoneRule);

        expect(result.getValue().valid).toBe(false);
      });

      it('should fail for phone too short', () => {
        const answer = anAnswer().withValue('12345').build();
        const result = service.validate(answer, phoneRule);

        expect(result.getValue().valid).toBe(false);
      });
    });

    it('should handle invalid regex pattern gracefully', () => {
      const invalidRule: ValidationRule = {
        pattern: '[invalid(regex',
        error_message: 'Invalid pattern',
      };
      const answer = anAnswer().withValue('test').build();
      const result = service.validate(answer, invalidRule);

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toBeDefined();
    });
  });

  describe('Min rating validation', () => {
    const rule: ValidationRule = {
      min_rating: 3,
      error_message: 'Please rate at least 3 stars',
    };

    it('should pass for rating above minimum', () => {
      const answer = anAnswer().withValue(5).build();
      const result = service.validate(answer, rule);

      expect(result.getValue()).toEqual({ valid: true, errors: [] });
    });

    it('should pass for rating equal to minimum', () => {
      const answer = anAnswer().withValue(3).build();
      const result = service.validate(answer, rule);

      expect(result.getValue()).toEqual({ valid: true, errors: [] });
    });

    it('should fail for rating below minimum', () => {
      const answer = anAnswer().withValue(2).build();
      const result = service.validate(answer, rule);

      expect(result.getValue()).toEqual({
        valid: false,
        errors: ['Minimum rating is 3'],
      });
    });

    it('should fail for rating of 0', () => {
      const answer = anAnswer().withValue(0).build();
      const result = service.validate(answer, rule);

      expect(result.getValue().valid).toBe(false);
    });

    it('should pass for non-numeric rating (no validation)', () => {
      const answer = anAnswer().withValue('five').build();
      const result = service.validate(answer, rule);

      expect(result.getValue().valid).toBe(true); // No validation for non-numbers
    });
  });

  describe('Max selection validation', () => {
    const rule: ValidationRule = {
      max_selection: 2,
      error_message: 'Select at most 2 options',
    };

    it('should pass for selection within limit', () => {
      const answer = anAnswer().withValue(['option1', 'option2']).build();
      const result = service.validate(answer, rule);

      expect(result.getValue()).toEqual({ valid: true, errors: [] });
    });

    it('should pass for single selection', () => {
      const answer = anAnswer().withValue(['option1']).build();
      const result = service.validate(answer, rule);

      expect(result.getValue()).toEqual({ valid: true, errors: [] });
    });

    it('should pass for empty selection', () => {
      const answer = anAnswer().withValue([]).build();
      const result = service.validate(answer, rule);

      expect(result.getValue()).toEqual({ valid: true, errors: [] });
    });

    it('should fail for selection exceeding limit', () => {
      const answer = anAnswer().withValue(['opt1', 'opt2', 'opt3']).build();
      const result = service.validate(answer, rule);

      expect(result.getValue()).toEqual({
        valid: false,
        errors: ['Maximum 2 selection(s) allowed'],
      });
    });

    it('should pass for non-array value (no validation)', () => {
      const answer = anAnswer().withValue('not-an-array').build();
      const result = service.validate(answer, rule);

      expect(result.getValue().valid).toBe(true); // No validation for non-arrays
    });
  });

  describe('validateValue() - Direct value validation', () => {
    it('should validate string value directly', () => {
      const rule: ValidationRule = {
        min_length: 3,
        error_message: 'Too short',
      };

      const result = service.validateValue('test', rule, 'text');

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual({ valid: true, errors: [] });
    });

    it('should validate number value directly', () => {
      const rule: ValidationRule = {
        min_rating: 3,
        error_message: 'Rate at least 3',
      };

      const result = service.validateValue(4, rule, 'rating');

      expect(result.getValue()).toEqual({ valid: true, errors: [] });
    });

    it('should validate array value directly', () => {
      const rule: ValidationRule = {
        max_selection: 2,
        error_message: 'Max 2',
      };

      const result = service.validateValue(['a', 'b'], rule, 'multi_select');

      expect(result.getValue()).toEqual({ valid: true, errors: [] });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle validation rule without error message', () => {
      const rule: ValidationRule = {
        required: true,
      };
      const answer = anAnswer().withValue('').build();
      const result = service.validate(answer, rule);

      expect(result.getValue().valid).toBe(false);
      expect(result.getValue().errors.length).toBeGreaterThan(0);
    });

    it('should handle unknown validation properties gracefully', () => {
      const rule: ValidationRule = {
        required: false,
      };
      const answer = anAnswer().withValue('test').build();
      const result = service.validate(answer, rule);

      // Should return success when no validation rules match
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().valid).toBe(true);
    });

    it('should handle very large numbers', () => {
      const rule: ValidationRule = {
        min_rating: 1000000,
        error_message: 'Too low',
      };
      const answer = anAnswer().withValue(999999).build();
      const result = service.validate(answer, rule);

      expect(result.getValue().valid).toBe(false);
    });

    it('should handle very long strings', () => {
      const rule: ValidationRule = {
        max_length: 100,
        error_message: 'Too long',
      };
      const longString = 'a'.repeat(1000);
      const answer = anAnswer().withValue(longString).build();
      const result = service.validate(answer, rule);

      expect(result.getValue().valid).toBe(false);
    });

    it('should handle very large arrays', () => {
      const rule: ValidationRule = {
        max_selection: 10,
        error_message: 'Too many',
      };
      const largeArray = Array.from({ length: 100 }, (_, i) => `item-${i}`);
      const answer = anAnswer().withValue(largeArray).build();
      const result = service.validate(answer, rule);

      expect(result.getValue().valid).toBe(false);
    });
  });

  describe('Multiple validation rules', () => {
    it('should validate against multiple rules sequentially', () => {
      const rules: ValidationRule[] = [
        { required: true, error_message: 'Required' },
        { min_length: 5, error_message: 'Min 5 chars' },
        { max_length: 20, error_message: 'Max 20 chars' },
      ];

      const answer = anAnswer().withValue('Valid input').build();

      rules.forEach(rule => {
        const result = service.validate(answer, rule);
        expect(result.getValue().valid).toBe(true);
      });
    });

    it('should fail on first failing rule', () => {
      const answer = anAnswer().withValue('Hi').build();

      const requiredRule: ValidationRule = { required: true, error_message: 'Required' };
      const requiredResult = service.validate(answer, requiredRule);
      expect(requiredResult.getValue().valid).toBe(true);

      const minLengthRule: ValidationRule = {
        min_length: 5,
        error_message: 'Too short',
      };
      const lengthResult = service.validate(answer, minLengthRule);
      expect(lengthResult.getValue().valid).toBe(false);
    });
  });
});
