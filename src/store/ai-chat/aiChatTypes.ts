/**
 * AI Chat Redux Types
 *
 * Redux state shape, payload types, and re-exported schema types.
 * Consumers import from here for both Redux and DTO types.
 */

import type { AIChatSession, AIChatMessage } from './aiChatSchemas';

// Re-export schema types so consumers only need one import
export type { AIChatBot, AIChatSession, AIChatMessage, AIChatMessagePart } from './aiChatSchemas';

// Re-export response types for service consumers
export type {
  AIChatBotsResponse,
  AIChatSessionsResponse,
  AIChatMessagesResponse,
} from './aiChatSchemas';

// === Redux State Shape ===

export interface AIChatState {
  /** Sessions organized by agentBotId key (e.g., "agentBot_123") */
  sessions: Record<string, AIChatSession[]>;
  /** Messages organized by sessionId */
  messages: Record<string, AIChatMessage[]>;
  /** Loading state for sessions fetch */
  isLoadingSessions: boolean;
  /** Loading state for messages fetch */
  isLoadingMessages: boolean;
  /** Error message for sessions operations */
  sessionsError: string | null;
  /** Error message for messages operations */
  messagesError: string | null;
  /** Currently active session ID */
  activeSessionId: string | null;
}

// === Action Payload Types (Rails-only — no Python backend fields) ===

export interface FetchSessionsPayload {
  agentBotId: number;
  limit?: number;
  offset?: number;
}

export interface FetchMessagesPayload {
  sessionId: string;
  limit?: number;
  offset?: number;
}

export interface SetActiveSessionPayload {
  sessionId: string | null;
}

export interface ClearSessionsPayload {
  agentBotId?: number;
}

export interface AIChatErrorPayload {
  message: string;
  errors?: string[];
}
