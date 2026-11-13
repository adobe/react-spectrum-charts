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

interface PanelIndex {
  delaunay: Delaunay<number> | null;
  refs: { series: SeriesLayout; pt: ScreenPoint }[];
  xs: number[];
}

const indexes = new WeakMap<LinePanel, PanelIndex>();

function index(panel: LinePanel): PanelIndex {
  let idx = indexes.get(panel);
  if (idx) return idx;
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
  idx = {
    delaunay: refs.length ? new Delaunay(Float64Array.from(coords)) : null,
    refs,
    xs: Array.from(xs).sort((a, b) => a - b),
  };
  indexes.set(panel, idx);
  return idx;
}

function panelAt(g: LineGeometry, x: number, y: number): LinePanel | null {
  const s = INTERACTION.panelSlack;
  return g.panels.find((p) => x >= p.x - s && x <= p.x + p.width + s && y >= p.y - s && y <= p.y + p.height + s) ?? null;
}

/** Every defined point of a panel at panel-local x. */
export function itemsAt(panel: LinePanel, px: number): LineHit[] {
  const out: LineHit[] = [];
  for (const series of panel.series) {
    const pt = series.pts.find((p) => p.x === px && p.y != null);
    if (pt) out.push({ panel, series, pt });
  }
  return out;
}

/** Nearest point (point mode) or nearest x column (x mode). Coordinates are plot-local. */
export function hitLine(g: LineGeometry, x: number, y: number, mode: 'point' | 'x'): Hover<LineHit> | null {
  const panel = panelAt(g, x, y);
  if (!panel) return null;
  const lx = x - panel.x;
  const ly = y - panel.y;
  const idx = index(panel);
  if (!idx.delaunay) return null;
  if (mode === 'point') {
    const ref = idx.refs[idx.delaunay.find(lx, ly)];
    if (!ref) return null;
    const hit = { panel, series: ref.series, pt: ref.pt };
    return { primary: hit, items: [hit], mode };
  }
  const j = Math.max(0, Math.min(idx.xs.length - 1, bisector((d: number) => d).center(idx.xs, lx)));
  const items = itemsAt(panel, idx.xs[j]);
  if (!items.length) return null;
  let primary = items[0];
  for (const h of items) if (Math.abs(h.pt.y! - ly) < Math.abs(primary.pt.y! - ly)) primary = h;
  return { primary, items, mode };
}

export function hoverForLine(mark: LineHit, mode: 'point' | 'x'): Hover<LineHit> {
  const items = mode === 'x' ? itemsAt(mark.panel, mark.pt.x) : [mark];
  return { primary: mark, items: items.length ? items : [mark], mode };
}
