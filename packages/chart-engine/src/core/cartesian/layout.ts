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

export const TICK = 6;
const LABEL_GAP = 8;

/** Which side the y axis is on and whether the axes are shown. */
export function axisSides(o: CartesianOptions, trellis: boolean): { yPosition: 'left' | 'right'; showXAxis: boolean; showYAxis: boolean } {
  return {
    yPosition: o.yAxis?.position ?? (trellis ? 'left' : 'right'),
    showXAxis: !o.minimal && !o.xAxis?.hidden,
    showYAxis: !o.minimal && !o.yAxis?.hidden,
  };
}

export function makeNumberFormat(
  f: Formatters,
  spec: AxisOptions['format'],
  ticks: number[],
  extraPrecision = 0,
): (n: number) => string {
  if (spec === 'compact' || spec === '$compact') {
    const prefix = spec === '$compact' ? '$' : '';
    if (extraPrecision === 0) return autoNumberFormat(ticks, f, prefix);
    return compactFormatter(f, 1, prefix);
  }
  const fallback = extraPrecision ? compactFormatter(f, 1) : autoNumberFormat(ticks, f);
  return numberFormatter(f, spec, fallback);
}

function lerpDomain(from: [number, number] | null | undefined, to: [number, number], t: number): [number, number] {
  if (!from || t >= 1) return to;
  return [interpolateNumber(from[0], to[0])(t), interpolateNumber(from[1], to[1])(t)];
}

export function xPosition(v: unknown, xType: ScaleType, categories: string[]): number | null {
  if (v == null) return null;
  if (xType === 'time') {
    const d = parseDate(v);
    return d ? +d : null;
  }
  if (xType === 'linear') return toNumber(v);
  const i = categories.indexOf(String(v));
  return i < 0 ? null : i;
}

