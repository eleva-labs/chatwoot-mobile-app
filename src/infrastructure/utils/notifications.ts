import { Alert, Platform } from 'react-native';
import { getApp, getApps } from '@react-native-firebase/app';
import {
  getMessaging,
  AuthorizationStatus,
  hasPermission,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
} from '@react-native-firebase/messaging';

/**
 * Notification utilities for development/testing
 */

export const sendTestForegroundNotification = async (): Promise<void> => {
  try {
    Alert.alert(
      'Test Notification',
      'This is a test notification to verify foreground display works correctly',
      [
        { text: 'Dismiss', style: 'cancel' },
        { text: 'OK', style: 'default' },
      ],
    );

    console.warn('Test foreground notification sent successfully');
  } catch (error) {
    console.error('Failed to send test foreground notification:', error);
  }
};

export const checkNotificationPermissions = async (): Promise<number | null> => {
  try {
    const apps = getApps();
    if (apps.length === 0) {
      console.warn('Firebase not initialized - cannot check permissions');
      return null;
    }

    const messaging = getMessaging(getApp());
    const authStatus = await hasPermission(messaging);

    const permissionStatus: Record<number, string> = {
      [AuthorizationStatus.NOT_DETERMINED]: 'Not Determined',
      [AuthorizationStatus.DENIED]: 'Denied',
      [AuthorizationStatus.AUTHORIZED]: 'Authorized',
      [AuthorizationStatus.PROVISIONAL]: 'Provisional',
    };

    const label = permissionStatus[Number(authStatus)] ?? 'Unknown';

    console.warn('=== Notification Permission Status ===');

    console.warn(`Platform: ${Platform.OS}`);

    console.warn(`Permission: ${label}`);

    console.warn(`Status Code: ${authStatus}`);

    return authStatus as unknown as number;
  } catch (error) {
    console.error('Failed to check notification permissions:', error);
    return null;
  }
};

export const getFCMToken = async (): Promise<string | null> => {
  try {
    const apps = getApps();
    if (apps.length === 0) {
      console.warn('Firebase not initialized - cannot get FCM token');
      return null;
    }

    const messaging = getMessaging(getApp());
    const token = await getToken(messaging);

    console.warn('=== FCM Token ===');

    console.warn(token);

    console.warn('================');
    return token;
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return null;
  }
};

export const logNotificationListeners = (): (() => void) => {
  console.warn('=== Setting up notification listeners for testing ===');

  const apps = getApps();
  if (apps.length === 0) {
    console.warn('Firebase not initialized - cannot setup notification listeners');
    return () => {};
  }

  try {
    const messaging = getMessaging(getApp());
    const unsubscribeForeground = onMessage(messaging, async remoteMessage => {
      console.warn('Foreground notification received:', remoteMessage);
    });

    const unsubscribeBackground = onNotificationOpenedApp(messaging, remoteMessage => {
      console.warn('App opened from background notification:', remoteMessage);
    });

    getInitialNotification(messaging)
      .then(remoteMessage => {
        if (remoteMessage) {
          console.warn('App opened from cold start notification:', remoteMessage);
        }
      })
      .catch(error => {
        console.error('Failed to get initial notification:', error);
      });

    return () => {
      unsubscribeForeground();
      unsubscribeBackground();

      console.warn('Notification test listeners cleaned up');
    };
  } catch (error) {
    console.error('Failed to setup notification listeners:', error);
    return () => {};
  }
};

export const runNotificationTest = async (): Promise<() => void> => {
  console.warn('Starting comprehensive notification test...');

  const apps = getApps();
  if (apps.length === 0) {
    console.warn('Firebase not initialized - cannot run notification tests');

    console.warn('Make sure Firebase is properly configured and initialized');
    return () => {};
  }

  await checkNotificationPermissions();
  await getFCMToken();
  const cleanup = logNotificationListeners();
  await sendTestForegroundNotification();

  console.warn('Notification test completed. Check logs above for results.');

  console.warn('To test background notifications, use Firebase Console with the FCM token above.');

  return cleanup;
};
