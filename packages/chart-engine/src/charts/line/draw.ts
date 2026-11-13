import { area as d3area, curveLinear, curveMonotoneX, line as d3line, type CurveFactory } from 'd3-shape';
import type { DrawState, Env } from '../../core/module.js';
import { font, type SizeTokens, type Theme } from '../../core/theme.js';
import { dashFor, group, shapePath, type SceneNode, type Style } from '../../render/scene.js';
import { resolveVertical } from '../../util/labels.js';
import { linearRegression } from '../../util/stats.js';
import { measureText } from '../../util/text.js';
import type { LineHit } from './hit.js';
import { itemsAt } from './hit.js';
import { resolveDirect, type LineGeometry, type LinePanel, type ScreenPoint, type SeriesLayout } from './layout.js';
import type { LineChartOptions } from './types.js';

const crisp = (v: number): number => Math.round(v - 0.5) + 0.5;

/** Legend keys may name a series or a whole color group. */
const isKey = (sl: SeriesLayout, k: string): boolean => k === sl.s.key || k === sl.s.colorKey;

interface Run {
  estimated: boolean;
  pts: ScreenPoint[];
}

/** Split a line into contiguous runs, breaking at nulls and where the estimated state changes. */
export function segmentRuns(pts: ScreenPoint[]): Run[] {
  const runs: Run[] = [];
  let cur: Run | null = null;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if (a.y == null || b.y == null) {
      cur = null;
      continue;
    }
    const est = a.p.estimated || b.p.estimated;
    if (!cur || cur.estimated !== est) {
      cur = { estimated: est, pts: [a] };
      runs.push(cur);
    }
    cur.pts.push(b);
  }
  return runs;
}

const lastPoint = (sl: SeriesLayout): ScreenPoint | undefined => {
  for (let i = sl.pts.length - 1; i >= 0; i--) if (sl.pts[i].y != null) return sl.pts[i];
  return undefined;
};
const firstPoint = (sl: SeriesLayout): ScreenPoint | undefined => sl.pts.find((p) => p.y != null);

/** Lines, areas, points, trendlines, annotations and direct labels. */
export function drawLineMarks(g: LineGeometry, state: DrawState<LineHit>, env: Env, o: LineChartOptions): SceneNode[] {
  return g.panels.map((panel) => group(`p${panel.index}`, panelMarks(g, panel, state, env, o), { x: panel.x, y: panel.y }));
}

