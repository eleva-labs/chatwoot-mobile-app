import 'reflect-metadata'; // Must be first import for TSyringe decorators
import { bootstrapDI } from '@/dependency-injection';

import * as Sentry from '@sentry/react-native';
import * as Notifications from 'expo-notifications';

import Constants from 'expo-constants';
import App from './src/app';

// TODO: It is a temporary fix to fix the reanimated logger issue
// Ref: https://github.com/gorhom/react-native-bottom-sheet/issues/1983
// https://github.com/dohooo/react-native-reanimated-carousel/issues/706
import './reanimatedConfig';

// Initialize DI container immediately after reflect-metadata
bootstrapDI();

const isStorybookEnabled = Constants.expoConfig?.extra?.eas?.storybookEnabled;

if (!__DEV__) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    attachScreenshot: true,
    sendDefaultPii: true,
    profilesSampleRate: 1.0,
  });
}

// Show alerts while app is in foreground (expo-notifications)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Ref: https://dev.to/dannyhw/how-to-swap-between-react-native-storybook-and-your-app-p3o
export default Sentry.wrap(
  (() => {
    if (isStorybookEnabled === 'true') {
      // eslint-disable-next-line
      return require('./.storybook').default;
    }
    return App;
  })(),
);
