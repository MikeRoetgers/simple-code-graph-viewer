import type { Selection } from 'd3-selection';
import type { SimNode } from '../types.js';

export function createSearch(
  container: HTMLElement,
  nodeSelection: Selection<SVGGElement, SimNode, SVGGElement, unknown>,
): () => void {
  const wrapper = document.createElement('div');
  wrapper.className = 'mv-search';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Search nodes...';
  input.className = 'mv-search-input';
  input.setAttribute('aria-label', 'Search nodes');

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Uses a separate `mv-search-dimmed` class (not `mv-dimmed`) to avoid
  // conflicts with the highlight module which toggles `mv-dimmed` on
  // nodes/links independently. Clearing search dimming must not accidentally
  // undo highlight dimming and vice versa.
  input.addEventListener('input', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = input.value.trim().toLowerCase();

      if (query === '') {
        // Clear search: reset all nodes to default
        nodeSelection.classed('mv-search-dimmed', false);
        return;
      }

      // Dim non-matching nodes, un-dim matching ones
      nodeSelection.classed('mv-search-dimmed', (d) => !d.name.toLowerCase().includes(query));
    }, 150);
  });

  wrapper.appendChild(input);
  container.appendChild(wrapper);

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    wrapper.remove();
  };
}
