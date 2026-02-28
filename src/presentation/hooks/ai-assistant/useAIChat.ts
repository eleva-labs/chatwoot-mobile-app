/**
 * useAIChat Hook
 *
 * AI chat hook using Vercel AI SDK's DefaultChatTransport.
 * Accepts a ChatConfig for transport, persistence, and behavior configuration.
 *
 * Key features:
 * - Uses DefaultChatTransport for SSE streaming (no custom parsing needed)
 * - Configurable transport (fetch, headers, endpoint) via ChatConfig
 * - Configurable persistence via ChatConfig.persistence
 * - Handles app background/foreground lifecycle
 *
 * @see https://ai-sdk.dev/docs/getting-started/expo
 */

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { UIMessage } from 'ai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import type { ChatConfig } from '@/types/ai-chat/chatConfig';

/**
 * STREAMING SAFETY INVARIANTS
 *
 * This hook maintains 3 of the 5 streaming invariants. See
 * docs/architecture/ai-chat-architecture.md Section 2 for full documentation.
 *
 * INV-1: Session ID Ref-Then-State Deferral
 *   sessionIdRef is updated during streaming (no re-render).
 *   setSessionId() is called only in handleFinish (post-streaming).
 *
 * INV-3: Stable SDK Callback References (optionsRef pattern)
 *   handleError and handleFinish have empty dependency arrays.
 *   They read current values from refs, not closures.
 *
 * INV-4: Transport useMemo Non-Reactive Dependencies
 *   Transport only depends on [config.transport, agentBotId]. Auth headers and
 *   endpoint are read imperatively inside callbacks via config.transport.
 *   The ChatConfig MUST be a stable module-scope constant or useMemo with empty deps.
 */

// ============================================================================
// Constants
// ============================================================================

const AI_CHAT_SESSION_KEY = '@ai_chat_active_session';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Options for the useAIChat hook
 */
export interface UseAIChatOptions {
  /** Agent bot ID to use for the chat */
  agentBotId?: number;
  /** Existing chat session ID (for resuming sessions) */
  chatSessionId?: string;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  /** Callback when a message is completed */
  onFinish?: (message: UIMessage) => void;
  /** Callback when session ID is extracted from response */
  onSessionIdExtracted?: (sessionId: string) => void;
  /** Auto-send when tool results are added */
  sendAutomaticallyWhen?: (opts: { messages: UIMessage[] }) => boolean | PromiseLike<boolean>;
}

/**
 * Return type for the useAIChat hook
 */
export interface UseAIChatReturn {
  /** Current messages in the conversation */
  messages: UIMessage[];
  /** Current error, if any */
  error: Error | undefined;
  /** Whether a message is being sent or streamed */
  isLoading: boolean;
  /** Current status of the chat */
  status: 'ready' | 'submitted' | 'streaming' | 'error';
  /** Send a new message */
  sendMessage: (text: string) => Promise<void>;
  /** Stop the current streaming response */
  stop: () => void;
  /** Set messages (for restoring from backend) */
  setMessages: (messages: UIMessage[] | ((messages: UIMessage[]) => UIMessage[])) => void;
  /** Clear the current session */
  clearSession: () => Promise<void>;
  /** Current session ID */
  sessionId: string | null;
  /** Add tool output for tool-result flows */
  addToolOutput: (opts: {
    tool: string;
    toolCallId: string;
    output: unknown;
  } | {
    tool: string;
    toolCallId: string;
    state: 'output-error';
    errorText: string;
  }) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Custom hook for AI chat using Vercel AI SDK with DefaultChatTransport
 *
 * This hook provides a simplified interface for AI chat functionality,
 * using the SDK's built-in transport instead of a custom adapter.
 *
 * @example
 * ```tsx
 * const { messages, sendMessage, isLoading } = useAIChat({
 *   agentBotId: 123,
 *   onError: (error) => console.error(error),
 * });
 *
 * // Send a message
 * await sendMessage('Hello, AI!');
 * ```
 */
export function useAIChat(config: ChatConfig, options?: UseAIChatOptions): UseAIChatReturn {
  const { agentBotId, chatSessionId: initialSessionId } = options || {};

  // ============================================================================
  // State & Refs
  // ============================================================================

  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const sessionIdRef = useRef<string | null>(initialSessionId || null);
  const isMountedRef = useRef(true);
  const optionsRef = useRef(options);
  const agentBotIdRef = useRef(agentBotId);

  // Keep refs in sync
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    agentBotIdRef.current = agentBotId;
  }, [agentBotId]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // ============================================================================
  // Session Persistence
  // ============================================================================

