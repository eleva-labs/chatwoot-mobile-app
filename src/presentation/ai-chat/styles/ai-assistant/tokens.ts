/**
 * AI Assistant Style Tokens
 *
 * Co-located with ai-assistant/ components.
 * Uses Radix color scales from unified.ts via Tailwind classes.
 *
 * Vue Mapping:
 * - iris (violet in Vue): Reasoning/thinking
 * - slate: Default/neutral, tool usage
 * - teal: Success states
 * - ruby: Error states
 * - amber: Warning states
 *
 * Radix 12-Step Scale Reference:
 * - 3: Component backgrounds (bg-iris-3)
 * - 6: Borders (border-slate-6)
 * - 9: Icons, interactive elements (text-iris-9)
 * - 10: Secondary labels (text-slate-10)
 * - 11: Active labels (text-iris-11)
 * - 12: Primary text (text-slate-12)
 */

import {
  type BaseMessageTokens,
  type BaseTextTokens,
  type BaseCollapsibleTokens,
} from '@infrastructure/theme/colors/tokens';

// =============================================================================
// Types
// =============================================================================

/** Accent colors for AI components (matches Vue's n-{color} system) */
export type AIAccentColor = 'iris' | 'slate' | 'teal' | 'ruby' | 'amber';

/** Extended collapsible tokens for AI components */
export interface AICollapsibleTokens extends BaseCollapsibleTokens {
  /** Accent border (left border highlight) */
  borderAccent: string;
  /** Icon color when active/streaming */
  iconActive: string;
  /** Label color when active/streaming */
  labelActive: string;
  /** Subtitle text color */
  subtitle: string;
  /** Cursor/caret color */
  cursor: string;
}

/** Message bubble tokens by role */
export interface AIMessageTokens {
  user: BaseMessageTokens;
  assistant: BaseMessageTokens;
}

/** Text tokens for AI content */
export interface AITextTokens extends BaseTextTokens {
  /** Code block background */
  codeBackground: string;
  /** Code block text */
  codeText: string;
  /** Streaming cursor for assistant */
  cursor: string;
  /** Streaming cursor for user */
  cursorUser: string;
}

/** Tool display tokens */
export interface AIToolTokens {
  /** Section label (Input/Output) */
  sectionLabel: string;
  /** JSON content background */
  jsonBackground: string;
  /** JSON content text */
  jsonText: string;
  /** Error message background */
  errorBackground: string;
  /** Error message text */
  errorText: string;
}

/** Header/navigation tokens */
export interface AIHeaderTokens {
  /** Header background */
  background: string;
  /** Header border */
  border: string;
  /** Title text color */
  title: string;
  /** Subtitle/secondary text color */
  subtitle: string;
  /** Link/action text color */
  link: string;
  /** Active link text color */
  linkActive: string;
}

/** Input field tokens */
export interface AIInputTokens {
  /** Container background */
  containerBackground: string;
  /** Container border */
  containerBorder: string;
  /** Input field background */
  inputBackground: string;
  /** Input text color */
  inputText: string;
  /** Placeholder text color */
  inputPlaceholder: string;
  /** Send button background */
  sendButton: string;
  /** Send button icon color */
  sendButtonIcon: string;
  /** Cancel action text color */
  cancelText: string;
}

/** FAB (Floating Action Button) tokens */
export interface AIFabTokens {
  /** FAB background */
  background: string;
  /** FAB icon color */
  icon: string;
  /** FAB shadow */
  shadow: string;
}

/** Session list tokens */
export interface AISessionTokens {
  /** List background */
  background: string;
  /** Item border */
  border: string;
  /** Session title text */
  title: string;
  /** Session subtitle/date text */
  subtitle: string;
  /** Active session background */
  activeBackground: string;
  /** Active session indicator */
  activeIndicator: string;
  /** Active session text */
  activeText: string;
}

// =============================================================================
// Token Definitions
// =============================================================================

/**
 * Message bubble tokens by role
 * Matches Vue's AiMessageContent.vue styling
 */
export const aiMessageTokens: AIMessageTokens = {
  user: {
    background: 'bg-iris-3',
    text: 'text-iris-12',
    border: 'border-iris-6',
  },
  assistant: {
    background: 'bg-slate-3',
    text: 'text-slate-12',
    border: 'border-slate-6',
  },
};

/**
 * Text content tokens
 * Used for message text, markdown, and cursors
 */
export const aiTextTokens: AITextTokens = {
  primary: 'text-slate-12',
  secondary: 'text-slate-11',
  muted: 'text-slate-10',
  link: 'text-blue-9',
  codeBackground: 'bg-slate-3',
  codeText: 'text-slate-11',
  cursor: 'bg-slate-11',
  cursorUser: 'bg-iris-12',
};

/**
 * Tool display tokens
 * Used by AIToolPart for tool call/result rendering
 */
export const aiToolTokens: AIToolTokens = {
  sectionLabel: 'text-slate-10',
  jsonBackground: 'bg-slate-3',
  jsonText: 'text-slate-11',
  errorBackground: 'bg-ruby-3',
  errorText: 'text-ruby-11',
};

/**
 * Header/navigation tokens
 * Used by AIChatHeader for header styling
 */
