/**
 * AI Chat Format Utilities
 *
 * Pure formatting functions for AI chat display.
 * No React or React Native dependencies -- candidates for @eleva/ai-chat-core.
 */

import { isToday, isYesterday, format, formatDistanceToNow, differenceInDays } from 'date-fns';

/**
 * Format tool name for display.
 * Converts snake_case or camelCase to Title Case.
 *
 * @param name - The raw tool name (e.g. 'search_web', 'getWeather')
 * @param fallback - Fallback string if name is empty
 */
export function formatToolName(name: string, fallback?: string): string {
  if (!name) return fallback ?? 'Unknown Tool';

  return name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Safely stringify JSON with proper formatting.
 */
export function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/**
 * Format a date string into a human-friendly session title.
 *
 * Pure function -- i18n labels are passed as parameters.
 *
 * @param dateString - ISO date string
 * @param labels - Localized labels for today, yesterday, and recently
 *
 * @example
 * formatSessionTitle('2026-02-28T14:30:00Z', {
 *   today: 'Today',
 *   yesterday: 'Yesterday',
 *   recently: 'Recently',
 * });
 * // => "Today, 2:30 PM"
 */
export function formatSessionTitle(
  dateString: string,
  labels: { today: string; yesterday: string; recently: string },
): string {
  try {
    const date = new Date(dateString);
    if (isToday(date)) {
      return `${labels.today}, ${format(date, 'h:mm a')}`;
    }
    if (isYesterday(date)) {
      return `${labels.yesterday}, ${format(date, 'h:mm a')}`;
    }
    if (differenceInDays(new Date(), date) < 7) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return format(date, 'MMM d, h:mm a');
  } catch {
    return labels.recently;
  }
}
