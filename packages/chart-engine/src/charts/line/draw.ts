import { area as d3area, curveLinear, curveMonotoneX, line as d3line, type CurveFactory } from 'd3-shape';
import type { CartesianFrame } from '../../core/cartesian/layout.js';
import type { DrawState, Env, Hover } from '../../core/module.js';
import { font, type SizeTokens, type Theme } from '../../core/theme.js';
import { dashFor, group, shapePath, type SceneNode, type Style } from '../../render/scene.js';
import { resolveVertical } from '../../util/labels.js';
import { linearRegression } from '../../util/stats.js';
import { measureText } from '../../util/text.js';
import type { LineHit } from './hit.js';
import { itemsAt } from './hit.js';
import { resolveDirect, type LineGeometry, type LinePanel, type ResolvedDirect, type ScreenPoint, type SeriesLayout } from './layout.js';
import type { AnnotationOptions, LineChartOptions } from './types.js';

/** Offset that centres a 1px stroke on a device pixel. */
const HALF_PIXEL = 0.5;
const BOLD = 700;

/** Draw order: dimmed series first, emphasized series last (on top). */
const RANK = { dimmed: 0, normal: 1, emphasized: 2 } as const;

const LINE = {
  /** Extra stroke width of the hovered series in point hover mode. */
  pointHoverWidthBoost: 1,
  /** Extra stroke width of every series in x hover mode. */
  xHoverWidthBoost: 0.5,
} as const;

const AREA = {
  /** The gradient fades out this far below the plot bottom. */
  gradientOverhang: 8,
  /** Gradient opacity at the series peak, relative to the theme's area opacity. */
  peakOpacityScale: 2,
} as const;

const POINTS = {
  strokeWidth: 1.5,
  /** In auto mode, points are shown when consecutive values are at least this far apart. */
  minAutoSpacing: 32,
  /** In auto mode, points are never shown for more values than this. */
  maxAutoCount: 400,
} as const;

const TRENDLINE_STROKE_WIDTH = 1.5;

const REVEAL_CLIP = {
  /** Room around the plot so wide strokes and points are not clipped. */
  padding: 2,
  /** Additional room above the plot. */
  topExtra: 40,
} as const;

const ANNOTATION = {
  lineHeightRatio: 1.3,
  /** Height of the stem from the label to the point. */
  stemHeight: 28,
  /** Gap between the stem and the point marker. */
  stemGap: 6,
  stemStrokeWidth: 1,
  dotRadius: 4,
  dotStrokeWidth: 1.5,
  textOffset: 4,
  /** Annotations further than this outside the plot are skipped. */
  edgeSlack: 1,
  /** Annotations right of this fraction of the plot width put their label on the left. */
  flipRatio: 0.66,
} as const;

const DIRECT_LABEL = {
  lineHeightRatio: 1.2,
  /** Gap between the end of a line (or its marker) and an outside label. */
  gap: 8,
  /** Gap between a value marker and an outside label. */
  markerGap: 6,
  /** Clearance above a value marker for an inside label. */
  markerClearance: 2,
  /** Clearance above the line for an inside label. */
  lineClearance: 4,
  /** Inside labels may rise this far above the plot's top edge. */
  topInset: 2,
  minMarkerStrokeWidth: 1.5,
  /** Value marker stroke width relative to the line width. */
  markerStrokeRatio: 0.75,
} as const;

const END_MARKER = {
  /** The end marker is slightly smaller than a regular point. */
  radiusInset: 0.5,
  minStrokeWidth: 1.5,
} as const;

const TRAILING_LABEL_GAP = 8;

const CROSSHAIR_STROKE_WIDTH = 1;

const HOVER_MARKER = {
  radiusBoost: 1,
  strokeWidth: 2,
  /** Hover value labels use a font this much smaller than direct labels. */
  fontSizeReduction: 2,
  lineHeightRatio: 1.2,
  labelGap: 6,
  /** Labels may overflow the plot's right edge by this much before flipping to the left. */
  edgeSlack: 4,
} as const;

