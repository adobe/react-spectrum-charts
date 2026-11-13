import { arc as d3arc } from 'd3-shape';
import { DONUT } from '../../core/assumptions.js';
import type { DrawState, Env } from '../../core/module.js';
import { font, type Theme } from '../../core/theme.js';
import { group, type SceneNode } from '../../render/scene.js';
import { ADVANCED, LIGHT_LINE, lightweightSize, type DirectLabel } from './labels.js';
import { polar, ringPath, type ArcLayout, type CenterLine, type DonutGeometry, type PieLayout } from './layout.js';

const arcGen = d3arc<{ inner: number; outer: number; start: number; end: number }>()
  .innerRadius((d) => d.inner)
  .outerRadius((d) => d.outer)
  .startAngle((d) => d.start)
  .endAngle((d) => d.end)
  .padAngle((d) => DONUT.gap / Math.max(1, Math.hypot(d.inner, d.outer)));

function lineH(size: number): number {
  return Math.round(size * 1.3);
}

/** Opacity and fill of a segment (or its label) given the interaction state. */
function look(a: ArcLayout, state: DrawState<ArcLayout>, theme: Theme): { color: string; opacity: number; active: boolean } {
  const color = state.highlighted != null && a.category !== state.highlighted ? theme.faded : a.color;
  let active = true;
  if (state.emphasized != null) active = a.category === state.emphasized;
  else if (state.selected.length) active = state.selected.some((s) => s.key === a.key);
  return { color, opacity: active ? 1 : theme.fadeOpacity, active };
}

function centerColor(c: CenterLine, theme: Theme): string {
  return c.color === 'text' ? theme.text : c.color === 'neutral' ? theme.textSecondary : theme[c.color];
}

function drawLabel(l: DirectLabel, a: ArcLayout, state: DrawState<ArcLayout>, theme: Theme): SceneNode[] {
  const { opacity, active } = look(a, state, theme);
  const emph = active && (state.emphasized === a.category || state.selected.some((s) => s.key === a.key));
  const nodes: SceneNode[] = [];
  const k = `label-${l.key}`;
  if (l.leader) {
    nodes.push({
      type: 'path',
      key: `${k}-leader`,
      d: 'M' + l.leader.map((p) => p.map((n) => +n.toFixed(1)).join(',')).join('L'),
      style: { stroke: theme.textSecondary, strokeWidth: 1, fill: 'none', opacity },
    });
  }
  const top = l.y - l.height / 2;
  if (l.style === 'advanced') {
    const s = DONUT.advancedSwatch;
    const y1 = top + lineH(ADVANCED.name) / 2;
    nodes.push({ type: 'rect', key: `${k}-sw`, x: l.x, y: y1 - s / 2, width: s, height: s, rx: 3, style: { fill: a.color, opacity } });
    nodes.push({ type: 'text', key: `${k}-n`, x: l.x + s + ADVANCED.gap, y: y1, text: l.name, font: font(ADVANCED.name), baseline: 'middle', style: { fill: theme.text, opacity } });
    const y2 = top + lineH(ADVANCED.name) + lineH(ADVANCED.value) / 2;
    nodes.push({
      type: 'text',
      key: `${k}-p`,
      x: l.x,
      y: y2,
      text: l.percent,
      font: font(ADVANCED.value, 700),
      baseline: 'middle',
      style: { fill: emph ? a.color : theme.text, opacity },
    });
    const y3 = top + lineH(ADVANCED.name) + lineH(ADVANCED.value) + lineH(ADVANCED.detail) / 2;
    nodes.push({ type: 'text', key: `${k}-d`, x: l.x, y: y3, text: l.detail ?? '', font: font(ADVANCED.detail), baseline: 'middle', style: { fill: theme.textSecondary, opacity } });
  } else {
    const align = l.side === 'right' ? 'start' : 'end';
    const x = l.side === 'right' ? l.x : l.x + l.width;
    nodes.push({ type: 'text', key: `${k}-n`, x, y: top + lineH(LIGHT_LINE.name) / 2, text: l.name, font: font(LIGHT_LINE.name), align, baseline: 'middle', style: { fill: theme.textSecondary, opacity } });
    nodes.push({
      type: 'text',
      key: `${k}-p`,
      x,
      y: top + lineH(LIGHT_LINE.name) + lineH(LIGHT_LINE.value) / 2,
      text: l.percent,
      font: font(LIGHT_LINE.value, 700),
      align,
      baseline: 'middle',
      style: { fill: emph ? a.color : theme.text, opacity },
    });
  }
  return nodes;
}

