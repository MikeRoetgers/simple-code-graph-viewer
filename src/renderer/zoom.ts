import { zoom, type ZoomBehavior } from 'd3-zoom';
import type { Selection } from 'd3-selection';

export function setupZoom(
  svg: Selection<SVGSVGElement, unknown, null, undefined>,
  g: Selection<SVGGElement, unknown, null, undefined>,
): ZoomBehavior<SVGSVGElement, unknown> {
  const zoomBehavior = zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 10])
    .on('zoom', (event) => {
      g.attr('transform', event.transform.toString());
    });

  svg.call(zoomBehavior);

  return zoomBehavior;
}
