import { extent } from 'd3-array';
import { interpolateNumber } from 'd3-interpolate';
import { scaleLinear, scaleTime, type ScaleLinear } from 'd3-scale';
import { measureText } from '../../util/text.js';
import { parseDate, toNumber } from '../../util/data.js';
import { compactFormatter, inferGrain, numberFormatter, timeFormatsForGrain, type Formatters } from '../../util/format.js';
import type { Env } from '../module.js';
import { font } from '../theme.js';
import type { AxisOptions, CartesianOptions, ScaleType, XValue } from '../types.js';
import { autoNumberFormat, bandTicks, linearXTicks, timeTicks, yTicks, type Tick } from './ticks.js';

/** What a chart type tells the shell about the axes it needs. */
export interface CartesianSpec {
  xType: ScaleType;
  categories: string[];
  /** Numeric x positions of all visible data (time as ms, band as index). */
  xs: number[];
  yValues: number[];
  /** Values on the secondary axis, or null when there is none. */
  y2Values: number[] | null;
  facets: string[];
  trellis: boolean;
  /** Extra room the chart type needs around the plot (direct labels, end markers). */
  margin: { top: number; right: number; left: number };
}

export interface PanelFrame {
  facet: string;
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  showXLabels: boolean;
  showYLabels: boolean;
}

export interface CartesianFrame {
  panels: PanelFrame[];
  plotWidth: number;
  plotHeight: number;
  trellis: boolean;
  xType: ScaleType;
  xScale: (v: number) => number;
  xInvert: (px: number) => number;
  y: ScaleLinear<number, number>;
  y2: ScaleLinear<number, number> | null;
  xTicks: Tick[];
  yTicks: Tick[];
  y2Ticks: Tick[];
  yPosition: 'left' | 'right';
  formatX: (v: XValue) => string;
  formatY: (v: number | null, axis?: 'y' | 'y2') => string;
  /** Raw x value → numeric position. */
  xValue: (v: XValue) => number | null;
  axisFont: string;
  facetTitleHeight: number;
  /** Displayed (possibly mid-tween) domains, used as the start of the next tween. */
  xDomain: [number, number];
  yDomain: [number, number];
  y2Domain: [number, number] | null;
  showXAxis: boolean;
  showYAxis: boolean;
}

export interface DomainTween {
  t: number;
  xDomain: [number, number];
  yDomain: [number, number];
  y2Domain: [number, number] | null;
}

/** Length of an x-axis tick mark. */
export const TICK = 6;
/** Space between tick labels and the plot, and between labels and an axis title. */
const LABEL_GAP = 8;
/** Space between the end of a tick mark and its label. */
const TICK_LABEL_GAP = 4;
/** Axis label line height as a multiple of the font size. */
const LINE_HEIGHT_RATIO = 1.3;
const FACET_TITLE_LINE_HEIGHT_RATIO = 1.4;
const FACET_TITLE_PADDING = 6;
const MIN_PLOT_SIZE = 10;
const ONE_DAY_MS = 864e5;
/** Padding around a single-valued y domain, as a fraction of the value. */
const FLAT_Y_DOMAIN_PAD_RATIO = 0.1;
/** Padding above and below the data in minimal charts, as a fraction of the domain. */
const MINIMAL_Y_PAD_RATIO = 0.08;
const NICE_Y_TICK_COUNT = 6;
/** Rough spacing between linear x ticks, used to pick ticks for the label format. */
const LINEAR_X_TICK_SPACING = 80;
const MIN_LINEAR_X_TICK_COUNT = 2;
const TRELLIS_COLUMN_GAP = 24;
const TRELLIS_ROW_GAP_WITH_X_AXIS = 12;
const TRELLIS_ROW_GAP_WITHOUT_X_AXIS = 16;
/** Minimum chart widths for the default number of trellis columns. */
const TRELLIS_COLUMN_BREAKPOINTS = [
  { minWidth: 900, columns: 3 },
  { minWidth: 480, columns: 2 },
] as const;

type Domain = [number, number];

interface XAxisContext {
  spec: CartesianSpec;
  options: CartesianOptions;
  formatters: Formatters;
  xDomain: Domain;
  showXAxis: boolean;
  showTimeSuperLabels: boolean;
  axisFont: string;
  columns: number;
  columnGap: number;
  width: number;
}

