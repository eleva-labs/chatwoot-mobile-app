/**
 * Legacy ThemeContext — re-exports from unified ThemeProvider
 *
 * This file exists for backward compatibility. ~170+ files import useTheme from here.
 * All functionality is now provided by the unified ThemeProvider in @/theme/components/ThemeProvider.
 */
export { ThemeProvider, useTheme } from '@/theme/components/ThemeProvider';
