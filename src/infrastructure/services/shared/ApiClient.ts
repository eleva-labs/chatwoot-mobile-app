/**
 * Abstract API Client
 *
 * Base class for making HTTP requests.
 * Provides common functionality for authentication, error handling, and request building.
 */

import { injectable, inject } from 'tsyringe';
import { fetch as expoFetch } from 'expo/fetch';
import type { IAuthRepository, ISettingsRepository } from '@/domain/interfaces/repositories/shared';
import { buildQueryString } from '@/infrastructure/services/ai-assistant/endpoints';
import { SHARED_TOKENS } from '@/dependency-injection';

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
}

/**
 * HTTP request options
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | undefined>;
  timeout?: number;
}

/**
 * API Error with status code
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Abstract API Client
 *
 * Provides common HTTP functionality for services.
 * Subclasses should inject their specific dependencies.
 */
// @ts-expect-error - tsyringe decorator signature is compatible at runtime
@injectable()
export abstract class ApiClient {
  constructor(
    @inject(SHARED_TOKENS.IAuthRepository) protected readonly authRepository: IAuthRepository,
    @inject(SHARED_TOKENS.ISettingsRepository)
    protected readonly settingsRepository: ISettingsRepository,
  ) {}

  // ============================================================================
  // Abstract Methods - Subclasses must implement
  // ============================================================================

  /**
   * Get the base URL for requests
   */
  protected abstract getBaseUrl(): string;

  // ============================================================================
  // HTTP Methods
  // ============================================================================

  /**
   * Make a GET request
   */
  protected async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  /**
   * Make a POST request
   */
  protected async post<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, body, options);
  }

  /**
   * Make a PUT request
   */
  protected async put<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  /**
   * Make a DELETE request
   */
  protected async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  /**
   * Make a streaming request (returns raw Response for stream handling)
   */
  protected async stream(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<Response> {
    const url = this.buildUrl(endpoint, options?.params);
    const headers = this.buildHeaders(options?.headers);

    const response = await expoFetch(url, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(
        this.parseErrorMessage(errorText, 'Stream request failed'),
        response.status,
      );
    }

    // Cast FetchResponse to Response - expo/fetch response is compatible at runtime
    return response as unknown as Response;
  }

  // ============================================================================
  // Internal Methods
  // ============================================================================

  /**
   * Make an HTTP request
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, options?.params);
    const headers = this.buildHeaders(options?.headers);

    const response = await expoFetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(
        this.parseErrorMessage(errorText, `${method} request failed`),
        response.status,
      );
    }

    const data = await response.json();
    return { data, status: response.status };
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | undefined>): string {
    const baseUrl = this.getBaseUrl();
    const queryString = params ? buildQueryString(params) : '';

    // Handle endpoint with or without leading slash
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    return `${baseUrl}${normalizedEndpoint}${queryString}`;
  }

  /**
   * Build request headers with authentication
   */
  private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const authHeaders = this.getAuthHeaders();

    return {
      ...authHeaders,
      'Content-Type': 'application/json',
      ...customHeaders,
    };
  }

  /**
   * Get authentication headers
   */
  protected getAuthHeaders(): Record<string, string> {
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
   * Parse error message from response
   */
  protected parseErrorMessage(errorText: string, defaultMessage: string): string {
    try {
      const errorData = JSON.parse(errorText);
      return errorData.message || errorData.error || errorData.detail || defaultMessage;
    } catch {
      return errorText || defaultMessage;
    }
  }

  /**
   * Check if user is authenticated
   */
  protected isAuthenticated(): boolean {
    return this.authRepository.isAuthenticated();
  }
}
