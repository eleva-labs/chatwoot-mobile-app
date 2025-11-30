import React from 'react';
import { OnboardingModule } from '@/modules/onboarding';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { selectLocale } from '@/store/settings/settingsSelectors';
import { setOnboardingCompleted } from '@/store/settings/settingsSlice';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TabBarExcludedScreenParamList } from '@/navigation/tabs/AppTabs';
import { AppDispatch } from '@/store';

type OnboardingScreenNavigationProp = NativeStackNavigationProp<TabBarExcludedScreenParamList>;

export const OnboardingScreen: React.FC = () => {
  const dispatch: AppDispatch = useAppDispatch();
  const navigation: OnboardingScreenNavigationProp =
    useNavigation<OnboardingScreenNavigationProp>();
  const locale: string = useAppSelector(selectLocale) || 'en';

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
        },
        onQuestionAnswered: event => {
          console.log('[Onboarding] Question answered:', event);
        },
        onScreenChanged: event => {
          console.log('[Onboarding] Screen changed:', event);
        },
        onFlowCompleted: event => {
          console.log('[Onboarding] Flow completed:', event);
        },
        onFlowSkipped: event => {
          console.log('[Onboarding] Flow skipped:', event);
        },
        onError: event => {
          console.error('[Onboarding] Error:', event);
        },
      }}
    />
  );
};
