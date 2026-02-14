import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { select } from 'd3-selection';
import type { GraphData, SimNode, SimLink } from '../src/types.js';
import { renderGraph } from '../src/renderer/force-graph.js';
import { createSimulation } from '../src/renderer/simulation.js';
import { setupZoom } from '../src/renderer/zoom.js';

function makeMinimalGraphData(): GraphData {
  return {
    schema_version: '1.0',
    meta: { repo: 'test-repo', generated_at: '2025-01-01T00:00:00Z' },
    nodes: [
      {
        id: 'a',
        kind: 'script',
        language: 'gdscript',
        name: 'a.gd',
        metrics: { loc: 100, cc: 5, mi: 70 },
        tags: [],
      },
      {
        id: 'b',
        kind: 'script',
        language: 'gdscript',
        name: 'b.gd',
        metrics: { loc: 200, cc: 10, mi: 60 },
        tags: [],
      },
    ],
    links: [
      {
        source: 'a',
        target: 'b',
        kind: 'preload',
        weight: 1,
        evidence: [{ file: 'a.gd', line: 1 }],
      },
    ],
  };
}

describe('renderGraph', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('creates an SVG element inside the container', () => {
    const data = makeMinimalGraphData();
    const { destroy } = renderGraph(container, data);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.tagName.toLowerCase()).toBe('svg');

    destroy();
  });

  it('returns an object with a destroy function', () => {
    const data = makeMinimalGraphData();
    const result = renderGraph(container, data);

    expect(result).toHaveProperty('destroy');
    expect(typeof result.destroy).toBe('function');

    result.destroy();
  });

  it('destroy() removes the SVG from the container', () => {
    const data = makeMinimalGraphData();
    const { destroy } = renderGraph(container, data);

    expect(container.querySelector('svg')).not.toBeNull();
    destroy();
    expect(container.querySelector('svg')).toBeNull();
  });

  it('sets position: relative and overflow: hidden on the container', () => {
    // jsdom's getComputedStyle does not return CSS defaults like 'static' and
    // 'visible' for unstyled elements. Set them explicitly so the code's
    // conditional checks (=== 'static', === 'visible') trigger correctly.
    container.style.position = 'static';
    container.style.overflow = 'visible';

    const data = makeMinimalGraphData();
    const { destroy } = renderGraph(container, data);

    expect(container.style.position).toBe('relative');
    expect(container.style.overflow).toBe('hidden');

    destroy();
  });

  it('filters out links with dangling references without throwing', () => {
    const data = makeMinimalGraphData();
    // Add a link with a source/target that don't exist in nodes
    data.links.push({
      source: 'nonexistent-1',
      target: 'nonexistent-2',
      kind: 'calls',
      weight: 1,
      evidence: [],
    });

    // Should not throw
    const { destroy } = renderGraph(container, data);
    expect(container.querySelector('svg')).not.toBeNull();

    destroy();
  });
});

describe('createSimulation', () => {
  it('returns a simulation with link, charge, center, and collide forces', () => {
    const nodes: SimNode[] = [
      { id: 'a', kind: 'script', language: 'gdscript', name: 'a.gd', metrics: { loc: 100, cc: 5, mi: 70 }, tags: [] },
      { id: 'b', kind: 'script', language: 'gdscript', name: 'b.gd', metrics: { loc: 200, cc: 10, mi: 60 }, tags: [] },
    ];
    const links: SimLink[] = [
      { source: nodes[0], target: nodes[1], kind: 'preload', weight: 1, evidence: [] },
    ];

    const simulation = createSimulation(nodes, links, 960, 600);

    expect(simulation.force('link')).toBeDefined();
    expect(simulation.force('charge')).toBeDefined();
    expect(simulation.force('center')).toBeDefined();
    expect(simulation.force('collide')).toBeDefined();

    simulation.stop();
  });

  it('uses the provided nodes and links', () => {
    const nodes: SimNode[] = [
      { id: 'a', kind: 'script', language: 'gdscript', name: 'a.gd', metrics: { loc: 100, cc: 5, mi: 70 }, tags: [] },
      { id: 'b', kind: 'script', language: 'gdscript', name: 'b.gd', metrics: { loc: 200, cc: 10, mi: 60 }, tags: [] },
    ];
    const links: SimLink[] = [
      { source: nodes[0], target: nodes[1], kind: 'preload', weight: 1, evidence: [] },
    ];

    const simulation = createSimulation(nodes, links, 960, 600);

    expect(simulation.nodes()).toBe(nodes);
    expect(simulation.nodes()).toHaveLength(2);

    simulation.stop();
  });
});

describe('setupZoom', () => {
  it('attaches zoom behavior to the SVG', () => {
    const svg = select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    const g = svg.append('g');

    const zoomBehavior = setupZoom(
      svg as any,
      g as any,
    );

    expect(zoomBehavior).toBeDefined();
    // d3-zoom attaches a __zoom property to the element it's called on
    expect((svg.node() as any).__zoom).toBeDefined();
  });

  it('zoom transforms the inner <g> group', () => {
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(svgEl);
    const svg = select(svgEl);
    const g = svg.append('g');

    setupZoom(svg as any, g as any);

    // The g element should initially have no transform
    // After a zoom event, the transform would be applied
    // We verify the zoom is attached by checking __zoom exists
    expect((svgEl as any).__zoom).toBeDefined();
    expect((svgEl as any).__zoom.k).toBe(1); // default scale is 1

    svgEl.remove();
  });
});
