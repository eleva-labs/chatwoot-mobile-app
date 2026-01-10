/**
 * AI Chat Configuration Service
 *
 * Implementation of IAIChatConfigService that wraps
 * IAuthRepository and ISettingsRepository.
 */

import { injectable, inject } from 'tsyringe';
import type { IAIChatConfigService } from '@/domain/interfaces/services/shared';
import type { IAuthRepository, ISettingsRepository } from '@/domain/interfaces/repositories/shared';
import { SHARED_TOKENS } from '@/dependency-injection/tokens';

/**
 * Concrete implementation of IAIChatConfigService.
 * Facade over auth and settings repositories.
 */
@injectable()
export class AIChatConfigService implements IAIChatConfigService {
  constructor(
    @inject(SHARED_TOKENS.IAuthRepository)
    private readonly authRepository: IAuthRepository,
    @inject(SHARED_TOKENS.ISettingsRepository)
    private readonly settingsRepository: ISettingsRepository,
  ) {}

  /**
   * Get authentication headers for API requests.
   */
  getAuthHeaders(): Record<string, string> {
    const headers = this.authRepository.getHeaders();

    if (!headers) {
      return {};
    }

    return {
      'access-token': headers['access-token'],
      uid: headers.uid,
      client: headers.client,
    };
  }

  /**
   * Get the base URL for Chatwoot API requests.
   */
  getBaseURL(): string {
    return this.settingsRepository.getInstallationUrl();
  }

  /**
   * Get the AI backend URL if configured.
   */
  getAIBackendUrl(): string | null {
    return this.settingsRepository.getAIBackendUrl();
  }

  /**
   * Get the current user's account ID.
   */
  getAccountId(): number | null {
    return this.authRepository.getAccountId();
  }

  /**
   * Get the current user's ID.
   */
  getUserId(): number | null {
    return this.authRepository.getUserId();
  }

  /**
   * Check if user is currently authenticated.
   */
  isAuthenticated(): boolean {
    return this.authRepository.isAuthenticated();
  }

  /**
   * Build the full AI chat stream endpoint URL.
   */
  buildStreamEndpoint(aiBackendUrl?: string): string {
    if (aiBackendUrl) {
      return `${aiBackendUrl}/chat/stream`;
    }

    const baseURL = this.getBaseURL();
    const accountId = this.getAccountId();

    if (!accountId) {
      console.warn('[AIChatConfigService] Building endpoint without account ID');
    }

    return `${baseURL}/api/v1/accounts/${accountId}/ai_chat/stream`;
  }
}
