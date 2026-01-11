/**
 * Unit Tests for AIAssistantFactory
 *
 * Tests the factory that creates and wires up all dependencies
 * for the AI Assistant module.
 */

// Mock tsyringe before any imports
jest.mock('tsyringe', () => ({
  container: {
    resolve: jest.fn(),
  },
  injectable: () => jest.fn(),
  inject: () => jest.fn(),
  singleton: () => jest.fn(),
}));

// Mock all use case modules to prevent import chain issues
jest.mock('@/application/use-cases/ai-assistant/FetchBotsUseCase', () => ({
  FetchBotsUseCase: jest.fn(),
}));
jest.mock('@/application/use-cases/ai-assistant/FetchAIChatSessionsUseCase', () => ({
  FetchAIChatSessionsUseCase: jest.fn(),
}));
jest.mock('@/application/use-cases/ai-assistant/GetAIChatSessionUseCase', () => ({
  GetAIChatSessionUseCase: jest.fn(),
}));
jest.mock('@/application/use-cases/ai-assistant/CreateAIChatSessionUseCase', () => ({
  CreateAIChatSessionUseCase: jest.fn(),
}));
jest.mock('@/application/use-cases/ai-assistant/DeleteAIChatSessionUseCase', () => ({
  DeleteAIChatSessionUseCase: jest.fn(),
}));
jest.mock('@/application/use-cases/ai-assistant/LoadAIChatSessionMessagesUseCase', () => ({
  LoadAIChatSessionMessagesUseCase: jest.fn(),
}));

import {
  createAIAssistantDependencies,
  getDefaultAIAssistantDependencies,
  resetDefaultAIAssistantDependencies,
} from '@/presentation/factory/ai-assistant/AIAssistantFactory';
import { container } from 'tsyringe';
import { FetchBotsUseCase } from '@/application/use-cases/ai-assistant/FetchBotsUseCase';
import { FetchAIChatSessionsUseCase } from '@/application/use-cases/ai-assistant/FetchAIChatSessionsUseCase';
import { GetAIChatSessionUseCase } from '@/application/use-cases/ai-assistant/GetAIChatSessionUseCase';
import { CreateAIChatSessionUseCase } from '@/application/use-cases/ai-assistant/CreateAIChatSessionUseCase';
import { DeleteAIChatSessionUseCase } from '@/application/use-cases/ai-assistant/DeleteAIChatSessionUseCase';
import { LoadAIChatSessionMessagesUseCase } from '@/application/use-cases/ai-assistant/LoadAIChatSessionMessagesUseCase';

