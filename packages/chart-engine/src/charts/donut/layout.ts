import { DONUT } from '../../core/assumptions.js';
import type { Env, LayoutInput } from '../../core/module.js';
import { font } from '../../core/theme.js';
import { compactFormatter } from '../../util/format.js';
import { measureText, truncate } from '../../util/text.js';
import { layoutLabels, labelStyle, type DirectLabel } from './labels.js';
import type { DonutModel, Pie, Segment } from './model.js';
import type { DonutCenterOptions, DonutChartOptions } from './types.js';

export interface ArcLayout {
  key: string;
  category: string;
  value: number;
  /** Share of the visible total, 0–1. */
  percent: number;
  /** Angles in radians, clockwise from 12 options'clock. Equal when the segment is hidden. */
  start: number;
  end: number;
  color: string;
  segment: Segment;
  pie: PieLayout;
}

export interface CenterLine {
  text: string;
  size: number;
  weight: number;
  color: 'text' | 'positive' | 'negative' | 'neutral';
  y: number;
}

export interface BenchmarkLayout {
  angle: number;
  label: string | null;
  value: string | null;
}

export interface PieLayout {
  index: number;
  facet: string | null;
  cx: number;
  cy: number;
  inner: number;
  outer: number;
  total: number;
  arcs: ArcLayout[];
  center: CenterLine[];
  benchmark: BenchmarkLayout | null;
  labels: DirectLabel[];
  /** Facet name under the donut, and the y of the per-facet hover value above it. */
  facetLabel: { text: string; x: number; y: number } | null;
  hoverY: number;
  /** Cell bounds, used for navigation. */
  cell: { x: number; y: number; width: number; height: number };
}

export interface DonutGeometry {
  pies: PieLayout[];
  semicircle: boolean;
  /** First angle of the sweep (reveal grows from here). */
  base: number;
  sweep: number;
  colorOf: (category: string) => string;
  formatValue: (value: number) => string;
  formatPercent: (share: number) => string;
  /** Direct labels are drawn, so hover only fades. */
  labelled: boolean;
  trellis: boolean;
}

export type DonutSnapshot = Map<string, { start: number; end: number }>;

const DEFAULT_PERCENT_FORMAT = '.1%';
const COMPACT_VALUE_DECIMALS = 1;
const FULL_TURN = Math.PI * 2;
/** Spans within this of a full turn are drawn as complete rings. */
const FULL_RING_TOLERANCE = 1e-6;
/** Decimal places kept in ring path coordinates. */
const RING_PATH_PRECISION = 2;
/** Bounding boxes sample a full turn at this many angles. */
const BOUNDS_SAMPLES_PER_TURN = 32;
const MIN_BOUNDS_SAMPLES = 2;
/** Hover labels get side room only when the ring keeps at least this share of its unconstrained size. */
const HOVER_ROOM_MIN_SHARE = 0.75;
/** Extra vertical room reserved around a benchmark label. */
const BENCHMARK_PADDING = 6;
/** Lightweight labels whose angle has |cos| above this sit above or below the ring. */
const VERTICAL_LABEL_COS = 0.5;
/** Effectively unbounded area used when measuring labels before the donut is sized. */
const PROBE_EXTENT = 1e6;
const CENTER_LINE_HEIGHT_RATIO = 1.15;
const CENTER_WEIGHT = { value: 800, label: 700, delta: 400 } as const;
const FACET_LABEL_WEIGHT = 700;
const HOVER_LABEL_WEIGHT = 700;

type Sides = { left: number; right: number; top: number; bottom: number };
type Rect = { x: number; y: number; width: number; height: number };

const NO_SIDES: Sides = { left: 0, right: 0, top: 0, bottom: 0 };

export function formattersFor(options: DonutChartOptions, env: Env): Pick<DonutGeometry, 'formatValue' | 'formatPercent'> {
  return {
    formatValue: options.valueFormat ? env.f.number(options.valueFormat) : compactFormatter(env.f, COMPACT_VALUE_DECIMALS),
    formatPercent: env.f.number(options.percentFormat ?? DEFAULT_PERCENT_FORMAT),
  };
}

