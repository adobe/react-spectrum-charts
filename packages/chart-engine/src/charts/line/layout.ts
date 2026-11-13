import type { CartesianFrame, CartesianSpec, DomainTween, PanelFrame } from '../../core/cartesian/layout.js';
import { axisSides, layoutCartesian } from '../../core/cartesian/layout.js';
import type { Env, LayoutInput } from '../../core/module.js';
import { font } from '../../core/theme.js';
import { measureText } from '../../util/text.js';
import type { Model, Point, SeriesModel } from './model.js';
import type { LineChartOptions } from './types.js';

const LABEL_GAP = 8;

export interface ScreenPoint {
  /** Position within the panel. */
  x: number;
  y: number | null;
  /** Displayed (possibly tweened) value. */
  value: number | null;
  p: Point;
}

export interface SeriesLayout {
  s: SeriesModel;
  color: string;
  pts: ScreenPoint[];
  /** True when the series appeared in this update (fades in). */
  entering: boolean;
}

export interface LinePanel extends PanelFrame {
  series: SeriesLayout[];
}

export interface LineGeometry {
  frame: CartesianFrame;
  panels: LinePanel[];
  colorOf: (colorKey: string) => string;
  seriesColor: (seriesKey: string) => string;
  lineWidth: number;
}

/** Previous displayed values: series id → x → value. */
export interface LineSnapshot {
  values: Map<string, Map<number, number>>;
  domains: Omit<DomainTween, 't'>;
}

export interface ResolvedDirect {
  category: 'end' | 'start' | false;
  value: boolean;
  include: (k: string) => boolean;
}

export function resolveDirect(opts: LineChartOptions): ResolvedDirect {
  const d = opts.directLabels;
  if (d === false || d === undefined || opts.minimal) return { category: false, value: false, include: () => false };
  if (d === true) return { category: 'end', value: false, include: () => true };
  const set = d.include ? new Set(d.include) : null;
  return {
    category: d.category === undefined ? (d.value === 'end' ? false : 'end') : d.category,
    value: d.value === 'end',
    include: (k) => !set || set.has(k),
  };
}

export function isTrellis(model: Model, o: LineChartOptions): boolean {
  return model.facets.length > 1 || (o.layout === 'trellis' && !!o.facet);
}

export function visibleSeries(model: Model, hidden: Set<string>): SeriesModel[] {
  return model.series.filter((s) => !s.missing && !hidden.has(s.key) && !hidden.has(s.colorKey));
}

function lineWidthFor(o: LineChartOptions, env: Env): number {
  return o.lineWidth ?? (o.minimal ? 1.5 : env.sizes.lineWidth);
}

/** What the line chart needs from the shared cartesian axes, including room for its direct labels. */
export function lineAxes(model: Model, o: LineChartOptions, env: Env, hidden: Set<string>): CartesianSpec {
  const { sizes } = env;
  const visible = visibleSeries(model, hidden);
  const trellis = isTrellis(model, o);
  const hasY2 = (o.y2Axis?.series?.length ?? 0) > 0 && visible.some((s) => s.axis === 'y2');
  const xs: number[] = [];
  for (const s of visible.length ? visible : model.series) for (const p of s.points) xs.push(p.x);
  const yValues: number[] = [];
  const y2Values: number[] = [];
  for (const s of visible) {
    const target = s.axis === 'y2' && hasY2 ? y2Values : yValues;
    for (const p of s.points) if (p.y != null) target.push(p.y);
  }
  for (const a of o.annotations ?? []) if (a.y != null) yValues.push(a.y);

  const { yPosition, showYAxis } = axisSides(o, trellis);
  const lineWidth = lineWidthFor(o, env);
  const direct = resolveDirect(o);
  const top = direct.value ? Math.round(sizes.labelFont * 1.3) : o.endMarker ? Math.ceil(sizes.pointRadius + lineWidth / 2) : 0;
  const labelFont = font(sizes.labelFont, 700);
  const namesWidth = (): number => {
    const names = visible.filter((s) => direct.include(s.key)).map((s) => s.key);
    return names.length ? Math.max(...names.map((k) => measureText(k, labelFont))) : 0;
  };
  let left = 0;
  let right = 0;
  // End-of-line category labels sit outside the plot only when the y axis is on the left.
  if (direct.category === 'end' && (yPosition === 'left' || !showYAxis) && !hasY2) {
    const w = namesWidth();
    if (w) right += Math.ceil(w) + LABEL_GAP;
  }
  if (direct.category === 'start' && (yPosition === 'right' || !showYAxis)) {
    const w = namesWidth();
    if (w) left += Math.ceil(w) + LABEL_GAP;
  }
  if (o.trailingLabel) right += Math.ceil(measureText(o.trailingLabel, labelFont)) + LABEL_GAP;
  if (o.endMarker) right += Math.ceil(sizes.pointRadius + lineWidth);

  return {
    xType: model.xType,
    categories: model.categories,
    xs,
    yValues,
    y2Values: hasY2 ? y2Values : null,
    facets: model.facets,
    trellis,
    margin: { top, right, left },
  };
}

