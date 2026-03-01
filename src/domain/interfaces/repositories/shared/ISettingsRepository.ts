/**
 * Settings Repository Interface
 *
 * Contract for accessing app settings and configuration.
 *
 * Implementation lives in infrastructure/repositories/shared/
 * (typically wrapping Redux settings state)
 */

/**
 * Repository interface for app settings
 */
export interface ISettingsRepository {
  /**
   * Get the Chatwoot installation URL
   *
   * @returns Installation URL or empty string if not configured
   */
  getInstallationUrl(): string;

  /**
   * Get the AI backend URL (if different from installation URL)
   *
   * @returns AI backend URL or null to use installation URL
   */
  getAIBackendUrl(): string | null;

  /**
   * Get the effective base URL for AI API requests
   *
   * Returns AI backend URL if configured, otherwise installation URL
   *
   * @returns Base URL for AI API requests
   */
  getAIBaseUrl(): string;

  /**
   * Get app locale/language setting
   *
   * @returns Locale code (e.g., 'en', 'es')
   */
  getLocale(): string;
}
