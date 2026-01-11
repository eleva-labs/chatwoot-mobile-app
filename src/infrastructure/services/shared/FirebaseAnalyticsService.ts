import { getApp, getApps } from '@react-native-firebase/app';
import {
  getAnalytics,
  logEvent,
  setUserId,
  setUserProperty,
  setAnalyticsCollectionEnabled,
  FirebaseAnalyticsTypes,
} from '@react-native-firebase/analytics';

import type { AnalyticsEventParams, IAnalyticsService } from '@/domain/interfaces/services/shared';
import { normalizeEventName } from '@/utils/normalizeEventName';

export class FirebaseAnalyticsService implements IAnalyticsService {
  private collectionEnabled = true;
  private _analytics: FirebaseAnalyticsTypes.Module | null = null;

  // Lazy initialization - only get analytics when Firebase is ready
  private getAnalyticsInstance(): FirebaseAnalyticsTypes.Module | null {
    if (this._analytics) return this._analytics;
    if (getApps().length === 0) {
      // Firebase not initialized (placeholder credentials)
      return null;
    }
    try {
      this._analytics = getAnalytics(getApp());
      return this._analytics;
    } catch {
      return null;
    }
  }

  logEvent(name: string, params?: AnalyticsEventParams) {
    if (!this.collectionEnabled || !name) return;
    const analytics = this.getAnalyticsInstance();
    if (!analytics) return;
    const eventName = normalizeEventName(name);
    if (!eventName) return;
    logEvent(analytics, eventName, params || {}).catch(() => {
      /* best effort */
    });
  }

  logScreenView(screenName: string, screenClass?: string) {
    if (!this.collectionEnabled) return;
    const analytics = this.getAnalyticsInstance();
    if (!analytics) return;
    const normalizedName = normalizeEventName(screenName || screenClass || '');
    if (!normalizedName) return;
    // Use logEvent with 'screen_view' event instead of deprecated logScreenView
    // 'screen_view' is a reserved Firebase Analytics event name
    logEvent<string>(analytics, 'screen_view', {
      screen_name: normalizedName,
      screen_class: screenClass || screenName || normalizedName,
    }).catch(() => {
      /* best effort */
    });
  }

  setUserId(id?: string | number | null) {
    if (!this.collectionEnabled || id == null) return;
    const analytics = this.getAnalyticsInstance();
    if (!analytics) return;
    setUserId(analytics, String(id)).catch(() => {
      /* best effort */
    });
  }

  setUserProperty(property: string, value?: string | number | boolean) {
    if (!this.collectionEnabled || !property || value == null) return;
    const analytics = this.getAnalyticsInstance();
    if (!analytics) return;
    setUserProperty(analytics, property, String(value)).catch(() => {
      /* best effort */
    });
  }

  setCollectionEnabled(enabled: boolean) {
    this.collectionEnabled = enabled;
    const analytics = this.getAnalyticsInstance();
    if (!analytics) return;
    setAnalyticsCollectionEnabled(analytics, enabled).catch(() => {
      /* best effort */
    });
  }
}
