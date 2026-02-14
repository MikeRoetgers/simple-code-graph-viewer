import type { Selection } from 'd3-selection';
import type { FunctionMetrics, SimNode, SimLink } from '../types.js';
import { formatMetricLabel } from '../utils/format.js';

/** Appends a <p> element. Segments can be plain strings or {tag, text} objects for inline formatting. */
function appendParagraph(
  parent: HTMLElement,
  ...segments: Array<string | { tag: 'strong' | 'em' | 'code'; text: string }>
): void {
  const p = document.createElement('p');
  for (const seg of segments) {
    if (typeof seg === 'string') {
      p.appendChild(document.createTextNode(seg));
    } else {
      const el = document.createElement(seg.tag);
      el.textContent = seg.text;
      p.appendChild(el);
    }
  }
  parent.appendChild(p);
}

/** Appends a benchmark <table> with the class mv-modal-benchmarks. */
function appendBenchmarkTable(
  parent: HTMLElement,
  rows: Array<[string, string]>,
): void {
  const table = document.createElement('table');
  table.className = 'mv-modal-benchmarks';
  for (const [range, label] of rows) {
    const tr = document.createElement('tr');
    const td1 = document.createElement('td');
    td1.textContent = range;
    const td2 = document.createElement('td');
    td2.textContent = label;
    tr.appendChild(td1);
    tr.appendChild(td2);
    table.appendChild(tr);
  }
  parent.appendChild(table);
}

