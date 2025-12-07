/**
 * Test Setup File for Onboarding Module
 *
 * This file configures the test environment with custom matchers,
 * global mocks, and test utilities.
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars, @typescript-eslint/no-namespace */

import 'reflect-metadata';
import { resultMatchers } from './helpers/testHelpers';

// Mock i18n-js before any other imports
jest.mock('i18n-js', () => ({
  __esModule: true,
  default: {
    translations: {},
    t: (key: string) => {
      // Return the key as fallback, or a simple translation map
      const translations: Record<string, string> = {
        'onboarding.retry': 'Retry',
        'onboarding.errorTitle': 'Error',
        'onboarding.genericError': 'An error occurred',
        'onboarding.offlineIndicator':
          'No internet connection. Your answers will be saved and submitted when you come back online.',
      };
      return translations[key] || key;
    },
  },
}));

// Mock document for @testing-library/react-hooks (needed for React Native tests)
if (typeof document === 'undefined') {
  // @ts-expect-error - Mocking document for React Native test environment
  global.document = {
    createElement: jest.fn(),
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn(),
    },
  } as unknown as Document;
}

// Extend Jest matchers with custom Result matchers
expect.extend(resultMatchers);

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn(obj => obj.ios),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
  },
  StyleSheet: {
    create: jest.fn(styles => styles),
    flatten: jest.fn(style => {
      // Return the style as-is for testing
      if (Array.isArray(style)) {
        return Object.assign({}, ...style.filter(Boolean));
      }
      return style || {};
    }),
  },
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  ActivityIndicator: 'ActivityIndicator',
}));

// Mock AsyncStorage
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

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  })),
  useFocusEffect: jest.fn(callback => {
    callback();
  }),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
  };
});

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock react-native-keyboard-controller
jest.mock('react-native-keyboard-controller', () => ({
  useKeyboardHandler: jest.fn(() => ({})),
  KeyboardProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  return {
    default: {
      View: 'AnimatedView',
      Text: 'AnimatedText',
      ScrollView: 'AnimatedScrollView',
    },
    useSharedValue: jest.fn(init => ({ value: init })),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn(toValue => toValue),
    withTiming: jest.fn(toValue => toValue),
    Easing: {
      linear: jest.fn(),
      ease: jest.fn(),
      quad: jest.fn(),
      cubic: jest.fn(),
    },
  };
});

// Mock @react-native-firebase/analytics
jest.mock('@react-native-firebase/analytics', () => ({
  __esModule: true,
  default: () => ({
    logEvent: jest.fn(),
    setAnalyticsCollectionEnabled: jest.fn(),
    setUserId: jest.fn(),
    setUserProperties: jest.fn(),
  }),
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
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
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  return {
    default: {
      View: 'Animated.View',
      Text: 'Animated.Text',
      ScrollView: 'Animated.ScrollView',
      createAnimatedComponent: (component: any) => component,
      Value: jest.fn(),
      event: jest.fn(),
      add: jest.fn(),
      eq: jest.fn(),
      set: jest.fn(),
      cond: jest.fn(),
      interpolate: jest.fn(),
      Extrapolate: { EXTEND: 'extend', CLAMP: 'clamp' },
      Transition: {
        Together: 'Together',
        Sequence: 'Sequence',
      },
      Easing: {
        in: jest.fn(),
        out: jest.fn(),
        inOut: jest.fn(),
      },
      timing: jest.fn(),
      spring: jest.fn(),
      decay: jest.fn(),
      sequence: jest.fn(),
      parallel: jest.fn(),
      stagger: jest.fn(),
      loop: jest.fn(),
      useSharedValue: jest.fn(() => ({ value: 0 })),
      useAnimatedStyle: jest.fn(() => ({})),
      useAnimatedGestureHandler: jest.fn(),
      useAnimatedReaction: jest.fn(),
      withTiming: jest.fn(value => value),
      withSpring: jest.fn(value => value),
      withDecay: jest.fn(value => value),
      withRepeat: jest.fn(value => value),
      withSequence: jest.fn(value => value),
      cancelAnimation: jest.fn(),
      runOnJS: jest.fn(fn => fn),
      runOnUI: jest.fn(fn => fn),
    },
  };
});

// Mock NetInfo for network state
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    }),
  ),
  addEventListener: jest.fn(() => jest.fn()),
}));

// Create AxiosError class for mocking
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

// Mock Axios for API calls
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

// Mock TSyringe
jest.mock('tsyringe', () => ({
  container: {
    resolve: jest.fn(),
    register: jest.fn(),
    registerSingleton: jest.fn(),
  },
  injectable: () => jest.fn(),
  inject: () => jest.fn(),
  singleton: () => jest.fn(),
}));

// Suppress console warnings in tests (optional)
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = jest.fn(message => {
    // Only show warnings that aren't React Native test warnings
    if (!message.includes('Animated') && !message.includes('NativeModule')) {
      originalWarn(message);
    }
  });

  console.error = jest.fn(message => {
    // Suppress expected errors in tests
    if (!message.includes('Warning:') && !message.includes('Act')) {
      originalError(message);
    }
  });
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// Global test timeout (increase for slower tests)
jest.setTimeout(10000);

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// TypeScript declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeSuccess(): R;
      toBeFailure(): R;
      toHaveValue(expected: any): R;
      toHaveError(expectedMessage?: string): R;
    }
  }
}

export {};
