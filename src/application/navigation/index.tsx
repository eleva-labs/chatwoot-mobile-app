/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useCallback, useRef, useEffect } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, View } from 'react-native';
import { getApps } from '@react-native-firebase/app';
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  setBackgroundMessageHandler,
  onNotificationOpenedApp,
  getInitialNotification,
} from '@react-native-firebase/messaging';
import { getStateFromPath } from '@react-navigation/native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { AppTabs } from './tabs/AppTabs';
import i18n from '@infrastructure/i18n';
import { navigationRef } from '@infrastructure/utils/navigationUtils';
import { useTheme } from '@infrastructure/context';
import {
  findConversationLinkFromPush,
  findNotificationFromFCM,
  updateBadgeCount,
} from '@infrastructure/utils/pushUtils';
import { extractConversationIdFromUrl } from '@infrastructure/utils/conversationUtils';
import { tailwind } from '@infrastructure/theme';
import { useAppSelector, useThemedStyles } from '@/hooks';
import { selectInstallationUrl, selectLocale } from '@application/store/settings/settingsSelectors';
import { SSO_CALLBACK_URL } from '@domain/constants';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RefsProvider } from '@infrastructure/context';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { waitForFirebaseInit } from '@infrastructure/utils/firebaseUtils';
import { transformNotification } from '@infrastructure/utils/camelCaseKeys';
import { SsoUtils } from '@infrastructure/utils/ssoUtils';
import { useAppDispatch } from '@/hooks';
import Inter40020 from '@/assets/fonts/Inter-400-20.ttf';
import Inter42020 from '@/assets/fonts/Inter-420-20.ttf';
import Inter50024 from '@/assets/fonts/Inter-500-24.ttf';
import Inter58024 from '@/assets/fonts/Inter-580-24.ttf';
import Inter60020 from '@/assets/fonts/Inter-600-20.ttf';

// Initialize Firebase messaging handlers after app starts
const initializeFirebaseMessaging = () => {
  try {
    // Ensure Firebase is initialized (should be auto-initialized by plugin, but let's be explicit)
    const apps = getApps();
    if (!apps.length) {
      console.warn('Firebase not initialized, skipping messaging setup...');
      return;
    }

    console.warn('Firebase already initialized, setting up messaging...');

    const messaging = getMessaging(getApp());
    setBackgroundMessageHandler(messaging, async remoteMessage => {
      console.warn('Message handled in the background', remoteMessage);

      // Handle notification data
      const notification = findNotificationFromFCM({ message: remoteMessage });
      const camelCaseNotification = transformNotification(notification);

      // Update badge count for iOS
      if (Platform.OS === 'ios') {
        updateBadgeCount({ count: 1 }); // You might want to track actual count
      }

      // TODO: Process camelCaseNotification data for background tasks
      console.warn('Processed notification:', camelCaseNotification.id);
    });
  } catch (error) {
    console.error('Firebase messaging initialization failed:', error);
  }
};

const buildConversationsState = () => ({
  routes: [
    {
      name: 'Tab',
      state: {
        routes: [
          {
            name: 'Conversations',
          },
        ],
      },
    },
  ],
});

const hasConversationIdInPath = (path: string) => /\/conversations\/\d+/.test(path);

const normalizePath = (path: string) => path.split('?')[0].replace(/^\/+/, '');

