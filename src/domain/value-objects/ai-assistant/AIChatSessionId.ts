/**
 * AIChatSessionId Value Object
 *
 * Branded type for AI chat session identifiers.
 * NOT to be confused with App Session (user login session).
 *
 * An AI Chat Session represents a conversation thread with the AI assistant.
 */

// ============================================================================
// Branded Type Definition
// ============================================================================

declare const __brand: unique symbol;

type Brand<T, B> = T & { [__brand]: B };

/**
 * Branded string type for AI chat session IDs
 *
 * This ensures type safety - you can't accidentally pass a regular string
 * where an AIChatSessionId is expected.
 */
export type AIChatSessionId = Brand<string, 'AIChatSessionId'>;

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new AIChatSessionId from a string
 *
 * @param id - The raw session ID string
 * @returns Branded AIChatSessionId
 * @throws Error if id is empty or invalid
 *
 * @example
 * const sessionId = createAIChatSessionId('abc-123');
 */
export function createAIChatSessionId(id: string): AIChatSessionId {
  if (!id || typeof id !== 'string') {
    throw new Error('AIChatSessionId must be a non-empty string');
  }

  const trimmed = id.trim();
  if (trimmed.length === 0) {
    throw new Error('AIChatSessionId cannot be empty or whitespace');
  }

  return trimmed as AIChatSessionId;
}

/**
 * Safely create an AIChatSessionId, returning null for invalid input
 *
 * @param id - The raw session ID string (may be null/undefined)
 * @returns Branded AIChatSessionId or null
 *
 * @example
 * const sessionId = createAIChatSessionIdOrNull(maybeId);
 * if (sessionId) {
 *   // use sessionId
 * }
 */
export function createAIChatSessionIdOrNull(id: string | null | undefined): AIChatSessionId | null {
  if (!id || typeof id !== 'string') {
    return null;
  }

  const trimmed = id.trim();
  if (trimmed.length === 0) {
    return null;
  }

  return trimmed as AIChatSessionId;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a value is a valid AIChatSessionId
 *
 * Note: At runtime, this just checks if it's a non-empty string.
 * The branding is a compile-time concept only.
 */
export function isAIChatSessionId(value: unknown): value is AIChatSessionId {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate a string is a valid chat session ID format
 * (without creating the branded type)
 */
export function isValidAIChatSessionId(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert AIChatSessionId back to a plain string
 *
 * Useful when you need to pass the ID to APIs that expect string.
 */
export function unwrapAIChatSessionId(id: AIChatSessionId): string {
  return id as string;
}

/**
 * Compare two AIChatSessionIds for equality
 */
export function areAIChatSessionIdsEqual(
  a: AIChatSessionId | null | undefined,
  b: AIChatSessionId | null | undefined,
): boolean {
  if (a === null || a === undefined || b === null || b === undefined) {
    return a === b;
  }
  return a === b;
}
