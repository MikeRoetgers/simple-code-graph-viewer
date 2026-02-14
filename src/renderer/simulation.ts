import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type Simulation,
} from 'd3-force';
import type { SimNode, SimLink } from '../types.js';

/** Ideal distance between linked nodes (pixels). */
const LINK_DISTANCE = 100;

/** Repulsive charge strength — negative values push nodes apart. */
const CHARGE_STRENGTH = -200;

/** Minimum separation between node edges to prevent overlap. */
const COLLISION_RADIUS = 20;

export function createSimulation(
  nodes: SimNode[],
  links: SimLink[],
  width: number,
  height: number,
): Simulation<SimNode, SimLink> {
  return forceSimulation<SimNode>(nodes)
    .force(
      'link',
      forceLink<SimNode, SimLink>(links)
        .id((d) => d.id)
        .distance(LINK_DISTANCE),
    )
    .force('charge', forceManyBody<SimNode>().strength(CHARGE_STRENGTH))
    .force('center', forceCenter<SimNode>(width / 2, height / 2))
    .force('collide', forceCollide<SimNode>().radius(COLLISION_RADIUS));
}
