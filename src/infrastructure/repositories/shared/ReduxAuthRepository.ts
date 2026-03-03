/**
 * Redux Auth Repository
 *
 * Implements IAuthRepository to access authentication state from Redux.
 */

import { injectable } from 'tsyringe';
import type { IAuthRepository, AuthHeaders } from '@/domain/interfaces/repositories/shared';
import { getStore } from '@application/store/storeAccessor';

/**
 * Repository for accessing auth state from Redux store
 */
@injectable()
export class ReduxAuthRepository implements IAuthRepository {
  /**
   * Get authentication headers for API requests
   */
  getHeaders(): AuthHeaders | null {
    const state = getStore().getState();
    const headers = state.auth?.headers;

    if (!headers) {
      return null;
    }

    return {
      'access-token': headers['access-token'],
      uid: headers.uid,
      client: headers.client,
    };
  }

  /**
   * Get the current user's account ID
   */
  getAccountId(): number | null {
    const state = getStore().getState();
    return state.auth?.user?.account_id ?? null;
  }

  /**
   * Get the current user's ID
   */
  getUserId(): number | null {
    const state = getStore().getState();
    return state.auth?.user?.id ?? null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const headers = this.getHeaders();
    return headers !== null && !!headers['access-token'];
  }
}
