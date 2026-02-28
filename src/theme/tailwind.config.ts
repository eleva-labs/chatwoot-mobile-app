/* eslint-disable @typescript-eslint/no-require-imports */
import { getRadixScales } from './colors/unified';
import { getSemanticColors } from './colors/semantic';
import { brandColors } from './colors/brand';

const defaultTheme = require('tailwindcss/defaultTheme');

const blackA = require('./colors/blackA');
const whiteA = require('./colors/whiteA');

// Legacy color support (for backward compatibility during migration)
const radixUILightColors = require('./colors/light');
const radixUIDarkColors = require('./colors/dark');

/**
 * Build the Tailwind config for a specific theme mode.
 * This eliminates the overwrite bug by only loading the active theme's Radix scales.
 */
export const buildTwConfig = (isDark: boolean) => {
  const radixScales = getRadixScales(isDark);
  const semanticColors = getSemanticColors(isDark);

  return {
    theme: {
      ...defaultTheme,
      extend: {
        colors: {
          // Legacy colors (backward compat — both modes needed for regex dark mode)
          ...blackA,
          ...whiteA,
          ...radixUILightColors,
          ...radixUIDarkColors,

          // Radix 12-step scales (theme-aware — only active mode loaded)
          slate: radixScales.slate,
          iris: radixScales.iris,
          blue: radixScales.blue,
          ruby: radixScales.ruby,
          amber: radixScales.amber,
          teal: radixScales.teal,
          gray: radixScales.gray,

          // Brand colors (mode-independent)
          brand: brandColors.brand,
          lightBrand: brandColors.lightBrand,
          inactive: brandColors.inactive,

          // Semantic surface colors
          background: semanticColors.background,
          'solid-1': semanticColors.solid1,
          'solid-2': semanticColors.solid2,
          'solid-3': semanticColors.solid3,
          'solid-active': semanticColors.solidActive,
          'solid-amber': semanticColors.solidAmber,
          'solid-blue': semanticColors.solidBlue,
          'solid-iris': semanticColors.solidIris,

          // Semantic border colors
          weak: semanticColors.borderWeak,
          strong: semanticColors.borderStrong,
          container: semanticColors.borderContainer,
          'blue-border': semanticColors.borderBlue,

          // Semantic text colors
          'blue-text': semanticColors.textBlue,

          // Alpha/overlay colors
          'alpha-1': semanticColors.alpha1,
          'alpha-2': semanticColors.alpha2,
          'alpha-3': semanticColors.alpha3,
          'alpha-black1': semanticColors.blackAlpha1,
          'alpha-black2': semanticColors.blackAlpha2,
          'alpha-white': semanticColors.whiteAlpha,

          // Standard
          white: '#FFFFFF',
          black: '#000000',
          transparent: 'transparent',
        },
        fontSize: {
          xxs: '10px',
          xs: '12px',
          cxs: '13px',
          md: '15px',
          '2xl': '22px',
        },
        // We are using individual static Inter font files (e.g., Inter-400-20.ttf) to load different font weights and styles
        // Please refer to the following links for more information:
        // https://medium.com/timeless/adding-custom-variable-fonts-in-react-native-47e0d062bcfc
        // https://medium.com/timeless/adding-custom-variable-fonts-in-react-native-part-ii-d11a979a38f3
        // - Normal/Regular: "inter-normal-20" (400)
        // - Slightly heavier than Regular: "inter-420-20" (400)
        // - Medium: "inter-medium-24" (500)
        // - Between Medium and Semi-bold: "inter-580-24" (600)
        // - Semi-bold: "inter-semibold-24" (600)
        // -  Last numbers (20, 24 etc) are optical sizes.
        fontFamily: {
          'inter-normal-20': ['Inter-400-20'],
          'inter-420-20': ['Inter-420-20'],
          'inter-medium-24': ['Inter-500-24'],
          'inter-580-24': ['Inter-580-24'],
          'inter-semibold-20': ['Inter-600-20'],
        },
      },
    },
    plugins: [],
  };
};

// Default light mode config (backward compat for static imports)
export const twConfig = buildTwConfig(false);