export function colorOfFor(model: DonutModel, options: DonutChartOptions, env: Env): (category: string) => string {
  return (category) => {
    if (options.colors?.[category]) return options.colors[category];
    if (model.binary && category === model.binary.secondary) return env.theme.secondary;
    const paletteIndex = Math.max(0, model.categories.indexOf(category));
    return env.palette[paletteIndex % env.palette.length];
  };
}

/** Ring thickness for a diameter, interpolated from the size table. */
export function thicknessFor(diameter: number): number {
  const table = DONUT.thickness;
  const [smallestDiameter, smallestWidth] = table[0];
  if (diameter <= smallestDiameter) return (smallestWidth * diameter) / smallestDiameter;
  for (let i = 1; i < table.length; i++) {
    const [upperDiameter, upperWidth] = table[i];
    const [lowerDiameter, lowerWidth] = table[i - 1];
    if (diameter <= upperDiameter) {
      return lowerWidth + ((upperWidth - lowerWidth) * (diameter - lowerDiameter)) / (upperDiameter - lowerDiameter);
    }
  }
  const [largestDiameter, largestWidth] = table[table.length - 1];
  return (largestWidth * diameter) / largestDiameter;
}

/** Center typography row for a diameter: [value, label, delta] font sizes (0 = hidden). */
export function centerFontsFor(diameter: number): [number, number, number] {
  let row = DONUT.center[0];
  for (const candidate of DONUT.center) if (diameter >= candidate[0]) row = candidate;
  return [row[1], row[2], row[3]];
}

/** Benchmark as a 0–1 share. */
export function benchmarkShare(value: number): number {
  return value > 1 ? value / 100 : value;
}

function sentimentColor(options: DonutChartOptions, model: DonutModel, env: Env, primaryShare: number): string | null {
  if (!model.binary || !options.benchmark || options.benchmark.sentiment === false) return null;
  const benchmark = benchmarkShare(options.benchmark.value);
  return primaryShare >= benchmark ? env.theme.positive : env.theme.negative;
}

/** Shared sizing for every cell of the grid. */
interface Grid {
  columns: number;
  cellWidth: number;
  cellHeight: number;
  gap: number;
  /** Room for the facet name under each donut. */
  facetHeight: number;
  /** Room for the per-facet hover value above each donut. */
  hoverHeight: number;
}

function gridFor(pieCount: number, options: DonutChartOptions, width: number, height: number, trellis: boolean): Grid {
  const defaultColumns = Math.ceil(Math.sqrt(pieCount));
  const columns = Math.max(1, Math.min(pieCount, options.facetColumns ?? defaultColumns));
  const rows = Math.ceil(pieCount / columns);
  const gap = DONUT.trellisGap;
  return {
    columns,
    cellWidth: (width - gap * (columns - 1)) / columns,
    cellHeight: (height - gap * (rows - 1)) / rows,
    gap,
    facetHeight: trellis ? DONUT.facetFont + DONUT.facetGap : 0,
    hoverHeight: trellis ? DONUT.hoverLabelFont + DONUT.facetGap : 0,
  };
}

function cellAt(index: number, grid: Grid): Rect {
  const column = index % grid.columns;
  const row = Math.floor(index / grid.columns);
  return {
    x: column * (grid.cellWidth + grid.gap),
    y: row * (grid.cellHeight + grid.gap),
    width: grid.cellWidth,
    height: grid.cellHeight,
  };
}

function emptyPie(index: number, facet: string | null, total: number, cell: Rect): PieLayout {
  return {
    index,
    facet,
    cx: 0,
    cy: 0,
    inner: 0,
    outer: 0,
    total,
    arcs: [],
    center: [],
    benchmark: null,
    labels: [],
    facetLabel: null,
    hoverY: 0,
    cell,
  };
}

