import React, { useMemo } from 'react';
import { OnboardingModule } from '@/modules/onboarding';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { selectLocale, selectIsLocaleSet } from '@/store/settings/settingsSelectors';
import { setOnboardingCompleted } from '@/store/settings/settingsSlice';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TabBarExcludedScreenParamList } from '@/navigation/tabs/AppTabs';
import { AppDispatch } from '@/store';
import { useOnboardingAnalytics } from '@/hooks/useOnboardingAnalytics';
import { getLocaleFromDevice } from '@/utils/localeUtils';

type OnboardingScreenNavigationProp = NativeStackNavigationProp<TabBarExcludedScreenParamList>;

export const OnboardingScreen: React.FC = () => {
  const dispatch: AppDispatch = useAppDispatch();
  const navigation: OnboardingScreenNavigationProp =
    useNavigation<OnboardingScreenNavigationProp>();
  const reduxLocale = useAppSelector(selectLocale);
  const isLocaleSet = useAppSelector(selectIsLocaleSet);

  // Use device locale if Redux locale hasn't been explicitly set by user
  // Otherwise use the Redux locale (user's preference)
  const locale: string = useMemo(() => {
    if (isLocaleSet && reduxLocale) {
      // User has explicitly set a locale preference
      return reduxLocale;
    }
    // Use device locale for first-time onboarding
    const deviceLocale = getLocaleFromDevice();
    return deviceLocale;
  }, [reduxLocale, isLocaleSet]);

  const analyticsCallbacks = useOnboardingAnalytics(locale);

  const handleComplete: () => void = () => {
    // Mark onboarding as completed
    dispatch(setOnboardingCompleted());

    // Navigate to main app (Tab navigator)
    navigation.reset({
      index: 0,
      routes: [{ name: 'Tab' }],
    });
  };

  const handleSkip: () => void = () => {
    // Mark onboarding as skipped (same as completed for now)
    dispatch(setOnboardingCompleted());

    // Navigate to main app
    navigation.reset({
      index: 0,
      routes: [{ name: 'Tab' }],
    });
  };

  return (
    <OnboardingModule
      locale={locale}
      autoLoad={true}
      onComplete={handleComplete}
      onSkip={handleSkip}
      onEvent={{
        onFlowStarted: event => {
          console.log('[Onboarding] Flow started:', event);
          analyticsCallbacks.onFlowStarted(event as unknown as Record<string, unknown>);
        },
        onQuestionAnswered: event => {
          console.log('[Onboarding] Question answered:', event);
          analyticsCallbacks.onQuestionAnswered(event as unknown as Record<string, unknown>);
        },
        onScreenChanged: event => {
          console.log('[Onboarding] Screen changed:', event);
          analyticsCallbacks.onScreenChanged(event as unknown as Record<string, unknown>);
        },
        onFlowCompleted: event => {
          console.log('[Onboarding] Flow completed:', event);
          analyticsCallbacks.onFlowCompleted(event as unknown as Record<string, unknown>);
        },
        onFlowSkipped: event => {
          console.log('[Onboarding] Flow skipped:', event);
          analyticsCallbacks.onFlowSkipped(event as unknown as Record<string, unknown>);
        },
        onError: event => {
          console.error('[Onboarding] Error:', event);
          analyticsCallbacks.onError(event as unknown as Record<string, unknown>);
        },
      }}
    />
  );
};