const crisp = (value: number): number => Math.round(value - HALF_PIXEL) + HALF_PIXEL;

/** Legend keys may name a series or a whole color group. */
const isKey = (series: SeriesLayout, key: string): boolean => key === series.s.key || key === series.s.colorKey;

interface Run {
  estimated: boolean;
  pts: ScreenPoint[];
}

/** Split a line into contiguous runs, breaking at nulls and where the estimated state changes. */
export function segmentRuns(pts: ScreenPoint[]): Run[] {
  const runs: Run[] = [];
  let current: Run | null = null;
  for (let i = 1; i < pts.length; i++) {
    const previous = pts[i - 1];
    const point = pts[i];
    if (previous.y == null || point.y == null) {
      current = null;
      continue;
    }
    const estimated = previous.p.estimated || point.p.estimated;
    if (!current || current.estimated !== estimated) {
      current = { estimated, pts: [previous] };
      runs.push(current);
    }
    current.pts.push(point);
  }
  return runs;
}

function lastPoint(series: SeriesLayout): ScreenPoint | undefined {
  for (let i = series.pts.length - 1; i >= 0; i--) {
    if (series.pts[i].y != null) return series.pts[i];
  }
  return undefined;
}

function firstPoint(series: SeriesLayout): ScreenPoint | undefined {
  return series.pts.find((point) => point.y != null);
}

/** Everything needed to draw the marks of one panel. */
interface PanelContext {
  geometry: LineGeometry;
  panel: LinePanel;
  state: DrawState<LineHit>;
  env: Env;
  options: LineChartOptions;
}

/** Lines, areas, points, trendlines, annotations and direct labels. */
export function drawLineMarks(geometry: LineGeometry, state: DrawState<LineHit>, env: Env, options: LineChartOptions): SceneNode[] {
  return geometry.panels.map((panel) => {
    const context: PanelContext = { geometry, panel, state, env, options };
    return group(`p${panel.index}`, panelMarks(context), { x: panel.x, y: panel.y });
  });
}

function panelMarks(context: PanelContext): SceneNode[] {
  const { lineNodes, pointNodes } = seriesMarks(context);
  lineNodes.push(...trendlineMarks(context));
  return [revealGroup(context, [...lineNodes, ...pointNodes]), ...annotationMarks(context), ...directLabels(context)];
}

function seriesRank(series: SeriesLayout, state: DrawState<LineHit>): number {
  if (state.highlighted) return isKey(series, state.highlighted) ? RANK.emphasized : RANK.dimmed;
  if (state.emphasized) return isKey(series, state.emphasized) ? RANK.emphasized : RANK.normal;
  return RANK.normal;
}

/** Opacity multiplier for series that are not the emphasized one. */
function fadeFactor(series: SeriesLayout, state: DrawState<LineHit>, theme: Theme): number {
  const focus = state.emphasized;
  return focus && !isKey(series, focus) ? theme.fadeOpacity : 1;
}

function strokeWidthFor(series: SeriesLayout, state: DrawState<LineHit>, lineWidth: number): number {
  const hoverMode = state.hover?.mode ?? null;
  const focus = state.emphasized;
  if (hoverMode === 'point' && focus != null && isKey(series, focus)) return lineWidth + LINE.pointHoverWidthBoost;
  if (hoverMode === 'x') return lineWidth + LINE.xHoverWidthBoost;
  return lineWidth;
}

