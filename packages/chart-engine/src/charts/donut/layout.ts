import { DONUT } from '../../core/assumptions.js';
import type { Env, LayoutInput } from '../../core/module.js';
import { font } from '../../core/theme.js';
import { compactFormatter } from '../../util/format.js';
import { measureText, truncate } from '../../util/text.js';
import { layoutLabels, labelStyle, type DirectLabel } from './labels.js';
import type { DonutModel, Segment } from './model.js';
import type { DonutChartOptions } from './types.js';

export interface ArcLayout {
  key: string;
  category: string;
  value: number;
  /** Share of the visible total, 0–1. */
  percent: number;
  /** Angles in radians, clockwise from 12 o'clock. Equal when the segment is hidden. */
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
  formatValue: (v: number) => string;
  formatPercent: (p: number) => string;
  /** Direct labels are drawn, so hover only fades. */
  labelled: boolean;
  trellis: boolean;
}

export type DonutSnapshot = Map<string, { start: number; end: number }>;

export function formattersFor(o: DonutChartOptions, env: Env): Pick<DonutGeometry, 'formatValue' | 'formatPercent'> {
  return {
    formatValue: o.valueFormat ? env.f.number(o.valueFormat) : compactFormatter(env.f, 1),
    formatPercent: env.f.number(o.percentFormat ?? '.1%'),
  };
}

export function colorOfFor(m: DonutModel, o: DonutChartOptions, env: Env): (category: string) => string {
  return (c) => {
    if (o.colors?.[c]) return o.colors[c];
    if (m.binary && c === m.binary.secondary) return env.theme.secondary;
    const i = Math.max(0, m.categories.indexOf(c));
    return env.palette[i % env.palette.length];
  };
}

/** Ring thickness for a diameter, interpolated from the size table. */
export function thicknessFor(diameter: number): number {
  const t = DONUT.thickness;
  if (diameter <= t[0][0]) return (t[0][1] * diameter) / t[0][0];
  for (let i = 1; i < t.length; i++) {
    const [d1, w1] = t[i];
    const [d0, w0] = t[i - 1];
    if (diameter <= d1) return w0 + ((w1 - w0) * (diameter - d0)) / (d1 - d0);
  }
  const [dl, wl] = t[t.length - 1];
  return (wl * diameter) / dl;
}

/** Center typography row for a diameter: [value, label, delta] font sizes (0 = hidden). */
export function centerFontsFor(diameter: number): [number, number, number] {
  let row = DONUT.center[0];
  for (const r of DONUT.center) if (diameter >= r[0]) row = r;
  return [row[1], row[2], row[3]];
}

/** Benchmark as a 0–1 share. */
export function benchmarkShare(v: number): number {
  return v > 1 ? v / 100 : v;
}

function sentimentColor(o: DonutChartOptions, m: DonutModel, env: Env, primaryShare: number): string | null {
  if (!m.binary || !o.benchmark || o.benchmark.sentiment === false) return null;
  const b = benchmarkShare(o.benchmark.value);
  return primaryShare >= b ? env.theme.positive : env.theme.negative;
}

