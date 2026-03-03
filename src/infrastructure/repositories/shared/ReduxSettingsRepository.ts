/**
 * Redux Settings Repository
 *
 * Implements ISettingsRepository to access app settings from Redux.
 */

import { injectable } from 'tsyringe';
import type { ISettingsRepository } from '@/domain/interfaces/repositories/shared';
import { getStore } from '@application/store/storeAccessor';

/**
 * Repository for accessing settings from Redux store
 */
@injectable()
export class ReduxSettingsRepository implements ISettingsRepository {
  /**
   * Get the Chatwoot installation URL
   */
  getInstallationUrl(): string {
    const state = getStore().getState();
    const url = state.settings?.installationUrl || '';
    // Normalize: remove trailing slash
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }

  /**
   * Get the AI backend URL (if different from installation URL)
   */
  getAIBackendUrl(): string | null {
    const state = getStore().getState();
    const url = state.settings?.aiBackendUrl;
    if (!url) {
      return null;
    }
    // Normalize: remove trailing slash
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }

  /**
   * Get the effective base URL for AI API requests
   */
  getAIBaseUrl(): string {
    const aiBackendUrl = this.getAIBackendUrl();
    if (aiBackendUrl) {
      return aiBackendUrl;
    }
    return this.getInstallationUrl();
  }

  /**
   * Get app locale/language setting
   */
  getLocale(): string {
    const state = getStore().getState();
    return state.settings?.localeValue || 'en';
  }
}