export const aiHeaderTokens: AIHeaderTokens = {
  background: 'bg-slate-1',
  border: 'border-slate-6',
  title: 'text-slate-12',
  subtitle: 'text-slate-11',
  link: 'text-iris-9',
  linkActive: 'text-iris-11',
};

/**
 * Input field tokens
 * Used by AIInputField for input area styling
 */
export const aiInputTokens: AIInputTokens = {
  containerBackground: 'bg-slate-1',
  containerBorder: 'border-slate-6',
  inputBackground: 'bg-slate-3',
  inputText: 'text-slate-12',
  inputPlaceholder: 'text-slate-9',
  sendButton: 'bg-iris-9',
  sendButtonIcon: 'text-white',
  cancelText: 'text-ruby-9',
};

/**
 * FAB tokens
 * Used by FloatingAIAssistant for the floating action button
 */
export const aiFabTokens: AIFabTokens = {
  background: 'bg-brand',
  icon: 'text-white',
  shadow: 'shadow-lg',
};

/**
 * Session list tokens
 * Used by AISessionItem/AISessionList for session styling
 */
export const aiSessionTokens: AISessionTokens = {
  background: 'bg-slate-1',
  border: 'border-slate-6',
  title: 'text-slate-12',
  subtitle: 'text-slate-10',
  activeBackground: 'bg-iris-3',
  activeIndicator: 'bg-iris-9',
  activeText: 'text-iris-12',
};

/**
 * Collapsible tokens by accent color
 * Matches Vue's AiCollapsiblePart.vue colorMap exactly
 *
 * Color semantics:
 * - iris: Reasoning/thinking (primary AI activity)
 * - slate: Default/neutral (tool calls, default state)
 * - teal: Success (completed tools)
 * - ruby: Error (failed operations)
 * - amber: Warning (tool errors, retries)
 */
export const aiCollapsibleTokens: Record<AIAccentColor, AICollapsibleTokens> = {
  iris: {
    // Violet/Primary - used for reasoning
    border: 'border-slate-6',
    borderAccent: 'border-l-iris-9',
    background: 'bg-slate-3/50',
    icon: 'text-slate-10',
    iconActive: 'text-iris-9',
    label: 'text-slate-10',
    labelActive: 'text-iris-11',
    chevron: 'text-slate-10',
    subtitle: 'text-slate-9',
    cursor: 'bg-iris-9',
  },
  slate: {
    // Neutral/Default - used for pending tools
    border: 'border-slate-6',
    borderAccent: 'border-l-slate-9',
    background: 'bg-slate-3/50',
    icon: 'text-slate-10',
    iconActive: 'text-slate-9',
    label: 'text-slate-10',
    labelActive: 'text-slate-11',
    chevron: 'text-slate-10',
    subtitle: 'text-slate-9',
    cursor: 'bg-slate-9',
  },
  teal: {
    // Success - used for completed tools
    border: 'border-teal-6',
    borderAccent: 'border-l-teal-9',
    background: 'bg-slate-3/50',
    icon: 'text-slate-10',
    iconActive: 'text-teal-9',
    label: 'text-slate-10',
    labelActive: 'text-teal-11',
    chevron: 'text-slate-10',
    subtitle: 'text-slate-9',
    cursor: 'bg-teal-9',
  },
  ruby: {
    // Error - used for failed states
    border: 'border-ruby-6',
    borderAccent: 'border-l-ruby-9',
    background: 'bg-slate-3/50',
    icon: 'text-slate-10',
    iconActive: 'text-ruby-9',
    label: 'text-slate-10',
    labelActive: 'text-ruby-11',
    chevron: 'text-slate-10',
    subtitle: 'text-slate-9',
    cursor: 'bg-ruby-9',
  },
  amber: {
    // Warning - used for tool errors/retries
    border: 'border-amber-6',
    borderAccent: 'border-l-amber-9',
    background: 'bg-slate-3/50',
    icon: 'text-slate-10',
    iconActive: 'text-amber-9',
    label: 'text-slate-10',
    labelActive: 'text-amber-11',
    chevron: 'text-slate-10',
    subtitle: 'text-slate-9',
    cursor: 'bg-amber-9',
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get message tokens by role
 * @example
 * const tokens = getMessageTokens('user');
 * // { background: 'bg-iris-3', text: 'text-iris-12', border: 'border-iris-6' }
 */
export const getMessageTokens = (role: 'user' | 'assistant') => aiMessageTokens[role];

/**
 * Get collapsible tokens by accent color
 * @example
 * const tokens = getCollapsibleTokens('iris');
 * // { border: 'border-slate-6', iconActive: 'text-iris-9', ... }
 */
export const getCollapsibleTokens = (accent: AIAccentColor): AICollapsibleTokens =>
  aiCollapsibleTokens[accent];

/**
 * Get cursor token by role
 * @example
 * const cursor = getCursorToken('user'); // 'bg-iris-12'
 * const cursor = getCursorToken('assistant'); // 'bg-slate-9'
 */
export const getCursorToken = (role: 'user' | 'assistant'): string =>
  role === 'user' ? aiTextTokens.cursorUser : aiTextTokens.cursor;

/**
 * Get text color by role (returns the actual color class)
 * @example
 * const textClass = getTextColorByRole('user'); // 'text-iris-12'
 */
export const getTextColorByRole = (role: 'user' | 'assistant'): string =>
  role === 'user' ? aiMessageTokens.user.text : aiMessageTokens.assistant.text;
