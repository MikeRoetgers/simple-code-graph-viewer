import type { Selection } from 'd3-selection';
import type { SimLink } from '../types.js';

export function createFilterPanel(
  container: HTMLElement,
  linkSelection: Selection<SVGLineElement, SimLink, SVGGElement, unknown>,
  links: SimLink[],
): () => void {
  // Extract unique edge kinds
  const kinds = [...new Set(links.map((l) => l.kind))];

  // Create the panel element
  const panel = document.createElement('div');
  panel.className = 'mv-filter-panel';
  panel.setAttribute('role', 'group');
  panel.setAttribute('aria-label', 'Edge kind filters');

  const heading = document.createElement('div');
  heading.className = 'mv-filter-heading';
  heading.textContent = 'Edge Kinds';
  panel.appendChild(heading);

  // Create a checkbox for each kind, all checked by default
  for (const kind of kinds) {
    const label = document.createElement('label');
    label.className = 'mv-filter-label';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.dataset.kind = kind;

    checkbox.addEventListener('change', () => {
      // Toggle visibility of links matching this kind
      const filtered = linkSelection.filter((d) => d.kind === kind);
      filtered.classed('mv-hidden', !checkbox.checked);
    });

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(` ${kind}`));
    panel.appendChild(label);
  }

  container.appendChild(panel);

  // Return cleanup function
  return () => {
    panel.remove();
  };
}
