import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { select } from 'd3-selection';
import type { SimNode, SimLink } from '../src/types.js';
import { createFilterPanel } from '../src/controls/filter-panel.js';

function makeNodesAndLinks() {
  const nodeA: SimNode = { id: 'a', kind: 'script', language: 'gdscript', name: 'a.gd', metrics: { loc: 100, cc: 5, mi: 70 }, tags: [] };
  const nodeB: SimNode = { id: 'b', kind: 'script', language: 'gdscript', name: 'b.gd', metrics: { loc: 200, cc: 10, mi: 60 }, tags: [] };
  const nodeC: SimNode = { id: 'c', kind: 'resource', language: 'gdscript', name: 'c.gd', metrics: { loc: 50, cc: 3, mi: 80 }, tags: [] };

  const links: SimLink[] = [
    { source: nodeA, target: nodeB, kind: 'preload', weight: 1, evidence: [] },
    { source: nodeB, target: nodeC, kind: 'calls', weight: 2, evidence: [] },
    { source: nodeA, target: nodeC, kind: 'preload', weight: 1, evidence: [] },
  ];

  return { nodes: [nodeA, nodeB, nodeC], links };
}

describe('createFilterPanel', () => {
  let container: HTMLElement;
  let svgEl: SVGSVGElement;
  let gEl: SVGGElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    gEl = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svgEl.appendChild(gEl);
    document.body.appendChild(svgEl);
  });

  afterEach(() => {
    container.remove();
    svgEl.remove();
  });

  function buildLinkSelection(links: SimLink[]) {
    const parentG = select(gEl);
    return parentG
      .selectAll<SVGLineElement, SimLink>('line.link')
      .data(links)
      .join('line')
      .attr('class', 'link');
  }

  it('creates a filter panel element inside the container', () => {
    const { links } = makeNodesAndLinks();
    const linkSelection = buildLinkSelection(links);
    const destroy = createFilterPanel(container, linkSelection, links);

    const panel = container.querySelector('.mv-filter-panel');
    expect(panel).not.toBeNull();
    expect(panel!.getAttribute('role')).toBe('group');
    expect(panel!.getAttribute('aria-label')).toBe('Edge kind filters');

    const heading = panel!.querySelector('.mv-filter-heading');
    expect(heading).not.toBeNull();
    expect(heading!.textContent).toBe('Edge Kinds');

    destroy();
  });

  it('creates one checkbox per unique edge kind', () => {
    const { links } = makeNodesAndLinks();
    const linkSelection = buildLinkSelection(links);
    const destroy = createFilterPanel(container, linkSelection, links);

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.mv-filter-panel input[type="checkbox"]');
    // There are 2 unique kinds: 'preload' and 'calls'
    expect(checkboxes).toHaveLength(2);

    const kinds = Array.from(checkboxes).map((cb) => cb.dataset.kind);
    expect(kinds).toContain('preload');
    expect(kinds).toContain('calls');

    destroy();
  });

  it('all checkboxes start as checked', () => {
    const { links } = makeNodesAndLinks();
    const linkSelection = buildLinkSelection(links);
    const destroy = createFilterPanel(container, linkSelection, links);

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.mv-filter-panel input[type="checkbox"]');
    for (const cb of checkboxes) {
      expect(cb.checked).toBe(true);
    }

    destroy();
  });

  it('unchecking a checkbox adds mv-hidden class to matching links', () => {
    const { links } = makeNodesAndLinks();
    const linkSelection = buildLinkSelection(links);
    const destroy = createFilterPanel(container, linkSelection, links);

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.mv-filter-panel input[type="checkbox"]');
    // Find the 'preload' checkbox
    const preloadCheckbox = Array.from(checkboxes).find((cb) => cb.dataset.kind === 'preload')!;

    // Uncheck it
    preloadCheckbox.checked = false;
    preloadCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

    // Get link line elements
    const lineEls = gEl.querySelectorAll('line.link');
    // links[0] (preload) and links[2] (preload) should be hidden
    // links[1] (calls) should not be hidden
    expect(lineEls[0].classList.contains('mv-hidden')).toBe(true);   // preload
    expect(lineEls[1].classList.contains('mv-hidden')).toBe(false);  // calls
    expect(lineEls[2].classList.contains('mv-hidden')).toBe(true);   // preload

    destroy();
  });

  it('returns a destroy function that removes the panel', () => {
    const { links } = makeNodesAndLinks();
    const linkSelection = buildLinkSelection(links);
    const destroy = createFilterPanel(container, linkSelection, links);

    expect(container.querySelector('.mv-filter-panel')).not.toBeNull();
    destroy();
    expect(container.querySelector('.mv-filter-panel')).toBeNull();
  });

  it('re-checking a checkbox removes mv-hidden from matching links', () => {
    const { links } = makeNodesAndLinks();
    const linkSelection = buildLinkSelection(links);
    const destroy = createFilterPanel(container, linkSelection, links);

    const checkboxes = container.querySelectorAll<HTMLInputElement>('.mv-filter-panel input[type="checkbox"]');
    const preloadCheckbox = Array.from(checkboxes).find((cb) => cb.dataset.kind === 'preload')!;

    // Uncheck
    preloadCheckbox.checked = false;
    preloadCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

    const lineEls = gEl.querySelectorAll('line.link');
    expect(lineEls[0].classList.contains('mv-hidden')).toBe(true);

    // Re-check
    preloadCheckbox.checked = true;
    preloadCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

    expect(lineEls[0].classList.contains('mv-hidden')).toBe(false);
    expect(lineEls[2].classList.contains('mv-hidden')).toBe(false);

    destroy();
  });
});