export function colorsFor(model: Model, o: LineChartOptions, env: Env): Pick<LineGeometry, 'colorOf' | 'seriesColor'> {
  const palette = env.palette;
  const colorOf = (k: string): string =>
    o.colors?.[k] ?? o.seriesStyles?.[k]?.color ?? palette[Math.max(0, model.colorKeys.indexOf(k)) % palette.length];
  const bySeries = new Map<string, string>();
  for (const s of model.series) if (!bySeries.has(s.key)) bySeries.set(s.key, colorOf(s.colorKey));
  return { colorOf, seriesColor: (k) => bySeries.get(k) ?? colorOf(k) };
}

export function layoutLine(input: LayoutInput<LineChartOptions, Model, LineSnapshot>): LineGeometry {
  const { model, options: o, env, hidden, tween } = input;
  const domains = tween ? { t: tween.t, ...tween.from.domains } : null;
  const frame = layoutCartesian(lineAxes(model, o, env, hidden), o, env, input.width, input.height, domains);
  const colors = colorsFor(model, o, env);
  const visible = visibleSeries(model, hidden);
  const t = tween ? Math.max(0, Math.min(1, tween.t)) : 1;
  const display = (s: SeriesModel, p: Point): number | null => {
    if (p.y == null || !tween || t >= 1) return p.y;
    const prev = tween.from.values.get(s.id)?.get(p.x);
    return prev == null ? p.y : prev + (p.y - prev) * t;
  };
  const panels: LinePanel[] = frame.panels.map((pf) => ({
    ...pf,
    series: visible
      .filter((s) => s.facet === pf.facet || !frame.trellis)
      .map((s) => {
        const scale = s.axis === 'y2' && frame.y2 ? frame.y2 : frame.y;
        return {
          s,
          color: colors.seriesColor(s.key),
          pts: s.points.map((p) => {
            const value = display(s, p);
            return { x: frame.xScale(p.x), y: value == null ? null : scale(value), value, p };
          }),
          entering: !!tween && !tween.from.values.has(s.id),
        };
      }),
  }));
  return { frame, panels, ...colors, lineWidth: lineWidthFor(o, env) };
}

export function snapshotLine(g: LineGeometry): LineSnapshot {
  const values = new Map<string, Map<number, number>>();
  for (const panel of g.panels) {
    for (const sl of panel.series) {
      const m = new Map<number, number>();
      for (const pt of sl.pts) if (pt.value != null) m.set(pt.p.x, pt.value);
      values.set(sl.s.id, m);
    }
  }
  const { xDomain, yDomain, y2Domain } = g.frame;
  return { values, domains: { xDomain, yDomain, y2Domain } };
}
