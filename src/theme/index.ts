// Legacy theme system (for backward compatibility)
export * from './default';
export { tailwind, createThemedTailwind } from './tailwind';

// Unified theme system exports
export * from './colors/unified';
export * from './colors/semantic';

// Token system (base types for feature tokens)
export * from './colors/tokens';

// Theme components (with specific exports to avoid conflicts)
export {
  ThemeProvider,
  useTheme as useThemeContext,
  useThemeColors,
  useThemeState,
} from './components/ThemeProvider';
export { createUnifiedTheme, createDefaultTheme } from './components/createTheme';
export { useTheme } from './components/useTheme';
