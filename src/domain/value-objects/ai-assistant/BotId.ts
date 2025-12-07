/**
 * BotId Value Object
 *
 * Branded type for AI bot identifiers.
 * Bots are the AI agents that users can chat with.
 */

// ============================================================================
// Branded Type Definition
// ============================================================================

declare const __brand: unique symbol;

type Brand<T, B> = T & { [__brand]: B };

/**
 * Branded number type for Bot IDs
 */
export type BotId = Brand<number, 'BotId'>;

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new BotId from a number
 *
 * @param id - The raw bot ID number
 * @returns Branded BotId
 * @throws Error if id is not a positive integer
 */
export function createBotId(id: number): BotId {
  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
    throw new Error('BotId must be a positive integer');
  }

  return id as BotId;
}

/**
 * Safely create a BotId, returning null for invalid input
 */
export function createBotIdOrNull(id: number | null | undefined): BotId | null {
  if (id === null || id === undefined) {
    return null;
  }

  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id as BotId;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a value is a valid BotId
 */
export function isBotId(value: unknown): value is BotId {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert BotId back to a plain number
 */
export function unwrapBotId(id: BotId): number {
  return id as number;
}

/**
 * Compare two BotIds for equality
 */
export function areBotIdsEqual(a: BotId | null | undefined, b: BotId | null | undefined): boolean {
  if (a === null || a === undefined || b === null || b === undefined) {
    return a === b;
  }
  return a === b;
}
