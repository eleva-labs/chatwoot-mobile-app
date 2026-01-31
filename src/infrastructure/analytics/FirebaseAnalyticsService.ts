import { getApp } from '@react-native-firebase/app';
import {
  getAnalytics,
  logEvent,
  setUserId,
  setUserProperty,
  setAnalyticsCollectionEnabled,
} from '@react-native-firebase/analytics';

import {
  AnalyticsEventParams,
  AnalyticsService,
} from '@/domain/interfaces/analytics/AnalyticsService';
import { normalizeEventName } from '@/utils/normalizeEventName';

export class FirebaseAnalyticsService implements AnalyticsService {
  private collectionEnabled = true;
  private analytics: ReturnType<typeof getAnalytics> | null = null;

  constructor() {
    // Safely initialize Firebase Analytics
    // Handles placeholder credentials in local development
    try {
      const app = getApp();
      // Check if Firebase app has valid configuration
      if (app && app.options && app.options.apiKey && !app.options.apiKey.includes('placeholder')) {
        this.analytics = getAnalytics(app);
      } else {
        console.warn(
          '[FirebaseAnalytics] Skipping initialization: placeholder or invalid credentials detected',
        );
        this.analytics = null;
      }
    } catch (error) {
      console.warn('[FirebaseAnalytics] Initialization failed, analytics disabled:', error);
      this.analytics = null;
    }
  }

  logEvent(name: string, params?: AnalyticsEventParams) {
    if (!this.collectionEnabled || !name || !this.analytics) return;
    const eventName = normalizeEventName(name);
    if (!eventName) return;
    logEvent(this.analytics, eventName, params || {}).catch(() => {
      /* best effort */
    });
  }

  logScreenView(screenName: string, screenClass?: string) {
    if (!this.collectionEnabled || !this.analytics) return;
    const normalizedName = normalizeEventName(screenName || screenClass || '');
    if (!normalizedName) return;
    // Use logEvent with 'screen_view' event instead of deprecated logScreenView
    // 'screen_view' is a reserved Firebase Analytics event name
    logEvent<string>(this.analytics, 'screen_view', {
      screen_name: normalizedName,
      screen_class: screenClass || screenName || normalizedName,
    }).catch(() => {
      /* best effort */
    });
  }

  setUserId(id?: string | number | null) {
    if (!this.collectionEnabled || id == null || !this.analytics) return;
    setUserId(this.analytics, String(id)).catch(() => {
      /* best effort */
    });
  }

  setUserProperty(property: string, value?: string | number | boolean) {
    if (!this.collectionEnabled || !property || value == null || !this.analytics) return;
    setUserProperty(this.analytics, property, String(value)).catch(() => {
      /* best effort */
    });
  }

  setCollectionEnabled(enabled: boolean) {
    this.collectionEnabled = enabled;
    if (!this.analytics) return;
    setAnalyticsCollectionEnabled(this.analytics, enabled).catch(() => {
      /* best effort */
    });
  }
}
