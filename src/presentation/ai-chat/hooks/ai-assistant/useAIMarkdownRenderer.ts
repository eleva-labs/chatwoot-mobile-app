import { useAIChatRegistries } from './useAIChatProvider';

/**
 * Returns the markdown renderer registered in AIChatProvider.
 * Returns null if no renderer has been registered.
 * Components should fall back to plain <Text> when null.
 *
 * @returns The registered MarkdownRendererComponent, or null.
 */
export function useAIMarkdownRenderer() {
  const { markdownRenderer } = useAIChatRegistries();
  return markdownRenderer;
}
