import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { select } from 'd3-selection';
import type { SimNode } from '../src/types.js';
import { createSearch } from '../src/controls/search.js';

function makeNodes(): SimNode[] {
  return [
    { id: 'a', kind: 'script', language: 'gdscript', name: 'main.gd', metrics: { loc: 100, cc: 5, mi: 70 }, tags: [] },
    { id: 'b', kind: 'script', language: 'gdscript', name: 'player.gd', metrics: { loc: 200, cc: 10, mi: 60 }, tags: [] },
    { id: 'c', kind: 'resource', language: 'gdscript', name: 'enemy.gd', metrics: { loc: 50, cc: 3, mi: 80 }, tags: [] },
  ];
}

describe('createSearch', () => {
  let container: HTMLElement;
  let svgEl: SVGSVGElement;
  let gEl: SVGGElement;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);

    // Build a minimal SVG with <g> elements that have bound data (simulating d3 nodes)
    svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    gEl = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svgEl.appendChild(gEl);
    document.body.appendChild(svgEl);
  });

  afterEach(() => {
    vi.useRealTimers();
    container.remove();
    svgEl.remove();
  });

  function buildNodeSelection(nodes: SimNode[]) {
    const parentG = select(gEl);
    // Create <g> elements for each node, binding data
    const sel = parentG
      .selectAll<SVGGElement, SimNode>('g.node')
      .data(nodes)
      .join('g')
      .attr('class', 'node');
    return sel;
  }

  it('creates a search input element inside the container', () => {
    const nodes = makeNodes();
    const nodeSelection = buildNodeSelection(nodes);
    const destroy = createSearch(container, nodeSelection);

    const wrapper = container.querySelector('.mv-search');
    expect(wrapper).not.toBeNull();
    const input = wrapper!.querySelector('input.mv-search-input');
    expect(input).not.toBeNull();
    expect(input!.getAttribute('type')).toBe('text');
    expect(input!.getAttribute('placeholder')).toBe('Search nodes...');

    destroy();
  });

  it('returns a destroy function that removes the element', () => {
    const nodes = makeNodes();
    const nodeSelection = buildNodeSelection(nodes);
    const destroy = createSearch(container, nodeSelection);

    expect(container.querySelector('.mv-search')).not.toBeNull();
    destroy();
    expect(container.querySelector('.mv-search')).toBeNull();
  });

  it('typing triggers callback after 150ms debounce', () => {
    const nodes = makeNodes();
    const nodeSelection = buildNodeSelection(nodes);
    const destroy = createSearch(container, nodeSelection);

    const input = container.querySelector<HTMLInputElement>('.mv-search-input')!;

    // Type a query
    input.value = 'main';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Before debounce fires, no dimming applied
    const nodeEls = gEl.querySelectorAll('g.node');
    // Check that mv-search-dimmed is not yet applied
    expect(nodeEls[0].classList.contains('mv-search-dimmed')).toBe(false);

    // Advance past the 150ms debounce
    vi.advanceTimersByTime(150);

    // Now 'main.gd' matches, others should be dimmed
    expect(nodeEls[0].classList.contains('mv-search-dimmed')).toBe(false);  // main.gd matches
    expect(nodeEls[1].classList.contains('mv-search-dimmed')).toBe(true);   // player.gd dimmed
    expect(nodeEls[2].classList.contains('mv-search-dimmed')).toBe(true);   // enemy.gd dimmed

    destroy();
  });

  it('rapid typing only triggers the callback once (debounce)', () => {
    const nodes = makeNodes();
    const nodeSelection = buildNodeSelection(nodes);
    const destroy = createSearch(container, nodeSelection);

    const input = container.querySelector<HTMLInputElement>('.mv-search-input')!;
    const nodeEls = gEl.querySelectorAll('g.node');

    // Type 'p' then quickly type 'pl'
    input.value = 'p';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    vi.advanceTimersByTime(50); // Only 50ms passed

    input.value = 'player';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    vi.advanceTimersByTime(150);

    // Only the final query 'player' should have taken effect
    expect(nodeEls[0].classList.contains('mv-search-dimmed')).toBe(true);   // main.gd dimmed
    expect(nodeEls[1].classList.contains('mv-search-dimmed')).toBe(false);  // player.gd matches
    expect(nodeEls[2].classList.contains('mv-search-dimmed')).toBe(true);   // enemy.gd dimmed

    destroy();
  });

  it('empty query clears search dimming', () => {
    const nodes = makeNodes();
    const nodeSelection = buildNodeSelection(nodes);
    const destroy = createSearch(container, nodeSelection);

    const input = container.querySelector<HTMLInputElement>('.mv-search-input')!;
    const nodeEls = gEl.querySelectorAll('g.node');

    // First apply a search
    input.value = 'main';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    vi.advanceTimersByTime(150);
    expect(nodeEls[1].classList.contains('mv-search-dimmed')).toBe(true);

    // Now clear the search
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    vi.advanceTimersByTime(150);

    // All nodes should have mv-search-dimmed removed
    expect(nodeEls[0].classList.contains('mv-search-dimmed')).toBe(false);
    expect(nodeEls[1].classList.contains('mv-search-dimmed')).toBe(false);
    expect(nodeEls[2].classList.contains('mv-search-dimmed')).toBe(false);

    destroy();
  });

  it('search matching is case-insensitive', () => {
    const nodes = makeNodes();
    const nodeSelection = buildNodeSelection(nodes);
    const destroy = createSearch(container, nodeSelection);

    const input = container.querySelector<HTMLInputElement>('.mv-search-input')!;
    const nodeEls = gEl.querySelectorAll('g.node');

    input.value = 'MAIN';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    vi.advanceTimersByTime(150);

    // main.gd should match despite uppercase query
    expect(nodeEls[0].classList.contains('mv-search-dimmed')).toBe(false);
    expect(nodeEls[1].classList.contains('mv-search-dimmed')).toBe(true);

    destroy();
  });
});