/** Areas and lines (in emphasis order) plus their point markers, kept separate so points draw on top. */
function seriesMarks(context: PanelContext): { lineNodes: SceneNode[]; pointNodes: SceneNode[] } {
  const { geometry, panel, state, env, options } = context;
  const { theme } = env;
  const curve: CurveFactory = options.curve === 'monotone' ? curveMonotoneX : curveLinear;
  const lineNodes: SceneNode[] = [];
  const pointNodes: SceneNode[] = [];
  const ordered = [...panel.series].sort((a, b) => seriesRank(a, state) - seriesRank(b, state));
  for (const series of ordered) {
    const grayed = state.highlighted != null && !isKey(series, state.highlighted);
    const color = grayed ? theme.faded : series.color;
    const enterOpacity = series.entering ? state.enter : 1;
    const opacity = enterOpacity * fadeFactor(series, state, theme);
    const width = strokeWidthFor(series, state, geometry.lineWidth);
    if (series.s.area && !grayed) {
      const area = areaMark(series, color, opacity, curve, panel.height, theme);
      if (area) lineNodes.push(area);
    }
    lineNodes.push(...lineMarks(series, color, width, opacity, curve));
    pointNodes.push(...pointMarks(context, series, color, opacity));
  }
  return { lineNodes, pointNodes };
}

/** Gradient-filled area from the line down to the plot bottom. */
function areaMark(series: SeriesLayout, color: string, opacity: number, curve: CurveFactory, plotHeight: number, theme: Theme): SceneNode | null {
  const defined = series.pts.filter((point) => point.y != null);
  if (!defined.length) return null;
  const peak = Math.min(...defined.map((point) => point.y!));
  const area = d3area<ScreenPoint>()
    .defined((point) => point.y != null)
    .x((point) => point.x)
    .y0(plotHeight)
    .y1((point) => point.y!)
    .curve(curve);
  return {
    type: 'path',
    key: `area-${series.s.id}`,
    d: area(series.pts) ?? '',
    style: {
      fill: {
        y1: peak,
        y2: plotHeight + AREA.gradientOverhang,
        stops: [
          { offset: 0, color, opacity: theme.areaOpacity * AREA.peakOpacityScale },
          { offset: 1, color, opacity: 0 },
        ],
      },
      opacity,
    },
  };
}

/** The solid part of a line and, separately, its dotted estimated part. */
function lineMarks(series: SeriesLayout, color: string, width: number, opacity: number, curve: CurveFactory): SceneNode[] {
  const key = series.s.id;
  const runs = segmentRuns(series.pts);
  const lineGenerator = d3line<ScreenPoint>()
    .x((point) => point.x)
    .y((point) => point.y!)
    .curve(curve);
  const pathFor = (estimated: boolean): string =>
    runs
      .filter((run) => run.estimated === estimated)
      .map((run) => lineGenerator(run.pts) ?? '')
      .join('');
  const solidPath = pathFor(false);
  const estimatedPath = pathFor(true);
  const baseStyle: Style = { stroke: color, strokeWidth: width, lineJoin: 'round', lineCap: 'round', opacity };
  const nodes: SceneNode[] = [];
  if (solidPath) {
    const lineCap = series.s.lineStyle === 'dashed' ? 'butt' : 'round';
    nodes.push({
      type: 'path',
      key: `line-${key}`,
      d: solidPath,
      style: { ...baseStyle, dash: dashFor(series.s.lineStyle, width), lineCap },
    });
  }
  if (estimatedPath) {
    nodes.push({ type: 'path', key: `est-${key}`, d: estimatedPath, style: { ...baseStyle, dash: dashFor('dotted', width) } });
  }
  return nodes;
}

/** Whether every point of a series gets a marker, not only isolated ones. */
function showsAllPoints(series: SeriesLayout, mode: 'auto' | 'all', panelWidth: number): boolean {
  if (mode === 'all') return true;
  const nonNull = series.pts.filter((point) => point.y != null);
  const spacing = nonNull.length > 1 ? panelWidth / (nonNull.length - 1) : Infinity;
  const hasGaps = series.pts.some((point) => point.y == null);
  return (spacing >= POINTS.minAutoSpacing || hasGaps) && nonNull.length <= POINTS.maxAutoCount;
}

