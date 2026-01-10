/**
 * Unit Tests for AIChatConfigService
 *
 * Tests the AIChatConfigService facade that wraps IAuthRepository
 * and ISettingsRepository for AI chat configuration.
 */

import { AIChatConfigService } from '@/infrastructure/services/shared/AIChatConfigService';
import type { IAuthRepository, ISettingsRepository } from '@/domain/interfaces/repositories/shared';

describe('AIChatConfigService', () => {
  // Mock repositories
  const mockAuthRepository: jest.Mocked<IAuthRepository> = {
    getHeaders: jest.fn(),
    getAccountId: jest.fn(),
    getUserId: jest.fn(),
    isAuthenticated: jest.fn(),
  };

  const mockSettingsRepository: jest.Mocked<ISettingsRepository> = {
    getInstallationUrl: jest.fn(),
    getAIBackendUrl: jest.fn(),
    getAIBaseUrl: jest.fn(),
    getLocale: jest.fn(),
  };

  let service: AIChatConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AIChatConfigService(mockAuthRepository, mockSettingsRepository);
  });

  // ============================================================================
  // getAuthHeaders() Tests
  // ============================================================================

  describe('getAuthHeaders', () => {
    it('should return empty object when headers are null (not authenticated)', () => {
      mockAuthRepository.getHeaders.mockReturnValue(null);

      const result = service.getAuthHeaders();

      expect(result).toEqual({});
      expect(mockAuthRepository.getHeaders).toHaveBeenCalledTimes(1);
    });

    it('should return formatted headers when authenticated', () => {
      mockAuthRepository.getHeaders.mockReturnValue({
        'access-token': 'token123',
        uid: 'user@example.com',
        client: 'client123',
      });

      const result = service.getAuthHeaders();

      expect(result).toEqual({
        'access-token': 'token123',
        uid: 'user@example.com',
        client: 'client123',
      });
    });

    it('should include access-token, uid, and client fields', () => {
      mockAuthRepository.getHeaders.mockReturnValue({
        'access-token': 'my-token',
        uid: 'my-uid',
        client: 'my-client',
      });

      const result = service.getAuthHeaders();

      expect(result).toHaveProperty('access-token', 'my-token');
      expect(result).toHaveProperty('uid', 'my-uid');
      expect(result).toHaveProperty('client', 'my-client');
    });
  });

  // ============================================================================
  // getBaseURL() Tests
  // ============================================================================

  describe('getBaseURL', () => {
    it('should delegate to settingsRepository.getInstallationUrl()', () => {
      mockSettingsRepository.getInstallationUrl.mockReturnValue('https://app.chatwoot.com');

      const result = service.getBaseURL();

      expect(result).toBe('https://app.chatwoot.com');
      expect(mockSettingsRepository.getInstallationUrl).toHaveBeenCalledTimes(1);
    });

    it('should return the correct URL from settings', () => {
      mockSettingsRepository.getInstallationUrl.mockReturnValue('https://custom.chatwoot.io');

      const result = service.getBaseURL();

      expect(result).toBe('https://custom.chatwoot.io');
    });
  });

  // ============================================================================
  // getAIBackendUrl() Tests
  // ============================================================================

  describe('getAIBackendUrl', () => {
    it('should delegate to settingsRepository.getAIBackendUrl()', () => {
      mockSettingsRepository.getAIBackendUrl.mockReturnValue('https://ai.backend.com');

      const result = service.getAIBackendUrl();

      expect(result).toBe('https://ai.backend.com');
      expect(mockSettingsRepository.getAIBackendUrl).toHaveBeenCalledTimes(1);
    });

    it('should return null when AI backend is not configured', () => {
      mockSettingsRepository.getAIBackendUrl.mockReturnValue(null);

      const result = service.getAIBackendUrl();

      expect(result).toBeNull();
    });

    it('should return URL when AI backend is configured', () => {
      mockSettingsRepository.getAIBackendUrl.mockReturnValue('https://my-ai-backend.com');

      const result = service.getAIBackendUrl();

      expect(result).toBe('https://my-ai-backend.com');
    });
  });

  // ============================================================================
  // getAccountId() Tests
  // ============================================================================

  describe('getAccountId', () => {
    it('should delegate to authRepository.getAccountId()', () => {
      mockAuthRepository.getAccountId.mockReturnValue(123);

      const result = service.getAccountId();

      expect(result).toBe(123);
      expect(mockAuthRepository.getAccountId).toHaveBeenCalledTimes(1);
    });

    it('should return null when not authenticated', () => {
      mockAuthRepository.getAccountId.mockReturnValue(null);

      const result = service.getAccountId();

      expect(result).toBeNull();
    });

    it('should return account ID when authenticated', () => {
      mockAuthRepository.getAccountId.mockReturnValue(456);

      const result = service.getAccountId();

      expect(result).toBe(456);
    });
  });

  // ============================================================================
  // getUserId() Tests
  // ============================================================================

  describe('getUserId', () => {
    it('should delegate to authRepository.getUserId()', () => {
      mockAuthRepository.getUserId.mockReturnValue(42);

      const result = service.getUserId();

      expect(result).toBe(42);
      expect(mockAuthRepository.getUserId).toHaveBeenCalledTimes(1);
    });

    it('should return null when not authenticated', () => {
      mockAuthRepository.getUserId.mockReturnValue(null);

      const result = service.getUserId();

      expect(result).toBeNull();
    });

    it('should return user ID when authenticated', () => {
      mockAuthRepository.getUserId.mockReturnValue(789);

      const result = service.getUserId();

      expect(result).toBe(789);
    });
  });

  // ============================================================================
  // isAuthenticated() Tests
  // ============================================================================

  describe('isAuthenticated', () => {
    it('should delegate to authRepository.isAuthenticated()', () => {
      mockAuthRepository.isAuthenticated.mockReturnValue(true);

      const result = service.isAuthenticated();

      expect(result).toBe(true);
      expect(mockAuthRepository.isAuthenticated).toHaveBeenCalledTimes(1);
    });

    it('should return true when user is authenticated', () => {
      mockAuthRepository.isAuthenticated.mockReturnValue(true);

      const result = service.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when user is not authenticated', () => {
      mockAuthRepository.isAuthenticated.mockReturnValue(false);

      const result = service.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // buildStreamEndpoint() Tests
  // ============================================================================

  describe('buildStreamEndpoint', () => {
    it('should return direct backend endpoint when aiBackendUrl is provided', () => {
      const result = service.buildStreamEndpoint('https://ai.example.com');

      expect(result).toBe('https://ai.example.com/chat/stream');
    });

    it('should return Chatwoot proxy endpoint when no aiBackendUrl is provided', () => {
      mockSettingsRepository.getInstallationUrl.mockReturnValue('https://app.chatwoot.com');
      mockAuthRepository.getAccountId.mockReturnValue(123);

      const result = service.buildStreamEndpoint();

      expect(result).toBe('https://app.chatwoot.com/api/v1/accounts/123/ai_chat/stream');
    });

    it('should use baseURL and accountId for Chatwoot proxy endpoint', () => {
      mockSettingsRepository.getInstallationUrl.mockReturnValue('https://custom.chatwoot.io');
      mockAuthRepository.getAccountId.mockReturnValue(999);

      const result = service.buildStreamEndpoint();

      expect(result).toBe('https://custom.chatwoot.io/api/v1/accounts/999/ai_chat/stream');
      expect(mockSettingsRepository.getInstallationUrl).toHaveBeenCalled();
      expect(mockAuthRepository.getAccountId).toHaveBeenCalled();
    });

    it('should log warning when accountId is null', () => {
      mockSettingsRepository.getInstallationUrl.mockReturnValue('https://app.chatwoot.com');
      mockAuthRepository.getAccountId.mockReturnValue(null);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = service.buildStreamEndpoint();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[AIChatConfigService] Building endpoint without account ID',
      );
      expect(result).toBe('https://app.chatwoot.com/api/v1/accounts/null/ai_chat/stream');

      consoleSpy.mockRestore();
    });

    it('should not call getInstallationUrl or getAccountId when aiBackendUrl is provided', () => {
      const result = service.buildStreamEndpoint('https://ai.backend.com');

      expect(result).toBe('https://ai.backend.com/chat/stream');
      expect(mockSettingsRepository.getInstallationUrl).not.toHaveBeenCalled();
      expect(mockAuthRepository.getAccountId).not.toHaveBeenCalled();
    });

    it('should handle empty aiBackendUrl string by using Chatwoot proxy', () => {
      mockSettingsRepository.getInstallationUrl.mockReturnValue('https://app.chatwoot.com');
      mockAuthRepository.getAccountId.mockReturnValue(100);

      // Empty string is falsy, so it should use the proxy
      const result = service.buildStreamEndpoint('');

      // Note: Empty string is falsy in JS, so this will use the proxy
      // Actually, the implementation checks `if (aiBackendUrl)` which is falsy for empty string
      expect(result).toBe('https://app.chatwoot.com/api/v1/accounts/100/ai_chat/stream');
    });
  });
});
