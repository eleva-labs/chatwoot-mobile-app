/**
 * useSessionStorage Hook
 *
 * React hook for accessing the IActiveAIChatSessionStorage from DI container.
 * Replaces direct AsyncStorage calls for session persistence.
 */

import { useMemo } from 'react';
import { resolve } from '@/dependency-injection/container';
import { AI_ASSISTANT_TOKENS } from '@/dependency-injection/tokens';
import type { IActiveAIChatSessionStorage } from '@/domain/interfaces/repositories/ai-assistant';

/**
 * Hook to access the session storage from DI container.
 *
 * @example
 * ```tsx
 * const sessionStorage = useSessionStorage();
 * const result = await sessionStorage.getActiveAIChatSessionId();
 * if (result.isOk()) {
 *   const sessionId = result.getValue();
 * }
 * ```
 */
export function useSessionStorage(): IActiveAIChatSessionStorage {
  return useMemo(() => {
    return resolve<IActiveAIChatSessionStorage>(AI_ASSISTANT_TOKENS.IActiveAIChatSessionStorage);
  }, []);
}