/** Points: always for isolated values, all of them when sparse or requested. */
function pointMarks(context: PanelContext, series: SeriesLayout, color: string, opacity: number): SceneNode[] {
  const { options, panel, env } = context;
  const mode = options.points ?? 'auto';
  if (mode === 'none') return [];
  const showAll = showsAllPoints(series, mode, panel.width);
  const nodes: SceneNode[] = [];
  series.pts.forEach((point, i) => {
    if (point.y == null) return;
    const isolated = series.pts[i - 1]?.y == null && series.pts[i + 1]?.y == null;
    if (!showAll && !isolated && !options.shapes) return;
    const estimated = point.p.estimated;
    nodes.push({
      type: 'path',
      key: `pt-${series.s.id}-${point.p.index}`,
      d: shapePath(series.s.shape, env.sizes.pointRadius),
      x: point.x,
      y: point.y,
      style: {
        fill: estimated ? env.theme.background : color,
        stroke: estimated ? color : env.theme.background,
        strokeWidth: POINTS.strokeWidth,
        opacity,
      },
    });
  });
  return nodes;
}

/** Linear-regression trendlines across each series' defined points. */
function trendlineMarks(context: PanelContext): SceneNode[] {
  const { options, panel, state, env } = context;
  if (!options.trendline) return [];
  const trendOptions = typeof options.trendline === 'object' ? options.trendline : {};
  const trended = panel.series.filter((series) => !trendOptions.series || series.s.key === trendOptions.series);
  const nodes: SceneNode[] = [];
  for (const series of trended) {
    const points = series.pts.filter((point) => point.y != null).map((point) => ({ x: point.x, y: point.y! }));
    const fit = linearRegression(points);
    if (!fit) continue;
    const x1 = points[0].x;
    const x2 = points[points.length - 1].x;
    nodes.push({
      type: 'line',
      key: `trend-${series.s.id}`,
      x1,
      x2,
      y1: fit.intercept + fit.slope * x1,
      y2: fit.intercept + fit.slope * x2,
      style: { stroke: env.theme.reference, strokeWidth: TRENDLINE_STROKE_WIDTH, opacity: fadeFactor(series, state, env.theme) },
    });
  }
  return nodes;
}

/** The initial reveal wipes the lines in from the left. */
function revealGroup(context: PanelContext, children: SceneNode[]): SceneNode {
  const { geometry, panel, state, env } = context;
  const margin = geometry.lineWidth * 2 + env.sizes.pointRadius + REVEAL_CLIP.padding;
  const clip = {
    x: -margin,
    y: -margin - REVEAL_CLIP.topExtra,
    width: panel.width * state.reveal + 2 * margin,
    height: panel.height + 2 * margin + REVEAL_CLIP.topExtra,
  };
  return group('series', children, { clip });
}

/** Panel-local y of an annotation: its explicit value, or the anchored series' value at x. */
function annotationY(frame: CartesianFrame, panel: LinePanel, annotation: AnnotationOptions, xValue: number): number | null {
  if (annotation.y != null) return frame.y(annotation.y);
  const anchor = panel.series.find((series) => !annotation.series || series.s.key === annotation.series);
  return anchor?.pts.find((point) => point.p.x === xValue)?.y ?? null;
}