function drawBenchmark(p: PieLayout, theme: Theme): SceneNode[] {
  const b = p.benchmark;
  if (!b) return [];
  const tipR = p.outer + DONUT.benchmarkOvershoot;
  const [x0, y0] = polar(p.cx, p.cy, Math.max(0, p.inner - 2), b.angle);
  const [x1, y1] = polar(p.cx, p.cy, tipR, b.angle);
  const s = DONUT.benchmarkArrow;
  // Arrowhead pointing outwards along the tick.
  const [ax, ay] = polar(p.cx, p.cy, tipR + s, b.angle);
  const nx = Math.cos(b.angle) * (s / 2);
  const ny = Math.sin(b.angle) * (s / 2);
  const nodes: SceneNode[] = [
    { type: 'line', key: `bench-${p.index}`, x1: x0, y1: y0, x2: x1, y2: y1, style: { stroke: theme.text, strokeWidth: 1.5 } },
    { type: 'path', key: `bench-arrow-${p.index}`, d: `M${x1 + nx},${y1 + ny}L${ax},${ay}L${x1 - nx},${y1 - ny}Z`, style: { fill: theme.text } },
  ];
  const [lx, ly] = polar(p.cx, p.cy, tipR + s + 4, b.angle);
  const sin = Math.sin(b.angle);
  const align = Math.abs(sin) < 0.3 ? 'middle' : sin > 0 ? 'start' : 'end';
  const below = Math.cos(b.angle) < 0;
  const lines: { text: string; bold: boolean }[] = [];
  if (b.label) lines.push({ text: b.label, bold: !b.value });
  if (b.value) lines.push({ text: b.value, bold: true });
  const lh = lineH(DONUT.benchmarkFont);
  let y = below ? ly + lh / 2 : ly - lh * (lines.length - 0.5);
  lines.forEach((l, i) => {
    nodes.push({
      type: 'text',
      key: `bench-text-${p.index}-${i}`,
      x: lx,
      y,
      text: l.text,
      font: font(DONUT.benchmarkFont, l.bold ? 700 : 400),
      align,
      baseline: 'middle',
      style: { fill: l.bold ? theme.text : theme.textSecondary },
    });
    y += lh;
  });
  return nodes;
}

/** Segments, center text, benchmark, direct labels and facet names. */
export function drawDonutMarks(g: DonutGeometry, state: DrawState<ArcLayout>, env: Env): SceneNode[] {
  const theme = env.theme;
  const reveal = (a: number) => g.base + (a - g.base) * state.reveal;
  return g.pies.map((p) => {
    const nodes: SceneNode[] = [];
    for (const a of p.arcs) {
      if (a.end - a.start <= 1e-6) continue;
      const { color, opacity } = look(a, state, theme);
      const d = arcGen({ inner: p.inner, outer: p.outer, start: reveal(a.start), end: reveal(a.end) });
      if (!d) continue;
      nodes.push({ type: 'path', key: `arc-${a.key}`, d, x: p.cx, y: p.cy, style: { fill: color, opacity } });
    }
    p.center.forEach((c, i) => {
      nodes.push({
        type: 'text',
        key: `center-${p.index}-${i}`,
        x: p.cx,
        y: c.y,
        text: c.text,
        font: font(c.size, c.weight),
        align: 'middle',
        baseline: 'middle',
        style: { fill: centerColor(c, theme) },
      });
    });
    if (state.reveal >= 1) nodes.push(...drawBenchmark(p, theme));
    for (const l of p.labels) {
      const a = p.arcs.find((x) => x.key === l.key)!;
      nodes.push(...drawLabel(l, a, state, theme));
    }
    if (p.facetLabel) {
      nodes.push({
        type: 'text',
        key: `facet-${p.index}`,
        x: p.facetLabel.x,
        y: p.facetLabel.y,
        text: p.facetLabel.text,
        font: font(DONUT.facetFont, 700),
        align: 'middle',
        baseline: 'middle',
        style: { fill: theme.text },
      });
    }
    return group(`pie-${p.index}`, nodes);
  });
}

