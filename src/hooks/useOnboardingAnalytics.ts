import { useMemo } from 'react';
import { Platform } from 'react-native';
import { version as appVersion } from '../../package.json';

import AnalyticsHelper, { toAnalyticsValue } from '@/utils/analyticsUtils';
import {
  ONBOARDING_EVENTS,
  type FlowStartedEvent,
  type QuestionAnsweredEvent,
  type ScreenChangedEvent,
  type FlowCompletedEvent,
  type FlowSkippedEvent,
  type ErrorEvent,
} from '@/constants/analyticsEvents';

interface OnboardingEventCallbacks {
  onFlowStarted: (event: FlowStartedEvent) => void;
  onQuestionAnswered: (event: QuestionAnsweredEvent) => void;
  onScreenChanged: (event: ScreenChangedEvent) => void;
  onFlowCompleted: (event: FlowCompletedEvent) => void;
  onFlowSkipped: (event: FlowSkippedEvent) => void;
  onError: (event: ErrorEvent) => void;
}

export function useOnboardingAnalytics(locale: string): OnboardingEventCallbacks {
  return useMemo(
    () => ({
      onFlowStarted: (event: FlowStartedEvent) => {
        AnalyticsHelper.track(ONBOARDING_EVENTS.FLOW_STARTED, {
          locale,
          timestamp: Date.now(),
          platform: Platform.OS,
          app_version: appVersion,
          flow_version: toAnalyticsValue(event?.version) || 'unknown',
          flow_id: toAnalyticsValue(event?.flowId) || 'default',
        });
      },

      onQuestionAnswered: (event: QuestionAnsweredEvent) => {
        AnalyticsHelper.track(ONBOARDING_EVENTS.QUESTION_ANSWERED, {
          question_id: toAnalyticsValue(event?.questionId || event?.id),
          question_type: toAnalyticsValue(event?.type || event?.questionType),
          step_number: toAnalyticsValue(event?.stepNumber || event?.step),
          step_id: toAnalyticsValue(event?.stepId),
          answer_value: toAnalyticsValue(event?.answer || event?.value),
          time_to_answer: toAnalyticsValue(event?.timeToAnswer || event?.duration),
          is_required: toAnalyticsValue(event?.isRequired) || false,
          has_validation: toAnalyticsValue(event?.hasValidation) || false,
        });
      },

      onScreenChanged: (event: ScreenChangedEvent) => {
        const screenName = event?.screenName || event?.to || event?.toScreen || 'unknown';
        const normalizedScreenName = `onboarding_${toAnalyticsValue(screenName)}`;

        // Log screen view
        AnalyticsHelper.logScreenView(normalizedScreenName, 'OnboardingScreen');

        // Log screen change event
        AnalyticsHelper.track(ONBOARDING_EVENTS.SCREEN_CHANGED, {
          from_screen: toAnalyticsValue(event?.fromScreen || event?.from),
          to_screen: toAnalyticsValue(screenName),
          screen_index: toAnalyticsValue(event?.screenIndex || event?.index),
          direction: toAnalyticsValue(event?.direction) || 'forward',
          step_number: toAnalyticsValue(event?.stepNumber || event?.step),
          total_screens: toAnalyticsValue(event?.totalScreens || event?.total),
        });
      },

      onFlowCompleted: (event: FlowCompletedEvent) => {
        AnalyticsHelper.track(ONBOARDING_EVENTS.FLOW_COMPLETED, {
          total_time: toAnalyticsValue(event?.totalTime || event?.duration),
          total_steps: toAnalyticsValue(event?.totalSteps || event?.steps),
          completion_rate: 100,
          answers_count: toAnalyticsValue(event?.answersCount || event?.totalAnswers),
          back_navigation_count: toAnalyticsValue(event?.backNavigationCount) || 0,
          validation_errors_count: toAnalyticsValue(event?.validationErrorsCount) || 0,
          locale,
        });

        // Set user property to indicate onboarding completion
        AnalyticsHelper.track('User Property Set', {
          property: 'onboarding_completed',
          value: true,
        });
      },

      onFlowSkipped: (event: FlowSkippedEvent) => {
        AnalyticsHelper.track(ONBOARDING_EVENTS.FLOW_SKIPPED, {
          skipped_at_step: toAnalyticsValue(event?.stepNumber || event?.step),
          skipped_at_screen: toAnalyticsValue(event?.screenName || event?.screen),
          progress_percentage: toAnalyticsValue(event?.progress || event?.progressPercentage),
          time_spent: toAnalyticsValue(event?.timeSpent || event?.duration),
          answers_provided: toAnalyticsValue(event?.answersProvided || event?.answersCount) || 0,
          reason: toAnalyticsValue(event?.reason) || 'user_action',
        });
      },

      onError: (event: ErrorEvent) => {
        AnalyticsHelper.track(ONBOARDING_EVENTS.ERROR_OCCURRED, {
          error_type: toAnalyticsValue(event?.type || event?.errorType) || 'unknown',
          error_message: toAnalyticsValue(event?.message || event?.error),
          error_code: toAnalyticsValue(event?.code || event?.errorCode),
          step_number: toAnalyticsValue(event?.stepNumber || event?.step),
          step_id: toAnalyticsValue(event?.stepId),
          screen_name: toAnalyticsValue(event?.screenName || event?.screen),
          is_recoverable: toAnalyticsValue(event?.isRecoverable) !== false,
          stack_trace: toAnalyticsValue(event?.stack || event?.stackTrace),
        });
      },
    }),
    [locale],
  );
}