function panelMarks(g: LineGeometry, panel: LinePanel, state: DrawState<LineHit>, env: Env, o: LineChartOptions): SceneNode[] {
  const { theme, sizes } = env;
  const frame = g.frame;
  const nodes: SceneNode[] = [];
  const W = panel.width;
  const H = panel.height;
  const curve: CurveFactory = o.curve === 'monotone' ? curveMonotoneX : curveLinear;
  const hoverMode = state.hover?.mode ?? null;
  const focus = state.emphasized;
  const lw = g.lineWidth;
  const rank = (sl: SeriesLayout): number => {
    if (state.highlighted) return isKey(sl, state.highlighted) ? 2 : 0;
    if (focus) return isKey(sl, focus) ? 2 : 1;
    return 1;
  };
  const fade = (sl: SeriesLayout): number => (focus && !isKey(sl, focus) ? theme.fadeOpacity : 1);

  const seriesNodes: SceneNode[] = [];
  const pointNodes: SceneNode[] = [];
  for (const sl of [...panel.series].sort((a, b) => rank(a) - rank(b))) {
    const key = sl.s.id;
    const grayed = state.highlighted != null && !isKey(sl, state.highlighted);
    const color = grayed ? theme.faded : sl.color;
    const opacity = (sl.entering ? state.enter : 1) * fade(sl);
    let width = lw;
    if (hoverMode === 'point' && focus != null && isKey(sl, focus)) width = lw + 1;
    else if (hoverMode === 'x') width = lw + 0.5;

    if (sl.s.area && !grayed) {
      const defined = sl.pts.filter((p) => p.y != null);
      if (defined.length) {
        const peak = Math.min(...defined.map((p) => p.y!));
        const area = d3area<ScreenPoint>()
          .defined((p) => p.y != null)
          .x((p) => p.x)
          .y0(H)
          .y1((p) => p.y!)
          .curve(curve);
        seriesNodes.push({
          type: 'path',
          key: `area-${key}`,
          d: area(sl.pts) ?? '',
          style: {
            fill: {
              y1: peak,
              y2: H + 8,
              stops: [
                { offset: 0, color, opacity: theme.areaOpacity * 2 },
                { offset: 1, color, opacity: 0 },
              ],
            },
            opacity,
          },
        });
      }
    }
    const runs = segmentRuns(sl.pts);
    const gen = d3line<ScreenPoint>()
      .x((p) => p.x)
      .y((p) => p.y!)
      .curve(curve);
    const pathFor = (est: boolean): string =>
      runs
        .filter((r) => r.estimated === est)
        .map((r) => gen(r.pts) ?? '')
        .join('');
    const solid = pathFor(false);
    const est = pathFor(true);
    const base: Style = { stroke: color, strokeWidth: width, lineJoin: 'round', lineCap: 'round', opacity };
    if (solid) {
      seriesNodes.push({
        type: 'path',
        key: `line-${key}`,
        d: solid,
        style: { ...base, dash: dashFor(sl.s.lineStyle, width), lineCap: sl.s.lineStyle === 'dashed' ? 'butt' : 'round' },
      });
    }
    if (est) seriesNodes.push({ type: 'path', key: `est-${key}`, d: est, style: { ...base, dash: dashFor('dotted', width) } });

    // Points: always for isolated values, all of them when sparse or requested.
    const nonNull = sl.pts.filter((p) => p.y != null);
    const spacing = nonNull.length > 1 ? W / (nonNull.length - 1) : Infinity;
    const mode = o.points ?? 'auto';
    const gaps = sl.pts.some((p) => p.y == null);
    const showAll = mode === 'all' || (mode === 'auto' && (spacing >= 32 || gaps) && nonNull.length <= 400);
    if (mode !== 'none') {
      sl.pts.forEach((p, i) => {
        if (p.y == null) return;
        const isolated = sl.pts[i - 1]?.y == null && sl.pts[i + 1]?.y == null;
        if (!showAll && !isolated && !o.shapes) return;
        pointNodes.push({
          type: 'path',
          key: `pt-${key}-${p.p.index}`,
          d: shapePath(sl.s.shape, sizes.pointRadius),
          x: p.x,
          y: p.y,
          style: {
            fill: p.p.estimated ? theme.background : color,
            stroke: p.p.estimated ? color : theme.background,
            strokeWidth: 1.5,
            opacity,
          },
        });
      });
    }
  }

  if (o.trendline) {
    const tOpts = typeof o.trendline === 'object' ? o.trendline : {};
    for (const sl of panel.series.filter((s) => !tOpts.series || s.s.key === tOpts.series)) {
      const pts = sl.pts.filter((p) => p.y != null).map((p) => ({ x: p.x, y: p.y! }));
      const fit = linearRegression(pts);
      if (!fit) continue;
      const x1 = pts[0].x;
      const x2 = pts[pts.length - 1].x;
      seriesNodes.push({
        type: 'line',
        key: `trend-${sl.s.id}`,
        x1,
        x2,
        y1: fit.intercept + fit.slope * x1,
        y2: fit.intercept + fit.slope * x2,
        style: { stroke: theme.reference, strokeWidth: 1.5, opacity: fade(sl) },
      });
    }
  }

  // The initial reveal wipes the lines in from the left.
  const m = lw * 2 + sizes.pointRadius + 2;
  nodes.push(group('series', [...seriesNodes, ...pointNodes], { clip: { x: -m, y: -m - 40, width: W * state.reveal + 2 * m, height: H + 2 * m + 40 } }));

  const lh = Math.round(sizes.axisFont * 1.3);
  for (const [i, a] of (o.annotations ?? []).entries()) {
    const xv = frame.xValue(a.x);
    if (xv == null) continue;
    let py: number | null;
    if (a.y != null) py = frame.y(a.y);
    else {
      const sl = panel.series.find((s) => !a.series || s.s.key === a.series);
      py = sl?.pts.find((p) => p.p.x === xv)?.y ?? null;
    }
    if (py == null) continue;
    const px = frame.xScale(xv);
    if (px < -1 || px > W + 1) continue;
    const top = Math.max(lh, py - 28);
    const side = a.side ?? (px > W * 0.66 ? 'left' : 'right');
    nodes.push(
      { type: 'line', key: `ann-line-${i}`, x1: crisp(px), x2: crisp(px), y1: top, y2: py - 6, style: { stroke: theme.text, strokeWidth: 1 } },
      { type: 'circle', key: `ann-dot-${i}`, cx: px, cy: py, r: 4, style: { fill: theme.background, stroke: theme.text, strokeWidth: 1.5 } },
      {
        type: 'text',
        key: `ann-text-${i}`,
        x: side === 'right' ? px + 4 : px - 4,
        y: top,
        text: a.text,
        font: font(sizes.axisFont, 700),
        align: side === 'right' ? 'start' : 'end',
        baseline: 'top',
        halo: theme.background,
        style: { fill: theme.text },
      },
    );
  }

  nodes.push(...directLabels(g, panel, state, env, o));
  return nodes;
}

