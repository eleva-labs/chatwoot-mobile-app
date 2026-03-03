import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@application/store';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Theme-related hooks and other infrastructure hooks
export * from '@infrastructure/hooks/useThemedStyles';
export * from '@infrastructure/hooks/useScreenAnalytics';
export * from '@infrastructure/hooks/useOnboardingAnalytics';
export * from '@infrastructure/hooks/usePushNotifications';