/** Place the donuts in a grid of cells, size them, and compute segment angles, center text and labels. */
export function layoutDonut(input: LayoutInput<DonutChartOptions, DonutModel, DonutSnapshot>): DonutGeometry {
  const { model: m, options: o, env, width, height, hidden, tween } = input;
  const semicircle = o.variant === 'semicircle';
  const base = semicircle ? -Math.PI / 2 : 0;
  const sweep = semicircle ? Math.PI : Math.PI * 2;
  const colorOf = colorOfFor(m, o, env);
  const fmt = formattersFor(o, env);
  const trellis = m.pies.length > 1;
  const style = labelStyle(o);
  const geom: DonutGeometry = { pies: [], semicircle, base, sweep, colorOf, ...fmt, labelled: !!style, trellis };
  if (!m.pies.length || width <= 0 || height <= 0) return geom;

  const cols = Math.max(1, Math.min(m.pies.length, o.facetColumns ?? Math.ceil(Math.sqrt(m.pies.length))));
  const rows = Math.ceil(m.pies.length / cols);
  const gap = DONUT.trellisGap;
  const cellW = (width - gap * (cols - 1)) / cols;
  const cellH = (height - gap * (rows - 1)) / rows;
  const facetH = trellis ? DONUT.facetFont + DONUT.facetGap : 0;
  const hoverH = trellis ? DONUT.hoverLabelFont + DONUT.facetGap : 0;

  m.pies.forEach((pie, index) => {
    const cell = { x: (index % cols) * (cellW + gap), y: Math.floor(index / cols) * (cellH + gap), width: cellW, height: cellH };
    const visible = pie.segments.filter((s) => !hidden.has(s.category));
    const total = visible.reduce((a, s) => a + s.value, 0);
    const p: PieLayout = {
      index,
      facet: pie.facet,
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
    // Angles.
    let a = base;
    for (const s of pie.segments) {
      const on = !hidden.has(s.category) && total > 0;
      const span = on ? (s.value / total) * sweep : 0;
      p.arcs.push({
        key: `${index}:${s.category}`,
        category: s.category,
        value: s.value,
        percent: on ? s.value / total : 0,
        start: a,
        end: a + span,
        color: colorOf(s.category),
        segment: s,
        pie: p,
      });
      a += span;
    }
    if (tween) {
      for (const arc of p.arcs) {
        const from = tween.from.get(arc.key) ?? { start: arc.start, end: arc.start };
        arc.start = from.start + (arc.start - from.start) * tween.t;
        arc.end = from.end + (arc.end - from.end) * tween.t;
      }
    }
    if (m.binary) {
      const primary = p.arcs.find((x) => x.category === m.binary!.primary);
      const color = o.colorByFacet && trellis ? env.palette[index % env.palette.length] : sentimentColor(o, m, env, primary?.percent ?? 0);
      if (primary && color && !o.colors?.[primary.category]) primary.color = color;
    }

    // Size: leave room for direct labels at the sides, facet names below and hover values above.
    const availH = cellH - facetH - hoverH;
    let sides = style ? measureSides(p, o, geom) : { left: 0, right: 0, top: 0, bottom: 0 };
    if (!style && !o.tooltip && !trellis) {
      // Hover labels appear beside the ring: keep room for them when it costs little.
      const w = hoverLabelWidth(geom, p) + DONUT.labelOffset;
      if (cellW - 2 * w >= Math.min(cellW, availH) * 0.75) sides = { left: w, right: w, top: 0, bottom: 0 };
    }
    const benchH = o.benchmark && m.binary ? DONUT.benchmarkFont * 2 + DONUT.benchmarkOvershoot + DONUT.benchmarkArrow + 6 : 0;
    const availW = cellW - sides.left - sides.right;
    const labelH = sides.top + sides.bottom;
    let diameter = semicircle ? Math.min(availW, (availH - benchH - sides.top) * 2) : Math.min(availW, availH - Math.max(benchH * 2, labelH));
    diameter = Math.max(0, Math.min(diameter, o.maxDiameter ?? Infinity));
    const outer = diameter / 2;
    const thickness = Math.min(outer, o.thickness ?? thicknessFor(diameter));
    p.outer = outer;
    p.inner = Math.max(0, outer - thickness);
    const blockW = sides.left + diameter + sides.right;
    p.cx = cell.x + (cellW - blockW) / 2 + sides.left + outer;
    const ringH = semicircle ? outer : diameter;
    const top = cell.y + hoverH + (availH - ringH - sides.top - sides.bottom) / 2 + sides.top;
    p.cy = top + outer;
    p.hoverY = top - DONUT.facetGap;
    if (trellis && pie.facet != null) {
      p.facetLabel = {
        text: truncate(pie.facet, font(DONUT.facetFont, 700), cellW),
        x: p.cx,
        y: (semicircle ? p.cy : p.cy + outer) + DONUT.facetGap + DONUT.facetFont / 2,
      };
    }

    p.center = centerLines(p, o, m, geom, semicircle);
    if (o.benchmark && m.binary) {
      const share = benchmarkShare(o.benchmark.value);
      const showValue = o.benchmark.showValue ?? !!o.benchmark.label;
      p.benchmark = {
        angle: base + Math.max(0, Math.min(1, share)) * sweep,
        label: o.benchmark.label ?? null,
        value: showValue || !o.benchmark.label ? geom.formatPercent(share) : null,
      };
    }
    if (style) p.labels = layoutLabels(p, o, geom, cell);
    geom.pies.push(p);
  });
  return geom;
}

function measureSides(p: PieLayout, o: DonutChartOptions, g: DonutGeometry): { left: number; right: number; top: number; bottom: number } {
  // Measure every label at its eventual side using provisional angles.
  const probe = layoutLabels({ ...p, cx: 0, cy: 0, outer: 1, inner: 0 }, o, g, { x: -1e6, y: -1e6, width: 2e6, height: 2e6 });
  let left = 0;
  let right = 0;
  let top = 0;
  let bottom = 0;
  for (const l of probe) {
    const need = l.width + l.offset;
    if (l.side === 'left') left = Math.max(left, need);
    else right = Math.max(right, need);
    // Lightweight labels near 12 or 6 o'clock sit above or below the ring.
    if (l.style === 'lightweight') {
      const arc = p.arcs.find((a) => a.key === l.key)!;
      const cos = Math.cos((arc.start + arc.end) / 2);
      if (cos > 0.5) top = Math.max(top, l.height * cos);
      if (cos < -0.5) bottom = Math.max(bottom, -l.height * cos);
    }
  }
  return { left, right, top, bottom };
}

function centerLines(p: PieLayout, o: DonutChartOptions, m: DonutModel, g: DonutGeometry, semicircle: boolean): CenterLine[] {
  if (o.center === false || p.inner <= 0) return [];
  const c = o.center ?? {};
  const [valueSize, labelSize, deltaSize] = centerFontsFor(p.outer * 2);
  const mode = c.value ?? (m.binary || m.pies.length > 1 ? 'primary' : 'total');
  let value: string | null = null;
  if (mode === 'total') value = g.formatValue(p.total);
  else if (mode === 'primary') {
    const first = p.arcs.find((a) => a.end > a.start);
    value = first ? g.formatPercent(first.percent) : null;
  } else if (typeof mode === 'number') value = g.formatValue(mode);
  else if (typeof mode === 'string') value = mode;

  const maxW = p.inner * 2 * DONUT.centerTextShare;
  const lines: Omit<CenterLine, 'y'>[] = [];
  if (value && valueSize) lines.push({ text: truncate(value, font(valueSize, 800), maxW), size: valueSize, weight: 800, color: 'text' });
  if (c.label && labelSize) lines.push({ text: truncate(c.label, font(labelSize, 700), maxW), size: labelSize, weight: 700, color: 'text' });
  if (c.delta && deltaSize) {
    lines.push({ text: truncate(c.delta.text, font(deltaSize, 400), maxW), size: deltaSize, weight: 400, color: c.delta.sentiment ?? 'neutral' });
  }
  const lh = (s: number) => s * 1.15;
  const blockH = lines.reduce((a, l) => a + lh(l.size), 0);
  // Semicircles stack the text upwards from the baseline.
  let y = semicircle ? p.cy - blockH : p.cy - blockH / 2;
  return lines
    .filter((l) => l.text)
    .map((l) => {
      const out = { ...l, y: y + lh(l.size) / 2 };
      y += lh(l.size);
      return out;
    });
}

export function snapshotDonut(g: DonutGeometry): DonutSnapshot {
  const out: DonutSnapshot = new Map();
  for (const p of g.pies) for (const a of p.arcs) out.set(a.key, { start: a.start, end: a.end });
  return out;
}

/** Point on a circle at an angle measured clockwise from 12 o'clock. */
export function polar(cx: number, cy: number, r: number, angle: number): [number, number] {
  return [cx + r * Math.sin(angle), cy - r * Math.cos(angle)];
}

/** Ring segment outline in absolute coordinates (used for focus rings and selection outlines). */
export function ringPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
  const span = a1 - a0;
  if (span >= Math.PI * 2 - 1e-6) {
    const ring = (r: number, sweep: 0 | 1) =>
      `M${cx},${cy - r}A${r},${r} 0 1 ${sweep} ${cx},${cy + r}A${r},${r} 0 1 ${sweep} ${cx},${cy - r}Z`;
    return ring(r1, 1) + (r0 > 0 ? ring(r0, 0) : '');
  }
  const large = span > Math.PI ? 1 : 0;
  const [x0, y0] = polar(cx, cy, r1, a0);
  const [x1, y1] = polar(cx, cy, r1, a1);
  const [x2, y2] = polar(cx, cy, r0, a1);
  const [x3, y3] = polar(cx, cy, r0, a0);
  const f = (n: number) => +n.toFixed(2);
  return (
    `M${f(x0)},${f(y0)}A${r1},${r1} 0 ${large} 1 ${f(x1)},${f(y1)}` +
    (r0 > 0 ? `L${f(x2)},${f(y2)}A${r0},${r0} 0 ${large} 0 ${f(x3)},${f(y3)}Z` : `L${cx},${cy}Z`)
  );
}

/** Bounding box of a ring segment. */
export function arcBounds(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const xs: number[] = [];
  const ys: number[] = [];
  const steps = Math.max(2, Math.ceil(((a1 - a0) / (Math.PI * 2)) * 32));
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    for (const r of [r0, r1]) {
      const [x, y] = polar(cx, cy, r, a);
      xs.push(x);
      ys.push(y);
    }
  }
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

/** Width of the widest lightweight hover label; used to keep hover labels inside the chart. */
export function hoverLabelWidth(g: DonutGeometry, p: PieLayout): number {
  let w = 0;
  for (const a of p.arcs) {
    w = Math.max(w, measureText(a.category, font(DONUT.labelNameFont)), measureText(g.formatPercent(a.percent), font(DONUT.hoverLabelFont, 700)));
  }
  return w;
}
