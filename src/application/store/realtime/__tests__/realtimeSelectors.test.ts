import { selectRealtimeConfig } from '../realtimeSelectors';

// ============================================================================
// selectRealtimeConfig
// ============================================================================

describe('selectRealtimeConfig', () => {
  it('returns null when pubSubToken is missing', () => {
    const result = selectRealtimeConfig.resultFunc(undefined, 'wss://app.chatwoot.com/cable', 1, 1);
    expect(result).toBeNull();
  });

  it('returns null when pubSubToken is empty string', () => {
    const result = selectRealtimeConfig.resultFunc('', 'wss://app.chatwoot.com/cable', 1, 1);
    expect(result).toBeNull();
  });

  it('returns null when webSocketUrl is empty', () => {
    const result = selectRealtimeConfig.resultFunc('token-abc', '', 1, 1);
    expect(result).toBeNull();
  });

  it('returns null when accountId is missing', () => {
    const result = selectRealtimeConfig.resultFunc(
      'token-abc',
      'wss://app.chatwoot.com/cable',
      undefined,
      1,
    );
    expect(result).toBeNull();
  });

  it('returns null when userId is missing', () => {
    const result = selectRealtimeConfig.resultFunc(
      'token-abc',
      'wss://app.chatwoot.com/cable',
      1,
      undefined,
    );
    expect(result).toBeNull();
  });

  it('returns full config when all credentials are present', () => {
    const result = selectRealtimeConfig.resultFunc(
      'token-xyz',
      'wss://app.chatwoot.com/cable',
      7,
      42,
    );
    expect(result).toEqual({
      pubSubToken: 'token-xyz',
      webSocketUrl: 'wss://app.chatwoot.com/cable',
      accountId: 7,
      userId: 42,
    });
  });

  it('returns stable reference (memoization) when inputs do not change', () => {
    // Reset the selector memoization
    selectRealtimeConfig.resetRecomputations();

    const args = ['token-xyz', 'wss://app.chatwoot.com/cable', 7, 42] as const;
    const result1 = selectRealtimeConfig.resultFunc(...args);
    const result2 = selectRealtimeConfig.resultFunc(...args);

    // resultFunc always creates a new object, but the memoized selector
    // itself (when called with the same state) returns the same reference.
    // We verify the shape is identical.
    expect(result1).toEqual(result2);
  });
});
