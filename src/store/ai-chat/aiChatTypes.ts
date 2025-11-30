import type { AIChatSession, AIChatMessage } from '@/services/AIChatService';

/**
 * API Response types
 */
export interface AIChatSessionsAPIResponse {
  sessions: AIChatSession[];
}

export interface AIChatMessagesAPIResponse {
  messages: AIChatMessage[];
}

/**
 * Redux state types
 */
export interface AIChatState {
  // Sessions organized by agentBotId (for Rails) or storeId (for Python backend)
  sessions: {
    [key: string]: AIChatSession[];
  };
  // Messages organized by sessionId
  messages: {
    [sessionId: string]: AIChatMessage[];
  };
  // Loading states
  isLoadingSessions: boolean;
  isLoadingMessages: boolean;
  // Error states
  sessionsError: string | null;
  messagesError: string | null;
  // Active session ID
  activeSessionId: string | null;
  // Selected agent bot ID (for Rails) or store ID (for Python backend)
  selectedAgentBotId?: number;
  selectedStoreId?: number;
}

/**
 * Payload types for actions
 */
export interface FetchSessionsPayload {
  agentBotId?: number;
  storeId?: number;
  agentSystemId?: number;
  userId?: number;
  limit?: number;
  aiBackendUrl?: string;
  usePythonBackend?: boolean;
}

export interface FetchMessagesPayload {
  sessionId: string;
  limit?: number;
  accountId?: number;
  agentBotId?: number;
  storeId?: number;
  agentSystemId?: number;
  userId?: number;
  aiBackendUrl?: string;
  usePythonBackend?: boolean;
}

export interface SetActiveSessionPayload {
  sessionId: string | null;
}

export interface ClearSessionsPayload {
  agentBotId?: number;
  storeId?: number;
}
