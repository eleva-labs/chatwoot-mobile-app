import { useState, useEffect, useCallback, useRef } from 'react';
import { OnboardingFlow } from '../../domain/entities/OnboardingFlow';
import { Screen } from '../../domain/entities/Screen';
import { QuestionId } from '../../domain/entities/QuestionId';
import type { IFetchOnboardingFlowUseCase } from '../../domain/use-cases/IFetchOnboardingFlowUseCase';
import type { ISubmitOnboardingAnswersUseCase } from '../../domain/use-cases/ISubmitOnboardingAnswersUseCase';
import type { ISaveProgressUseCase } from '../../domain/use-cases/ISaveProgressUseCase';
import { ConditionalLogicService } from '../../domain/services/ConditionalLogicService';
import type { AnswerValue, Answers } from '../../domain/common';
import type { OnboardingEventCallbacks } from '../events/OnboardingEvents';
import { Result } from '../../domain/entities/Result';

export interface UseOnboardingOptions {
  locale?: string;
  flowId?: string;
  autoLoad?: boolean;
  onEvent?: OnboardingEventCallbacks;
}

export interface UseOnboardingReturn {
  // State
  flow: OnboardingFlow | null;
  currentScreen: Screen | null;
  currentStep: number;
  answers: Answers;
  loading: boolean;
  error: Error | null;
  progress: number;