interface XAxis {
  plotWidth: number;
  xScale: (v: number) => number;
  xInvert: (px: number) => number;
  xTicks: Tick[];
}

/** Line height of axis labels for a font size. */
export function axisLineHeight(fontSize: number): number {
  return Math.round(fontSize * LINE_HEIGHT_RATIO);
}

/** Which side the y axis is on and whether the axes are shown. */
export function axisSides(options: CartesianOptions, trellis: boolean): { yPosition: 'left' | 'right'; showXAxis: boolean; showYAxis: boolean } {
  const defaultPosition = trellis ? 'left' : 'right';
  return {
    yPosition: options.yAxis?.position ?? defaultPosition,
    showXAxis: !options.minimal && !options.xAxis?.hidden,
    showYAxis: !options.minimal && !options.yAxis?.hidden,
  };
}

export function makeNumberFormat(
  formatters: Formatters,
  spec: AxisOptions['format'],
  ticks: number[],
  extraPrecision = 0,
): (n: number) => string {
  if (spec === 'compact' || spec === '$compact') {
    const prefix = spec === '$compact' ? '$' : '';
    if (extraPrecision === 0) return autoNumberFormat(ticks, formatters, prefix);
    return compactFormatter(formatters, 1, prefix);
  }
  const fallback = extraPrecision ? compactFormatter(formatters, 1) : autoNumberFormat(ticks, formatters);
  return numberFormatter(formatters, spec, fallback);
}

function lerpDomain(from: Domain | null | undefined, to: Domain, progress: number): Domain {
  if (!from || progress >= 1) return to;
  return [interpolateNumber(from[0], to[0])(progress), interpolateNumber(from[1], to[1])(progress)];
}

export function xPosition(v: unknown, xType: ScaleType, categories: string[]): number | null {
  if (v == null) return null;
  if (xType === 'time') {
    const date = parseDate(v);
    return date ? +date : null;
  }
  if (xType === 'linear') return toNumber(v);
  const index = categories.indexOf(String(v));
  return index < 0 ? null : index;
}

/** Target x domain: data extent, overridden by the axis domain and widened if empty. */
function targetXDomain(spec: CartesianSpec, options: CartesianOptions): Domain {
  let domain: Domain;
  if (spec.xType === 'band') domain = [0, Math.max(0, spec.categories.length - 1)];
  else {
    const [min, max] = extent(spec.xs);
    domain = min == null || max == null ? [0, 1] : [min, max];
  }
  const requested = options.xAxis?.domain;
  if (requested && spec.xType !== 'band') {
    const start = requested[0] == null ? null : xPosition(requested[0], spec.xType, spec.categories);
    const end = requested[1] == null ? null : xPosition(requested[1], spec.xType, spec.categories);
    domain = [start ?? domain[0], end ?? domain[1]];
  }
  if (domain[0] === domain[1]) {
    const pad = spec.xType === 'time' ? ONE_DAY_MS : 1;
    domain = [domain[0] - pad, domain[1] + pad];
  }
  return domain;
}

/** Target domain of a y axis: data plus reference lines, zero, padding and nicing. */
function targetYDomain(spec: CartesianSpec, options: CartesianOptions, axis: 'y' | 'y2'): Domain {
  const minimal = !!options.minimal;
  const axisOptions = axis === 'y' ? options.yAxis : options.y2Axis;
  const values = axis === 'y' ? [...spec.yValues] : [...(spec.y2Values ?? [])];
  for (const referenceLine of options.referenceLines ?? []) {
    if ((referenceLine.axis ?? 'y') === axis) {
      const value = toNumber(referenceLine.value);
      if (value != null) values.push(value);
    }
  }
  let low = values.length ? Math.min(...values) : 0;
  let high = values.length ? Math.max(...values) : 1;
  if (axisOptions?.zero ?? !minimal) {
    low = Math.min(low, 0);
    high = Math.max(high, 0);
  }
  if (low === high) {
    const pad = Math.abs(low) * FLAT_Y_DOMAIN_PAD_RATIO || 1;
    low -= pad;
    high += pad;
  }
  const requested = axisOptions?.domain;
  if (requested) {
    low = requested[0] == null ? low : Number(requested[0]);
    high = requested[1] == null ? high : Number(requested[1]);
  }
  if (minimal && !requested) {
    const pad = (high - low) * MINIMAL_Y_PAD_RATIO;
    const lowPad = axisOptions?.zero ? 0 : pad;
    return [low - lowPad, high + pad];
  }
  if (axisOptions?.nice === false || requested) return [low, high];
  return scaleLinear().domain([low, high]).nice(NICE_Y_TICK_COUNT).domain() as Domain;
}

