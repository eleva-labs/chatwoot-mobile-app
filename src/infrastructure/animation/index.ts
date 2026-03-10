// ─── Token constants (single source of truth) ──────────────────
export { spring, timing, PRESS_SCALE_VALUE } from './springs';

// ─── Types ──────────────────────────────────────────────────────
export type { WorkletSpringConfig, TimingPreset } from './springs';

// ─── Animation factory functions ────────────────────────────────
export {
  // Layout transitions
  softLayout,
  snappyLayout,
  // Slide animations
  snappySlideInDown,
  snappySlideInUp,
  snappySlideOutDown,
  // Fade animations
  quickFadeIn,
  fastFadeIn,
  standardFadeIn,
  standardFadeOut,
  contentFadeIn,
  contentFadeOut,
  contentFadeInLinear,
  slowFadeIn,
  instantFadeOut,
  fastFadeOut,
  // Generic factories
  createSlideIn,
  createSlideOut,
  createLayoutTransition,
  createFadeIn,
  createFadeOut,
} from './animations';