function directLabels(g: LineGeometry, panel: LinePanel, state: DrawState<LineHit>, env: Env, o: LineChartOptions): SceneNode[] {
  const { theme, sizes } = env;
  const frame = g.frame;
  const nodes: SceneNode[] = [];
  const direct = resolveDirect(o);
  const W = panel.width;
  const H = panel.height;
  const lw = g.lineWidth;
  const focus = state.emphasized;
  const labelOpacity = state.reveal >= 1 ? 1 : 0;
  const labelFont = font(sizes.labelFont, 700);
  const labelH = Math.round(sizes.labelFont * 1.2);
  const marked = new Set<string>();
  if (direct.category || direct.value) {
    const outside = direct.category === 'end' ? frame.yPosition === 'left' || !frame.showYAxis : direct.category === 'start';
    // When color and series differ (e.g. browser × year), label each color group once, preferring its solid line.
    const byColor = o.color != null && panel.series.some((sl) => sl.s.colorKey !== sl.s.key);
    const labelled = byColor
      ? Array.from(
          panel.series
            .filter((sl) => direct.include(sl.s.colorKey) || direct.include(sl.s.key))
            .reduce((acc, sl) => {
              const cur = acc.get(sl.s.colorKey);
              if (!cur || (cur.s.lineStyle !== 'solid' && sl.s.lineStyle === 'solid')) acc.set(sl.s.colorKey, sl);
              return acc;
            }, new Map<string, SeriesLayout>())
            .values(),
        )
      : panel.series.filter((sl) => direct.include(sl.s.key));
    const entries = labelled.flatMap((sl) => {
      const pt = direct.category === 'start' ? firstPoint(sl) : lastPoint(sl);
      if (!pt) return [];
      const parts: string[] = [];
      if (direct.category) parts.push(byColor ? sl.s.colorKey : sl.s.key);
      if (direct.value && direct.category !== 'start') parts.push(frame.formatY(pt.value, sl.s.axis));
      return [{ sl, pt, text: parts.join(' ') }];
    });
    const r = sizes.pointRadius;
    const pos = resolveVertical(
      entries.map((e) => ({ id: e.sl.s.id, y: outside ? e.pt.y! : e.pt.y! - (direct.value ? r + 2 : 4) - labelH / 2, height: labelH })),
      outside || frame.trellis ? -labelH / 2 : -panel.y + 2,
      H + (outside ? labelH / 2 : 0),
    );
    for (const e of entries) {
      const grayed = state.highlighted != null && !isKey(e.sl, state.highlighted);
      const color = grayed ? theme.neutral : e.sl.color;
      let op = labelOpacity * (e.sl.entering ? state.enter : 1);
      if (focus && !isKey(e.sl, focus)) op *= theme.fadeOpacity;
      if (direct.value) {
        marked.add(e.sl.s.id);
        nodes.push({
          type: 'circle',
          key: `endmark-${e.sl.s.id}`,
          cx: e.pt.x,
          cy: e.pt.y!,
          r,
          style: { fill: theme.background, stroke: color, strokeWidth: Math.max(1.5, lw * 0.75), opacity: op },
        });
      }
      let x: number;
      let align: 'start' | 'end';
      if (direct.category === 'start') {
        x = e.pt.x - 8;
        align = 'end';
      } else if (outside) {
        x = e.pt.x + (direct.value ? r + 6 : 8);
        align = 'start';
      } else {
        x = e.pt.x + (direct.value ? r : 0);
        align = 'end';
      }
      nodes.push({
        type: 'text',
        key: `dlabel-${e.sl.s.id}`,
        x,
        y: pos.get(e.sl.s.id) ?? e.pt.y!,
        text: e.text,
        font: labelFont,
        align,
        baseline: 'middle',
        halo: theme.background,
        style: { fill: color, opacity: op },
      });
    }
  }
  if (o.endMarker) {
    for (const sl of panel.series) {
      const pt = lastPoint(sl);
      if (!pt || marked.has(sl.s.id)) continue;
      nodes.push({
        type: 'circle',
        key: `endmark-${sl.s.id}`,
        cx: pt.x,
        cy: pt.y!,
        r: sizes.pointRadius - 0.5,
        style: { fill: theme.background, stroke: sl.color, strokeWidth: Math.max(1.5, lw) },
      });
    }
  }
  if (o.trailingLabel) {
    const markerRoom = o.endMarker ? Math.ceil(sizes.pointRadius + lw) : 0;
    nodes.push({
      type: 'text',
      key: 'trailing',
      x: W + markerRoom + 8,
      y: H / 2,
      text: o.trailingLabel,
      font: labelFont,
      baseline: 'middle',
      style: { fill: theme.text },
    });
  }
  return nodes;
}

