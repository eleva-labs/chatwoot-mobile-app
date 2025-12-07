/**
 * Base Token Architecture
 *
 * Shared interfaces that feature tokens extend.
 * Lives in theme/ because it's used across all features.
 *
 * Usage:
 * - Import base types when creating feature-specific tokens
 * - Each feature creates its own tokens extending these bases
 * - See src/components-next/ai-assistant/styles/tokens.ts for example
 */

// =============================================================================
// Base Token Interfaces
// =============================================================================

/**
 * Standard message bubble tokens (background, text, border)
 * Used for chat bubbles, notifications, alerts
 */
export interface BaseMessageTokens {
  /** Background class: e.g., 'bg-iris-3' */
  background: string;
  /** Text class: e.g., 'text-iris-12' */
  text: string;
  /** Border class: e.g., 'border-iris-6' */
  border: string;
}

/**
 * Text hierarchy tokens
 * Used for consistent text styling across features
 */
export interface BaseTextTokens {
  /** Primary text: e.g., 'text-slate-12' */
  primary: string;
  /** Secondary text: e.g., 'text-slate-11' */
  secondary: string;
  /** Muted/tertiary text: e.g., 'text-slate-10' */
  muted: string;
  /** Link text: e.g., 'text-blue-9' */
  link: string;
}

/**
 * Status indicator tokens
 * Used for success/warning/error/info states
 */
export interface BaseStatusTokens {
  /** Success state: e.g., 'text-teal-9' */
  success: string;
  /** Warning state: e.g., 'text-amber-9' */
  warning: string;
  /** Error state: e.g., 'text-ruby-9' */
  error: string;
  /** Info state: e.g., 'text-blue-9' */
  info: string;
}

/**
 * Interactive element tokens
 * Used for buttons, touchables, pressables
 */
export interface BaseInteractiveTokens {
  /** Default state */
  default: string;
  /** Hover/focus state */
  hover: string;
  /** Active/pressed state */
  active: string;
  /** Disabled state */
  disabled: string;
}

/**
 * Collapsible/accordion tokens
 * Used for expandable sections
 */
export interface BaseCollapsibleTokens {
  /** Border class */
  border: string;
  /** Background class */
  background: string;
  /** Icon color class */
  icon: string;
  /** Label text class */
  label: string;
  /** Chevron/arrow icon class */
  chevron: string;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Wrapper type for creating readonly feature tokens
 *
 * @example
 * type MyTokens = FeatureTokens<{
 *   primary: BaseMessageTokens;
 *   secondary: BaseMessageTokens;
 * }>;
 */
export type FeatureTokens<T> = {
  readonly [K in keyof T]: T[K];
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Creates a type-safe getter for role-based tokens
 *
 * @example
 * const messageTokens = {
 *   user: { background: 'bg-iris-3', text: 'text-iris-12', border: 'border-iris-6' },
 *   assistant: { background: 'bg-slate-3', text: 'text-slate-12', border: 'border-slate-6' },
 * };
 * const getMessageTokens = createRoleGetter(messageTokens);
 * const userTokens = getMessageTokens('user'); // Type-safe!
 */
export const createRoleGetter = <T extends Record<string, BaseMessageTokens>>(tokens: T) => {
  return (role: keyof T): T[keyof T] => tokens[role];
};

/**
 * Creates a type-safe getter for accent-based tokens
 *
 * @example
 * const collapsibleTokens = {
 *   iris: { border: '...', background: '...' },
 *   slate: { border: '...', background: '...' },
 * };
 * const getAccentTokens = createAccentGetter(collapsibleTokens);
 * const irisTokens = getAccentTokens('iris'); // Type-safe!
 */
export const createAccentGetter = <T extends Record<string, BaseCollapsibleTokens>>(tokens: T) => {
  return (accent: keyof T): T[keyof T] => tokens[accent];
};