  // Actions
  loadFlow: (locale?: string) => Promise<void>;
  goToNext: () => void;
  goToPrevious: () => void;
  goToStep: (step: number) => void;
  setAnswer: (questionId: string, value: unknown) => void;
  submitAnswers: () => Promise<void>;
  skipQuestion: (reason?: string) => void;
  skipFlow: (reason?: string) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Main hook for onboarding flow management
 */
export function useOnboarding(
  fetchFlowUseCase: IFetchOnboardingFlowUseCase,
  submitAnswersUseCase: ISubmitOnboardingAnswersUseCase,
  saveProgressUseCase: ISaveProgressUseCase,
  options: UseOnboardingOptions = {},
): UseOnboardingReturn {
  const { locale = 'en', flowId, autoLoad = true, onEvent } = options;

  const [flow, setFlow] = useState<OnboardingFlow | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const flowIdRef = useRef<string | null>(flowId || null);

  // Update flowId ref when flow changes
  useEffect(() => {
    if (flow) {
      flowIdRef.current = flow.id;
    }
  }, [flow]);

  // Load onboarding flow
  const loadFlow: (locale?: string) => Promise<void> = useCallback(
    async (targetLocale?: string) => {
      setLoading(true);
      setError(null);

      const result = await fetchFlowUseCase.execute(targetLocale || locale);

      result.match(
        loadedFlow => {
          setFlow(loadedFlow);
          setCurrentStep(0);
          setAnswers({});
          setLoading(false);

          // Update flowId ref
          flowIdRef.current = loadedFlow.id;

          // Emit flow started event
          onEvent?.onFlowStarted?.({
            flowId: loadedFlow.id,
            flowVersion: loadedFlow.version.toString(),
            locale: loadedFlow.locale.toString(),
            totalScreens: loadedFlow.getTotalSteps(),
          });

          // Try to load saved progress
          saveProgressUseCase.loadProgress(loadedFlow.id).then(progressResult => {
            if (progressResult.isSuccess && progressResult.getValue()) {
              const progress = progressResult.getValue()!;
              setCurrentStep(progress.currentStep);
              setAnswers(progress.answers);
            }
          });
        },
        err => {
          setError(err);
          setLoading(false);
          onEvent?.onError?.({
            error: err,
            context: 'loadFlow',
            flowId: flowIdRef.current || undefined,
          });
        },
      );
    },
    [fetchFlowUseCase, locale, onEvent, saveProgressUseCase],
  );

  useEffect(() => {
    if (autoLoad && !flow) {
      loadFlow(locale);
    }
  }, [autoLoad, flow, loadFlow, locale]);

  // Get current visible screen based on conditional logic
  const getCurrentVisibleScreen: () => Screen | null = useCallback(() => {
    if (!flow) return null;

    const visibleScreens: Screen[] = flow.getVisibleScreens(answers, (screen, currentAnswers) =>
      ConditionalLogicService.shouldShowScreen(screen, currentAnswers),
    );

    if (visibleScreens.length === 0) return null;

    // Find the screen at current step index in visible screens
    let screenIndex: number = 0;

    for (let i = 0; i < flow.getTotalSteps(); i++) {
      const screen = flow.getScreen(i);
      if (!screen) continue;

      if (ConditionalLogicService.shouldShowScreen(screen, answers)) {
        if (screenIndex === currentStep) {
          return screen;
        }
      }
      screenIndex++;
    }

    return visibleScreens[currentStep] || null;
  }, [flow, answers, currentStep]);

  const currentScreen: Screen | null = getCurrentVisibleScreen();

  // Calculate progress
  const progress: number = flow ? flow.calculateProgress(currentStep) : 0;

  // Set answer for a question
  const setAnswer: (questionId: string, value: unknown) => void = useCallback(
    (questionId: string, value: unknown) => {
      setAnswers(prev => {
        const newAnswers: Answers = {
          ...prev,
          [questionId]: value as AnswerValue,
        };

        // Emit question answered event
        if (flow) {
          const screen = flow.findScreenById(QuestionId.create(questionId));

          onEvent?.onQuestionAnswered?.({
            questionId,
            questionType: screen?.type || 'unknown',
            value,
            flowId: flow.id,
            currentStep,
            totalSteps: flow.getTotalSteps(),
          });
        }

        return newAnswers;
      });

      // Auto-save progress
      if (flowIdRef.current) {
        saveProgressUseCase.execute(flowIdRef.current, currentStep, {
          ...answers,
          [questionId]: value as AnswerValue,
        });
      }
    },
    [answers, currentStep, flow, onEvent, saveProgressUseCase],
  );

  // Navigate to next step
  const goToNext: () => void = useCallback(() => {
    if (!flow) return;

    const nextScreen: Screen | null = flow.getNextVisibleScreen(
      currentStep,
      answers,
      (screen, currentAnswers) => ConditionalLogicService.shouldShowScreen(screen, currentAnswers),
    );

    if (nextScreen) {
      const nextIndex: number = flow.getScreenIndex(nextScreen.id);
      if (nextIndex >= 0) {
        setCurrentStep(nextIndex);

        onEvent?.onScreenChanged?.({
          fromStep: currentStep,
          toStep: nextIndex,
          questionId: nextScreen.id.toString(),
          flowId: flow.id,
        });
      }
    }
  }, [flow, currentStep, answers, onEvent]);

  // Navigate to previous step
  const goToPrevious: () => void = useCallback(() => {
    if (!flow) return;

    const prevScreen: Screen | null = flow.getPreviousVisibleScreen(
      currentStep,
      answers,
      (screen, currentAnswers) => ConditionalLogicService.shouldShowScreen(screen, currentAnswers),
    );

    if (prevScreen) {
      const prevIndex: number = flow.getScreenIndex(prevScreen.id);
      if (prevIndex >= 0) {
        setCurrentStep(prevIndex);

        onEvent?.onScreenChanged?.({
          fromStep: currentStep,
          toStep: prevIndex,
          questionId: prevScreen.id.toString(),
          flowId: flow.id,
        });
      }
    }
  }, [flow, currentStep, answers, onEvent]);

  // Go to specific step
  const goToStep: (step: number) => void = useCallback(
    (step: number) => {
      if (!flow || step < 0 || step >= flow.getTotalSteps()) return;

      setCurrentStep(step);

      const screen: Screen | null = flow.getScreen(step);
      if (screen) {
        onEvent?.onScreenChanged?.({
          fromStep: currentStep,
          toStep: step,
          questionId: screen.id.toString(),
          flowId: flow.id,
        });
      }
    },
    [flow, currentStep, onEvent],
  );

  // Skip current question
  const skipQuestion: (reason?: string) => void = useCallback(
    (reason?: string) => {
      if (!currentScreen) return;

      onEvent?.onQuestionSkipped?.({
        questionId: currentScreen.id.toString(),
        questionType: currentScreen.type,
        flowId: flow?.id || '',
        currentStep,
        reason,
      });

      goToNext();
    },
    [currentScreen, flow, currentStep, goToNext, onEvent],
  );

  // Skip entire flow
  const skipFlow: (reason?: string) => void = useCallback(
    (reason?: string) => {
      if (!flow) return;

      onEvent?.onFlowSkipped?.({
        flowId: flow.id,
        currentStep,
        reason,
      });

      // Reset state
      setFlow(null);
      setCurrentStep(0);
      setAnswers({});
    },
    [flow, currentStep, onEvent],
  );

  // Submit all answers
  const submitAnswers: () => Promise<void> = useCallback(async () => {
    if (!flow) return;

    setLoading(true);
    setError(null);

    const result: Result<void, Error> = await submitAnswersUseCase.execute(flow.id, answers);

    result.match(
      () => {
        setLoading(false);

        onEvent?.onFlowCompleted?.({
          flowId: flow.id,
          totalSteps: flow.getTotalSteps(),
          answers,
          completedAt: new Date(),
        });

        // Clear saved progress
        if (flowIdRef.current) {
          saveProgressUseCase.clearProgress(flowIdRef.current);
        }
      },
      err => {
        setError(err);
        setLoading(false);
        onEvent?.onError?.({
          error: err,
          context: 'submitAnswers',
          flowId: flow.id,
        });
      },
    );
  }, [flow, answers, submitAnswersUseCase, onEvent, saveProgressUseCase]);

  // Clear error
  const clearError: () => void = useCallback(() => {
    setError(null);
  }, []);

  // Reset state
  const reset: () => void = useCallback(() => {
    setFlow(null);
    setCurrentStep(0);
    setAnswers({});
    setError(null);
    setLoading(false);
    flowIdRef.current = null;
  }, []);

  return {
    // State
    flow,
    currentScreen,
    currentStep,
    answers,
    loading,
    error,
    progress,

    // Actions
    loadFlow,
    goToNext,
    goToPrevious,
    goToStep,
    setAnswer,
    submitAnswers,
    skipQuestion,
    skipFlow,
    clearError,
    reset,
  };
}