/** Scales, ticks and panel placement for charts with x/y axes. */
export function layoutCartesian(
  spec: CartesianSpec,
  o: CartesianOptions,
  env: Env,
  width: number,
  height: number,
  tween: DomainTween | null,
): CartesianFrame {
  const { sizes, f } = env;
  const minimal = !!o.minimal;
  const trellis = spec.trellis;
  const { yPosition, showXAxis, showYAxis } = axisSides(o, trellis);
  const axisFontSize = sizes.axisFont;
  const axisFont = font(axisFontSize);
  const lineHeight = Math.round(axisFontSize * 1.3);
  const hasY2 = spec.y2Values != null;

  // ---- domains ----
  const xs = spec.xs;
  let xDom: [number, number];
  if (spec.xType === 'band') xDom = [0, Math.max(0, spec.categories.length - 1)];
  else {
    const [a, b] = extent(xs);
    xDom = a == null || b == null ? [0, 1] : [a, b];
  }
  const xd = o.xAxis?.domain;
  if (xd && spec.xType !== 'band') {
    const a = xd[0] == null ? null : xPosition(xd[0], spec.xType, spec.categories);
    const b = xd[1] == null ? null : xPosition(xd[1], spec.xType, spec.categories);
    xDom = [a ?? xDom[0], b ?? xDom[1]];
  }
  if (xDom[0] === xDom[1]) {
    const d = spec.xType === 'time' ? 864e5 : 1;
    xDom = [xDom[0] - d, xDom[1] + d];
  }

  const yDomainFor = (axis: 'y' | 'y2'): [number, number] => {
    const axisOpts = axis === 'y' ? o.yAxis : o.y2Axis;
    const vals = axis === 'y' ? [...spec.yValues] : [...(spec.y2Values ?? [])];
    for (const r of o.referenceLines ?? []) {
      if ((r.axis ?? 'y') === axis) {
        const n = toNumber(r.value);
        if (n != null) vals.push(n);
      }
    }
    let lo = vals.length ? Math.min(...vals) : 0;
    let hi = vals.length ? Math.max(...vals) : 1;
    if (axisOpts?.zero ?? !minimal) {
      lo = Math.min(lo, 0);
      hi = Math.max(hi, 0);
    }
    if (lo === hi) {
      const d = Math.abs(lo) * 0.1 || 1;
      lo -= d;
      hi += d;
    }
    const dom = axisOpts?.domain;
    if (dom) {
      lo = dom[0] == null ? lo : Number(dom[0]);
      hi = dom[1] == null ? hi : Number(dom[1]);
    }
    if (minimal && !dom) {
      const padY = (hi - lo) * 0.08;
      return [lo - (axisOpts?.zero ? 0 : padY), hi + padY];
    }
    if (axisOpts?.nice === false || dom) return [lo, hi];
    return scaleLinear().domain([lo, hi]).nice(6).domain() as [number, number];
  };
  const t = tween ? Math.max(0, Math.min(1, tween.t)) : 1;
  const xDomain = lerpDomain(tween?.xDomain, xDom, t);
  const yDomain = lerpDomain(tween?.yDomain, yDomainFor('y'), t);
  const y2Domain = hasY2 ? lerpDomain(tween?.y2Domain, yDomainFor('y2'), t) : null;

  // ---- vertical space ----
  const facets = trellis ? spec.facets : [''];
  const n = facets.length;
  const cols = trellis ? Math.max(1, Math.min(n, o.facetColumns ?? (width >= 900 ? 3 : width >= 480 ? 2 : 1))) : 1;
  const rows = Math.ceil(n / cols);
  const facetTitleHeight = trellis ? Math.round(sizes.facetFont * 1.4) + 6 : 0;

  const timeSuper = spec.xType === 'time' && o.xAxis?.superLabels !== false;
  const xTitleH = showXAxis && o.xAxis?.title ? lineHeight + LABEL_GAP : 0;
  const xAxisH = showXAxis ? TICK + 4 + lineHeight + (timeSuper ? lineHeight : 0) + xTitleH : 0;
  const top = Math.max(spec.margin.top, showYAxis ? Math.ceil(axisFontSize / 2) : 0);
  const bottom = xAxisH;
  const rowGap = trellis ? (showXAxis ? 12 : 16) : 0;
  const plotHeight = Math.max(10, (height - top - bottom - (rows - 1) * rowGap - rows * facetTitleHeight) / rows);

  const y = scaleLinear().domain(yDomain).range([plotHeight, 0]);
  const y2 = y2Domain ? scaleLinear().domain(y2Domain).range([plotHeight, 0]) : null;
  const yT = showYAxis ? yTicks(y, null, f, plotHeight, axisFontSize, o.yAxis?.ticks) : [];
  const yFmt = makeNumberFormat(f, o.yAxis?.format, yT.map((d) => d.value));
  for (const tk of yT) tk.label = yFmt(tk.value);
  const y2T = y2 && showYAxis ? yTicks(y2, null, f, plotHeight, axisFontSize, o.y2Axis?.ticks) : [];
  const y2Fmt = makeNumberFormat(f, o.y2Axis?.format, y2T.map((d) => d.value));
  for (const tk of y2T) tk.label = y2Fmt(tk.value);
  const yValueFmt = makeNumberFormat(f, o.yAxis?.format, yT.map((d) => d.value), 1);
  const y2ValueFmt = makeNumberFormat(f, o.y2Axis?.format, y2T.map((d) => d.value), 1);

  const axisWidth = (ticks: Tick[], title?: string): number =>
    ticks.length === 0
      ? 0
      : Math.ceil(Math.max(...ticks.map((tk) => measureText(tk.label, axisFont)))) + LABEL_GAP + (title ? lineHeight + LABEL_GAP : 0);
  const yW = showYAxis ? axisWidth(yT, o.yAxis?.title) : 0;
  const y2W = showYAxis && y2 ? axisWidth(y2T, o.y2Axis?.title) : 0;

  let left = (yPosition === 'left' ? yW : y2W) + spec.margin.left;
  let right = (yPosition === 'right' ? yW : y2W) + spec.margin.right;
  const colGap = trellis ? 24 : 0;

  const buildX = (l: number, r: number) => {
    const plotWidth = Math.max(10, (width - l - r - (cols - 1) * colGap) / cols);
    let xScale: (v: number) => number;
    let xInvert: (px: number) => number;
    let xT: Tick[] = [];
    if (spec.xType === 'time') {
      const sc = scaleTime().domain([new Date(xDomain[0]), new Date(xDomain[1])]).range([0, plotWidth]);
      xScale = (v) => sc(new Date(v));
      xInvert = (px) => +sc.invert(px);
      if (showXAxis) xT = timeTicks(sc, f, axisFont, plotWidth, o.xAxis?.ticks, timeSuper);
      const fmt = o.xAxis?.format;
      if (fmt) {
        const tf = typeof fmt === 'string' ? f.time(fmt) : (fmt as (v: Date) => string);
        for (const tk of xT) {
          tk.label = tf(new Date(tk.value));
          delete tk.superLabel;
        }
      }
    } else if (spec.xType === 'linear') {
      const sc = scaleLinear().domain(xDomain).range([0, plotWidth]);
      if (o.xAxis?.nice) sc.nice();
      xScale = sc;
      xInvert = (px) => sc.invert(px);
      if (showXAxis) {
        const fmtSpec = o.xAxis?.format;
        const fmt = fmtSpec === undefined ? null : makeNumberFormat(f, fmtSpec, sc.ticks(Math.max(2, Math.floor(plotWidth / 80))));
        xT = linearXTicks(sc, fmt, f, axisFont, plotWidth, o.xAxis?.ticks);
      }
    } else {
      const sc = scaleLinear()
        .domain(spec.categories.length > 1 ? xDomain : [-1, 1])
        .range([0, plotWidth]);
      xScale = sc;
      xInvert = (px) => sc.invert(px);
      if (showXAxis) xT = bandTicks(spec.categories, (i) => sc(i), axisFont, plotWidth);
    }
    return { plotWidth, xScale, xInvert, xT };
  };

  let xb = buildX(left, right);
  if (showXAxis && xb.xT.length) {
    // Keep the outermost labels inside the chart.
    const first = xb.xT[0];
    const last = xb.xT[xb.xT.length - 1];
    const firstOver = measureText(first.label, axisFont) / 2 - first.pos;
    const lastOver = measureText(last.label, axisFont) / 2 - (xb.plotWidth - last.pos);
    const nl = Math.max(left, Math.ceil(firstOver));
    const nr = Math.max(right, Math.ceil(lastOver));
    if (nl !== left || nr !== right) {
      left = nl;
      right = nr;
      xb = buildX(left, right);
    }
  }
  const { plotWidth, xScale, xInvert, xT } = xb;

  const panels: PanelFrame[] = facets.map((facet, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    return {
      facet,
      index,
      x: left + col * (plotWidth + colGap),
      y: top + row * (plotHeight + rowGap + facetTitleHeight) + facetTitleHeight,
      width: plotWidth,
      height: plotHeight,
      showXLabels: index + cols >= n,
      showYLabels: !trellis || col === 0,
    };
  });

  let formatX: (v: XValue) => string;
  if (spec.xType === 'time') {
    const grain = inferGrain(Array.from(new Set(xs)).sort((a, b) => a - b));
    const full = timeFormatsForGrain(f, grain).full;
    const custom = o.xAxis?.format;
    formatX = (v) => {
      const d = parseDate(v);
      if (!d) return String(v ?? '');
      return typeof custom === 'function' ? (custom as (v: Date) => string)(d) : full(d);
    };
  } else if (spec.xType === 'linear') {
    const fmt = makeNumberFormat(f, o.xAxis?.format, xT.map((d) => d.value), o.xAxis?.format ? 0 : 1);
    formatX = (v) => {
      const n2 = toNumber(v);
      return n2 == null ? String(v ?? '') : fmt(n2);
    };
  } else {
    formatX = (v) => String(v ?? '');
  }
  const formatY = (v: number | null, axis: 'y' | 'y2' = 'y'): string => {
    if (v == null) return '';
    return axis === 'y2' ? y2ValueFmt(v) : yValueFmt(v);
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
    xTicks: xT,
    yTicks: yT,
    y2Ticks: y2T,
    yPosition,
    formatX,
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
