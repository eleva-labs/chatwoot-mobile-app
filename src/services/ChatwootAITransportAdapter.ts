import { fetch as expoFetch } from 'expo/fetch';
import { getStore } from '@/store/storeAccessor';
import type { ChatTransport, UIMessage, UIMessageChunk } from 'ai';
import { logger } from '@/utils/logger';
import { StreamEnums, StreamEnumsSet } from '@/services/enums';

/**
 * Custom transport that converts Vercel AI SDK format to Chatwoot backend format
 * and converts Chatwoot SSE responses back to Vercel AI SDK UIMessageChunk format
 */
export class ChatwootAITransportAdapter<UI_MESSAGE extends UIMessage>
  implements ChatTransport<UI_MESSAGE>
{
  private readonly accountId: number;
  private agentBotId?: number;
  private chatSessionId?: string;
  private readonly aiBackendUrl?: string;
  private readonly userId?: number;
  private readonly instanceId: string; // Unique ID for this transport instance
  private onThoughtEvent?: (thought: string, messageId: string) => void; // Callback for thought events
  private onReasoningStart?: () => void; // Callback when reasoning starts

  // Reasoning event state tracking
  // Track multiple reasoning blocks per message (keyed by reasoning ID)
  private reasoningState: Map<string, { messageId: string; content: string }> = new Map();
  // Track the actual SDK message ID (from text-start) for each transport messageId
  private transportIdToSdkIdMap: Map<string, string> = new Map();

  constructor(
    accountId: number,
    agentBotId?: number,
    chatSessionId?: string,
    aiBackendUrl?: string,
    userId?: number,
    onThoughtEvent?: (thought: string, messageId: string) => void,
    onReasoningStart?: () => void,
  ) {
    this.accountId = accountId;
    this.agentBotId = agentBotId;
    this.chatSessionId = chatSessionId;
    this.aiBackendUrl = aiBackendUrl;
    this.userId = userId;
    this.onThoughtEvent = onThoughtEvent;
    this.onReasoningStart = onReasoningStart;
    // Generate a unique instance ID for debugging
    this.instanceId = `${accountId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('[ChatwootAITransportAdapter] Created new transport instance:', {
      instanceId: this.instanceId,
      accountId: this.accountId,
      agentBotId: this.agentBotId,
    });
  }

  /**
   * Update agent bot ID (useful when bot is selected after transport creation)
   */
  updateAgentBotId(agentBotId?: number): void {
    console.log(
      '[ChatwootAITransportAdapter] Updating agentBotId from',
      this.agentBotId,
      'to',
      agentBotId,
    );
    console.log('[ChatwootAITransportAdapter] Transport instance ID:', this.instanceId);
    this.agentBotId = agentBotId;
    console.log('[ChatwootAITransportAdapter] agentBotId after update:', this.agentBotId);
  }

  /**
   * Get authentication headers from Redux store
   */
  private getAuthHeaders(): Record<string, string> {
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
   * Get base URL from Redux store
   * Removes trailing slash to avoid double slashes in URLs
   */
  getBaseURL(): string {
    const store = getStore();
    const state = store.getState();
    const url = state.settings?.installationUrl || '';
    // Remove trailing slash to avoid double slashes when constructing URLs
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }

  /**
   * Convert Vercel AI SDK messages format to Chatwoot format
   */
  private convertMessagesToChatwoot(messages: UI_MESSAGE[]): { role: string; content: string }[] {
    return messages.map(msg => {
      const role = msg.role === 'user' ? 'user' : msg.role === 'assistant' ? 'assistant' : 'system';

      // Extract text content from message parts
      let content = '';
      try {
        if (Array.isArray(msg.parts) && msg.parts.length > 0) {
          content = msg.parts
            .filter(part => {
              // Strictly filter: part must exist, be an object, and have a type
              return part != null && typeof part === 'object' && part !== null && 'type' in part;
            })
            .map(part => {
              try {
                // Double-check part is valid before accessing properties
                if (!part || typeof part !== 'object' || part.type !== 'text') {
                  return '';
                }
                // Safely access text property with fallback using optional chaining
                const partObj = part as Record<string, unknown>;
                const text = partObj?.text as string | undefined;
                const content = partObj?.content as string | undefined;
                return text ?? content ?? '';
              } catch (error) {
                console.warn(
                  '[ChatwootAITransportAdapter] Error extracting text from part:',
                  error,
                  {
                    part,
                    partType: typeof part,
                    partKeys: part ? Object.keys(part) : 'null/undefined',
                  },
                );
                return '';
              }
            })
            .filter(text => text !== '') // Remove empty strings
            .join('');
        } else {
          const msgObj = msg as Record<string, unknown>;
          const msgContent = msgObj?.content;
          if (msgContent && typeof msgContent === 'string') {
            // Fallback: message might have content directly
            content = msgContent;
          }
        }
      } catch (error) {
        console.error(
          '[ChatwootAITransportAdapter] Error converting message to Chatwoot format:',
          error,
          msg,
        );
        content = '';
      }

      return { role, content };
    });
  }

  /**
   * Validate that response uses standard streaming protocol format
   */
  private validateStandardFormatHeaders(headers: Headers): void {
    const vercelHeader = headers.get('x-vercel-ai-ui-message-stream');
    const protocolHeader = headers.get('x-ai-streaming-protocol');

    if (vercelHeader === 'v1' || protocolHeader === 'v1') {
      console.log('[Chatwoot AI] ✅ Standard format detected:', {
        vercelHeader,
        protocolHeader,
      });
      logger.log('[Chatwoot AI] Standard format detected', {
        vercelHeader,
        protocolHeader,
      });
      return;
    }

    const errorMessage =
      'Backend must send standard streaming protocol format. ' +
      `Expected header 'x-vercel-ai-ui-message-stream: v1' or 'x-ai-streaming-protocol: v1', ` +
      `but got: vercel=${vercelHeader}, protocol=${protocolHeader}`;

    console.error('[Chatwoot AI] ❌ Standard format header missing:', {
      vercelHeader,
      protocolHeader,
      allHeaders: Array.from(headers.entries()),
    });
    logger.log('[Chatwoot AI] Standard format header missing', {
      vercelHeader,
      protocolHeader,
      allHeaders: Array.from(headers.entries()),
    });

    throw new Error(errorMessage);
  }

  /**
   * Parse standard format SSE event
   * Standard format: data: {"type": "text-delta", ...} or data: [DONE]
   *
   * Handles:
   * - Standard format: data: {"type": "text-delta", "delta": "...", "id": "..."}
   * - Stream termination: data: [DONE]
   * - Edge cases: empty data, missing type, malformed JSON, partial events
   */
  private parseStandardFormatEvent(eventText: string): {
    type: StreamEnums;
    data: Record<string, unknown>;
  } | null {
    if (!eventText || typeof eventText !== 'string') {
      console.warn('[Chatwoot AI] Invalid event text (not a string):', typeof eventText);
      return null;
    }

    const trimmed = eventText.trim();
    if (!trimmed) {
      // Empty event, skip silently
      return null;
    }

    // Check for [DONE] marker (multiple formats supported)
    if (trimmed === 'data: [DONE]' || trimmed === '[DONE]' || trimmed.startsWith('data: [DONE]')) {
      console.log('[Chatwoot AI] [DONE] marker detected');
      logger.log('[Chatwoot AI] [DONE] marker detected', { eventText: trimmed });
      return { type: StreamEnums.Done, data: {} };
    }

    // Parse standard format: data: {"type": "text-delta", ...}
    // Support multiple formats:
    // - data: {"type": "text-delta", ...}
    // - data:{"type": "text-delta", ...} (no space)
    // - {"type": "text-delta", ...} (no data: prefix, for robustness)
    const dataMatch = trimmed.match(/^data:\s*(.+)$/m) || trimmed.match(/^(.+)$/m);
    if (!dataMatch || !dataMatch[1]) {
      console.warn('[Chatwoot AI] No data field found in event:', trimmed.substring(0, 100));
      return null;
    }

    const dataStr = dataMatch[1].trim();
    if (!dataStr) {
      console.warn('[Chatwoot AI] Empty data field in event');
      return null;
    }

    try {
      const data = JSON.parse(dataStr) as Record<string, unknown>;
      if (!data || typeof data !== 'object') {
        console.warn('[Chatwoot AI] Parsed data is not an object:', typeof data);
        return null;
      }

      // Validate required 'type' field
      if (!data.type) {
        console.warn('[Chatwoot AI] Missing required "type" field in event data:', {
          dataKeys: Object.keys(data),
          eventPreview: trimmed.substring(0, 200),
        });
        logger.log('[Chatwoot AI] Missing required "type" field', {
          dataKeys: Object.keys(data),
        });
        return null;
      }

      if (typeof data.type !== 'string') {
        console.warn('[Chatwoot AI] Invalid "type" field (not a string):', {
          type: data.type,
          typeOf: typeof data.type,
        });
        return null;
      }

      const streamEventType = this.mapToStreamEnum(data.type);
      if (!streamEventType) {
        console.warn('[Chatwoot AI] Unsupported event type:', data.type);
        logger.log('[Chatwoot AI] Unsupported event type', {
          type: data.type,
        });
        return null;
      }

      return { type: streamEventType, data };
    } catch (e) {
      // Enhanced error logging for JSON parsing failures
      const error = e instanceof Error ? e : new Error(String(e));
      console.warn('[Chatwoot AI] Failed to parse standard format event JSON:', {
        error: error.message,
        eventPreview: trimmed.substring(0, 200),
        dataStrPreview: dataStr.substring(0, 100),
      });
      logger.log('[Chatwoot AI] JSON parse error', {
        error: error.message,
        eventPreview: trimmed.substring(0, 200),
      });
      return null;
    }
  }

  private mapToStreamEnum(type: unknown): StreamEnums | null {
    if (typeof type === 'string' && StreamEnumsSet.has(type)) {
      return type as StreamEnums;
    }
    return null;
  }

  /**
   * Convert standard format event to Vercel AI SDK UIMessageChunk format
   *
   * Validates required fields per event type and handles missing/invalid data gracefully.
   */
  private convertStandardFormatEventToUIMessageChunk(
    eventType: StreamEnums,
    data: Record<string, unknown>,
    messageId: string,
  ): UIMessageChunk | null {
    switch (eventType) {
      case StreamEnums.TextStart:
        // text-start requires id (optional, falls back to messageId)
        const textStartId = (data.id as string) || messageId;
        if (!textStartId) {
          console.warn('[Chatwoot AI] text-start event missing id, using fallback');
        }
        // Map transport ID to SDK ID so we can associate thoughts correctly
        this.transportIdToSdkIdMap.set(messageId, textStartId);
        console.log('[Chatwoot AI] 📍 Mapped transport ID to SDK ID:', {
          transportId: messageId,
          sdkId: textStartId,
          mapSize: this.transportIdToSdkIdMap.size,
        });
        return { type: 'text-start', id: textStartId };

      case StreamEnums.TextDelta:
        // text-delta requires delta (string) and id (optional)
        const delta = data.delta;
        if (delta === undefined || delta === null) {
          console.warn('[Chatwoot AI] text-delta event missing required "delta" field:', {
            dataKeys: Object.keys(data),
          });
          return null;
        }
        if (typeof delta !== 'string') {
          console.warn('[Chatwoot AI] text-delta event "delta" field is not a string:', {
            deltaType: typeof delta,
            deltaValue: String(delta).substring(0, 50),
          });
          return null;
        }
        // Empty delta is valid (may be used for formatting)
        const textDeltaId = (data.id as string) || messageId;
        return {
          type: 'text-delta',
          delta,
          id: textDeltaId,
        };

      case StreamEnums.TextEnd:
        // text-end requires id (optional, falls back to messageId)
        const textEndId = (data.id as string) || messageId;
        if (!textEndId) {
          console.warn('[Chatwoot AI] text-end event missing id, using fallback');
        }
        return { type: 'text-end', id: textEndId };

      case StreamEnums.Finish:
        // Map finishReason to valid Vercel AI SDK type
        const finishReasonValue = (data.finishReason as string) || 'stop';
        const validFinishReason =
          finishReasonValue === 'stop' ||
          finishReasonValue === 'length' ||
          finishReasonValue === 'content-filter' ||
          finishReasonValue === 'tool-calls' ||
          finishReasonValue === 'error' ||
          finishReasonValue === 'other'
            ? finishReasonValue
            : 'stop';

        // Extract usage stats for logging/analytics
        // Note: usage stats are not part of UIMessageChunk finish type
        // but we extract them for logging purposes
        const usage = data.usage as
          | {
              promptTokens?: number;
              completionTokens?: number;
              totalTokens?: number;
            }
          | undefined;

        if (usage) {
          console.log('[Chatwoot AI] Finish event - Usage stats:', {
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
            totalTokens: usage.totalTokens,
            finishReason: validFinishReason,
          });
          logger.log('[Chatwoot AI] Finish event - Usage stats', {
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
            totalTokens: usage.totalTokens,
            finishReason: validFinishReason,
            messageId,
          });
        } else {
          console.log('[Chatwoot AI] Finish event - No usage stats provided', {
            finishReason: validFinishReason,
          });
        }

        return {
          type: 'finish',
          finishReason: validFinishReason,
          // Note: usage stats are not part of UIMessageChunk finish type
          // They are logged above for analytics purposes
        };

      case StreamEnums.Done:
        return { type: 'text-end', id: messageId };

      case StreamEnums.Error:
        // error requires errorText (string)
        const errorText = data.errorText;
        if (errorText === undefined || errorText === null) {
          console.warn('[Chatwoot AI] error event missing required "errorText" field:', {
            dataKeys: Object.keys(data),
          });
          // Fallback: try to extract error from other fields
          const fallbackError =
            (data.message as string) ||
            (data.error as string) ||
            (data.errorMessage as string) ||
            'An error occurred';
          return {
            type: 'error',
            errorText: String(fallbackError),
          };
        }
        return {
          type: 'error',
          errorText: String(errorText),
        };

      case StreamEnums.ReasoningStart:
        // Initialize reasoning block
        // Backend sends reasoning ID to track multiple blocks per message
        const reasoningId =
          (data.id as string) ||
          `reasoning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.reasoningState.set(reasoningId, {
          messageId,
          content: '',
        });
        console.log('[Chatwoot AI] 🟢 REASONING-START received:', {
          reasoningId,
          messageId,
          dataId: data.id,
          allData: JSON.stringify(data),
        });
        logger.log('[Chatwoot AI] Reasoning block started', {
          reasoningId,
          messageId,
        });
        // Trigger callback to show THOUGHTS anchor in UI
        if (this.onReasoningStart) {
          try {
            this.onReasoningStart();
            console.log('[Chatwoot AI] ✅ onReasoningStart callback triggered');
          } catch (cbErr) {
            console.warn('[Chatwoot AI] ⚠️ Error calling onReasoningStart:', cbErr);
          }
        }
        return null; // Don't send to SDK

      case StreamEnums.ReasoningDelta:
        // Accumulate reasoning content
        const deltaReasoningId = (data.id as string) || messageId;
        console.log('[Chatwoot AI] 🔍 REASONING-DELTA lookup:', {
          deltaReasoningId,
          messageId,
          availableKeys: Array.from(this.reasoningState.keys()),
          mapSize: this.reasoningState.size,
        });
        const reasoningState = this.reasoningState.get(deltaReasoningId);
        console.log('[Chatwoot AI] 🔍 REASONING-DELTA state lookup result:', {
          found: !!reasoningState,
          hasContent: !!reasoningState?.content,
          contentLength: reasoningState?.content?.length || 0,
        });
        if (reasoningState) {
          const delta = (data.delta as string) || '';
          reasoningState.content += delta;
          // Log first delta and periodically
          if (
            reasoningState.content.length === delta.length ||
            reasoningState.content.length % 100 === 0
          ) {
            console.log('[Chatwoot AI] 🔵 REASONING-DELTA received:', {
              reasoningId: deltaReasoningId,
              deltaLength: delta.length,
              totalLength: reasoningState.content.length,
              deltaPreview: delta.substring(0, 50),
            });
          }
          // Stream THOUGHTS to UI incrementally so the collapsible view updates live
          // We send the accumulated content so far to keep UI idempotent
          // Use SDK message ID (from text-start) instead of transport ID
          const sdkMessageId = this.transportIdToSdkIdMap.get(reasoningState.messageId);
          const targetMessageId = sdkMessageId || reasoningState.messageId;
          console.log('[Chatwoot AI] 🎯 Emitting thought event:', {
            transportId: reasoningState.messageId,
            sdkMessageId,
            targetMessageId,
            contentLength: reasoningState.content.length,
          });
          if (this.onThoughtEvent && reasoningState.content) {
            try {
              this.onThoughtEvent(reasoningState.content, targetMessageId);
            } catch (cbErr) {
              console.warn(
                '[Chatwoot AI] ⚠️ Error calling onThoughtEvent during reasoning-delta:',
                cbErr,
              );
            }
          }
        } else {
          console.warn('[Chatwoot AI] ⚠️ REASONING-DELTA received for unknown reasoning ID:', {
            reasoningId: deltaReasoningId,
            messageId,
            dataId: data.id,
            availableIds: Array.from(this.reasoningState.keys()),
            allData: JSON.stringify(data),
          });
          // Try to create a new state if ID matches messageId (fallback)
          if (deltaReasoningId === messageId) {
            console.log(
              '[Chatwoot AI] 🔄 Creating fallback reasoning state for messageId:',
              messageId,
            );
            this.reasoningState.set(deltaReasoningId, {
              messageId,
              content: (data.delta as string) || '',
            });
            // Emit initial content to UI for immediate visibility
            if (this.onThoughtEvent && (data.delta as string)) {
              try {
                this.onThoughtEvent(String(data.delta || ''), messageId);
              } catch (cbErr) {
                console.warn(
                  '[Chatwoot AI] ⚠️ Error calling onThoughtEvent for fallback reasoning state:',
                  cbErr,
                );
              }
            }
          }
        }
        return null; // Don't send to SDK

      case StreamEnums.ReasoningEnd:
        // Finalize reasoning block and trigger callback
        const endReasoningId = (data.id as string) || messageId;
        const finalReasoningState = this.reasoningState.get(endReasoningId);
        if (finalReasoningState && finalReasoningState.content) {
          // Use SDK message ID (from text-start) instead of transport ID
          const sdkMessageId = this.transportIdToSdkIdMap.get(finalReasoningState.messageId);
          const targetMessageId = sdkMessageId || finalReasoningState.messageId;
          console.log('[Chatwoot AI] 🎯 Final thought event (reasoning-end):', {
            transportId: finalReasoningState.messageId,
            sdkMessageId,
            targetMessageId,
            contentLength: finalReasoningState.content.length,
          });
          // Call the callback to store reasoning content
          if (this.onThoughtEvent) {
            this.onThoughtEvent(finalReasoningState.content, targetMessageId);
            console.log('[Chatwoot AI] 🟣 REASONING-END received and callback triggered:', {
              reasoningId: endReasoningId,
              messageId: finalReasoningState.messageId,
              sdkMessageId: targetMessageId,
              contentLength: finalReasoningState.content.length,
              contentPreview: finalReasoningState.content.substring(0, 100),
              callbackExists: !!this.onThoughtEvent,
            });
            logger.log('[Chatwoot AI] Reasoning block ended', {
              reasoningId: endReasoningId,
              messageId: finalReasoningState.messageId,
              sdkMessageId: targetMessageId,
              contentLength: finalReasoningState.content.length,
            });
          } else {
            console.warn('[Chatwoot AI] ⚠️ REASONING-END but no onThoughtEvent callback:', {
              reasoningId: endReasoningId,
              messageId: finalReasoningState.messageId,
            });
          }
          // Clean up reasoning state
          this.reasoningState.delete(endReasoningId);
        } else {
          console.warn(
            '[Chatwoot AI] ⚠️ REASONING-END received for unknown or empty reasoning block:',
            {
              reasoningId: endReasoningId,
              messageId,
              dataId: data.id,
              hasState: !!finalReasoningState,
              hasContent: !!finalReasoningState?.content,
              availableIds: Array.from(this.reasoningState.keys()),
              allData: JSON.stringify(data),
            },
          );
        }
        return null; // Don't send to SDK

      case StreamEnums.ToolCall:
        // tool-call requires toolCallId and toolName
        const toolCallId = (data.toolCallId as string) || `tool-${Date.now()}`;
        const toolName = (data.toolName as string) || 'unknown';
        if (!toolName || toolName === 'unknown') {
          console.warn('[Chatwoot AI] tool-call event missing or invalid "toolName" field');
        }
        return {
          type: 'tool-input-start',
          toolCallId,
          toolName,
        };

      case StreamEnums.ToolResult:
        // tool-result requires toolCallId and output
        const toolResultCallId = (data.toolCallId as string) || `tool-${Date.now()}`;
        const toolOutput = data.output !== undefined ? data.output : {};
        return {
          type: 'tool-output-available',
          toolCallId: toolResultCallId,
          output: toolOutput,
        };

      // Optional step lifecycle events (no-op for UI, logged for analytics)
      case StreamEnums.StartStep:
        console.log('[Chatwoot AI] 🔷 Step started:', {
          id: (data.id as string) || 'unknown',
          name: (data.name as string) || 'unnamed',
        });
        logger.log('[Chatwoot AI] Step started', {
          id: (data.id as string) || 'unknown',
          name: (data.name as string) || 'unnamed',
        });
        // Show THOUGHTS view when backend announces a reasoning step
        const stepMessage = (data.message as string) || '';
        if (stepMessage.toLowerCase().includes('reasoning')) {
          if (this.onReasoningStart) {
            try {
              this.onReasoningStart();
              console.log('[Chatwoot AI] ✔️ onReasoningStart triggered from start-step');
            } catch (cbErr) {
              console.warn(
                '[Chatwoot AI] ⚠️ Error calling onReasoningStart from start-step:',
                cbErr,
              );
            }
          }
        }
        return null;

      case StreamEnums.FinishStep:
        console.log('[Chatwoot AI] 🔶 Step finished:', {
          id: (data.id as string) || 'unknown',
          name: (data.name as string) || 'unnamed',
          success: data.success,
        });
        logger.log('[Chatwoot AI] Step finished', {
          id: (data.id as string) || 'unknown',
          name: (data.name as string) || 'unnamed',
          success: data.success,
        });
        return null;

      default:
        console.warn('[Chatwoot AI] Unknown standard format event type:', eventType, {
          dataKeys: Object.keys(data),
        });
        logger.log('[Chatwoot AI] Unknown event type', {
          eventType,
          dataKeys: Object.keys(data),
        });
        return null;
    }
  }

  /**
   * Parse SSE stream and convert to UIMessageChunk stream
   * Uses standard streaming protocol format (no backward compatibility)
   */
  private async parseSSEStreamToUIMessageChunk(
    response: { body: ReadableStream<Uint8Array> | null; headers: Headers },
    messageId: string,
  ): Promise<ReadableStream<UIMessageChunk>> {
    // Validate standard format headers (required)
    this.validateStandardFormatHeaders(response.headers);

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let isCancelled = false;
    let isStreamClosed = false; // Track if the stream controller is closed

    const stream = new ReadableStream<UIMessageChunk>({
      start: async controller => {
        // Per-stream lifecycle flags
        let hasTextEnded = false;
        let hasFinished = false;
        // Helper function to safely close the stream (defined before try/catch for scope)
        const safeClose = (): void => {
          if (isStreamClosed) {
            if (__DEV__) {
              console.warn('[Chatwoot AI] Skipping close - stream is already closed');
            }
            return;
          }
          try {
            controller.close();
            isStreamClosed = true;
          } catch (closeError) {
            // Stream might already be closed or in an invalid state
            isStreamClosed = true;
            console.warn(
              '[Chatwoot AI] Failed to close stream (may already be closed):',
              closeError,
            );
          }
        };

        try {
          console.log('[Chatwoot AI] Starting SSE stream parsing for message:', messageId);
          logger.log('[Chatwoot AI] Starting SSE stream parsing', { messageId });

          // Track event statistics for debugging
          const eventStats: Record<string, number> = {};

          // Helper function to safely enqueue chunks
          const safeEnqueue = (chunk: UIMessageChunk): boolean => {
            if (isStreamClosed || isCancelled) {
              if (__DEV__) {
                console.warn('[Chatwoot AI] Skipping enqueue - stream is closed or cancelled:', {
                  isStreamClosed,
                  isCancelled,
                  chunkType: chunk.type,
                });
              }
              return false;
            }
            try {
              controller.enqueue(chunk);
              return true;
            } catch (enqueueError) {
              // Stream might be closed or in an invalid state
              isStreamClosed = true;
              console.warn(
                '[Chatwoot AI] Failed to enqueue chunk (stream may be closed):',
                enqueueError,
                'Chunk type:',
                chunk.type,
              );
              return false;
            }
          };

          // Note: Backend sends text-start/text-end lifecycle events
          // We don't need to send them manually anymore

          while (!isCancelled && !isStreamClosed) {
            const { done, value } = await reader.read();

            if (done) {
              console.log('[Chatwoot AI] SSE stream ended (done=true)', {
                eventStats,
                totalEvents: Object.values(eventStats).reduce((a, b) => a + b, 0),
              });
              logger.log('[Chatwoot AI] SSE stream ended', {
                messageId,
                eventStats,
                totalEvents: Object.values(eventStats).reduce((a, b) => a + b, 0),
              });
              safeClose();
              break;
            }

            if (isCancelled || isStreamClosed) {
              console.log('[Chatwoot AI] SSE stream cancelled or closed');
              if (!isCancelled) {
                reader.cancel();
              }
              safeClose();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Log ALL raw chunks for debugging reasoning events
            console.log(
              '[Chatwoot AI] 📦 Raw SSE chunk received:',
              JSON.stringify(chunk).substring(0, 200),
            );
            // Also log if it contains "reasoning" to make it easier to spot
            if (chunk.includes('reasoning')) {
              console.log('[Chatwoot AI] 🔍 REASONING chunk detected:', JSON.stringify(chunk));
            }

            // Split by SSE event separator (double newline)
            const events = buffer.split(/\r?\n\r?\n/);
            buffer = events.pop() || '';

            for (const eventText of events) {
              if (!eventText.trim() || isCancelled || isStreamClosed) continue;

              console.log(
                '[Chatwoot AI] Parsing standard format event:',
                eventText.substring(0, 200),
              );

              try {
                const parsed = this.parseStandardFormatEvent(eventText);
                if (parsed) {
                  const { type, data } = parsed;

                  // Track event statistics
                  eventStats[type] = (eventStats[type] || 0) + 1;

                  console.log(
                    '[Chatwoot AI] Parsed standard format event:',
                    type,
                    JSON.stringify(data).substring(0, 200),
                  );
                  logger.log('[Chatwoot AI] Parsed standard format event', {
                    type,
                    dataPreview: JSON.stringify(data).substring(0, 200),
                    hasData: !!data,
                    eventCount: eventStats[type],
                  });

                  // Convert standard format event to Vercel AI SDK format
                  const chunk = this.convertStandardFormatEventToUIMessageChunk(
                    type,
                    data,
                    messageId,
                  );
                  // Lifecycle de-dup guards
                  if (chunk?.type === 'text-end') {
                    if (hasTextEnded) {
                      if (__DEV__) {
                        console.warn('[Chatwoot AI] Dropping duplicate text-end');
                      }
                      continue;
                    }
                    hasTextEnded = true;
                  } else if (chunk?.type === 'finish') {
                    if (hasFinished) {
                      if (__DEV__) {
                        console.warn('[Chatwoot AI] Dropping duplicate finish');
                      }
                      continue;
                    }
                    hasFinished = true;
                  }

                  // Log event conversion for debugging
                  if (__DEV__ && chunk) {
                    console.log('[Chatwoot AI] Event converted:', {
                      from: type,
                      to: chunk.type,
                      hasId: 'id' in chunk,
                      hasDelta: 'delta' in chunk,
                    });
                  }

                  // Only enqueue valid, non-null chunks
                  if (chunk && !isCancelled && !isStreamClosed) {
                    // Validate chunk structure before enqueueing
                    const isValidChunk =
                      chunk &&
                      typeof chunk === 'object' &&
                      'type' in chunk &&
                      chunk.type &&
                      typeof chunk.type === 'string';

                    if (isValidChunk) {
                      // Additional validation for text-delta chunks
                      if (chunk.type === 'text-delta') {
                        const textDeltaChunk = chunk as {
                          type: 'text-delta';
                          delta: string;
                          id: string;
                        };
                        if (
                          typeof textDeltaChunk.delta !== 'string' ||
                          typeof textDeltaChunk.id !== 'string' ||
                          textDeltaChunk.id.length === 0
                        ) {
                          console.warn(
                            '[Chatwoot AI] Invalid text-delta chunk structure, skipping:',
                            {
                              hasDelta: 'delta' in textDeltaChunk,
                              deltaType: typeof textDeltaChunk.delta,
                              hasId: 'id' in textDeltaChunk,
                              idType: typeof textDeltaChunk.id,
                              idLength: textDeltaChunk.id?.length,
                            },
                          );
                          continue;
                        }
                      }

                      // Log chunk enqueueing (detailed in dev, simple in prod)
                      if (__DEV__) {
                        console.log('[Chatwoot AI] Enqueueing chunk:', {
                          type: chunk.type,
                          hasId: 'id' in chunk,
                          hasDelta: 'delta' in chunk,
                          chunkPreview: JSON.stringify(chunk).substring(0, 100),
                        });
                      } else {
                        console.log('[Chatwoot AI] Enqueueing chunk:', chunk.type);
                      }

                      // Use safeEnqueue helper to prevent errors
                      const enqueued = safeEnqueue(chunk);
                      if (enqueued && __DEV__) {
                        logger.log('[Chatwoot AI] Chunk enqueued successfully', {
                          type: chunk.type,
                          messageId,
                        });
                      }
                    } else {
                      console.warn('[Chatwoot AI] Skipping invalid chunk:', {
                        chunk,
                        eventType: type,
                        hasType: 'type' in (chunk || {}),
                      });
                    }
                  } else if (
                    parsed.type === 'reasoning-start' ||
                    parsed.type === 'reasoning-delta' ||
                    parsed.type === 'reasoning-end'
                  ) {
                    // Reasoning events are handled separately
                    // They return null and are not sent to SDK
                    // The converter already handled accumulation and callback
                    if (__DEV__) {
                      console.log(
                        '[Chatwoot AI] Reasoning event processed (not sent to SDK):',
                        parsed.type,
                      );
                    }
                  }
                } else {
                  console.warn(
                    '[Chatwoot AI] Failed to parse standard format event (returned null):',
                    eventText.substring(0, 200),
                  );
                }
              } catch (parseError) {
                console.error(
                  '[Chatwoot AI] Failed to parse standard format event:',
                  parseError,
                  'Event text:',
                  eventText.substring(0, 200),
                );
                // Continue processing other events
              }
            }
          }
        } catch (error) {
          console.error('[Chatwoot AI] Error in SSE stream parsing:', error);
          if (error instanceof Error) {
            console.error('[Chatwoot AI] Error stack:', error.stack);
          }
          if (!isCancelled && !isStreamClosed) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('[Chatwoot AI] Sending error chunk:', errorMessage);
            try {
              controller.enqueue({
                type: 'error',
                errorText: errorMessage,
              });
            } catch (enqueueError) {
              console.warn(
                '[Chatwoot AI] Failed to enqueue error chunk (stream may be closed):',
                enqueueError,
              );
              isStreamClosed = true;
            }
            safeClose();
          }
        } finally {
          // Ensure reader is released
          try {
            reader.releaseLock();
            console.log('[Chatwoot AI] Reader released');
          } catch (releaseError) {
            console.warn('[Chatwoot AI] Error releasing reader:', releaseError);
            // Reader may already be released
          }
        }
      },
      cancel: () => {
        // Avoid cancelling/closing if already closed by finish/done path
        if (isStreamClosed) {
          if (__DEV__) {
            console.warn('[Chatwoot AI] Cancel called after close - ignoring');
          }
          return;
        }
        console.log('[Chatwoot AI] Stream cancelled');
        isCancelled = true;
        isStreamClosed = true;
        reader.cancel().catch(cancelError => {
          console.warn('[Chatwoot AI] Error cancelling reader:', cancelError);
        });
      },
    });

    return stream;
  }

  /**
   * Implement ChatTransport.sendMessages
   */
  async sendMessages(options: {
    trigger: 'submit-message' | 'regenerate-message';
    chatId: string;
    messageId: string | undefined;
    messages: UI_MESSAGE[];
    abortSignal: AbortSignal | undefined;
    headers?: Record<string, string> | Headers;
    body?: object;
    metadata?: unknown;
  }): Promise<ReadableStream<UIMessageChunk>> {
    console.log(
      '[ChatwootAITransportAdapter] sendMessages called with agentBotId:',
      this.agentBotId,
    );
    console.log('[ChatwootAITransportAdapter] Transport instance ID:', this.instanceId);
    const baseURL = this.getBaseURL();

    // Validate required values
    if (!baseURL) {
      throw new Error(
        'Chatwoot API error: Base URL is not configured. Please check your installation URL in settings.',
      );
    }

    if (!this.accountId) {
      throw new Error(
        'Chatwoot API error: Account ID is missing. Please ensure you are logged in.',
      );
    }

    // Convert to Chatwoot format first
    const chatwootMessages = this.convertMessagesToChatwoot(options.messages);

    // OPTIMIZATION: Backend automatically fetches previous messages when chat_session_id is provided.
    // See: docs/ignore/ai_backend_message_handling_optimization.md for details.
    // We only send the new message to reduce payload size by ~98% (1 message vs 94 messages).
    // The backend's GetChatContextForAdminUseCase fetches all previous messages from the session
    // and combines them with the new message for full conversation context.
    let messagesToSend = chatwootMessages;
    if (this.chatSessionId && chatwootMessages.length > 1) {
      // If we have a session ID and multiple messages, try sending only the new one
      // The backend should have access to previous messages via the session
      const lastMessage = chatwootMessages[chatwootMessages.length - 1];
      console.warn(
        '[Chatwoot AI] ⚡ OPTIMIZATION: Sending only the NEW message (backend should fetch previous messages from session)',
        {
          sessionId: this.chatSessionId,
          totalMessagesInHistory: chatwootMessages.length,
          sendingOnlyLastMessage: true,
          lastMessageRole: lastMessage.role,
          lastMessagePreview: lastMessage.content.substring(0, 100),
        },
      );
      logger.log(
        '[Chatwoot AI] ⚡ OPTIMIZATION: Sending only the NEW message (backend should fetch previous messages from session)',
        {
          sessionId: this.chatSessionId,
          totalMessagesInHistory: chatwootMessages.length,
          sendingOnlyLastMessage: true,
        },
      );
      messagesToSend = [lastMessage];
    }

    // ============================================================================
    // PROMINENT LOG: Which messages are being sent to backend
    // This log appears BEFORE streaming starts, so it won't get lost in stream logs
    // ============================================================================
    const messagesSummary = {
      totalMessagesInHistory: options.messages.length,
      messagesBeingSent: messagesToSend.length,
      chatwootMessagesCount: chatwootMessages.length,
      hasSessionId: !!this.chatSessionId,
      optimizationApplied: messagesToSend.length < chatwootMessages.length,
      messageRoles: messagesToSend.map(msg => msg.role),
      messagePreviews: messagesToSend.map((msg, idx) => ({
        index: idx + 1,
        role: msg.role,
        contentLength: msg.content.length,
        contentPreview: msg.content.substring(0, 150) + (msg.content.length > 150 ? '...' : ''),
      })),
    };

    // Use console.warn to make it stand out (yellow in most consoles)
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.warn('[Chatwoot AI] 📤 SENDING MESSAGES TO BACKEND (BEFORE STREAMING STARTS)');
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.warn(JSON.stringify(messagesSummary, null, 2));
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Also log to logger utility for searchability
    logger.log(
      '[Chatwoot AI] 📤 SENDING MESSAGES TO BACKEND (BEFORE STREAMING STARTS)',
      messagesSummary,
    );

    // Use AI backend URL if provided, otherwise use Rails proxy endpoint
    let url: string;
    let requestBody:
      | {
          agentInput: {
            messages: string[];
            context?: Record<string, unknown>;
          };
        }
      | {
          messages: { role: string; content: string }[];
          agent_bot_id?: number;
          chat_session_id?: string;
        };

    if (this.aiBackendUrl) {
      // Call Python backend directly
      // Python backend expects query parameters and agentInput in body
      if (!this.userId) {
        throw new Error(
          'Chatwoot API error: User ID is required when calling Python backend directly. Please ensure you are logged in.',
        );
      }

      const queryParams = new URLSearchParams({
        store_id: String(this.accountId),
        agent_system_id: String(this.agentBotId || ''),
        user_id: String(this.userId),
        id_type: 'external',
      });
      url = `${this.aiBackendUrl}/api/messaging/agent-systems/message/stream?${queryParams.toString()}`;

      // Python backend expects agentInput format with messages as string array
      const messageStrings = chatwootMessages.map(msg => msg.content);
      requestBody = {
        agentInput: {
          messages: messageStrings,
          // Optional context can be added here if needed
        },
      };
    } else {
      // Use Rails proxy endpoint
      // Validate agentBotId is required for Rails proxy
      if (!this.agentBotId) {
        throw new Error(
          'Chatwoot API error: No agent bot selected. Please ensure an agent bot is selected before sending messages.',
        );
      }

      url = `${baseURL}/api/v1/accounts/${this.accountId}/ai_chat/stream`;
      requestBody = {
        messages: messagesToSend, // Use optimized messages (may be just the new one)
        agent_bot_id: this.agentBotId,
        chat_session_id: this.chatSessionId,
      };
    }

    // Log request details (consolidated for less noise)
    console.log('[Chatwoot AI] Request details:', {
      url,
      accountId: this.accountId,
      agentBotId: this.agentBotId,
      chatSessionId: this.chatSessionId,
      baseURL,
      aiBackendUrl: this.aiBackendUrl,
    });

    // Generate message ID for the response
    const messageId = options.messageId || `msg-${Date.now()}`;

    // Merge with any additional body options
    const finalRequestBody = {
      ...requestBody,
      ...options.body,
    };

    console.log('[Chatwoot AI] Request body:', JSON.stringify(finalRequestBody, null, 2));

    // Make request to Chatwoot backend
    const response = await expoFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...this.getAuthHeaders(),
        ...(options.headers instanceof Headers
          ? Object.fromEntries(options.headers.entries())
          : options.headers),
      },
      body: JSON.stringify(finalRequestBody),
      signal: options.abortSignal,
    });

    console.log('[Chatwoot AI] Response status:', response.status, response.statusText);
    console.log('[Chatwoot AI] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = response.statusText || 'Unknown error';
      let errorDetails = '';
      try {
        const errorData = await response.text();
        console.log('[Chatwoot AI] Error response body:', errorData);
        const parsed = JSON.parse(errorData);
        errorMessage = (parsed.error as string) || (parsed.message as string) || errorMessage;
        errorDetails = parsed.details || parsed.error_details || '';
      } catch {
        // Use statusText if parsing fails
      }

      const fullErrorMessage = errorDetails
        ? `Chatwoot API error: ${errorMessage} (${errorDetails})`
        : `Chatwoot API error: ${errorMessage}`;

      console.error('[Chatwoot AI] Request failed:', {
        url,
        status: response.status,
        statusText: response.statusText,
        errorMessage: fullErrorMessage,
      });

      throw new Error(fullErrorMessage);
    }

    // Extract session ID from headers
    const sessionId = response.headers.get('X-Chat-Session-Id');
    if (sessionId) {
      this.chatSessionId = sessionId;
    }

    // Convert Chatwoot SSE stream to UIMessageChunk stream
    // expo/fetch returns a FetchResponse which has body and headers
    // Cast body to standard ReadableStream type
    return this.parseSSEStreamToUIMessageChunk(
      {
        body: response.body as ReadableStream<Uint8Array> | null,
        headers: response.headers,
      },
      messageId,
    );
  }

  /**
   * Implement ChatTransport.reconnectToStream (optional)
   */
  async reconnectToStream(options: {
    chatId: string;
    headers?: Record<string, string> | Headers;
    body?: object;
    metadata?: unknown;
  }): Promise<ReadableStream<UIMessageChunk> | null> {
    // Chatwoot doesn't support reconnection, return null
    return null;
  }
}