function defaultFacetColumns(width: number): number {
  for (const breakpoint of TRELLIS_COLUMN_BREAKPOINTS) {
    if (width >= breakpoint.minWidth) return breakpoint.columns;
  }
  return 1;
}

function facetColumnCount(options: CartesianOptions, trellis: boolean, facetCount: number, width: number): number {
  if (!trellis) return 1;
  const requested = options.facetColumns ?? defaultFacetColumns(width);
  return Math.max(1, Math.min(facetCount, requested));
}

function trellisRowGap(trellis: boolean, showXAxis: boolean): number {
  if (!trellis) return 0;
  return showXAxis ? TRELLIS_ROW_GAP_WITH_X_AXIS : TRELLIS_ROW_GAP_WITHOUT_X_AXIS;
}

/** Height of the x axis: tick, labels, optional super labels and title. */
function xAxisHeight(options: CartesianOptions, showXAxis: boolean, showTimeSuperLabels: boolean, lineHeight: number): number {
  if (!showXAxis) return 0;
  const titleHeight = options.xAxis?.title ? lineHeight + LABEL_GAP : 0;
  const superLabelHeight = showTimeSuperLabels ? lineHeight : 0;
  return TICK + TICK_LABEL_GAP + lineHeight + superLabelHeight + titleHeight;
}

/** Y ticks with labels formatted for the axis. */
function labeledYTicks(
  scale: ScaleLinear<number, number>,
  axisOptions: AxisOptions | undefined,
  formatters: Formatters,
  plotHeight: number,
  fontSize: number,
): Tick[] {
  const ticks = yTicks(scale, null, formatters, plotHeight, fontSize, axisOptions?.ticks);
  const format = makeNumberFormat(formatters, axisOptions?.format, ticks.map((tick) => tick.value));
  for (const tick of ticks) tick.label = format(tick.value);
  return ticks;
}

/** Horizontal room a y axis needs for its labels and title. */
function yAxisWidth(ticks: Tick[], title: string | undefined, axisFont: string, lineHeight: number): number {
  if (ticks.length === 0) return 0;
  const widestLabel = Math.max(...ticks.map((tick) => measureText(tick.label, axisFont)));
  const titleWidth = title ? lineHeight + LABEL_GAP : 0;
  return Math.ceil(widestLabel) + LABEL_GAP + titleWidth;
}

function buildTimeXAxis(context: XAxisContext, plotWidth: number): XAxis {
  const { options, formatters, xDomain } = context;
  const scale = scaleTime().domain([new Date(xDomain[0]), new Date(xDomain[1])]).range([0, plotWidth]);
  let xTicks: Tick[] = [];
  if (context.showXAxis) {
    xTicks = timeTicks(scale, formatters, context.axisFont, plotWidth, options.xAxis?.ticks, context.showTimeSuperLabels);
  }
  const format = options.xAxis?.format;
  if (format) {
    const formatDate = typeof format === 'string' ? formatters.time(format) : (format as (v: Date) => string);
    for (const tick of xTicks) {
      tick.label = formatDate(new Date(tick.value));
      delete tick.superLabel;
    }
  }
  return {
    plotWidth,
    xScale: (v) => scale(new Date(v)),
    xInvert: (px) => +scale.invert(px),
    xTicks,
  };
}

function buildLinearXAxis(context: XAxisContext, plotWidth: number): XAxis {
  const { options, formatters } = context;
  const scale = scaleLinear().domain(context.xDomain).range([0, plotWidth]);
  if (options.xAxis?.nice) scale.nice();
  let xTicks: Tick[] = [];
  if (context.showXAxis) {
    const formatSpec = options.xAxis?.format;
    let format: ((n: number) => string) | null = null;
    if (formatSpec !== undefined) {
      const tickCount = Math.max(MIN_LINEAR_X_TICK_COUNT, Math.floor(plotWidth / LINEAR_X_TICK_SPACING));
      format = makeNumberFormat(formatters, formatSpec, scale.ticks(tickCount));
    }
    xTicks = linearXTicks(scale, format, formatters, context.axisFont, plotWidth, options.xAxis?.ticks);
  }
  return { plotWidth, xScale: scale, xInvert: (px) => scale.invert(px), xTicks };
}