/** Lay segments end to end from the sweep start; hidden segments collapse to zero width. */
function addArcs(layout: PieLayout, pie: Pie, hidden: ReadonlySet<string>, geometry: DonutGeometry): void {
  let angle = geometry.base;
  for (const segment of pie.segments) {
    const isOn = !hidden.has(segment.category) && layout.total > 0;
    const span = isOn ? (segment.value / layout.total) * geometry.sweep : 0;
    layout.arcs.push({
      key: `${layout.index}:${segment.category}`,
      category: segment.category,
      value: segment.value,
      percent: isOn ? segment.value / layout.total : 0,
      start: angle,
      end: angle + span,
      color: geometry.colorOf(segment.category),
      segment,
      pie: layout,
    });
    angle += span;
  }
}

/** Interpolate angles from the previous snapshot; new segments grow from their start. */
function tweenArcs(arcs: ArcLayout[], from: DonutSnapshot, progress: number): void {
  for (const arc of arcs) {
    const previous = from.get(arc.key) ?? { start: arc.start, end: arc.start };
    arc.start = previous.start + (arc.start - previous.start) * progress;
    arc.end = previous.end + (arc.end - previous.end) * progress;
  }
}

/** Binary donuts color the primary segment by facet or by sentiment against the benchmark. */
function colorBinaryPrimary(layout: PieLayout, model: DonutModel, options: DonutChartOptions, env: Env, trellis: boolean): void {
  const binary = model.binary!;
  const primary = layout.arcs.find((arc) => arc.category === binary.primary);
  let color: string | null;
  if (options.colorByFacet && trellis) color = env.palette[layout.index % env.palette.length];
  else color = sentimentColor(options, model, env, primary?.percent ?? 0);
  if (primary && color && !options.colors?.[primary.category]) primary.color = color;
}

/** Room kept beside the ring for direct labels, or for hover labels when it costs little. */
function sideRoom(layout: PieLayout, options: DonutChartOptions, geometry: DonutGeometry, grid: Grid, availableHeight: number, hasLabels: boolean): Sides {
  if (hasLabels) return measureSides(layout, options, geometry);
  if (options.tooltip || geometry.trellis) return NO_SIDES;
  const hoverWidth = hoverLabelWidth(geometry, layout) + DONUT.labelOffset;
  const remainingWidth = grid.cellWidth - 2 * hoverWidth;
  const minimumWidth = Math.min(grid.cellWidth, availableHeight) * HOVER_ROOM_MIN_SHARE;
  if (remainingWidth >= minimumWidth) return { left: hoverWidth, right: hoverWidth, top: 0, bottom: 0 };
  return NO_SIDES;
}

function benchmarkHeight(options: DonutChartOptions, model: DonutModel): number {
  if (!options.benchmark || !model.binary) return 0;
  return DONUT.benchmarkFont * 2 + DONUT.benchmarkOvershoot + DONUT.benchmarkArrow + BENCHMARK_PADDING;
}

function diameterFor(availableWidth: number, availableHeight: number, sides: Sides, benchHeight: number, options: DonutChartOptions, semicircle: boolean): number {
  const labelHeight = sides.top + sides.bottom;
  let diameter: number;
  if (semicircle) diameter = Math.min(availableWidth, (availableHeight - benchHeight - sides.top) * 2);
  else diameter = Math.min(availableWidth, availableHeight - Math.max(benchHeight * 2, labelHeight));
  return Math.max(0, Math.min(diameter, options.maxDiameter ?? Infinity));
}

