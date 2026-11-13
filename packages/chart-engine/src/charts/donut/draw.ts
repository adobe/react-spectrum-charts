import { arc as d3arc } from 'd3-shape';
import { DONUT } from '../../core/assumptions.js';
import type { DrawState, Env } from '../../core/module.js';
import { font, type Theme } from '../../core/theme.js';
import { group, type SceneNode } from '../../render/scene.js';
import { ADVANCED, LIGHT_LINE, labelLineHeight, lightweightSize, type DirectLabel } from './labels.js';
import { polar, ringPath, type ArcLayout, type CenterLine, type DonutGeometry, type PieLayout } from './layout.js';

/** Arcs narrower than this (radians) are not drawn. */
const MIN_VISIBLE_SPAN = 1e-6;
const BOLD = 700;
const REGULAR = 400;
const LEADER_STROKE_WIDTH = 1;
/** Decimal places kept in leader line coordinates. */
const LEADER_PRECISION = 1;
const SWATCH_CORNER_RADIUS = 3;
/** The benchmark tick starts this far inside the inner radius. */
const BENCHMARK_TICK_INSET = 2;
const BENCHMARK_STROKE_WIDTH = 1.5;
/** Space between the arrowhead tip and the benchmark label. */
const BENCHMARK_LABEL_GAP = 4;
/** Benchmark labels within this |sin(angle)| of the vertical axis are centred. */
const BENCHMARK_CENTER_ZONE = 0.3;
/** Selection outlines: the halo and the ring sit this far outside the segment. */
const SELECTION_HALO_OFFSET = 1.5;
const SELECTION_RING_OFFSET = 3;

type ArcDatum = { inner: number; outer: number; start: number; end: number };
type TextAlign = 'start' | 'middle' | 'end';

const arcGenerator = d3arc<ArcDatum>()
  .innerRadius((arc) => arc.inner)
  .outerRadius((arc) => arc.outer)
  .startAngle((arc) => arc.start)
  .endAngle((arc) => arc.end)
  .padAngle((arc) => DONUT.gap / Math.max(1, Math.hypot(arc.inner, arc.outer)));

function isVisible(arc: ArcLayout): boolean {
  return arc.end - arc.start > MIN_VISIBLE_SPAN;
}

function isSelected(arc: ArcLayout, state: DrawState<ArcLayout>): boolean {
  return state.selected.some((selected) => selected.key === arc.key);
}

/** Angle mapper that grows every arc from the sweep start during the initial reveal. */
function revealAngle(geometry: DonutGeometry, state: DrawState<ArcLayout>): (angle: number) => number {
  return (angle) => geometry.base + (angle - geometry.base) * state.reveal;
}

/** Opacity and fill of a segment (or its label) given the interaction state. */
function look(arc: ArcLayout, state: DrawState<ArcLayout>, theme: Theme): { color: string; opacity: number; active: boolean } {
  const isDimmed = state.highlighted != null && arc.category !== state.highlighted;
  const color = isDimmed ? theme.faded : arc.color;
  let active = true;
  if (state.emphasized != null) active = arc.category === state.emphasized;
  else if (state.selected.length) active = isSelected(arc, state);
  return { color, opacity: active ? 1 : theme.fadeOpacity, active };
}

function centerColor(line: CenterLine, theme: Theme): string {
  if (line.color === 'text') return theme.text;
  if (line.color === 'neutral') return theme.textSecondary;
  return theme[line.color];
}

function formatLeader(points: [number, number][]): string {
  const formatted = points.map((point) => point.map((coordinate) => +coordinate.toFixed(LEADER_PRECISION)).join(','));
  return 'M' + formatted.join('L');
}

function leaderLine(leader: [number, number][], keyPrefix: string, opacity: number, theme: Theme): SceneNode {
  return {
    type: 'path',
    key: `${keyPrefix}-leader`,
    d: formatLeader(leader),
    style: { stroke: theme.textSecondary, strokeWidth: LEADER_STROKE_WIDTH, fill: 'none', opacity },
  };
}

