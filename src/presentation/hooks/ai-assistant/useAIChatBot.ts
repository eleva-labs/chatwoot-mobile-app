import { useState, useEffect, useMemo } from 'react';
import type { AIChatBot } from '@/infrastructure/dto/ai-assistant';
import { resolve } from '@/dependency-injection';
import { AI_ASSISTANT_TOKENS } from '@/dependency-injection/tokens';
import type { IChatwootApiService } from '@/domain/interfaces/services/ai-assistant';

export interface UseAIChatBotReturn {
  selectedBotId: number | undefined;
  selectedBot: AIChatBot | null;
  setSelectedBotId: (botId: number | undefined) => void;
}

/**
 * Hook for managing AI chat bot selection and fetching
 */
export function useAIChatBot(agentBotId?: number, accountId?: number): UseAIChatBotReturn {
  const [selectedBotId, setSelectedBotId] = useState<number | undefined>(agentBotId);
  const [selectedBot, setSelectedBot] = useState<AIChatBot | null>(null);

  // Resolve service from DI container
  const chatwootService = useMemo(
    () => resolve<IChatwootApiService>(AI_ASSISTANT_TOKENS.IChatwootApiService),
    [],
  );

  useEffect(() => {
    if (!agentBotId && accountId) {
      chatwootService
        .fetchBots()
        .then(response => {
          if (response.bots && response.bots.length > 0) {
            const firstBot = response.bots[0];
            setSelectedBotId(firstBot.id);
            setSelectedBot(firstBot);
          } else {
            console.warn('[useAIChatBot] No bots available');
          }
        })
        .catch(error => {
          console.error('[useAIChatBot] Failed to fetch bots:', error);
        });
    } else if (agentBotId && accountId) {
      // If agentBotId is provided, fetch the bot details
      setSelectedBotId(agentBotId);
      chatwootService
        .fetchBots()
        .then(response => {
          const bot = response.bots?.find(b => b.id === agentBotId);
          if (bot) {
            setSelectedBot(bot);
          }
        })
        .catch(error => {
          console.error('[useAIChatBot] Failed to fetch bot details:', error);
        });
    }
  }, [agentBotId, accountId, chatwootService]);

  return {
    selectedBotId,
    selectedBot,
    setSelectedBotId,
  };
}
