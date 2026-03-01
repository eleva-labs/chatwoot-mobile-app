/**
 * AI Theme Hook [RN]
 *
 * React context-based theme provider for AI chat components.
 * Wraps the existing token system so it can be overridden by consumers
 * without depending on Chatwoot's tailwind singleton.
 *
 * Components use useAITheme() instead of direct tailwind.color() calls.
 * The useAIStyles() hook is preserved for backward compatibility; this
 * hook provides the lower-level color resolution that tailwind.color()
 * currently handles.
 */

import { createContext, useContext, useCallback } from 'react';
import { tailwind } from '@/theme/tailwind';

// ============================================================================
// Types
// ============================================================================

/**
 * Theme token values that can be overridden by consumers.
 * Keys are Tailwind-style class names (e.g., 'text-slate-12').
 * Values are resolved color strings (e.g., '#1C2024').
 */
export type AIThemeTokens = Record<string, string>;

export interface AIThemeContextValue {
  /** Resolve a Tailwind color token to a concrete color string */
  resolveColor: (token: string, fallback: string) => string;
  /** Optional token overrides */
  overrides: AIThemeTokens;
}

// ============================================================================
// Default Theme
// ============================================================================

const defaultThemeContext: AIThemeContextValue = {
  resolveColor: (token: string, fallback: string) => {
    return tailwind.color(token) ?? fallback;
  },
  overrides: {},
};

// ============================================================================
// Context & Hook
// ============================================================================

const AIThemeContext = createContext<AIThemeContextValue>(defaultThemeContext);

export const AIThemeContextProvider = AIThemeContext.Provider;

/**
 * Hook to access the AI theme context.
 * Returns resolveColor for converting tokens to concrete colors.
 */
export function useAITheme(): AIThemeContextValue {
  return useContext(AIThemeContext);
}

/**
 * Convenience hook for resolving colors.
 * Returns a stable resolveColor function.
 */
export function useResolveColor(): (token: string, fallback: string) => string {
  const { resolveColor, overrides } = useContext(AIThemeContext);
  return useCallback(
    (token: string, fallback: string) => {
      if (overrides[token]) return overrides[token];
      return resolveColor(token, fallback);
    },
    [resolveColor, overrides],
  );
}

export { defaultThemeContext };
