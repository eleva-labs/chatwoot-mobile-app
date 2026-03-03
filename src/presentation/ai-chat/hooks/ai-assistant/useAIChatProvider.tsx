/**
 * AIChatProvider [RN]
 *
 * Unified context provider that composes theme, i18n, and registry contexts.
 * This is the single provider that consumers wrap around AI chat components.
 */

import React, { createContext, useContext, useMemo } from 'react';

import { ComponentRegistry } from '@domain/types/ai-chat/registry';
import { AIi18nContextProvider, defaultI18n, type AIi18nProvider } from './useAIi18n';
import { AIThemeContextProvider, type AIThemeContextValue, type AIThemeTokens } from './useAITheme';
import { tailwind } from '@infrastructure/theme/tailwind';

// ============================================================================
// Part Component Type
// ============================================================================

/**
 * Props that every part renderer receives.
 */
export interface PartRendererProps {
  part: { type: string; [key: string]: unknown };
  role: 'user' | 'assistant';
  isStreaming: boolean;
  isLastPart: boolean;
}

/** A React component that can render a message part */
export type PartComponent = React.ComponentType<PartRendererProps>;

// ============================================================================
// Registry Context
// ============================================================================

/**
 * A React component that renders markdown text.
 * Must accept `children: ReactNode` (the markdown string) and an optional `style` prop.
 * Note: advanced props like onLinkPress or markdownit configuration must be pre-applied
 * by wrapping the renderer before passing it to AIChatProvider.
 */
export type MarkdownRendererComponent = React.ComponentType<{
  children: React.ReactNode;
  style?: Record<string, unknown>;
}>;

export interface AIChatRegistries {
  /** Registry for part type renderers (text, reasoning, etc.) */
  parts: ComponentRegistry<PartComponent>;
  /** Registry for tool-specific renderers (by toolName) */
  tools: ComponentRegistry<PartComponent>;
  /** Default markdown renderer component (injection point for react-native-markdown-display or any alternative) */
  markdownRenderer: MarkdownRendererComponent | null;
}

const defaultRegistries: AIChatRegistries = {
  parts: new ComponentRegistry<PartComponent>(),
  tools: new ComponentRegistry<PartComponent>(),
  markdownRenderer: null,
};

const RegistryContext = createContext<AIChatRegistries>(defaultRegistries);

/**
 * Hook to access part and tool registries.
 */
export function useAIChatRegistries(): AIChatRegistries {
  return useContext(RegistryContext);
}

// ============================================================================
// Provider Props
// ============================================================================

export interface AIChatProviderProps {
  /** Theme token overrides */
  theme?: Partial<AIThemeTokens>;
  /** i18n provider (translation function + locale) */
  i18n?: AIi18nProvider;
  /** Custom part/tool component registrations */
  registry?: {
    parts?: Record<string, PartComponent>;
    tools?: Record<string, PartComponent>;
    /** Pass the Markdown component from react-native-markdown-display (or any alternative) */
    markdownRenderer?: MarkdownRendererComponent;
  };
  children: React.ReactNode;
}

// ============================================================================
// Provider Component
// ============================================================================

/**
 * Unified AI Chat Provider.
 * Composes theme, i18n, and registry contexts into a single wrapper.
 */
export const AIChatProvider: React.FC<AIChatProviderProps> = ({
  theme,
  i18n: i18nProp,
  registry: registryProp,
  children,
}) => {
  // Build theme context value
  const themeValue = useMemo<AIThemeContextValue>(
    () => ({
      resolveColor: (token: string, fallback: string) => {
        if (theme?.[token]) return theme[token]!;
        return tailwind.color(token) ?? fallback;
      },
      overrides: (theme ?? {}) as AIThemeTokens,
    }),
    [theme],
  );

  // Build i18n value
  const i18nValue = useMemo(() => i18nProp ?? defaultI18n, [i18nProp]);

  // Build registries
  const registries = useMemo(() => {
    const parts = new ComponentRegistry<PartComponent>();
    const tools = new ComponentRegistry<PartComponent>();

    if (registryProp?.parts) {
      for (const [key, component] of Object.entries(registryProp.parts)) {
        parts.register(key, component);
      }
    }

    if (registryProp?.tools) {
      for (const [key, component] of Object.entries(registryProp.tools)) {
        tools.register(key, component);
      }
    }

    return {
      parts,
      tools,
      markdownRenderer: registryProp?.markdownRenderer ?? null,
    };
  }, [registryProp]);

  return (
    <AIThemeContextProvider value={themeValue}>
      <AIi18nContextProvider value={i18nValue}>
        <RegistryContext.Provider value={registries}>{children}</RegistryContext.Provider>
      </AIi18nContextProvider>
    </AIThemeContextProvider>
  );
};
