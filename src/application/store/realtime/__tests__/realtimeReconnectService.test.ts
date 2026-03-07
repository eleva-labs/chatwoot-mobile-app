import { ActionCableReconnectService } from '../realtimeReconnectService';

// ============================================================================
// ActionCableReconnectService
// ============================================================================

describe('ActionCableReconnectService', () => {
  const mockDispatch = jest.fn().mockResolvedValue(undefined);
  const mockGetState = jest.fn().mockReturnValue({
    conversationFilter: {
      filters: {
        status: 'open',
        assignee_type: 'all',
        sort_by: 'latest',
        inbox_id: '0',
      },
    },
  });
  const mockGetActiveConversationId = jest.fn().mockReturnValue(null);

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockGetActiveConversationId.mockReturnValue(null);
    mockGetState.mockReturnValue({
      conversationFilter: {
        filters: {
          status: 'open',
          assignee_type: 'all',
          sort_by: 'latest',
          inbox_id: '0',
        },
      },
    });
    mockDispatch.mockResolvedValue(undefined);
    jest.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('does not fetch if no disconnect was recorded', async () => {
    const service = new ActionCableReconnectService(
      mockDispatch,
      mockGetState,
      mockGetActiveConversationId,
    );
    await service.onReconnect();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('fetches page 1 after short disconnect (under 30s)', async () => {
    const service = new ActionCableReconnectService(
      mockDispatch,
      mockGetState,
      mockGetActiveConversationId,
    );
    service.onDisconnect();
    jest.advanceTimersByTime(5_000);
    const reconnectPromise = service.onReconnect();
    jest.runAllTimers();
    await reconnectPromise;
    // Only page 1 fetched (1 dispatch call)
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it('fetches page 1 and page 2 after long disconnect (over 30s)', async () => {
    const service = new ActionCableReconnectService(
      mockDispatch,
      mockGetState,
      mockGetActiveConversationId,
    );
    service.onDisconnect();
    jest.advanceTimersByTime(60_000);
    const reconnectPromise = service.onReconnect();
    jest.runAllTimers();
    await reconnectPromise;
    // Page 1 + page 2 = 2 dispatch calls
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it('also fetches active ChatScreen conversation on reconnect', async () => {
    mockGetActiveConversationId.mockReturnValue(99);
    const service = new ActionCableReconnectService(
      mockDispatch,
      mockGetState,
      mockGetActiveConversationId,
    );
    service.onDisconnect();
    const reconnectPromise = service.onReconnect();
    jest.runAllTimers();
    await reconnectPromise;
    // fetchConversations (page 1) + fetchConversation (id 99) = 2
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  it('clears disconnectTime after reconnect (no duplicate catch-up)', async () => {
    const service = new ActionCableReconnectService(
      mockDispatch,
      mockGetState,
      mockGetActiveConversationId,
    );
    service.onDisconnect();
    const p1 = service.onReconnect();
    jest.runAllTimers();
    await p1;
    // Second reconnect should be a no-op (disconnectTime was cleared)
    const p2 = service.onReconnect();
    jest.runAllTimers();
    await p2;
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it('uses jitter delay before fetching (via Math.random)', async () => {
    // Set Math.random to return 0.5, so jitter = 0.5 * 500 = 250ms
    (Math.random as jest.Mock).mockReturnValue(0.5);

    const service = new ActionCableReconnectService(
      mockDispatch,
      mockGetState,
      mockGetActiveConversationId,
    );
    service.onDisconnect();
    const reconnectPromise = service.onReconnect();

    // Advance just past the jitter delay
    jest.advanceTimersByTime(250);
    await reconnectPromise;

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(Math.random).toHaveBeenCalled();
  });
});
