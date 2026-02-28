import {
  categorizeError,
  ERROR_DISPLAY_CONFIG,
  type ErrorCategory,
  type ErrorDisplayConfig,
} from '../aiChatErrorUtils';

describe('categorizeError', () => {
  it('categorizes network errors', () => {
    expect(categorizeError('Network error')).toBe('network');
    expect(categorizeError('Failed to fetch')).toBe('network');
    expect(categorizeError('NETWORK_ERROR')).toBe('network');
  });

  it('categorizes rate limit errors', () => {
    expect(categorizeError('HTTP 429 Too Many Requests')).toBe('rate_limit');
    expect(categorizeError('Rate limit exceeded')).toBe('rate_limit');
  });

  it('categorizes auth errors', () => {
    expect(categorizeError('HTTP 401 Unauthorized')).toBe('auth');
    expect(categorizeError('HTTP 403 Forbidden')).toBe('auth');
  });

  it('categorizes server errors', () => {
    expect(categorizeError('HTTP 500 Internal Server Error')).toBe('server');
    expect(categorizeError('HTTP 502 Bad Gateway')).toBe('server');
    expect(categorizeError('HTTP 503 Service Unavailable')).toBe('server');
  });

  it('returns unknown for unrecognized errors', () => {
    expect(categorizeError('Something went wrong')).toBe('unknown');
    expect(categorizeError('')).toBe('unknown');
  });

  it('handles empty string', () => {
    expect(categorizeError('')).toBe('unknown');
  });

  it('is case-insensitive for network/fetch/rate keywords', () => {
    expect(categorizeError('NETWORK Error')).toBe('network');
    expect(categorizeError('FETCH failed')).toBe('network');
  });

  it('prioritizes network over other categories', () => {
    // Network check comes first
    expect(categorizeError('network 500')).toBe('network');
  });
});

describe('ERROR_DISPLAY_CONFIG', () => {
  const allCategories: ErrorCategory[] = ['network', 'rate_limit', 'auth', 'server', 'unknown'];

  it('has an entry for every ErrorCategory', () => {
    for (const category of allCategories) {
      expect(ERROR_DISPLAY_CONFIG[category]).toBeDefined();
    }
  });

  it('each config has required fields', () => {
    for (const category of allCategories) {
      const config = ERROR_DISPLAY_CONFIG[category];
      expect(config.titleKey).toBeTruthy();
      expect(config.iconType).toMatch(/^(warning|lock)$/);
      expect(config.accentBg).toBeTruthy();
      expect(config.accentBorder).toBeTruthy();
      expect(config.accentText).toBeTruthy();
    }
  });

  it('auth uses lock icon', () => {
    expect(ERROR_DISPLAY_CONFIG.auth.iconType).toBe('lock');
  });

  it('network uses warning icon', () => {
    expect(ERROR_DISPLAY_CONFIG.network.iconType).toBe('warning');
  });

  it('network and rate_limit use amber accent', () => {
    expect(ERROR_DISPLAY_CONFIG.network.accentBg).toContain('amber');
    expect(ERROR_DISPLAY_CONFIG.rate_limit.accentBg).toContain('amber');
  });

  it('auth, server, unknown use ruby accent', () => {
    expect(ERROR_DISPLAY_CONFIG.auth.accentBg).toContain('ruby');
    expect(ERROR_DISPLAY_CONFIG.server.accentBg).toContain('ruby');
    expect(ERROR_DISPLAY_CONFIG.unknown.accentBg).toContain('ruby');
  });
});
