/**
 * Sanitization Service
 *
 * Sanitizes user input to prevent XSS and other security issues.
 * Pure domain logic with no external dependencies.
 */
export class SanitizationService {
  /**
   * Sanitize a string input
   */
  static sanitize(input: string): string {
    if (typeof input !== 'string') {
      return String(input);
    }

    // Remove potentially dangerous characters
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
      .trim();
  }

  /**
   * Sanitize an array of strings
   */
  static sanitizeArray(input: string[]): string[] {
    return input.map(item => this.sanitize(item));
  }

  /**
   * Sanitize an object with string values
   */
  static sanitizeObject<T extends Record<string, unknown>>(input: T): T {
    const sanitized = { ...input };
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = this.sanitize(sanitized[key] as string) as T[Extract<keyof T, string>];
      } else if (Array.isArray(sanitized[key])) {
        sanitized[key] = this.sanitizeArray(sanitized[key] as string[]) as T[Extract<
          keyof T,
          string
        >];
      }
    }
    return sanitized;
  }
}
