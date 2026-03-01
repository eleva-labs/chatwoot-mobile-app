import React, { useMemo, useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Button } from '@/components-next/button/Button';
import { useOnboarding } from '../hooks/useOnboarding';
import { useValidation } from '../hooks/useValidation';
import { useNetworkState } from '../hooks/useNetworkState';
import { ProgressBar } from './ProgressBar';
import { QuestionRenderer } from './QuestionRenderer';
import { NavigationFooter } from './NavigationFooter';
import type { IFetchOnboardingFlowUseCase } from '../../domain/use-cases/IFetchOnboardingFlowUseCase';
import type { ISubmitOnboardingAnswersUseCase } from '../../domain/use-cases/ISubmitOnboardingAnswersUseCase';
import type { ISaveProgressUseCase } from '../../domain/use-cases/ISaveProgressUseCase';
import type { IValidateAnswerUseCase } from '../../domain/use-cases/IValidateAnswerUseCase';
import type { IProcessOfflineQueueUseCase } from '../../domain/use-cases/IProcessOfflineQueueUseCase';
import type { UseOnboardingOptions } from '../hooks/useOnboarding';

interface OnboardingContainerProps extends UseOnboardingOptions {
  fetchFlowUseCase: IFetchOnboardingFlowUseCase;
  submitAnswersUseCase: ISubmitOnboardingAnswersUseCase;
  saveProgressUseCase: ISaveProgressUseCase;
  validateAnswerUseCase: IValidateAnswerUseCase;
  processOfflineQueueUseCase?: IProcessOfflineQueueUseCase;
  onComplete?: () => void;
  onSkip?: () => void;
}

/**
 * Main Onboarding Container Component
 *
 * Orchestrates the entire onboarding flow UI.
 */
