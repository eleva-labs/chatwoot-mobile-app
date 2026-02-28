import type { NativeScrollEvent } from 'react-native';
import {
  calculateDistanceFromBottom,
  isNearBottom,
  NEAR_BOTTOM_THRESHOLD,
} from '../aiChatScrollUtils';

/** Create a mock scroll event with required NativeScrollEvent fields */
function mockScrollEvent(
  offsetY: number,
  contentHeight: number,
  viewportHeight: number,
): { nativeEvent: NativeScrollEvent } {
  return {
    nativeEvent: {
      contentOffset: { x: 0, y: offsetY },
      contentSize: { width: 375, height: contentHeight },
      layoutMeasurement: { width: 375, height: viewportHeight },
      contentInset: { top: 0, left: 0, bottom: 0, right: 0 },
      zoomScale: 1,
    },
  };
}

describe('NEAR_BOTTOM_THRESHOLD', () => {
  it('is a positive number', () => {
    expect(NEAR_BOTTOM_THRESHOLD).toBeGreaterThan(0);
  });

  it('equals 100', () => {
    expect(NEAR_BOTTOM_THRESHOLD).toBe(100);
  });
});

describe('calculateDistanceFromBottom', () => {
  it('calculates correct distance when at top', () => {
    // distance = 1000 - (0 + 600) = 400
    expect(calculateDistanceFromBottom(mockScrollEvent(0, 1000, 600))).toBe(400);
  });

  it('calculates correct distance when at bottom', () => {
    // distance = 1000 - (400 + 600) = 0
    expect(calculateDistanceFromBottom(mockScrollEvent(400, 1000, 600))).toBe(0);
  });

  it('calculates correct distance when scrolled partially', () => {
    // distance = 1000 - (200 + 600) = 200
    expect(calculateDistanceFromBottom(mockScrollEvent(200, 1000, 600))).toBe(200);
  });

  it('handles case where content is smaller than viewport', () => {
    // distance = 300 - (0 + 600) = -300
    expect(calculateDistanceFromBottom(mockScrollEvent(0, 300, 600))).toBe(-300);
  });

  it('returns negative when overscrolled past bottom', () => {
    // distance = 1000 - (500 + 600) = -100
    expect(calculateDistanceFromBottom(mockScrollEvent(500, 1000, 600))).toBe(-100);
  });
});

describe('isNearBottom', () => {
  it('returns true when distance is 0', () => {
    expect(isNearBottom(0)).toBe(true);
  });

  it('returns true when distance is within threshold', () => {
    expect(isNearBottom(NEAR_BOTTOM_THRESHOLD - 1)).toBe(true);
  });

  it('returns true when distance equals threshold', () => {
    expect(isNearBottom(NEAR_BOTTOM_THRESHOLD)).toBe(true);
  });

  it('returns false when distance exceeds threshold', () => {
    expect(isNearBottom(NEAR_BOTTOM_THRESHOLD + 1)).toBe(false);
  });

  it('returns true for negative distance (overscrolled)', () => {
    expect(isNearBottom(-50)).toBe(true);
  });
});
