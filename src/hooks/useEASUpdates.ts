import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as Sentry from '@sentry/react-native';
import * as Updates from 'expo-updates';
import i18n from '@/i18n';

export interface EASUpdateState {
  isChecking: boolean;
  isDownloading: boolean;
  isUpdateAvailable: boolean;
  isUpdatePending: boolean;
  lastError: Error | null;
}

export interface EASUpdateActions {
  reloadApp: () => Promise<void>;
  checkForUpdates: () => Promise<void>;
}

export type UseEASUpdatesResult = EASUpdateState & EASUpdateActions;

function captureUpdateError(error: unknown, context: string): Error {
  const loggableError =
    error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Unknown error');

  Sentry.captureException(loggableError, {
    tags: { feature: 'eas-updates', phase: context },
  });

  return loggableError;
}

function showRestartPrompt(onRestart: () => Promise<void>): void {
  const title = i18n.t('UPDATES.ALERT_TITLE');
  const message = i18n.t('UPDATES.ALERT_MESSAGE');
  const laterText = i18n.t('UPDATES.ALERT_LATER');
  const restartText = i18n.t('UPDATES.ALERT_RESTART');
  Alert.alert(
    title,
    message,
    [
      {
        text: laterText,
        style: 'cancel',
      },
      {
        text: restartText,
        onPress: () => {
          onRestart().catch(error => {
            captureUpdateError(error, 'reload');
          });
        },
      },
    ],
    { cancelable: true },
  );
}

export function useEASUpdates(): UseEASUpdatesResult {
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isUpdatePending, setIsUpdatePending] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  const reloadApp = useCallback(async function reloadApp() {
    await Updates.reloadAsync();
  }, []);

  const alertForUpdate = useCallback(
    function alertForUpdate() {
      showRestartPrompt(reloadApp);
    },
    [reloadApp],
  );

  const downloadUpdate = useCallback(
    async function downloadUpdate() {
      setIsDownloading(true);
      try {
        const result = await Updates.fetchUpdateAsync();

        if (result.isNew) {
          setIsUpdatePending(true);
          alertForUpdate();
        }
      } catch (error) {
        setLastError(captureUpdateError(error, 'download'));
      } finally {
        setIsDownloading(false);
        setIsChecking(false);
      }
    },
    [alertForUpdate],
  );

  const checkForUpdates = useCallback(
    async function checkForUpdates() {
      if (!Updates.isEnabled) {
        return;
      }

      setIsChecking(true);
      setLastError(null);

      try {
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          setIsUpdateAvailable(true);
          await downloadUpdate();
        } else {
          setIsUpdateAvailable(false);
          setIsChecking(false);
        }
      } catch (error) {
        setLastError(captureUpdateError(error, 'check'));
        setIsChecking(false);
      }
    },
    [downloadUpdate],
  );

  useEffect(() => {
    if (__DEV__) {
      return;
    }

    checkForUpdates();
  }, [checkForUpdates]);

  return {
    isChecking,
    isDownloading,
    isUpdateAvailable,
    isUpdatePending,
    lastError,
    reloadApp,
    checkForUpdates,
  };
}
