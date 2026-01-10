/**
 * useAIChatConfig Hook
 *
 * React hook for accessing the IAIChatConfigService from DI container.
 * Replaces direct getStore() calls in useAIChat.
 */

import { useMemo } from 'react';
import { resolve } from '@/dependency-injection/container';
import { SHARED_TOKENS } from '@/dependency-injection/tokens';
import type { IAIChatConfigService } from '@/domain/interfaces/services/shared';

/**
 * Hook to access the AI chat config service from DI container.
 *
 * @example
 * ```tsx
 * const config = useAIChatConfig();
 * const headers = config.getAuthHeaders();
 * const accountId = config.getAccountId();
 * const endpoint = config.buildStreamEndpoint();
 * ```
 */
export function useAIChatConfig(): IAIChatConfigService {
  return useMemo(() => {
    return resolve<IAIChatConfigService>(SHARED_TOKENS.IAIChatConfigService);
  }, []);
}
