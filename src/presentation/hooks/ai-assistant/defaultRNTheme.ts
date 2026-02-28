/**
 * Default React Native Theme [RN]
 *
 * Default color values for AI chat components on React Native.
 * These values match the Radix color scales used throughout the AI chat.
 * Consumers can override these via the AIThemeContextProvider.
 */

import type { AIThemeTokens } from './useAITheme';

/**
 * Default theme token overrides.
 * An empty record means "use tailwind.color() for everything".
 * Consumers can populate this with custom color values.
 */
export const defaultRNThemeTokens: AIThemeTokens = {};
