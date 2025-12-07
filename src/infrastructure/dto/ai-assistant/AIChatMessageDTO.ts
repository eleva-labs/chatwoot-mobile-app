/**
 * AI Chat Message DTO
 *
 * Backend representation of a chat message.
 * Uses snake_case to match backend API.
 */

export interface AIChatMessageDTO {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  chat_session_id?: string;
  parts?: AIChatMessagePartDTO[];
}

/**
 * AI Chat Message Part DTO
 *
 * Backend representation of a message part (text, tool call, etc.)
 */
export interface AIChatMessagePartDTO {
  type: string;
  text?: string;
  toolName?: string;
  toolCallId?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  state?: string;
}

/**
 * Response structure for fetching messages
 */
export interface AIChatMessagesResponseDTO {
  messages: AIChatMessageDTO[];
}
