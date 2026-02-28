/**
 * AI Assistant Constants
 *
 * Matching Vue implementation for cross-platform consistency.
 * Reference: docs/ignored/ai_chat_streaming/vue-js/ai-assistant/constants.js
 */

/**
 * Message part types from Vercel AI SDK + Chatwoot backend extensions
 */
export const PART_TYPES = {
  // Text content
  TEXT: 'text',

  // Reasoning/thinking content
  REASONING: 'reasoning',

  // Tool-related (SDK format)
  TOOL_INVOCATION: 'tool-invocation',
  TOOL_CALL: 'tool-call',
  TOOL_RESULT: 'tool-result',

  // Tool-related (Backend format - prefixed)
  TOOL_INPUT_STREAMING: 'tool-input-streaming',
  TOOL_INPUT_AVAILABLE: 'tool-input-available',
  TOOL_OUTPUT_AVAILABLE: 'tool-output-available',
  TOOL_OUTPUT_ERROR: 'tool-output-error',

  // File attachments
  FILE: 'file',

  // Source citations
  SOURCE: 'source',

  // Source citations (web-only, for backward compat)
  SOURCE_URL: 'source-url',
  SOURCE_DOCUMENT: 'source-document',

  // Step indicators
  STEP_START: 'step-start',
} as const;

export type PartType = (typeof PART_TYPES)[keyof typeof PART_TYPES];

/**
 * Tool execution states
 */
export const TOOL_STATES = {
  // Tool is receiving input (streaming)
  INPUT_STREAMING: 'input-streaming',

  // Tool input is complete, ready to execute
  INPUT_AVAILABLE: 'input-available',

  // Tool has produced output
  OUTPUT_AVAILABLE: 'output-available',

  // Tool execution failed
  OUTPUT_ERROR: 'output-error',

  // Web-only states (for backward compat)
  INPUT_START: 'tool-input-start',
  OUTPUT_STREAMING: 'tool-output-streaming',

  // Legacy/fallback states
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type ToolState = (typeof TOOL_STATES)[keyof typeof TOOL_STATES];

/**
 * Chat status values (matches Vercel SDK useChat status)
 */
export const CHAT_STATUS = {
  READY: 'ready',
  SUBMITTED: 'submitted',
  STREAMING: 'streaming',
  ERROR: 'error',
} as const;

export type ChatStatus = (typeof CHAT_STATUS)[keyof typeof CHAT_STATUS];

/**
 * Message roles
 */
export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
  DATA: 'data',
  TOOL: 'tool',
} as const;

export type MessageRole = (typeof MESSAGE_ROLES)[keyof typeof MESSAGE_ROLES];

// Backward-compatible alias (web uses MESSAGE_ROLE singular)
export const MESSAGE_ROLE = MESSAGE_ROLES;

export const VOICE_INPUT_STATUS = {
  IDLE: 'idle',
  RECORDING: 'recording',
  TRANSCRIBING: 'transcribing',
  ERROR: 'error',
  DISABLED: 'disabled',
} as const;

export type VoiceInputStatus = (typeof VOICE_INPUT_STATUS)[keyof typeof VOICE_INPUT_STATUS];
