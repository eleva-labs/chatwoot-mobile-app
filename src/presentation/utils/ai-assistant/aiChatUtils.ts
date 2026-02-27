import type { UIMessage } from 'ai';
import type { AIChatMessage } from '@/store/ai-chat/aiChatTypes';

/**
 * Convert backend AIChatMessage to Vercel AI SDK UIMessage format
 */
export function convertBackendMessageToUIMessage(message: AIChatMessage): UIMessage {
  return {
    id: message.id,
    role: message.role === 'assistant' ? 'assistant' : message.role === 'user' ? 'user' : 'system',
    parts: [
      {
        type: 'text' as const,
        text: message.content,
      },
    ],
    // Note: createdAt is not a standard UIMessage property in SDK v5
  };
}

/**
 * Convert array of backend messages to UIMessage array
 * Messages from Redux are already in chronological order (oldest first)
 * because aiChatSlice.ts reverses the API response on store.
 */
export function convertBackendMessagesToUIMessages(messages: AIChatMessage[]): UIMessage[] {
  return messages.map(convertBackendMessageToUIMessage);
}
