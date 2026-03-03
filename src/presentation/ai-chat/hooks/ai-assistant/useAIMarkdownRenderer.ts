import { useAIChatRegistries } from './useAIChatProvider';

/**
 * Returns the default markdown renderer registered in AIChatProvider.
 * Returns null if no renderer has been registered (caller must handle gracefully).
 * Components should fall back to plain <Text> when null.
 */
export function useAIMarkdownRenderer() {
  const { markdownRenderer } = useAIChatRegistries();
  return markdownRenderer;
}