/** Swatch and name, bold percentage, then "n out of total" on three lines. */
function advancedLabel(label: DirectLabel, arc: ArcLayout, keyPrefix: string, top: number, opacity: number, percentColor: string, theme: Theme): SceneNode[] {
  const swatchSize = DONUT.advancedSwatch;
  const nameY = top + labelLineHeight(ADVANCED.name) / 2;
  const percentY = top + labelLineHeight(ADVANCED.name) + labelLineHeight(ADVANCED.value) / 2;
  const detailY = top + labelLineHeight(ADVANCED.name) + labelLineHeight(ADVANCED.value) + labelLineHeight(ADVANCED.detail) / 2;
  return [
    {
      type: 'rect',
      key: `${keyPrefix}-sw`,
      x: label.x,
      y: nameY - swatchSize / 2,
      width: swatchSize,
      height: swatchSize,
      rx: SWATCH_CORNER_RADIUS,
      style: { fill: arc.color, opacity },
    },
    {
      type: 'text',
      key: `${keyPrefix}-n`,
      x: label.x + swatchSize + ADVANCED.gap,
      y: nameY,
      text: label.name,
      font: font(ADVANCED.name),
      baseline: 'middle',
      style: { fill: theme.text, opacity },
    },
    {
      type: 'text',
      key: `${keyPrefix}-p`,
      x: label.x,
      y: percentY,
      text: label.percent,
      font: font(ADVANCED.value, BOLD),
      baseline: 'middle',
      style: { fill: percentColor, opacity },
    },
    {
      type: 'text',
      key: `${keyPrefix}-d`,
      x: label.x,
      y: detailY,
      text: label.detail ?? '',
      font: font(ADVANCED.detail),
      baseline: 'middle',
      style: { fill: theme.textSecondary, opacity },
    },
  ];
}

/** Name over bold percentage, aligned away from the ring. */
function lightweightLabel(label: DirectLabel, keyPrefix: string, top: number, opacity: number, percentColor: string, theme: Theme): SceneNode[] {
  const isRight = label.side === 'right';
  const align = isRight ? 'start' : 'end';
  const x = isRight ? label.x : label.x + label.width;
  return [
    {
      type: 'text',
      key: `${keyPrefix}-n`,
      x,
      y: top + labelLineHeight(LIGHT_LINE.name) / 2,
      text: label.name,
      font: font(LIGHT_LINE.name),
      align,
      baseline: 'middle',
      style: { fill: theme.textSecondary, opacity },
    },
    {
      type: 'text',
      key: `${keyPrefix}-p`,
      x,
      y: top + labelLineHeight(LIGHT_LINE.name) + labelLineHeight(LIGHT_LINE.value) / 2,
      text: label.percent,
      font: font(LIGHT_LINE.value, BOLD),
      align,
      baseline: 'middle',
      style: { fill: percentColor, opacity },
    },
  ];
}

function drawLabel(label: DirectLabel, arc: ArcLayout, state: DrawState<ArcLayout>, theme: Theme): SceneNode[] {
  const { opacity, active } = look(arc, state, theme);
  const isEmphasized = active && (state.emphasized === arc.category || isSelected(arc, state));
  const percentColor = isEmphasized ? arc.color : theme.text;
  const keyPrefix = `label-${label.key}`;
  const nodes: SceneNode[] = [];
  if (label.leader) nodes.push(leaderLine(label.leader, keyPrefix, opacity, theme));
  const top = label.y - label.height / 2;
  if (label.style === 'advanced') nodes.push(...advancedLabel(label, arc, keyPrefix, top, opacity, percentColor, theme));
  else nodes.push(...lightweightLabel(label, keyPrefix, top, opacity, percentColor, theme));
  return nodes;
}

