/**
 * Theme-aware boxShadow tokens.
 *
 * Each tier has a light and dark variant. Light mode uses subtle dark shadows
 * for depth. Dark mode uses stronger dark shadows + faint light glow for
 * edge definition against dark backgrounds.
 *
 * Requires RN 0.83+ with New Architecture (boxShadow support).
 */

import { useTheme } from './components/ThemeProvider';

export const BOX_SHADOWS = {
  /** Subtle card shadow — list cards, settings panels, participant lists. */
  card: {
    light: '0px 0.5px 2px rgba(0, 0, 0, 0.12), 0px 0px 1px rgba(0, 0, 0, 0.08)',
    dark: '0px 0.5px 2px rgba(0, 0, 0, 0.5), 0px 0px 1px rgba(255, 255, 255, 0.08)',
  },

  /** Floating pill — action tabs, typing indicators.
   *  Slightly stronger than card for visual lift on overlays. */
  pill: {
    light: '0px 1px 4px rgba(0, 0, 0, 0.12), 0px 0px 1px rgba(0, 0, 0, 0.08)',
    dark: '0px 1px 4px rgba(0, 0, 0, 0.6), 0px 0px 1px rgba(255, 255, 255, 0.08)',
  },

  /** Knob/handle — slider handles, small interactive controls.
   *  Intentionally tighter and more defined than the legacy shadow (which had
   *  a softer 4px blur). The smaller blur radius produces cleaner edge definition
   *  appropriate for small interactive controls. */
  knob: {
    light: '0px 1px 2px rgba(0, 0, 0, 0.15), 0px 0px 1px rgba(0, 0, 0, 0.3)',
    dark: '0px 1px 2px rgba(0, 0, 0, 0.6), 0px 0px 1px rgba(255, 255, 255, 0.1)',
  },

  /** FAB — scroll-to-top/bottom buttons, floating action buttons. */
  fab: {
    light: '0px 2px 6px rgba(0, 0, 0, 0.15), 0px 0px 1px rgba(0, 0, 0, 0.1)',
    dark: '0px 2px 6px rgba(0, 0, 0, 0.6), 0px 0px 1px rgba(255, 255, 255, 0.08)',
  },
} as const;

export type BoxShadowTier = keyof typeof BOX_SHADOWS;

/**
 * Returns the theme-appropriate boxShadow string for the given tier.
 * Usage: `const shadow = useBoxShadow('card');`
 */
export const useBoxShadow = (tier: BoxShadowTier): string => {
  const { isDark } = useTheme();
  return isDark ? BOX_SHADOWS[tier].dark : BOX_SHADOWS[tier].light;
};