function buildBandXAxis(context: XAxisContext, plotWidth: number): XAxis {
  const { categories } = context.spec;
  const scale = scaleLinear()
    .domain(categories.length > 1 ? context.xDomain : [-1, 1])
    .range([0, plotWidth]);
  let xTicks: Tick[] = [];
  if (context.showXAxis) xTicks = bandTicks(categories, (i) => scale(i), context.axisFont, plotWidth);
  return { plotWidth, xScale: scale, xInvert: (px) => scale.invert(px), xTicks };
}

/** X scale and ticks for a panel width derived from the left and right gutters. */
function buildXAxis(context: XAxisContext, left: number, right: number): XAxis {
  const { columns, columnGap } = context;
  const plotWidth = Math.max(MIN_PLOT_SIZE, (context.width - left - right - (columns - 1) * columnGap) / columns);
  if (context.spec.xType === 'time') return buildTimeXAxis(context, plotWidth);
  if (context.spec.xType === 'linear') return buildLinearXAxis(context, plotWidth);
  return buildBandXAxis(context, plotWidth);
}

/** Widens the gutters, if needed, so the outermost x labels stay inside the chart. */
function fitOuterXLabels(context: XAxisContext, left: number, right: number): { left: number; right: number; xAxis: XAxis } {
  const xAxis = buildXAxis(context, left, right);
  if (!context.showXAxis || !xAxis.xTicks.length) return { left, right, xAxis };
  const first = xAxis.xTicks[0];
  const last = xAxis.xTicks[xAxis.xTicks.length - 1];
  const firstOverflow = measureText(first.label, context.axisFont) / 2 - first.pos;
  const lastOverflow = measureText(last.label, context.axisFont) / 2 - (xAxis.plotWidth - last.pos);
  const fittedLeft = Math.max(left, Math.ceil(firstOverflow));
  const fittedRight = Math.max(right, Math.ceil(lastOverflow));
  if (fittedLeft === left && fittedRight === right) return { left, right, xAxis };
  return { left: fittedLeft, right: fittedRight, xAxis: buildXAxis(context, fittedLeft, fittedRight) };
}

interface PanelGrid {
  facets: string[];
  columns: number;
  trellis: boolean;
  left: number;
  top: number;
  plotWidth: number;
  plotHeight: number;
  columnGap: number;
  rowGap: number;
  facetTitleHeight: number;
}

function placePanels(grid: PanelGrid): PanelFrame[] {
  const { columns, plotWidth, plotHeight, facetTitleHeight } = grid;
  const facetCount = grid.facets.length;
  return grid.facets.map((facet, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    return {
      facet,
      index,
      x: grid.left + column * (plotWidth + grid.columnGap),
      y: grid.top + row * (plotHeight + grid.rowGap + facetTitleHeight) + facetTitleHeight,
      width: plotWidth,
      height: plotHeight,
      showXLabels: index + columns >= facetCount,
      showYLabels: !grid.trellis || column === 0,
    };
  });
}

/** Formats an x value for tooltips and accessible labels. */
function makeXValueFormatter(spec: CartesianSpec, options: CartesianOptions, formatters: Formatters, xTicks: Tick[]): (v: XValue) => string {
  if (spec.xType === 'time') {
    const sortedPositions = Array.from(new Set(spec.xs)).sort((a, b) => a - b);
    const fullFormat = timeFormatsForGrain(formatters, inferGrain(sortedPositions)).full;
    const custom = options.xAxis?.format;
    return (v) => {
      const date = parseDate(v);
      if (!date) return String(v ?? '');
      return typeof custom === 'function' ? (custom as (v: Date) => string)(date) : fullFormat(date);
    };
  }
  if (spec.xType === 'linear') {
    const extraPrecision = options.xAxis?.format ? 0 : 1;
    const format = makeNumberFormat(formatters, options.xAxis?.format, xTicks.map((tick) => tick.value), extraPrecision);
    return (v) => {
      const value = toNumber(v);
      return value == null ? String(v ?? '') : format(value);
    };
  }
  return (v) => String(v ?? '');
}

