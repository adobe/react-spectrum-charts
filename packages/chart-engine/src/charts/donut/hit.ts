import type { Hover } from '../../core/module.js';
import { DONUT } from '../../core/assumptions.js';
import type { ArcLayout, DonutGeometry } from './layout.js';

/** The segment and the same category in every other facet. */
export function hoverForDonut(g: DonutGeometry, a: ArcLayout): Hover<ArcLayout> {
  const items = g.trellis
    ? g.pies.map((p) => p.arcs.find((x) => x.category === a.category && x.end > x.start)).filter((x): x is ArcLayout => !!x)
    : [a];
  return { primary: a, items, mode: 'point' };
}

export function hitDonut(g: DonutGeometry, x: number, y: number): ArcLayout | null {
  for (const p of g.pies) {
    const dx = x - p.cx;
    const dy = y - p.cy;
    const r = Math.hypot(dx, dy);
    if (r < p.inner - DONUT.hitSlack || r > p.outer + DONUT.hitSlack) continue;
    let angle = Math.atan2(dx, -dy);
    if (!g.semicircle && angle < 0) angle += Math.PI * 2;
    const hit = p.arcs.find((a) => a.end > a.start && angle >= a.start && angle < a.end);
    if (hit) return hit;
  }
  return null;
}

