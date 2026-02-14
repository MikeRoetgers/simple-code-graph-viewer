import { scaleOrdinal, scaleSqrt } from 'd3-scale';
import type { ScaleOrdinal } from 'd3-scale';
import { schemeTableau10, schemeSet2 } from 'd3-scale-chromatic';

export const DEFAULT_WIDTH = 960;
export const DEFAULT_HEIGHT = 600;

/** Creates a fresh ordinal scale mapping node `kind` values to fill colors (Tableau10 palette). */
export function createNodeColorScale(): ScaleOrdinal<string, string> {
  return scaleOrdinal<string, string>(schemeTableau10);
}

/** Creates a fresh ordinal scale mapping link `kind` values to stroke colors (Set2 palette). */
export function createLinkColorScale(): ScaleOrdinal<string, string> {
  return scaleOrdinal<string, string>(schemeSet2);
}

const DEFAULT_RADIUS = 6;

/**
 * Creates a fresh radius scale function mapping `node.metrics.loc` to a circle
 * radius via d3.scaleSqrt (domain [0, 2000] -> range [4, 20], clamped).
 * Follows the same factory pattern as createNodeColorScale / createLinkColorScale
 * so each renderGraph call gets its own isolated scale instance.
 */
export function createRadiusScale(): (loc: number | null) => number {
  const locScale = scaleSqrt<number>()
    .domain([0, 2000])
    .range([4, 20])
    .clamp(true);

  return (loc: number | null): number => {
    if (loc === null) return DEFAULT_RADIUS;
    return locScale(loc);
  };
}

/**
 * Creates a fresh weight scale function mapping `link.weight` to a stroke-width
 * via d3.scaleSqrt (domain [0, 20] -> range [1, 8], clamped).
 * Follows the same factory pattern as createRadiusScale.
 */
export function createWeightScale(): (weight: number) => number {
  const scale = scaleSqrt<number>()
    .domain([0, 20])
    .range([1, 8])
    .clamp(true);
  return (weight: number): number => scale(weight);
}
