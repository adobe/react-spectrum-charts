import type { Hover } from '../../core/module.js';
import { DONUT } from '../../core/assumptions.js';
import type { ArcLayout, DonutGeometry } from './layout.js';

function isDrawn(arc: ArcLayout): boolean {
  return arc.end > arc.start;
}

/** The segment and the same category in every other facet. */
export function hoverForDonut(geometry: DonutGeometry, primary: ArcLayout): Hover<ArcLayout> {
  if (!geometry.trellis) return { primary, items: [primary], mode: 'point' };
  const matches = geometry.pies.map((pie) => pie.arcs.find((arc) => arc.category === primary.category && isDrawn(arc)));
  const items = matches.filter((arc): arc is ArcLayout => !!arc);
  return { primary, items, mode: 'point' };
}

/** Clockwise angle from 12 o'clock of a point relative to the centre; semicircles keep (-π, π]. */
function pointerAngle(dx: number, dy: number, semicircle: boolean): number {
  const angle = Math.atan2(dx, -dy);
  if (!semicircle && angle < 0) return angle + Math.PI * 2;
  return angle;
}

/** Segment under a point, allowing a little slack around the ring. */
export function hitDonut(geometry: DonutGeometry, x: number, y: number): ArcLayout | null {
  for (const pie of geometry.pies) {
    const dx = x - pie.cx;
    const dy = y - pie.cy;
    const radius = Math.hypot(dx, dy);
    const isOutsideRing = radius < pie.inner - DONUT.hitSlack || radius > pie.outer + DONUT.hitSlack;
    if (isOutsideRing) continue;
    const angle = pointerAngle(dx, dy, geometry.semicircle);
    const hit = pie.arcs.find((arc) => isDrawn(arc) && angle >= arc.start && angle < arc.end);
    if (hit) return hit;
  }
  return null;
}
