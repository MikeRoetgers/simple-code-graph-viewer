import type { Selection } from 'd3-selection';
import type { ScaleOrdinal } from 'd3-scale';
import type { SimNode } from '../types.js';

export function renderNodes(
  parent: Selection<SVGGElement, unknown, null, undefined>,
  nodes: SimNode[],
  nodeColorScale: ScaleOrdinal<string, string>,
  radiusScale: (loc: number | null) => number,
): Selection<SVGGElement, SimNode, SVGGElement, unknown> {
  const nodeGroups = parent
    .selectAll<SVGGElement, SimNode>('.mv-node')
    .data(nodes)
    .join('g')
    .attr('class', 'mv-node');

  nodeGroups
    .append('circle')
    .attr('r', (d) => radiusScale(d.metrics.loc))
    .attr('fill', (d) => nodeColorScale(d.kind));

  nodeGroups
    .append('text')
    .text((d) => d.name)
    .attr('dx', 0)
    .attr('dy', (d) => radiusScale(d.metrics.loc) + 12);

  return nodeGroups;
}
