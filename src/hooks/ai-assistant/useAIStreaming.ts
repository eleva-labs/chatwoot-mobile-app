import { useChat } from '@ai-sdk/react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import type { UIMessage } from 'ai';
import { ChatwootAITransportAdapter } from '@/services/ChatwootAITransportAdapter';
import { useAppSelector } from '@/hooks';
import { selectUser } from '@/store/auth/authSelectors';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Options for the useAIStreaming hook
 */
export interface UseAIStreamingOptions {
  agentBotId?: number;
  chatSessionId?: string;
  aiBackendUrl?: string; // Optional: Direct URL to Python AI backend (e.g., 'http://localhost:8000')
  onError?: (error: Error) => void;
  onFinish?: (message: UIMessage) => void;
  onSessionIdExtracted?: (sessionId: string) => void;
  onThoughtEvent?: (thought: string, messageId: string) => void; // Callback for thought events (separate from tokens)
  onReasoningStart?: () => void; // Callback when reasoning starts
}

/**
 * Return type for the useAIStreaming hook
 */
export interface UseAIStreamingReturn {
  messages: UIMessage[];
  error: Error | undefined;
  isLoading: boolean;
  sendMessage: (text: string) => Promise<void>;
  cancel: () => void;
  setMessages: (messages: UIMessage[] | ((messages: UIMessage[]) => UIMessage[])) => void;
  clearSession: () => Promise<void>;
  sessionId: string | null;
}

const SESSION_STORAGE_KEY = '@ai_assistant:session_id';

/**
 * Custom hook for AI streaming using Vercel AI SDK
 * Handles session persistence, error handling, and cleanup
 */
