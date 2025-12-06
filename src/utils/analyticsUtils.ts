import axios, { AxiosInstance } from 'axios';

import { AnalyticsService } from '@/domain/interfaces/analytics/AnalyticsService';
import { FirebaseAnalyticsService } from '@/infrastructure/analytics/FirebaseAnalyticsService';

interface User {
  id: string | number;
  email: string;
  name: string;
  avatar_url: string;
  accounts?: Account[];
  account_id?: number | null;
}

interface Account {
  id: number;
  name: string;
}

interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Converts unknown values to analytics-compatible primitive types.
 * Handles Error objects, null, undefined, and other non-primitive types.
 *
 * @param value - The value to convert
 * @returns A string, number, boolean, or undefined suitable for analytics tracking
 */
export function toAnalyticsValue(value: unknown): string | number | boolean | undefined {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === undefined ||
    value === null
  ) {
    return value ?? undefined;
  }
  if (value instanceof Error) {
    return value.message;
  }
  return String(value);
}

// We're not using the June SDK anymore, but we're keeping the code for reference.
const BASE_URL = 'https://api.june.so/api/';

class AnalyticsHelper {
  private analyticsToken: string;
  private user: User;
  private isAnalyticsEnabled: boolean;
  private APIHelper: AxiosInstance;
  private analyticsService: AnalyticsService;

  constructor(service: AnalyticsService = new FirebaseAnalyticsService()) {
    this.analyticsToken = process.env.EXPO_PUBLIC_JUNE_SDK_KEY || '';
    this.user = {} as User;
    this.isAnalyticsEnabled = !!(!__DEV__ && this.analyticsToken);
    this.APIHelper = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Basic ${this.analyticsToken}` },
    });
    this.analyticsService = service;
  }

  private getCurrentAccount(): Account | undefined {
    const { accounts = [], account_id = null } = this.user;
    if (account_id && accounts.length) {
      const [currentAccount] = accounts.filter(account => account.id === account_id);
      return currentAccount;
    }
  }

  private identifyUser() {
    return this.APIHelper.post('identify', {
      userId: this.user.id,
      traits: {
        email: this.user.email,
        name: this.user.name,
        avatar: this.user.avatar_url,
      },
      timestamp: new Date(),
    });
  }

  private identifyGroup() {
    const currentAccount = this.getCurrentAccount();
    if (currentAccount) {
      return this.APIHelper.post('group', {
        userId: this.user.id,
        groupId: currentAccount.id,
        traits: {
          name: currentAccount.name,
        },
        timestamp: new Date(),
      });
    }
  }

  identify(user: User): void {
    this.user = user;
    this.analyticsService.setUserId(user.id);
    this.analyticsService.setUserProperty('account_id', toAnalyticsValue(user.account_id));
    this.analyticsService.setUserProperty('email', user.email);
    this.analyticsService.setUserProperty('name', user.name);

    if (!this.isAnalyticsEnabled) return;
    this.identifyUser();
    this.identifyGroup();
  }

  track(eventName: string, properties: AnalyticsProperties = {}): Promise<unknown> | void {
    this.analyticsService.logEvent(eventName, {
      ...properties,
      screen_name: properties.screen_name,
      screen_class: properties.screen_class,
    });

    if (!this.isAnalyticsEnabled) return;
    const currentAccount = this.getCurrentAccount();
    return this.APIHelper.post('track', {
      userId: this.user.id,
      event: `Mobile: ${eventName}`,
      properties,
      timestamp: new Date(),
      context: {
        groupId: currentAccount ? currentAccount.id : '',
      },
    });
  }

  logScreenView(screenName: string, screenClass?: string) {
    this.analyticsService.logScreenView(screenName, screenClass);
  }

  setCollectionEnabled(enabled: boolean) {
    this.analyticsService.setCollectionEnabled(enabled);
  }
}

export default new AnalyticsHelper();