/** Stem, dot and text for each annotation that lands inside the panel. */
function annotationMarks(context: PanelContext): SceneNode[] {
  const { geometry, panel, env, options } = context;
  const { theme, sizes } = env;
  const frame = geometry.frame;
  const width = panel.width;
  const lineHeight = Math.round(sizes.axisFont * ANNOTATION.lineHeightRatio);
  const nodes: SceneNode[] = [];
  for (const [i, annotation] of (options.annotations ?? []).entries()) {
    const xValue = frame.xValue(annotation.x);
    if (xValue == null) continue;
    const pointY = annotationY(frame, panel, annotation, xValue);
    if (pointY == null) continue;
    const pointX = frame.xScale(xValue);
    if (pointX < -ANNOTATION.edgeSlack || pointX > width + ANNOTATION.edgeSlack) continue;
    const top = Math.max(lineHeight, pointY - ANNOTATION.stemHeight);
    const defaultSide = pointX > width * ANNOTATION.flipRatio ? 'left' : 'right';
    const side = annotation.side ?? defaultSide;
    const onRight = side === 'right';
    nodes.push(
      {
        type: 'line',
        key: `ann-line-${i}`,
        x1: crisp(pointX),
        x2: crisp(pointX),
        y1: top,
        y2: pointY - ANNOTATION.stemGap,
        style: { stroke: theme.text, strokeWidth: ANNOTATION.stemStrokeWidth },
      },
      {
        type: 'circle',
        key: `ann-dot-${i}`,
        cx: pointX,
        cy: pointY,
        r: ANNOTATION.dotRadius,
        style: { fill: theme.background, stroke: theme.text, strokeWidth: ANNOTATION.dotStrokeWidth },
      },
      {
        type: 'text',
        key: `ann-text-${i}`,
        x: onRight ? pointX + ANNOTATION.textOffset : pointX - ANNOTATION.textOffset,
        y: top,
        text: annotation.text,
        font: font(sizes.axisFont, BOLD),
        align: onRight ? 'start' : 'end',
        baseline: 'top',
        halo: theme.background,
        style: { fill: theme.text },
      },
    );
  }
  return nodes;
}

/** Direct labels, end markers and the trailing label. */
function directLabels(context: PanelContext): SceneNode[] {
  const marked = new Set<string>();
  const nodes = directLabelMarks(context, marked);
  nodes.push(...endMarkers(context, marked));
  const trailing = trailingLabel(context);
  if (trailing) nodes.push(trailing);
  return nodes;
}

interface DirectLabelEntry {
  series: SeriesLayout;
  point: ScreenPoint;
  text: string;
}

/** Series that get a label; with a separate color field, one per color group, preferring its solid line. */
function labelledSeries(panel: LinePanel, direct: ResolvedDirect, byColor: boolean): SeriesLayout[] {
  if (!byColor) return panel.series.filter((series) => direct.include(series.s.key));
  const byColorKey = new Map<string, SeriesLayout>();
  for (const series of panel.series) {
    if (!direct.include(series.s.colorKey) && !direct.include(series.s.key)) continue;
    const current = byColorKey.get(series.s.colorKey);
    if (!current || (current.s.lineStyle !== 'solid' && series.s.lineStyle === 'solid')) byColorKey.set(series.s.colorKey, series);
  }
  return Array.from(byColorKey.values());
}

function directLabelEntries(frame: CartesianFrame, labelled: SeriesLayout[], direct: ResolvedDirect, byColor: boolean): DirectLabelEntry[] {
  return labelled.flatMap((series) => {
    const point = direct.category === 'start' ? firstPoint(series) : lastPoint(series);
    if (!point) return [];
    const parts: string[] = [];
    if (direct.category) parts.push(byColor ? series.s.colorKey : series.s.key);
    if (direct.value && direct.category !== 'start') parts.push(frame.formatY(point.value, series.s.axis));
    return [{ series, point, text: parts.join(' ') }];
  });
}

/** Horizontal position and alignment of a direct label next to its point. */
function directLabelAnchor(direct: ResolvedDirect, outside: boolean, pointX: number, radius: number): { x: number; align: 'start' | 'end' } {
  if (direct.category === 'start') return { x: pointX - DIRECT_LABEL.gap, align: 'end' };
  if (outside) {
    const offset = direct.value ? radius + DIRECT_LABEL.markerGap : DIRECT_LABEL.gap;
    return { x: pointX + offset, align: 'start' };
  }
  const offset = direct.value ? radius : 0;
  return { x: pointX + offset, align: 'end' };
}

