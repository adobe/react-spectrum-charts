import { DONUT } from '../../core/assumptions.js';
import type { NavGroup, NavTree } from '../../core/module.js';
import { arcBounds, ringPath, type ArcLayout, type DonutGeometry, type PieLayout } from './layout.js';

/** Arcs narrower than this (radians) are skipped by keyboard navigation. */
const MIN_FOCUSABLE_SPAN = 1e-6;

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export function describeArc(geometry: DonutGeometry, arc: ArcLayout): string {
  const facet = arc.pie.facet != null && geometry.trellis ? `${arc.pie.facet}, ` : '';
  return `${facet}${arc.category}, ${geometry.formatPercent(arc.percent)}, ${geometry.formatValue(arc.value)}`;
}

/** Focus rectangle around the whole donut (the top half for semicircles). */
function pieFocusRect(pie: PieLayout, semicircle: boolean) {
  const offset = DONUT.focusOffset;
  const heightFactor = semicircle ? 1 : 2;
  return {
    x: pie.cx - pie.outer - offset,
    y: pie.cy - pie.outer - offset,
    width: 2 * (pie.outer + offset),
    height: heightFactor * (pie.outer + offset),
  };
}

function pieGroup(geometry: DonutGeometry, pie: PieLayout): NavGroup<ArcLayout> {
  const offset = DONUT.focusOffset;
  const arcs = pie.arcs.filter((arc) => arc.end - arc.start > MIN_FOCUSABLE_SPAN);
  const name = pie.facet ?? 'Donut';
  const focusInner = Math.max(0, pie.inner - offset);
  const focusOuter = pie.outer + offset;
  return {
    key: `pie-${pie.index}`,
    label: `${name}, ${plural(arcs.length, 'segment')}, total ${geometry.formatValue(pie.total)}`,
    rect: pieFocusRect(pie, geometry.semicircle),
    items: arcs.map((arc) => ({
      mark: arc,
      match: arc.category,
      label: describeArc(geometry, arc),
      rect: arcBounds(pie.cx, pie.cy, focusInner, focusOuter, arc.start, arc.end),
      path: ringPath(pie.cx, pie.cy, focusInner, focusOuter, arc.start, arc.end),
    })),
  };
}

/**
 * Keyboard structure. A single donut is flat: focus starts at 12 o'clock (or 9 o'clock for semicircles) and
 * moves clockwise. A trellis has one group per facet; up/down moves to the same category in the next facet.
 */
export function donutNav(geometry: DonutGeometry): NavTree<ArcLayout> {
  const groups = geometry.pies.map((pie) => pieGroup(geometry, pie));
  const pieCount = geometry.pies.length;
  const label = pieCount > 1 ? `${pieCount} donuts.` : `${groups[0]?.items.length ?? 0} segments.`;
  return { label, flat: pieCount === 1, groups };
}
