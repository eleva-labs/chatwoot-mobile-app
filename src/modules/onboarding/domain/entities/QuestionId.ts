import { DomainError } from './Errors';

/**
 * QuestionId Value Object
 *
 * Represents a valid question identifier.
 * Immutable and validated on creation.
 */
export class QuestionId {
  private constructor(private readonly value: string) {}

  static create(value: string): QuestionId {
    if (!value || value.trim().length === 0) {
      throw new DomainError('QuestionId cannot be empty');
    }
    if (!/^[a-z0-9_-]+$/i.test(value)) {
      throw new DomainError('QuestionId must be alphanumeric with dashes/underscores only');
    }
    return new QuestionId(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: QuestionId): boolean {
    return this.value === other.value;
  }
}
