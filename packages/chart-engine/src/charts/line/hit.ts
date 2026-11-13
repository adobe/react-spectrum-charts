import { bisector } from 'd3-array';
import { Delaunay } from 'd3-delaunay';
import { INTERACTION } from '../../core/assumptions.js';
import type { Hover } from '../../core/module.js';
import type { LineGeometry, LinePanel, ScreenPoint, SeriesLayout } from './layout.js';

/** A line chart mark: one data point of one series in one panel. */
export interface LineHit {
  panel: LinePanel;
  series: SeriesLayout;
  pt: ScreenPoint;
}

/** Spatial lookup for one panel's defined points. */
interface PanelIndex {
  delaunay: Delaunay<number> | null;
  refs: { series: SeriesLayout; pt: ScreenPoint }[];
  /** Distinct point x positions, ascending. */
  xs: number[];
}

const indexes = new WeakMap<LinePanel, PanelIndex>();

function buildIndex(panel: LinePanel): PanelIndex {
  const refs: PanelIndex['refs'] = [];
  const coords: number[] = [];
  const xs = new Set<number>();
  for (const series of panel.series) {
    for (const pt of series.pts) {
      if (pt.y == null) continue;
      refs.push({ series, pt });
      coords.push(pt.x, pt.y);
      xs.add(pt.x);
    }
  }
  return {
    delaunay: refs.length ? new Delaunay(Float64Array.from(coords)) : null,
    refs,
    xs: Array.from(xs).sort((a, b) => a - b),
  };
}

function indexFor(panel: LinePanel): PanelIndex {
  let panelIndex = indexes.get(panel);
  if (panelIndex) return panelIndex;
  panelIndex = buildIndex(panel);
  indexes.set(panel, panelIndex);
  return panelIndex;
}

function panelAt(geometry: LineGeometry, x: number, y: number): LinePanel | null {
  const slack = INTERACTION.panelSlack;
  const contains = (panel: LinePanel): boolean =>
    x >= panel.x - slack && x <= panel.x + panel.width + slack && y >= panel.y - slack && y <= panel.y + panel.height + slack;
  return geometry.panels.find(contains) ?? null;
}

/** Every defined point of a panel at panel-local x. */
export function itemsAt(panel: LinePanel, px: number): LineHit[] {
  const out: LineHit[] = [];
  for (const series of panel.series) {
    const pt = series.pts.find((point) => point.x === px && point.y != null);
    if (pt) out.push({ panel, series, pt });
  }
  return out;
}

/** Index of the x position nearest to `x`. */
function nearestXIndex(xs: number[], x: number): number {
  const center = bisector((value: number) => value).center(xs, x);
  return Math.max(0, Math.min(xs.length - 1, center));
}

/** The hit whose y is closest to `y`. */
function closestInY(items: LineHit[], y: number): LineHit {
  let closest = items[0];
  for (const hit of items) if (Math.abs(hit.pt.y! - y) < Math.abs(closest.pt.y! - y)) closest = hit;
  return closest;
}

/** Nearest point (point mode) or nearest x column (x mode). Coordinates are plot-local. */
export function hitLine(geometry: LineGeometry, x: number, y: number, mode: 'point' | 'x'): Hover<LineHit> | null {
  const panel = panelAt(geometry, x, y);
  if (!panel) return null;
  const localX = x - panel.x;
  const localY = y - panel.y;
  const panelIndex = indexFor(panel);
  if (!panelIndex.delaunay) return null;
  if (mode === 'point') {
    const ref = panelIndex.refs[panelIndex.delaunay.find(localX, localY)];
    if (!ref) return null;
    const hit = { panel, series: ref.series, pt: ref.pt };
    return { primary: hit, items: [hit], mode };
  }
  const column = panelIndex.xs[nearestXIndex(panelIndex.xs, localX)];
  const items = itemsAt(panel, column);
  if (!items.length) return null;
  return { primary: closestInY(items, localY), items, mode };
}

export function hoverForLine(mark: LineHit, mode: 'point' | 'x'): Hover<LineHit> {
  const items = mode === 'x' ? itemsAt(mark.panel, mark.pt.x) : [mark];
  return { primary: mark, items: items.length ? items : [mark], mode };
}
