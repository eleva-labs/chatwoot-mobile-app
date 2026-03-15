import { useEffect } from 'react';
import { Platform } from 'react-native';
import { getApp, getApps } from '@react-native-firebase/app';
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { waitForFirebaseInit } from '@infrastructure/utils/firebaseUtils';

export const usePushNotifications = (installationUrl: string) => {
  useEffect(() => {
    let unsubscribeForeground: (() => void) | undefined;
    let unsubscribeBackground: (() => void) | undefined;

    // Wait for Firebase auto-initialization
    (async () => {
      console.warn('PushNotifications: Waiting for Firebase...');
      const ready = await waitForFirebaseInit({ timeoutMs: 5000, pollMs: 100 });
      const apps = getApps();
      console.warn('PushNotifications: Firebase ready?', ready, 'apps:', apps.length);
      if (!ready) {
        console.warn('Firebase not initialized - skipping push notifications setup');
        return;
      }
      console.warn('Setting up push notifications...');

      // Request permission and log status
      const perm = await Notifications.requestPermissionsAsync();
      console.warn('Notifications permission status:', perm);
      // Ensure Android default channel exists with MAX importance (Expo uses 'default' implicitly)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: AndroidImportance.MAX,
          sound: 'default',
          vibrationPattern: [200, 100, 200],
          enableVibrate: true,
          lockscreenVisibility: 1,
          bypassDnd: false,
          lightColor: '#ffffff',
        });
        const channels = await Notifications.getNotificationChannelsAsync();
        console.warn(
          'Available Android channels:',
          channels?.map(c => ({ id: c.id, importance: c.importance })),
        );
      }

      try {
        // Foreground message handler
        const messaging = getMessaging(getApp());
        unsubscribeForeground = onMessage(messaging, async remoteMessage => {
          console.warn('Foreground notification received:', {
            title: remoteMessage.notification?.title,
            body: remoteMessage.notification?.body,
            data: remoteMessage.data,
          });

          await Notifications.scheduleNotificationAsync({
            content: {
              title: remoteMessage.notification?.title ?? 'New message',
              body: remoteMessage.notification?.body ?? '',
              data: remoteMessage.data ?? {},
              sound: 'default',
              // uses 'default' channel configured above
            },
            trigger: null, // fire immediately
          });
        });

        console.warn('Push notifications setup completed');
      } catch (error) {
        console.error('Failed to setup push notifications:', error);
      }
    })();

    // Cleanup function
    return () => {
      if (unsubscribeForeground) {
        unsubscribeForeground();
      }
      if (unsubscribeBackground) {
        unsubscribeBackground();
      }
    };
  }, [installationUrl]);
};
