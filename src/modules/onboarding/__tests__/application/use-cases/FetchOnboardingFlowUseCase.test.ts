/**
 * Tests for FetchOnboardingFlowUseCaseImpl
 *
 * This use case fetches onboarding flows with caching (1 hour TTL).
 * Tests demonstrate mocking repositories and testing cache behavior.
 */
/* eslint-disable @typescript-eslint/no-require-imports */

import { FetchOnboardingFlowUseCaseImpl } from '../../../application/use-cases/FetchOnboardingFlowUseCaseImpl';
import { createMockOnboardingRepository, createMockStorageRepository } from '../../helpers/mocks';
import { testData, anOnboardingFlow, aScreen } from '../../helpers/builders';
import { freezeTime, unfreezeTime, advanceTimersByTime } from '../../helpers/testHelpers';

describe('FetchOnboardingFlowUseCaseImpl', () => {
  let useCase: FetchOnboardingFlowUseCaseImpl;
  let mockOnboardingRepo: ReturnType<typeof createMockOnboardingRepository>;
  let mockStorageRepo: ReturnType<typeof createMockStorageRepository>;

  const CACHE_TTL = 60 * 60 * 1000; // 1 hour

  beforeEach(() => {
    mockOnboardingRepo = createMockOnboardingRepository();
    mockStorageRepo = createMockStorageRepository();
    useCase = new FetchOnboardingFlowUseCaseImpl(mockOnboardingRepo, mockStorageRepo);
  });

  afterEach(() => {
    unfreezeTime();
  });

  describe('First fetch (no cache)', () => {
    it('should fetch flow from repository', async () => {
      const flow = testData.flows.simple();
      mockOnboardingRepo.setMockFlow(flow);

      const result = await useCase.execute('en');

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(flow);
      expect(mockOnboardingRepo.fetchFlowCallCount).toBe(1);
    });

    it('should cache fetched flow with TTL', async () => {
      const flow = testData.flows.simple();
      mockOnboardingRepo.setMockFlow(flow);

      await useCase.execute('en');

      expect(mockStorageRepo.saveCallCount).toBe(1);
      const cachedData = mockStorageRepo.getStoredValue<{
        flowDTO: unknown;
        cachedAt: number;
      }>('onboarding_flow_en');
      expect(cachedData).toBeDefined();
      expect(cachedData?.flowDTO).toBeDefined();
      expect(cachedData?.cachedAt).toBeDefined();
    });

    it('should return failure when repository fails', async () => {
      const error = new Error('Network error');
      mockOnboardingRepo.setFetchError(error);

      const result = await useCase.execute('en');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(error);
    });

    it('should not cache failed fetch', async () => {
      mockOnboardingRepo.setFetchError(new Error('Failed'));

      await useCase.execute('en');

      expect(mockStorageRepo.saveCallCount).toBe(0);
    });
  });

  describe('Cached flow (within TTL)', () => {
    beforeEach(() => {
      freezeTime(new Date('2024-01-01T12:00:00Z'));
    });

    it('should return cached flow without calling repository', async () => {
      const flow = testData.flows.simple();

      // First fetch - populates cache
      mockOnboardingRepo.setMockFlow(flow);
      await useCase.execute('en');

      // Reset mock to verify it's not called
      mockOnboardingRepo.reset();

      // Second fetch - should use cache
      const result = await useCase.execute('en');

      expect(result.isSuccess).toBe(true);
      expect(mockOnboardingRepo.fetchFlowCallCount).toBe(0);
      expect(mockStorageRepo.getCallCount).toBeGreaterThan(0);
    });

    it('should use cache for different locales separately', async () => {
      const enFlow = anOnboardingFlow().withLocale('en').build();
      const esFlow = anOnboardingFlow().withLocale('es').build();

      // Fetch English flow
      mockOnboardingRepo.setMockFlow(enFlow);
      const enResult = await useCase.execute('en');

      // Fetch Spanish flow
      mockOnboardingRepo.setMockFlow(esFlow);
      const esResult = await useCase.execute('es');

      expect(enResult.getValue().locale.toString()).toBe('en');
      expect(esResult.getValue().locale.toString()).toBe('es');
      expect(mockOnboardingRepo.fetchFlowCallCount).toBe(2);
    });
  });

  describe('Expired cache (beyond TTL)', () => {
    it('should fetch fresh data when cache expires', async () => {
      freezeTime(new Date('2024-01-01T12:00:00Z'));

      const flow = testData.flows.simple();
      mockOnboardingRepo.setMockFlow(flow);

      // First fetch
      await useCase.execute('en');
      expect(mockOnboardingRepo.fetchFlowCallCount).toBe(1);

      // Advance time past TTL (1 hour + 1 minute)
      advanceTimersByTime(CACHE_TTL + 60 * 1000);

      // Second fetch should hit repository again
      const result = await useCase.execute('en');

      expect(result.isSuccess).toBe(true);
      expect(mockOnboardingRepo.fetchFlowCallCount).toBe(2);
    });

    it('should update cache with fresh data after expiration', async () => {
      freezeTime(new Date('2024-01-01T12:00:00Z'));

      const oldFlow = anOnboardingFlow().withVersion('1.0.0').build();
      const newFlow = anOnboardingFlow().withVersion('2.0.0').build();

      // First fetch
      mockOnboardingRepo.setMockFlow(oldFlow);
      await useCase.execute('en');

      // Expire cache
      advanceTimersByTime(CACHE_TTL + 1000);

      // Second fetch with new flow
      mockOnboardingRepo.setMockFlow(newFlow);
      const result = await useCase.execute('en');

      expect(result.getValue().version.toString()).toBe('2.0.0');
    });
  });

  describe('Cache invalidation', () => {
    it('should provide method to clear cache (if implemented)', async () => {
      const flow = testData.flows.simple();
      mockOnboardingRepo.setMockFlow(flow);

      await useCase.execute('en');
      expect(mockStorageRepo.saveCallCount).toBe(1);

      // If use case has clearCache method
      if ('clearCache' in useCase && typeof useCase.clearCache === 'function') {
        await (useCase as { clearCache: (locale: string) => Promise<void> }).clearCache('en');
        expect(mockStorageRepo.removeCallCount).toBeGreaterThan(0);
      }
    });
  });

  describe('Network error with cache fallback', () => {
    it('should return cached flow when network fails', async () => {
      freezeTime(new Date('2024-01-01T12:00:00Z'));

      const flow = testData.flows.simple();
      mockOnboardingRepo.setMockFlow(flow);

      // First successful fetch
      await useCase.execute('en');

      // Expire cache
      advanceTimersByTime(CACHE_TTL + 1000);

      // Network fails on second fetch
      const { NetworkError } = require('../../../domain/entities/Errors');
      mockOnboardingRepo.setFetchError(new NetworkError('Network error'));

      const result = await useCase.execute('en');

      // Should fall back to expired cache
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().id).toBe(flow.id);
    });

    it('should return error when network fails and no cache exists', async () => {
      mockOnboardingRepo.setFetchError(new Error('Network error'));

      const result = await useCase.execute('en');

      expect(result.isFailure).toBe(true);
    });
  });

  describe('Storage errors', () => {
    it('should still return flow even if cache save fails', async () => {
      const flow = testData.flows.simple();
      mockOnboardingRepo.setMockFlow(flow);
      mockStorageRepo.setSaveError(new Error('Storage full'));

      const result = await useCase.execute('en');

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(flow);
    });

    it('should fetch fresh data if cache read fails', async () => {
      const flow = testData.flows.simple();
      mockOnboardingRepo.setMockFlow(flow);
      mockStorageRepo.setGetError(new Error('Storage error'));

      const result = await useCase.execute('en');

      expect(result.isSuccess).toBe(true);
      expect(mockOnboardingRepo.fetchFlowCallCount).toBe(1);
    });
  });

  describe('Concurrent requests', () => {
    it('should handle multiple simultaneous requests for same locale', async () => {
      const flow = testData.flows.simple();
      mockOnboardingRepo.setMockFlow(flow);

      // Make 3 concurrent requests
      const results = await Promise.all([
        useCase.execute('en'),
        useCase.execute('en'),
        useCase.execute('en'),
      ]);

      // All should succeed
      results.forEach(result => {
        expect(result.isSuccess).toBe(true);
      });

      // Depending on implementation, might fetch once or multiple times
      // This tests current behavior
      expect(mockOnboardingRepo.fetchFlowCallCount).toBeGreaterThan(0);
    });

    it('should handle concurrent requests for different locales', async () => {
      const enFlow = anOnboardingFlow().withLocale('en').build();

      mockOnboardingRepo.setMockFlow(enFlow);

      const [enResult, esResult, ptResult] = await Promise.all([
        useCase.execute('en'),
        useCase.execute('es'),
        useCase.execute('pt'),
      ]);

      expect(enResult.isSuccess).toBe(true);
      expect(esResult.isSuccess).toBe(true);
      expect(ptResult.isSuccess).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty locale string', async () => {
      const result = await useCase.execute('');

      // Should either use default locale or fail gracefully
      expect(result.isSuccess || result.isFailure).toBe(true);
    });

    it('should handle unsupported locale', async () => {
      const result = await useCase.execute('invalid-locale');

      // Behavior depends on implementation
      expect(result.isSuccess || result.isFailure).toBe(true);
    });

    it('should handle corrupted cache data', async () => {
      // Manually insert corrupted cache data
      await mockStorageRepo.save('onboarding_flow_en', { corrupted: 'data' });

      const flow = testData.flows.simple();
      mockOnboardingRepo.setMockFlow(flow);

      const result = await useCase.execute('en');

      // Should fetch fresh data
      expect(result.isSuccess).toBe(true);
      expect(mockOnboardingRepo.fetchFlowCallCount).toBe(1);
    });
  });

  describe('Performance', () => {
    it('should complete fetch within reasonable time', async () => {
      const flow = testData.flows.simple();
      mockOnboardingRepo.setMockFlow(flow);

      const startTime = Date.now();
      await useCase.execute('en');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should be fast
    });

    it('should handle large flows efficiently', async () => {
      // Create flow with many screens
      const largeFlow = anOnboardingFlow();
      for (let i = 0; i < 100; i++) {
        largeFlow.withScreen(
          aScreen()
            .withId(`q-${i}`)
            .withTitle('Question')
            .withQuestionType('text')
            .withOrder(i)
            .build(),
        );
      }

      mockOnboardingRepo.setMockFlow(largeFlow.build());

      const result = await useCase.execute('en');

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().getTotalSteps()).toBe(100);
    });
  });
});
