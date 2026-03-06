import { selectWebSocketUrl } from '../settingsSelectors';

// ============================================================================
// selectWebSocketUrl
// ============================================================================

describe('selectWebSocketUrl', () => {
  it('derives wss:// URL from https:// installationUrl', () => {
    const result = selectWebSocketUrl.resultFunc('https://dev.app.chatscommerce.com/');
    expect(result).toBe('wss://dev.app.chatscommerce.com/cable');
  });

  it('derives ws:// URL from http:// installationUrl', () => {
    const result = selectWebSocketUrl.resultFunc('http://localhost:3000/');
    expect(result).toBe('ws://localhost:3000/cable');
  });

  it('returns empty string when installationUrl is empty', () => {
    const result = selectWebSocketUrl.resultFunc('');
    expect(result).toBe('');
  });

  it('handles installationUrl without trailing slash', () => {
    const result = selectWebSocketUrl.resultFunc('https://app.chatwoot.com');
    expect(result).toBe('wss://app.chatwoot.com/cable');
  });
});
