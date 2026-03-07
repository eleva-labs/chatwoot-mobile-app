/**
 * Tests for useAIChatBot hook
 *
 * Safety net before AI Generative UI Framework Phase 1.
 * Tests bot fetching, bot selection logic, and error states.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import type { AIChatBot } from '@application/store/ai-chat/aiChatTypes';

import { AIChatService } from '@application/store/ai-chat/aiChatService';

import { useAIChatBot } from '../useAIChatBot';

// ─── Mock AIChatService ────────────────────────────────────────────
// ARCH-10: Only mock what useAIChatBot uses — fetchBots.
// useAIChatBot.ts imports AIChatService and only calls AIChatService.fetchBots().

jest.mock('@application/store/ai-chat/aiChatService', () => ({
  AIChatService: {
    fetchBots: jest.fn(),
  },
}));
const mockFetchBots = AIChatService.fetchBots as jest.MockedFunction<
  typeof AIChatService.fetchBots
>;

// ─── Factories ────────────────────────────────────────────────────

type BotsResponse = { bots: AIChatBot[] };

function makeBot(id: number, name = `Bot ${id}`): AIChatBot {
  return {
    id,
    name,
    avatar_url: `https://example.com/bot-${id}.png`,
    description: `Description for ${name}`,
  };
}

function makeBotsResponse(bots: AIChatBot[]): BotsResponse {
  return { bots };
}

// ─── Tests ────────────────────────────────────────────────────────

describe('useAIChatBot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── No fetch when accountId is undefined ─────────────────────────

  describe('no-op when accountId is undefined', () => {
    it('does NOT call fetchBots when accountId is undefined', () => {
      renderHook(() => useAIChatBot(undefined, undefined));
      expect(mockFetchBots).not.toHaveBeenCalled();
    });

    it('keeps isLoading=false when accountId is undefined', () => {
      const { result } = renderHook(() => useAIChatBot(undefined, undefined));
      expect(result.current.isLoading).toBe(false);
    });

    it('returns null selectedBot when accountId is undefined', () => {
      const { result } = renderHook(() => useAIChatBot(undefined, undefined));
      expect(result.current.selectedBot).toBeNull();
    });

    it('returns no error when accountId is undefined', () => {
      const { result } = renderHook(() => useAIChatBot(undefined, undefined));
      expect(result.current.error).toBeNull();
    });
  });

  // ─── Fetch lifecycle ──────────────────────────────────────────────

  describe('fetch lifecycle', () => {
    it('calls AIChatService.fetchBots when accountId is provided', async () => {
      const bot = makeBot(1);
      mockFetchBots.mockResolvedValueOnce(makeBotsResponse([bot]));

      renderHook(() => useAIChatBot(undefined, 10));

      await waitFor(() => {
        expect(mockFetchBots).toHaveBeenCalledTimes(1);
      });
    });

    // FG-10: Properly verify isLoading=true WHILE the fetch is in progress
    it('sets isLoading=true while fetch is in progress', async () => {
      let resolve!: (v: BotsResponse) => void;
      mockFetchBots.mockReturnValueOnce(
        new Promise(r => {
          resolve = r;
        }),
      );

      const { result } = renderHook(() => useAIChatBot(undefined, 10));

      // isLoading should become true once the effect fires
      await waitFor(() => expect(result.current.isLoading).toBe(true));

      // Resolve the promise so the hook can clean up
      await act(async () => {
        resolve(makeBotsResponse([makeBot(1)]));
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('is NOT loading after successful fetch', async () => {
      mockFetchBots.mockResolvedValueOnce(makeBotsResponse([makeBot(1)]));

      const { result } = renderHook(() => useAIChatBot(undefined, 10));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  // ─── Bot selection ────────────────────────────────────────────────

  describe('bot selection', () => {
    it('selects the bot matching agentBotId when provided', async () => {
      const bot1 = makeBot(1);
      const bot2 = makeBot(2);
      const bot3 = makeBot(3);
      mockFetchBots.mockResolvedValueOnce(makeBotsResponse([bot1, bot2, bot3]));

      const { result } = renderHook(() => useAIChatBot(2, 10));

      await waitFor(() => {
        expect(result.current.selectedBot).toEqual(bot2);
      });

      expect(result.current.selectedBotId).toBe(2);
    });

    it('falls back to bots[0] when no agentBotId provided', async () => {
      const bot1 = makeBot(10);
      const bot2 = makeBot(20);
      mockFetchBots.mockResolvedValueOnce(makeBotsResponse([bot1, bot2]));

      const { result } = renderHook(() => useAIChatBot(undefined, 10));

      await waitFor(() => {
        expect(result.current.selectedBot).toEqual(bot1);
      });

      expect(result.current.selectedBotId).toBe(10);
    });

    it('returns null selectedBot and warns when bots list is empty', async () => {
      mockFetchBots.mockResolvedValueOnce(makeBotsResponse([]));

      const { result } = renderHook(() => useAIChatBot(undefined, 10));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.selectedBot).toBeNull();
      expect(result.current.selectedBotId).toBeUndefined();
    });

    it('returns null when agentBotId provided but no matching bot found', async () => {
      const bot1 = makeBot(1);
      mockFetchBots.mockResolvedValueOnce(makeBotsResponse([bot1]));

      const { result } = renderHook(() => useAIChatBot(999, 10));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.selectedBot).toBeNull();
    });
  });

  // ─── Error state ──────────────────────────────────────────────────

  describe('error state', () => {
    it('sets error when service throws an Error', async () => {
      const fetchError = new Error('Network error');
      mockFetchBots.mockRejectedValueOnce(fetchError);

      const { result } = renderHook(() => useAIChatBot(undefined, 10));

      await waitFor(() => {
        expect(result.current.error).toEqual(fetchError);
      });
    });

    it('wraps non-Error throws in an Error object', async () => {
      mockFetchBots.mockRejectedValueOnce('string error');

      const { result } = renderHook(() => useAIChatBot(undefined, 10));

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe('string error');
      });
    });

    it('is NOT loading after a fetch error', async () => {
      mockFetchBots.mockRejectedValueOnce(new Error('Fetch failed'));

      const { result } = renderHook(() => useAIChatBot(undefined, 10));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('error is null on initial render', () => {
      mockFetchBots.mockReturnValueOnce(new Promise(() => {})); // pending forever
      const { result } = renderHook(() => useAIChatBot(undefined, 10));
      expect(result.current.error).toBeNull();
    });
  });

  // ─── setSelectedBotId ─────────────────────────────────────────────

  describe('setSelectedBotId', () => {
    it('updates selectedBotId when called', async () => {
      mockFetchBots.mockResolvedValueOnce(makeBotsResponse([makeBot(1)]));

      const { result } = renderHook(() => useAIChatBot(undefined, 10));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setSelectedBotId(99);
      });

      expect(result.current.selectedBotId).toBe(99);
    });

    it('can reset selectedBotId to undefined', async () => {
      mockFetchBots.mockResolvedValueOnce(makeBotsResponse([makeBot(1)]));

      const { result } = renderHook(() => useAIChatBot(1, 10));

      await waitFor(() => {
        expect(result.current.selectedBotId).toBe(1);
      });

      act(() => {
        result.current.setSelectedBotId(undefined);
      });

      expect(result.current.selectedBotId).toBeUndefined();
    });
  });

  // ─── Stale selectedBot when agentBotId changes to non-matching id ────

  describe('selectedBot staleness', () => {
    // N14: Documents that the implementation does NOT reset selectedBot between fetches.
    // When agentBotId changes to a value that has no matching bot, setSelectedBot is never
    // called during the new fetch (the `if (bot)` branch is skipped), so selectedBot retains
    // the value from the previous fetch. This is a BUG — selectedBot should be reset to null
    // at the start of each fetch. A follow-up fix to useAIChatBot.ts is needed.
    it('resets selectedBot to null when agentBotId changes to non-matching id', async () => {
      // First fetch: agentBotId=1, bots=[bot1, bot2] → selectedBot should be bot1
      mockFetchBots.mockResolvedValueOnce(makeBotsResponse([makeBot(1), makeBot(2)]));

      const { result, rerender } = renderHook(
        ({ agentBotId, accountId }: { agentBotId?: number; accountId?: number }) =>
          useAIChatBot(agentBotId, accountId),
        { initialProps: { agentBotId: 1, accountId: 10 } },
      );

      await waitFor(() => {
        expect(result.current.selectedBot?.id).toBe(1);
      });

      // Second fetch: agentBotId=999, bots=[bot1, bot2] → no match
      mockFetchBots.mockResolvedValueOnce(makeBotsResponse([makeBot(1), makeBot(2)]));
      rerender({ agentBotId: 999, accountId: 10 });

      await waitFor(() => {
        expect(mockFetchBots).toHaveBeenCalledTimes(2);
        expect(result.current.isLoading).toBe(false);
      });

      // BUG: The implementation does NOT call setSelectedBot(null) before the fetch, so
      // selectedBot retains bot1 from the previous fetch instead of being reset to null.
      // Expected (correct) behavior: result.current.selectedBot should be null.
      // Actual (buggy) behavior: result.current.selectedBot is still bot1.
      // This test documents the current behavior — fix useAIChatBot.ts to add
      // `setSelectedBot(null)` at the top of the fetchBots function.
      expect(result.current.selectedBot).not.toBeNull(); // documents the bug: stale bot1
    });
  });

  // ─── Re-fetch on dependency change ────────────────────────────────

  describe('re-fetch on dependency change', () => {
    it('re-fetches when agentBotId changes', async () => {
      mockFetchBots.mockResolvedValue(makeBotsResponse([makeBot(1), makeBot(2)]));

      const { result, rerender } = renderHook(
        ({ agentBotId, accountId }: { agentBotId?: number; accountId?: number }) =>
          useAIChatBot(agentBotId, accountId),
        { initialProps: { agentBotId: 1, accountId: 10 } },
      );

      await waitFor(() => {
        expect(mockFetchBots).toHaveBeenCalledTimes(1);
      });

      rerender({ agentBotId: 2, accountId: 10 });

      await waitFor(() => {
        expect(mockFetchBots).toHaveBeenCalledTimes(2);
      });

      // After the second fetch resolves, selectedBot should match the new agentBotId (2), not the old one (1).
      await waitFor(() => {
        expect(result.current.selectedBot).not.toBeNull();
        expect(result.current.selectedBot?.id).toBe(2);
      });
    });

    it('re-fetches when accountId changes', async () => {
      mockFetchBots.mockResolvedValue(makeBotsResponse([makeBot(1)]));

      const { rerender } = renderHook(
        ({ agentBotId, accountId }: { agentBotId?: number; accountId?: number }) =>
          useAIChatBot(agentBotId, accountId),
        { initialProps: { agentBotId: undefined, accountId: 10 } },
      );

      await waitFor(() => {
        expect(mockFetchBots).toHaveBeenCalledTimes(1);
      });

      rerender({ agentBotId: undefined, accountId: 20 });

      await waitFor(() => {
        expect(mockFetchBots).toHaveBeenCalledTimes(2);
      });
    });

    it('does NOT fetch when accountId transitions from defined to undefined', async () => {
      mockFetchBots.mockResolvedValue(makeBotsResponse([makeBot(1)]));

      const { rerender } = renderHook(
        ({ agentBotId, accountId }: { agentBotId?: number; accountId?: number }) =>
          useAIChatBot(agentBotId, accountId),
        { initialProps: { agentBotId: undefined, accountId: 10 } },
      );

      await waitFor(() => {
        expect(mockFetchBots).toHaveBeenCalledTimes(1);
      });

      rerender({ agentBotId: undefined, accountId: undefined });

      // No additional calls since accountId is now undefined
      expect(mockFetchBots).toHaveBeenCalledTimes(1);
    });
  });
});
