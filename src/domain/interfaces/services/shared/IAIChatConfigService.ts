/**
 * AI Chat Configuration Service Interface
 *
 * Provides a unified interface for accessing AI chat configuration.
 * This is a facade over IAuthRepository and ISettingsRepository,
 * exposing only what the AI chat feature needs.
 *
 * Use Cases:
 * - useAIChat hook needs auth headers for API requests
 * - useAIChat hook needs base URL for endpoint construction
 * - useAIChat hook needs account ID for API paths
 */

/**
 * Configuration service for AI Chat feature.
 * Combines auth and settings access into a single interface.
 */
export interface IAIChatConfigService {
  /**
   * Get authentication headers for API requests.
   * Returns empty object if not authenticated.
   *
   * @returns Auth headers with access-token, uid, client
   */
  getAuthHeaders(): Record<string, string>;

  /**
   * Get the base URL for Chatwoot API requests.
   * Normalized (no trailing slash).
   *
   * @returns Installation URL (e.g., "https://app.chatwoot.com")
   */
  getBaseURL(): string;

  /**
   * Get the AI backend URL if configured.
   * For direct Python backend access.
   *
   * @returns AI backend URL or null to use Chatwoot proxy
   */
  getAIBackendUrl(): string | null;

  /**
   * Get the current user's account ID.
   *
   * @returns Account ID or null if not authenticated
   */
  getAccountId(): number | null;

  /**
   * Get the current user's ID.
   *
   * @returns User ID or null if not authenticated
   */
  getUserId(): number | null;

  /**
   * Check if user is currently authenticated.
   *
   * @returns True if user has valid auth credentials
   */
  isAuthenticated(): boolean;

  /**
   * Build the full AI chat stream endpoint URL.
   * Convenience method for useAIChat.
   *
   * @param aiBackendUrl Optional direct backend URL
   * @returns Full endpoint URL (e.g., "https://app.chatwoot.com/api/v1/accounts/1/ai_chat/stream")
   */
  buildStreamEndpoint(aiBackendUrl?: string): string;
}
