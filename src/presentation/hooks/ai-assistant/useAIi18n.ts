/**
 * AI i18n Hook [RN]
 *
 * React context-based i18n for the AI chat package.
 * Components use useAIi18n() instead of direct i18n.t() calls,
 * allowing the package to be used without Chatwoot's i18n system.
 */

import { createContext, useContext } from 'react';
import type { I18nProvider } from '@/types/ai-chat/chatConfig';
import enJson from '@/i18n/en.json';

// ============================================================================
// Types
// ============================================================================

/**
 * Extended I18n provider with locale metadata.
 */
export interface AIi18nProvider extends I18nProvider {
  locale?: string;
  dir?: 'ltr' | 'rtl';
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Traverses a nested object by splitting `keyPath` on `.` and returns the
 * leaf value if it is a string, or undefined otherwise.
 */
function getNestedValue(obj: Record<string, unknown>, keyPath: string): string | undefined {
  const keys = keyPath.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : undefined;
}

/**
 * Simple interpolation: replaces %{key} with values from params.
 */
function interpolate(template: string, params?: Record<string, unknown>): string {
  if (!params) return template;
  return template.replace(/%\{(\w+)\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : `%{${key}}`;
  });
}

// ============================================================================
// Default I18n
// ============================================================================

const defaultI18n: AIi18nProvider = {
  t: (key: string, params?: Record<string, unknown>) => {
    const template = getNestedValue(enJson as Record<string, unknown>, key);
    if (template) {
      return interpolate(template, params);
    }
    // Fallback: extract last segment and humanize
    const lastSegment = key.split('.').pop();
    return lastSegment?.replace(/_/g, ' ').toLowerCase() ?? key;
  },
  locale: 'en',
  dir: 'ltr',
};

// ============================================================================
// Context & Hook
// ============================================================================

const AIi18nContext = createContext<AIi18nProvider>(defaultI18n);

export const AIi18nContextProvider = AIi18nContext.Provider;

/**
 * Hook to access the AI i18n provider.
 * Returns { t, locale, dir } for translation and locale info.
 */
export function useAIi18n(): AIi18nProvider {
  return useContext(AIi18nContext);
}

export { defaultI18n };
