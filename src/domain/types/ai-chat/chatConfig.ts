/**
 * AI Chat Configuration Types [CORE]
 *
 * Split ChatConfig into sub-configs per extraction review I1.
 * These interfaces become candidates for @eleva/ai-chat-core/types/chat.ts.
 */

import type { UIMessage } from 'ai';

/**
 * Transport configuration for SSE streaming connection.
 */
export interface TransportConfig {
  /** SSE streaming endpoint URL */
  streamEndpoint: string | (() => string);
  /** Returns auth headers for the streaming transport */
  getHeaders: () => Record<string, string> | Promise<Record<string, string>>;
  /** Transform request body before sending */
  prepareRequest?: (options: {
    messages: UIMessage[];
    lastMessage: UIMessage;
    headers: Record<string, string>;
    metadata: Record<string, unknown>;
  }) => { body: Record<string, unknown>; headers: Record<string, string> };
  /** Parse error responses from backend */
  parseError?: (response: Response) => Promise<string>;
  /** Custom fetch function (RN uses expo/fetch) */
  fetch?: typeof globalThis.fetch;
  /** Extract session ID from streaming response. Default: reads X-Chat-Session-Id header */
  extractSessionId?: (response: Response) => string | null;
}

/**
 * Chat behavior configuration.
 */
export interface ChatBehaviorConfig {
  /** Throttle for streaming updates (ms). Default: 150 */
  streamThrottle?: number;
  /** Auto-continue when tool results are added */
  sendAutomaticallyWhen?: (opts: { messages: UIMessage[] }) => boolean | PromiseLike<boolean>;
}

/**
 * Chat UI configuration for display information.
 */
export interface ChatUIConfig {
  /** User info for avatar display */
  user?: { name?: string; avatarUrl?: string };
  /** Bot info */
  bot?: { id: number; name?: string; avatarUrl?: string };
}

/**
 * Persistence adapter for session IDs.
 */
export interface PersistenceAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

/**
 * I18n provider interface [CORE].
 * Minimal translation function + locale metadata.
 */
export interface I18nProvider {
  t(key: string, params?: Record<string, unknown>): string;
  locale?: string;
  dir?: 'ltr' | 'rtl';
}

/**
 * Combined chat configuration.
 * Composed from sub-configs rather than being a flat god object.
 *
 * IMPORTANT: The config object must be stable (module-scope constant or useMemo
 * with empty deps) to preserve INV-4 (transport useMemo non-reactive dependencies).
 */
export interface ChatConfig {
  transport: TransportConfig;
  behavior?: ChatBehaviorConfig;
  ui?: ChatUIConfig;
  persistence?: PersistenceAdapter;
  i18n?: I18nProvider;
}
