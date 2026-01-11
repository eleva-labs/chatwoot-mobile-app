import type { UIMessage } from 'ai';
import type { AIChatMessage } from '@/infrastructure/dto/ai-assistant';

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
 * Messages are typically returned newest first, so we reverse them
 */
export function convertBackendMessagesToUIMessages(messages: AIChatMessage[]): UIMessage[] {
  // Reverse to get chronological order (oldest first)
  return messages.map(convertBackendMessageToUIMessage).reverse();
}