  // Stable ref for persistence to avoid re-triggering effects
  const persistenceRef = useRef(config.persistence);
  useEffect(() => {
    persistenceRef.current = config.persistence;
  }, [config.persistence]);

  // Load session from persistence on mount
  useEffect(() => {
    const loadSession = async () => {
      if (initialSessionId) {
        setSessionId(initialSessionId);
        return;
      }
      try {
        const stored = await persistenceRef.current?.get(AI_CHAT_SESSION_KEY);
        if (stored && isMountedRef.current) {
          setSessionId(stored);
        }
      } catch {
        // Failed to load session from persistence — start fresh
      }
    };
    loadSession();
  }, [initialSessionId]);

  // Save session to persistence when it changes
  useEffect(() => {
    const saveSession = async () => {
      if (!sessionId) return;
      try {
        await persistenceRef.current?.set(AI_CHAT_SESSION_KEY, sessionId);
      } catch {
        // Failed to save session — non-fatal
      }
      // Dispatch to Redux AFTER persistence attempt (success or failure)
      optionsRef.current?.onSessionIdExtracted?.(sessionId);
    };
    saveSession();
  }, [sessionId]);

  // ============================================================================
  // Transport Configuration
  // ============================================================================

  // Stable ref for transport to read inside callbacks
  const transportRef = useRef(config.transport);
  useEffect(() => {
    transportRef.current = config.transport;
  }, [config.transport]);

