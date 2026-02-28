import type React from 'react';
import type { UIMessage } from 'ai';
// Use domain types instead of SDK types for better type safety
import type { ToolPart } from '@/types/ai-chat/parts';

/**
 * Type for AI message bubble props.
 * Optional injectable props allow consumers to replace default behaviors.
 */
export interface AIMessageBubbleProps {
  message: UIMessage;
  isStreaming?: boolean;
  avatarName?: string;
  avatarSrc?: string;
  /** Custom avatar renderer. Default: built-in Avatar component */
  renderAvatar?: (props: { name?: string; src?: string; size: number }) => React.ReactNode;
  /** Custom copy handler. Default: Clipboard.setString */
  onCopy?: (text: string) => void;
  /** Custom haptic feedback handler. Default: useHaptic('success') */
  onHaptic?: () => void;
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
 * Type for floating AI assistant props.
 * Layout props replace hardcoded Chatwoot-specific constants.
 */
export interface FloatingAIAssistantProps {
  agentBotId?: number;
  /** Bottom inset in pixels (default: 80, above tab bar) */
  bottomInset?: number;
  /** Custom FAB icon (default: built-in AI icon) */
  fabIcon?: React.ReactNode;
  /** Enable scale animation on press (default: true) */
  enableScaleAnimation?: boolean;
  /** Enable haptic feedback on press (default: true) */
  enableHaptic?: boolean;
}
