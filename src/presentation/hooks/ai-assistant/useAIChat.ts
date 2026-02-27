/**
 * useAIChat Hook
 *
 * Simplified AI chat hook using Vercel AI SDK's DefaultChatTransport with expo/fetch.
 * Uses AIChatService static methods for auth/endpoints and AsyncStorage for session persistence.
 *
 * Key features:
 * - Uses DefaultChatTransport for SSE streaming (no custom parsing needed)
 * - Integrates expo/fetch for React Native compatibility
 * - Handles Chatwoot-specific auth headers and request format via AIChatService
 * - Manages session persistence via AsyncStorage
 * - Handles app background/foreground lifecycle
 *
 * @see https://ai-sdk.dev/docs/getting-started/expo
 */

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { UIMessage } from 'ai';
import { fetch as expoFetch } from 'expo/fetch';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { isTextPart, type MessagePart, type TextPart } from '@/types/ai-chat/parts';
import { AIChatService } from '@/store/ai-chat/aiChatService';

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
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse error response from the server
 * Extracts Chatwoot-specific error fields: error_details, error, message
 */
async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      // Chatwoot backend may return error_details, error, or message
      return json.error_details || json.error || json.message || json.detail || text;
    } catch {
      // Not JSON, return text directly
      return text || `HTTP ${response.status}`;
    }
  } catch {
    return `HTTP ${response.status}: ${response.statusText}`;
  }
}

/**
 * Extract text content from a UIMessage
 * Handles both parts-based and content-based message formats
 * Uses type guards instead of hardcoded strings
 */
function extractTextContent(message: UIMessage): string {
  // Handle parts-based format (SDK v5)
  if (message.parts && Array.isArray(message.parts)) {
    return message.parts
      .filter((part): part is TextPart => isTextPart(part as MessagePart))
      .map(part => part.text || '')
      .join('');
  }

  // Fallback to content field if present
  if ('content' in message && typeof message.content === 'string') {
    return message.content;
  }

  return '';
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
export function useAIChat(options?: UseAIChatOptions): UseAIChatReturn {
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

  // Load session from AsyncStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      if (initialSessionId) {
        setSessionId(initialSessionId);
        return;
      }
      try {
        const stored = await AsyncStorage.getItem(AI_CHAT_SESSION_KEY);
        if (stored && isMountedRef.current) {
          setSessionId(stored);
        }
      } catch (error) {
        console.warn('[useAIChat] Failed to load session:', error);
      }
    };
    loadSession();
  }, [initialSessionId]);

  // Save session to AsyncStorage when it changes
  useEffect(() => {
    const saveSession = async () => {
      if (!sessionId) return;
      try {
        await AsyncStorage.setItem(AI_CHAT_SESSION_KEY, sessionId);
      } catch (error) {
        console.warn('[useAIChat] Failed to save session:', error);
      }
      // Dispatch to Redux AFTER persistence attempt (success or failure)
      optionsRef.current?.onSessionIdExtracted?.(sessionId);
    };
    saveSession();
  }, [sessionId]);

  // ============================================================================
  // Transport Configuration
  // ============================================================================

  const transport = useMemo(() => {
    const apiEndpoint = AIChatService.getStreamEndpoint();

    return new DefaultChatTransport({
      api: apiEndpoint,

      // Use expo/fetch for React Native streaming support
      fetch: async (url, fetchOptions) => {
        const response = await expoFetch(
          url as string,
          fetchOptions as Parameters<typeof expoFetch>[1],
        );

        // Check for errors and parse Chatwoot-specific error format
        if (!response.ok) {
          const errorMessage = await parseErrorResponse(response as unknown as Response);
          throw new Error(errorMessage);
        }

        // Extract session ID from response headers — defer state update to post-streaming
        const newSessionId = response.headers.get('X-Chat-Session-Id');
        if (newSessionId && newSessionId !== sessionIdRef.current) {
          sessionIdRef.current = newSessionId; // update ref only, no re-render during streaming
        }

        return response as unknown as Response;
      },

      // Provide auth headers
      headers: () => ({
        ...AIChatService.getAuthHeaders(),
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      }),

      // Transform request body to Chatwoot backend format
      prepareSendMessagesRequest: async options => {
        const { messages } = options;
        const headers =
          options.headers instanceof Headers
            ? Object.fromEntries(options.headers.entries())
            : ((options.headers as Record<string, string>) ?? {});

        const lastMessage = messages[messages.length - 1];

        // Use ref to always get the latest agentBotId (avoids stale closure from useMemo)
        const currentAgentBotId = agentBotIdRef.current;

        if (!currentAgentBotId) {
          throw new Error('No agent bot selected');
        }

        // Chatwoot expects a specific request format
        const body: Record<string, unknown> = {
          messages: [
            {
              role: lastMessage.role,
              content: extractTextContent(lastMessage),
            },
          ],
          agent_bot_id: currentAgentBotId,
        };

        // Only include session ID if we have one (for continuing conversations)
        if (sessionIdRef.current) {
          body.chat_session_id = sessionIdRef.current;
        }

        return { body, headers };
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentBotId]); // ONLY agentBotId — no config, no aiBackendUrl

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
    experimental_throttle: 150,
    onError: handleError,
    onFinish: handleFinish,
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
      await AsyncStorage.removeItem(AI_CHAT_SESSION_KEY);
    } catch (error) {
      console.warn('[useAIChat] Failed to clear session:', error);
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
  };
}

export default useAIChat;
