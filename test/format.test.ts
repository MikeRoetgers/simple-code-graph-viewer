import { describe, it, expect } from 'vitest';
import { formatMetricLabel, METRIC_LABELS } from '../src/utils/format.js';

describe('formatMetricLabel', () => {
  describe('known keys', () => {
    it("returns 'LOC' for 'loc'", () => {
      expect(formatMetricLabel('loc')).toBe('LOC');
    });

    it("returns 'CC' for 'cc'", () => {
      expect(formatMetricLabel('cc')).toBe('CC');
    });

    it("returns 'MI' for 'mi'", () => {
      expect(formatMetricLabel('mi')).toBe('MI');
    });

    it("returns 'CC (Max)' for 'max_cc'", () => {
      expect(formatMetricLabel('max_cc')).toBe('CC (Max)');
    });

    it("returns 'CC (Median)' for 'median_cc'", () => {
      expect(formatMetricLabel('median_cc')).toBe('CC (Median)');
    });

    it("returns 'MI (Min)' for 'mi_min'", () => {
      expect(formatMetricLabel('mi_min')).toBe('MI (Min)');
    });

    it("returns 'MI (Median)' for 'mi_median'", () => {
      expect(formatMetricLabel('mi_median')).toBe('MI (Median)');
    });
  });

  describe('fallback formatting', () => {
    it('converts snake_case to Title Case', () => {
      expect(formatMetricLabel('some_custom_metric')).toBe('Some Custom Metric');
    });

    it('converts camelCase to Title Case', () => {
      expect(formatMetricLabel('someCustomMetric')).toBe('Some Custom Metric');
    });

    it('capitalizes a single word', () => {
      expect(formatMetricLabel('weight')).toBe('Weight');
    });

    it('preserves already title-cased input', () => {
      expect(formatMetricLabel('Name')).toBe('Name');
    });
  });
});

describe('METRIC_LABELS', () => {
  it('is exported and contains expected keys', () => {
    expect(METRIC_LABELS).toBeDefined();
    expect(Object.keys(METRIC_LABELS)).toEqual(
      expect.arrayContaining(['loc', 'cc', 'mi', 'max_cc', 'median_cc', 'mi_min', 'mi_median'])
    );
  });
});
