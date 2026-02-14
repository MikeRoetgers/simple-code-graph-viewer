import type { Selection } from 'd3-selection';
import type { SimNode, SimLink } from '../types.js';
import { createFilterPanel } from './filter-panel.js';
import { createSearch } from './search.js';
import { createEvidenceSidebar } from './evidence-sidebar.js';
import { createNodeDetailSidebar } from './node-detail-sidebar.js';
import '../styles/controls.css';

export function setupControls(
  container: HTMLElement,
  nodeSelection: Selection<SVGGElement, SimNode, SVGGElement, unknown>,
  linkSelection: Selection<SVGLineElement, SimLink, SVGGElement, unknown>,
  links: SimLink[],
): () => void {
  // Create wrapper for controls (filter + search), positioned over the graph
  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'mv-controls';
  container.appendChild(controlsDiv);

  // Set up individual controls
  const cleanupFilter = createFilterPanel(controlsDiv, linkSelection, links);
  const cleanupSearch = createSearch(controlsDiv, nodeSelection);
  const evidence = createEvidenceSidebar(container, linkSelection);
  const nodeDetail = createNodeDetailSidebar(container, nodeSelection, links);

  // Centralized click-outside handler: dismiss any open sidebar when
  // clicking outside all sidebars (replaces per-sidebar container listeners).
  function onContainerClick(e: Event): void {
    const target = e.target as Node;
    if (
      !evidence.sidebarElement.contains(target) &&
      !nodeDetail.sidebarElement.contains(target)
    ) {
      evidence.hideSidebar();
      nodeDetail.hideSidebar();
    }
  }
  container.addEventListener('click', onContainerClick);

  // Return combined cleanup
  return () => {
    cleanupFilter();
    cleanupSearch();
    evidence.destroy();
    nodeDetail.destroy();
    container.removeEventListener('click', onContainerClick);
    controlsDiv.remove();
  };
}