interface BenchmarkTick {
  angle: number;
  /** Inner end of the tick line. */
  start: [number, number];
  /** Outer end of the tick line, where the arrowhead's base sits. */
  end: [number, number];
  /** Radius of the outer end. */
  tipRadius: number;
}

function benchmarkTick(pie: PieLayout, angle: number): BenchmarkTick {
  const tipRadius = pie.outer + DONUT.benchmarkOvershoot;
  return {
    angle,
    start: polar(pie.cx, pie.cy, Math.max(0, pie.inner - BENCHMARK_TICK_INSET), angle),
    end: polar(pie.cx, pie.cy, tipRadius, angle),
    tipRadius,
  };
}

function tickLine(pie: PieLayout, tick: BenchmarkTick, theme: Theme): SceneNode {
  const [x1, y1] = tick.start;
  const [x2, y2] = tick.end;
  return { type: 'line', key: `bench-${pie.index}`, x1, y1, x2, y2, style: { stroke: theme.text, strokeWidth: BENCHMARK_STROKE_WIDTH } };
}

/** Triangle pointing outwards along the tick. */
function arrowHead(pie: PieLayout, tick: BenchmarkTick, theme: Theme): SceneNode {
  const arrowSize = DONUT.benchmarkArrow;
  const [baseX, baseY] = tick.end;
  const [tipX, tipY] = polar(pie.cx, pie.cy, tick.tipRadius + arrowSize, tick.angle);
  const halfWidthX = Math.cos(tick.angle) * (arrowSize / 2);
  const halfWidthY = Math.sin(tick.angle) * (arrowSize / 2);
  return {
    type: 'path',
    key: `bench-arrow-${pie.index}`,
    d: `M${baseX + halfWidthX},${baseY + halfWidthY}L${tipX},${tipY}L${baseX - halfWidthX},${baseY - halfWidthY}Z`,
    style: { fill: theme.text },
  };
}

/** Labels near 12 or 6 o'clock are centred; otherwise they extend away from the ring. */
function benchmarkAlign(angle: number): TextAlign {
  const sin = Math.sin(angle);
  if (Math.abs(sin) < BENCHMARK_CENTER_ZONE) return 'middle';
  return sin > 0 ? 'start' : 'end';
}

function benchmarkLabel(pie: PieLayout, tick: BenchmarkTick, theme: Theme): SceneNode[] {
  const benchmark = pie.benchmark!;
  const [labelX, labelY] = polar(pie.cx, pie.cy, tick.tipRadius + DONUT.benchmarkArrow + BENCHMARK_LABEL_GAP, tick.angle);
  const align = benchmarkAlign(tick.angle);
  const isBelow = Math.cos(tick.angle) < 0;
  const lines: { text: string; bold: boolean }[] = [];
  if (benchmark.label) lines.push({ text: benchmark.label, bold: !benchmark.value });
  if (benchmark.value) lines.push({ text: benchmark.value, bold: true });
  const lineHeight = labelLineHeight(DONUT.benchmarkFont);
  // Below the donut the text hangs down from the arrow; above it the text stacks upwards.
  let y = isBelow ? labelY + lineHeight / 2 : labelY - lineHeight * (lines.length - 0.5);
  return lines.map((line, i) => {
    const node: SceneNode = {
      type: 'text',
      key: `bench-text-${pie.index}-${i}`,
      x: labelX,
      y,
      text: line.text,
      font: font(DONUT.benchmarkFont, line.bold ? BOLD : REGULAR),
      align,
      baseline: 'middle',
      style: { fill: line.bold ? theme.text : theme.textSecondary },
    };
    y += lineHeight;
    return node;
  });
}

function drawBenchmark(pie: PieLayout, theme: Theme): SceneNode[] {
  if (!pie.benchmark) return [];
  const tick = benchmarkTick(pie, pie.benchmark.angle);
  return [tickLine(pie, tick, theme), arrowHead(pie, tick, theme), ...benchmarkLabel(pie, tick, theme)];
}

