/**
 * Chatwoot Chat Configuration [APP]
 *
 * Wraps existing AIChatService into the ChatConfig interface.
 * This file stays in the Chatwoot app; it is NOT extracted into the package.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetch as expoFetch } from 'expo/fetch';

import type { ChatConfig, TransportConfig } from '@/types/ai-chat/chatConfig';
import { AIChatService } from '@/store/ai-chat/aiChatService';
import type { UIMessage } from 'ai';
import { isTextPart, type MessagePart, type TextPart } from '@/types/ai-chat/parts';

// ============================================================================
// Helper Functions (extracted from useAIChat.ts)
// ============================================================================

/**
 * Parse error response from the server.
 * Extracts Chatwoot-specific error fields: error_details, error, message
 */
async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      return json.error_details || json.error || json.message || json.detail || text;
    } catch {
      return text || `HTTP ${response.status}`;
    }
  } catch {
    return `HTTP ${response.status}: ${response.statusText}`;
  }
}

/**
 * Extract text content from a UIMessage.
 * Handles both parts-based and content-based message formats.
 */
function extractTextContent(message: UIMessage): string {
  if (message.parts && Array.isArray(message.parts)) {
    return message.parts
      .filter((part): part is TextPart => isTextPart(part as MessagePart))
      .map(part => part.text || '')
      .join('');
  }

  if ('content' in message && typeof message.content === 'string') {
    return message.content;
  }

  return '';
}

// ============================================================================
// Transport Configuration
// ============================================================================

const chatwootTransport: TransportConfig = {
  streamEndpoint: () => AIChatService.getStreamEndpoint(),
  getHeaders: () => ({
    ...AIChatService.getAuthHeaders(),
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  }),
  prepareRequest: ({ lastMessage, headers, metadata }) => ({
    body: {
      messages: [{ role: lastMessage.role, content: extractTextContent(lastMessage) }],
      agent_bot_id: metadata.agentBotId,
      ...(metadata.sessionId ? { chat_session_id: metadata.sessionId } : {}),
    },
    headers,
  }),
  parseError: parseErrorResponse,
  fetch: expoFetch as unknown as typeof globalThis.fetch,
  extractSessionId: (response: Response) => response.headers.get('X-Chat-Session-Id'),
};

// ============================================================================
// Exported Config
// ============================================================================

/**
 * Module-scope constant. MUST NOT be recreated per render.
 * This preserves INV-4 (transport useMemo non-reactive dependencies).
 */
export const chatwootChatConfig: ChatConfig = {
  transport: chatwootTransport,
  behavior: { streamThrottle: 150 },
  persistence: {
    get: key => AsyncStorage.getItem(key),
    set: (key, value) => AsyncStorage.setItem(key, value),
    remove: key => AsyncStorage.removeItem(key),
  },
};
