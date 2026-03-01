/**
 * Sessions Adapter Types [CORE + RN]
 *
 * Framework-agnostic session and message types, plus adapter interfaces.
 * Core interfaces go to @eleva/ai-chat-core. RN-specific extension stays
 * in @eleva/ai-chat-react-native.
 */

// ============================================================================
// Data Types [CORE]
// ============================================================================

/**
 * Chat session (snake_case, matching API and Zod schemas).
 */
export interface ChatSession {
  chat_session_id: string;
  updated_at: string;
  created_at?: string;
  agent_bot_id?: number;
}

/**
 * Chat message DTO.
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  parts?: {
    type: string;
    text?: string;
    toolName?: string;
    toolCallId?: string;
    args?: Record<string, unknown>;
    result?: unknown;
    state?: string;
  }[];
}

// ============================================================================
// Adapter Interfaces
// ============================================================================

/**
 * Core sessions adapter [CORE].
 * Data-fetching only, returns data via Promise.
 * Optional: when not provided, chat operates in single-session mode.
 */
export interface SessionsAdapter {
  fetchSessions(params: { agentBotId: number; limit?: number }): Promise<ChatSession[]>;
  fetchMessages(params: { sessionId: string; limit?: number }): Promise<ChatMessage[]>;
  deleteSession?(sessionId: string): Promise<void>;
}

/**
 * React Native sessions state adapter [RN].
 * Extends core adapter with reactive getters for Redux/state integration.
 * NOT part of @eleva/ai-chat-core.
 *
 * NOTE on reactivity: The imperative getters (getSessions, getActiveSessionId)
 * do NOT trigger React re-renders. The hook still uses useAppSelector for
 * reactive subscriptions. The adapter is used for imperative commands.
 */
export interface SessionsStateAdapter extends SessionsAdapter {
  getSessions(agentBotId: number): ChatSession[];
  getActiveSessionId(): string | null;
  setActiveSessionId(id: string | null): void;
  getIsLoadingSessions(): boolean;
  getIsLoadingMessages(): boolean;
  getMessagesBySession(sessionId: string): ChatMessage[];
}
