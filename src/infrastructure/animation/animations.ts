import {
  LinearTransition,
  SlideInDown,
  SlideInUp,
  SlideInRight,
  SlideInLeft,
  SlideOutDown,
  SlideOutUp,
  SlideOutRight,
  SlideOutLeft,
  FadeIn,
  FadeOut,
  Easing,
} from 'react-native-reanimated';
import type { WorkletSpringConfig } from './springs';
import { spring, timing } from './springs';

// ═══════════════════════════════════════════════════════════════════
// IMPORTANT: All exports are FACTORY FUNCTIONS, not singletons.
//
// Reanimated layout animation builders are mutable objects. Sharing a
// single instance across components causes animation interference.
// Each call returns a fresh builder instance.
//
// Usage: layout={softLayout()}  ← parentheses required
// ═══════════════════════════════════════════════════════════════════

// ─── Layout Transitions ─────────────────────────────────────────

/** Soft layout transition (damping 28, stiffness 200). Most common. */
export const softLayout = () =>
  LinearTransition.springify().damping(spring.soft.damping).stiffness(spring.soft.stiffness);

/** Snappy layout transition (damping 80, stiffness 240). Panels, reply box. */
export const snappyLayout = () =>
  LinearTransition.springify().damping(spring.snappy.damping).stiffness(spring.snappy.stiffness);

// ─── Slide Animations (spring-based) ────────────────────────────

/** Snappy slide-in from bottom. Attached media, command menus. */
export const snappySlideInDown = () =>
  SlideInDown.springify().damping(spring.snappy.damping).stiffness(spring.snappy.stiffness);

/** Snappy slide-in from top. Attachment list. */
export const snappySlideInUp = () =>
  SlideInUp.springify().damping(spring.snappy.damping).stiffness(spring.snappy.stiffness);

/** Snappy slide-out to bottom. Dismiss overlays, remove attached media. */
export const snappySlideOutDown = () =>
  SlideOutDown.springify().damping(spring.snappy.damping).stiffness(spring.snappy.stiffness);

// ─── Fade Animations (timing-based) ────────────────────────────

/** Quick fade in (150ms). Message appearing, spinner mount. */
export const quickFadeIn = () => FadeIn.duration(timing.quick.duration);

/** Fast fade in (200ms). Swipeable cells. */
export const fastFadeIn = () => FadeIn.duration(timing.fast.duration);

/** Standard fade in (250ms). Quote reply, code number, general content. */
export const standardFadeIn = () => FadeIn.duration(timing.standard.duration);

/** Standard fade out (250ms). Code number exit, general content dismiss. */
export const standardFadeOut = () => FadeOut.duration(timing.standard.duration);

/**
 * Content fade in (300ms + Easing.ease).
 * Media cells, file cells, location cells, audio cells.
 */
export const contentFadeIn = () => FadeIn.duration(timing.content.duration).easing(Easing.ease);

/**
 * Content fade out (300ms + Easing.ease).
 * Video overlay dismiss.
 */
export const contentFadeOut = () => FadeOut.duration(timing.content.duration).easing(Easing.ease);

/** Content fade in (300ms, no easing). MacroDetails, onboarding. */
export const contentFadeInLinear = () => FadeIn.duration(timing.content.duration);

/** Slow fade in (350ms). Text message cells, composed cells, email cells. */
export const slowFadeIn = () => FadeIn.duration(timing.slow.duration);

/** Near-instant fade out (10ms). Quote reply exit (intentionally abrupt). */
export const instantFadeOut = () => FadeOut.duration(10);

/** Fast fade out (200ms). Screen transition exits, onboarding. */
export const fastFadeOut = () => FadeOut.duration(timing.fast.duration);

// ─── Generic Factory Functions ──────────────────────────────────

type SlideDirection = 'down' | 'up' | 'left' | 'right';

const slideInMap = {
  down: SlideInDown,
  up: SlideInUp,
  left: SlideInLeft,
  right: SlideInRight,
} as const;

const slideOutMap = {
  down: SlideOutDown,
  up: SlideOutUp,
  left: SlideOutLeft,
  right: SlideOutRight,
} as const;

/**
 * Create a springified slide-in animation from a direction + spring config.
 * @example createSlideIn('down', spring.snappy)
 */
export const createSlideIn = (
  direction: SlideDirection,
  config: WorkletSpringConfig = spring.snappy,
) => {
  let animation = slideInMap[direction].springify();
  if (config.damping !== undefined) animation = animation.damping(config.damping);
  if (config.stiffness !== undefined) animation = animation.stiffness(config.stiffness);
  if (config.mass !== undefined) animation = animation.mass(config.mass);
  return animation;
};

/**
 * Create a springified slide-out animation from a direction + spring config.
 * @example createSlideOut('down', spring.snappy)
 */
export const createSlideOut = (
  direction: SlideDirection,
  config: WorkletSpringConfig = spring.snappy,
) => {
  let animation = slideOutMap[direction].springify();
  if (config.damping !== undefined) animation = animation.damping(config.damping);
  if (config.stiffness !== undefined) animation = animation.stiffness(config.stiffness);
  if (config.mass !== undefined) animation = animation.mass(config.mass);
  return animation;
};

/**
 * Create a custom LinearTransition from a spring config.
 * @example createLayoutTransition(spring.soft)
 */
export const createLayoutTransition = (config: WorkletSpringConfig) => {
  let transition = LinearTransition.springify();
  if (config.damping !== undefined) transition = transition.damping(config.damping);
  if (config.stiffness !== undefined) transition = transition.stiffness(config.stiffness);
  if (config.mass !== undefined) transition = transition.mass(config.mass);
  return transition;
};

/**
 * Create a timed fade-in animation.
 * @example createFadeIn(300, Easing.ease)
 */
export const createFadeIn = (duration: number, easing?: Parameters<typeof FadeIn.easing>[0]) => {
  const animation = FadeIn.duration(duration);
  return easing ? animation.easing(easing) : animation;
};

/**
 * Create a timed fade-out animation.
 * @example createFadeOut(200)
 */
export const createFadeOut = (duration: number, easing?: Parameters<typeof FadeOut.easing>[0]) => {
  const animation = FadeOut.duration(duration);
  return easing ? animation.easing(easing) : animation;
};
