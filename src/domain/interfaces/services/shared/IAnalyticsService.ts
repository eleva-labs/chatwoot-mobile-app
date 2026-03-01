/**
 * Analytics Service Interface
 *
 * Domain contract for analytics services.
 * NO Firebase or vendor-specific types allowed here.
 */

export interface AnalyticsEventParams {
  [key: string]: string | number | boolean | undefined;
}

export interface IAnalyticsService {
  logEvent(name: string, params?: AnalyticsEventParams): void;
  logScreenView(screenName: string, screenClass?: string): void;
  setUserId(id?: string | number | null): void;
  setUserProperty(property: string, value?: string | number | boolean): void;
  setCollectionEnabled(enabled: boolean): void;
}
