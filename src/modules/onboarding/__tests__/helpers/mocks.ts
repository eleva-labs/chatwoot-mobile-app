/**
 * Mock Implementations for Testing
 *
 * Provides mock implementations of repositories and services for isolated testing.
 */

import type { IOnboardingRepository } from '../../domain/repositories/IOnboardingRepository';
import type { IStorageRepository } from '../../domain/repositories/IStorageRepository';
import { Result } from '../../domain/entities/Result';
import type { OnboardingFlow } from '../../domain/entities/OnboardingFlow';
import { Locale } from '../../domain/entities/Locale';
import { testData } from './builders';

/**
 * Mock OnboardingRepository for testing use cases
 */
export class MockOnboardingRepository implements IOnboardingRepository {
  public fetchFlowCallCount = 0;
  public submitAnswersCallCount = 0;
  public validateFieldCallCount = 0;

  public mockFlow: OnboardingFlow | null = testData.flows.simple();
  public mockFetchError: Error | null = null;
  public mockSubmitError: Error | null = null;
  public mockValidationResult: { valid: boolean; message?: string } = { valid: true };

  async fetchFlow(locale: Locale): Promise<Result<OnboardingFlow, Error>> {
    this.fetchFlowCallCount++;

    if (this.mockFetchError) {
      return Result.fail(this.mockFetchError);
    }

    if (!this.mockFlow) {
      return Result.fail(new Error('Flow not found'));
    }

    return Result.ok(this.mockFlow);
  }

  async submitAnswers(
    flowId: string,
    answers: Record<string, unknown>,
  ): Promise<Result<void, Error>> {
    this.submitAnswersCallCount++;

    if (this.mockSubmitError) {
      return Result.fail(this.mockSubmitError);
    }

    return Result.ok(undefined);
  }

  async validateField(
    fieldId: string,
    value: unknown,
  ): Promise<Result<{ valid: boolean; message?: string }, Error>> {
    this.validateFieldCallCount++;
    return Result.ok(this.mockValidationResult);
  }

  // Test helpers
  reset(): void {
    this.fetchFlowCallCount = 0;
    this.submitAnswersCallCount = 0;
    this.validateFieldCallCount = 0;
    this.mockFlow = testData.flows.simple();
    this.mockFetchError = null;
    this.mockSubmitError = null;
    this.mockValidationResult = { valid: true };
  }

  setMockFlow(flow: OnboardingFlow | null): void {
    this.mockFlow = flow;
  }

  setFetchError(error: Error | null): void {
    this.mockFetchError = error;
  }

  setSubmitError(error: Error | null): void {
    this.mockSubmitError = error;
  }
}

/**
 * Mock StorageRepository for testing persistence logic
 */
export class MockStorageRepository implements IStorageRepository {
  private storage: Map<string, string> = new Map();
  public saveCallCount = 0;
  public getCallCount = 0;
  public removeCallCount = 0;

  public mockSaveError: Error | null = null;
  public mockGetError: Error | null = null;
  public mockRemoveError: Error | null = null;

  async save(key: string, value: unknown): Promise<Result<void, Error>> {
    this.saveCallCount++;

    if (this.mockSaveError) {
      return Result.fail(this.mockSaveError);
    }

    this.storage.set(key, JSON.stringify(value));
    return Result.ok(undefined);
  }

  async get<T>(key: string): Promise<Result<T | null, Error>> {
    this.getCallCount++;

    if (this.mockGetError) {
      return Result.fail(this.mockGetError);
    }

    const value = this.storage.get(key);
    if (!value) {
      return Result.ok(null);
    }

    try {
      return Result.ok(JSON.parse(value) as T);
    } catch {
      return Result.fail(new Error('Failed to parse stored value'));
    }
  }

  async remove(key: string): Promise<Result<void, Error>> {
    this.removeCallCount++;

    if (this.mockRemoveError) {
      return Result.fail(this.mockRemoveError);
    }

    this.storage.delete(key);
    return Result.ok(undefined);
  }

  async exists(key: string): Promise<Result<boolean, Error>> {
    return Result.ok(this.storage.has(key));
  }

  async clear(): Promise<Result<void, Error>> {
    this.storage.clear();
    return Result.ok(undefined);
  }

  // Test helpers
  reset(): void {
    this.storage.clear();
    this.saveCallCount = 0;
    this.getCallCount = 0;
    this.removeCallCount = 0;
    this.mockSaveError = null;
    this.mockGetError = null;
    this.mockRemoveError = null;
  }

  getStoredValue<T>(key: string): T | null {
    const value = this.storage.get(key);
    return value ? JSON.parse(value) : null;
  }

  setSaveError(error: Error | null): void {
    this.mockSaveError = error;
  }

  setGetError(error: Error | null): void {
    this.mockGetError = error;
  }

  setRemoveError(error: Error | null): void {
    this.mockRemoveError = error;
  }
}

/**
 * Factory functions for creating mocks
 */
export const createMockOnboardingRepository = (): MockOnboardingRepository => {
  return new MockOnboardingRepository();
};

export const createMockStorageRepository = (): MockStorageRepository => {
  return new MockStorageRepository();
};
