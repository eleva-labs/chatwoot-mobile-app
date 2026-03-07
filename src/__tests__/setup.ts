/**
 * Global Test Setup File
 *
 * This file configures the test environment with global mocks,
 * console suppression, and test utilities for ALL test suites.
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars, @typescript-eslint/no-namespace */

import 'reflect-metadata';

import { resultMatchers } from './helpers/matchers/resultMatchers';

// ─── Custom Matchers ─────────────────────────────────────────────
expect.extend(resultMatchers);

// ─── React Native Core Mocks ────────────────────────────────────
jest.mock('react-native', () => ({
  Platform: { OS: 'ios', select: jest.fn(obj => obj.ios) },
  Dimensions: { get: jest.fn(() => ({ width: 375, height: 812 })) },
  StyleSheet: {
    create: jest.fn(styles => styles),
    flatten: jest.fn(style => {
      if (Array.isArray(style)) return Object.assign({}, ...style.filter(Boolean));
      return style || {};
    }),
  },
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  ActivityIndicator: 'ActivityIndicator',
  Pressable: 'Pressable',
  FlatList: 'FlatList',
}));

// ─── Framework Mocks (used by nearly all modules) ───────────────
jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

jest.mock('@infrastructure/i18n', () => ({
  t: (key: string) => key,
}));

jest.mock('@infrastructure/utils/toastUtils', () => ({
  showToast: jest.fn(),
}));

// ─── Navigation Mock ────────────────────────────────────────────
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setOptions: jest.fn(),
  })),
  useRoute: jest.fn(() => ({ params: {} })),
  useFocusEffect: jest.fn(cb => cb()),
  useIsFocused: jest.fn(() => true),
}));

// ─── Native Module Mocks ────────────────────────────────────────
jest.mock('react-native-reanimated', () => {
  return {
    default: {
      View: 'Animated.View',
      Text: 'Animated.Text',
      ScrollView: 'Animated.ScrollView',
      createAnimatedComponent: (component: any) => component,
    },
    useSharedValue: jest.fn(init => ({ value: init })),
    useAnimatedStyle: jest.fn(() => ({})),
    withTiming: jest.fn(v => v),
    withSpring: jest.fn(v => v),
    withDecay: jest.fn(v => v),
    withRepeat: jest.fn(v => v),
    withSequence: jest.fn(v => v),
    runOnJS: jest.fn(fn => fn),
    runOnUI: jest.fn(fn => fn),
    cancelAnimation: jest.fn(),
    Easing: {
      linear: jest.fn(),
      ease: jest.fn(),
      in: jest.fn(),
      out: jest.fn(),
      inOut: jest.fn(),
    },
  };
});

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve(true)),
  getStringAsync: jest.fn(() => Promise.resolve('')),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true, assets: [] })),
  launchCameraAsync: jest.fn(() => Promise.resolve({ canceled: true, assets: [] })),
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  UIImagePickerPresentationStyle: { FORM_SHEET: 'formSheet' },
  MediaType: { Images: 'images', Videos: 'videos' },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-video', () => ({
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    loop: false,
    muted: false,
    currentTime: 0,
    duration: 0,
    status: 'idle',
    playing: false,
  })),
  VideoView: 'VideoView',
}));

jest.mock('expo', () => ({
  useEvent: jest.fn((_player: unknown, _event: string, initial: unknown) => initial),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() =>
    Promise.resolve({ isConnected: true, isInternetReachable: true, type: 'wifi' }),
  ),
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock('react-native-keyboard-controller', () => ({
  useKeyboardHandler: jest.fn(() => ({})),
  KeyboardProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-firebase/analytics', () => ({
  __esModule: true,
  default: () => ({
    logEvent: jest.fn(),
    setAnalyticsCollectionEnabled: jest.fn(),
    setUserId: jest.fn(),
    setUserProperties: jest.fn(),
  }),
}));

jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Path: 'Path',
  Circle: 'Circle',
  Rect: 'Rect',
  G: 'G',
  Defs: 'Defs',
  LinearGradient: 'LinearGradient',
  Stop: 'Stop',
  ClipPath: 'ClipPath',
  Text: 'Text',
  TSpan: 'TSpan',
  Use: 'Use',
}));

jest.mock('tsyringe', () => ({
  container: { resolve: jest.fn(), register: jest.fn(), registerSingleton: jest.fn() },
  injectable: () => jest.fn(),
  inject: () => jest.fn(),
  singleton: () => jest.fn(),
}));

// Create AxiosError class for mocking (needed for instanceof checks in onboarding and other modules)
class MockAxiosError extends Error {
  isAxiosError = true;
  response?: {
    status: number;
    statusText: string;
    data: any;
    headers: any;
    config: any;
  };
  config?: any;
  code?: string;
  request?: any;

  constructor(message: string) {
    super(message);
    this.name = 'AxiosError';
  }
}

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  })),
  isAxiosError: jest.fn(() => false),
  // Export AxiosError so instanceof checks work
  AxiosError: MockAxiosError,
  default: {
    create: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ data: {} })),
      post: jest.fn(() => Promise.resolve({ data: {} })),
      put: jest.fn(() => Promise.resolve({ data: {} })),
      delete: jest.fn(() => Promise.resolve({ data: {} })),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    })),
  },
}));

jest.mock('i18n-js', () => {
  const translations: Record<string, string> = {
    'onboarding.retry': 'Retry',
    'onboarding.errorTitle': 'Error',
    'onboarding.genericError': 'An error occurred',
    'onboarding.offlineIndicator':
      'No internet connection. Your answers will be saved and submitted when you come back online.',
  };
  const mockInstance = {
    translations: {},
    locale: 'en',
    defaultLocale: 'en',
    enableFallback: true,
    t: (key: string) => translations[key] || key,
    store: jest.fn(),
  };
  return {
    __esModule: true,
    I18n: jest.fn(() => mockInstance),
    default: mockInstance,
  };
});

// ─── Console Suppression ─────────────────────────────────────────
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = jest.fn(msg => {
    if (!String(msg).includes('Animated') && !String(msg).includes('NativeModule')) {
      originalWarn(msg);
    }
  });
  console.error = jest.fn(msg => {
    if (!String(msg).includes('Warning:') && !String(msg).includes('Act')) {
      originalError(msg);
    }
  });
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// ─── Global Cleanup ──────────────────────────────────────────────
afterEach(() => {
  jest.clearAllMocks();
});

jest.setTimeout(10000);