describe('AIAssistantFactory', () => {
  // Mock use cases
  const mockFetchBotsUseCase = { execute: jest.fn() };
  const mockFetchSessionsUseCase = { execute: jest.fn() };
  const mockGetSessionUseCase = { execute: jest.fn() };
  const mockCreateSessionUseCase = { execute: jest.fn() };
  const mockDeleteSessionUseCase = { execute: jest.fn() };
  const mockLoadMessagesUseCase = { execute: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    resetDefaultAIAssistantDependencies();

    // Setup container.resolve to return appropriate mocks
    (container.resolve as jest.Mock).mockImplementation(UseCase => {
      if (UseCase === FetchBotsUseCase) return mockFetchBotsUseCase;
      if (UseCase === FetchAIChatSessionsUseCase) return mockFetchSessionsUseCase;
      if (UseCase === GetAIChatSessionUseCase) return mockGetSessionUseCase;
      if (UseCase === CreateAIChatSessionUseCase) return mockCreateSessionUseCase;
      if (UseCase === DeleteAIChatSessionUseCase) return mockDeleteSessionUseCase;
      if (UseCase === LoadAIChatSessionMessagesUseCase) return mockLoadMessagesUseCase;
      return null;
    });
  });

  // ============================================================================
  // createAIAssistantDependencies Tests
  // ============================================================================

  describe('createAIAssistantDependencies', () => {
    it('should return object with all 6 use cases', () => {
      const deps = createAIAssistantDependencies();

      expect(deps.fetchBotsUseCase).toBeDefined();
      expect(deps.fetchSessionsUseCase).toBeDefined();
      expect(deps.getSessionUseCase).toBeDefined();
      expect(deps.createSessionUseCase).toBeDefined();
      expect(deps.deleteSessionUseCase).toBeDefined();
      expect(deps.loadMessagesUseCase).toBeDefined();
    });

    it('should resolve FetchBotsUseCase from container', () => {
      const deps = createAIAssistantDependencies();

      expect(container.resolve).toHaveBeenCalledWith(FetchBotsUseCase);
      expect(deps.fetchBotsUseCase).toBe(mockFetchBotsUseCase);
    });

    it('should resolve FetchAIChatSessionsUseCase from container', () => {
      const deps = createAIAssistantDependencies();

      expect(container.resolve).toHaveBeenCalledWith(FetchAIChatSessionsUseCase);
      expect(deps.fetchSessionsUseCase).toBe(mockFetchSessionsUseCase);
    });

    it('should resolve GetAIChatSessionUseCase from container', () => {
      const deps = createAIAssistantDependencies();

      expect(container.resolve).toHaveBeenCalledWith(GetAIChatSessionUseCase);
      expect(deps.getSessionUseCase).toBe(mockGetSessionUseCase);
    });

    it('should resolve CreateAIChatSessionUseCase from container', () => {
      const deps = createAIAssistantDependencies();

      expect(container.resolve).toHaveBeenCalledWith(CreateAIChatSessionUseCase);
      expect(deps.createSessionUseCase).toBe(mockCreateSessionUseCase);
    });

    it('should resolve DeleteAIChatSessionUseCase from container', () => {
      const deps = createAIAssistantDependencies();

      expect(container.resolve).toHaveBeenCalledWith(DeleteAIChatSessionUseCase);
      expect(deps.deleteSessionUseCase).toBe(mockDeleteSessionUseCase);
    });

    it('should resolve LoadAIChatSessionMessagesUseCase from container', () => {
      const deps = createAIAssistantDependencies();

      expect(container.resolve).toHaveBeenCalledWith(LoadAIChatSessionMessagesUseCase);
      expect(deps.loadMessagesUseCase).toBe(mockLoadMessagesUseCase);
    });
  });

  // ============================================================================
  // getDefaultAIAssistantDependencies Tests - Singleton Pattern
  // ============================================================================

  describe('getDefaultAIAssistantDependencies', () => {
    it('should return singleton instance', () => {
      const deps1 = getDefaultAIAssistantDependencies();
      const deps2 = getDefaultAIAssistantDependencies();

      expect(deps1).toBe(deps2);
    });

    it('should create instance lazily on first call', () => {
      // Before calling, container.resolve should not have been called
      expect(container.resolve).not.toHaveBeenCalled();

      getDefaultAIAssistantDependencies();

      // After calling, container.resolve should have been called for all use cases
      expect(container.resolve).toHaveBeenCalled();
    });

    it('should not call container.resolve on subsequent calls', () => {
      getDefaultAIAssistantDependencies();
      const callCount = (container.resolve as jest.Mock).mock.calls.length;

      getDefaultAIAssistantDependencies();
      getDefaultAIAssistantDependencies();

      // Call count should remain the same
      expect((container.resolve as jest.Mock).mock.calls.length).toBe(callCount);
    });
  });

  // ============================================================================
  // resetDefaultAIAssistantDependencies Tests
  // ============================================================================

  describe('resetDefaultAIAssistantDependencies', () => {
    it('should clear singleton instance', () => {
      const deps1 = getDefaultAIAssistantDependencies();
      resetDefaultAIAssistantDependencies();
      const deps2 = getDefaultAIAssistantDependencies();

      expect(deps1).not.toBe(deps2);
    });

    it('should allow new instance creation after reset', () => {
      getDefaultAIAssistantDependencies();
      resetDefaultAIAssistantDependencies();

      // Clear mock calls before getting new instance
      (container.resolve as jest.Mock).mockClear();

      getDefaultAIAssistantDependencies();

      // Should have called container.resolve again
      expect(container.resolve).toHaveBeenCalled();
    });
  });
});
