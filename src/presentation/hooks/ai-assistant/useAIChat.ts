/**
 * useAIChat Hook
 *
 * Simplified AI chat hook using Vercel AI SDK's DefaultChatTransport with expo/fetch.
 * Replaces the custom ChatwootAITransportAdapter with standard SDK patterns.
 *
 * Key features:
 * - Uses DefaultChatTransport for SSE streaming (no custom parsing needed)
 * - Integrates expo/fetch for React Native compatibility
 * - Handles Chatwoot-specific auth headers and request format
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

import { getStore } from '@/store/storeAccessor';
// Use domain type guards instead of hardcoded strings
import { isTextPart, type MessagePart, type TextPart } from '@/domain/types/ai-assistant/parts';

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
  /** Optional direct backend URL (bypasses Rails proxy) */
  aiBackendUrl?: string;
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
// Constants
// ============================================================================

const SESSION_STORAGE_KEY = '@ai_chat:session_id';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get authentication headers from Redux store
 */
function getAuthHeaders(): Record<string, string> {
  const store = getStore();
  const state = store.getState();
  const headers = state.auth.headers;

  if (!headers) {
    return {};
  }

  return {
    'access-token': headers['access-token'],
    uid: headers.uid,
    client: headers.client,
  };
}

/**
 * Get the base URL from Redux store settings
 */
function getBaseURL(): string {
  const store = getStore();
  const state = store.getState();
  const url = state.settings?.installationUrl || '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

/**
 * Get the current account ID from Redux store
 */
function getAccountId(): number | null {
  const store = getStore();
  const state = store.getState();
  return state.auth.user?.account_id || null;
}

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
 * Uses domain type guards instead of hardcoded strings
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
  const {
    agentBotId,
    chatSessionId: initialSessionId,
    aiBackendUrl,
    onError,
    onFinish,
  } = options || {};

  // ============================================================================
  // State & Refs
  // ============================================================================

  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const sessionIdRef = useRef<string | null>(initialSessionId || null);
  const isMountedRef = useRef(true);
  const optionsRef = useRef(options);

  // Keep refs in sync
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

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
        // Use provided session ID
        setSessionId(initialSessionId);
        return;
      }

      try {
        const storedSessionId = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
        if (storedSessionId && isMountedRef.current) {
          setSessionId(storedSessionId);
        }
      } catch (error) {
        console.warn('[useAIChat] Failed to load session from storage:', error);
      }
    };

    loadSession();
  }, [initialSessionId]);

  // Save session to AsyncStorage when it changes
  useEffect(() => {
    const saveSession = async () => {
      if (!sessionId) return;

      try {
        await AsyncStorage.setItem(SESSION_STORAGE_KEY, sessionId);
        // Notify parent component
        optionsRef.current?.onSessionIdExtracted?.(sessionId);
      } catch (error) {
        console.warn('[useAIChat] Failed to save session to storage:', error);
      }
    };

    saveSession();
  }, [sessionId]);

  // ============================================================================
  // Transport Configuration
  // ============================================================================

  const transport = useMemo(() => {
    const accountId = getAccountId();
    const baseURL = getBaseURL();

    if (!accountId) {
      console.warn('[useAIChat] No account ID available');
    }

    // Build API endpoint
    const apiEndpoint = aiBackendUrl
      ? `${aiBackendUrl}/chat/stream`
      : `${baseURL}/api/v1/accounts/${accountId}/ai_chat/stream`;

    return new DefaultChatTransport({
      api: apiEndpoint,

      // Use expo/fetch for React Native streaming support
      fetch: async (url: string | URL | Request, fetchOptions: RequestInit | undefined) => {
        const response = await expoFetch(url as string, fetchOptions as RequestInit);

        // Check for errors and parse Chatwoot-specific error format
        if (!response.ok) {
          const errorMessage = await parseErrorResponse(response);
          throw new Error(errorMessage);
        }

        // Extract session ID from response headers
        const newSessionId = response.headers.get('X-Chat-Session-Id');
        if (newSessionId && newSessionId !== sessionIdRef.current && isMountedRef.current) {
          setSessionId(newSessionId);
        }

        return response;
      },

      // Provide auth headers
      headers: () => ({
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      }),

      // Transform request body to Chatwoot backend format
      prepareSendMessagesRequest: async ({
        messages,
        headers,
      }: {
        messages: UIMessage[];
        headers: Record<string, string>;
      }) => {
        const lastMessage = messages[messages.length - 1];
        const accountId = getAccountId();

        // Chatwoot expects a specific request format
        const body: Record<string, unknown> = {
          messages: [
            {
              role: lastMessage.role,
              content: extractTextContent(lastMessage),
            },
          ],
          agent_bot_id: agentBotId,
        };

        // Only include session ID if we have one (for continuing conversations)
        if (sessionIdRef.current) {
          body.chat_session_id = sessionIdRef.current;
        }

        // For Python backend, different format may be needed
        if (aiBackendUrl) {
          return {
            body: {
              agentInput: {
                messages: body.messages,
              },
              store_id: accountId,
              agent_system_id: agentBotId,
            },
            headers,
          };
        }

        return { body, headers };
      },
    });
  }, [agentBotId, aiBackendUrl]);

  // ============================================================================
  // SDK Hook Integration
  // ============================================================================

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
        onError?.(error);
      }
    },
    [onError],
  );

  const handleFinish = useCallback(
    (message: UIMessage) => {
      if (isMountedRef.current) {
        onFinish?.(message);
      }
    },
    [onFinish],
  );

  const chat = useChat({
    transport,
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
          console.log('[useAIChat] App backgrounded, stopping stream');
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
    [chat, handleError],
  );

  const clearSession = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      if (isMountedRef.current) {
        setSessionId(null);
        chat.setMessages([]);
      }
    } catch (error) {
      console.warn('[useAIChat] Failed to clear session:', error);
    }
  }, [chat]);

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
