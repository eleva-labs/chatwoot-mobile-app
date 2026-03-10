import { spring, timing, PRESS_SCALE_VALUE } from '../springs';

describe('spring tokens', () => {
  it('should have expected values for soft spring', () => {
    expect(spring.soft).toEqual({ damping: 28, stiffness: 200 });
  });

  it('should have expected values for snappy spring', () => {
    expect(spring.snappy).toEqual({ damping: 80, stiffness: 240 });
  });

  it('should have expected values for sheet spring', () => {
    expect(spring.sheet).toEqual({ mass: 1, stiffness: 420, damping: 80 });
  });

  it('should have overshootClamping on keyboard spring', () => {
    expect(spring.keyboard.overshootClamping).toBe(true);
  });

  it('should have overshootClamping on pressScale spring', () => {
    expect(spring.pressScale.overshootClamping).toBe(true);
  });

  it('should export all tokens as plain objects (worklet-safe)', () => {
    Object.values(spring).forEach(config => {
      expect(typeof config).toBe('object');
      expect(config).not.toBeInstanceOf(Function);
    });
  });
});

describe('timing tokens', () => {
  it('should have expected duration tiers', () => {
    expect(timing.quick.duration).toBe(150);
    expect(timing.fast.duration).toBe(200);
    expect(timing.standard.duration).toBe(250);
    expect(timing.content.duration).toBe(300);
    expect(timing.slow.duration).toBe(350);
  });
});

describe('PRESS_SCALE_VALUE', () => {
  it('should be 0.96', () => {
    expect(PRESS_SCALE_VALUE).toBe(0.96);
  });
});
