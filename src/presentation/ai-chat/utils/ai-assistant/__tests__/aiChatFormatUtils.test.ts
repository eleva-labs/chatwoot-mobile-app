import { formatToolName, formatJson, formatSessionTitle } from '../aiChatFormatUtils';

describe('formatToolName', () => {
  it('converts snake_case to Title Case', () => {
    expect(formatToolName('search_web')).toBe('Search Web');
  });

  it('converts camelCase to Title Case', () => {
    expect(formatToolName('getWeather')).toBe('Get Weather');
  });

  it('handles single word', () => {
    expect(formatToolName('search')).toBe('Search');
  });

  it('handles already Title Case', () => {
    expect(formatToolName('Search')).toBe('Search');
  });

  it('returns fallback for empty string', () => {
    expect(formatToolName('')).toBe('Unknown Tool');
  });

  it('returns custom fallback for empty string', () => {
    expect(formatToolName('', 'Custom Fallback')).toBe('Custom Fallback');
  });

  it('handles mixed snake_case and camelCase', () => {
    expect(formatToolName('get_user_data')).toBe('Get User Data');
  });

  it('handles multiple consecutive uppercase', () => {
    expect(formatToolName('getHTTPResponse')).toBe('Get H T T P Response');
  });
});

describe('formatJson', () => {
  it('formats a simple object', () => {
    expect(formatJson({ key: 'value' })).toBe('{\n  "key": "value"\n}');
  });

  it('formats an array', () => {
    expect(formatJson([1, 2, 3])).toBe('[\n  1,\n  2,\n  3\n]');
  });

  it('handles null', () => {
    expect(formatJson(null)).toBe('null');
  });

  it('handles undefined', () => {
    expect(formatJson(undefined)).toBe('undefined');
  });

  it('handles primitive values', () => {
    expect(formatJson('hello')).toBe('"hello"');
    expect(formatJson(42)).toBe('42');
    expect(formatJson(true)).toBe('true');
  });

  it('handles circular references gracefully', () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    const result = formatJson(obj);
    // Should not throw, returns String(value)
    expect(typeof result).toBe('string');
  });
});

describe('formatSessionTitle', () => {
  const labels = {
    today: 'Today',
    yesterday: 'Yesterday',
    recently: 'Recently',
  };

  it('formats today dates', () => {
    const now = new Date();
    const result = formatSessionTitle(now.toISOString(), labels);
    expect(result).toMatch(/^Today, /);
  });

  it('formats yesterday dates', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = formatSessionTitle(yesterday.toISOString(), labels);
    expect(result).toMatch(/^Yesterday, /);
  });

  it('formats dates within 7 days as relative', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const result = formatSessionTitle(threeDaysAgo.toISOString(), labels);
    expect(result).toMatch(/ago$/);
  });

  it('formats older dates as absolute', () => {
    const oldDate = new Date('2025-01-15T14:30:00Z');
    const result = formatSessionTitle(oldDate.toISOString(), labels);
    expect(result).toMatch(/Jan 15/);
  });

  it('returns recently fallback for invalid dates', () => {
    expect(formatSessionTitle('invalid-date', labels)).toBe('Recently');
  });

  it('returns recently fallback for empty string', () => {
    expect(formatSessionTitle('', labels)).toBe('Recently');
  });
});
