import { DomainError } from './Errors';

/**
 * Locale Value Object
 *
 * Represents a valid locale identifier (e.g., "en", "en-US")
 * Immutable and validated on creation.
 */
export class Locale {
  private constructor(private readonly value: string) {}

  static create(value: string): Locale {
    if (!this.isValid(value)) {
      throw new DomainError(`Invalid locale: ${value}. Expected format: "en" or "en-US"`);
    }
    return new Locale(value);
  }

  static isValid(value: string): boolean {
    // Validates locale format: "en" or "en-US"
    return /^[a-z]{2}(-[A-Z]{2})?$/.test(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Locale): boolean {
    return this.value === other.value;
  }

  /**
   * Get language code (e.g., "en" from "en-US")
   */
  getLanguageCode(): string {
    return this.value.split('-')[0];
  }

  /**
   * Get country code if present (e.g., "US" from "en-US")
   */
  getCountryCode(): string | null {
    const parts = this.value.split('-');
    return parts.length > 1 ? parts[1] : null;
  }
}
