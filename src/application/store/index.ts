import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  configureStore,
  ThunkAction,
  ThunkDispatch,
  Action,
  Middleware,
  AnyAction,
  UnknownAction,
} from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import { appReducer } from '@application/store/reducers';
import { setStore } from './storeAccessor';
import { contactListenerMiddleware } from './contact/contactListener';

const CURRENT_VERSION = 2;

const persistConfig = {
  key: 'Root',
  version: CURRENT_VERSION,
  storage: AsyncStorage,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  migrate: async (state: any) => {
    // If the stored version is older or doesn't exist, return initial state
    if (!state?._persist?.version || state._persist.version < CURRENT_VERSION) {
      const initialState = appReducer(undefined, { type: 'INIT' });
      return {
        ...initialState,
      };
    }
    return state;
  },
};

const middlewares: Middleware[] = [contactListenerMiddleware.middleware];

const rootReducer = (state: ReturnType<typeof appReducer>, action: AnyAction) => {
  if (action.type === 'auth/logout') {
    const initialState = appReducer(undefined, { type: 'INIT' });
    return { ...initialState, settings: state.settings };
  }

  // Handle Redux Persist rehydration - check for environment mismatch.
  if (action.type === 'persist/REHYDRATE' && action.payload?.settings) {
    const persistedSettings = action.payload.settings;
    const envBaseUrl = process.env.EXPO_PUBLIC_BASE_URL;
    const envInstallationUrl = process.env.EXPO_PUBLIC_INSTALLATION_URL;

    // Check if persisted URLs don't match current environment variables
    const urlMismatch =
      (envBaseUrl && persistedSettings.baseUrl !== envBaseUrl) ||
      (envInstallationUrl && persistedSettings.installationUrl !== envInstallationUrl);

    if (urlMismatch) {
      const resolvedInstallationUrl = envInstallationUrl || persistedSettings.installationUrl;
      const updatedPayload = {
        ...action.payload,
        settings: {
          ...persistedSettings,
          baseUrl: envBaseUrl || persistedSettings.baseUrl,
          installationUrl: resolvedInstallationUrl,
        },
      };
      return appReducer(state, { ...action, payload: updatedPayload });
    }
  }

  return appReducer(state, action);
};

// @ts-ignore
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
          'auth/setCurrentUserAvailability',
          'contact/updateContactsPresence',
        ],
      },
      immutableCheck: { warnAfter: 256 },
    }).concat(middlewares) as typeof getDefaultMiddleware extends (...args: unknown[]) => infer R
      ? R
      : never,
});

// TODO: Please get rid of this
setStore(store);

export const persistor = persistStore(store);

// Explicitly type AppDispatch using ThunkDispatch instead of `typeof store.dispatch`.
// With redux-persist wrapping the reducer, TypeScript can't infer the correct dispatch type
// from the store (it resolves to `never`). This manual typing restores full dispatch support.
export type AppDispatch = ThunkDispatch<RootState, unknown, UnknownAction>;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
