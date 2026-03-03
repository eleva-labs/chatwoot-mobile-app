/**
 * Unified Color System
 *
 * This file contains the unified color definitions that match the web application's
 * Radix UI color system, ensuring visual consistency across platforms.
 *
 * Values sourced from the web app's _next-colors.scss (Radix UI color scales).
 */

// Color scale interface for 12-step Radix scales
export interface ColorScale1to12 {
  1: string; // App background / Lowest contrast
  2: string; // Subtle background
  3: string; // Component background
  4: string; // Component background hover
  5: string; // Component background active
  6: string; // Subtle border / separator
  7: string; // Border / interactive border
  8: string; // Border focus / stronger border
  9: string; // Solid background / accent
  10: string; // Solid background hover
  11: string; // Low-contrast text
  12: string; // High-contrast text
}

// Unified color scale interface
export interface UnifiedColorScale {
  slate: ColorScale1to12;
  iris: ColorScale1to12;
  blue: ColorScale1to12;
  ruby: ColorScale1to12;
  amber: ColorScale1to12;
  teal: ColorScale1to12;
  gray: ColorScale1to12;
}

// ============================================================================
// Dark Mode Color Scales
// Matching web app CSS variables EXACTLY from _next-colors.scss :root.dark
// ============================================================================

export const darkModeColorScales: UnifiedColorScale = {
  slate: {
    1: 'rgb(17, 17, 19)',
    2: 'rgb(24, 25, 27)',
    3: 'rgb(33, 34, 37)',
    4: 'rgb(39, 42, 45)',
    5: 'rgb(46, 49, 53)',
    6: 'rgb(54, 58, 63)',
    7: 'rgb(67, 72, 78)',
    8: 'rgb(90, 97, 105)',
    9: 'rgb(105, 110, 119)',
    10: 'rgb(119, 123, 132)',
    11: 'rgb(176, 180, 186)',
    12: 'rgb(237, 238, 240)',
  },
  iris: {
    1: 'rgb(19, 19, 30)',
    2: 'rgb(23, 22, 37)',
    3: 'rgb(32, 34, 72)',
    4: 'rgb(38, 42, 101)',
    5: 'rgb(48, 51, 116)',
    6: 'rgb(61, 62, 130)',
    7: 'rgb(74, 74, 149)',
    8: 'rgb(89, 88, 177)',
    9: 'rgb(91, 91, 214)',
    10: 'rgb(84, 114, 228)',
    11: 'rgb(158, 177, 255)',
    12: 'rgb(224, 223, 254)',
  },
  blue: {
    1: 'rgb(10, 17, 28)',
    2: 'rgb(15, 24, 38)',
    3: 'rgb(15, 39, 72)',
    4: 'rgb(10, 49, 99)',
    5: 'rgb(18, 61, 117)',
    6: 'rgb(29, 84, 134)',
    7: 'rgb(40, 89, 156)',
    8: 'rgb(48, 106, 186)',
    9: 'rgb(39, 129, 246)',
    10: 'rgb(21, 116, 231)',
    11: 'rgb(126, 182, 255)',
    12: 'rgb(205, 227, 255)',
  },
  ruby: {
    1: 'rgb(25, 17, 19)',
    2: 'rgb(30, 21, 23)',
    3: 'rgb(58, 20, 30)',
    4: 'rgb(78, 19, 37)',
    5: 'rgb(94, 26, 46)',
    6: 'rgb(111, 37, 57)',
    7: 'rgb(136, 52, 71)',
    8: 'rgb(179, 68, 90)',
    9: 'rgb(229, 70, 102)',
    10: 'rgb(236, 90, 114)',
    11: 'rgb(255, 148, 157)',
    12: 'rgb(254, 210, 225)',
  },
  amber: {
    1: 'rgb(22, 18, 12)',
    2: 'rgb(29, 24, 15)',
    3: 'rgb(48, 32, 8)',
    4: 'rgb(63, 39, 0)',
    5: 'rgb(77, 48, 0)',
    6: 'rgb(92, 61, 5)',
    7: 'rgb(113, 79, 25)',
    8: 'rgb(143, 100, 36)',
    9: 'rgb(255, 197, 61)',
    10: 'rgb(255, 214, 10)',
    11: 'rgb(255, 202, 22)',
    12: 'rgb(255, 231, 179)',
  },
  teal: {
    1: 'rgb(13, 21, 20)',
    2: 'rgb(17, 28, 27)',
    3: 'rgb(13, 45, 42)',
    4: 'rgb(2, 59, 55)',
    5: 'rgb(8, 72, 67)',
    6: 'rgb(20, 87, 80)',
    7: 'rgb(28, 105, 97)',
    8: 'rgb(32, 126, 115)',
    9: 'rgb(18, 165, 148)',
    10: 'rgb(14, 179, 158)',
    11: 'rgb(11, 216, 182)',
    12: 'rgb(173, 240, 221)',
  },
  gray: {
    1: 'rgb(17, 17, 17)',
    2: 'rgb(25, 25, 25)',
    3: 'rgb(34, 34, 34)',
    4: 'rgb(42, 42, 42)',
    5: 'rgb(49, 49, 49)',
    6: 'rgb(58, 58, 58)',
    7: 'rgb(72, 72, 72)',
    8: 'rgb(96, 96, 96)',
    9: 'rgb(110, 110, 110)',
    10: 'rgb(123, 123, 123)',
    11: 'rgb(180, 180, 180)',
    12: 'rgb(238, 238, 238)',
  },
};

