import analytics from '@react-native-firebase/analytics';

import {
  AnalyticsEventParams,
  AnalyticsService,
} from '@/domain/interfaces/analytics/AnalyticsService';
import { normalizeEventName } from '@/utils/normalizeEventName';

export class FirebaseAnalyticsService implements AnalyticsService {
  private collectionEnabled = true;

  logEvent(name: string, params?: AnalyticsEventParams) {
    if (!this.collectionEnabled || !name) return;
    const eventName = normalizeEventName(name);
    if (!eventName) return;
    analytics()
      .logEvent(eventName, params || {})
      .catch(() => {
        /* best effort */
      });
  }

  logScreenView(screenName: string, screenClass?: string) {
    if (!this.collectionEnabled) return;
    const normalizedName = normalizeEventName(screenName || screenClass || '');
    if (!normalizedName) return;
    analytics()
      .logScreenView({
        screen_name: normalizedName,
        screen_class: screenClass || screenName || normalizedName,
      })
      .catch(() => {
        /* best effort */
      });
  }

  setUserId(id?: string | number | null) {
    if (!this.collectionEnabled || id == null) return;
    analytics()
      .setUserId(String(id))
      .catch(() => {
        /* best effort */
      });
  }

  setUserProperty(property: string, value?: string | number | boolean) {
    if (!this.collectionEnabled || !property || value == null) return;
    analytics()
      .setUserProperty(property, String(value))
      .catch(() => {
        /* best effort */
      });
  }

  setCollectionEnabled(enabled: boolean) {
    this.collectionEnabled = enabled;
    analytics()
      .setAnalyticsCollectionEnabled(enabled)
      .catch(() => {
        /* best effort */
      });
  }
}
