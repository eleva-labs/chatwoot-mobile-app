import { renderHook, act } from '@testing-library/react-native';
import type { UIMessage } from 'ai';
import type { AIChatMessage } from '@application/store/ai-chat/aiChatTypes';
import { useMessageBridge, type UseMessageBridgeOptions } from '../useMessageBridge';

import { mapMessagesToUIMessages } from '@application/store/ai-chat/aiChatMapper';

// Mock mapMessagesToUIMessages
const mockMappedMessages: UIMessage[] = [
  { id: 'ui-1', role: 'user', parts: [{ type: 'text' as const, text: 'Hello' }] },
  {
    id: 'ui-2',
    role: 'assistant',
    parts: [{ type: 'text' as const, text: 'Hi there' }],
  },
];

jest.mock('@application/store/ai-chat/aiChatMapper', () => ({
  mapMessagesToUIMessages: jest.fn(() => mockMappedMessages),
}));
const mockMapMessages = mapMessagesToUIMessages as jest.MockedFunction<
  typeof mapMessagesToUIMessages
>;

// Helpers

function makeBackendMessages(count: number, idPrefix = 'msg'): AIChatMessage[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${idPrefix}-${i + 1}`,
    role: 'user' as const,
    content: `Message ${i + 1}`,
    timestamp: '2026-02-28T10:00:00Z',
    parts: [{ type: 'text', text: `Message ${i + 1}` }],
  }));
}

function defaultOptions(overrides?: Partial<UseMessageBridgeOptions>): UseMessageBridgeOptions {
  return {
    activeSessionId: 'session-1',
    isLoadingMessages: false,
    backendMessages: makeBackendMessages(2),
    chatStatus: 'ready',
    setMessages: jest.fn(),
    isNewConversation: false,
    ...overrides,
  };
}

describe('useMessageBridge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. Bridge fires when all guards pass
  // -------------------------------------------------------------------------
  it('fires setMessages when all guards pass', () => {
    const setMessages = jest.fn();
    const opts = defaultOptions({ setMessages });

    renderHook(() => useMessageBridge(opts));

    expect(mockMapMessages).toHaveBeenCalledWith(opts.backendMessages);
    expect(setMessages).toHaveBeenCalledTimes(1);
    expect(setMessages).toHaveBeenCalledWith(mockMappedMessages);
  });

  // -------------------------------------------------------------------------
  // 2. Bridge does NOT fire during streaming
  // -------------------------------------------------------------------------
  it('does NOT fire setMessages when chatStatus is streaming', () => {
    const setMessages = jest.fn();
    const opts = defaultOptions({ setMessages, chatStatus: 'streaming' });

    renderHook(() => useMessageBridge(opts));

    expect(setMessages).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // 3. Bridge does NOT fire during submitted
  // -------------------------------------------------------------------------
  it('does NOT fire setMessages when chatStatus is submitted', () => {
    const setMessages = jest.fn();
    const opts = defaultOptions({ setMessages, chatStatus: 'submitted' });

    renderHook(() => useMessageBridge(opts));

    expect(setMessages).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // 4. Bridge does NOT fire when isNewConversation is true
  // -------------------------------------------------------------------------
  it('does NOT fire setMessages when isNewConversation is true', () => {
    const setMessages = jest.fn();
    const opts = defaultOptions({ setMessages, isNewConversation: true });

    renderHook(() => useMessageBridge(opts));

    expect(setMessages).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // 5. Bridge does NOT fire when isLoadingMessages is true
  // -------------------------------------------------------------------------
  it('does NOT fire setMessages when isLoadingMessages is true', () => {
    const setMessages = jest.fn();
    const opts = defaultOptions({ setMessages, isLoadingMessages: true });

    renderHook(() => useMessageBridge(opts));

    expect(setMessages).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // 6. Fingerprint dedup prevents re-fire
  // -------------------------------------------------------------------------
  it('does NOT fire setMessages twice for the same fingerprint', () => {
    const setMessages = jest.fn();
    const messages = makeBackendMessages(2);
    const opts = defaultOptions({ setMessages, backendMessages: messages });

    const { rerender } = renderHook(() => useMessageBridge(opts));

    expect(setMessages).toHaveBeenCalledTimes(1);

    // Re-render with identical props — fingerprint should prevent re-fire
    rerender();

    expect(setMessages).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // 7. resetBridgeKey clears fingerprint so same messages re-fire
  // -------------------------------------------------------------------------
  it('fires setMessages again after resetBridgeKey is called', () => {
    const setMessages = jest.fn();
    const messages = makeBackendMessages(2);

    const { result, rerender } = renderHook(
      (props: UseMessageBridgeOptions) => useMessageBridge(props),
      { initialProps: defaultOptions({ setMessages, backendMessages: messages }) },
    );

    expect(setMessages).toHaveBeenCalledTimes(1);

    // Reset the bridge key
    act(() => {
      result.current.resetBridgeKey();
    });

    // Re-render with a new (but equivalent) backendMessages array reference
    // to trigger the useEffect dependency change after fingerprint reset
    rerender(defaultOptions({ setMessages, backendMessages: [...messages] }));

    expect(setMessages).toHaveBeenCalledTimes(2);
  });

  // -------------------------------------------------------------------------
  // 8. Empty backendMessages — bridge should not fire
  // -------------------------------------------------------------------------
  it('does NOT fire setMessages when backendMessages is empty', () => {
    const setMessages = jest.fn();
    const opts = defaultOptions({ setMessages, backendMessages: [] });

    renderHook(() => useMessageBridge(opts));

    expect(setMessages).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // 9. Bridge does NOT fire when activeSessionId is null
  // -------------------------------------------------------------------------
  it('does NOT fire setMessages when activeSessionId is null', () => {
    const setMessages = jest.fn();
    const opts = defaultOptions({ setMessages, activeSessionId: null });

    renderHook(() => useMessageBridge(opts));

    expect(setMessages).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // 10. Bridge converts messages via mapMessagesToUIMessages
  // -------------------------------------------------------------------------
  it('calls mapMessagesToUIMessages with backendMessages', () => {
    const messages = makeBackendMessages(3, 'conv');
    const opts = defaultOptions({ backendMessages: messages });

    renderHook(() => useMessageBridge(opts));

    expect(mockMapMessages).toHaveBeenCalledTimes(1);
    expect(mockMapMessages).toHaveBeenCalledWith(messages);
  });

  // -------------------------------------------------------------------------
  // 11. Different messages produce different fingerprint and re-fire
  // -------------------------------------------------------------------------
  it('fires setMessages again when backendMessages change', () => {
    const setMessages = jest.fn();
    const messages1 = makeBackendMessages(2, 'first');

    let currentOpts = defaultOptions({ setMessages, backendMessages: messages1 });
    const { rerender } = renderHook(() => useMessageBridge(currentOpts));

    expect(setMessages).toHaveBeenCalledTimes(1);

    // Change to different messages (different IDs = different fingerprint)
    const messages2 = makeBackendMessages(2, 'second');
    currentOpts = defaultOptions({ setMessages, backendMessages: messages2 });
    rerender();

    expect(setMessages).toHaveBeenCalledTimes(2);
  });

  // -------------------------------------------------------------------------
  // 12. resetBridgeKey is a stable callback (same reference across renders)
  // -------------------------------------------------------------------------
  it('returns a stable resetBridgeKey callback across renders', () => {
    const opts = defaultOptions();
    const { result, rerender } = renderHook(() => useMessageBridge(opts));

    const firstRef = result.current.resetBridgeKey;
    rerender();
    const secondRef = result.current.resetBridgeKey;

    expect(firstRef).toBe(secondRef);
  });

  // -------------------------------------------------------------------------
  // 13. chatStatus error allows bridge to fire (only streaming/submitted blocked)
  // -------------------------------------------------------------------------
  it('fires setMessages when chatStatus is error', () => {
    const setMessages = jest.fn();
    const opts = defaultOptions({ setMessages, chatStatus: 'error' });

    renderHook(() => useMessageBridge(opts));

    expect(setMessages).toHaveBeenCalledTimes(1);
  });
});
