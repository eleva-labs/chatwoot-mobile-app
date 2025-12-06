/**
 * Tests for Answer Value Object
 *
 * Answer represents a user's response to a question.
 * It's immutable and supports value equality.
 */

import { Answer } from '../../../domain/entities/Answer';
import { QuestionId } from '../../../domain/entities/QuestionId';
import { anAnswer } from '../../helpers/builders';

describe('Answer', () => {
  describe('Construction', () => {
    it('should create answer with string value', () => {
      const questionId = QuestionId.create('q1');
      const answer = new Answer(questionId, 'John Doe');

      expect(answer.questionId).toBe(questionId);
      expect(answer.value).toBe('John Doe');
    });

    it('should create answer with number value', () => {
      const answer = new Answer(QuestionId.create('rating'), 5);

      expect(answer.value).toBe(5);
    });

    it('should create answer with array value', () => {
      const answer = new Answer(QuestionId.create('interests'), ['Coding', 'Design']);

      expect(answer.value).toEqual(['Coding', 'Design']);
    });

    it('should create answer with empty string', () => {
      const answer = new Answer(QuestionId.create('optional'), '');

      expect(answer.value).toBe('');
    });

    it('should throw error if value is undefined', () => {
      expect(() => {
        new Answer(QuestionId.create('q1'), undefined as unknown as string);
      }).toThrow('Answer for q1: value cannot be undefined');
    });

    it('should allow null as a valid value', () => {
      const answer = new Answer(QuestionId.create('q1'), null);
      expect(answer.value).toBeNull();
      expect(answer.isEmpty()).toBe(true);
    });
  });

  describe('isEmpty()', () => {
    it('should return true for empty string', () => {
      const answer = new Answer(QuestionId.create('q1'), '');

      expect(answer.isEmpty()).toBe(true);
    });

    it('should return true for empty array', () => {
      const answer = new Answer(QuestionId.create('q1'), []);

      expect(answer.isEmpty()).toBe(true);
    });

    it('should return false for non-empty string', () => {
      const answer = new Answer(QuestionId.create('q1'), 'text');

      expect(answer.isEmpty()).toBe(false);
    });

    it('should return false for non-empty array', () => {
      const answer = new Answer(QuestionId.create('q1'), ['item']);

      expect(answer.isEmpty()).toBe(false);
    });

    it('should return false for number (even 0)', () => {
      const answer = new Answer(QuestionId.create('q1'), 0);

      expect(answer.isEmpty()).toBe(false);
    });
  });

  describe('hasValue()', () => {
    it('should return true for non-empty string', () => {
      const answer = new Answer(QuestionId.create('q1'), 'value');

      expect(answer.hasValue()).toBe(true);
    });

    it('should return true for number', () => {
      const answer = new Answer(QuestionId.create('q1'), 42);

      expect(answer.hasValue()).toBe(true);
    });

    it('should return true for non-empty array', () => {
      const answer = new Answer(QuestionId.create('q1'), ['item']);

      expect(answer.hasValue()).toBe(true);
    });

    it('should return false for empty string', () => {
      const answer = new Answer(QuestionId.create('q1'), '');

      expect(answer.hasValue()).toBe(false);
    });

    it('should return false for empty array', () => {
      const answer = new Answer(QuestionId.create('q1'), []);

      expect(answer.hasValue()).toBe(false);
    });
  });

  describe('equals()', () => {
    it('should return true for identical string answers', () => {
      const answer1 = new Answer(QuestionId.create('q1'), 'value');
      const answer2 = new Answer(QuestionId.create('q1'), 'value');

      expect(answer1.equals(answer2)).toBe(true);
    });

    it('should return false for different values', () => {
      const answer1 = new Answer(QuestionId.create('q1'), 'value1');
      const answer2 = new Answer(QuestionId.create('q1'), 'value2');

      expect(answer1.equals(answer2)).toBe(false);
    });

    it('should return false for different question IDs', () => {
      const answer1 = new Answer(QuestionId.create('q1'), 'value');
      const answer2 = new Answer(QuestionId.create('q2'), 'value');

      expect(answer1.equals(answer2)).toBe(false);
    });

    it('should return true for identical array answers (same order)', () => {
      const answer1 = new Answer(QuestionId.create('q1'), ['a', 'b', 'c']);
      const answer2 = new Answer(QuestionId.create('q1'), ['a', 'b', 'c']);

      expect(answer1.equals(answer2)).toBe(true);
    });

    it('should return false for arrays with different order', () => {
      const answer1 = new Answer(QuestionId.create('q1'), ['a', 'b', 'c']);
      const answer2 = new Answer(QuestionId.create('q1'), ['c', 'b', 'a']);

      expect(answer1.equals(answer2)).toBe(false);
    });

    it('should return false for arrays with different lengths', () => {
      const answer1 = new Answer(QuestionId.create('q1'), ['a', 'b']);
      const answer2 = new Answer(QuestionId.create('q1'), ['a', 'b', 'c']);

      expect(answer1.equals(answer2)).toBe(false);
    });

    it('should handle number equality', () => {
      const answer1 = new Answer(QuestionId.create('rating'), 5);
      const answer2 = new Answer(QuestionId.create('rating'), 5);
      const answer3 = new Answer(QuestionId.create('rating'), 4);

      expect(answer1.equals(answer2)).toBe(true);
      expect(answer1.equals(answer3)).toBe(false);
    });

    it('should return false when comparing different types', () => {
      const stringAnswer = new Answer(QuestionId.create('q1'), '5');
      const numberAnswer = new Answer(QuestionId.create('q1'), 5);

      expect(stringAnswer.equals(numberAnswer)).toBe(false);
    });
  });

  describe('Immutability - withValue()', () => {
    it('should create new instance with different value', () => {
      const original = new Answer(QuestionId.create('q1'), 'original');
      const updated = original.withValue('updated');

      expect(original.value).toBe('original');
      expect(updated.value).toBe('updated');
      expect(updated.questionId).toBe(original.questionId);
    });

    it('should not mutate original answer', () => {
      const original = new Answer(QuestionId.create('q1'), 'value');
      const updated = original.withValue('new value');

      expect(original.value).toBe('value');
      expect(updated.value).toBe('new value');
    });

    it('should maintain question ID when creating new instance', () => {
      const questionId = QuestionId.create('q1');
      const original = new Answer(questionId, 'old');
      const updated = original.withValue('new');

      expect(updated.questionId).toBe(questionId);
    });

    it('should support chaining with immutable updates', () => {
      const answer = new Answer(QuestionId.create('q1'), 'first')
        .withValue('second')
        .withValue('third');

      expect(answer.value).toBe('third');
    });
  });

  describe('Builder pattern usage', () => {
    it('should work with test builders', () => {
      const answer = anAnswer().withQuestionId('test-question').withValue('test-value').build();

      expect(answer.questionId.toString()).toBe('test-question');
      expect(answer.value).toBe('test-value');
    });

    it('should create answers with different types via builder', () => {
      const stringAnswer = anAnswer().withValue('text').build();
      const numberAnswer = anAnswer().withValue(42).build();
      const arrayAnswer = anAnswer().withValue(['a', 'b']).build();

      expect(typeof stringAnswer.value).toBe('string');
      expect(typeof numberAnswer.value).toBe('number');
      expect(Array.isArray(arrayAnswer.value)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long string values', () => {
      const longString = 'a'.repeat(10000);
      const answer = new Answer(QuestionId.create('q1'), longString);

      expect(answer.value).toBe(longString);
      expect(answer.hasValue()).toBe(true);
    });

    it('should handle large arrays', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => `item-${i}`);
      const answer = new Answer(QuestionId.create('q1'), largeArray);

      expect(answer.value).toEqual(largeArray);
      expect(answer.hasValue()).toBe(true);
    });

    it('should handle special characters in string values', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\';
      const answer = new Answer(QuestionId.create('q1'), specialChars);

      expect(answer.value).toBe(specialChars);
    });

    it('should handle unicode characters', () => {
      const unicode = '你好世界 🌍 مرحبا';
      const answer = new Answer(QuestionId.create('q1'), unicode);

      expect(answer.value).toBe(unicode);
    });

    it('should handle whitespace-only strings as empty', () => {
      const whitespace = '   ';
      const answer = new Answer(QuestionId.create('q1'), whitespace);

      expect(answer.hasValue()).toBe(false);
      expect(answer.isEmpty()).toBe(true);
    });

    it('should handle arrays with mixed types (if allowed by TypeScript)', () => {
      const mixedArray = ['string', 'another'] as string[];
      const answer = new Answer(QuestionId.create('q1'), mixedArray);

      expect(answer.value).toEqual(mixedArray);
    });

    it('should handle negative numbers', () => {
      const answer = new Answer(QuestionId.create('temperature'), -273);

      expect(answer.value).toBe(-273);
      expect(answer.hasValue()).toBe(true);
    });

    it('should handle floating point numbers', () => {
      const answer = new Answer(QuestionId.create('rating'), 4.5);

      expect(answer.value).toBe(4.5);
    });
  });
});
