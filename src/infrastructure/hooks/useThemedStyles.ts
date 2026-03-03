import { useMemo } from 'react';
import { useTheme } from '@infrastructure/context/ThemeContext';
import { tailwind } from '@infrastructure/theme/tailwind';

export const useThemedStyles = () => {
  const { themeVersion } = useTheme();

  // Return an object with theme-aware style methods
  // The tailwind singleton is rebuilt on theme change by ThemeProvider,
  // so no regex transformations are needed — Radix classes auto-resolve.
  return useMemo(
    () => ({
      style: (...classes: (string | undefined | false)[]) => {
        const allClasses = classes.filter(Boolean).join(' ');
        return tailwind.style(allClasses);
      },
      color: (colorClass: string) => {
        return tailwind.color(colorClass);
      },
    }),
    // themeVersion ensures we re-create after tailwind is rebuilt
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [themeVersion],
  );
};

// Convenience function for theme-aware styling
export const useThemeAwareStyle = (lightStyle: string, darkStyle?: string) => {
  const { isDark } = useTheme();
  const themedTailwind = useThemedStyles();

  return useMemo(() => {
    const style = isDark && darkStyle ? darkStyle : lightStyle;
    return themedTailwind.style(style);
  }, [isDark, lightStyle, darkStyle, themedTailwind]);
};
