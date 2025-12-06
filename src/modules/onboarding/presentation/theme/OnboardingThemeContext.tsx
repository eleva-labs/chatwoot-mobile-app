import React, { createContext, useContext, useMemo } from 'react';
import type { OnboardingTheme } from './OnboardingTheme';
import { defaultOnboardingTheme } from './OnboardingTheme';

interface OnboardingThemeContextType {
  theme: OnboardingTheme;
}

const OnboardingThemeContext = createContext<OnboardingThemeContextType | undefined>(undefined);

interface OnboardingThemeProviderProps {
  theme?: Partial<OnboardingTheme>;
  children: React.ReactNode;
}

/**
 * Onboarding Theme Provider
 *
 * Provides theme configuration to onboarding components.
 * Merges custom theme with defaults.
 */
export function OnboardingThemeProvider({
  theme: customTheme,
  children,
}: OnboardingThemeProviderProps) {
  const theme = useMemo(() => {
    if (!customTheme) {
      return defaultOnboardingTheme;
    }

    // Deep merge custom theme with defaults
    return {
      colors: {
        ...defaultOnboardingTheme.colors,
        ...customTheme.colors,
      },
      fonts: {
        title: {
          ...defaultOnboardingTheme.fonts.title,
          ...customTheme.fonts?.title,
        },
        body: {
          ...defaultOnboardingTheme.fonts.body,
          ...customTheme.fonts?.body,
        },
        caption: {
          ...defaultOnboardingTheme.fonts.caption,
          ...customTheme.fonts?.caption,
        },
      },
      spacing: {
        ...defaultOnboardingTheme.spacing,
        ...customTheme.spacing,
      },
      borderRadius: {
        ...defaultOnboardingTheme.borderRadius,
        ...customTheme.borderRadius,
      },
      shadows: {
        ...defaultOnboardingTheme.shadows,
        ...customTheme.shadows,
      },
    } as OnboardingTheme;
  }, [customTheme]);

  return (
    <OnboardingThemeContext.Provider value={{ theme }}>{children}</OnboardingThemeContext.Provider>
  );
}

/**
 * Hook to access onboarding theme
 */
export function useOnboardingTheme(): OnboardingTheme {
  const context = useContext(OnboardingThemeContext);
  if (!context) {
    // Fallback to default theme if not wrapped in provider
    return defaultOnboardingTheme;
  }
  return context.theme;
}