function drawSegments(pie: PieLayout, state: DrawState<ArcLayout>, reveal: (angle: number) => number, theme: Theme): SceneNode[] {
  const nodes: SceneNode[] = [];
  for (const arc of pie.arcs) {
    if (!isVisible(arc)) continue;
    const { color, opacity } = look(arc, state, theme);
    const path = arcGenerator({ inner: pie.inner, outer: pie.outer, start: reveal(arc.start), end: reveal(arc.end) });
    if (!path) continue;
    nodes.push({ type: 'path', key: `arc-${arc.key}`, d: path, x: pie.cx, y: pie.cy, style: { fill: color, opacity } });
  }
  return nodes;
}

function drawCenterText(pie: PieLayout, theme: Theme): SceneNode[] {
  return pie.center.map((line, i) => ({
    type: 'text',
    key: `center-${pie.index}-${i}`,
    x: pie.cx,
    y: line.y,
    text: line.text,
    font: font(line.size, line.weight),
    align: 'middle',
    baseline: 'middle',
    style: { fill: centerColor(line, theme) },
  }));
}

function drawDirectLabels(pie: PieLayout, state: DrawState<ArcLayout>, theme: Theme): SceneNode[] {
  return pie.labels.flatMap((label) => {
    const arc = pie.arcs.find((candidate) => candidate.key === label.key)!;
    return drawLabel(label, arc, state, theme);
  });
}

function drawFacetLabel(pie: PieLayout, theme: Theme): SceneNode[] {
  if (!pie.facetLabel) return [];
  return [
    {
      type: 'text',
      key: `facet-${pie.index}`,
      x: pie.facetLabel.x,
      y: pie.facetLabel.y,
      text: pie.facetLabel.text,
      font: font(DONUT.facetFont, BOLD),
      align: 'middle',
      baseline: 'middle',
      style: { fill: theme.text },
    },
  ];
}

/** Segments, center text, benchmark, direct labels and facet names. */
export function drawDonutMarks(geometry: DonutGeometry, state: DrawState<ArcLayout>, env: Env): SceneNode[] {
  const theme = env.theme;
  const reveal = revealAngle(geometry, state);
  return geometry.pies.map((pie) => {
    const isRevealed = state.reveal >= 1;
    const nodes: SceneNode[] = [
      ...drawSegments(pie, state, reveal, theme),
      ...drawCenterText(pie, theme),
      ...(isRevealed ? drawBenchmark(pie, theme) : []),
      ...drawDirectLabels(pie, state, theme),
      ...drawFacetLabel(pie, theme),
    ];
    return group(`pie-${pie.index}`, nodes);
  });
}

/** Name and share drawn beside a segment (hover without tooltip, or the selection). */
function valueLabel(key: string, arc: ArcLayout, name: string, value: string, valueColor: string, theme: Theme): SceneNode[] {
  const pie = arc.pie;
  const midAngle = (arc.start + arc.end) / 2;
  const sin = Math.sin(midAngle);
  const upward = -Math.cos(midAngle);
  const size = lightweightSize(name, value);
  const [anchorX, anchorY] = polar(pie.cx, pie.cy, pie.outer + DONUT.labelOffset, midAngle);
  const isRight = sin >= 0;
  // Labels near the top or bottom sit beyond the ring rather than across it.
  const centerY = anchorY + upward * (size.height / 2) * Math.abs(upward);
  const top = centerY - size.height / 2;
  const align = isRight ? 'start' : 'end';
  const halo = theme.background;
  return [
    {
      type: 'text',
      key: `${key}-n`,
      x: anchorX,
      y: top + labelLineHeight(LIGHT_LINE.name) / 2,
      text: name,
      font: font(LIGHT_LINE.name),
      align,
      baseline: 'middle',
      halo,
      style: { fill: theme.textSecondary },
    },
    {
      type: 'text',
      key: `${key}-v`,
      x: anchorX,
      y: top + labelLineHeight(LIGHT_LINE.name) + labelLineHeight(DONUT.hoverLabelFont) / 2,
      text: value,
      font: font(DONUT.hoverLabelFont, BOLD),
      align,
      baseline: 'middle',
      halo,
      style: { fill: valueColor },
    },
  ];
}

