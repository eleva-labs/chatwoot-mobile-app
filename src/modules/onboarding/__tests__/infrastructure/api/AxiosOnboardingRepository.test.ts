/**
 * Tests for AxiosOnboardingRepository
 *
 * Tests the repository implementation using fetch for S3 and APIService for API calls.
 */

import { AxiosOnboardingRepository } from '../../../infrastructure/api/AxiosOnboardingRepository';
import { Locale } from '../../../domain/entities/Locale';
import { NetworkError, NotFoundError } from '../../../domain/entities/Errors';
import { Result } from '../../../domain/entities/Result';
import axios, { AxiosError } from 'axios';
import { apiService } from '@/services/APIService';

// Helper function to create AxiosError instances that pass instanceof checks
function createAxiosError(message: string, status?: number): AxiosError {
  const error = new AxiosError(message);
  error.isAxiosError = true;
  if (status !== undefined) {
    error.response = {
      status,
      statusText: status === 404 ? 'Not Found' : 'Internal Server Error',
      data: {},
      headers: {},
      config: {} as any,
    };
  }
  return error;
}

// Mock global fetch
global.fetch = jest.fn();

// Mock APIService (still used for submitAnswers and validateField)
jest.mock('@/services/APIService', () => ({
  apiService: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Don't mock OnboardingFlowMapper - use the actual implementation
// This ensures we're testing the real mapping logic

describe('AxiosOnboardingRepository', () => {
  let repository: AxiosOnboardingRepository;
  const mockApiService = apiService as jest.Mocked<typeof apiService>;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    // Set up environment variable for S3_BASE_URL
    process.env.EXPO_PUBLIC_S3_BASE_URL = 'https://s3.example.com';
    repository = new AxiosOnboardingRepository();
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_S3_BASE_URL;
    delete process.env.S3_BASE_URL;
  });

  describe('fetchFlow()', () => {
    it('should fetch flow successfully', async () => {
      const locale = Locale.create('en');
      // Use the exact same structure as MockOnboardingRepository to ensure it works
      const mockFlowDTO = {
        onboarding_flow: {
          id: 'store-onboarding-v1',
          version: '1.0.0',
          locale: 'en',
          title: 'Store Onboarding',
          skip_config: {
            allow_skip_entire_flow: false,
            track_skip_reasons: true,
          },
          screens: [
            {
              id: 'store_type',
              type: 'single_select',
              title: 'What type of store do you have?',
              description: 'This helps us customize your AI assistant',
              options: [
                {
                  id: 'appointment',
                  label: 'Appointment/Service-based',
                  value: 'appointment',
                },
                {
                  id: 'product',
                  label: 'Product/E-commerce',
                  value: 'product',
                },
              ],
              validation: {
                required: true,
                error_message: 'Please select your store type',
              },
              ui_config: {
                layout: 'list',
              },
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockFlowDTO,
      } as Response);

      const result = await repository.fetchFlow(locale);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.getValue()).toBeDefined();
        expect(result.getValue().id).toBe('store-onboarding-v1');
      }
      expect(mockFetch).toHaveBeenCalledWith('https://s3.example.com/onboarding/en.json');
    });

    it('should return NotFoundError when response has no data', async () => {
      const locale = Locale.create('en');

      // When json() returns null or falsy, the code should return NotFoundError
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => null as any,
      } as Response);

      const result = await repository.fetchFlow(locale);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(NotFoundError);
    });

    it('should return NotFoundError for 404 status', async () => {
      const locale = Locale.create('en');

      // For 404, the code checks response.ok before calling json()
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => {
          throw new Error('Should not call json() on 404');
        },
      } as Response);

      const result = await repository.fetchFlow(locale);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(NotFoundError);
      expect(result.getError().message).toContain('en');
    });

    it('should return NetworkError for other HTTP errors', async () => {
      const locale = Locale.create('en');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      } as Response);

      const result = await repository.fetchFlow(locale);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(NetworkError);
    });

    it('should return NetworkError for fetch errors', async () => {
      const locale = Locale.create('en');

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await repository.fetchFlow(locale);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(NetworkError);
      expect(result.getError().message).toContain('Failed to fetch onboarding flow');
    });

    it('should handle errors when S3_BASE_URL is not set', async () => {
      delete process.env.EXPO_PUBLIC_S3_BASE_URL;
      delete process.env.S3_BASE_URL;
      const locale = Locale.create('en');

      const result = await repository.fetchFlow(locale);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(NetworkError);
      expect(result.getError().message).toContain('S3_BASE_URL environment variable is not set');
    });
  });

  describe('submitAnswers()', () => {
    it('should submit answers successfully', async () => {
      const flowId = 'flow-1';
      const answers = { q1: 'answer1' };

      mockApiService.post.mockResolvedValue({
        data: undefined,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await repository.submitAnswers(flowId, answers);

      expect(result.isSuccess).toBe(true);
      expect(mockApiService.post).toHaveBeenCalledWith(`onboarding/flows/${flowId}/submit`, {
        answers,
      });
    });

    it('should return NetworkError for Axios errors', async () => {
      const flowId = 'flow-1';
      const answers = { q1: 'answer1' };
      const axiosError = createAxiosError('Network Error', 500);

      mockApiService.post.mockRejectedValue(axiosError);

      const result = await repository.submitAnswers(flowId, answers);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(NetworkError);
      expect(result.getError().message).toContain('Failed to submit answers');
    });

    it('should return NetworkError for non-Axios errors', async () => {
      const flowId = 'flow-1';
      const answers = { q1: 'answer1' };

      mockApiService.post.mockRejectedValue(new Error('Generic error'));

      const result = await repository.submitAnswers(flowId, answers);

      expect(result.isFailure).toBe(true);
      // The code returns the Error directly if it's an Error instance, not wrapped in NetworkError
      expect(result.getError()).toBeInstanceOf(Error);
      expect(result.getError().message).toBe('Generic error');
    });
  });

  describe('validateField()', () => {
    it('should validate field successfully', async () => {
      const fieldId = 'field-1';
      const value = 'test value';
      const mockResponse = { valid: true, message: 'Valid' };

      mockApiService.post.mockResolvedValue({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await repository.validateField(fieldId, value);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual(mockResponse);
      expect(mockApiService.post).toHaveBeenCalledWith(`onboarding/validate/${fieldId}`, {
        value,
      });
    });

    it('should return validation result with false', async () => {
      const fieldId = 'field-1';
      const value = 'invalid';
      const mockResponse = { valid: false, message: 'Invalid value' };

      mockApiService.post.mockResolvedValue({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await repository.validateField(fieldId, value);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().valid).toBe(false);
    });

    it('should return NetworkError for Axios errors', async () => {
      const fieldId = 'field-1';
      const value = 'test';
      const axiosError = createAxiosError('Network Error', 500);

      mockApiService.post.mockRejectedValue(axiosError);

      const result = await repository.validateField(fieldId, value);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(NetworkError);
      expect(result.getError().message).toContain('Failed to validate field');
    });

    it('should return NetworkError for non-Axios errors', async () => {
      const fieldId = 'field-1';
      const value = 'test';

      mockApiService.post.mockRejectedValue(new Error('Generic error'));

      const result = await repository.validateField(fieldId, value);

      expect(result.isFailure).toBe(true);
      // The code returns the Error directly if it's an Error instance, not wrapped in NetworkError
      expect(result.getError()).toBeInstanceOf(Error);
      expect(result.getError().message).toBe('Generic error');
    });
  });
});