/** Name and share drawn beside a segment (hover without tooltip, or the selection). */
function valueLabel(key: string, a: ArcLayout, name: string, value: string, valueColor: string, theme: Theme): SceneNode[] {
  const p = a.pie;
  const mid = (a.start + a.end) / 2;
  const sin = Math.sin(mid);
  const cos = -Math.cos(mid);
  const size = lightweightSize(name, value);
  const [ax, ay] = polar(p.cx, p.cy, p.outer + DONUT.labelOffset, mid);
  const right = sin >= 0;
  const cy = ay + cos * (size.height / 2) * Math.abs(cos);
  const top = cy - size.height / 2;
  const align = right ? 'start' : 'end';
  const bg = { fill: theme.background };
  return [
    { type: 'text', key: `${key}-n`, x: ax, y: top + lineH(LIGHT_LINE.name) / 2, text: name, font: font(LIGHT_LINE.name), align, baseline: 'middle', halo: bg.fill, style: { fill: theme.textSecondary } },
    {
      type: 'text',
      key: `${key}-v`,
      x: ax,
      y: top + lineH(LIGHT_LINE.name) + lineH(DONUT.hoverLabelFont) / 2,
      text: value,
      font: font(DONUT.hoverLabelFont, 700),
      align,
      baseline: 'middle',
      halo: bg.fill,
      style: { fill: valueColor },
    },
  ];
}

/** Selection outlines, hover/selection value labels and per-facet hover values. */
export function drawDonutOverlay(g: DonutGeometry, state: DrawState<ArcLayout>, env: Env): SceneNode[] {
  const theme = env.theme;
  const nodes: SceneNode[] = [];
  const reveal = (a: number) => g.base + (a - g.base) * state.reveal;
  for (const a of state.selected) {
    const p = a.pie;
    if (a.end - a.start <= 1e-6) continue;
    const pad = DONUT.gap / 2 / Math.max(1, p.outer);
    const a0 = reveal(a.start) + pad;
    const a1 = reveal(a.end) - pad;
    const halo = ringPath(p.cx, p.cy, Math.max(0, p.inner - 1.5), p.outer + 1.5, a0, a1);
    const ring = ringPath(p.cx, p.cy, Math.max(0, p.inner - 3), p.outer + 3, a0, a1);
    nodes.push({ type: 'path', key: `sel-halo-${a.key}`, d: halo, style: { stroke: theme.background, strokeWidth: DONUT.selectionOuter, fill: 'none' } });
    nodes.push({ type: 'path', key: `sel-${a.key}`, d: ring, style: { stroke: theme.text, strokeWidth: DONUT.selectionInner, fill: 'none', lineJoin: 'round' } });
  }

  if (!g.labelled && !g.trellis) {
    if (state.selected.length) {
      const last = state.selected[state.selected.length - 1];
      const same = state.selected.filter((s) => s.pie === last.pie);
      const name = same.map((s) => s.category).join(' & ');
      const share = same.reduce((s, x) => s + x.percent, 0);
      nodes.push(...valueLabel('sel-label', last, name, g.formatPercent(share), same.length > 1 ? theme.text : last.color, theme));
    } else if (state.hover && state.hoverLabels) {
      const a = state.hover.primary;
      nodes.push(...valueLabel('hover-label', a, a.category, g.formatPercent(a.percent), a.color, theme));
    }
  }

  // Trellis: the hovered category's share above every donut (also on legend hover).
  const cat = state.hover?.primary.category ?? state.emphasized;
  if (g.trellis && cat != null) {
    for (const p of g.pies) {
      const a = p.arcs.find((x) => x.category === cat && x.end > x.start);
      if (!a) continue;
      nodes.push({
        type: 'text',
        key: `facet-hover-${a.key}`,
        x: a.pie.cx,
        y: a.pie.hoverY - DONUT.hoverLabelFont / 2,
        text: g.formatPercent(a.percent),
        font: font(DONUT.hoverLabelFont, 700),
        align: 'middle',
        baseline: 'middle',
        style: { fill: a.color },
      });
    }
  }
  return nodes;
}