/** Rich descriptions for known metrics, shown in a modal on info icon click. */
const METRIC_DESCRIPTIONS: Record<string, { title: string; build: (parent: HTMLElement) => void }> = {
  loc: {
    title: 'LOC \u2014 Lines of Code',
    build(parent) {
      appendParagraph(parent, 'Count of non-empty, non-comment-only lines in the file. Lines with code followed by an inline comment are counted.');
      appendParagraph(parent, { tag: 'strong', text: 'Lower is better.' }, ' Smaller files are easier to understand and maintain.');
      appendBenchmarkTable(parent, [
        ['1\u2013100', 'Good \u2014 small, easy to maintain'],
        ['100\u2013300', 'Moderate \u2014 consider if it does too much'],
        ['300\u2013500', 'Concerning \u2014 likely needs splitting'],
        ['500+', 'Bad \u2014 strong candidate for refactoring'],
      ]);
    },
  },
  cc: {
    title: 'CC \u2014 Cyclomatic Complexity',
    build(parent) {
      appendParagraph(parent,
        'Number of independent code paths through a function. Starts at 1, then +1 for each ',
        { tag: 'code', text: 'if' }, ', ',
        { tag: 'code', text: 'elif' }, ', ',
        { tag: 'code', text: 'while' }, ', ',
        { tag: 'code', text: 'for' }, ', ',
        { tag: 'code', text: 'match' }, ' branch, ',
        { tag: 'code', text: 'and' }, '/', { tag: 'code', text: 'or' },
        ' operator, or ternary expression.',
      );
      appendParagraph(parent, { tag: 'strong', text: 'Lower is better.' }, ' Fewer paths = easier testing.');
      appendBenchmarkTable(parent, [
        ['1\u20135', 'Good \u2014 simple, easy to test'],
        ['6\u201310', 'Moderate \u2014 still manageable'],
        ['11\u201320', 'Concerning \u2014 hard to test thoroughly'],
        ['21+', 'Bad \u2014 should be refactored'],
      ]);
    },
  },
  max_cc: {
    title: 'CC (Max) \u2014 Maximum Cyclomatic Complexity',
    build(parent) {
      appendParagraph(parent, 'The highest CC among all functions in the file. Identifies the single most complex function (the \u201chotspot\u201d).');
      appendParagraph(parent, 'A file with CC (Max) = 15 means at least one function has 15 independent code paths.');
      appendParagraph(parent, { tag: 'strong', text: 'Lower is better.' });
      appendBenchmarkTable(parent, [
        ['1\u20135', 'Good \u2014 simple, easy to test'],
        ['6\u201310', 'Moderate \u2014 still manageable'],
        ['11\u201320', 'Concerning \u2014 hard to test thoroughly'],
        ['21+', 'Bad \u2014 should be refactored'],
      ]);
    },
  },
  median_cc: {
    title: 'CC (Median) \u2014 Median Cyclomatic Complexity',
    build(parent) {
      appendParagraph(parent,
        'The median CC across all functions in the file. Represents the ',
        { tag: 'em', text: 'typical' },
        ' function complexity.',
      );
      appendParagraph(parent, 'Unlike CC (Max), this is not skewed by one bad function. A value above 5 suggests most functions are moderately complex.');
      appendParagraph(parent, { tag: 'strong', text: 'Lower is better.' });
      appendBenchmarkTable(parent, [
        ['1\u20135', 'Good \u2014 simple, easy to test'],
        ['6\u201310', 'Moderate \u2014 still manageable'],
        ['11\u201320', 'Concerning \u2014 hard to test thoroughly'],
        ['21+', 'Bad \u2014 should be refactored'],
      ]);
    },
  },
  mi: {
    title: 'MI \u2014 File-Level Maintainability Index',
    build(parent) {
      appendParagraph(parent,
        'How hard is this file ',
        { tag: 'em', text: 'as a whole' },
        ' to wrap your head around? A composite score (0\u2013171) combining size (LOC), complexity (CC), and information density (Halstead volume).',
      );
      appendParagraph(parent,
        { tag: 'strong', text: 'Formula:' },
        ' ',
        { tag: 'code', text: 'MI = 171 \u2212 5.2\u00b7ln(V) \u2212 0.23\u00b7CC \u2212 16.2\u00b7ln(LOC)' },
      );
      appendParagraph(parent, 'File-level MI is almost always lower than any individual function\u2019s MI, because it aggregates volume and LOC across the entire file. A file with 15 perfectly clean functions can still score low simply because there\u2019s a lot of code in total. Use MI (Min) and MI (Median) for a per-function perspective.');
      appendParagraph(parent, { tag: 'strong', text: 'Higher is better.' });
      appendBenchmarkTable(parent, [
        ['> 85', 'Highly maintainable'],
        ['65\u201385', 'Moderate'],
        ['< 65', 'Low'],
      ]);
    },
  },
  mi_min: {
    title: 'MI (Min) \u2014 Worst Per-Function MI',
    build(parent) {
      appendParagraph(parent,
        'How bad is the worst individual function? The ',
        { tag: 'em', text: 'lowest' },
        ' MI among all functions in the file.',
      );
      appendParagraph(parent, 'Because file-level MI aggregates across the whole file, it can look low even when every function is fine. MI (Min) cuts through that noise\u2014if this number is healthy, no single function is a problem.');
      appendParagraph(parent, { tag: 'strong', text: 'Higher is better.' });
      appendBenchmarkTable(parent, [
        ['> 85', 'Highly maintainable'],
        ['65\u201385', 'Moderate'],
        ['< 65', 'Low'],
      ]);
    },
  },
  mi_median: {
    title: 'MI (Median) \u2014 Median Per-Function MI',
    build(parent) {
      appendParagraph(parent,
        'How maintainable is the ',
        { tag: 'em', text: 'typical' },
        ' function? The median MI across all functions in the file.',
      );
      appendParagraph(parent, 'If MI (Median) is high but MI (Min) is low, most functions are healthy and only one outlier needs attention. If both are low, the file has widespread maintainability issues.');
      appendParagraph(parent, { tag: 'strong', text: 'Higher is better.' });
      appendBenchmarkTable(parent, [
        ['> 85', 'Highly maintainable'],
        ['65\u201385', 'Moderate'],
        ['< 65', 'Low'],
      ]);
    },
  },
};

