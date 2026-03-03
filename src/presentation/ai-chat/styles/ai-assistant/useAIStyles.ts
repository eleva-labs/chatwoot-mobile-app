/**
 * AI Styles Hook
 *
 * Provides theme-aware styling for AI assistant components.
 * Combines useThemedStyles with AI-specific tokens.
 *
 * @example
 * const { style, tokens, message, getCollapsible } = useAIStyles();
 *
 * // Message bubble styling
 * const msgTokens = message('user');
 * <View style={style(msgTokens.background, 'rounded-xl p-3')}>
 *   <Text style={style(msgTokens.text)}>Hello</Text>
 * </View>
 *
 * // Collapsible styling
 * const collapsible = getCollapsible('iris');
 * <View style={style(collapsible.background, collapsible.border)} />
 */

import { useMemo } from 'react';

import { useThemedStyles } from '@infrastructure/hooks';

import {
  // Token objects
  aiMessageTokens,
  aiTextTokens,
  aiToolTokens,
  aiCollapsibleTokens,
  aiHeaderTokens,
  aiInputTokens,
  aiSessionTokens,
  aiFabTokens,
  // Helper functions
  getMessageTokens,
  getCollapsibleTokens,
  getCursorToken,
  getTextColorByRole,
  // Types
  type AIAccentColor,
  type AIMessageTokens,
  type AITextTokens,
  type AIToolTokens,
  type AICollapsibleTokens,
  type AIHeaderTokens,
  type AIInputTokens,
  type AISessionTokens,
  type AIFabTokens,
} from './tokens';

// =============================================================================
// Types
// =============================================================================

export interface AIStylesResult {
  /**
   * Theme-aware style applicator
   * Applies Tailwind classes with automatic dark/light mode handling
   */
  style: (...classes: (string | undefined | false)[]) => object;

  /**
   * Direct access to all token objects
   */
  tokens: {
    message: AIMessageTokens;
    text: AITextTokens;
    tool: AIToolTokens;
    collapsible: Record<AIAccentColor, AICollapsibleTokens>;
    header: AIHeaderTokens;
    input: AIInputTokens;
    session: AISessionTokens;
    fab: AIFabTokens;
  };

  /**
   * Get message tokens by role
   * @param role 'user' | 'assistant'
   */
  message: typeof getMessageTokens;

  /**
   * Get collapsible tokens by accent color
   * @param accent 'iris' | 'slate' | 'teal' | 'ruby' | 'amber'
   */
  getCollapsible: typeof getCollapsibleTokens;

  /**
   * Get cursor token by role
   * @param role 'user' | 'assistant'
   */
  getCursor: typeof getCursorToken;

  /**
   * Get text color class by role
   * @param role 'user' | 'assistant'
   */
  getTextColor: typeof getTextColorByRole;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for AI component styling with theme support.
 *
 * Provides:
 * - `style`: Theme-aware style applicator from useThemedStyles
 * - `tokens`: Direct access to all AI token objects
 * - `message`: Helper to get message tokens by role
 * - `getCollapsible`: Helper to get collapsible tokens by accent
 * - `getCursor`: Helper to get cursor token by role
 * - `getTextColor`: Helper to get text color by role
 *
 * @example
 * function MyComponent({ role }) {
 *   const { style, message, getCursor } = useAIStyles();
 *   const msgTokens = message(role);
 *
 *   return (
 *     <View style={style(msgTokens.background, 'rounded-xl')}>
 *       <Text style={style(msgTokens.text)}>{text}</Text>
 *       {isStreaming && (
 *         <View style={style(getCursor(role), 'w-0.5 h-4')} />
 *       )}
 *     </View>
 *   );
 * }
 */
export const useAIStyles = (): AIStylesResult => {
  const themedStyles = useThemedStyles();

  return useMemo(
    () => ({
      // Style applicator from useThemedStyles
      style: themedStyles.style,

      // All token objects for direct access
      tokens: {
        message: aiMessageTokens,
        text: aiTextTokens,
        tool: aiToolTokens,
        collapsible: aiCollapsibleTokens,
        header: aiHeaderTokens,
        input: aiInputTokens,
        session: aiSessionTokens,
        fab: aiFabTokens,
      },

      // Helper functions
      message: getMessageTokens,
      getCollapsible: getCollapsibleTokens,
      getCursor: getCursorToken,
      getTextColor: getTextColorByRole,
    }),
    [themedStyles.style],
  );
};

export default useAIStyles;
