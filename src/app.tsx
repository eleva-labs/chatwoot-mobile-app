import '@/polyfills'; // Import polyfills first for Expo compatibility
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { Alert, BackHandler } from 'react-native';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@application/store';
import { AppNavigator } from '@application/navigation';
import ErrorBoundaryScreen from '@infrastructure/ui/common/ErrorBoundaryScreen';
import ErrorBoundary from '@infrastructure/ui/common/ErrorBoundary';
import { ThemeProvider } from '@infrastructure/context/ThemeContext';

import i18n from '@infrastructure/i18n';
import { useEASUpdates } from '@infrastructure/hooks/useEASUpdates';

const Chatwoot = () => {
  useEASUpdates();
  useEffect(() => {
    const handleBackButtonClick = () => {
      Alert.alert(
        i18n.t('EXIT.TITLE'),
        i18n.t('EXIT.SUBTITLE'),
        [
          {
            text: i18n.t('EXIT.CANCEL'),
            onPress: () => {},
            style: 'cancel',
          },
          { text: i18n.t('EXIT.OK'), onPress: () => BackHandler.exitApp() },
        ],
        { cancelable: false },
      );
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
    return () => subscription.remove();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <React.Suspense fallback={null}>
            <ErrorBoundary
              fallbackRender={({ error, resetErrorBoundary }) => (
                <ErrorBoundaryScreen error={error} onRetry={resetErrorBoundary} />
              )}>
              <AppNavigator />
            </ErrorBoundary>
          </React.Suspense>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
};

export default Chatwoot;