export function createNodeDetailSidebar(
  container: HTMLElement,
  nodeSelection: Selection<SVGGElement, SimNode, SVGGElement, unknown>,
  links: SimLink[],
): { destroy: () => void; hideSidebar: () => void; sidebarElement: HTMLElement } {
  // Create sidebar element (initially hidden)
  const sidebar = document.createElement('div');
  sidebar.className = 'mv-node-detail-sidebar';
  sidebar.classList.add('mv-hidden');
  container.appendChild(sidebar);

  let activeModalOverlay: HTMLElement | null = null;

  function showSidebar(node: SimNode): void {
    sidebar.classList.remove('mv-hidden');
    sidebar.replaceChildren();

    // Notify other sidebars to close when this one opens
    container.dispatchEvent(new CustomEvent('mv-sidebar-open', { detail: 'node-detail' }));

    // Header
    const header = document.createElement('div');
    header.className = 'mv-node-detail-header';

    const title = document.createElement('span');
    title.textContent = node.name;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'mv-node-detail-close';
    closeBtn.textContent = '\u00d7';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.addEventListener('click', hideSidebar);

    header.appendChild(title);
    header.appendChild(closeBtn);
    sidebar.appendChild(header);

    // Node info section
    const infoSection = document.createElement('div');
    infoSection.className = 'mv-node-detail-section';

    const infoHeading = document.createElement('div');
    infoHeading.className = 'mv-node-detail-section-heading';
    infoHeading.textContent = 'Info';
    infoSection.appendChild(infoHeading);

    const infoTable = document.createElement('table');
    infoTable.className = 'mv-node-detail-table';

    appendRow(infoTable, 'ID', node.id);
    appendRow(infoTable, 'Kind', node.kind);
    appendRow(infoTable, 'Language', node.language);
    if (node.tags.length > 0) {
      appendRow(infoTable, 'Tags', node.tags.join(', '));
    }

    infoSection.appendChild(infoTable);
    sidebar.appendChild(infoSection);

    // Metrics section
    const metricsSection = document.createElement('div');
    metricsSection.className = 'mv-node-detail-section';

    const metricsHeading = document.createElement('div');
    metricsHeading.className = 'mv-node-detail-section-heading';
    metricsHeading.textContent = 'Metrics';
    metricsSection.appendChild(metricsHeading);

    const metricsTable = document.createElement('table');
    metricsTable.className = 'mv-node-detail-table';

    // Iterate all metric keys — cast to Record for dynamic access since
    // NodeMetrics is a closed interface without an index signature.
    const metricsRecord = node.metrics as unknown as Record<string, unknown>;
    const metricKeys = Object.keys(metricsRecord);
    for (const key of metricKeys) {
      const value = metricsRecord[key];
      // Only render scalar metrics (number | null); skip arrays and objects
      if (typeof value !== 'number' && value !== null) continue;
      const label = formatMetricLabel(key);
      const display = value === null || value === undefined ? '\u2014' : String(value);
      appendRow(metricsTable, label, display, key in METRIC_DESCRIPTIONS ? key : undefined);
    }

    metricsSection.appendChild(metricsTable);
    sidebar.appendChild(metricsSection);

    // Functions section — only render when functions exist
    const functions = node.metrics.functions;
    if (functions && functions.length > 0) {
      const sorted = [...functions].sort((a, b) => b.cc - a.cc);
      const VISIBLE_LIMIT = 5;
      const hasOverflow = sorted.length > VISIBLE_LIMIT;

      const fnSection = document.createElement('div');
      fnSection.className = 'mv-node-detail-section';

      const fnHeading = document.createElement('div');
      fnHeading.className = 'mv-node-detail-section-heading';
      fnHeading.textContent = `Functions (${sorted.length})`;
      fnSection.appendChild(fnHeading);

      const fnContainer = document.createElement('div');
      fnContainer.className = 'mv-node-detail-functions';

      const fnTable = document.createElement('table');
      fnTable.className = 'mv-node-detail-fn-table';

      // Table header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      const fnColKeys: Record<string, string> = {
        LOC: 'loc',
        CC: 'cc',
        MI: 'mi',
      };
      for (const col of ['Name', 'Line', 'LOC', 'CC', 'MI']) {
        const th = document.createElement('th');
        th.textContent = col;
        if (col in fnColKeys) {
          th.title = METRIC_DESCRIPTIONS[fnColKeys[col]].title;
        }
        headerRow.appendChild(th);
      }
      thead.appendChild(headerRow);
      fnTable.appendChild(thead);

      const tbody = document.createElement('tbody');
      sorted.forEach((fn: FunctionMetrics, index: number) => {
        const tr = document.createElement('tr');
        if (hasOverflow && index >= VISIBLE_LIMIT) {
          tr.classList.add('mv-hidden');
        }

        // Name cell
        const nameCell = document.createElement('td');
        nameCell.className = 'mv-node-detail-fn-name';
        nameCell.textContent = fn.name;
        nameCell.title = fn.name;
        tr.appendChild(nameCell);

        // Line cell
        const lineCell = document.createElement('td');
        lineCell.textContent = `L${fn.line}`;
        tr.appendChild(lineCell);

        // LOC cell
        const locCell = document.createElement('td');
        locCell.textContent = String(fn.loc);
        tr.appendChild(locCell);

        // CC cell — warn if > 10
        const ccCell = document.createElement('td');
        ccCell.textContent = String(fn.cc);
        if (fn.cc > 10) {
          ccCell.classList.add('mv-node-detail-fn-warn');
        }
        tr.appendChild(ccCell);

        // MI cell — warn if < 65, show dash if null
        const miCell = document.createElement('td');
        if (fn.mi === null) {
          miCell.textContent = '\u2014';
        } else {
          miCell.textContent = String(fn.mi);
          if (fn.mi < 65) {
            miCell.classList.add('mv-node-detail-fn-warn');
          }
        }
        tr.appendChild(miCell);

        tbody.appendChild(tr);
      });
      fnTable.appendChild(tbody);
      fnContainer.appendChild(fnTable);

      // Toggle button for overflow
      if (hasOverflow) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'mv-node-detail-fn-toggle';
        toggleBtn.textContent = `Show all (${sorted.length})`;
        let expanded = false;

        toggleBtn.addEventListener('click', () => {
          expanded = !expanded;
          const rows = tbody.querySelectorAll('tr');
          rows.forEach((row, i) => {
            if (i >= VISIBLE_LIMIT) {
              row.classList.toggle('mv-hidden', !expanded);
            }
          });
          toggleBtn.textContent = expanded
            ? 'Show less'
            : `Show all (${sorted.length})`;
        });

        fnContainer.appendChild(toggleBtn);
      }

      fnSection.appendChild(fnContainer);
      sidebar.appendChild(fnSection);
    }

    // Connections section
    const connectedLinks = links.filter(
      (l) => l.source.id === node.id || l.target.id === node.id,
    );

    if (connectedLinks.length > 0) {
      const connSection = document.createElement('div');
      connSection.className = 'mv-node-detail-section';

      const connHeading = document.createElement('div');
      connHeading.className = 'mv-node-detail-section-heading';
      connHeading.textContent = `Connections (${connectedLinks.length})`;
      connSection.appendChild(connHeading);

      const connList = document.createElement('ul');
      connList.className = 'mv-node-detail-connections';

      for (const link of connectedLinks) {
        const li = document.createElement('li');
        const isOutgoing = link.source.id === node.id;
        const otherNode = isOutgoing ? link.target : link.source;
        const arrow = isOutgoing ? '\u2192' : '\u2190';

        const nodeLink = document.createElement('a');
        nodeLink.className = 'mv-node-detail-conn-link';
        nodeLink.href = '#';
        nodeLink.textContent = `${arrow} ${otherNode.name}`;
        nodeLink.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          // Find the SVG <g> element for this node and dispatch a click on it,
          // so all handlers (highlight, sidebar) fire as if the node was clicked on the graph.
          const targetEl = nodeSelection
            .filter((d) => d.id === otherNode.id)
            .node();
          if (targetEl) {
            targetEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          }
        });

        const kindSpan = document.createElement('span');
        kindSpan.className = 'mv-node-detail-conn-kind';
        kindSpan.textContent = ` (${link.kind})`;

        li.appendChild(nodeLink);
        li.appendChild(kindSpan);
        connList.appendChild(li);
      }

      connSection.appendChild(connList);
      sidebar.appendChild(connSection);
    }
  }

  /** Shows a modal overlay with the full metric description. */
  function showMetricModal(desc: { title: string; build: (parent: HTMLElement) => void }): void {
    // Remove any existing modal
    const existing = document.querySelector('.mv-metric-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'mv-metric-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const modal = document.createElement('div');
    modal.className = 'mv-metric-modal';

    const header = document.createElement('div');
    header.className = 'mv-metric-modal-header';

    const title = document.createElement('span');
    title.className = 'mv-metric-modal-title';
    const titleId = `mv-modal-title-${Date.now()}`;
    title.id = titleId;
    overlay.setAttribute('aria-labelledby', titleId);
    title.textContent = desc.title;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'mv-metric-modal-close';
    closeBtn.textContent = '\u00d7';
    closeBtn.setAttribute('aria-label', 'Close');

    header.appendChild(title);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    const body = document.createElement('div');
    body.className = 'mv-metric-modal-body';
    desc.build(body);
    modal.appendChild(body);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    activeModalOverlay = overlay;

    function close(): void {
      overlay.remove();
      activeModalOverlay = null;
      document.removeEventListener('keydown', onKeydown);
    }

    function onKeydown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        close();
      }
    }

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', onKeydown);
  }

  function appendRow(table: HTMLTableElement, label: string, value: string, metricKey?: string): void {
    const tr = document.createElement('tr');
    const labelCell = document.createElement('td');
    labelCell.className = 'mv-node-detail-label';
    labelCell.textContent = label;
    if (metricKey && metricKey in METRIC_DESCRIPTIONS) {
      const info = document.createElement('button');
      info.type = 'button';
      info.className = 'mv-metric-info';
      info.textContent = '?';
      info.addEventListener('click', (e) => {
        e.stopPropagation();
        showMetricModal(METRIC_DESCRIPTIONS[metricKey]);
      });
      labelCell.appendChild(info);
    }
    const td = document.createElement('td');
    td.className = 'mv-node-detail-value';
    td.textContent = value;
    tr.appendChild(labelCell);
    tr.appendChild(td);
    table.appendChild(tr);
  }

  function hideSidebar(): void {
    sidebar.classList.add('mv-hidden');
  }

  // Listen for node clicks
  nodeSelection.on('click.nodedetail', (_event: MouseEvent, d: SimNode) => {
    _event.stopPropagation();
    showSidebar(d);
  });

  // Close when another sidebar opens
  function onOtherSidebarOpen(e: Event): void {
    if ((e as CustomEvent).detail !== 'node-detail') {
      hideSidebar();
    }
  }
  container.addEventListener('mv-sidebar-open', onOtherSidebarOpen);

  return {
    destroy: () => {
      activeModalOverlay?.remove();
      activeModalOverlay = null;
      sidebar.remove();
      container.removeEventListener('mv-sidebar-open', onOtherSidebarOpen);
      nodeSelection.on('click.nodedetail', null);
    },
    hideSidebar,
    sidebarElement: sidebar,
  };
}
