import type { WithSpringConfig } from 'react-native-reanimated';

// ─── Types ──────────────────────────────────────────────────────

/**
 * A spring config safe for use inside worklets.
 * Must be a plain object — no closures, no class instances.
 */
export type WorkletSpringConfig = WithSpringConfig;

/**
 * A timing config for withTiming animations.
 */
export type TimingPreset = {
  readonly duration: number;
};

// ─── Spring Tokens ──────────────────────────────────────────────

/**
 * Spring animation tokens — the single source of truth.
 *
 * Plain objects (`as const`) — safe for worklets, safe for spreading.
 * Grouped by usage pattern, not by numeric similarity.
 *
 * Usage:
 *   import { spring } from '@infrastructure/animation';
 *   withSpring(value, spring.soft);
 */
export const spring = {
  /** Soft, organic UI transitions (layout shifts, opacity, scale). */
  soft: {
    damping: 28,
    stiffness: 200,
  },

  /** Snappy overlay transitions (slide-in panels, entering/exiting sheets). */
  snappy: {
    damping: 80,
    stiffness: 240,
  },

  /** Bottom sheet snap animation. */
  sheet: {
    mass: 1,
    stiffness: 420,
    damping: 80,
  },

  /** Tab bar enter transition. */
  tabEnter: {
    damping: 30,
    stiffness: 360,
    mass: 1,
  },

  /** Tab bar exit transition. */
  tabExit: {
    damping: 28,
    stiffness: 360,
    mass: 1,
  },

  /** Swipeable row close animation. */
  swipeClose: {
    damping: 30,
    stiffness: 360,
    mass: 1,
  },

  /** Tap/press gesture feedback. */
  tapFeedback: {
    damping: 25,
    stiffness: 120,
  },

  /** Press-and-hold scale animation (useScaleAnimation default). */
  pressScale: {
    mass: 1,
    damping: 28,
    stiffness: 200,
    overshootClamping: true,
  },

  /** Keyboard tracking animation (iOS). Very heavy, overdamped. */
  keyboard: {
    damping: 500,
    stiffness: 1000,
    mass: 3,
    overshootClamping: true,
  },
} as const satisfies Record<string, WorkletSpringConfig>;

// ─── Timing Tokens ──────────────────────────────────────────────

/**
 * Timing animation presets.
 *
 * Usage:
 *   import { timing } from '@infrastructure/animation';
 *   withTiming(value, timing.standard);
 */
export const timing = {
  /** 150ms — quick dismiss, fast feedback */
  quick: { duration: 150 },

  /** 200ms — fast exit transitions, screen transition exits */
  fast: { duration: 200 },

  /** 250ms — standard UI transition, opacity toggle */
  standard: { duration: 250 },

  /** 300ms — content appearance, media fade-in, progress bars */
  content: { duration: 300 },

  /** 350ms — deliberate transitions, text message cells */
  slow: { duration: 350 },
} as const satisfies Record<string, TimingPreset>;

// ─── Constants ──────────────────────────────────────────────────

/** Default scale value for press animations. Matches useScaleAnimation default. */
export const PRESS_SCALE_VALUE = 0.96;