/** Crosshair and hover/selection markers. Redrawn on every hover change; nothing else is. */
export function drawLineOverlay(g: LineGeometry, state: DrawState<LineHit>, env: Env): SceneNode[] {
  const { theme, sizes } = env;
  return g.panels.map((panel) => {
    const nodes: SceneNode[] = [];
    const hover = state.hover;
    if (hover) {
      const px = hover.primary.pt.x;
      nodes.push({ type: 'line', key: 'crosshair', x1: crisp(px), x2: crisp(px), y1: 0, y2: panel.height, style: { stroke: theme.crosshair, strokeWidth: 1 } });
      let hits: LineHit[];
      if (hover.mode === 'x' || g.frame.trellis) {
        hits = itemsAt(panel, px);
        if (hover.mode === 'point' && !hits.length) hits = hover.items.filter((h) => h.panel.index === panel.index);
      } else hits = hover.items.filter((h) => h.panel.index === panel.index);
      nodes.push(...markers(hits, 'hover', theme, sizes, g, state.hoverLabels, panel.width));
    }
    const sel = state.selected.filter((s) => s.panel.index === panel.index);
    nodes.push(...markers(sel, 'sel', theme, sizes, g, true, panel.width));
    return group(`p${panel.index}`, nodes, { x: panel.x, y: panel.y });
  });
}

function markers(hits: LineHit[], prefix: string, theme: Theme, sizes: SizeTokens, g: LineGeometry, labels: boolean, W: number): SceneNode[] {
  const out: SceneNode[] = [];
  const valueFont = font(sizes.labelFont - 2, 700);
  const lh = Math.round((sizes.labelFont - 2) * 1.2);
  const r = sizes.pointRadius + 1;
  const texts = hits.map((h) => {
    const v = g.frame.formatY(h.pt.value, h.series.s.axis);
    return h.pt.p.estimated ? `${v} (estimated)` : v;
  });
  const positions = resolveVertical(
    hits.map((h, i) => ({ id: String(i), y: h.pt.y!, height: lh })),
    -lh,
    g.frame.plotHeight + lh,
  );
  hits.forEach((h, i) => {
    const key = `${prefix}-${h.series.s.id}-${h.pt.p.index}`;
    out.push({ type: 'circle', key: `${key}-dot`, cx: h.pt.x, cy: h.pt.y!, r, style: { fill: h.series.color, stroke: theme.background, strokeWidth: 2 } });
    if (!labels) return;
    const w = measureText(texts[i], valueFont);
    const flip = h.pt.x + r + 6 + w > W + 4;
    out.push({
      type: 'text',
      key: `${key}-label`,
      x: flip ? h.pt.x - r - 6 : h.pt.x + r + 6,
      y: positions.get(String(i)) ?? h.pt.y!,
      text: texts[i],
      font: valueFont,
      align: flip ? 'end' : 'start',
      baseline: 'middle',
      halo: theme.background,
      style: { fill: h.series.color },
    });
  });
  return out;
}
