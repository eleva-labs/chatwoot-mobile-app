/**
 * Onboarding Theme Configuration
 *
 * Allows customization of colors, fonts, spacing, and other visual aspects.
 */

export interface OnboardingThemeColors {
  primary: string;
  primaryDark?: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  error: string;
  border: string;
  borderLight?: string;
  success?: string;
  warning?: string;
}

export interface OnboardingThemeFonts {
  title: {
    family?: string;
    size: number;
    weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  };
  body: {
    family?: string;
    size: number;
    weight?: 'normal' | 'medium' | 'semibold';
  };
  caption: {
    family?: string;
    size: number;
    weight?: 'normal' | 'medium';
  };
}

export interface OnboardingThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface OnboardingTheme {
  colors: OnboardingThemeColors;
  fonts: OnboardingThemeFonts;
  spacing: OnboardingThemeSpacing;
  borderRadius?: {
    sm: number;
    md: number;
    lg: number;
  };
  shadows?: {
    sm: object;
    md: object;
    lg: object;
  };
}

/**
 * Default theme
 */
export const defaultOnboardingTheme: OnboardingTheme = {
  colors: {
    primary: '#4A90E2',
    primaryDark: '#357ABD',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#000000',
    textSecondary: '#666666',
    error: '#D32F2F',
    border: '#E0E0E0',
    borderLight: '#F0F0F0',
    success: '#4CAF50',
    warning: '#FF9800',
  },
  fonts: {
    title: {
      size: 24,
      weight: 'semibold',
    },
    body: {
      size: 16,
      weight: 'normal',
    },
    caption: {
      size: 14,
      weight: 'normal',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
  },
};

/**
 * Dark theme variant
 */
export const darkOnboardingTheme: OnboardingTheme = {
  ...defaultOnboardingTheme,
  colors: {
    primary: '#5BA3F5',
    primaryDark: '#4A90E2',
    background: '#1A1A1A',
    surface: '#2A2A2A',
    text: '#FFFFFF',
    textSecondary: '#CCCCCC',
    error: '#F44336',
    border: '#404040',
    borderLight: '#333333',
    success: '#66BB6A',
    warning: '#FFA726',
  },
};