export const AppNavigationContainer = () => {
  const { isDark } = useTheme();
  const themedTailwind = useThemedStyles();
  const [fontsLoaded] = useFonts({
    'Inter-400-20': Inter40020,
    'Inter-420-20': Inter42020,
    'Inter-500-24': Inter50024,
    'Inter-580-24': Inter58024,
    'Inter-600-20': Inter60020,
  });

  const routeNameRef = useRef<string | undefined>(undefined);
  const dispatch = useAppDispatch();

  const installationUrl = useAppSelector(selectInstallationUrl);
  const locale = useAppSelector(selectLocale);

  // Initialize Firebase messaging when component mounts
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const ready = await waitForFirebaseInit({ timeoutMs: 5000, pollMs: 100 });
      if (!isMounted) return;
      console.warn('Navigation: Firebase ready?', ready, 'apps:', getApps().length);
      initializeFirebaseMessaging();
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const normalizedInstallationUrl = installationUrl?.replace(/\/+$/, '');
  // Cast to satisfy LinkingOptions type - the runtime structure is correct
  const linking: Parameters<typeof NavigationContainer>[0]['linking'] = {
    prefixes: [
      installationUrl,
      normalizedInstallationUrl,
      SSO_CALLBACK_URL,
      'chatwootapp://',
    ].filter(Boolean),
    config: {
      screens: {
        Tab: {
          screens: {
            Conversations: 'app/accounts/:accountId/conversations',
          },
        },
        ChatScreen: {
          path: 'app/accounts/:accountId/conversations/:conversationId/:primaryActorId?/:primaryActorType?',
          parse: {
            conversationId: (conversationId: string) => Number(conversationId),
            primaryActorId: (primaryActorId: string) =>
              primaryActorId ? Number(primaryActorId) : undefined,
            primaryActorType: (primaryActorType: string) =>
              primaryActorType ? decodeURIComponent(primaryActorType) : undefined,
          },
        },
      },
    },
    // getStateFromPath: App running, receives deep link - handles SSO callbacks and conversation navigation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getStateFromPath: (path: string, config: any) => {
      const incomingPath = path;
      // Handle SSO callback - App running, receives deep link
      const sanitizedPath = normalizePath(incomingPath);

      if (incomingPath.includes(SSO_CALLBACK_URL) || incomingPath.includes('auth/saml')) {
        const ssoParams = SsoUtils.parseCallbackUrl(`chatwootapp://${incomingPath}`);
        // Handle both success and error cases
        SsoUtils.handleSsoCallback(ssoParams, dispatch);
        // Return undefined to prevent navigation change for SSO callback
        return undefined;
      }

      if (
        sanitizedPath === 'inbox' ||
        sanitizedPath.includes('inbox') ||
        (sanitizedPath.includes('/conversations') && !hasConversationIdInPath(sanitizedPath))
      ) {
        return buildConversationsState();
      }

      let primaryActorId = null as number | null;
      let primaryActorType = null as string | null;
      const state = getStateFromPath(path, config);
      const { routes } = state || {};

      // Extract optional query params (e.g., ?ref=whatsapp)
      const queryString = path.includes('?') ? path.split('?')[1] : '';
      const searchParams = new URLSearchParams(queryString);
      const ref = searchParams.get('ref') || undefined;

      const conversationId = extractConversationIdFromUrl({ url: path });

      if (!conversationId) {
        if (sanitizedPath.includes('/conversations')) {
          return buildConversationsState();
        }
        return;
      }
      if (routes && routes[0]) {
        const { params } = routes[0];
        primaryActorId = (params as { primaryActorId?: number })?.primaryActorId ?? null;
        primaryActorType = (params as { primaryActorType?: string })?.primaryActorType ?? null;
      }
      return {
        routes: [
          {
            name: 'ChatScreen',
            params: {
              conversationId,
              primaryActorId: primaryActorId ?? undefined,
              primaryActorType: primaryActorType ?? undefined,
              ref,
            },
          },
        ],
      };
    },
    // getInitialURL: App starting up from deep link - handles SSO callbacks and push notifications
    async getInitialURL() {
      // Check if app was opened from a deep link
      const url = await Linking.getInitialURL();

      if (url != null) {
        // Handle SSO callback - App starting up from deep link
        if (url.includes(SSO_CALLBACK_URL)) {
          const ssoParams = SsoUtils.parseCallbackUrl(url);
          // Handle both success and error cases
          SsoUtils.handleSsoCallback(ssoParams, dispatch);
          return null; // Don't navigate for SSO callback
        }
        return url;
      }

      // getInitialNotification: When the application is opened from a quit state.
      const messaging = getMessaging(getApp());
      const message = await getInitialNotification(messaging);
      if (message) {
        const notification = findNotificationFromFCM({ message });
        const camelCaseNotification = transformNotification(notification);
        const conversationLink = findConversationLinkFromPush({
          notification: camelCaseNotification,
          installationUrl,
        });
        if (conversationLink) {
          return conversationLink;
        }
      }
      return undefined;
    },
    // subscribe: App backgrounded, receives deep link - handles SSO callbacks and push notifications
    subscribe(listener: (arg0: string) => void) {
      const onReceiveURL = ({ url }: { url: string }) => {
        // Handle SSO callback - App backgrounded, receives deep link
        if (url.includes(SSO_CALLBACK_URL)) {
          const ssoParams = SsoUtils.parseCallbackUrl(url);
          // Handle both success and error cases
          SsoUtils.handleSsoCallback(ssoParams, dispatch);
          return; // Don't pass SSO callback to navigation
        }
        listener(url);
      };

      // Listen to incoming links from deep linking
      const subscription = Linking.addEventListener('url', onReceiveURL);

      // Only setup Firebase messaging if Firebase is initialized
      let unsubscribeNotification: (() => void) | undefined;

      (async () => {
        const ready = await waitForFirebaseInit({ timeoutMs: 5000, pollMs: 100 });
        if (ready) {
          try {
            //onNotificationOpenedApp: When the application is running, but in the background.
            const messaging = getMessaging(getApp());
            unsubscribeNotification = onNotificationOpenedApp(messaging, message => {
              if (message) {
                const notification = findNotificationFromFCM({ message });
                const camelCaseNotification = transformNotification(notification);

                const conversationLink = findConversationLinkFromPush({
                  notification: camelCaseNotification,
                  installationUrl,
                });
                if (conversationLink) {
                  listener(conversationLink);
                }
              }
            });
          } catch (error) {
            console.error('Failed to setup notification listener in linking:', error);
          }
        } else {
          console.warn('Firebase not initialized, skipping notification listener in linking');
        }
      })();

      return () => {
        subscription.remove();
        if (unsubscribeNotification) {
          unsubscribeNotification();
        }
      };
    },
  };

  i18n.locale = locale;

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  // Create a custom dark theme with Radix-resolved colors
  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: tailwind.color('bg-solid-1') ?? '#000000',
      card: tailwind.color('bg-slate-2') ?? '#111827',
      text: tailwind.color('text-slate-12') ?? '#ffffff',
      border: tailwind.color('bg-slate-6') ?? '#374151',
      notification: tailwind.color('bg-iris-9') ?? '#3b82f6',
    },
  };

  return (
    <NavigationContainer
      theme={isDark ? customDarkTheme : DefaultTheme}
      linking={linking}
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
      }}
      onStateChange={async () => {
        routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
      }}
      fallback={<ActivityIndicator animating />}>
      <BottomSheetModalProvider>
        <View
          style={[themedTailwind.style('bg-background'), styles.navigationLayout]}
          onLayout={onLayoutRootView}>
          <AppTabs />
        </View>
      </BottomSheetModalProvider>
    </NavigationContainer>
  );
};
export const AppNavigator = () => {
  const themedTailwind = useThemedStyles();

  return (
    <GestureHandlerRootView
      style={[themedTailwind.style('bg-background'), styles.navigationLayout]}>
      <KeyboardProvider>
        <RefsProvider>
          <SafeAreaProvider style={themedTailwind.style('bg-background')}>
            <AppNavigationContainer />
          </SafeAreaProvider>
        </RefsProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  navigationLayout: {
    flex: 1,
  },
});