/** Size the ring and centre it (with its side labels) in the cell. */
function placeRing(layout: PieLayout, sides: Sides, availableHeight: number, grid: Grid, model: DonutModel, options: DonutChartOptions, semicircle: boolean): void {
  const cell = layout.cell;
  const availableWidth = grid.cellWidth - sides.left - sides.right;
  const diameter = diameterFor(availableWidth, availableHeight, sides, benchmarkHeight(options, model), options, semicircle);
  const outer = diameter / 2;
  const thickness = Math.min(outer, options.thickness ?? thicknessFor(diameter));
  layout.outer = outer;
  layout.inner = Math.max(0, outer - thickness);
  const blockWidth = sides.left + diameter + sides.right;
  layout.cx = cell.x + (grid.cellWidth - blockWidth) / 2 + sides.left + outer;
  const ringHeight = semicircle ? outer : diameter;
  const top = cell.y + grid.hoverHeight + (availableHeight - ringHeight - sides.top - sides.bottom) / 2 + sides.top;
  layout.cy = top + outer;
  layout.hoverY = top - DONUT.facetGap;
}

function facetLabelFor(layout: PieLayout, facet: string, cellWidth: number, semicircle: boolean): PieLayout['facetLabel'] {
  const ringBottom = semicircle ? layout.cy : layout.cy + layout.outer;
  return {
    text: truncate(facet, font(DONUT.facetFont, FACET_LABEL_WEIGHT), cellWidth),
    x: layout.cx,
    y: ringBottom + DONUT.facetGap + DONUT.facetFont / 2,
  };
}

function benchmarkFor(options: DonutChartOptions, geometry: DonutGeometry): BenchmarkLayout {
  const benchmark = options.benchmark!;
  const share = benchmarkShare(benchmark.value);
  const showValue = benchmark.showValue ?? !!benchmark.label;
  const clampedShare = Math.max(0, Math.min(1, share));
  return {
    angle: geometry.base + clampedShare * geometry.sweep,
    label: benchmark.label ?? null,
    value: showValue || !benchmark.label ? geometry.formatPercent(share) : null,
  };
}

/** Angles, colors, size, position, center text, benchmark and labels of one donut. */
function layoutPie(
  pie: Pie,
  index: number,
  input: LayoutInput<DonutChartOptions, DonutModel, DonutSnapshot>,
  geometry: DonutGeometry,
  grid: Grid,
  hasLabels: boolean,
): PieLayout {
  const { model, options, env, hidden, tween } = input;
  const { trellis, semicircle } = geometry;
  const cell = cellAt(index, grid);
  const visible = pie.segments.filter((segment) => !hidden.has(segment.category));
  const total = visible.reduce((sum, segment) => sum + segment.value, 0);
  const layout = emptyPie(index, pie.facet, total, cell);
  addArcs(layout, pie, hidden, geometry);
  if (tween) tweenArcs(layout.arcs, tween.from, tween.t);
  if (model.binary) colorBinaryPrimary(layout, model, options, env, trellis);

  // Size: leave room for direct labels at the sides, facet names below and hover values above.
  const availableHeight = grid.cellHeight - grid.facetHeight - grid.hoverHeight;
  const sides = sideRoom(layout, options, geometry, grid, availableHeight, hasLabels);
  placeRing(layout, sides, availableHeight, grid, model, options, semicircle);
  if (trellis && pie.facet != null) layout.facetLabel = facetLabelFor(layout, pie.facet, grid.cellWidth, semicircle);

  layout.center = centerLines(layout, options, model, geometry, semicircle);
  if (options.benchmark && model.binary) layout.benchmark = benchmarkFor(options, geometry);
  if (hasLabels) layout.labels = layoutLabels(layout, options, geometry, cell);
  return layout;
}

/** Place the donuts in a grid of cells, size them, and compute segment angles, center text and labels. */
export function layoutDonut(input: LayoutInput<DonutChartOptions, DonutModel, DonutSnapshot>): DonutGeometry {
  const { model, options, env, width, height } = input;
  const semicircle = options.variant === 'semicircle';
  const base = semicircle ? -Math.PI / 2 : 0;
  const sweep = semicircle ? Math.PI : FULL_TURN;
  const trellis = model.pies.length > 1;
  const style = labelStyle(options);
  const geometry: DonutGeometry = {
    pies: [],
    semicircle,
    base,
    sweep,
    colorOf: colorOfFor(model, options, env),
    ...formattersFor(options, env),
    labelled: !!style,
    trellis,
  };
  if (!model.pies.length || width <= 0 || height <= 0) return geometry;

  const grid = gridFor(model.pies.length, options, width, height, trellis);
  model.pies.forEach((pie, index) => {
    geometry.pies.push(layoutPie(pie, index, input, geometry, grid, !!style));
  });
  return geometry;
}

