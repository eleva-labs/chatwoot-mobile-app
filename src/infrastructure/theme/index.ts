// Theme system exports
export { tailwind, getTailwind, rebuildTailwind, createThemedTailwind } from './tailwind';
export { buildTwConfig, twConfig } from './tailwind.config';

// Color system
export * from './colors/unified';
export * from './colors/semantic';
export { brandColors } from './colors/brand';

// Token system
export * from './colors/tokens';

// Legacy theme (for backward compatibility — re-exports from unified)
export * from './default';

// Theme components
export { ThemeProvider, useTheme, useThemeColors, useThemeState } from './components/ThemeProvider';

// Backward compat alias
export { useTheme as useThemeContext } from './components/ThemeProvider';

export { createUnifiedTheme, createDefaultTheme } from './components/createTheme';

// Text styles
export * from './text-styles';
