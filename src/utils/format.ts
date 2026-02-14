/** Human-readable labels for known metric keys. */
export const METRIC_LABELS: Record<string, string> = {
  loc: 'LOC',
  cc: 'CC',
  mi: 'MI',
  max_cc: 'CC (Max)',
  median_cc: 'CC (Median)',
  mi_min: 'MI (Min)',
  mi_median: 'MI (Median)',
};

/** Formats a metric key using the known-label map, falling back to snake_case-to-title-case. */
export function formatMetricLabel(key: string): string {
  if (key in METRIC_LABELS) {
    return METRIC_LABELS[key];
  }
  // Convert snake_case/camelCase to title case
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
