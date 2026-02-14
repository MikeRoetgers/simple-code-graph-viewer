import type { Selection } from 'd3-selection';
import type { SimLink } from '../types.js';

export interface SidebarHandle {
  destroy: () => void;
  hideSidebar: () => void;
  sidebarElement: HTMLElement;
}

export function createEvidenceSidebar(
  container: HTMLElement,
  linkSelection: Selection<SVGLineElement, SimLink, SVGGElement, unknown>,
): SidebarHandle {
  // Create sidebar element (initially hidden)
  const sidebar = document.createElement('div');
  sidebar.className = 'mv-evidence-sidebar';
  sidebar.classList.add('mv-hidden');
  container.appendChild(sidebar);

  function showSidebar(link: SimLink): void {
    sidebar.classList.remove('mv-hidden');
    sidebar.replaceChildren();

    // Notify other sidebars to close when this one opens
    container.dispatchEvent(new CustomEvent('mv-sidebar-open', { detail: 'evidence' }));

    // Header
    const header = document.createElement('div');
    header.className = 'mv-evidence-header';

    const title = document.createElement('span');
    title.textContent = `${link.source.name} → ${link.target.name}`;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'mv-evidence-close';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.addEventListener('click', hideSidebar);

    header.appendChild(title);
    header.appendChild(closeBtn);
    sidebar.appendChild(header);

    // Kind
    const kindEl = document.createElement('div');
    kindEl.className = 'mv-evidence-kind';
    kindEl.textContent = `Kind: ${link.kind}`;
    sidebar.appendChild(kindEl);

    // Evidence list
    const list = document.createElement('ul');
    list.className = 'mv-evidence-list';
    for (const ev of link.evidence) {
      const li = document.createElement('li');
      li.textContent = `${ev.file}:${ev.line}`;
      list.appendChild(li);
    }
    sidebar.appendChild(list);
  }

  function hideSidebar(): void {
    sidebar.classList.add('mv-hidden');
  }

  // Make links clickable
  linkSelection
    .style('cursor', 'pointer')
    .on('click', (_event: MouseEvent, d: SimLink) => {
      _event.stopPropagation();
      showSidebar(d);
    });

  // Close when another sidebar opens
  function onOtherSidebarOpen(e: Event): void {
    if ((e as CustomEvent).detail !== 'evidence') {
      hideSidebar();
    }
  }
  container.addEventListener('mv-sidebar-open', onOtherSidebarOpen);

  return {
    destroy: () => {
      sidebar.remove();
      container.removeEventListener('mv-sidebar-open', onOtherSidebarOpen);
      linkSelection.on('click', null);
    },
    hideSidebar,
    sidebarElement: sidebar,
  };
}
