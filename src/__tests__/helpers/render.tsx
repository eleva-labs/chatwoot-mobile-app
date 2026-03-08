// src/__tests__/helpers/render.tsx

import React from 'react';
import { render, type RenderOptions } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { appReducer } from '@application/store/reducers';

// Type for partial preloaded state
type RootState = ReturnType<typeof appReducer>;
type PreloadedState = Partial<{
  [K in keyof RootState]: Partial<RootState[K]>;
}>;

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: PreloadedState;
  store?: ReturnType<typeof createTestStore>;
}

export function createTestStore(preloadedState?: PreloadedState) {
  return configureStore({
    reducer: appReducer,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    preloadedState: preloadedState as any,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  });
}

export function renderWithProviders(
  ui: React.ReactElement<unknown>,
  {
    preloadedState,
    store = createTestStore(preloadedState),
    ...renderOptions
  }: ExtendedRenderOptions = {},
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Re-export everything from RNTL for convenience
export { screen, userEvent, act, within, waitFor } from '@testing-library/react-native';
