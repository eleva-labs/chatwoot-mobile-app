import type { UIMessage } from 'ai';
// Use domain types instead of SDK types for better type safety
import type { ToolPart } from '@/domain/types/ai-assistant/parts';

/**
 * Type for AI message bubble props
 */
export interface AIMessageBubbleProps {
  message: UIMessage;
  isStreaming?: boolean;
  avatarName?: string;
  avatarSrc?: string;
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
 * Uses domain ToolPart type for better type safety
 */
export interface AIToolIndicatorProps {
  toolCalls: ToolPart[];
}

/**
 * Type for floating AI assistant props
 */
export interface FloatingAIAssistantProps {
  agentBotId?: number;
}
