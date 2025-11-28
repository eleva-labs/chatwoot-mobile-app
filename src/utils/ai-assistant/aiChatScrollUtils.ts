import type { NativeScrollEvent } from 'react-native';

/**
 * Threshold in pixels to consider user "near bottom" for auto-scroll
 */
export const NEAR_BOTTOM_THRESHOLD = 100;

/**
 * Calculates the distance from the bottom of the scroll view
 */
export function calculateDistanceFromBottom(event: { nativeEvent: NativeScrollEvent }): number {
  const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
  const scrollY = contentOffset.y;
  const contentHeight = contentSize.height;
  const viewportHeight = layoutMeasurement.height;

  return contentHeight - (scrollY + viewportHeight);
}

/**
 * Determines if the user is near the bottom of the scroll view
 */
export function isNearBottom(distanceFromBottom: number): boolean {
  return distanceFromBottom <= NEAR_BOTTOM_THRESHOLD;
}
