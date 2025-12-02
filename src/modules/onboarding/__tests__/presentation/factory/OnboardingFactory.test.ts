/**
 * Tests for OnboardingFactory
 *
 * Tests the factory functions that create and manage onboarding dependencies.
 */

import {
  createOnboardingDependencies,
  getDefaultOnboardingDependencies,
  resetDefaultOnboardingDependencies,
} from '../../../presentation/factory/OnboardingFactory';
import { container } from 'tsyringe';
import {
  configureOnboardingContainer,
  resetOnboardingContainer,
} from '../../../dependency_injection/container';
import { FetchOnboardingFlowUseCaseImpl } from '../../../application/use-cases/FetchOnboardingFlowUseCaseImpl';
import { SubmitOnboardingAnswersUseCaseImpl } from '../../../application/use-cases/SubmitOnboardingAnswersUseCaseImpl';
import { SaveProgressUseCaseImpl } from '../../../application/use-cases/SaveProgressUseCaseImpl';
import { ValidateAnswerUseCaseImpl } from '../../../application/use-cases/ValidateAnswerUseCaseImpl';
import { ProcessOfflineQueueUseCaseImpl } from '../../../application/use-cases/ProcessOfflineQueueUseCaseImpl';

// Use actual tsyringe container (unmock it for this test)
// This allows us to test the actual factory behavior
jest.unmock('tsyringe');

// Mock the container configuration - use actual implementation but spy on it
jest.mock('../../../dependency_injection/container', () => {
  const actualModule = jest.requireActual('../../../dependency_injection/container');
  return {
    ...actualModule,
    configureOnboardingContainer: jest.fn(options => {
      // Call the actual implementation
      return actualModule.configureOnboardingContainer(options);
    }),
  };
});

