import type { CartesianFrame, CartesianSpec, DomainTween, PanelFrame } from '../../core/cartesian/layout.js';
import { axisSides, layoutCartesian } from '../../core/cartesian/layout.js';
import type { Env, LayoutInput } from '../../core/module.js';
import { font } from '../../core/theme.js';
import { measureText } from '../../util/text.js';
import type { Model, Point, SeriesModel } from './model.js';
import type { DirectLabelOptions, LineChartOptions } from './types.js';

/** Gap between a direct or trailing label and the plot edge. */
const LABEL_GAP = 8;
const BOLD = 700;
/** Line width of minimal charts (sparklines). */
const MINIMAL_LINE_WIDTH = 1.5;
/** Room above the plot for value labels, relative to the label font size. */
const VALUE_LABEL_LINE_HEIGHT_RATIO = 1.3;

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

/** Category labels default to the end unless only a value label was requested. */
function defaultCategory(directLabels: DirectLabelOptions): ResolvedDirect['category'] {
  if (directLabels.category !== undefined) return directLabels.category;
  return directLabels.value === 'end' ? false : 'end';
}

export function resolveDirect(opts: LineChartOptions): ResolvedDirect {
  const directLabels = opts.directLabels;
  if (directLabels === false || directLabels === undefined || opts.minimal) return { category: false, value: false, include: () => false };
  if (directLabels === true) return { category: 'end', value: false, include: () => true };
  const included = directLabels.include ? new Set(directLabels.include) : null;
  return {
    category: defaultCategory(directLabels),
    value: directLabels.value === 'end',
    include: (key) => !included || included.has(key),
  };
}

export function isTrellis(model: Model, options: LineChartOptions): boolean {
  return model.facets.length > 1 || (options.layout === 'trellis' && !!options.facet);
}

export function visibleSeries(model: Model, hidden: Set<string>): SeriesModel[] {
  return model.series.filter((series) => !series.missing && !hidden.has(series.key) && !hidden.has(series.colorKey));
}

function lineWidthFor(options: LineChartOptions, env: Env): number {
  const defaultWidth = options.minimal ? MINIMAL_LINE_WIDTH : env.sizes.lineWidth;
  return options.lineWidth ?? defaultWidth;
}

/** Room above the plot for value labels or the end marker. */
function topMargin(options: LineChartOptions, env: Env, direct: ResolvedDirect, lineWidth: number): number {
  const { sizes } = env;
  if (direct.value) return Math.round(sizes.labelFont * VALUE_LABEL_LINE_HEIGHT_RATIO);
  if (options.endMarker) return Math.ceil(sizes.pointRadius + lineWidth / 2);
  return 0;
}

/** Room left and right of the plot for outside direct labels, the trailing label and the end marker. */
function sideMargins(
  options: LineChartOptions,
  env: Env,
  visible: SeriesModel[],
  direct: ResolvedDirect,
  axes: { yPosition: 'left' | 'right'; showYAxis: boolean; hasY2: boolean },
  lineWidth: number,
): { left: number; right: number } {
  const { sizes } = env;
  const { yPosition, showYAxis, hasY2 } = axes;
  const labelFont = font(sizes.labelFont, BOLD);
  const namesWidth = (): number => {
    const names = visible.filter((series) => direct.include(series.key)).map((series) => series.key);
    return names.length ? Math.max(...names.map((name) => measureText(name, labelFont))) : 0;
  };
  let left = 0;
  let right = 0;
  // End-of-line category labels sit outside the plot only when the y axis is on the left.
  if (direct.category === 'end' && (yPosition === 'left' || !showYAxis) && !hasY2) {
    const width = namesWidth();
    if (width) right += Math.ceil(width) + LABEL_GAP;
  }
  if (direct.category === 'start' && (yPosition === 'right' || !showYAxis)) {
    const width = namesWidth();
    if (width) left += Math.ceil(width) + LABEL_GAP;
  }
  if (options.trailingLabel) right += Math.ceil(measureText(options.trailingLabel, labelFont)) + LABEL_GAP;
  if (options.endMarker) right += Math.ceil(sizes.pointRadius + lineWidth);
  return { left, right };
}

