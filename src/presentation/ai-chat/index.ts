/**
 * Presentation Layer - Barrel Export
 *
 * This is the main entry point for the presentation layer.
 * Exports all containers, components, parts, hooks, and styles.
 */

// ============================================================================
// Containers (Main entry points)
// ============================================================================
export { AIChatInterface, FloatingAIAssistant } from './containers/ai-assistant';

export type { AIChatInterfaceProps, FloatingAIAssistantProps } from './containers/ai-assistant';

// ============================================================================
// Components (Reusable UI components)
// ============================================================================
export {
  AIChatHeader,
  AIChatMessagesList,
  AIChatSessionPanel,
  AIInputField,
  AIMessageBubble,
  AISessionItem,
  AISessionList,
  AIThoughtsView,
  AIToolIndicator,
} from './components/ai-assistant';

// ============================================================================
// Parts (Message part renderers)
// ============================================================================
export {
  AIPartRenderer,
  AITextPart,
  AIReasoningPart,
  AIToolPart,
  AICollapsible,
} from './parts/ai-assistant';

// ============================================================================
// Hooks
// ============================================================================
export { useAIChat, useAIChatBot, useAIChatSessions, useAIChatScroll } from './hooks/ai-assistant';

export type { UseAIChatOptions, UseAIChatReturn } from './hooks/ai-assistant';

// ============================================================================
// Styles
// ============================================================================
export {
  useAIStyles,
  aiMessageTokens,
  aiTextTokens,
  aiToolTokens,
  aiCollapsibleTokens,
  aiHeaderTokens,
  aiInputTokens,
  aiSessionTokens,
  getMessageTokens,
  getCollapsibleTokens,
  getCursorToken,
  getTextColorByRole,
} from './styles/ai-assistant';

export type {
  AIAccentColor,
  AICollapsibleTokens,
  AIMessageTokens,
  AITextTokens,
  AIToolTokens,
  AIHeaderTokens,
  AIInputTokens,
  AISessionTokens,
  AIStylesResult,
} from './styles/ai-assistant';
