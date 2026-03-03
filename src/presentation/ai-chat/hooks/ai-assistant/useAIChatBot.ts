/**
 * Hook for managing AI chat bot selection and fetching
 *
 * Uses AIChatService static methods directly — no DI or Result pattern.
 */

import { useState, useEffect } from 'react';
import { AIChatService } from '@application/store/ai-chat/aiChatService';
import type { AIChatBot } from '@application/store/ai-chat/aiChatTypes';

export interface UseAIChatBotReturn {
  selectedBotId: number | undefined;
  selectedBot: AIChatBot | null;
  setSelectedBotId: (botId: number | undefined) => void;
  isLoading: boolean;
  error: Error | null;
}

export function useAIChatBot(agentBotId?: number, accountId?: number): UseAIChatBotReturn {
  const [selectedBotId, setSelectedBotId] = useState<number | undefined>(agentBotId);
  const [selectedBot, setSelectedBot] = useState<AIChatBot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchBots = async () => {
      if (!accountId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await AIChatService.fetchBots();
        const bots = response.bots;

        if (agentBotId) {
          const bot = bots.find(b => b.id === agentBotId);
          if (bot) {
            setSelectedBotId(agentBotId);
            setSelectedBot(bot); // Already in DTO format, no mapping needed
          }
        } else if (bots.length > 0) {
          setSelectedBotId(bots[0].id);
          setSelectedBot(bots[0]);
        } else {
          console.warn('[useAIChatBot] No bots available');
        }
      } catch (err) {
        console.error('[useAIChatBot] Failed to fetch bots:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }

      setIsLoading(false);
    };

    fetchBots();
  }, [agentBotId, accountId]);

  return {
    selectedBotId,
    selectedBot,
    setSelectedBotId,
    isLoading,
    error,
  };
}
