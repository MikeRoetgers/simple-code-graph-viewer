import { describe, it, expect } from 'vitest';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  createRadiusScale,
  createWeightScale,
  createNodeColorScale,
  createLinkColorScale,
} from '../src/defaults.js';

describe('defaults', () => {
  describe('constants', () => {
    it('DEFAULT_WIDTH equals 960', () => {
      expect(DEFAULT_WIDTH).toBe(960);
    });

    it('DEFAULT_HEIGHT equals 600', () => {
      expect(DEFAULT_HEIGHT).toBe(600);
    });
  });

  describe('createRadiusScale', () => {
    it('returns 6 (default radius) when loc is null', () => {
      const scale = createRadiusScale();
      expect(scale(null)).toBe(6);
    });

    it('returns 4 when loc is 0 (bottom of domain)', () => {
      const scale = createRadiusScale();
      expect(scale(0)).toBe(4);
    });

    it('returns 20 when loc is 2000 (top of domain)', () => {
      const scale = createRadiusScale();
      expect(scale(2000)).toBe(20);
    });

    it('returns 20 when loc is 5000 (above domain -- clamped)', () => {
      const scale = createRadiusScale();
      expect(scale(5000)).toBe(20);
    });

    it('returns a value between 4 and 20 for a mid-range loc', () => {
      const scale = createRadiusScale();
      const result = scale(500);
      expect(result).toBeGreaterThan(4);
      expect(result).toBeLessThan(20);
    });

    it('each call returns an independent scale instance', () => {
      const scaleA = createRadiusScale();
      const scaleB = createRadiusScale();
      // Both should return the same value for the same input
      expect(scaleA(100)).toBe(scaleB(100));
      // They are independent function instances
      expect(scaleA).not.toBe(scaleB);
    });
  });

  describe('createWeightScale', () => {
    it('returns 1 when weight is 0 (bottom of domain)', () => {
      const scale = createWeightScale();
      expect(scale(0)).toBe(1);
    });

    it('returns 8 when weight is 20 (top of domain)', () => {
      const scale = createWeightScale();
      expect(scale(20)).toBe(8);
    });

    it('returns 8 when weight is 100 (above domain -- clamped)', () => {
      const scale = createWeightScale();
      expect(scale(100)).toBe(8);
    });

    it('returns a value between 1 and 8 for a mid-range weight', () => {
      const scale = createWeightScale();
      const result = scale(5);
      expect(result).toBeGreaterThan(1);
      expect(result).toBeLessThan(8);
    });
  });

  describe('createNodeColorScale', () => {
    it('returns a string (color) for any input kind', () => {
      const scale = createNodeColorScale();
      expect(typeof scale('script')).toBe('string');
      expect(typeof scale('resource')).toBe('string');
      expect(typeof scale('unknown-kind')).toBe('string');
    });

    it('returns the same color for the same kind on repeated calls', () => {
      const scale = createNodeColorScale();
      const first = scale('script');
      const second = scale('script');
      expect(first).toBe(second);
    });
  });

  describe('createLinkColorScale', () => {
    it('returns a string (color) for any input kind', () => {
      const scale = createLinkColorScale();
      expect(typeof scale('preload')).toBe('string');
      expect(typeof scale('calls')).toBe('string');
      expect(typeof scale('unknown-kind')).toBe('string');
    });

    it('returns the same color for the same kind on repeated calls', () => {
      const scale = createLinkColorScale();
      const first = scale('preload');
      const second = scale('preload');
      expect(first).toBe(second);
    });
  });
});
