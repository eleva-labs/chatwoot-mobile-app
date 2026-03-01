/**
 * Unified Theme Provider
 *
 * Merges the legacy ThemeContext and Radix ThemeProvider into a single provider.
 * Manages theme state, rebuilds the tailwind singleton on theme changes,
 * and provides theme-aware utilities to the component tree.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import { UnifiedColorScale, getRadixScales } from '../colors/unified';
import { SemanticColors, getSemanticColors } from '../colors/semantic';
import { rebuildTailwind } from '../tailwind';

type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  /** Current theme mode setting */
  theme: ThemeMode;
  /** Whether dark mode is active (resolved from theme mode + system preference) */
  isDark: boolean;
  /** Current Radix 12-step color scales for the active mode */
  colors: UnifiedColorScale;
  /** Current semantic color mappings for the active mode */
  semanticColors: SemanticColors;
  /** Toggle between light and dark (exits 'system' mode) */
  toggleTheme: () => void;
  /** Set an explicit theme mode */
  setTheme: (theme: ThemeMode) => void;
  /** Monotonically increasing counter — changes on every theme rebuild */
  themeVersion: number;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const themeVersionRef = useRef(0);
  const [themeVersion, setThemeVersion] = useState(0);

  // Resolve isDark from theme mode + system preference
  const isDark = theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  // Rebuild tailwind when isDark changes
  useEffect(() => {
    rebuildTailwind(isDark);
    themeVersionRef.current += 1;
    setThemeVersion(themeVersionRef.current);
  }, [isDark]);

  // Get current color scales
  const colors = getRadixScales(isDark);
  const semanticColors = getSemanticColors(isDark);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const contextValue: ThemeContextType = {
    theme,
    isDark,
    colors,
    semanticColors,
    toggleTheme,
    setTheme,
    themeVersion,
  };

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

// Custom hook to use theme context (replaces BOTH legacy useTheme and Radix useTheme)
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Convenience hook — returns only { colors, semanticColors }
export const useThemeColors = () => {
  const { colors, semanticColors } = useTheme();
  return { colors, semanticColors };
};

// Convenience hook — returns only { isDark, toggleTheme, setTheme }
export const useThemeState = () => {
  const { isDark, toggleTheme, setTheme } = useTheme();
  return { isDark, toggleTheme, setTheme };
};

export { ThemeContext };
