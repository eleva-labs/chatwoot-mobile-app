/**
 * AI Assistant Part Components
 *
 * This module exports all part-level components for rendering AI message parts.
 * These components follow the Vue AI Elements patterns for consistent rendering
 * across platforms.
 *
 * Component Hierarchy:
 * - AIPartRenderer: Routes to appropriate part component
 *   - AITextPart: Renders text with markdown
 *   - AIReasoningPart: Renders reasoning/thinking content
 *   - AIToolPart: Renders tool calls and results
 *   - AICollapsible: Reusable collapse container
 */

// ============================================================================
// Components
// ============================================================================

export {
  AICollapsible,
  type AICollapsibleProps,
  type CollapsibleAccentColor,
} from './AICollapsible';
export { AITextPart, type AITextPartProps, type TextPart } from './AITextPart';
export { AIReasoningPart, type AIReasoningPartProps, type ReasoningPart } from './AIReasoningPart';
export {
  AIToolPart,
  type AIToolPartProps,
  type ToolPart,
  type ToolCallPart,
  type ToolResultPart,
  type ToolState,
} from './AIToolPart';
export {
  AIPartRenderer,
  type AIPartRendererProps,
  type MessagePart,
  type UnknownPart,
  // Helper functions
  filterPartsByType,
  getTextParts,
  getReasoningParts,
  getToolParts,
  hasReasoningParts,
  hasToolParts,
} from './AIPartRenderer';
