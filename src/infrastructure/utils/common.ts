import { useChromeMetrics } from './useChromeMetrics';

/** @deprecated Use `useChromeMetrics()` from `@infrastructure/utils` instead.
 *  This hook returns the same value as `useChromeMetrics().tabBarHeight` but
 *  doesn't expose the other geometry values consumers typically need. */
export const useTabBarHeight = () => {
  return useChromeMetrics().tabBarHeight;
};
