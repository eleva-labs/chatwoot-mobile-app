import type { UIMessage, UIMessagePart, UIDataTypes, UITools } from 'ai';

/**
 * Type for AI message bubble props
 */
export interface AIMessageBubbleProps {
  message: UIMessage;
  isStreaming?: boolean;
}

/**
 * Type for AI chat interface props
 */
export interface AIChatInterfaceProps {
  agentBotId?: number;
  onClose: () => void;
}

/**
 * Type for AI input field props
 */
export interface AIInputFieldProps {
  onSend: (text: string) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

/**
 * Type for AI tool indicator props
 */
export interface AIToolIndicatorProps {
  toolCalls: UIMessagePart<UIDataTypes, UITools>[];
}

/**
 * Type for floating AI assistant props
 */
export interface FloatingAIAssistantProps {
  agentBotId?: number;
}
