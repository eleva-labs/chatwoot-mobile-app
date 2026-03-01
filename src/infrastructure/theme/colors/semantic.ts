/**
 * Semantic Color Mappings
 *
 * This file provides semantic color mappings that match the web application's
 * color system, ensuring consistent visual hierarchy and meaning across platforms.
 *
 * Values sourced from web app's _next-colors.scss CSS custom properties.
 */

// Semantic color interface
export interface SemanticColors {
  // Background colors
  background: string; // Main app background
  surface: string; // Card/container backgrounds
  surfaceElevated: string; // Elevated surfaces (modals, dropdowns)
  surfaceHover: string; // Hover states

  // Text colors
  textPrimary: string; // Primary text
  textSecondary: string; // Secondary text
  textMuted: string; // Muted/disabled text
  textInverse: string; // Text on dark backgrounds

  // Interactive colors
  primary: string; // Primary brand color
  primaryHover: string; // Primary hover state
  primaryActive: string; // Primary active state
  accent: string; // Accent color
  accentHover: string; // Accent hover state

  // Status colors
  success: string; // Success state
  warning: string; // Warning state
  error: string; // Error state
  info: string; // Info state

  // Border colors
  border: string; // Default borders
  borderStrong: string; // Strong borders
  borderWeak: string; // Subtle borders
  borderContainer: string; // Container borders

  // Input colors
  input: string; // Input backgrounds
  inputBorder: string; // Input borders
  inputFocus: string; // Input focus state

  // Overlay colors
  overlay: string; // Modal overlays
  backdrop: string; // Backdrop overlays

  // Surface solids (from --solid-* CSS vars)
  solid1: string;
  solid2: string;
  solid3: string;
  solidActive: string;
  solidAmber: string;
  solidBlue: string;
  solidIris: string;

  // Alpha overlays (from --alpha-* CSS vars)
  alpha1: string;
  alpha2: string;
  alpha3: string;
  blackAlpha1: string;
  blackAlpha2: string;
  whiteAlpha: string;

  // Text semantic
  textBlue: string;

  // Border semantic
  borderBlue: string;

  // Warning banner (theme-independent, same in both modes)
  warningBannerBg: string;
  warningBannerText: string;
}

// Create semantic colors based on theme mode
export const createSemanticColors = (isDark: boolean): SemanticColors => {
  if (isDark) {
    return { ...darkSemanticColors };
  } else {
    return { ...lightSemanticColors };
  }
};

// ============================================================================
// Predefined Dark Mode Semantic Colors
// Matching web app's _next-colors.scss :root.dark
// ============================================================================

export const darkSemanticColors: SemanticColors = {
  // Background colors
  background: 'rgb(18, 18, 19)', // --background-color dark
  surface: 'rgb(17, 17, 19)', // slate-1
  surfaceElevated: 'rgb(24, 25, 27)', // slate-2
  surfaceHover: 'rgb(33, 34, 37)', // slate-3

  // Text colors
  textPrimary: 'rgb(237, 238, 240)', // slate-12
  textSecondary: 'rgb(176, 180, 186)', // slate-11
  textMuted: 'rgb(119, 123, 132)', // slate-10
  textInverse: 'rgb(17, 17, 19)', // slate-1 (inverse)

  // Interactive colors
  primary: 'rgb(91, 91, 214)', // iris-9
  primaryHover: 'rgb(89, 88, 177)', // iris-8
  primaryActive: 'rgb(74, 74, 149)', // iris-7
  accent: 'rgb(126, 182, 255)', // --text-blue dark
  accentHover: 'rgb(126, 182, 255)', // --text-blue dark

  // Status colors
  success: 'rgb(18, 165, 148)', // teal-9
  warning: 'rgb(255, 197, 61)', // amber-9
  error: 'rgb(229, 70, 102)', // ruby-9
  info: 'rgb(126, 182, 255)', // --text-blue dark

  // Border colors
  border: 'rgb(38, 38, 42)', // --border-weak dark
  borderStrong: 'rgb(52, 52, 52)', // --border-strong dark
  borderWeak: 'rgb(38, 38, 42)', // --border-weak dark
  borderContainer: 'rgba(236, 236, 236, 0)', // --border-container dark

  // Input colors
  input: 'rgb(24, 25, 27)', // slate-2
  inputBorder: 'rgb(38, 38, 42)', // --border-weak dark
  inputFocus: 'rgb(91, 91, 214)', // iris-9

  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.6)',
  backdrop: 'rgba(0, 0, 0, 0.4)',

  // Surface solids
  solid1: 'rgb(23, 23, 26)',
  solid2: 'rgb(29, 30, 36)',
  solid3: 'rgb(44, 45, 54)',
  solidActive: 'rgb(53, 57, 66)',
  solidAmber: 'rgb(42, 37, 30)',
  solidBlue: 'rgb(16, 49, 91)',
  solidIris: 'rgb(38, 42, 101)',

  // Alpha overlays
  alpha1: 'rgba(36, 36, 36, 0.8)',
  alpha2: 'rgba(139, 147, 182, 0.15)',
  alpha3: 'rgba(36, 38, 45, 0.9)',
  blackAlpha1: 'rgba(0, 0, 0, 0.3)',
  blackAlpha2: 'rgba(0, 0, 0, 0.2)',
  whiteAlpha: 'rgba(255, 255, 255, 0.1)',

  // Text semantic
  textBlue: 'rgb(126, 182, 255)', // --text-blue dark

  // Border semantic
  borderBlue: 'rgba(39, 129, 246, 0.5)', // --border-blue

  // Warning banner (same in both modes)
  warningBannerBg: 'rgb(72, 38, 20)',
  warningBannerText: 'rgb(255, 231, 179)',
};

