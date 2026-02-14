import type { Selection } from 'd3-selection';
import type { SimNode, SimLink } from '../types.js';

export function setupHighlight(
  svg: Selection<SVGSVGElement, unknown, null, undefined>,
  nodeSelection: Selection<SVGGElement, SimNode, SVGGElement, unknown>,
  linkSelection: Selection<SVGLineElement, SimLink, SVGGElement, unknown>,
  links: SimLink[],
): () => void {
  // On node click: highlight the clicked node and its neighbors, dim everything else
  nodeSelection.on('click.highlight', (event: MouseEvent, clickedNode: SimNode) => {
    event.stopPropagation(); // Prevent SVG background click from firing

    // Find all visible links connected to the clicked node.
    // Links hidden by the filter panel (mv-hidden class) are excluded so that
    // highlighting only considers link types the user has chosen to display.
    const connectedLinks = links.filter((l) => {
      if (l.source.id !== clickedNode.id && l.target.id !== clickedNode.id) return false;
      const el = linkSelection.filter((d) => d === l).node();
      return el !== null && !el.classList.contains('mv-hidden');
    });

    // Collect neighbor node IDs (including the clicked node itself)
    const neighborIds = new Set<string>([clickedNode.id]);
    for (const link of connectedLinks) {
      neighborIds.add(link.source.id);
      neighborIds.add(link.target.id);
    }

    // Apply classes to nodes
    nodeSelection
      .classed('mv-highlighted', (d) => neighborIds.has(d.id))
      .classed('mv-dimmed', (d) => !neighborIds.has(d.id));

    // Apply classes to links — skip hidden links so filter state is preserved
    linkSelection
      .classed('mv-highlighted', function (d) {
        if (this.classList.contains('mv-hidden')) return false;
        return d.source.id === clickedNode.id || d.target.id === clickedNode.id;
      })
      .classed('mv-dimmed', function (d) {
        if (this.classList.contains('mv-hidden')) return false;
        return d.source.id !== clickedNode.id && d.target.id !== clickedNode.id;
      });
  });

  // On SVG background click: reset all highlights
  svg.on('click.highlight', () => {
    nodeSelection.classed('mv-highlighted', false).classed('mv-dimmed', false);
    linkSelection.classed('mv-highlighted', false).classed('mv-dimmed', false);
  });

  return () => {
    nodeSelection.on('click.highlight', null);
    svg.on('click.highlight', null);
  };
}
