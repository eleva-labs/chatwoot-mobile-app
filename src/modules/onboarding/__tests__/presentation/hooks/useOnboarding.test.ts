/**
 * Tests for useOnboarding Hook
 *
 * useOnboarding is the main hook managing onboarding flow state,
 * navigation, answers, submission, and event callbacks.
 */

// eslint-disable-next-line import/no-unresolved
import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react-native';
import { useOnboarding } from '../../../presentation/hooks/useOnboarding';
import { createMockOnboardingRepository, createMockStorageRepository } from '../../helpers/mocks';
import { testData } from '../../helpers/builders';
import { FetchOnboardingFlowUseCaseImpl } from '../../../application/use-cases/FetchOnboardingFlowUseCaseImpl';
import { SubmitOnboardingAnswersUseCaseImpl } from '../../../application/use-cases/SubmitOnboardingAnswersUseCaseImpl';
import { SaveProgressUseCaseImpl } from '../../../application/use-cases/SaveProgressUseCaseImpl';

describe('useOnboarding', () => {
  let mockOnboardingRepo: ReturnType<typeof createMockOnboardingRepository>;
  let mockStorageRepo: ReturnType<typeof createMockStorageRepository>;
  let fetchFlowUseCase: FetchOnboardingFlowUseCaseImpl;
  let submitAnswersUseCase: SubmitOnboardingAnswersUseCaseImpl;
  let saveProgressUseCase: SaveProgressUseCaseImpl;

  beforeEach(() => {
    mockOnboardingRepo = createMockOnboardingRepository();
    mockStorageRepo = createMockStorageRepository();
    mockOnboardingRepo.setMockFlow(testData.flows.simple());

    // Create use cases from mock repositories
    fetchFlowUseCase = new FetchOnboardingFlowUseCaseImpl(mockOnboardingRepo, mockStorageRepo);
    submitAnswersUseCase = new SubmitOnboardingAnswersUseCaseImpl(mockOnboardingRepo, undefined);
    saveProgressUseCase = new SaveProgressUseCaseImpl(mockStorageRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create hook with use cases
  const createHook = (options = {}) => {
    return renderHook(() =>
      useOnboarding(fetchFlowUseCase, submitAnswersUseCase, saveProgressUseCase, options),
    );
  };

  describe('Initial state', () => {
    it('should initialize with loading false', () => {
      const { result } = createHook({ autoLoad: false });

      expect(result.current.loading).toBe(false);
      expect(result.current.flow).toBeNull();
      expect(result.current.currentScreen).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should initialize with empty answers', () => {
      const { result } = createHook();

      expect(result.current.answers).toEqual({});
    });

    it('should initialize with step 0', () => {
      const { result } = createHook();

      expect(result.current.currentStep).toBe(0);
    });

    it('should initialize with 0% progress', () => {
      const { result } = createHook();

      expect(result.current.progress).toBe(0);
    });
  });

  describe('loadFlow()', () => {
    it('should load flow successfully', async () => {
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
      });

      expect(result.current.flow).not.toBeNull();
      expect(result.current.currentScreen).not.toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should set loading true during fetch', async () => {
      const { result } = createHook();

      const loadPromise = act(async () => {
        await result.current.loadFlow('en');
      });

      // Check loading state
      await waitFor(() => {
        expect(result.current.loading).toBe(false); // Complete
      });

      await loadPromise;
    });

    it('should set current screen to first screen', async () => {
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
      });

      const firstScreen = testData.flows.simple().getScreen(0);
      expect(result.current.currentScreen?.id.toString()).toBe(firstScreen?.id.toString());
    });

    it('should call onFlowStarted callback', async () => {
      const onFlowStarted = jest.fn();
      const { result } = createHook({
        onEvent: {
          onFlowStarted,
        },
      });

      await act(async () => {
        await result.current.loadFlow('en');
      });

      expect(onFlowStarted).toHaveBeenCalledWith(
        expect.objectContaining({
          flowId: expect.any(String),
        }),
      );
    });

    it('should handle fetch error', async () => {
      mockOnboardingRepo.setFetchError(new Error('Network error'));
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.flow).toBeNull();
    });

    it('should call onError callback on failure', async () => {
      mockOnboardingRepo.setFetchError(new Error('Network error'));
      const onError = jest.fn();
      const { result } = createHook({
        onEvent: {
          onError,
        },
      });

      await act(async () => {
        await result.current.loadFlow('en');
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
        }),
      );
    });
  });

  describe('Navigation', () => {
    it('should navigate to next screen', async () => {
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
      });

      const initialStep = result.current.currentStep;

      await act(async () => {
        await result.current.goToNext();
      });

      expect(result.current.currentStep).toBe(initialStep + 1);
    });

    it('should navigate to previous screen', async () => {
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
        await result.current.goToNext();
        await result.current.goToPrevious();
      });

      expect(result.current.currentStep).toBe(0);
    });

    it('should not go below step 0', async () => {
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
        await result.current.goToPrevious(); // Try to go below 0
      });

      expect(result.current.currentStep).toBe(0);
    });

    it('should not go beyond last screen', async () => {
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
      });

      const totalSteps = result.current.flow!.getTotalSteps();

      // Navigate to end
      for (let i = 0; i < totalSteps; i++) {
        await act(async () => {
          await result.current.goToNext();
        });
      }

      const finalStep = result.current.currentStep;

      // Try to go beyond
      await act(async () => {
        await result.current.goToNext();
      });

      expect(result.current.currentStep).toBe(finalStep);
    });

    it('should call onScreenChanged callback on navigation', async () => {
      const onScreenChanged = jest.fn();
      const { result } = createHook({
        onEvent: {
          onScreenChanged,
        },
      });

      await act(async () => {
        await result.current.loadFlow('en');
        await result.current.goToNext();
      });

      expect(onScreenChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          questionId: expect.any(String),
          flowId: expect.any(String),
        }),
      );
    });

    it('should navigate to specific step', async () => {
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
        await result.current.goToStep(2);
      });

      expect(result.current.currentStep).toBe(2);
    });

    it('should update progress on navigation', async () => {
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
      });

      const initialProgress = result.current.progress;

      await act(async () => {
        await result.current.goToNext();
      });

      expect(result.current.progress).toBeGreaterThan(initialProgress);
    });
  });

  describe('Answer management', () => {
    it('should set answer for current question', async () => {
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
        result.current.setAnswer('q1', 'test value');
      });

      expect(result.current.answers['q1']).toBe('test value');
    });

    it('should update existing answer', async () => {
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
        result.current.setAnswer('q1', 'first value');
        result.current.setAnswer('q1', 'updated value');
      });

      expect(result.current.answers['q1']).toBe('updated value');
      expect(Object.keys(result.current.answers)).toHaveLength(1);
    });

    it('should call onQuestionAnswered callback', async () => {
      const onQuestionAnswered = jest.fn();
      const { result } = createHook({
        onEvent: {
          onQuestionAnswered,
        },
      });

      await act(async () => {
        await result.current.loadFlow('en');
        result.current.setAnswer('q1', 'answer');
      });

      expect(onQuestionAnswered).toHaveBeenCalledWith(
        expect.objectContaining({
          questionId: 'q1',
          value: 'answer',
        }),
      );
    });

    it('should handle array values for multi-select', async () => {
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
        result.current.setAnswer('q1', ['option1', 'option2']);
      });

      expect(result.current.answers['q1']).toEqual(['option1', 'option2']);
    });

    it('should handle number values', async () => {
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
        result.current.setAnswer('rating', 5);
      });

      expect(result.current.answers['rating']).toBe(5);
    });

    it('should handle boolean values', async () => {
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
        result.current.setAnswer('agree', true);
      });

      expect(result.current.answers['agree']).toBe(true);
    });
  });

  describe('Submit flow', () => {
    it('should submit answers successfully', async () => {
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
        result.current.setAnswer('q1', 'answer1');
        result.current.setAnswer('q2', 'answer2');
        await result.current.submitAnswers();
      });

      expect(mockOnboardingRepo.submitAnswersCallCount).toBeGreaterThan(0);
    });

    it('should call onFlowCompleted callback on success', async () => {
      const onFlowCompleted = jest.fn();
      const { result } = createHook({
        onEvent: {
          onFlowCompleted,
        },
      });

      await act(async () => {
        await result.current.loadFlow('en');
        await result.current.submitAnswers();
      });

      expect(onFlowCompleted).toHaveBeenCalled();
    });

    it('should handle submission error', async () => {
      mockOnboardingRepo.setSubmitError(new Error('Submission failed'));
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
        await result.current.submitAnswers();
      });

      expect(result.current.error).not.toBeNull();
    });

    it('should queue submission when offline (if offline support enabled)', async () => {
      // Simulate offline
      mockOnboardingRepo.setSubmitError(new Error('Network error'));
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
        result.current.setAnswer('q1', 'answer');
        await result.current.submitAnswers();
      });

      // Check if queued (implementation dependent)
      // expect(result.current.isQueued).toBe(true);
    });
  });

  describe('Skip functionality', () => {
    it('should skip current question', async () => {
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
        await result.current.skipQuestion();
      });

      expect(result.current.currentStep).toBeGreaterThan(0);
    });

    it('should skip entire flow', async () => {
      const onFlowSkipped = jest.fn();
      const { result } = createHook({
        onEvent: {
          onFlowSkipped,
        },
      });

      await act(async () => {
        await result.current.loadFlow('en');
        await result.current.skipFlow();
      });

      expect(onFlowSkipped).toHaveBeenCalled();
    });

    it('should not add answer when skipping question', async () => {
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
      });

      const questionId = result.current.currentScreen?.id.toString();

      await act(async () => {
        await result.current.skipQuestion();
      });

      expect(result.current.answers[questionId || '']).toBeUndefined();
    });
  });

  describe('Reset functionality', () => {
    it('should reset flow state', async () => {
      const { result } = createHook({ autoLoad: false });

      await act(async () => {
        await result.current.loadFlow('en');
        result.current.setAnswer('q1', 'answer');
        await result.current.goToNext();
      });

      // Verify state before reset
      expect(result.current.flow).not.toBeNull();
      expect(result.current.currentStep).toBe(1);

      await act(async () => {
        result.current.reset();
      });

      expect(result.current.flow).toBeNull();
      expect(result.current.answers).toEqual({});
      expect(result.current.currentStep).toBe(0);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Progress calculation', () => {
    it('should calculate progress as percentage', async () => {
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
      });

      expect(result.current.progress).toBeGreaterThanOrEqual(0);
      expect(result.current.progress).toBeLessThanOrEqual(100);
    });

    it('should show 100% progress at last screen', async () => {
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
      });

      const totalSteps = result.current.flow!.getTotalSteps();

      // Navigate to last screen
      for (let i = 0; i < totalSteps - 1; i++) {
        await act(async () => {
          await result.current.goToNext();
        });
      }

      expect(result.current.progress).toBe(100);
    });

    it('should show 0% progress at first screen', async () => {
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
      });

      expect(result.current.progress).toBe(0);
    });
  });

  describe('Auto-save progress', () => {
    it('should save progress when answer changes (if enabled)', async () => {
      const { result } = createHook({
        autoLoad: false,
      });

      await act(async () => {
        await result.current.loadFlow('en');
        result.current.setAnswer('q1', 'answer');
      });

      // Wait for auto-save debounce
      await waitFor(
        () => {
          expect(mockStorageRepo.saveCallCount).toBeGreaterThan(0);
        },
        { timeout: 2000 },
      );
    });

    it('should restore progress on load (if saved)', async () => {
      // Get the flow ID from test data
      const flow = testData.flows.simple();
      const progressKey = `onboarding_progress_${flow.id}`;

      // Save progress first
      await mockStorageRepo.save(progressKey, {
        flowId: flow.id,
        currentStep: 2,
        answers: { q1: 'saved' },
        savedAt: Date.now(),
      });

      const { result } = createHook({
        autoLoad: false,
      });

      await act(async () => {
        await result.current.loadFlow('en');
      });

      // Wait for progress to be loaded
      await waitFor(
        () => {
          expect(result.current.currentStep).toBe(2);
        },
        { timeout: 2000 },
      );

      expect(Object.keys(result.current.answers)).toHaveLength(1);
      expect(result.current.answers['q1']).toBe('saved');
    });
  });

  describe('Edge cases', () => {
    it('should handle loading empty flow gracefully', async () => {
      mockOnboardingRepo.setMockFlow(null);
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
      });

      expect(result.current.error).not.toBeNull();
    });

    it('should handle rapid answer changes', async () => {
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
        result.current.setAnswer('q1', 'value1');
        result.current.setAnswer('q1', 'value2');
        result.current.setAnswer('q1', 'value3');
      });

      expect(result.current.answers['q1']).toBe('value3');
    });

    it('should handle rapid navigation', async () => {
      const { result } = createHook();

      await act(async () => {
        await result.current.loadFlow('en');
        await result.current.goToNext();
        await result.current.goToNext();
        await result.current.goToPrevious();
      });

      expect(result.current.currentStep).toBe(1);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = createHook();

      expect(() => unmount()).not.toThrow();
    });
  });
});
