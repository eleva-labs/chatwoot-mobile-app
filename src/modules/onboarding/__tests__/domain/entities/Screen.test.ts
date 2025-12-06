/**
 * Tests for Screen Entity
 *
 * Screen represents a single question in the onboarding flow.
 * It has validation rules, skip configuration, and conditional logic.
 */

import { Screen } from '../../../domain/entities/Screen';
import { QuestionId } from '../../../domain/entities/QuestionId';
import { aScreen } from '../../helpers/builders';
import type { QuestionType, ValidationRule, ConditionalLogic } from '../../../domain/common';

describe('Screen', () => {
  describe('Construction', () => {
    it('should create screen with required fields', () => {
      const screen = aScreen().withId('q1').withTitle('Your name').build();

      expect(screen.id.toString()).toBe('q1');
      expect(screen.title).toBe('Your name');
      expect(screen.type).toBe('text');
      expect(screen.isRequired()).toBe(false);
    });

    it('should create screen with all optional fields', () => {
      const validation: ValidationRule = {
        required: true,
        min_length: 5,
        error_message: 'Too short',
      };
      const conditionalLogic: ConditionalLogic = {
        question_id: 'role',
        operator: 'equals',
        value: 'Developer',
      };

      const screen = aScreen()
        .withId('q1')
        .withTitle('Question')
        .withDescription('Description')
        .withQuestionType('text')
        .withRequired()
        .withValidation(validation)
        .withSkipConfig(true, 'Skip this')
        .withConditionalLogic(conditionalLogic)
        .withOrder(5)
        .build();

      expect(screen.description).toBe('Description');
      expect(screen.isRequired()).toBe(true);
      expect(screen.validation?.required).toBe(true);
      expect(screen.validation?.min_length).toBe(5);
      expect(screen.validation?.error_message).toBe('Too short');
      expect(screen.validation?.skippable).toBe(true);
      expect(screen.validation?.skip_button_text).toBe('Skip this');
      expect(screen.conditionalLogic).toEqual(conditionalLogic);
    });

    it('should throw error for select types without options', () => {
      expect(() => {
        const questionId = QuestionId.create('q1');
        new Screen(
          questionId,
          'single_select',
          'Select role',
          undefined,
          undefined,
          undefined, // No options!
          undefined,
          undefined,
          undefined,
          undefined,
        );
      }).toThrow('requires options');
    });

    it('should throw error for non-select types with options', () => {
      expect(() => {
        const questionId = QuestionId.create('q1');
        const options: { id: string; label: string; value: string }[] = [
          { id: 'opt1', label: 'Option 1', value: 'Option 1' },
          { id: 'opt2', label: 'Option 2', value: 'Option 2' },
        ];
        new Screen(
          questionId,
          'text',
          'Your name',
          undefined,
          undefined,
          options, // Options on text type!
          undefined,
          undefined,
          undefined,
          undefined,
        );
      }).toThrow('should not have options');
    });

    it('should accept options for single_select', () => {
      const screen = aScreen()
        .withQuestionType('single_select')
        .withOptions(['A', 'B', 'C'])
        .build();

      expect(screen.options).toEqual([
        { id: 'opt-0', label: 'A', value: 'A' },
        { id: 'opt-1', label: 'B', value: 'B' },
        { id: 'opt-2', label: 'C', value: 'C' },
      ]);
    });

    it('should accept options for multi_select', () => {
      const screen = aScreen()
        .withQuestionType('multi_select')
        .withOptions(['A', 'B', 'C'])
        .build();

      expect(screen.options).toEqual([
        { id: 'opt-0', label: 'A', value: 'A' },
        { id: 'opt-1', label: 'B', value: 'B' },
        { id: 'opt-2', label: 'C', value: 'C' },
      ]);
    });
  });

  describe('Question types', () => {
    const questionTypes: QuestionType[] = [
      'text',
      'date',
      'slider',
      'rating',
      'single_select',
      'multi_select',
      'file_upload',
    ];

    questionTypes.forEach(type => {
      it(`should support ${type} question type`, () => {
        const builder = aScreen().withQuestionType(type);

        // Add options for select types
        if (type === 'single_select' || type === 'multi_select') {
          builder.withOptions(['Option 1', 'Option 2']);
        }

        const screen = builder.build();

        expect(screen.type).toBe(type);
      });
    });
  });

  describe('isRequired()', () => {
    it('should return true when required is true', () => {
      const screen = aScreen().withRequired(true).withValidation({ required: true }).build();

      expect(screen.isRequired()).toBe(true);
    });

    it('should return false when required is false', () => {
      const screen = aScreen().withRequired(false).build();

      expect(screen.isRequired()).toBe(false);
    });

    it('should default to false', () => {
      const screen = aScreen().build();

      expect(screen.isRequired()).toBe(false);
    });
  });

  describe('isSkippable()', () => {
    it('should return true when skip is enabled', () => {
      const screen = aScreen().withSkipConfig(true).build();

      expect(screen.isSkippable()).toBe(true);
    });

    it('should return false when skip is disabled', () => {
      const screen = aScreen().withSkipConfig(false).build();

      expect(screen.isSkippable()).toBe(false);
    });

    it('should return true when skip config is not set and screen is not required', () => {
      const screen = aScreen().build();

      expect(screen.isSkippable()).toBe(true);
    });
  });

  describe('getSkipButtonText()', () => {
    it('should return custom skip button text when provided', () => {
      const screen = aScreen().withSkipConfig(true, 'Skip this question').build();

      expect(screen.getSkipButtonText()).toBe('Skip this question');
    });

    it('should return default text when custom text not provided', () => {
      const screen = aScreen().withSkipConfig(true).build();

      expect(screen.getSkipButtonText()).toBe('Skip');
    });

    it('should return default text when skip not enabled', () => {
      const screen = aScreen().build();

      expect(screen.getSkipButtonText()).toBe('Skip');
    });
  });

  describe('hasConditionalLogic()', () => {
    it('should return true when conditional logic is set', () => {
      const screen = aScreen()
        .withConditionalLogic({
          question_id: 'role',
          operator: 'equals',
          value: 'Developer',
        })
        .build();

      expect(screen.hasConditionalLogic()).toBe(true);
    });

    it('should return false when conditional logic is not set', () => {
      const screen = aScreen().build();

      expect(screen.hasConditionalLogic()).toBe(false);
    });
  });

  describe('Validation rules', () => {
    it('should store required validation', () => {
      const validation: ValidationRule = {
        required: true,
        error_message: 'This is required',
      };
      const screen = aScreen().withValidation(validation).build();

      expect(screen.validation).toEqual(validation);
    });

    it('should store min_length validation', () => {
      const validation: ValidationRule = {
        min_length: 5,
        error_message: 'Min 5 chars',
      };
      const screen = aScreen().withValidation(validation).build();

      expect(screen.validation).toEqual(validation);
    });

    it('should store pattern validation', () => {
      const validation: ValidationRule = {
        pattern: '^[a-z]+$',
        error_message: 'Lowercase only',
      };
      const screen = aScreen().withValidation(validation).build();

      expect(screen.validation).toEqual(validation);
    });

    it('should allow undefined validation', () => {
      const screen = aScreen().build();

      expect(screen.validation).toBeUndefined();
    });
  });

  describe('Immutability - withUpdatedProperties()', () => {
    it('should create new instance with updated title', () => {
      const original = aScreen().withTitle('Original').build();
      const updated = original.withUpdatedProperties({ title: 'Updated' });

      expect(original.title).toBe('Original');
      expect(updated.title).toBe('Updated');
      expect(updated.id).toBe(original.id);
    });

    it('should create new instance with updated description', () => {
      const original = aScreen().build();
      const updated = original.withUpdatedProperties({ description: 'New description' });

      expect(updated.description).toBe('New description');
      expect(original.description).not.toBe('New description');
    });

    it('should create new instance with updated validation', () => {
      const original = aScreen().build();
      const newValidation: ValidationRule = {
        required: true,
        error_message: 'Required',
      };
      const updated = original.withUpdatedProperties({ validation: newValidation });

      expect(updated.validation).toEqual(newValidation);
      expect(original.validation).toBeUndefined();
    });

    it('should create new instance with updated conditional logic', () => {
      const original = aScreen().build();
      const newLogic: ConditionalLogic = {
        question_id: 'test',
        operator: 'equals',
        value: 'value',
      };
      const updated = original.withUpdatedProperties({ conditionalLogic: newLogic });

      expect(updated.conditionalLogic).toEqual(newLogic);
      expect(original.conditionalLogic).toBeUndefined();
    });

    it('should update multiple properties at once', () => {
      const original = aScreen().withTitle('Old').build();
      const updated = original.withUpdatedProperties({
        title: 'New',
        description: 'Description',
      });

      expect(updated.title).toBe('New');
      expect(updated.description).toBe('Description');
      expect(original.title).toBe('Old');
    });

    it('should not mutate original when updating', () => {
      const original = aScreen().withTitle('Original').build();
      const originalTitle = original.title;

      original.withUpdatedProperties({ title: 'Updated' });

      expect(original.title).toBe(originalTitle);
    });

    it('should maintain id when updating', () => {
      const original = aScreen().withId('unique-id').build();
      const updated = original.withUpdatedProperties({ title: 'New title' });

      expect(updated.id.toString()).toBe('unique-id');
      expect(updated.id).toBe(original.id);
    });
  });

  describe('Options for select types', () => {
    it('should store options for single_select', () => {
      const options = ['Red', 'Green', 'Blue'];
      const screen = aScreen().withQuestionType('single_select').withOptions(options).build();

      expect(screen.options).toEqual([
        { id: 'opt-0', label: 'Red', value: 'Red' },
        { id: 'opt-1', label: 'Green', value: 'Green' },
        { id: 'opt-2', label: 'Blue', value: 'Blue' },
      ]);
    });

    it('should store options for multi_select', () => {
      const options = ['Coding', 'Design', 'Writing'];
      const screen = aScreen().withQuestionType('multi_select').withOptions(options).build();

      expect(screen.options).toEqual([
        { id: 'opt-0', label: 'Coding', value: 'Coding' },
        { id: 'opt-1', label: 'Design', value: 'Design' },
        { id: 'opt-2', label: 'Writing', value: 'Writing' },
      ]);
    });

    it('should throw error for empty options array on select types', () => {
      expect(() => {
        aScreen().withQuestionType('single_select').withOptions([]).build();
      }).toThrow('single_select type requires options');
    });

    it('should not have options for text type', () => {
      const screen = aScreen().withQuestionType('text').build();

      expect(screen.options).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle very long title', () => {
      const longTitle = 'a'.repeat(1000);
      const screen = aScreen().withTitle(longTitle).build();

      expect(screen.title).toBe(longTitle);
    });

    it('should handle very long description', () => {
      const longDesc = 'a'.repeat(10000);
      const screen = aScreen().withDescription(longDesc).build();

      expect(screen.description).toBe(longDesc);
    });

    it('should handle special characters in title', () => {
      const title = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\';
      const screen = aScreen().withTitle(title).build();

      expect(screen.title).toBe(title);
    });

    it('should handle unicode in title', () => {
      const title = '你好世界 🌍 مرحبا';
      const screen = aScreen().withTitle(title).build();

      expect(screen.title).toBe(title);
    });

    it('should handle many options', () => {
      const manyOptions = Array.from({ length: 100 }, (_, i) => `Option ${i + 1}`);
      const screen = aScreen().withQuestionType('single_select').withOptions(manyOptions).build();

      expect(screen.options).toHaveLength(100);
    });

    it('should handle duplicate options', () => {
      const options = ['A', 'A', 'B', 'B'];
      const screen = aScreen().withQuestionType('single_select').withOptions(options).build();

      expect(screen.options).toEqual([
        { id: 'opt-0', label: 'A', value: 'A' },
        { id: 'opt-1', label: 'A', value: 'A' },
        { id: 'opt-2', label: 'B', value: 'B' },
        { id: 'opt-3', label: 'B', value: 'B' },
      ]); // Preserves duplicates
    });

    it('should handle options with special characters', () => {
      const options = ['Option 1 (test)', 'Option 2 <tag>', 'Option 3 & 4'];
      const screen = aScreen().withQuestionType('single_select').withOptions(options).build();

      expect(screen.options).toEqual([
        { id: 'opt-0', label: 'Option 1 (test)', value: 'Option 1 (test)' },
        { id: 'opt-1', label: 'Option 2 <tag>', value: 'Option 2 <tag>' },
        { id: 'opt-2', label: 'Option 3 & 4', value: 'Option 3 & 4' },
      ]);
    });
  });

  describe('Builder pattern usage', () => {
    it('should work with fluent builder API', () => {
      const screen = aScreen()
        .withId('email')
        .withTitle('Email address')
        .withDescription('Enter your email')
        .withQuestionType('text')
        .withRequired()
        .withValidation({
          pattern: '^[^@]+@[^@]+\\.[^@]+$',
          error_message: 'Invalid email',
        })
        .build();

      expect(screen.id.toString()).toBe('email');
      expect(screen.title).toBe('Email address');
      expect(screen.description).toBe('Enter your email');
      expect(screen.type).toBe('text');
      expect(screen.isRequired()).toBe(true);
      expect(screen.validation?.pattern).toBe('^[^@]+@[^@]+\\.[^@]+$');
    });

    it('should allow chaining multiple updates', () => {
      const screen = aScreen().withTitle('First').withTitle('Second').withTitle('Final').build();

      expect(screen.title).toBe('Final');
    });
  });
});
