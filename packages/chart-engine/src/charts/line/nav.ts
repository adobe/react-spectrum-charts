import { INTERACTION } from '../../core/assumptions.js';
import type { NavGroup, NavTree } from '../../core/module.js';
import type { LineHit } from './hit.js';
import type { LineGeometry } from './layout.js';

/** Keyboard structure: chart → lines → points. Up/down moves to the nearest point of the next line. */
export function lineNav(g: LineGeometry): NavTree<LineHit> {
  const { formatX, formatY } = g.frame;
  const size = INTERACTION.pointFocusSize;
  const groups: NavGroup<LineHit>[] = [];
  for (const panel of g.panels) {
    for (const sl of panel.series) {
      const pts = sl.pts.filter((p) => p.y != null);
      if (!pts.length) continue;
      const facet = panel.facet ? `${panel.facet}, ` : '';
      const xs = pts.map((q) => q.x);
      const ys = pts.map((q) => q.y!);
      const values = pts.map((q) => q.value!);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const first = pts[0];
      const last = pts[pts.length - 1];
      const trend = last.value! > first.value! ? 'increasing' : last.value! < first.value! ? 'decreasing' : 'flat';
      const ax = sl.s.axis;
      groups.push({
        key: sl.s.id,
        emphasis: sl.s.key,
        rect: { x: panel.x + minX - 6, y: panel.y + minY - 6, width: Math.max(...xs) - minX + 12, height: Math.max(...ys) - minY + 12 },
        label:
          `${facet}${sl.s.key}, ${pts.length} values from ${formatX(first.p.xRaw)} to ${formatX(last.p.xRaw)}, ${trend}. ` +
          `Lowest ${formatY(Math.min(...values), ax)}, highest ${formatY(Math.max(...values), ax)}, last ${formatY(last.value, ax)}`,
        items: pts.map((pt) => ({
          mark: { panel, series: sl, pt },
          match: String(pt.p.x),
          rect: { x: panel.x + pt.x - size / 2, y: panel.y + pt.y! - size / 2, width: size, height: size },
          label: `${facet}${sl.s.key}, ${formatX(pt.p.xRaw)}, ${formatY(pt.value, ax)}${pt.p.estimated ? ' (estimated)' : ''}`,
        })),
      });
    }
  }
  const n = groups.length;
  return { label: `${n} line${n === 1 ? '' : 's'}.`, flat: false, groups };
}