/** Scales, ticks and panel placement for charts with x/y axes. */
export function layoutCartesian(
  spec: CartesianSpec,
  options: CartesianOptions,
  env: Env,
  width: number,
  height: number,
  tween: DomainTween | null,
): CartesianFrame {
  const { sizes, f: formatters } = env;
  const trellis = spec.trellis;
  const { yPosition, showXAxis, showYAxis } = axisSides(options, trellis);
  const axisFontSize = sizes.axisFont;
  const axisFont = font(axisFontSize);
  const lineHeight = axisLineHeight(axisFontSize);
  const hasY2 = spec.y2Values != null;

  const progress = tween ? Math.max(0, Math.min(1, tween.t)) : 1;
  const xDomain = lerpDomain(tween?.xDomain, targetXDomain(spec, options), progress);
  const yDomain = lerpDomain(tween?.yDomain, targetYDomain(spec, options, 'y'), progress);
  const y2Domain = hasY2 ? lerpDomain(tween?.y2Domain, targetYDomain(spec, options, 'y2'), progress) : null;

  const facets = trellis ? spec.facets : [''];
  const columns = facetColumnCount(options, trellis, facets.length, width);
  const rows = Math.ceil(facets.length / columns);
  const facetTitleHeight = trellis ? Math.round(sizes.facetFont * FACET_TITLE_LINE_HEIGHT_RATIO) + FACET_TITLE_PADDING : 0;

  const showTimeSuperLabels = spec.xType === 'time' && options.xAxis?.superLabels !== false;
  const top = Math.max(spec.margin.top, showYAxis ? Math.ceil(axisFontSize / 2) : 0);
  const bottom = xAxisHeight(options, showXAxis, showTimeSuperLabels, lineHeight);
  const rowGap = trellisRowGap(trellis, showXAxis);
  const plotHeight = Math.max(MIN_PLOT_SIZE, (height - top - bottom - (rows - 1) * rowGap - rows * facetTitleHeight) / rows);

  const y = scaleLinear().domain(yDomain).range([plotHeight, 0]);
  const y2 = y2Domain ? scaleLinear().domain(y2Domain).range([plotHeight, 0]) : null;
  const yTickList = showYAxis ? labeledYTicks(y, options.yAxis, formatters, plotHeight, axisFontSize) : [];
  const y2TickList = y2 && showYAxis ? labeledYTicks(y2, options.y2Axis, formatters, plotHeight, axisFontSize) : [];
  const yValueFormat = makeNumberFormat(formatters, options.yAxis?.format, yTickList.map((tick) => tick.value), 1);
  const y2ValueFormat = makeNumberFormat(formatters, options.y2Axis?.format, y2TickList.map((tick) => tick.value), 1);

  const yWidth = showYAxis ? yAxisWidth(yTickList, options.yAxis?.title, axisFont, lineHeight) : 0;
  const y2Width = showYAxis && y2 ? yAxisWidth(y2TickList, options.y2Axis?.title, axisFont, lineHeight) : 0;
  const leftAxisWidth = yPosition === 'left' ? yWidth : y2Width;
  const rightAxisWidth = yPosition === 'right' ? yWidth : y2Width;
  const columnGap = trellis ? TRELLIS_COLUMN_GAP : 0;

  const xAxisContext: XAxisContext = {
    spec,
    options,
    formatters,
    xDomain,
    showXAxis,
    showTimeSuperLabels,
    axisFont,
    columns,
    columnGap,
    width,
  };
  const { left, xAxis } = fitOuterXLabels(xAxisContext, leftAxisWidth + spec.margin.left, rightAxisWidth + spec.margin.right);
  const { plotWidth, xScale, xInvert, xTicks } = xAxis;

  const panels = placePanels({ facets, columns, trellis, left, top, plotWidth, plotHeight, columnGap, rowGap, facetTitleHeight });
  const formatY = (v: number | null, axis: 'y' | 'y2' = 'y'): string => {
    if (v == null) return '';
    return axis === 'y2' ? y2ValueFormat(v) : yValueFormat(v);
  };

  return {
    panels,
    plotWidth,
    plotHeight,
    trellis,
    xType: spec.xType,
    xScale,
    xInvert,
    y,
    y2,
    xTicks,
    yTicks: yTickList,
    y2Ticks: y2TickList,
    yPosition,
    formatX: makeXValueFormatter(spec, options, formatters, xTicks),
    formatY,
    xValue: (v) => xPosition(v, spec.xType, spec.categories),
    axisFont,
    facetTitleHeight,
    xDomain,
    yDomain,
    y2Domain,
    showXAxis,
    showYAxis,
  };
}
