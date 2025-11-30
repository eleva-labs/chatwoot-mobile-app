export interface AnalyticsEventParams {
  [key: string]: string | number | boolean | undefined;
}

export interface AnalyticsService {
  logEvent(name: string, params?: AnalyticsEventParams): void;
  logScreenView(screenName: string, screenClass?: string): void;
  setUserId(id?: string | number | null): void;
  setUserProperty(property: string, value?: string | number | boolean): void;
  setCollectionEnabled(enabled: boolean): void;
}
