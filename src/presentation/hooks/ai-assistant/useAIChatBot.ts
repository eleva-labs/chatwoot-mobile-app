/**
 * Hook for managing AI chat bot selection and fetching
 *
 * REFACTORED: Uses AIAssistantFactory instead of direct service calls
 */

import { useState, useEffect, useMemo } from 'react';
import type { AIChatBot } from '@/infrastructure/dto/ai-assistant';
import { getDefaultAIAssistantDependencies } from '@/presentation/factory/ai-assistant';

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

  // Get use case from factory
  const { fetchBotsUseCase } = useMemo(() => getDefaultAIAssistantDependencies(), []);

  useEffect(() => {
    const fetchBots = async () => {
      if (!accountId) return;

      setIsLoading(true);
      setError(null);

      // Use the use case instead of direct service call
      const result = await fetchBotsUseCase.execute({ accountId });

      if (result.isSuccess) {
        const bots = result.getValue();

        if (agentBotId) {
          const bot = bots.find(b => b.id === agentBotId);
          if (bot) {
            setSelectedBotId(agentBotId);
            // Map domain entity to DTO format for backwards compatibility
            setSelectedBot({
              id: bot.id,
              name: bot.name,
              description: bot.description || '',
              avatar_url: bot.avatarUrl || '',
            } as AIChatBot);
          }
        } else if (bots.length > 0) {
          const firstBot = bots[0];
          setSelectedBotId(firstBot.id);
          setSelectedBot({
            id: firstBot.id,
            name: firstBot.name,
            description: firstBot.description || '',
            avatar_url: firstBot.avatarUrl || '',
          } as AIChatBot);
        } else {
          console.warn('[useAIChatBot] No bots available');
        }
      } else {
        const err = result.getError();
        console.error('[useAIChatBot] Failed to fetch bots:', err);
        setError(err);
      }

      setIsLoading(false);
    };

    fetchBots();
  }, [agentBotId, accountId, fetchBotsUseCase]);

  return {
    selectedBotId,
    selectedBot,
    setSelectedBotId,
    isLoading,
    error,
  };
}
