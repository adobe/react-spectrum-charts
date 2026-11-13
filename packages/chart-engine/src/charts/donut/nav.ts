import { DONUT } from '../../core/assumptions.js';
import type { NavGroup, NavTree } from '../../core/module.js';
import { arcBounds, ringPath, type ArcLayout, type DonutGeometry } from './layout.js';

export function describeArc(g: DonutGeometry, a: ArcLayout): string {
  const facet = a.pie.facet != null && g.trellis ? `${a.pie.facet}, ` : '';
  return `${facet}${a.category}, ${g.formatPercent(a.percent)}, ${g.formatValue(a.value)}`;
}

/**
 * Keyboard structure. A single donut is flat: focus starts at 12 o'clock (or 9 o'clock for semicircles) and
 * moves clockwise. A trellis has one group per facet; up/down moves to the same category in the next facet.
 */
export function donutNav(g: DonutGeometry): NavTree<ArcLayout> {
  const o = DONUT.focusOffset;
  const groups: NavGroup<ArcLayout>[] = g.pies.map((p) => {
    const arcs = p.arcs.filter((a) => a.end - a.start > 1e-6);
    const name = p.facet ?? 'Donut';
    return {
      key: `pie-${p.index}`,
      label: `${name}, ${arcs.length} segment${arcs.length === 1 ? '' : 's'}, total ${g.formatValue(p.total)}`,
      rect: { x: p.cx - p.outer - o, y: p.cy - p.outer - o, width: 2 * (p.outer + o), height: (g.semicircle ? 1 : 2) * (p.outer + o) },
      items: arcs.map((a) => ({
        mark: a,
        match: a.category,
        label: describeArc(g, a),
        rect: arcBounds(p.cx, p.cy, Math.max(0, p.inner - o), p.outer + o, a.start, a.end),
        path: ringPath(p.cx, p.cy, Math.max(0, p.inner - o), p.outer + o, a.start, a.end),
      })),
    };
  });
  const n = g.pies.length;
  const label = n > 1 ? `${n} donuts.` : `${groups[0]?.items.length ?? 0} segments.`;
  return { label, flat: n === 1, groups };
}
