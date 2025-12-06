import { QuestionId } from './QuestionId';
import type { AnswerValue } from '../common';
import { DomainError } from './Errors';

/**
 * Answer Entity
 *
 * Represents a single answer to a question.
 * Immutable value object that validates the answer value.
 */
export class Answer {
  constructor(
    public readonly questionId: QuestionId,
    public readonly value: AnswerValue,
    public readonly answeredAt: Date = new Date(),
  ) {
    this.validate();
  }

  private validate(): void {
    // Basic validation - can be extended with type-specific rules
    if (this.value === undefined) {
      throw new DomainError(`Answer for ${this.questionId.toString()}: value cannot be undefined`);
    }
  }

  /**
   * Check if answer is empty
   */
  isEmpty(): boolean {
    if (this.value === null) return true;
    if (typeof this.value === 'string') return this.value.trim().length === 0;
    if (Array.isArray(this.value)) return this.value.length === 0;
    return false;
  }

  /**
   * Check if answer has a value
   */
  hasValue(): boolean {
    return !this.isEmpty();
  }

  /**
   * Create a new answer with updated value (immutability)
   */
  withValue(newValue: AnswerValue): Answer {
    return new Answer(this.questionId, newValue, new Date());
  }

  /**
   * Check if this answer equals another
   */
  equals(other: Answer): boolean {
    if (!this.questionId.equals(other.questionId)) {
      return false;
    }

    // Deep equality check for arrays
    if (Array.isArray(this.value) && Array.isArray(other.value)) {
      if (this.value.length !== other.value.length) return false;
      const thisArray = this.value as unknown[];
      const otherArray = other.value as unknown[];
      return thisArray.every((v, i) => v === otherArray[i]);
    }

    return this.value === other.value;
  }
}
