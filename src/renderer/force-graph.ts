import { select } from 'd3-selection';
import type { GraphData, RenderOptions, SimNode, SimLink } from '../types.js';
import { DEFAULT_WIDTH, DEFAULT_HEIGHT, createNodeColorScale, createLinkColorScale, createRadiusScale, createWeightScale } from '../defaults.js';
import { createSimulation } from './simulation.js';
import { renderNodes } from './nodes.js';
import { renderLinks } from './links.js';
import { setupZoom } from './zoom.js';
import { setupDrag } from './drag.js';
import { setupHighlight } from './highlight.js';
import { setupControls } from '../controls/controls-container.js';
import '../styles/graph.css';

export function renderGraph(
  container: HTMLElement,
  data: GraphData,
  options?: RenderOptions,
): { destroy: () => void } {
  const width = options?.width ?? DEFAULT_WIDTH;
  const height = options?.height ?? DEFAULT_HEIGHT;

  // Ensure the container is a positioning context for absolute-positioned
  // controls, sidebars, and overlays. If the consumer did not set an explicit
  // position, default to 'relative' so children with position:absolute are
  // anchored to this container.
  const computed = getComputedStyle(container);
  if (computed.position === 'static') {
    container.style.position = 'relative';
  }
  // Prevent SVG and controls from bleeding outside the container when the
  // consumer hasn't set an explicit overflow value.
  if (computed.overflow === 'visible') {
    container.style.overflow = 'hidden';
  }

  const nodeColorScale = createNodeColorScale();
  const linkColorScale = createLinkColorScale();
  const radiusScale = createRadiusScale();
  const weightScale = createWeightScale();

  // Create SimNode copies from data.nodes
  const simNodes: SimNode[] = data.nodes.map((n) => ({ ...n }));

  // Build a lookup map for resolving link source/target strings to SimNode references
  const nodeMap = new Map(simNodes.map((n) => [n.id, n]));

  // Filter out dangling links whose source or target node doesn't exist.
  // The validator allows dangling references as warnings, so we must guard here.
  const simLinks: SimLink[] = data.links
    .filter((l) => nodeMap.has(l.source) && nodeMap.has(l.target))
    .map((l) => ({
      source: nodeMap.get(l.source)!,
      target: nodeMap.get(l.target)!,
      kind: l.kind,
      weight: l.weight,
      evidence: l.evidence,
    }));

  // Create SVG element
  const svg = select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`);

  // Inner group for content (links render first so they appear behind nodes)
  const g = svg.append('g');

  // Set up zoom/pan on SVG, transform applied to inner g
  setupZoom(svg, g);

  const linkSelection = renderLinks(g, simLinks, linkColorScale, weightScale);
  const nodeSelection = renderNodes(g, simNodes, nodeColorScale, radiusScale);

  // Create force simulation and wire tick handler
  const simulation = createSimulation(simNodes, simLinks, width, height);

  // Set up drag on node elements
  setupDrag(nodeSelection, simulation);

  // Set up click-to-highlight neighbors
  const cleanupHighlight = setupHighlight(svg, nodeSelection, linkSelection, simLinks);

  // Set up controls overlay (filter panel, search, evidence sidebar)
  const cleanupControls = setupControls(container, nodeSelection, linkSelection, simLinks);

  simulation.on('tick', () => {
    linkSelection
      .attr('x1', (d) => d.source.x!)
      .attr('y1', (d) => d.source.y!)
      .attr('x2', (d) => d.target.x!)
      .attr('y2', (d) => d.target.y!);

    nodeSelection.attr('transform', (d) => `translate(${d.x!},${d.y!})`);
  });

  function destroy(): void {
    cleanupHighlight();
    cleanupControls();
    simulation.stop();
    svg.remove();
  }

  return { destroy };
}