/** What the line chart needs from the shared cartesian axes, including room for its direct labels. */
export function lineAxes(model: Model, options: LineChartOptions, env: Env, hidden: Set<string>): CartesianSpec {
  const visible = visibleSeries(model, hidden);
  const trellis = isTrellis(model, options);
  const hasY2 = (options.y2Axis?.series?.length ?? 0) > 0 && visible.some((series) => series.axis === 'y2');
  const xs: number[] = [];
  const xSource = visible.length ? visible : model.series;
  for (const series of xSource) for (const point of series.points) xs.push(point.x);
  const yValues: number[] = [];
  const y2Values: number[] = [];
  for (const series of visible) {
    const target = series.axis === 'y2' && hasY2 ? y2Values : yValues;
    for (const point of series.points) if (point.y != null) target.push(point.y);
  }
  for (const annotation of options.annotations ?? []) if (annotation.y != null) yValues.push(annotation.y);

  const { yPosition, showYAxis } = axisSides(options, trellis);
  const lineWidth = lineWidthFor(options, env);
  const direct = resolveDirect(options);
  const top = topMargin(options, env, direct, lineWidth);
  const { left, right } = sideMargins(options, env, visible, direct, { yPosition, showYAxis, hasY2 }, lineWidth);

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

export function colorsFor(model: Model, options: LineChartOptions, env: Env): Pick<LineGeometry, 'colorOf' | 'seriesColor'> {
  const palette = env.palette;
  const colorOf = (colorKey: string): string => {
    const paletteIndex = Math.max(0, model.colorKeys.indexOf(colorKey)) % palette.length;
    return options.colors?.[colorKey] ?? options.seriesStyles?.[colorKey]?.color ?? palette[paletteIndex];
  };
  const bySeries = new Map<string, string>();
  for (const series of model.series) if (!bySeries.has(series.key)) bySeries.set(series.key, colorOf(series.colorKey));
  return { colorOf, seriesColor: (seriesKey) => bySeries.get(seriesKey) ?? colorOf(seriesKey) };
}

export function layoutLine(input: LayoutInput<LineChartOptions, Model, LineSnapshot>): LineGeometry {
  const { model, options, env, hidden, tween } = input;
  const domains = tween ? { t: tween.t, ...tween.from.domains } : null;
  const frame = layoutCartesian(lineAxes(model, options, env, hidden), options, env, input.width, input.height, domains);
  const colors = colorsFor(model, options, env);
  const visible = visibleSeries(model, hidden);
  const progress = tween ? Math.max(0, Math.min(1, tween.t)) : 1;
  /** Value shown at this point of the update animation. */
  const displayed = (series: SeriesModel, point: Point): number | null => {
    if (point.y == null || !tween || progress >= 1) return point.y;
    const previous = tween.from.values.get(series.id)?.get(point.x);
    return previous == null ? point.y : previous + (point.y - previous) * progress;
  };
  const layoutSeries = (series: SeriesModel): SeriesLayout => {
    const scale = series.axis === 'y2' && frame.y2 ? frame.y2 : frame.y;
    return {
      s: series,
      color: colors.seriesColor(series.key),
      pts: series.points.map((point) => {
        const value = displayed(series, point);
        return { x: frame.xScale(point.x), y: value == null ? null : scale(value), value, p: point };
      }),
      entering: !!tween && !tween.from.values.has(series.id),
    };
  };
  const panels: LinePanel[] = frame.panels.map((panelFrame) => ({
    ...panelFrame,
    series: visible.filter((series) => series.facet === panelFrame.facet || !frame.trellis).map(layoutSeries),
  }));
  return { frame, panels, ...colors, lineWidth: lineWidthFor(options, env) };
}

export function snapshotLine(geometry: LineGeometry): LineSnapshot {
  const values = new Map<string, Map<number, number>>();
  for (const panel of geometry.panels) {
    for (const series of panel.series) {
      const valueByX = new Map<number, number>();
      for (const point of series.pts) if (point.value != null) valueByX.set(point.p.x, point.value);
      values.set(series.s.id, valueByX);
    }
  }
  const { xDomain, yDomain, y2Domain } = geometry.frame;
  return { values, domains: { xDomain, yDomain, y2Domain } };
}
