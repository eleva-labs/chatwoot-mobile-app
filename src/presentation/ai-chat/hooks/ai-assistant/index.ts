/**
 * AI Assistant Hooks - Barrel Export
 *
 * All hooks for the AI Assistant feature.
 */

export { useAIChat } from './useAIChat';
export type { UseAIChatOptions, UseAIChatReturn } from './useAIChat';

export { useAIChatBot } from './useAIChatBot';

export { useAIChatSessions } from './useAIChatSessions';

export { useAIChatScroll } from './useAIChatScroll';

export { useMessageBridge } from './useMessageBridge';
export type { UseMessageBridgeOptions } from './useMessageBridge';

export { useAIi18n, AIi18nContextProvider, defaultI18n } from './useAIi18n';
export type { AIi18nProvider } from './useAIi18n';

export { useAITheme, useResolveColor, AIThemeContextProvider } from './useAITheme';
export type { AIThemeTokens, AIThemeContextValue } from './useAITheme';

export { AIChatProvider, useAIChatRegistries } from './useAIChatProvider';
export type {
  AIChatProviderProps,
  PartRendererProps,
  PartComponent,
  AIChatRegistries,
  MarkdownRendererComponent,
} from './useAIChatProvider';

export { useAIMarkdownRenderer } from './useAIMarkdownRenderer';
