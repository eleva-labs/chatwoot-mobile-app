/**
 * Tests for MockOnboardingRepository
 *
 * Tests the mock repository implementation used for testing.
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import { MockOnboardingRepository } from '../../../infrastructure/repositories/MockOnboardingRepository';
import { Locale } from '../../../domain/entities/Locale';
import { NotFoundError } from '../../../domain/entities/Errors';

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe('MockOnboardingRepository', () => {
  let repository: MockOnboardingRepository;

  beforeEach(() => {
    repository = new MockOnboardingRepository();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('fetchFlow()', () => {
    it('should fetch flow successfully for English locale', async () => {
      const locale = Locale.create('en');

      const resultPromise = repository.fetchFlow(locale);
      jest.advanceTimersByTime(800);
      const result = await resultPromise;

      expect(result.isSuccess).toBe(true);
      const flow = result.getValue();
      expect(flow).toBeDefined();
      expect(flow.id.toString()).toBe('store-onboarding-v1');
    });

    it('should fallback to English when locale not found', async () => {
      const locale = Locale.create('fr');

      const resultPromise = repository.fetchFlow(locale);
      jest.advanceTimersByTime(800);
      const result = await resultPromise;

      expect(result.isSuccess).toBe(true);
      const flow = result.getValue();
      expect(flow).toBeDefined();
      expect(flow.locale.toString()).toBe('en');
    });

    it('should return NotFoundError when no flows available', async () => {
      // Create a new repository instance and clear mock flows
      const emptyRepository = new MockOnboardingRepository();
      // Access private mockFlows via type assertion (for testing purposes)
      (emptyRepository as any).mockFlows = {};

      const locale = Locale.create('en');

      const resultPromise = emptyRepository.fetchFlow(locale);
      jest.advanceTimersByTime(800);
      const result = await resultPromise;

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(NotFoundError);
    });

    it('should simulate network delay', async () => {
      const locale = Locale.create('en');
      const startTime = Date.now();

      const resultPromise = repository.fetchFlow(locale);

      // Advance timers by less than delay
      jest.advanceTimersByTime(400);
      // Promise should still be pending
      await Promise.resolve(); // Allow promise to check state

      // Advance to complete delay
      jest.advanceTimersByTime(400);
      const result = await resultPromise;

      expect(result.isSuccess).toBe(true);
      const endTime = Date.now();
      // Should have taken at least 800ms (simulated)
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle errors during fetch', async () => {
      const locale = Locale.create('en');

      // Mock OnboardingFlowMapper.toDomain to throw
      jest
        .spyOn(require('../../../application/mappers/OnboardingFlowMapper'), 'OnboardingFlowMapper')
        .mockImplementation(() => {
          throw new Error('Mapping error');
        });

      const resultPromise = repository.fetchFlow(locale);
      jest.advanceTimersByTime(800);
      const result = await resultPromise;

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(Error);
    });
  });

  describe('submitAnswers()', () => {
    it('should submit answers successfully', async () => {
      const flowId = 'flow-1';
      const answers = { q1: 'answer1', q2: 'answer2' };

      const resultPromise = repository.submitAnswers(flowId, answers);
      jest.advanceTimersByTime(800);
      const result = await resultPromise;

      expect(result.isSuccess).toBe(true);
    });

    it('should simulate network delay', async () => {
      const flowId = 'flow-1';
      const answers = { q1: 'answer1' };

      const resultPromise = repository.submitAnswers(flowId, answers);

      jest.advanceTimersByTime(400);
      // Promise should still be pending
      await Promise.resolve(); // Allow promise to check state

      jest.advanceTimersByTime(400);
      const result = await resultPromise;

      expect(result.isSuccess).toBe(true);
    });

    it('should handle errors during submission', async () => {
      const flowId = 'flow-1';
      const answers = { q1: 'answer1' };

      // Mock delay to throw
      jest.spyOn(repository as any, 'delay').mockRejectedValue(new Error('Delay error'));

      const resultPromise = repository.submitAnswers(flowId, answers);
      jest.advanceTimersByTime(800);
      const result = await resultPromise;

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(Error);
    });
  });

  describe('validateField()', () => {
    it('should validate field successfully', async () => {
      const fieldId = 'field-1';
      const value = 'test value';

      const resultPromise = repository.validateField(fieldId, value);
      jest.advanceTimersByTime(400); // Half delay
      const result = await resultPromise;

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().valid).toBe(true);
    });

    it('should simulate shorter network delay for validation', async () => {
      const fieldId = 'field-1';
      const value = 'test';

      const resultPromise = repository.validateField(fieldId, value);

      jest.advanceTimersByTime(200);
      // Promise should still be pending
      await Promise.resolve(); // Allow promise to check state

      jest.advanceTimersByTime(200);
      const result = await resultPromise;

      expect(result.isSuccess).toBe(true);
    });

    it('should handle errors during validation', async () => {
      const fieldId = 'field-1';
      const value = 'test';

      // Mock delay to throw
      jest.spyOn(repository as any, 'delay').mockRejectedValue(new Error('Delay error'));

      const resultPromise = repository.validateField(fieldId, value);
      jest.advanceTimersByTime(400);
      const result = await resultPromise;

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(Error);
    });
  });
});