export function OnboardingContainer({
  fetchFlowUseCase,
  submitAnswersUseCase,
  saveProgressUseCase,
  validateAnswerUseCase,
  processOfflineQueueUseCase,
  locale = 'en',
  autoLoad = true,
  onEvent,
  onComplete,
  onSkip,
}: OnboardingContainerProps) {
  const themedStyles = useThemedStyles();
  const networkState = useNetworkState();

  // Initialize hooks
  const onboarding = useOnboarding(fetchFlowUseCase, submitAnswersUseCase, saveProgressUseCase, {
    locale,
    autoLoad,
    onEvent,
  });

  const validation = useValidation(validateAnswerUseCase);

  // Process offline queue when coming back online
  useEffect(() => {
    if (networkState.isConnected && processOfflineQueueUseCase && !networkState.isLoading) {
      processOfflineQueueUseCase.execute().then(result => {
        if (result.isSuccess && result.getValue() > 0) {
          // Show notification that queued items were processed
          console.log(`Processed ${result.getValue()} queued submission(s)`);
        }
      });
    }
  }, [networkState.isConnected, processOfflineQueueUseCase, networkState.isLoading]);

  // Check if we can proceed to next step
  const canGoNext: boolean = useMemo(() => {
    if (!onboarding.currentScreen) return false;

    const currentAnswer = onboarding.answers[onboarding.currentScreen.id.toString()];
    const hasAnswer = currentAnswer !== null && currentAnswer !== undefined && currentAnswer !== '';

    // If required, must have answer
    if (onboarding.currentScreen.isRequired()) {
      return hasAnswer && !validation.getError(onboarding.currentScreen.id.toString());
    }

    // If not required, can always proceed
    return true;
  }, [onboarding.currentScreen, onboarding.answers, validation]);

  const isLastStep: boolean = useMemo(() => {
    if (!onboarding.flow || !onboarding.currentScreen) return false;

    const totalSteps = onboarding.flow.getTotalSteps();
    return onboarding.currentStep >= totalSteps - 1;
  }, [onboarding.flow, onboarding.currentScreen, onboarding.currentStep]);

  // Handle next button
  const handleNext: () => Promise<void> = async () => {
    if (!onboarding.currentScreen) return;

    const questionId = onboarding.currentScreen.id.toString();
    const value = onboarding.answers[questionId] || null;

    // Validate if there's a validation rule
    if (onboarding.currentScreen.validation) {
      const isValid = await validation.validate(
        questionId,
        value,
        onboarding.currentScreen.validation,
        onboarding.currentScreen.type,
      );

      if (!isValid) {
        return; // Don't proceed if validation fails
      }
    }

    onboarding.goToNext();
  };

  // Handle submit
  const handleSubmit: () => Promise<void> = async () => {
    if (!onboarding.flow) return;

    // Validate all required fields before submitting
    const requiredScreens = onboarding.flow.screens.filter(screen => screen.isRequired());
    let allValid = true;

    for (const screen of requiredScreens) {
      const questionId = screen.id.toString();
      const value = onboarding.answers[questionId];

      if (screen.validation) {
        const isValid = await validation.validate(
          questionId,
          value,
          screen.validation,
          screen.type,
        );

        if (!isValid) {
          allValid = false;
        }
      }
    }

    if (!allValid) {
      return; // Don't submit if validation fails
    }

    await onboarding.submitAnswers();
    onComplete?.();
  };

  // Loading state
  if (onboarding.loading && !onboarding.flow) {
    return (
      <SafeAreaView style={themedStyles.style('flex-1 bg-solid-1 items-center justify-center')}>
        <ActivityIndicator size="large" color={themedStyles.color('bg-brand-600')} />
        <Text style={themedStyles.style('text-slate-10 mt-4')}>Loading onboarding...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (onboarding.error && !onboarding.flow) {
    return (
      <SafeAreaView style={themedStyles.style('flex-1 bg-solid-1 items-center justify-center p-4')}>
        <Text style={themedStyles.style('text-ruby-500 text-lg font-semibold mb-2')}>Error</Text>
        <Text style={themedStyles.style('text-slate-10 text-center mb-4')}>
          {onboarding.error.message}
        </Text>
        <Button text="Retry" variant="primary" handlePress={() => onboarding.loadFlow(locale)} />
      </SafeAreaView>
    );
  }

  // No flow state
  if (!onboarding.flow || !onboarding.currentScreen) {
    return null;
  }

  const currentAnswer = onboarding.answers[onboarding.currentScreen.id.toString()] || null;
  const error = validation.getError(onboarding.currentScreen.id.toString());

  return (
    <SafeAreaView style={themedStyles.style('flex-1 bg-solid-1')}>
      <View style={themedStyles.style('flex-1')}>
        {/* Offline Indicator */}
        {networkState.isOffline && (
          <View style={themedStyles.style('bg-yellow-100 border-b border-yellow-300 px-4 py-2')}>
            <Text style={themedStyles.style('text-yellow-800 text-sm text-center')}>
              No internet connection. Your answers will be saved and submitted when you come back
              online.
            </Text>
          </View>
        )}

        {/* Progress Bar */}
        <View style={themedStyles.style('px-4 pt-4')}>
          <ProgressBar progress={onboarding.progress} showPercentage={false} />
        </View>

        {/* Question Renderer */}
        <QuestionRenderer
          screen={onboarding.currentScreen}
          value={currentAnswer}
          onChange={value => {
            onboarding.setAnswer(onboarding.currentScreen!.id.toString(), value);
            validation.clearError(onboarding.currentScreen!.id.toString());
          }}
          error={error}
          answers={onboarding.answers}
        />

        {/* Navigation Footer */}
        <NavigationFooter
          currentScreen={onboarding.currentScreen}
          canGoNext={canGoNext}
          canGoPrevious={onboarding.currentStep > 0}
          isLastStep={isLastStep}
          onNext={handleNext}
          onPrevious={onboarding.goToPrevious}
          locale={locale}
          onSkip={() => {
            onboarding.skipQuestion();
            onSkip?.();
          }}
          onSubmit={handleSubmit}
          loading={onboarding.loading}
        />
      </View>
    </SafeAreaView>
  );
}
