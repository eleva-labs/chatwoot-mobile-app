import {
  calculateDistanceFromBottom,
  isNearBottom,
  NEAR_BOTTOM_THRESHOLD,
} from '../aiChatScrollUtils';

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
    const event = {
      nativeEvent: {
        contentOffset: { x: 0, y: 0 },
        contentSize: { width: 375, height: 1000 },
        layoutMeasurement: { width: 375, height: 600 },
      },
    };
    // distance = 1000 - (0 + 600) = 400
    expect(calculateDistanceFromBottom(event)).toBe(400);
  });

  it('calculates correct distance when at bottom', () => {
    const event = {
      nativeEvent: {
        contentOffset: { x: 0, y: 400 },
        contentSize: { width: 375, height: 1000 },
        layoutMeasurement: { width: 375, height: 600 },
      },
    };
    // distance = 1000 - (400 + 600) = 0
    expect(calculateDistanceFromBottom(event)).toBe(0);
  });

  it('calculates correct distance when scrolled partially', () => {
    const event = {
      nativeEvent: {
        contentOffset: { x: 0, y: 200 },
        contentSize: { width: 375, height: 1000 },
        layoutMeasurement: { width: 375, height: 600 },
      },
    };
    // distance = 1000 - (200 + 600) = 200
    expect(calculateDistanceFromBottom(event)).toBe(200);
  });

  it('handles case where content is smaller than viewport', () => {
    const event = {
      nativeEvent: {
        contentOffset: { x: 0, y: 0 },
        contentSize: { width: 375, height: 300 },
        layoutMeasurement: { width: 375, height: 600 },
      },
    };
    // distance = 300 - (0 + 600) = -300
    expect(calculateDistanceFromBottom(event)).toBe(-300);
  });

  it('returns negative when overscrolled past bottom', () => {
    const event = {
      nativeEvent: {
        contentOffset: { x: 0, y: 500 },
        contentSize: { width: 375, height: 1000 },
        layoutMeasurement: { width: 375, height: 600 },
      },
    };
    // distance = 1000 - (500 + 600) = -100
    expect(calculateDistanceFromBottom(event)).toBe(-100);
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