/** Room each side of the ring needs for direct labels, measured with provisional angles on a unit ring. */
function measureSides(layout: PieLayout, options: DonutChartOptions, geometry: DonutGeometry): Sides {
  const unitRing = { ...layout, cx: 0, cy: 0, outer: 1, inner: 0 };
  const unbounded = { x: -PROBE_EXTENT, y: -PROBE_EXTENT, width: 2 * PROBE_EXTENT, height: 2 * PROBE_EXTENT };
  const probe = layoutLabels(unitRing, options, geometry, unbounded);
  let left = 0;
  let right = 0;
  let top = 0;
  let bottom = 0;
  for (const label of probe) {
    const need = label.width + label.offset;
    if (label.side === 'left') left = Math.max(left, need);
    else right = Math.max(right, need);
    // Lightweight labels near 12 or 6 options'clock sit above or below the ring.
    if (label.style === 'lightweight') {
      const arc = layout.arcs.find((candidate) => candidate.key === label.key)!;
      const cos = Math.cos((arc.start + arc.end) / 2);
      if (cos > VERTICAL_LABEL_COS) top = Math.max(top, label.height * cos);
      if (cos < -VERTICAL_LABEL_COS) bottom = Math.max(bottom, -label.height * cos);
    }
  }
  return { left, right, top, bottom };
}

/** The large center value for the configured mode, or null when there is none. */
function centerValue(layout: PieLayout, center: DonutCenterOptions, model: DonutModel, geometry: DonutGeometry): string | null {
  const defaultMode = model.binary || model.pies.length > 1 ? 'primary' : 'total';
  const mode = center.value ?? defaultMode;
  if (mode === 'total') return geometry.formatValue(layout.total);
  if (mode === 'primary') {
    const first = layout.arcs.find((arc) => arc.end > arc.start);
    return first ? geometry.formatPercent(first.percent) : null;
  }
  if (typeof mode === 'number') return geometry.formatValue(mode);
  if (typeof mode === 'string') return mode;
  return null;
}

function centerLineHeight(size: number): number {
  return size * CENTER_LINE_HEIGHT_RATIO;
}

function centerLines(layout: PieLayout, options: DonutChartOptions, model: DonutModel, geometry: DonutGeometry, semicircle: boolean): CenterLine[] {
  if (options.center === false || layout.inner <= 0) return [];
  const center = options.center ?? {};
  const [valueSize, labelSize, deltaSize] = centerFontsFor(layout.outer * 2);
  const value = centerValue(layout, center, model, geometry);
  const maxWidth = layout.inner * 2 * DONUT.centerTextShare;
  const fit = (text: string, size: number, weight: number) => truncate(text, font(size, weight), maxWidth);

  const lines: Omit<CenterLine, 'y'>[] = [];
  if (value && valueSize) {
    lines.push({ text: fit(value, valueSize, CENTER_WEIGHT.value), size: valueSize, weight: CENTER_WEIGHT.value, color: 'text' });
  }
  if (center.label && labelSize) {
    lines.push({ text: fit(center.label, labelSize, CENTER_WEIGHT.label), size: labelSize, weight: CENTER_WEIGHT.label, color: 'text' });
  }
  if (center.delta && deltaSize) {
    const color = center.delta.sentiment ?? 'neutral';
    lines.push({ text: fit(center.delta.text, deltaSize, CENTER_WEIGHT.delta), size: deltaSize, weight: CENTER_WEIGHT.delta, color });
  }
  const blockHeight = lines.reduce((sum, line) => sum + centerLineHeight(line.size), 0);
  // Semicircles stack the text upwards from the baseline.
  let y = semicircle ? layout.cy - blockHeight : layout.cy - blockHeight / 2;
  return lines
    .filter((line) => line.text)
    .map((line) => {
      const placed = { ...line, y: y + centerLineHeight(line.size) / 2 };
      y += centerLineHeight(line.size);
      return placed;
    });
}