// ============================================================================
// Light Mode Color Scales
// Matching web app CSS variables EXACTLY from _next-colors.scss :root (light)
// ============================================================================

export const lightModeColorScales: UnifiedColorScale = {
  slate: {
    1: 'rgb(252, 252, 253)',
    2: 'rgb(249, 249, 251)',
    3: 'rgb(240, 240, 243)',
    4: 'rgb(232, 232, 236)',
    5: 'rgb(224, 225, 230)',
    6: 'rgb(217, 217, 224)',
    7: 'rgb(205, 206, 214)',
    8: 'rgb(185, 187, 198)',
    9: 'rgb(139, 141, 152)',
    10: 'rgb(128, 131, 141)',
    11: 'rgb(96, 100, 108)',
    12: 'rgb(28, 32, 36)',
  },
  iris: {
    1: 'rgb(253, 253, 255)',
    2: 'rgb(248, 248, 255)',
    3: 'rgb(240, 241, 254)',
    4: 'rgb(230, 231, 255)',
    5: 'rgb(218, 220, 255)',
    6: 'rgb(203, 205, 255)',
    7: 'rgb(184, 186, 248)',
    8: 'rgb(155, 158, 240)',
    9: 'rgb(91, 91, 214)',
    10: 'rgb(81, 81, 205)',
    11: 'rgb(87, 83, 198)',
    12: 'rgb(39, 41, 98)',
  },
  blue: {
    1: 'rgb(251, 253, 255)',
    2: 'rgb(245, 249, 255)',
    3: 'rgb(233, 243, 255)',
    4: 'rgb(218, 236, 255)',
    5: 'rgb(201, 226, 255)',
    6: 'rgb(181, 213, 255)',
    7: 'rgb(155, 195, 252)',
    8: 'rgb(117, 171, 247)',
    9: 'rgb(39, 129, 246)',
    10: 'rgb(16, 115, 233)',
    11: 'rgb(8, 109, 224)',
    12: 'rgb(11, 50, 101)',
  },
  ruby: {
    1: 'rgb(255, 252, 253)',
    2: 'rgb(255, 247, 248)',
    3: 'rgb(254, 234, 237)',
    4: 'rgb(255, 220, 225)',
    5: 'rgb(255, 206, 214)',
    6: 'rgb(248, 191, 200)',
    7: 'rgb(239, 172, 184)',
    8: 'rgb(229, 146, 163)',
    9: 'rgb(229, 70, 102)',
    10: 'rgb(220, 59, 93)',
    11: 'rgb(202, 36, 77)',
    12: 'rgb(100, 23, 43)',
  },
  amber: {
    1: 'rgb(254, 253, 251)',
    2: 'rgb(254, 251, 233)',
    3: 'rgb(255, 247, 194)',
    4: 'rgb(255, 238, 156)',
    5: 'rgb(251, 229, 119)',
    6: 'rgb(243, 214, 115)',
    7: 'rgb(233, 193, 98)',
    8: 'rgb(226, 163, 54)',
    9: 'rgb(255, 197, 61)',
    10: 'rgb(255, 186, 24)',
    11: 'rgb(171, 100, 0)',
    12: 'rgb(79, 52, 34)',
  },
  teal: {
    1: 'rgb(250, 254, 253)',
    2: 'rgb(243, 251, 249)',
    3: 'rgb(224, 248, 243)',
    4: 'rgb(204, 243, 234)',
    5: 'rgb(184, 234, 224)',
    6: 'rgb(161, 222, 210)',
    7: 'rgb(131, 205, 193)',
    8: 'rgb(83, 185, 171)',
    9: 'rgb(18, 165, 148)',
    10: 'rgb(13, 155, 138)',
    11: 'rgb(0, 133, 115)',
    12: 'rgb(13, 61, 56)',
  },
  gray: {
    1: 'rgb(252, 252, 252)',
    2: 'rgb(249, 249, 249)',
    3: 'rgb(240, 240, 240)',
    4: 'rgb(232, 232, 232)',
    5: 'rgb(224, 224, 224)',
    6: 'rgb(217, 217, 217)',
    7: 'rgb(206, 206, 206)',
    8: 'rgb(187, 187, 187)',
    9: 'rgb(141, 141, 141)',
    10: 'rgb(131, 131, 131)',
    11: 'rgb(100, 100, 100)',
    12: 'rgb(32, 32, 32)',
  },
};

// ============================================================================
// Helper
// ============================================================================

/**
 * Get the Radix color scales for the given theme mode.
 */
export const getRadixScales = (isDark: boolean): UnifiedColorScale =>
  isDark ? darkModeColorScales : lightModeColorScales;
