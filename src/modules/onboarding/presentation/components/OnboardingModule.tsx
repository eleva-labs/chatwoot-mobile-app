/**
 * Onboarding Module - High-Level Component
 *
 * This is the main entry point for users. It handles all internal complexity
 * and only requires configuration props.
 */

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
import { Screen } from '../../domain/entities/Screen';
import {
  createOnboardingDependencies,
  OnboardingDependencies,
  type OnboardingFactoryOptions,
} from '../factory/OnboardingFactory';
import type { OnboardingEventCallbacks } from '../events/OnboardingEvents';
import {
  t as translateOnboarding,
  setLocale as setOnboardingLocale,
  TranslationKeys,
} from '../i18n';

export interface OnboardingModuleProps {
  /**
   * Locale for the onboarding flow (e.g., 'en', 'es', 'pt')
   * @default 'en'
   */
  locale?: string;

  /**
   * Automatically load the flow when component mounts
   * @default true
   */
  autoLoad?: boolean;

  /**
   * Event callbacks for analytics and tracking
   */
  onEvent?: OnboardingEventCallbacks;

  /**
   * Called when onboarding is completed
   */
  onComplete?: () => void;

  /**
   * Called when onboarding is skipped
   */
  onSkip?: () => void;

  /**
   * Custom translation overrides
   * The module has its own built-in translations for en, es, and pt.
   * You can override any translation by providing custom values.
   * @example { loading: 'Custom loading message...' }
   */
  translations?: Partial<{
    loading: string;
    loadingError: string;
    next: string;
    previous: string;
    skip: string;
    submit: string;
    retry: string;
    errorTitle: string;
    genericError: string;
    offlineIndicator: string;
    requiredField: string;
    invalidInput: string;
    progressLabel: string;
  }>;

  /**
   * Advanced options for customizing dependencies
   * Most users won't need this - only for advanced use cases
   */
  factoryOptions?: OnboardingFactoryOptions;
}

/**
 * Onboarding Module Component
 *
 * High-level component that handles all internal complexity.
 * Users only need to provide configuration props.
 *
 * @example
 * ```tsx
 * <OnboardingModule
 *   locale="en"
 *   onEvent={{
 *     onFlowCompleted: (event) => console.log('Completed!', event),
 *   }}
 *   onComplete={() => navigate('Home')}
 * />
 * ```
 */
export function OnboardingModule({
  locale = 'en',
  autoLoad = true,
  onEvent,
  onComplete,
  onSkip,
  translations: customTranslations,
  factoryOptions,
}: OnboardingModuleProps) {
  const themedStyles = useThemedStyles();
  const networkState = useNetworkState();

  // Set the module's locale when it changes
  useEffect(() => {
    setOnboardingLocale(locale);
  }, [locale]);

  // Helper function to get translation with override support
  const t = (key: string) => {
    // Check if there's a custom translation override
    if (customTranslations && key in customTranslations) {
      return customTranslations[key as keyof typeof customTranslations] || '';
    }
    // Otherwise use the module's built-in translations
    return translateOnboarding(key, locale);
  };

  // Create dependencies once using the factory
  const dependencies: OnboardingDependencies = useMemo(
    () => createOnboardingDependencies(factoryOptions),
    // Only recreate if factoryOptions change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(factoryOptions)],
  );

  // Initialize hooks
  const onboarding = useOnboarding(
    dependencies.fetchFlowUseCase,
    dependencies.submitAnswersUseCase,
    dependencies.saveProgressUseCase,
    {
      locale,
      autoLoad,
      onEvent,
    },
  );

  const validation = useValidation(dependencies.validateAnswerUseCase);

  // Process offline queue when coming back online
  React.useEffect(() => {
    if (
      networkState.isConnected &&
      dependencies.processOfflineQueueUseCase &&
      !networkState.isLoading
    ) {
      dependencies.processOfflineQueueUseCase.execute().then(result => {
        if (result.isSuccess && result.getValue() > 0) {
          console.log(`Processed ${result.getValue()} queued submission(s)`);
        }
      });
    }
  }, [networkState.isConnected, dependencies.processOfflineQueueUseCase, networkState.isLoading]);

  // Check if we can proceed to next step
  const canGoNext: boolean = useMemo(() => {
    if (!onboarding.currentScreen) return false;

    const currentAnswer: unknown = onboarding.answers[onboarding.currentScreen.id.toString()];
    const hasAnswer: boolean =
      currentAnswer !== null && currentAnswer !== undefined && currentAnswer !== '';

    // If required, must have answer
    if (onboarding.currentScreen.isRequired()) {
      return hasAnswer && !validation.getError(onboarding.currentScreen.id.toString());
    }

    // If not required, can always proceed
    return true;
  }, [onboarding.currentScreen, onboarding.answers, validation]);

  const isLastStep: boolean = useMemo(() => {
    if (!onboarding.flow || !onboarding.currentScreen) return false;

    const totalSteps: number = onboarding.flow.getTotalSteps();
    return onboarding.currentStep >= totalSteps - 1;
  }, [onboarding.flow, onboarding.currentScreen, onboarding.currentStep]);

  // Handle next button
  const handleNext: () => Promise<void> = async () => {
    if (!onboarding.currentScreen) return;

    const questionId: string = onboarding.currentScreen.id.toString();
    const value: unknown = onboarding.answers[questionId] || null;

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
    const requiredScreens: Screen[] = onboarding.flow.screens.filter(screen => screen.isRequired());
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
        <Text style={themedStyles.style('text-slate-10 mt-4')}>{t(TranslationKeys.LOADING)}</Text>
      </SafeAreaView>
    );
  }

  // Error state
  // TODO: Replace with a repository pattern (S3Repository / FileRepository) that falls back
  // to a local bundled flow JSON when running locally, instead of always requiring S3.
  if (onboarding.error && !onboarding.flow) {
    return (
      <SafeAreaView style={themedStyles.style('flex-1 bg-solid-1 items-center justify-center p-4')}>
        <Text style={themedStyles.style('text-ruby-500 text-lg font-semibold mb-2')}>
          {t(TranslationKeys.ERROR_TITLE)}
        </Text>
        <Text style={themedStyles.style('text-slate-10 text-center mb-4')}>
          {onboarding.error.message}
        </Text>
        <View style={themedStyles.style('gap-3 w-full items-center')}>
          <Button
            text={t(TranslationKeys.RETRY)}
            variant="primary"
            handlePress={() => onboarding.loadFlow(locale)}
          />
          {onSkip && (
            <Button text={t(TranslationKeys.SKIP)} variant="secondary" handlePress={onSkip} />
          )}
        </View>
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
              {t(TranslationKeys.OFFLINE_INDICATOR)}
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
        />

        {/* Navigation Footer */}
        <NavigationFooter
          currentScreen={onboarding.currentScreen}
          canGoNext={canGoNext}
          canGoPrevious={onboarding.currentStep > 0}
          isLastStep={isLastStep}
          onNext={handleNext}
          onPrevious={onboarding.goToPrevious}
          onSkip={onboarding.skipQuestion}
          onSubmit={handleSubmit}
          loading={onboarding.loading}
          locale={locale}
          translations={customTranslations}
        />
      </View>
    </SafeAreaView>
  );
}
