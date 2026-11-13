import { INTERACTION } from '../../core/assumptions.js';
import type { NavGroup, NavTree } from '../../core/module.js';
import type { LineHit } from './hit.js';
import type { LineGeometry, LinePanel, ScreenPoint, SeriesLayout } from './layout.js';

/** Padding around a line's bounding box in its keyboard focus rect. */
const GROUP_FOCUS_PADDING = 6;

function trendOf(first: ScreenPoint, last: ScreenPoint): string {
  if (last.value! > first.value!) return 'increasing';
  if (last.value! < first.value!) return 'decreasing';
  return 'flat';
}

/** One keyboard group for a line, with one item per defined point. */
function seriesGroup(geometry: LineGeometry, panel: LinePanel, series: SeriesLayout): NavGroup<LineHit> | null {
  const { formatX, formatY } = geometry.frame;
  const focusSize = INTERACTION.pointFocusSize;
  const points = series.pts.filter((point) => point.y != null);
  if (!points.length) return null;
  const facet = panel.facet ? `${panel.facet}, ` : '';
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y!);
  const values = points.map((point) => point.value!);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const first = points[0];
  const last = points[points.length - 1];
  const axis = series.s.axis;
  const summary = `${facet}${series.s.key}, ${points.length} values from ${formatX(first.p.xRaw)} to ${formatX(last.p.xRaw)}, ${trendOf(first, last)}. `;
  const range = `Lowest ${formatY(Math.min(...values), axis)}, highest ${formatY(Math.max(...values), axis)}, last ${formatY(last.value, axis)}`;
  return {
    key: series.s.id,
    emphasis: series.s.key,
    rect: {
      x: panel.x + minX - GROUP_FOCUS_PADDING,
      y: panel.y + minY - GROUP_FOCUS_PADDING,
      width: Math.max(...xs) - minX + 2 * GROUP_FOCUS_PADDING,
      height: Math.max(...ys) - minY + 2 * GROUP_FOCUS_PADDING,
    },
    label: summary + range,
    items: points.map((pt) => ({
      mark: { panel, series, pt },
      match: String(pt.p.x),
      rect: { x: panel.x + pt.x - focusSize / 2, y: panel.y + pt.y! - focusSize / 2, width: focusSize, height: focusSize },
      label: `${facet}${series.s.key}, ${formatX(pt.p.xRaw)}, ${formatY(pt.value, axis)}${pt.p.estimated ? ' (estimated)' : ''}`,
    })),
  };
}

/** Keyboard structure: chart → lines → points. Up/down moves to the nearest point of the next line. */
export function lineNav(geometry: LineGeometry): NavTree<LineHit> {
  const groups: NavGroup<LineHit>[] = [];
  for (const panel of geometry.panels) {
    for (const series of panel.series) {
      const navGroup = seriesGroup(geometry, panel, series);
      if (navGroup) groups.push(navGroup);
    }
  }
  const count = groups.length;
  return { label: `${count} line${count === 1 ? '' : 's'}.`, flat: false, groups };
}