describe('OnboardingFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset default dependencies
    resetDefaultOnboardingDependencies();
    // Reset container (this uses the actual resetOnboardingContainer which should work)
    resetOnboardingContainer();
  });

  afterEach(() => {
    resetDefaultOnboardingDependencies();
    resetOnboardingContainer();
  });

  describe('createOnboardingDependencies()', () => {
    it('should create all required dependencies', () => {
      const dependencies = createOnboardingDependencies();

      expect(dependencies.fetchFlowUseCase).toBeDefined();
      expect(dependencies.submitAnswersUseCase).toBeDefined();
      expect(dependencies.saveProgressUseCase).toBeDefined();
      expect(dependencies.validateAnswerUseCase).toBeDefined();
      expect(dependencies.processOfflineQueueUseCase).toBeDefined();
    });

    it('should call configureOnboardingContainer with empty options by default', () => {
      createOnboardingDependencies();

      expect(configureOnboardingContainer).toHaveBeenCalledWith({});
    });

    it('should call configureOnboardingContainer with provided options', () => {
      const options = { useMock: false, enableOfflineQueue: true };
      createOnboardingDependencies(options);

      expect(configureOnboardingContainer).toHaveBeenCalledWith(options);
    });

    it('should resolve all use cases from container', () => {
      const dependencies = createOnboardingDependencies();

      expect(dependencies.fetchFlowUseCase).toBeInstanceOf(FetchOnboardingFlowUseCaseImpl);
      expect(dependencies.submitAnswersUseCase).toBeInstanceOf(SubmitOnboardingAnswersUseCaseImpl);
      expect(dependencies.saveProgressUseCase).toBeInstanceOf(SaveProgressUseCaseImpl);
      expect(dependencies.validateAnswerUseCase).toBeInstanceOf(ValidateAnswerUseCaseImpl);
    });

    it('should include processOfflineQueueUseCase when enableOfflineQueue is true', () => {
      const dependencies = createOnboardingDependencies({ enableOfflineQueue: true });

      expect(dependencies.processOfflineQueueUseCase).toBeDefined();
      expect(dependencies.processOfflineQueueUseCase).toBeInstanceOf(
        ProcessOfflineQueueUseCaseImpl,
      );
    });

    it('should include processOfflineQueueUseCase when enableOfflineQueue is undefined', () => {
      const dependencies = createOnboardingDependencies();

      expect(dependencies.processOfflineQueueUseCase).toBeDefined();
      expect(dependencies.processOfflineQueueUseCase).toBeInstanceOf(
        ProcessOfflineQueueUseCaseImpl,
      );
    });

    it('should exclude processOfflineQueueUseCase when enableOfflineQueue is false', () => {
      const dependencies = createOnboardingDependencies({ enableOfflineQueue: false });

      expect(dependencies.processOfflineQueueUseCase).toBeUndefined();
    });

    it('should create new instances on each call', () => {
      const dependencies1 = createOnboardingDependencies();
      const dependencies2 = createOnboardingDependencies();

      // Each call should create new instances
      expect(dependencies1).not.toBe(dependencies2);
      expect(dependencies1.fetchFlowUseCase).not.toBe(dependencies2.fetchFlowUseCase);
      expect(dependencies1.submitAnswersUseCase).not.toBe(dependencies2.submitAnswersUseCase);
    });

    it('should handle useMock option', () => {
      const dependenciesWithMock = createOnboardingDependencies({ useMock: true });
      const dependenciesWithoutMock = createOnboardingDependencies({ useMock: false });

      expect(configureOnboardingContainer).toHaveBeenCalledWith({ useMock: true });
      expect(configureOnboardingContainer).toHaveBeenCalledWith({ useMock: false });
      expect(dependenciesWithMock.fetchFlowUseCase).toBeDefined();
      expect(dependenciesWithoutMock.fetchFlowUseCase).toBeDefined();
    });
  });

  describe('getDefaultOnboardingDependencies()', () => {
    it('should create dependencies on first call', () => {
      const dependencies = getDefaultOnboardingDependencies();

      expect(dependencies).toBeDefined();
      expect(configureOnboardingContainer).toHaveBeenCalled();
    });

    it('should return the same instance on subsequent calls without options', () => {
      const dependencies1 = getDefaultOnboardingDependencies();
      const dependencies2 = getDefaultOnboardingDependencies();

      expect(dependencies1).toBe(dependencies2);
      expect(dependencies1.fetchFlowUseCase).toBe(dependencies2.fetchFlowUseCase);
    });

    it('should recreate dependencies when options are provided', () => {
      const dependencies1 = getDefaultOnboardingDependencies();
      const dependencies2 = getDefaultOnboardingDependencies({ useMock: false });

      // Should be different instances when options change
      expect(dependencies1).not.toBe(dependencies2);
      expect(configureOnboardingContainer).toHaveBeenCalledTimes(2);
    });

    it('should use provided options when recreating', () => {
      const options = { useMock: false, enableOfflineQueue: false };
      getDefaultOnboardingDependencies(options);

      expect(configureOnboardingContainer).toHaveBeenCalledWith(options);
    });

    it('should return cached instance when called again with same options', () => {
      // First call with options creates dependencies
      const options = { useMock: true };
      const dependencies1 = getDefaultOnboardingDependencies(options);
      // Second call with same options should return cached instance
      // Note: According to the implementation, if options are provided, it recreates
      // So we need to call without options to get the cached instance
      const dependencies2 = getDefaultOnboardingDependencies();

      // After first call with options, subsequent calls without options return cached
      expect(dependencies1).toBe(dependencies2);
    });

    it('should recreate when called with different options after initial call', () => {
      const dependencies1 = getDefaultOnboardingDependencies();
      const dependencies2 = getDefaultOnboardingDependencies({ enableOfflineQueue: false });

      expect(dependencies1).not.toBe(dependencies2);
      expect(dependencies2.processOfflineQueueUseCase).toBeUndefined();
    });
  });

  describe('resetDefaultOnboardingDependencies()', () => {
    it('should clear the default dependencies', () => {
      const dependencies1 = getDefaultOnboardingDependencies();
      resetDefaultOnboardingDependencies();
      const dependencies2 = getDefaultOnboardingDependencies();

      // Should create new instances after reset
      expect(dependencies1).not.toBe(dependencies2);
      expect(configureOnboardingContainer).toHaveBeenCalledTimes(2);
    });

    it('should clear container instances', () => {
      getDefaultOnboardingDependencies();
      const clearSpy = jest.spyOn(container, 'clearInstances');
      resetDefaultOnboardingDependencies();

      expect(clearSpy).toHaveBeenCalled();
      clearSpy.mockRestore();
    });

    it('should allow creating new dependencies after reset', () => {
      getDefaultOnboardingDependencies();
      resetDefaultOnboardingDependencies();

      const dependencies = getDefaultOnboardingDependencies();
      expect(dependencies).toBeDefined();
      expect(dependencies.fetchFlowUseCase).toBeDefined();
    });
  });

  describe('Integration with container', () => {
    it('should properly wire up all dependencies', () => {
      const dependencies = createOnboardingDependencies();

      // All dependencies should be properly instantiated
      expect(dependencies.fetchFlowUseCase).toBeInstanceOf(FetchOnboardingFlowUseCaseImpl);
      expect(dependencies.submitAnswersUseCase).toBeInstanceOf(SubmitOnboardingAnswersUseCaseImpl);
      expect(dependencies.saveProgressUseCase).toBeInstanceOf(SaveProgressUseCaseImpl);
      expect(dependencies.validateAnswerUseCase).toBeInstanceOf(ValidateAnswerUseCaseImpl);
    });

    it('should handle multiple factory calls with different options', () => {
      const deps1 = createOnboardingDependencies({ useMock: true });
      const deps2 = createOnboardingDependencies({ useMock: false });
      const deps3 = createOnboardingDependencies({ enableOfflineQueue: false });

      expect(deps1.fetchFlowUseCase).toBeDefined();
      expect(deps2.fetchFlowUseCase).toBeDefined();
      expect(deps3.fetchFlowUseCase).toBeDefined();
      expect(deps3.processOfflineQueueUseCase).toBeUndefined();
    });
  });
});
