/**
 * Auth Repository Interface
 *
 * Contract for accessing app authentication state.
 * This is for APP SESSION (user login), NOT AI Chat Session.
 *
 * Implementation lives in infrastructure/repositories/shared/
 * (typically wrapping Redux auth state)
 */

/**
 * HTTP headers required for authenticated API requests
 */
export interface AuthHeaders {
  'access-token': string;
  uid: string;
  client: string;
}

/**
 * Repository interface for app authentication state
 */
export interface IAuthRepository {
  /**
   * Get authentication headers for API requests
   *
   * @returns Headers object or null if not authenticated
   */
  getHeaders(): AuthHeaders | null;

  /**
   * Get the current user's account ID
   *
   * @returns Account ID or null if not authenticated
   */
  getAccountId(): number | null;

  /**
   * Get the current user's ID
   *
   * @returns User ID or null if not authenticated
   */
  getUserId(): number | null;

  /**
   * Check if user is authenticated
   *
   * @returns True if user is logged in
   */
  isAuthenticated(): boolean;
}
