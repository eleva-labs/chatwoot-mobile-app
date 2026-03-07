/* eslint-disable @typescript-eslint/no-explicit-any */

// Module mocks (required before any import that transitively loads native dependencies)
import { renderHook } from '@testing-library/react-native';
import React from 'react';
import { Provider } from 'react-redux';
import { createTestStore } from '@/__tests__/helpers';
import { useRealtime } from '../useRealtime';
import { ActionCableService } from '../realtimeService';

jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(() => ({ name: '[DEFAULT]' })),
  getApps: jest.fn(() => []),
}));
jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: jest.fn(),
  hasPermission: jest.fn(() => Promise.resolve(true)),
  getToken: jest.fn(() => Promise.resolve('mock-token')),
  onMessage: jest.fn(() => jest.fn()),
}));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { MAX: 5 },
  setNotificationChannelAsync: jest.fn(),
}));
jest.mock('expo', () => ({
  isRunningInExpoGo: jest.fn(() => false),
}));
jest.mock('react-native-device-info', () => ({
  getSystemName: jest.fn(() => 'iOS'),
  getModel: jest.fn(() => 'iPhone'),
  getSystemVersion: jest.fn(() => '17.0'),
  getUniqueId: jest.fn(() => Promise.resolve('mock-device-id')),
  getVersion: jest.fn(() => '1.0.0'),
  getBuildNumber: jest.fn(() => '1'),
  getBundleId: jest.fn(() => 'com.test.app'),
}));
jest.mock('@infrastructure/utils/firebaseUtils', () => ({
  waitForFirebaseInit: jest.fn(() => Promise.resolve()),
}));
jest.mock('@infrastructure/utils/pushUtils', () => ({
  clearAllDeliveredNotifications: jest.fn(),
}));

// Track AppState listeners for manual trigger in tests
const appStateListeners: ((state: string) => void)[] = [];
const mockRemove = jest.fn();

// Extend the global react-native mock with AppState support
jest.mock('react-native', () => ({
  Platform: { OS: 'ios', select: jest.fn((obj: any) => obj.ios) },
  Dimensions: { get: jest.fn(() => ({ width: 375, height: 812 })) },
  StyleSheet: {
    create: jest.fn((styles: any) => styles),
    flatten: jest.fn((style: any) => {
      if (Array.isArray(style)) return Object.assign({}, ...style.filter(Boolean));
      return style || {};
    }),
  },
  AppState: {
    addEventListener: jest.fn((_type: string, listener: (state: string) => void) => {
      appStateListeners.push(listener);
      return { remove: mockRemove };
    }),
    currentState: 'active',
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

// Mock ActionCableService
jest.mock('../realtimeService', () => {
  let connected = false;
  return {
    ActionCableService: {
      init: jest.fn(() => {
        connected = true;
      }),
      disconnect: jest.fn(() => {
        connected = false;
      }),
      get isConnected() {
        return connected;
      },
      __setConnected: (value: boolean) => {
        connected = value;
      },
    },
  };
});

// Mock navigationRef
jest.mock('@infrastructure/utils/navigationUtils', () => ({
  navigationRef: { current: { getCurrentRoute: jest.fn(() => ({ name: 'Tab', params: {} })) } },
}));

function createWrapper(store: ReturnType<typeof createTestStore>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(Provider, { store, children });
  };
}

describe('useRealtime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    appStateListeners.length = 0;
    (ActionCableService as any).__setConnected(false);
  });

  it('calls init when valid config is present', () => {
    const store = createTestStore({
      auth: { user: { id: 1, account_id: 1, pubsub_token: 'abc' } } as any,
      settings: { installationUrl: 'https://app.chatwoot.com/' } as any,
    });

    renderHook(() => useRealtime(), { wrapper: createWrapper(store) });

    expect(ActionCableService.init).toHaveBeenCalledWith(
      expect.objectContaining({ pubSubToken: 'abc' }),
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('calls disconnect on unmount', () => {
    const store = createTestStore({
      auth: { user: { id: 1, account_id: 1, pubsub_token: 'abc' } } as any,
      settings: { installationUrl: 'https://app.chatwoot.com/' } as any,
    });

    const { unmount } = renderHook(() => useRealtime(), {
      wrapper: createWrapper(store),
    });

    jest.clearAllMocks();
    unmount();
    expect(ActionCableService.disconnect).toHaveBeenCalled();
  });

  it('does not call init when config is null (no credentials)', () => {
    const store = createTestStore({
      auth: { user: null } as any,
    });

    renderHook(() => useRealtime(), { wrapper: createWrapper(store) });

    expect(ActionCableService.init).not.toHaveBeenCalled();
  });

  it('calls disconnect when config is null (logged out)', () => {
    const store = createTestStore({
      auth: { user: null } as any,
    });

    renderHook(() => useRealtime(), { wrapper: createWrapper(store) });

    expect(ActionCableService.disconnect).toHaveBeenCalled();
  });

  it('calls init on AppState active when not connected', () => {
    const store = createTestStore({
      auth: { user: { id: 1, account_id: 1, pubsub_token: 'abc' } } as any,
      settings: { installationUrl: 'https://app.chatwoot.com/' } as any,
    });

    renderHook(() => useRealtime(), { wrapper: createWrapper(store) });

    // Simulate disconnected state after initial connect
    (ActionCableService as any).__setConnected(false);
    jest.clearAllMocks();

    // Simulate foreground resume
    appStateListeners.forEach(listener => listener('active'));

    expect(ActionCableService.init).toHaveBeenCalledTimes(1);
  });

  it('does not call init on AppState active when already connected', () => {
    const store = createTestStore({
      auth: { user: { id: 1, account_id: 1, pubsub_token: 'abc' } } as any,
      settings: { installationUrl: 'https://app.chatwoot.com/' } as any,
    });

    renderHook(() => useRealtime(), { wrapper: createWrapper(store) });

    // Service is connected after init
    jest.clearAllMocks();

    // Simulate foreground resume while connected
    appStateListeners.forEach(listener => listener('active'));

    expect(ActionCableService.init).not.toHaveBeenCalled();
  });

  it('does not call init on AppState active when config is null', () => {
    const store = createTestStore({
      auth: { user: null } as any,
    });

    renderHook(() => useRealtime(), { wrapper: createWrapper(store) });
    jest.clearAllMocks();

    // Simulate foreground resume with no credentials
    appStateListeners.forEach(listener => listener('active'));

    expect(ActionCableService.init).not.toHaveBeenCalled();
  });

  it('removes AppState listener on unmount', () => {
    const store = createTestStore({
      auth: { user: { id: 1, account_id: 1, pubsub_token: 'abc' } } as any,
      settings: { installationUrl: 'https://app.chatwoot.com/' } as any,
    });

    const { unmount } = renderHook(() => useRealtime(), {
      wrapper: createWrapper(store),
    });

    unmount();
    expect(mockRemove).toHaveBeenCalled();
  });
});