/** Series-name and value labels at the start or end of each line; adds marked series ids to `marked`. */
function directLabelMarks(context: PanelContext, marked: Set<string>): SceneNode[] {
  const { geometry, panel, state, env, options } = context;
  const { theme, sizes } = env;
  const frame = geometry.frame;
  const direct = resolveDirect(options);
  if (!direct.category && !direct.value) return [];
  const focus = state.emphasized;
  const labelOpacity = state.reveal >= 1 ? 1 : 0;
  const labelFont = font(sizes.labelFont, BOLD);
  const labelHeight = Math.round(sizes.labelFont * DIRECT_LABEL.lineHeightRatio);
  const radius = sizes.pointRadius;
  const endOutside = frame.yPosition === 'left' || !frame.showYAxis;
  const outside = direct.category === 'end' ? endOutside : direct.category === 'start';
  // When color and series differ (e.g. browser × year), label each color group once.
  const byColor = options.color != null && panel.series.some((series) => series.s.colorKey !== series.s.key);
  const entries = directLabelEntries(frame, labelledSeries(panel, direct, byColor), direct, byColor);

  const insideClearance = direct.value ? radius + DIRECT_LABEL.markerClearance : DIRECT_LABEL.lineClearance;
  const preferredY = (entry: DirectLabelEntry): number => (outside ? entry.point.y! : entry.point.y! - insideClearance - labelHeight / 2);
  const minY = outside || frame.trellis ? -labelHeight / 2 : -panel.y + DIRECT_LABEL.topInset;
  const bottomOverhang = outside ? labelHeight / 2 : 0;
  const positions = resolveVertical(
    entries.map((entry) => ({ id: entry.series.s.id, y: preferredY(entry), height: labelHeight })),
    minY,
    panel.height + bottomOverhang,
  );

  const nodes: SceneNode[] = [];
  for (const { series, point, text } of entries) {
    const id = series.s.id;
    const grayed = state.highlighted != null && !isKey(series, state.highlighted);
    const color = grayed ? theme.neutral : series.color;
    let opacity = labelOpacity * (series.entering ? state.enter : 1);
    if (focus && !isKey(series, focus)) opacity *= theme.fadeOpacity;
    if (direct.value) {
      marked.add(id);
      const strokeWidth = Math.max(DIRECT_LABEL.minMarkerStrokeWidth, geometry.lineWidth * DIRECT_LABEL.markerStrokeRatio);
      nodes.push({
        type: 'circle',
        key: `endmark-${id}`,
        cx: point.x,
        cy: point.y!,
        r: radius,
        style: { fill: theme.background, stroke: color, strokeWidth, opacity },
      });
    }
    const { x, align } = directLabelAnchor(direct, outside, point.x, radius);
    nodes.push({
      type: 'text',
      key: `dlabel-${id}`,
      x,
      y: positions.get(id) ?? point.y!,
      text,
      font: labelFont,
      align,
      baseline: 'middle',
      halo: theme.background,
      style: { fill: color, opacity },
    });
  }
  return nodes;
}

/** Hollow marker on the last point of each series that has no value-label marker. */
function endMarkers(context: PanelContext, marked: Set<string>): SceneNode[] {
  const { geometry, panel, env, options } = context;
  if (!options.endMarker) return [];
  const nodes: SceneNode[] = [];
  for (const series of panel.series) {
    const point = lastPoint(series);
    if (!point || marked.has(series.s.id)) continue;
    nodes.push({
      type: 'circle',
      key: `endmark-${series.s.id}`,
      cx: point.x,
      cy: point.y!,
      r: env.sizes.pointRadius - END_MARKER.radiusInset,
      style: { fill: env.theme.background, stroke: series.color, strokeWidth: Math.max(END_MARKER.minStrokeWidth, geometry.lineWidth) },
    });
  }
  return nodes;
}

/** Text to the right of the plot, clear of the end markers. */
function trailingLabel(context: PanelContext): SceneNode | null {
  const { geometry, panel, env, options } = context;
  if (!options.trailingLabel) return null;
  const { sizes } = env;
  const markerRoom = options.endMarker ? Math.ceil(sizes.pointRadius + geometry.lineWidth) : 0;
  return {
    type: 'text',
    key: 'trailing',
    x: panel.width + markerRoom + TRAILING_LABEL_GAP,
    y: panel.height / 2,
    text: options.trailingLabel,
    font: font(sizes.labelFont, BOLD),
    baseline: 'middle',
    style: { fill: env.theme.text },
  };
}