export function snapshotDonut(geometry: DonutGeometry): DonutSnapshot {
  const snapshot: DonutSnapshot = new Map();
  for (const pie of geometry.pies) for (const arc of pie.arcs) snapshot.set(arc.key, { start: arc.start, end: arc.end });
  return snapshot;
}

/** Point on a circle at an angle measured clockwise from 12 options'clock. */
export function polar(cx: number, cy: number, radius: number, angle: number): [number, number] {
  return [cx + radius * Math.sin(angle), cy - radius * Math.cos(angle)];
}

/** Closed circle drawn as two half arcs starting at 12 options'clock. */
function circlePath(cx: number, cy: number, radius: number, sweepFlag: 0 | 1): string {
  return `M${cx},${cy - radius}A${radius},${radius} 0 1 ${sweepFlag} ${cx},${cy + radius}A${radius},${radius} 0 1 ${sweepFlag} ${cx},${cy - radius}Z`;
}

function roundCoordinate(value: number): number {
  return +value.toFixed(RING_PATH_PRECISION);
}

/** Ring segment outline in absolute coordinates (used for focus rings and selection outlines). */
export function ringPath(cx: number, cy: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number): string {
  const span = endAngle - startAngle;
  if (span >= FULL_TURN - FULL_RING_TOLERANCE) {
    const hole = innerRadius > 0 ? circlePath(cx, cy, innerRadius, 0) : '';
    return circlePath(cx, cy, outerRadius, 1) + hole;
  }
  const largeArc = span > Math.PI ? 1 : 0;
  const [outerStartX, outerStartY] = polar(cx, cy, outerRadius, startAngle);
  const [outerEndX, outerEndY] = polar(cx, cy, outerRadius, endAngle);
  const [innerEndX, innerEndY] = polar(cx, cy, innerRadius, endAngle);
  const [innerStartX, innerStartY] = polar(cx, cy, innerRadius, startAngle);
  const round = roundCoordinate;
  const outerArc = `M${round(outerStartX)},${round(outerStartY)}A${outerRadius},${outerRadius} 0 ${largeArc} 1 ${round(outerEndX)},${round(outerEndY)}`;
  if (innerRadius > 0) return outerArc + `L${round(innerEndX)},${round(innerEndY)}A${innerRadius},${innerRadius} 0 ${largeArc} 0 ${round(innerStartX)},${round(innerStartY)}Z`;
  return outerArc + `L${cx},${cy}Z`;
}

/** Bounding box of a ring segment. */
export function arcBounds(cx: number, cy: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) {
  const xs: number[] = [];
  const ys: number[] = [];
  const steps = Math.max(MIN_BOUNDS_SAMPLES, Math.ceil(((endAngle - startAngle) / FULL_TURN) * BOUNDS_SAMPLES_PER_TURN));
  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + ((endAngle - startAngle) * i) / steps;
    for (const radius of [innerRadius, outerRadius]) {
      const [x, y] = polar(cx, cy, radius, angle);
      xs.push(x);
      ys.push(y);
    }
  }
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

/** Width of the widest lightweight hover label; used to keep hover labels inside the chart. */
export function hoverLabelWidth(geometry: DonutGeometry, pie: PieLayout): number {
  let widest = 0;
  for (const arc of pie.arcs) {
    const nameWidth = measureText(arc.category, font(DONUT.labelNameFont));
    const valueWidth = measureText(geometry.formatPercent(arc.percent), font(DONUT.hoverLabelFont, HOVER_LABEL_WEIGHT));
    widest = Math.max(widest, nameWidth, valueWidth);
  }
  return widest;
}
