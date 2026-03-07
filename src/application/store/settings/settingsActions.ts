import { createAsyncThunk } from '@reduxjs/toolkit';
import * as Sentry from '@sentry/react-native';

import { getApp } from '@react-native-firebase/app';
import { getMessaging, hasPermission, getToken } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';

import { SettingsService } from './settingsService';
import type {
  NotificationSettings,
  NotificationSettingsPayload,
  InstallationUrls,
  PushPayload,
} from './settingsTypes';
import I18n from '@infrastructure/i18n';
import { URL_TYPE } from '@domain/constants/url';
import { checkValidUrl, extractDomain, handleApiError } from './settingsUtils';
import { showToast } from '@infrastructure/utils/toastUtils';
import { requestNotificationPermissions } from '@infrastructure/utils/permissionManager';

const createSettingsThunk = <TResponse, TPayload>(
  type: string,
  handler: (payload: TPayload) => Promise<TResponse>,
  errorMessage?: string,
) => {
  return createAsyncThunk<TResponse, TPayload>(type, async (payload, { rejectWithValue }) => {
    try {
      return await handler(payload);
    } catch (error) {
      return rejectWithValue(handleApiError(error, errorMessage));
    }
  });
};

export const settingsActions = {
  setInstallationUrl: createAsyncThunk<InstallationUrls, string>(
    'settings/setInstallationUrl',
    async (url, { rejectWithValue }) => {
      try {
        if (!checkValidUrl({ url })) {
          throw new Error(I18n.t('CONFIGURE_URL.ERROR'));
        }

        const installationUrl = extractDomain({ url });
        // Support http:// for local development (e.g. http://localhost:3000)
        const isHttp = url.startsWith('http://');
        const protocol = isHttp ? 'http://' : URL_TYPE;
        const INSTALLATION_URL = `${protocol}${installationUrl}/`;
        const isValid = await SettingsService.verifyInstallationUrl(INSTALLATION_URL);

        if (!isValid) {
          throw new Error(I18n.t('CONFIGURE_URL.ERROR'));
        }

        return {
          installationUrl: INSTALLATION_URL,
          baseUrl: installationUrl,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : I18n.t('CONFIGURE_URL.ERROR');
        showToast({ message });
        return rejectWithValue(message);
      }
    },
  ),

  getNotificationSettings: createSettingsThunk<NotificationSettings, void>(
    'settings/getNotificationSettings',
    () => SettingsService.getNotificationSettings(),
  ),

  updateNotificationSettings: createSettingsThunk<
    NotificationSettings,
    NotificationSettingsPayload
  >('settings/updateNotificationSettings', SettingsService.updateNotificationSettings),

  getChatwootVersion: createSettingsThunk<{ version: string }, { installationUrl: string }>(
    'settings/getChatwootVersion',
    ({ installationUrl }) => SettingsService.getChatwootVersion(installationUrl),
  ),

  saveDeviceDetails: createAsyncThunk<{ fcmToken: string }, void>(
    'settings/saveDeviceDetails',
    async (_, { rejectWithValue }) => {
      try {
        const messaging = getMessaging(getApp());
        const permissionEnabled = await hasPermission(messaging);
        const deviceId =
          Platform.OS === 'ios'
            ? await Application.getIosIdForVendorAsync()
            : Application.getAndroidId();
        const devicePlatform = Device.osName ?? Platform.OS;
        const manufacturer = Device.manufacturer ?? 'unknown';
        const model = Device.modelName ?? 'unknown';
        const apiLevel = Platform.OS === 'android' ? Number(Platform.Version) : 0;
        const deviceName = `${manufacturer} ${model}`;

        const brandName = Device.brand ?? 'unknown';
        const buildNumber = Application.nativeBuildVersion ?? '0';

        if (!permissionEnabled || permissionEnabled === -1) {
          const permissionGranted = await requestNotificationPermissions();
          if (!permissionGranted) {
            return rejectWithValue('Notification permission denied');
          }
        }

        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        // https://github.com/invertase/react-native-firebase/issues/6893#issuecomment-1427998691
        // await registerDeviceForRemoteMessages(messaging);
        await sleep(1000);
        const fcmToken = await getToken(messaging);

        const pushData: PushPayload = {
          subscription_type: 'fcm',
          subscription_attributes: {
            deviceName,
            devicePlatform,
            apiLevel: apiLevel.toString(),
            brandName,
            buildNumber,
            push_token: fcmToken,
            device_id: deviceId ?? 'unknown',
          },
        };
        await SettingsService.saveDeviceDetails(pushData);
        return { fcmToken };
      } catch (error) {
        Sentry.captureException(error);
        return rejectWithValue(
          error instanceof Error ? error.message : 'Error saving device details',
        );
      }
    },
  ),

  removeDevice: createSettingsThunk<void, { pushToken: string }>(
    'settings/removeDevice',
    ({ pushToken }) => SettingsService.removeDevice({ push_token: pushToken }),
  ),
};
