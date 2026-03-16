// Re-export store hooks from their canonical location for backward compatibility.
// TODO: Remove this file once all consumers import from @application/store/hooks directly.
export { useAppDispatch, useAppSelector } from '@application/store/hooks';

// Infrastructure hooks re-exports
export * from '@infrastructure/hooks/useThemedStyles';
export * from '@infrastructure/hooks/useScreenAnalytics';
export * from '@infrastructure/hooks/useOnboardingAnalytics';
export * from '@infrastructure/hooks/usePushNotifications';