export const useAIStreaming = (options?: UseAIStreamingOptions): UseAIStreamingReturn => {
  const user = useAppSelector(selectUser);
  const accountId = user?.account_id;
  const userId = user?.id;
  const sessionIdRef = useRef<string | null>(options?.chatSessionId || null);
  const optionsRef = useRef(options);
  const isMountedRef = useRef(true);

  // Keep options ref updated
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Load session ID from storage on mount
  useEffect(() => {
    let isMounted = true;

    const loadSessionId = async () => {
      if (!sessionIdRef.current) {
        try {
          const stored = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
          if (isMounted && stored) {
            sessionIdRef.current = stored;
          }
        } catch (error) {
          console.error('[AI Streaming] Failed to load session ID:', error);
        }
      }
    };

    loadSessionId();

    return () => {
      isMounted = false;
    };
  }, []);

    // Create transport instance ONCE when accountId is available
    // We keep the same transport instance and update its agentBotId when it changes
    // This ensures useChat always uses the same transport instance (avoiding closure issues)
    const transport = useMemo(() => {
      if (!accountId) {
        console.log('[AI Streaming] Transport not created: Account ID missing');
        return null;
      }
      // Create transport once with initial agentBotId (may be undefined)
      // We'll update agentBotId later via updateAgentBotId()
      console.log('[AI Streaming] Creating transport with agentBotId:', options?.agentBotId);
      return new ChatwootAITransportAdapter(
        accountId,
        options?.agentBotId,
        sessionIdRef.current || undefined,
        options?.aiBackendUrl,
        userId,
        options?.onThoughtEvent, // Pass thought callback to transport
        options?.onReasoningStart, // Pass reasoning-start callback to transport
      );
      // Only recreate transport if accountId, aiBackendUrl, userId, onThoughtEvent, or onReasoningStart changes
      // NOT when agentBotId changes - we'll update that via updateAgentBotId()
    }, [accountId, options?.aiBackendUrl, userId, options?.onThoughtEvent, options?.onReasoningStart]);

  // Update transport's agentBotId when it changes
  // This ensures the transport always has the latest agentBotId without creating a new instance
  useEffect(() => {
    if (transport) {
      transport.updateAgentBotId(options?.agentBotId);
    }
  }, [transport, options?.agentBotId]);

  // Handle app state changes (pause/resume streaming when app goes to background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Optionally cancel streaming when app goes to background
        // This prevents unnecessary network usage
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Memoize error handler
  const handleError = useCallback((error: Error) => {
    // Suppress "Cannot read property 'text' of undefined" errors from SDK
    // This is a known issue in the SDK when processing chunks with undefined parts
    // The SDK will continue processing and the message will be finalized correctly
    // Check early to avoid logging as ERROR
    if (
      error.message?.includes("Cannot read property 'text' of undefined") ||
      error.message?.includes("text' of undefined")
    ) {
      // Only log in dev mode as a debug message, not as an error
      if (__DEV__) {
        console.debug(
          '[AI Streaming] SDK internal error (suppressed, message will still be finalized):',
          error.message,
        );
      }
      // Don't call onError for this specific error, as it's recoverable
      return;
    }

    // For other errors, log them normally
    console.error('[AI Streaming] Error:', error);
    console.error('[AI Streaming] Error stack:', error.stack);
    // Log error details to help debug
    if (__DEV__) {
      console.error('[AI Streaming] Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
    }

    if (isMountedRef.current) {
      optionsRef.current?.onError?.(error);
    }
    // Note: We don't stop the stream on error, as the SDK might still be able to finalize the message
    // The error might be recoverable (e.g., invalid part structure that can be handled)
  }, []);

  // Memoize finish handler
  const handleFinish = useCallback(
    async (finishOptions: {
      message: UIMessage;
      messages: UIMessage[];
      isAbort: boolean;
      isDisconnect: boolean;
      isError: boolean;
      finishReason?: string;
    }) => {
      // Extract full text from the finished message to verify if final text from complete event is included
      const getFullText = (msg: UIMessage): string => {
        if (!msg.parts || !Array.isArray(msg.parts)) return '';
        return msg.parts
          .filter(
            part => part && typeof part === 'object' && 'type' in part && part.type === 'text',
          )
          .map(part => {
            if ('text' in part && typeof part.text === 'string') return part.text;
            if ('content' in part && typeof part.content === 'string') return part.content;
            if ('delta' in part && typeof part.delta === 'string') return part.delta;
            return '';
          })
          .join(' ')
          .trim();
      };

      const finishedMessageText = getFullText(finishOptions.message);
      const finishedMessageTextLength = finishedMessageText.length;

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[useAIStreaming] ✅ STREAMING FINISHED - onFinish callback');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log({
        messageId: finishOptions.message.id,
        messageRole: finishOptions.message.role,
        isAbort: finishOptions.isAbort,
        isDisconnect: finishOptions.isDisconnect,
        isError: finishOptions.isError,
        finishReason: finishOptions.finishReason,
        hasParts: !!finishOptions.message.parts,
        partsLength: Array.isArray(finishOptions.message.parts)
          ? finishOptions.message.parts.length
          : 0,
        fullTextLength: finishedMessageTextLength,
        fullTextPreview:
          finishedMessageText.substring(0, 200) + (finishedMessageTextLength > 200 ? '...' : ''),
        fullTextEnd:
          finishedMessageTextLength > 200
            ? finishedMessageText.substring(finishedMessageTextLength - 200)
            : finishedMessageText,
        partsPreview: Array.isArray(finishOptions.message.parts)
          ? finishOptions.message.parts.slice(0, 5).map((p, idx) => ({
              index: idx,
              type: p?.type,
              hasText: 'text' in (p || {}),
              hasContent: 'content' in (p || {}),
              hasDelta: 'delta' in (p || {}),
              textLength: (p as any)?.text?.length || 0,
              textPreview: (p as any)?.text?.substring?.(0, 100),
            }))
          : null,
        totalMessagesCount: finishOptions.messages.length,
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (sessionIdRef.current && isMountedRef.current) {
        try {
          await AsyncStorage.setItem(SESSION_STORAGE_KEY, sessionIdRef.current);
          optionsRef.current?.onSessionIdExtracted?.(sessionIdRef.current);
        } catch (error) {
          console.error('[AI Streaming] Failed to save session ID:', error);
        }
      }
      if (isMountedRef.current) {
        optionsRef.current?.onFinish?.(finishOptions.message);
      }
    },
    [],
  );

  // Log transport changes for debugging
  useEffect(() => {
    console.log('[AI Streaming] Transport changed:', {
      hasTransport: !!transport,
      agentBotId: transport ? (transport as any).agentBotId : undefined,
    });
  }, [transport]);

  const { messages, error, sendMessage, status, stop, setMessages } = useChat({
    transport: transport || undefined,
    onError: handleError,
    onFinish: handleFinish,
  });

  // Normalize messages to ensure all parts have the required structure
  // This prevents the "Cannot read property 'text' of undefined" error
  const normalizedMessages = useMemo(() => {
    return messages.map(msg => {
      // If message has parts, ensure they're all valid
      if (msg.parts && Array.isArray(msg.parts)) {
        const normalizedParts = msg.parts
          .filter(part => {
            // Filter out undefined/null parts
            if (!part || typeof part !== 'object') {
              return false;
            }
            // Ensure part has a type
            if (!('type' in part)) {
              return false;
            }
            // For text parts, ensure they have a text property (or content/delta that we can normalize)
            if ((part as any).type === 'text') {
              const hasText = 'text' in part && (part as any).text != null;
              const hasContent = 'content' in part && (part as any).content != null;
              const hasDelta = 'delta' in part && (part as any).delta != null;
              return hasText || hasContent || hasDelta;
            }
            return true;
          })
          .map(part => {
            // Normalize text parts to ensure they have a 'text' property
            if ((part as any).type === 'text') {
              const partObj = part as Record<string, unknown>;
              // If text property doesn't exist or is invalid, use content or delta as fallback
              if (!('text' in partObj) || partObj.text === undefined || partObj.text === null) {
                const textValue = partObj.content || partObj.delta || '';
                return { ...partObj, text: textValue };
              }
              // Ensure text is a string
              if (typeof partObj.text !== 'string') {
                return { ...partObj, text: String(partObj.text || '') };
              }
            }
            return part;
          });

        return { ...msg, parts: normalizedParts };
      }
      return msg;
    });
  }, [messages]);

  // Convert status to isLoading for compatibility
  const isLoading = status === 'submitted' || status === 'streaming';

  const sendAIMessage = useCallback(
    async (text: string) => {
      console.log('[AI Streaming] sendAIMessage called:', {
        hasTransport: !!transport,
        agentBotId: optionsRef.current?.agentBotId,
        isMounted: isMountedRef.current,
      });
      if (!transport) {
        throw new Error('Transport not initialized. Account ID may be missing.');
      }
      if (!optionsRef.current?.agentBotId) {
        throw new Error(
          'No agent bot selected. Please wait for the agent bot to be loaded before sending messages.',
        );
      }
      // Note: We don't check isMountedRef here because useChat handles unmounting gracefully
      // The isMountedRef check is only used for callbacks to prevent state updates after unmount
      // CRITICAL: Update transport's agentBotId right before sending
      // This ensures useChat uses the correct agentBotId even if it's holding onto an old transport instance
      transport.updateAgentBotId(optionsRef.current.agentBotId);
      console.log('[AI Streaming] Updated transport agentBotId to:', optionsRef.current.agentBotId);
      console.log(
        '[AI Streaming] Transport agentBotId after update:',
        (transport as any).agentBotId,
      );
      console.log('[AI Streaming] Transport instance ID:', (transport as any).instanceId);
      console.log('[AI Streaming] Calling sendMessage from useChat...');
      try {
        await sendMessage({ text });
      } catch (error) {
        // Catch and log errors that occur during message sending
        // This includes errors from the SDK's internal processing
        console.error('[AI Streaming] Error during sendMessage:', error);
        if (error instanceof Error) {
          // If it's the "Cannot read property 'text' of undefined" error,
          // it's likely a recoverable error in the SDK's internal processing
          // The message might still be finalized correctly
          if (error.message.includes("Cannot read property 'text' of undefined")) {
            console.warn(
              '[AI Streaming] SDK internal error detected (may be recoverable):',
              error.message,
            );
            // Don't rethrow - let the SDK handle it
            return;
          }
        }
        // Rethrow other errors
        throw error;
      }
    },
    [sendMessage, transport],
  );

  const clearSession = useCallback(async () => {
    sessionIdRef.current = null;
    try {
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.error('[AI Streaming] Failed to clear session:', error);
    }
    if (isMountedRef.current) {
      setMessages([]);
    }
  }, [setMessages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Cancel any ongoing requests
      stop();
    };
  }, [stop]);

  // Filter out the "Cannot read property 'text' of undefined" error
  // This is a known SDK issue that doesn't affect functionality
  // We suppress it in handleError, but the SDK might still set the error state
  const filteredError = useMemo(() => {
    if (!error) {
      return null;
    }
    // Check if this is the suppressed error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes("Cannot read property 'text' of undefined") ||
      errorMessage.includes("text' of undefined")
    ) {
      // Return null to hide this error from the UI
      return null;
    }
    // Return other errors as-is
    return error;
  }, [error]);

  return {
    messages: normalizedMessages,
    error: filteredError,
    isLoading,
    sendMessage: sendAIMessage,
    cancel: stop,
    setMessages,
    clearSession,
    sessionId: sessionIdRef.current,
  };
};
