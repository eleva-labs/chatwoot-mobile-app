/**
 * Tests for ConditionalLogicService
 *
 * ConditionalLogicService evaluates conditional logic to determine
 * whether screens should be shown based on previous answers.
 * Supports 8 operators: equals, not_equals, contains, not_contains,
 * greater_than, less_than, is_empty, is_not_empty
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { ConditionalLogicService } from '../../../domain/services/ConditionalLogicService';
import type {
  ConditionalLogic,
  Answers,
  SelectOption,
  ConditionalOperator,
} from '../../../domain/common';
import { anAnswer, aScreen } from '../../helpers/builders';
import { Answer } from '../../../domain/entities/Answer';

// Helper to convert Answer objects to Answers map
function answersToMap(answers: Answer[]): Answers {
  const result: Answers = {};
  for (const answer of answers) {
    result[answer.questionId.toString()] = answer.value;
  }
  return result;
}

describe('ConditionalLogicService', () => {
  describe('equals operator', () => {
    const condition: ConditionalLogic = {
      question_id: 'role',
      operator: 'equals',
      value: 'Developer',
    };

    it('should return true when values match', () => {
      const answersArray = [anAnswer().withQuestionId('role').withValue('Developer').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should return false when values do not match', () => {
      const answersArray = [anAnswer().withQuestionId('role').withValue('Designer').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should return false when answer not found', () => {
      const answersArray = [anAnswer().withQuestionId('other').withValue('value').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should handle number equality', () => {
      const numCondition: ConditionalLogic = {
        question_id: 'age',
        operator: 'equals',
        value: 25,
      };
      const answersArray = [anAnswer().withQuestionId('age').withValue(25).build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(numCondition, answers);

      expect(result).toBe(true);
    });

    it('should be case-sensitive for strings', () => {
      const answersArray = [anAnswer().withQuestionId('role').withValue('developer').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });
  });

  describe('not_equals operator', () => {
    const condition: ConditionalLogic = {
      question_id: 'role',
      operator: 'not_equals',
      value: 'Developer',
    };

    it('should return true when values do not match', () => {
      const answersArray = [anAnswer().withQuestionId('role').withValue('Designer').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should return false when values match', () => {
      const answersArray = [anAnswer().withQuestionId('role').withValue('Developer').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should return true when answer not found', () => {
      const answersArray = [anAnswer().withQuestionId('other').withValue('value').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });
  });

  describe('contains operator', () => {
    const condition: ConditionalLogic = {
      question_id: 'interests',
      operator: 'contains',
      value: 'Coding',
    };

    it('should return true when array contains value', () => {
      const answersArray = [
        anAnswer().withQuestionId('interests').withValue(['Coding', 'Design']).build(),
      ];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should return false when array does not contain value', () => {
      const answersArray = [
        anAnswer().withQuestionId('interests').withValue(['Design', 'Writing']).build(),
      ];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should return true when string contains substring', () => {
      const stringCondition: ConditionalLogic = {
        question_id: 'name',
        operator: 'contains',
        value: 'John',
      };
      const answersArray = [anAnswer().withQuestionId('name').withValue('John Doe').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(stringCondition, answers);

      expect(result).toBe(true);
    });

    it('should return false when string does not contain substring', () => {
      const stringCondition: ConditionalLogic = {
        question_id: 'name',
        operator: 'contains',
        value: 'Jane',
      };
      const answersArray = [anAnswer().withQuestionId('name').withValue('John Doe').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(stringCondition, answers);

      expect(result).toBe(false);
    });

    it('should return false for non-array, non-string values', () => {
      const answersArray = [anAnswer().withQuestionId('interests').withValue(42).build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should be case-sensitive', () => {
      const answersArray = [
        anAnswer().withQuestionId('interests').withValue(['coding', 'design']).build(),
      ];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });
  });

  describe('not_contains operator', () => {
    const condition: ConditionalLogic = {
      question_id: 'interests',
      operator: 'not_contains',
      value: 'Coding',
    };

    it('should return false when array contains value', () => {
      const answersArray = [
        anAnswer().withQuestionId('interests').withValue(['Coding', 'Design']).build(),
      ];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should return true when array does not contain value', () => {
      const answersArray = [
        anAnswer().withQuestionId('interests').withValue(['Design', 'Writing']).build(),
      ];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should return false when string contains substring', () => {
      const stringCondition: ConditionalLogic = {
        question_id: 'name',
        operator: 'not_contains',
        value: 'John',
      };
      const answersArray = [anAnswer().withQuestionId('name').withValue('John Doe').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(stringCondition, answers);

      expect(result).toBe(false);
    });

    it('should return true when string does not contain substring', () => {
      const stringCondition: ConditionalLogic = {
        question_id: 'name',
        operator: 'not_contains',
        value: 'Jane',
      };
      const answersArray = [anAnswer().withQuestionId('name').withValue('John Doe').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(stringCondition, answers);

      expect(result).toBe(true);
    });
  });

  describe('greater_than operator', () => {
    const condition: ConditionalLogic = {
      question_id: 'rating',
      operator: 'greater_than',
      value: 3,
    };

    it('should return true when value is greater', () => {
      const answersArray = [anAnswer().withQuestionId('rating').withValue(5).build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should return false when value is equal', () => {
      const answersArray = [anAnswer().withQuestionId('rating').withValue(3).build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should return false when value is less', () => {
      const answersArray = [anAnswer().withQuestionId('rating').withValue(2).build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should return false for non-numeric values', () => {
      const answersArray = [anAnswer().withQuestionId('rating').withValue('high').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should handle negative numbers', () => {
      const negCondition: ConditionalLogic = {
        question_id: 'temperature',
        operator: 'greater_than',
        value: -10,
      };
      const answersArray = [anAnswer().withQuestionId('temperature').withValue(-5).build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(negCondition, answers);

      expect(result).toBe(true);
    });

    it('should handle decimal numbers', () => {
      const decimalCondition: ConditionalLogic = {
        question_id: 'price',
        operator: 'greater_than',
        value: 9.99,
      };
      const answersArray = [anAnswer().withQuestionId('price').withValue(10.5).build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(decimalCondition, answers);

      expect(result).toBe(true);
    });
  });

  describe('less_than operator', () => {
    const condition: ConditionalLogic = {
      question_id: 'rating',
      operator: 'less_than',
      value: 3,
    };

    it('should return true when value is less', () => {
      const answersArray = [anAnswer().withQuestionId('rating').withValue(2).build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should return false when value is equal', () => {
      const answersArray = [anAnswer().withQuestionId('rating').withValue(3).build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should return false when value is greater', () => {
      const answersArray = [anAnswer().withQuestionId('rating').withValue(5).build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should return false for non-numeric values', () => {
      const answersArray = [anAnswer().withQuestionId('rating').withValue('low').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });
  });

  describe('is_empty operator', () => {
    const condition: ConditionalLogic = {
      question_id: 'optional',
      operator: 'is_empty',
      value: undefined,
    };

    it('should return true for empty string', () => {
      const answersArray = [anAnswer().withQuestionId('optional').withValue('').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should return true for empty array', () => {
      const answersArray = [anAnswer().withQuestionId('optional').withValue([]).build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should return true when answer not found', () => {
      const answersArray = [anAnswer().withQuestionId('other').withValue('value').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should return false for non-empty string', () => {
      const answersArray = [anAnswer().withQuestionId('optional').withValue('text').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should return false for non-empty array', () => {
      const answersArray = [anAnswer().withQuestionId('optional').withValue(['item']).build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should return false for number (even 0)', () => {
      const answersArray = [anAnswer().withQuestionId('optional').withValue(0).build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });
  });

  describe('is_not_empty operator', () => {
    const condition: ConditionalLogic = {
      question_id: 'required',
      operator: 'is_not_empty',
      value: undefined,
    };

    it('should return false for empty string', () => {
      const answersArray = [anAnswer().withQuestionId('required').withValue('').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should return false for empty array', () => {
      const answersArray = [anAnswer().withQuestionId('required').withValue([]).build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should return false when answer not found', () => {
      const answersArray = [anAnswer().withQuestionId('other').withValue('value').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should return true for non-empty string', () => {
      const answersArray = [anAnswer().withQuestionId('required').withValue('text').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should return true for non-empty array', () => {
      const answersArray = [anAnswer().withQuestionId('required').withValue(['item']).build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should return true for number', () => {
      const answersArray = [anAnswer().withQuestionId('required').withValue(42).build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });
  });

  describe('shouldShowScreen()', () => {
    const screenWithCondition = aScreen()
      .withConditionalLogic({
        question_id: 'role',
        operator: 'equals',
        value: 'Developer',
      })
      .build();

    const screenWithoutCondition = aScreen().build();

    it('should return true for screen without conditional logic', () => {
      const answers: Answers = {};

      const result = ConditionalLogicService.shouldShowScreen(screenWithoutCondition, answers);

      expect(result).toBe(true);
    });

    it('should evaluate condition when present', () => {
      const answersArray = [anAnswer().withQuestionId('role').withValue('Developer').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.shouldShowScreen(screenWithCondition, answers);

      expect(result).toBe(true);
    });

    it('should return false when condition not met', () => {
      const answersArray = [anAnswer().withQuestionId('role').withValue('Designer').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.shouldShowScreen(screenWithCondition, answers);

      expect(result).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle condition with undefined value', () => {
      const condition: ConditionalLogic = {
        question_id: 'test',
        operator: 'equals',
        value: undefined,
      };
      const answersArray = [anAnswer().withQuestionId('test').withValue('value').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should handle condition with null value', () => {
      const condition: ConditionalLogic = {
        question_id: 'test',
        operator: 'equals',
        value: null,
      };
      const answersArray = [anAnswer().withQuestionId('test').withValue('value').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should handle empty answers object', () => {
      const condition: ConditionalLogic = {
        question_id: 'test',
        operator: 'equals',
        value: 'value',
      };
      const answers: Answers = {};

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should handle whitespace-only strings', () => {
      const condition: ConditionalLogic = {
        question_id: 'name',
        operator: 'is_empty',
        value: undefined,
      };
      const answersArray = [anAnswer().withQuestionId('name').withValue('   ').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      // Whitespace is NOT empty (has value)
      expect(result).toBe(false);
    });

    it('should handle very long strings in contains', () => {
      const longString = 'a'.repeat(10000);
      const condition: ConditionalLogic = {
        question_id: 'text',
        operator: 'contains',
        value: 'aaa',
      };
      const answersArray = [anAnswer().withQuestionId('text').withValue(longString).build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should handle large arrays in contains', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => `item-${i}`);
      const condition: ConditionalLogic = {
        question_id: 'items',
        operator: 'contains',
        value: 'item-500',
      };
      const answersArray = [anAnswer().withQuestionId('items').withValue(largeArray).build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should handle special characters in comparison', () => {
      const condition: ConditionalLogic = {
        question_id: 'test',
        operator: 'equals',
        value: '!@#$%^&*()',
      };
      const answersArray = [anAnswer().withQuestionId('test').withValue('!@#$%^&*()').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should handle unicode characters', () => {
      const condition: ConditionalLogic = {
        question_id: 'greeting',
        operator: 'equals',
        value: '你好',
      };
      const answersArray = [anAnswer().withQuestionId('greeting').withValue('你好').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });
  });

  describe('Complex scenarios', () => {
    it('should handle multiple conditions with same field', () => {
      const answersArray = [anAnswer().withQuestionId('rating').withValue(4).build()];
      const answers = answersToMap(answersArray);

      const greaterThan = ConditionalLogicService.evaluate(
        { question_id: 'rating', operator: 'greater_than', value: 3 },
        answers,
      );
      const lessThan = ConditionalLogicService.evaluate(
        { question_id: 'rating', operator: 'less_than', value: 5 },
        answers,
      );

      expect(greaterThan).toBe(true);
      expect(lessThan).toBe(true);
    });

    it('should handle chained conditional screens', () => {
      const answersArray = [
        anAnswer().withQuestionId('role').withValue('Developer').build(),
        anAnswer().withQuestionId('experience').withValue(5).build(),
      ];
      const answers = answersToMap(answersArray);

      const showDevScreen = ConditionalLogicService.evaluate(
        { question_id: 'role', operator: 'equals', value: 'Developer' },
        answers,
      );

      const showSeniorScreen = ConditionalLogicService.evaluate(
        { question_id: 'experience', operator: 'greater_than', value: 3 },
        answers,
      );

      expect(showDevScreen).toBe(true);
      expect(showSeniorScreen).toBe(true);
    });
  });

  describe('AND operator', () => {
    it('should return true when all conditions are true', () => {
      const condition: ConditionalLogic = {
        operator: 'and',
        conditions: [
          { question_id: 'role', operator: 'equals', value: 'Developer' },
          { question_id: 'experience', operator: 'greater_than', value: 3 },
        ],
      };
      const answersArray = [
        anAnswer().withQuestionId('role').withValue('Developer').build(),
        anAnswer().withQuestionId('experience').withValue(5).build(),
      ];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should return false when one condition is false', () => {
      const condition: ConditionalLogic = {
        operator: 'and',
        conditions: [
          { question_id: 'role', operator: 'equals', value: 'Developer' },
          { question_id: 'experience', operator: 'greater_than', value: 3 },
        ],
      };
      const answersArray = [
        anAnswer().withQuestionId('role').withValue('Developer').build(),
        anAnswer().withQuestionId('experience').withValue(2).build(), // Less than 3
      ];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should return false when all conditions are false', () => {
      const condition: ConditionalLogic = {
        operator: 'and',
        conditions: [
          { question_id: 'role', operator: 'equals', value: 'Developer' },
          { question_id: 'experience', operator: 'greater_than', value: 3 },
        ],
      };
      const answersArray = [
        anAnswer().withQuestionId('role').withValue('Designer').build(),
        anAnswer().withQuestionId('experience').withValue(2).build(),
      ];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should return true for empty conditions array', () => {
      const condition: ConditionalLogic = {
        operator: 'and',
        conditions: [],
      };
      const answers: Answers = {};

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should return true when conditions is undefined', () => {
      const condition: ConditionalLogic = {
        operator: 'and',
        conditions: undefined,
      };
      const answers: Answers = {};

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should support nested AND conditions', () => {
      const condition: ConditionalLogic = {
        operator: 'and',
        conditions: [
          {
            operator: 'and',
            conditions: [
              { question_id: 'role', operator: 'equals', value: 'Developer' },
              { question_id: 'experience', operator: 'greater_than', value: 3 },
            ],
          },
          { question_id: 'active', operator: 'equals', value: true },
        ],
      };
      const answersArray = [
        anAnswer().withQuestionId('role').withValue('Developer').build(),
        anAnswer().withQuestionId('experience').withValue(5).build(),
        anAnswer().withQuestionId('active').withValue(true).build(),
      ];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });
  });

  describe('OR operator', () => {
    it('should return true when at least one condition is true', () => {
      const condition: ConditionalLogic = {
        operator: 'or',
        conditions: [
          { question_id: 'role', operator: 'equals', value: 'Developer' },
          { question_id: 'role', operator: 'equals', value: 'Designer' },
        ],
      };
      const answersArray = [anAnswer().withQuestionId('role').withValue('Developer').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should return true when all conditions are true', () => {
      const condition: ConditionalLogic = {
        operator: 'or',
        conditions: [
          { question_id: 'role', operator: 'equals', value: 'Developer' },
          { question_id: 'experience', operator: 'greater_than', value: 3 },
        ],
      };
      const answersArray = [
        anAnswer().withQuestionId('role').withValue('Developer').build(),
        anAnswer().withQuestionId('experience').withValue(5).build(),
      ];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should return false when all conditions are false', () => {
      const condition: ConditionalLogic = {
        operator: 'or',
        conditions: [
          { question_id: 'role', operator: 'equals', value: 'Developer' },
          { question_id: 'role', operator: 'equals', value: 'Designer' },
        ],
      };
      const answersArray = [anAnswer().withQuestionId('role').withValue('Manager').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should return true for empty conditions array', () => {
      const condition: ConditionalLogic = {
        operator: 'or',
        conditions: [],
      };
      const answers: Answers = {};

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should support nested OR conditions', () => {
      const condition: ConditionalLogic = {
        operator: 'or',
        conditions: [
          {
            operator: 'or',
            conditions: [
              { question_id: 'role', operator: 'equals', value: 'Developer' },
              { question_id: 'role', operator: 'equals', value: 'Designer' },
            ],
          },
          { question_id: 'active', operator: 'equals', value: true },
        ],
      };
      const answersArray = [anAnswer().withQuestionId('active').withValue(true).build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should support mixed AND/OR conditions', () => {
      const condition: ConditionalLogic = {
        operator: 'and',
        conditions: [
          {
            operator: 'or',
            conditions: [
              { question_id: 'role', operator: 'equals', value: 'Developer' },
              { question_id: 'role', operator: 'equals', value: 'Designer' },
            ],
          },
          { question_id: 'experience', operator: 'greater_than', value: 3 },
        ],
      };
      const answersArray = [
        anAnswer().withQuestionId('role').withValue('Developer').build(),
        anAnswer().withQuestionId('experience').withValue(5).build(),
      ];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });
  });

  describe('in operator', () => {
    const condition: ConditionalLogic = {
      question_id: 'role',
      operator: 'in',
      value: ['Developer', 'Designer', 'Manager'],
    };

    it('should return true when value is in array', () => {
      const answersArray = [anAnswer().withQuestionId('role').withValue('Developer').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should return false when value is not in array', () => {
      const answersArray = [anAnswer().withQuestionId('role').withValue('Tester').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should return false when value is not an array', () => {
      const invalidCondition: ConditionalLogic = {
        question_id: 'role',
        operator: 'in',
        value: 'Developer', // Not an array
      };
      const answersArray = [anAnswer().withQuestionId('role').withValue('Developer').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(invalidCondition, answers);

      expect(result).toBe(false);
    });

    it('should handle number values in array', () => {
      const numCondition: ConditionalLogic = {
        question_id: 'rating',
        operator: 'in',
        value: [1, 2, 3, 4, 5],
      };
      const answersArray = [anAnswer().withQuestionId('rating').withValue(3).build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(numCondition, answers);

      expect(result).toBe(true);
    });

    it('should return false when answer not found', () => {
      const answersArray = [anAnswer().withQuestionId('other').withValue('Developer').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });
  });

  describe('not_in operator', () => {
    const condition: ConditionalLogic = {
      question_id: 'role',
      operator: 'not_in',
      value: ['Developer', 'Designer', 'Manager'],
    };

    it('should return false when value is in array', () => {
      const answersArray = [anAnswer().withQuestionId('role').withValue('Developer').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should return true when value is not in array', () => {
      const answersArray = [anAnswer().withQuestionId('role').withValue('Tester').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should return true when value is not an array', () => {
      const invalidCondition: ConditionalLogic = {
        question_id: 'role',
        operator: 'not_in',
        value: 'Developer', // Not an array
      };
      const answersArray = [anAnswer().withQuestionId('role').withValue('Developer').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(invalidCondition, answers);

      expect(result).toBe(true);
    });

    it('should return true when answer not found', () => {
      const answersArray = [anAnswer().withQuestionId('other').withValue('Tester').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });
  });

  describe('filterVisibleOptions()', () => {
    it('should return all options when no conditional_show is present', () => {
      const options: SelectOption[] = [
        { id: 'opt1', label: 'Option 1', value: 'opt1' },
        { id: 'opt2', label: 'Option 2', value: 'opt2' },
        { id: 'opt3', label: 'Option 3', value: 'opt3' },
      ];
      const answers: Answers = {};

      const result = ConditionalLogicService.filterVisibleOptions(options, answers);

      expect(result).toHaveLength(3);
      expect(result).toEqual(options);
    });

    it('should filter options based on conditional_show', () => {
      const options: SelectOption[] = [
        { id: 'opt1', label: 'Option 1', value: 'opt1' },
        {
          id: 'opt2',
          label: 'Option 2',
          value: 'opt2',
          conditional_show: {
            question_id: 'role',
            operator: 'equals',
            value: 'Developer',
          },
        },
        { id: 'opt3', label: 'Option 3', value: 'opt3' },
      ];
      const answersArray = [anAnswer().withQuestionId('role').withValue('Developer').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.filterVisibleOptions(options, answers);

      expect(result).toHaveLength(3);
      expect(result.map(o => o.id)).toEqual(['opt1', 'opt2', 'opt3']);
    });

    it('should hide options when conditional_show is false', () => {
      const options: SelectOption[] = [
        { id: 'opt1', label: 'Option 1', value: 'opt1' },
        {
          id: 'opt2',
          label: 'Option 2',
          value: 'opt2',
          conditional_show: {
            question_id: 'role',
            operator: 'equals',
            value: 'Developer',
          },
        },
        { id: 'opt3', label: 'Option 3', value: 'opt3' },
      ];
      const answersArray = [anAnswer().withQuestionId('role').withValue('Designer').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.filterVisibleOptions(options, answers);

      expect(result).toHaveLength(2);
      expect(result.map(o => o.id)).toEqual(['opt1', 'opt3']);
    });

    it('should handle multiple conditional options', () => {
      const options: SelectOption[] = [
        {
          id: 'opt1',
          label: 'Option 1',
          value: 'opt1',
          conditional_show: {
            question_id: 'role',
            operator: 'equals',
            value: 'Developer',
          },
        },
        {
          id: 'opt2',
          label: 'Option 2',
          value: 'opt2',
          conditional_show: {
            question_id: 'role',
            operator: 'equals',
            value: 'Designer',
          },
        },
        { id: 'opt3', label: 'Option 3', value: 'opt3' },
      ];
      const answersArray = [anAnswer().withQuestionId('role').withValue('Developer').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.filterVisibleOptions(options, answers);

      expect(result).toHaveLength(2);
      expect(result.map(o => o.id)).toEqual(['opt1', 'opt3']);
    });

    it('should handle nested conditional logic in options', () => {
      const options: SelectOption[] = [
        {
          id: 'opt1',
          label: 'Option 1',
          value: 'opt1',
          conditional_show: {
            operator: 'and',
            conditions: [
              { question_id: 'role', operator: 'equals', value: 'Developer' },
              { question_id: 'experience', operator: 'greater_than', value: 3 },
            ],
          },
        },
        { id: 'opt2', label: 'Option 2', value: 'opt2' },
      ];
      const answersArray = [
        anAnswer().withQuestionId('role').withValue('Developer').build(),
        anAnswer().withQuestionId('experience').withValue(5).build(),
      ];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.filterVisibleOptions(options, answers);

      expect(result).toHaveLength(2);
      expect(result.map(o => o.id)).toEqual(['opt1', 'opt2']);
    });

    it('should handle empty options array', () => {
      const options: SelectOption[] = [];
      const answers: Answers = {};

      const result = ConditionalLogicService.filterVisibleOptions(options, answers);

      expect(result).toHaveLength(0);
    });
  });

  describe('Edge cases for comparison operators', () => {
    it('should return false when question_id is missing', () => {
      const condition: ConditionalLogic = {
        operator: 'equals',
        value: 'test',
        // question_id is missing
      };
      const answers: Answers = {};

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should return false for unknown operator', () => {
      const condition: ConditionalLogic = {
        question_id: 'test',
        operator: 'unknown_operator' as ConditionalOperator,
        value: 'test',
      };
      const answersArray = [anAnswer().withQuestionId('test').withValue('test').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should handle null answer value in is_empty', () => {
      const condition: ConditionalLogic = {
        question_id: 'test',
        operator: 'is_empty',
        value: undefined,
      };
      const answersArray = [anAnswer().withQuestionId('test').withValue(null).build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should handle undefined answer value in is_empty', () => {
      const condition: ConditionalLogic = {
        question_id: 'test',
        operator: 'is_empty',
        value: undefined,
      };
      const answers: Answers = {
        test: undefined,
      };

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(true);
    });

    it('should handle logical operator with unknown nested operator', () => {
      const condition: ConditionalLogic = {
        operator: 'and',
        conditions: [
          {
            question_id: 'test',
            operator: 'unknown_operator' as ConditionalOperator,
            value: 'test',
          },
        ],
      };
      const answersArray = [anAnswer().withQuestionId('test').withValue('test').build()];
      const answers = answersToMap(answersArray);

      const result = ConditionalLogicService.evaluate(condition, answers);

      expect(result).toBe(false);
    });

    it('should handle edge case where logical operator is invalid (defensive test)', () => {
      // Line 43 is a defensive fallback in evaluateLogicalOperator
      // It's theoretically unreachable because TypeScript ensures LogicalOperator is 'and' | 'or'
      // However, we can test it by directly calling evaluateLogicalOperator with an invalid operator
      // using reflection/type casting to bypass TypeScript's type checking
      const condition = {
        operator: 'and' as any, // Start with 'and' to pass initial check
        conditions: [{ question_id: 'test', operator: 'equals', value: 'test' }],
      } as ConditionalLogic;

      // Manually modify the operator after creation to bypass type checking
      // This simulates a runtime scenario where the operator might be invalid
      (condition as any).operator = 'invalid_logical_operator';

      const answersArray = [anAnswer().withQuestionId('test').withValue('test').build()];
      const answers = answersToMap(answersArray);

      // Since 'invalid_logical_operator' is not 'and' or 'or', it won't pass the initial check
      // So it will go to evaluateComparison which requires question_id
      // To actually test line 43, we'd need to bypass the check at line 17
      // This is a defensive line that's hard to test without breaking encapsulation
      const result = ConditionalLogicService.evaluate(condition, answers);

      // Should return false (from evaluateComparison since question_id is missing)
      expect(result).toBe(false);
    });
  });
});
