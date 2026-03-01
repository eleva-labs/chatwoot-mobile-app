import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import AnalyticsHelper from '@infrastructure/utils/analyticsUtils';

export function useScreenAnalytics(screenName: string, screenClass?: string) {
  useFocusEffect(
    useCallback(() => {
      AnalyticsHelper.logScreenView(screenName, screenClass);
    }, [screenClass, screenName]),
  );
}