  const transport = useMemo(() => {
    const { transport: t } = config;
    const apiEndpoint = typeof t.streamEndpoint === 'function' ? t.streamEndpoint() : t.streamEndpoint;
    const fetchFn = t.fetch ?? globalThis.fetch;

    return new DefaultChatTransport({
      api: apiEndpoint,

      fetch: async (url, fetchOptions) => {
        const response = await (fetchFn as (url: string | URL, init?: unknown) => Promise<Response>)(
          url as string,
          fetchOptions,
        );

        // Check for errors and parse backend-specific error format
        if (!response.ok) {
          const parseError = transportRef.current.parseError;
          const errorMessage = parseError
            ? await parseError(response)
            : `HTTP ${response.status}`;
          throw new Error(errorMessage);
        }

        // Extract session ID from response headers — defer state update to post-streaming
        const extractSessionId = transportRef.current.extractSessionId;
        const newSessionId = extractSessionId
          ? extractSessionId(response)
          : response.headers.get('X-Chat-Session-Id');
        if (newSessionId && newSessionId !== sessionIdRef.current) {
          sessionIdRef.current = newSessionId; // update ref only, no re-render during streaming
        }

        return response;
      },

      headers: async () => {
        const currentTransport = transportRef.current;
        const h = await currentTransport.getHeaders();
        return h;
      },

      prepareSendMessagesRequest: async sdkOptions => {
        const { messages } = sdkOptions;
        const headers =
          sdkOptions.headers instanceof Headers
            ? Object.fromEntries(sdkOptions.headers.entries())
            : ((sdkOptions.headers as Record<string, string>) ?? {});

        const lastMessage = messages[messages.length - 1];
        const currentAgentBotId = agentBotIdRef.current;

        if (!currentAgentBotId) {
          throw new Error('No agent bot selected');
        }

        // If config provides prepareRequest, use it; otherwise build default body
        const currentTransport = transportRef.current;
        if (currentTransport.prepareRequest) {
          return currentTransport.prepareRequest({
            messages,
            lastMessage,
            headers,
            metadata: {
              agentBotId: currentAgentBotId,
              sessionId: sessionIdRef.current,
            },
          });
        }

        // Default fallback (should not normally be reached since chatwootChatConfig provides prepareRequest)
        const body: Record<string, unknown> = {
          messages: [{ role: lastMessage.role, content: '' }],
          agent_bot_id: currentAgentBotId,
        };
        if (sessionIdRef.current) {
          body.chat_session_id = sessionIdRef.current;
        }
        return { body, headers };
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.transport, agentBotId]);

  // ============================================================================
  // SDK Hook Integration
  // ============================================================================

  // IMPORTANT: The SDK's Chat class captures onFinish/onError at construction time
  // and never updates them (see @ai-sdk/react useChat → new Chat(options) in useRef).
  // This means these callbacks are stale closures after the first render.
  // We use refs to read current values inside the callbacks to avoid staleness.

  const handleError = useCallback(
    (error: Error) => {
      // Filter out known SDK internal errors that don't affect functionality
      const ignoredErrors = [
        "Cannot read property 'text' of undefined",
        'Cannot read properties of undefined',
      ];

      const shouldIgnore = ignoredErrors.some(msg => error.message?.includes(msg));

      if (!shouldIgnore) {
        console.error('[useAIChat] Error:', error.message);
        optionsRef.current?.onError?.(error);
      }
    },
    // Empty deps — reads from refs only. SDK captures this once at Chat construction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleFinish = useCallback(
    ({ message, isAbort }: { message: UIMessage; isAbort: boolean }) => {
      if (isMountedRef.current) {
        // Flush deferred session ID from ref → state now that streaming is done.
        // Skip on abort (user cancelled / session switch) to avoid corrupting session state.
        // Flush on error/disconnect — the backend already created the session.
        if (!isAbort) {
          const pendingSessionId = sessionIdRef.current;
          // Note: we don't compare against sessionId state because this callback
          // is captured once by the SDK (stale closure). Use ref instead.
          if (pendingSessionId) {
            setSessionId(pendingSessionId);
          }
        }
        optionsRef.current?.onFinish?.(message);
      }
    },
    // Empty deps — reads from refs only. SDK captures this once at Chat construction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const chat = useChat({
    transport,
    experimental_throttle: config.behavior?.streamThrottle ?? 150,
    onError: handleError,
    onFinish: handleFinish,
    sendAutomaticallyWhen: options?.sendAutomaticallyWhen ?? config.behavior?.sendAutomaticallyWhen,
  });

  // ============================================================================
  // AppState Handling
  // ============================================================================

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Cancel streaming when app goes to background to save battery
        if (chat.status === 'streaming') {
          chat.stop();
        }
      }
    });

    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.status, chat.stop]);

  // ============================================================================
  // Cleanup
  // ============================================================================

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      chat.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.stop]);

  // ============================================================================
  // Public Methods
  // ============================================================================

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        console.warn('[useAIChat] Attempted to send empty message');
        return;
      }

      try {
        await chat.sendMessage({ text });
      } catch (error) {
        console.error('[useAIChat] Failed to send message:', error);
        if (error instanceof Error) {
          handleError(error);
        }
      }
    },
    // chat.sendMessage is a stable method from chatRef.current (SDK internal ref)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chat.sendMessage, handleError],
  );

  const clearSession = useCallback(async () => {
    try {
      await persistenceRef.current?.remove(AI_CHAT_SESSION_KEY);
    } catch {
      // Failed to clear session from persistence — non-fatal
    }
    if (isMountedRef.current) {
      setSessionId(null);
      chat.setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.setMessages]);

  // ============================================================================
  // Return Value
  // ============================================================================

  return {
    messages: chat.messages,
    error: chat.error,
    isLoading: chat.status === 'submitted' || chat.status === 'streaming',
    status: chat.status as UseAIChatReturn['status'],
    sendMessage,
    stop: chat.stop,
    setMessages: chat.setMessages,
    clearSession,
    sessionId,
    addToolOutput: chat.addToolOutput,
  };
}

export default useAIChat;