// ============================================================================
// Predefined Light Mode Semantic Colors
// Matching web app's _next-colors.scss :root (light)
// ============================================================================

export const lightSemanticColors: SemanticColors = {
  // Background colors
  background: 'rgb(253, 253, 253)', // --background-color light
  surface: 'rgb(252, 252, 253)', // slate-1 light
  surfaceElevated: 'rgb(249, 249, 251)', // slate-2 light
  surfaceHover: 'rgb(240, 240, 243)', // slate-3 light

  // Text colors
  textPrimary: 'rgb(28, 32, 36)', // slate-12 light
  textSecondary: 'rgb(96, 100, 108)', // slate-11 light
  textMuted: 'rgb(128, 131, 141)', // slate-10 light
  textInverse: 'rgb(252, 252, 253)', // slate-1 light (inverse)

  // Interactive colors
  primary: 'rgb(91, 91, 214)', // iris-9 light
  primaryHover: 'rgb(81, 81, 205)', // iris-10 light
  primaryActive: 'rgb(87, 83, 198)', // iris-11 light
  accent: 'rgb(39, 129, 246)', // blue-9 light
  accentHover: 'rgb(16, 115, 233)', // blue-10 light

  // Status colors
  success: 'rgb(18, 165, 148)', // teal-9 light
  warning: 'rgb(255, 197, 61)', // amber-9 light
  error: 'rgb(229, 70, 102)', // ruby-9 light
  info: 'rgb(39, 129, 246)', // blue-9 light

  // Border colors
  border: 'rgb(217, 217, 224)', // slate-6 light
  borderStrong: 'rgb(235, 235, 235)', // --border-strong light
  borderWeak: 'rgb(234, 234, 234)', // --border-weak light
  borderContainer: 'rgb(236, 236, 236)', // --border-container light

  // Input colors
  input: 'rgb(252, 252, 253)', // slate-1 light
  inputBorder: 'rgb(217, 217, 224)', // slate-6 light
  inputFocus: 'rgb(91, 91, 214)', // iris-9 light

  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.4)',
  backdrop: 'rgba(0, 0, 0, 0.2)',

  // Surface solids
  solid1: 'rgb(255, 255, 255)',
  solid2: 'rgb(255, 255, 255)',
  solid3: 'rgb(255, 255, 255)',
  solidActive: 'rgb(255, 255, 255)',
  solidAmber: 'rgb(252, 232, 193)',
  solidBlue: 'rgb(218, 236, 255)',
  solidIris: 'rgb(230, 231, 255)',

  // Alpha overlays
  alpha1: 'rgba(67, 67, 67, 0.06)',
  alpha2: 'rgba(201, 202, 207, 0.15)',
  alpha3: 'rgba(255, 255, 255, 0.96)',
  blackAlpha1: 'rgba(0, 0, 0, 0.12)',
  blackAlpha2: 'rgba(0, 0, 0, 0.04)',
  whiteAlpha: 'rgba(255, 255, 255, 0.8)',

  // Text semantic
  textBlue: 'rgb(8, 109, 224)', // --text-blue light

  // Border semantic
  borderBlue: 'rgba(39, 129, 246, 0.5)', // --border-blue

  // Warning banner (same in both modes)
  warningBannerBg: 'rgb(72, 38, 20)',
  warningBannerText: 'rgb(255, 231, 179)',
};

// ============================================================================
// Helper
// ============================================================================

/**
 * Get the semantic colors for the given theme mode.
 */
export const getSemanticColors = (isDark: boolean): SemanticColors =>
  isDark ? darkSemanticColors : lightSemanticColors;
