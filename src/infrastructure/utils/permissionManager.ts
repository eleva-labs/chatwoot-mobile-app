import { Alert, Platform, Linking } from 'react-native';
import { PermissionsAndroid } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  AuthorizationStatus,
  requestPermission,
} from '@react-native-firebase/messaging';

import i18n from '@infrastructure/i18n';

export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      // Android 13+ requires explicit permission
      const apiLevel = Number(Platform.Version);

      if (apiLevel > 32) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: i18n.t('NOTIFICATIONS.PERMISSION_TITLE'),
            message: i18n.t('NOTIFICATIONS.PERMISSION_MESSAGE'),
            buttonNeutral: i18n.t('NOTIFICATIONS.PERMISSION_ASK_LATER'),
            buttonNegative: i18n.t('NOTIFICATIONS.PERMISSION_CANCEL'),
            buttonPositive: i18n.t('NOTIFICATIONS.PERMISSION_OK'),
          },
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return false;
        }
      }
    }

    // Request FCM permission
    const messaging = getMessaging(getApp());
    const authStatus = await requestPermission(messaging);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    return enabled;
  } catch (error) {
    console.error('Permission request failed:', error);
    return false;
  }
};

export const showPermissionRationale = () => {
  Alert.alert(i18n.t('NOTIFICATIONS.RATIONALE_TITLE'), i18n.t('NOTIFICATIONS.RATIONALE_MESSAGE'), [
    {
      text: i18n.t('NOTIFICATIONS.RATIONALE_CANCEL'),
      style: 'cancel',
    },
    {
      text: i18n.t('NOTIFICATIONS.RATIONALE_SETTINGS'),
      onPress: () => {
        // Open app settings
        if (Platform.OS === 'ios') {
          Linking.openURL('app-settings:');
        } else {
          Linking.openSettings();
        }
      },
    },
  ]);
};
