import { useState, useRef, useCallback, useEffect } from 'react';
import type { UIMessage } from 'ai';

export interface UseAIThoughtsReturn {
  thoughtsText: string;
  isThoughtsVisible: boolean;
  streamingAnchorKey: number;
  handleThoughtEvent: (thought: string, messageId: string) => void;
  handleReasoningStart: () => void;
  handleFinish: (message: UIMessage) => void;
  clearThoughts: () => void;
}

/**
 * Hook for managing AI thoughts/reasoning state during streaming
 *
 * IMPORTANT: THOUGHTS accordion only appears when actual content arrives,
 * not on reasoning-start. This prevents showing "[No content]" while
 * waiting for reasoning events that may be delayed by the streaming pipeline.
 *
 * This is a mitigation for the case where reasoning events arrive after
 * the answer has started streaming (due to backend/proxy behavior).
 */
export function useAIThoughts(): UseAIThoughtsReturn {
  // Ephemeral thoughts that appear during streaming (independent of message IDs)
  const [thoughtsText, setThoughtsText] = useState<string>('');
  const [isThoughtsVisible, setIsThoughtsVisible] = useState(false);
  const [streamingAnchorKey, setStreamingAnchorKey] = useState(0);

  // Use ref to track visibility without stale closures in callbacks
  const isThoughtsVisibleRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    isThoughtsVisibleRef.current = isThoughtsVisible;
  }, [isThoughtsVisible]);

  // Track when to clear thoughts (on next user message or timeout)
  const thoughtsClearTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle thought events - show accordion only when content arrives
  const handleThoughtEvent = useCallback((thought: string, _messageId: string) => {
    console.log('[useAIThoughts] Thought event:', {
      length: thought.length,
      wasVisible: isThoughtsVisibleRef.current,
    });

    // Update the text
    setThoughtsText(thought);

    // Show accordion only when we have actual content
    if (thought.length > 0 && !isThoughtsVisibleRef.current) {
      setIsThoughtsVisible(true);
      console.log('[useAIThoughts] Showing THOUGHTS accordion (content received)');
    }
  }, []);

  // Handle reasoning-start: prepare but don't show yet (wait for content)
  const handleReasoningStart = useCallback(() => {
    // Clear any existing timeout
    if (thoughtsClearTimeoutRef.current) {
      clearTimeout(thoughtsClearTimeoutRef.current);
      thoughtsClearTimeoutRef.current = null;
    }
    // Reset text but DON'T show the accordion yet - wait for actual content
    setThoughtsText('');
    // Increment anchor key for when we do show it
    setStreamingAnchorKey(prev => prev + 1);
    console.log('[useAIThoughts] Reasoning started, waiting for content before showing');
  }, []);

  // Handle finish: keep THOUGHTS visible if has content, schedule cleanup
  const handleFinish = useCallback((_message: UIMessage) => {
    // Schedule cleanup after 30 seconds (or on next user message)
    thoughtsClearTimeoutRef.current = setTimeout(() => {
      setIsThoughtsVisible(false);
      isThoughtsVisibleRef.current = false;
      setThoughtsText('');
      console.log('[useAIThoughts] Thoughts cleared after finish');
    }, 30000);
  }, []);

  // Clear thoughts (used when sending a new message)
  const clearThoughts = useCallback(() => {
    if (thoughtsClearTimeoutRef.current) {
      clearTimeout(thoughtsClearTimeoutRef.current);
      thoughtsClearTimeoutRef.current = null;
    }
    setIsThoughtsVisible(false);
    isThoughtsVisibleRef.current = false;
    setThoughtsText('');
    console.log('[useAIThoughts] Thoughts cleared manually');
  }, []);

  return {
    thoughtsText,
    isThoughtsVisible,
    streamingAnchorKey,
    handleThoughtEvent,
    handleReasoningStart,
    handleFinish,
    clearThoughts,
  };
}