function selectionOutline(arc: ArcLayout, reveal: (angle: number) => number, theme: Theme): SceneNode[] {
  const pie = arc.pie;
  const padAngle = DONUT.gap / 2 / Math.max(1, pie.outer);
  const startAngle = reveal(arc.start) + padAngle;
  const endAngle = reveal(arc.end) - padAngle;
  const halo = ringPath(pie.cx, pie.cy, Math.max(0, pie.inner - SELECTION_HALO_OFFSET), pie.outer + SELECTION_HALO_OFFSET, startAngle, endAngle);
  const ring = ringPath(pie.cx, pie.cy, Math.max(0, pie.inner - SELECTION_RING_OFFSET), pie.outer + SELECTION_RING_OFFSET, startAngle, endAngle);
  return [
    { type: 'path', key: `sel-halo-${arc.key}`, d: halo, style: { stroke: theme.background, strokeWidth: DONUT.selectionOuter, fill: 'none' } },
    { type: 'path', key: `sel-${arc.key}`, d: ring, style: { stroke: theme.text, strokeWidth: DONUT.selectionInner, fill: 'none', lineJoin: 'round' } },
  ];
}

/** Value label for the selection (joined names and summed share) or else the hovered segment. */
function singleDonutValueLabel(geometry: DonutGeometry, state: DrawState<ArcLayout>, theme: Theme): SceneNode[] {
  if (state.selected.length) {
    const last = state.selected[state.selected.length - 1];
    const sameDonut = state.selected.filter((arc) => arc.pie === last.pie);
    const name = sameDonut.map((arc) => arc.category).join(' & ');
    const share = sameDonut.reduce((sum, arc) => sum + arc.percent, 0);
    const color = sameDonut.length > 1 ? theme.text : last.color;
    return valueLabel('sel-label', last, name, geometry.formatPercent(share), color, theme);
  }
  if (state.hover && state.hoverLabels) {
    const arc = state.hover.primary;
    return valueLabel('hover-label', arc, arc.category, geometry.formatPercent(arc.percent), arc.color, theme);
  }
  return [];
}

/** Trellis: the hovered category's share above every donut (also on legend hover). */
function facetHoverValues(geometry: DonutGeometry, category: string): SceneNode[] {
  const nodes: SceneNode[] = [];
  for (const pie of geometry.pies) {
    const arc = pie.arcs.find((candidate) => candidate.category === category && candidate.end > candidate.start);
    if (!arc) continue;
    nodes.push({
      type: 'text',
      key: `facet-hover-${arc.key}`,
      x: arc.pie.cx,
      y: arc.pie.hoverY - DONUT.hoverLabelFont / 2,
      text: geometry.formatPercent(arc.percent),
      font: font(DONUT.hoverLabelFont, BOLD),
      align: 'middle',
      baseline: 'middle',
      style: { fill: arc.color },
    });
  }
  return nodes;
}

/** Selection outlines, hover/selection value labels and per-facet hover values. */
export function drawDonutOverlay(geometry: DonutGeometry, state: DrawState<ArcLayout>, env: Env): SceneNode[] {
  const theme = env.theme;
  const reveal = revealAngle(geometry, state);
  const nodes: SceneNode[] = [];
  for (const arc of state.selected) {
    if (!isVisible(arc)) continue;
    nodes.push(...selectionOutline(arc, reveal, theme));
  }
  if (!geometry.labelled && !geometry.trellis) nodes.push(...singleDonutValueLabel(geometry, state, theme));
  const hoveredCategory = state.hover?.primary.category ?? state.emphasized;
  if (geometry.trellis && hoveredCategory != null) nodes.push(...facetHoverValues(geometry, hoveredCategory));
  return nodes;
}
