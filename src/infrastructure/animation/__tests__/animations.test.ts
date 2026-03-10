import {
  softLayout,
  snappyLayout,
  snappySlideInDown,
  snappySlideOutDown,
  snappySlideInUp,
  contentFadeIn,
  quickFadeIn,
  slowFadeIn,
  createSlideIn,
  createLayoutTransition,
} from '../animations';
import { spring } from '../springs';

describe('animation factories', () => {
  describe('layout transitions', () => {
    it('should return a new instance each call for softLayout', () => {
      const a = softLayout();
      const b = softLayout();
      expect(a).not.toBe(b);
    });

    it('should return a new instance each call for snappyLayout', () => {
      const a = snappyLayout();
      const b = snappyLayout();
      expect(a).not.toBe(b);
    });
  });

  describe('slide animations', () => {
    it('should return a new instance each call for snappySlideInDown', () => {
      const a = snappySlideInDown();
      const b = snappySlideInDown();
      expect(a).not.toBe(b);
    });

    it('should return a new instance each call for snappySlideOutDown', () => {
      const a = snappySlideOutDown();
      const b = snappySlideOutDown();
      expect(a).not.toBe(b);
    });

    it('should return a new instance each call for snappySlideInUp', () => {
      const a = snappySlideInUp();
      const b = snappySlideInUp();
      expect(a).not.toBe(b);
    });
  });

  describe('fade animations', () => {
    it('should return a new instance each call for contentFadeIn', () => {
      const a = contentFadeIn();
      const b = contentFadeIn();
      expect(a).not.toBe(b);
    });

    it('should return a new instance each call for quickFadeIn', () => {
      const a = quickFadeIn();
      const b = quickFadeIn();
      expect(a).not.toBe(b);
    });

    it('should return a new instance each call for slowFadeIn', () => {
      const a = slowFadeIn();
      const b = slowFadeIn();
      expect(a).not.toBe(b);
    });
  });

  describe('generic factories', () => {
    it('should return a new instance each call for createSlideIn', () => {
      const a = createSlideIn('down');
      const b = createSlideIn('down');
      expect(a).not.toBe(b);
    });

    it('should return a new instance each call for createLayoutTransition', () => {
      const a = createLayoutTransition(spring.soft);
      const b = createLayoutTransition(spring.soft);
      expect(a).not.toBe(b);
    });
  });
});
