import { drag } from 'd3-drag';
import type { Selection } from 'd3-selection';
import type { Simulation } from 'd3-force';
import type { SimNode, SimLink } from '../types.js';

export function setupDrag(
  nodeSelection: Selection<SVGGElement, SimNode, SVGGElement, unknown>,
  simulation: Simulation<SimNode, SimLink>,
): void {
  const dragBehavior = drag<SVGGElement, SimNode>()
    .on('start', (event, d) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on('drag', (event, d) => {
      d.fx = event.x;
      d.fy = event.y;
    })
    .on('end', (event, d) => {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    });

  nodeSelection.call(dragBehavior);
}