/** Crosshair and hover/selection markers. Redrawn on every hover change; nothing else is. */
export function drawLineOverlay(geometry: LineGeometry, state: DrawState<LineHit>, env: Env): SceneNode[] {
  const { theme, sizes } = env;
  return geometry.panels.map((panel) => {
    const nodes: SceneNode[] = [];
    const hover = state.hover;
    if (hover) {
      const crosshairX = crisp(hover.primary.pt.x);
      nodes.push({
        type: 'line',
        key: 'crosshair',
        x1: crosshairX,
        x2: crosshairX,
        y1: 0,
        y2: panel.height,
        style: { stroke: theme.crosshair, strokeWidth: CROSSHAIR_STROKE_WIDTH },
      });
      nodes.push(...markers(hoveredHits(geometry, panel, hover), 'hover', theme, sizes, geometry, state.hoverLabels, panel.width));
    }
    const selected = state.selected.filter((hit) => hit.panel.index === panel.index);
    nodes.push(...markers(selected, 'sel', theme, sizes, geometry, true, panel.width));
    return group(`p${panel.index}`, nodes, { x: panel.x, y: panel.y });
  });
}

/** Hovered points in a panel: the whole x column in x mode or trellis, otherwise the hover's own items. */
function hoveredHits(geometry: LineGeometry, panel: LinePanel, hover: Hover<LineHit>): LineHit[] {
  const ownItems = (): LineHit[] => hover.items.filter((hit) => hit.panel.index === panel.index);
  if (hover.mode !== 'x' && !geometry.frame.trellis) return ownItems();
  const column = itemsAt(panel, hover.primary.pt.x);
  if (hover.mode === 'point' && !column.length) return ownItems();
  return column;
}

function hoverValueText(geometry: LineGeometry, hit: LineHit): string {
  const value = geometry.frame.formatY(hit.pt.value, hit.series.s.axis);
  return hit.pt.p.estimated ? `${value} (estimated)` : value;
}

function markers(hits: LineHit[], prefix: string, theme: Theme, sizes: SizeTokens, geometry: LineGeometry, labels: boolean, panelWidth: number): SceneNode[] {
  const nodes: SceneNode[] = [];
  const valueFontSize = sizes.labelFont - HOVER_MARKER.fontSizeReduction;
  const valueFont = font(valueFontSize, BOLD);
  const lineHeight = Math.round(valueFontSize * HOVER_MARKER.lineHeightRatio);
  const radius = sizes.pointRadius + HOVER_MARKER.radiusBoost;
  const texts = hits.map((hit) => hoverValueText(geometry, hit));
  const positions = resolveVertical(
    hits.map((hit, i) => ({ id: String(i), y: hit.pt.y!, height: lineHeight })),
    -lineHeight,
    geometry.frame.plotHeight + lineHeight,
  );
  hits.forEach((hit, i) => {
    const key = `${prefix}-${hit.series.s.id}-${hit.pt.p.index}`;
    const { x, y } = hit.pt;
    nodes.push({
      type: 'circle',
      key: `${key}-dot`,
      cx: x,
      cy: y!,
      r: radius,
      style: { fill: hit.series.color, stroke: theme.background, strokeWidth: HOVER_MARKER.strokeWidth },
    });
    if (!labels) return;
    const textWidth = measureText(texts[i], valueFont);
    const flip = x + radius + HOVER_MARKER.labelGap + textWidth > panelWidth + HOVER_MARKER.edgeSlack;
    nodes.push({
      type: 'text',
      key: `${key}-label`,
      x: flip ? x - radius - HOVER_MARKER.labelGap : x + radius + HOVER_MARKER.labelGap,
      y: positions.get(String(i)) ?? y!,
      text: texts[i],
      font: valueFont,
      align: flip ? 'end' : 'start',
      baseline: 'middle',
      halo: theme.background,
      style: { fill: hit.series.color },
    });
  });
  return nodes;
}
