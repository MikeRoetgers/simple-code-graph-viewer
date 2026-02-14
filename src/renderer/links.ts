import type { Selection } from 'd3-selection';
import type { ScaleOrdinal } from 'd3-scale';
import type { SimLink } from '../types.js';

export function renderLinks(
  parent: Selection<SVGGElement, unknown, null, undefined>,
  links: SimLink[],
  linkColorScale: ScaleOrdinal<string, string>,
  weightScale: (weight: number) => number,
): Selection<SVGLineElement, SimLink, SVGGElement, unknown> {
  return parent
    .selectAll<SVGLineElement, SimLink>('.mv-link')
    .data(links)
    .join('line')
    .attr('class', 'mv-link')
    .attr('stroke', (d) => linkColorScale(d.kind))
    .attr('stroke-width', (d) => weightScale(d.weight));
}
