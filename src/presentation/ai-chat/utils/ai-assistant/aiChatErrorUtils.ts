/**
 * AI Chat Error Utilities
 *
 * Error categorization and display configuration.
 * No React or React Native dependencies -- candidates for @eleva/ai-chat-core.
 */

export type ErrorCategory = 'network' | 'rate_limit' | 'auth' | 'server' | 'unknown';

/**
 * Categorize an error message into a predefined category.
 *
 * Uses string matching heuristics to determine the error type.
 * The string signature is more composable than accepting an Error object --
 * callers can pass error.message directly.
 *
 * @param message - The error message string to categorize
 */
export function categorizeError(message: string): ErrorCategory {
  const lower = message.toLowerCase();
  if (lower.includes('network') || lower.includes('fetch')) return 'network';
  if (lower.includes('429') || lower.includes('rate')) return 'rate_limit';
  if (lower.includes('401') || lower.includes('403')) return 'auth';
  if (/5\d{2}/.test(message)) return 'server';
  return 'unknown';
}

export interface ErrorDisplayConfig {
  titleKey: string;
  iconType: 'wifi-off' | 'clock' | 'lock' | 'server-crash' | 'alert-circle';
  accentBg: string;
  accentBorder: string;
  accentText: string;
}

/**
 * Map error category to display configuration.
 *
 * Token values are Tailwind class strings -- consumed by twrnc (RN) or Tailwind CSS (web).
 */
export const ERROR_DISPLAY_CONFIG: Record<ErrorCategory, ErrorDisplayConfig> = {
  network: {
    titleKey: 'AI_ASSISTANT.CHAT.ERRORS.NETWORK',
    iconType: 'wifi-off',
    accentBg: 'bg-amber-3',
    accentBorder: 'border-amber-4',
    accentText: 'text-amber-11',
  },
  rate_limit: {
    titleKey: 'AI_ASSISTANT.CHAT.ERRORS.RATE_LIMIT',
    iconType: 'clock',
    accentBg: 'bg-amber-3',
    accentBorder: 'border-amber-4',
    accentText: 'text-amber-11',
  },
  auth: {
    titleKey: 'AI_ASSISTANT.CHAT.ERRORS.AUTH',
    iconType: 'lock',
    accentBg: 'bg-ruby-3',
    accentBorder: 'border-ruby-4',
    accentText: 'text-ruby-11',
  },
  server: {
    titleKey: 'AI_ASSISTANT.CHAT.ERRORS.SERVER',
    iconType: 'server-crash',
    accentBg: 'bg-ruby-3',
    accentBorder: 'border-ruby-4',
    accentText: 'text-ruby-11',
  },
  unknown: {
    titleKey: 'AI_ASSISTANT.CHAT.ERRORS.UNKNOWN',
    iconType: 'alert-circle',
    accentBg: 'bg-ruby-3',
    accentBorder: 'border-ruby-4',
    accentText: 'text-ruby-11',
  },
};
