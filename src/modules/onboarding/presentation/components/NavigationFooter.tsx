import React from 'react';
import { View } from 'react-native';
import { Button } from '@/components-next/button/Button';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Screen } from '../../domain/entities/Screen';
import { t as translateOnboarding, TranslationKeys } from '../../i18n';

interface NavigationFooterProps {
  currentScreen: Screen | null;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isLastStep: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onSubmit?: () => void;
  loading?: boolean;
  locale: string;
  translations?: Partial<{
    next: string;
    previous: string;
    skip: string;
    submit: string;
  }>;
}

/**
 * Navigation Footer Component
 *
 * Displays navigation buttons (Previous, Next, Skip, Submit).
 */
export function NavigationFooter({
  currentScreen,
  canGoNext,
  canGoPrevious,
  isLastStep,
  onNext,
  onPrevious,
  onSkip,
  onSubmit,
  loading = false,
  locale,
  translations: customTranslations,
}: NavigationFooterProps) {
  const themedStyles = useThemedStyles();

  // Helper function to get translation with override support
  const t = (key: string) => {
    // Check if there's a custom translation override
    if (customTranslations && key in customTranslations) {
      return customTranslations[key as keyof typeof customTranslations] || '';
    }
    // Otherwise use the module's built-in translations
    return translateOnboarding(key, locale);
  };

  const isSkippable: boolean = Boolean(currentScreen?.isSkippable()) ?? false;
  // Use custom translation if provided, otherwise use screen's skip text, otherwise use default
  const skipButtonText: string =
    customTranslations?.skip || currentScreen?.getSkipButtonText() || t(TranslationKeys.SKIP);

  return (
    <View style={themedStyles.style('w-full px-4 py-4 border-t border-gray-200 bg-white')}>
      <View style={themedStyles.style('flex-row gap-3 justify-between items-center')}>
        {/* Previous Button */}
        {canGoPrevious && (
          <View style={themedStyles.style('flex-1')}>
            <Button
              text={t(TranslationKeys.PREVIOUS)}
              variant="secondary"
              handlePress={onPrevious}
              disabled={loading}
            />
          </View>
        )}

        {/* Skip Button */}
        {isSkippable && !isLastStep && (
          <View style={themedStyles.style('flex-1')}>
            <Button
              text={skipButtonText}
              variant="secondary"
              handlePress={onSkip}
              disabled={loading}
            />
          </View>
        )}

        {/* Next/Submit Button */}
        <View style={themedStyles.style('flex-1')}>
          {isLastStep ? (
            <Button
              text={t(TranslationKeys.SUBMIT)}
              variant="primary"
              handlePress={onSubmit}
              disabled={loading || !canGoNext}
            />
          ) : (
            <Button
              text={t(TranslationKeys.NEXT)}
              variant="primary"
              handlePress={onNext}
              disabled={loading || !canGoNext}
            />
          )}
        </View>
      </View>
    </View>
  );
}
