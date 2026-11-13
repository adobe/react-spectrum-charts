import { group, triangle, type SceneNode } from '../../render/scene.js';
import { measureText } from '../../util/text.js';
import { INTERACTION } from '../assumptions.js';
import type { AxisHover } from '../module.js';
import { font, type SizeTokens, type Theme } from '../theme.js';
import type { CartesianOptions } from '../types.js';
import { TICK, type CartesianFrame } from './layout.js';

const crisp = (v: number): number => Math.round(v - 0.5) + 0.5;

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Facet titles, ranges, grid, axis labels and titles. Drawn beneath the marks. */
export function drawAxes(frame: CartesianFrame, o: CartesianOptions, theme: Theme, sizes: SizeTokens): SceneNode[] {
  const lh = Math.round(sizes.axisFont * 1.3);
  const axisFont = frame.axisFont;
  return frame.panels.map((panel) => {
    const nodes: SceneNode[] = [];
    const W = panel.width;
    const H = panel.height;

    if (frame.trellis) {
      nodes.push({
        type: 'text',
        key: 'facet-title',
        x: 0,
        y: -frame.facetTitleHeight,
        text: panel.facet,
        font: font(sizes.facetFont, 700),
        baseline: 'top',
        style: { fill: theme.text },
      });
    }

    for (const [i, r] of (o.ranges ?? []).entries()) {
      const axis = r.axis ?? 'x';
      let rect: { x: number; y: number; w: number; h: number } | null = null;
      if (axis === 'x') {
        const a = frame.xValue(r.from);
        const b = frame.xValue(r.to);
        if (a != null && b != null) {
          const x1 = clamp(frame.xScale(Math.min(a, b)), 0, W);
          const x2 = clamp(frame.xScale(Math.max(a, b)), 0, W);
          rect = { x: x1, y: 0, w: x2 - x1, h: H };
        }
      } else {
        const sc = axis === 'y2' && frame.y2 ? frame.y2 : frame.y;
        const a = sc(Number(r.from));
        const b = sc(Number(r.to));
        const y1 = clamp(Math.min(a, b), 0, H);
        const y2 = clamp(Math.max(a, b), 0, H);
        rect = { x: 0, y: y1, w: W, h: y2 - y1 };
      }
      if (!rect) continue;
      nodes.push({
        type: 'rect',
        key: `range-${i}`,
        x: rect.x,
        y: rect.y,
        width: rect.w,
        height: rect.h,
        style: { fill: r.color ?? theme.neutral, opacity: r.color ? 0.12 : 0.1 },
      });
      if (r.label) {
        nodes.push({
          type: 'text',
          key: `range-label-${i}`,
          x: rect.x + 6,
          y: rect.y + 6,
          text: r.label,
          font: font(sizes.axisFont),
          baseline: 'top',
          style: { fill: theme.textSecondary },
        });
      }
    }

    if (frame.showYAxis) {
      const showGrid = o.yAxis?.grid ?? true;
      for (const tk of frame.yTicks) {
        const atBottom = Math.abs(tk.pos - H) < 0.5;
        if (showGrid && !(atBottom && frame.showXAxis)) {
          nodes.push({
            type: 'line',
            key: `grid-${tk.value}`,
            x1: 0,
            x2: W,
            y1: crisp(tk.pos),
            y2: crisp(tk.pos),
            style: { stroke: tk.value === 0 ? theme.tick : theme.grid, strokeWidth: 1 },
          });
        }
        if (panel.showYLabels) {
          const right = frame.yPosition === 'right';
          nodes.push({
            type: 'text',
            key: `ylabel-${tk.value}`,
            x: right ? W + 8 : -8,
            y: tk.pos,
            text: tk.label,
            font: axisFont,
            align: right ? 'start' : 'end',
            baseline: 'middle',
            style: { fill: theme.axisLabel },
          });
        }
      }
      if (frame.y2 && panel.showYLabels) {
        const right = frame.yPosition !== 'right';
        for (const tk of frame.y2Ticks) {
          nodes.push({
            type: 'text',
            key: `y2label-${tk.value}`,
            x: right ? W + 8 : -8,
            y: tk.pos,
            text: tk.label,
            font: axisFont,
            align: right ? 'start' : 'end',
            baseline: 'middle',
            style: { fill: theme.axisLabel },
          });
        }
      }
      const titles: [string | undefined, 'left' | 'right', { label: string }[], string][] = [
        [o.yAxis?.title, frame.yPosition, frame.yTicks, 'ytitle'],
        [frame.y2 ? o.y2Axis?.title : undefined, frame.yPosition === 'right' ? 'left' : 'right', frame.y2Ticks, 'y2title'],
      ];
      for (const [title, side, ticks, key] of titles) {
        if (!title || !panel.showYLabels) continue;
        const labelW = ticks.length ? Math.max(...ticks.map((t) => measureText(t.label, axisFont))) : 0;
        const off = 8 + labelW + 8 + lh / 2;
        nodes.push({
          type: 'text',
          key,
          x: side === 'right' ? W + off : -off,
          y: H / 2,
          text: title,
          font: axisFont,
          align: 'middle',
          baseline: 'middle',
          rotate: -90,
          style: { fill: theme.axisLabel },
        });
      }
    }

    if (frame.showXAxis) {
      nodes.push({
        type: 'line',
        key: 'baseline',
        x1: 0,
        x2: W,
        y1: crisp(H),
        y2: crisp(H),
        style: { stroke: theme.baseline, strokeWidth: 1.5 },
      });
      const showTicks = o.xAxis?.tickMarks ?? true;
      for (const tk of frame.xTicks) {
        if (showTicks) {
          nodes.push({
            type: 'line',
            key: `xtick-${tk.value}`,
            x1: crisp(tk.pos),
            x2: crisp(tk.pos),
            y1: H,
            y2: H + TICK,
            style: { stroke: theme.baseline, strokeWidth: 1 },
          });
        }
        if (!panel.showXLabels) continue;
        nodes.push({
          type: 'text',
          key: `xlabel-${tk.value}`,
          x: tk.pos,
          y: H + TICK + 4,
          text: tk.label,
          font: axisFont,
          align: 'middle',
          baseline: 'top',
          style: { fill: theme.axisLabel },
        });
        if (tk.superLabel) {
          nodes.push({
            type: 'text',
            key: `xsuper-${tk.value}`,
            x: tk.pos,
            y: H + TICK + 4 + lh,
            text: tk.superLabel,
            font: axisFont,
            align: 'middle',
            baseline: 'top',
            style: { fill: theme.axisLabel },
          });
        }
      }
      if (o.xAxis?.title && panel.showXLabels) {
        const hasSuper = frame.xTicks.some((t) => t.superLabel);
        nodes.push({
          type: 'text',
          key: 'xtitle',
          x: W / 2,
          y: H + TICK + 4 + lh * (hasSuper ? 2 : 1) + 8,
          text: o.xAxis.title,
          font: axisFont,
          align: 'middle',
          baseline: 'top',
          style: { fill: theme.axisLabel },
        });
      }
    }
    return group(`axes-${panel.index}`, nodes, { x: panel.x, y: panel.y });
  });
}

/** Reference lines, drawn above the marks. */
export function drawReferenceLines(frame: CartesianFrame, o: CartesianOptions, theme: Theme, sizes: SizeTokens): SceneNode[] {
  const refs = o.referenceLines ?? [];
  if (!refs.length) return [];
  return frame.panels.map((panel) => {
    const nodes: SceneNode[] = [];
    const W = panel.width;
    const H = panel.height;
    for (const [i, r] of refs.entries()) {
      const axis = r.axis ?? 'y';
      const primary = r.kind === 'primary';
      const color = theme.reference;
      const sw = primary ? 2 : 1;
      const labelFont = primary ? font(sizes.axisFont + 2, 700) : font(sizes.axisFont);
      if (axis === 'x') {
        const v = frame.xValue(r.value);
        if (v == null) continue;
        const px = frame.xScale(v);
        if (px < -1 || px > W + 1) continue;
        nodes.push({ type: 'line', key: `ref-${i}`, x1: crisp(px), x2: crisp(px), y1: 0, y2: H, style: { stroke: color, strokeWidth: sw } });
        if (primary) nodes.push(triangle(`ref-${i}-a`, px, 0, 'down', color), triangle(`ref-${i}-b`, px, H, 'up', color));
        if (r.label) {
          nodes.push({
            type: 'text',
            key: `ref-label-${i}`,
            x: px + 6,
            y: 2,
            text: r.label,
            font: labelFont,
            baseline: 'top',
            halo: theme.background,
            style: { fill: theme.text },
          });
        }
      } else {
        const sc = axis === 'y2' && frame.y2 ? frame.y2 : frame.y;
        const py = sc(Number(r.value));
        if (!Number.isFinite(py) || py < -1 || py > H + 1) continue;
        nodes.push({ type: 'line', key: `ref-${i}`, x1: 0, x2: W, y1: crisp(py), y2: crisp(py), style: { stroke: color, strokeWidth: sw } });
        if (primary) nodes.push(triangle(`ref-${i}-a`, 0, py, 'right', color), triangle(`ref-${i}-b`, W, py, 'left', color));
        if (r.label) {
          nodes.push({
            type: 'text',
            key: `ref-label-${i}`,
            x: W,
            y: py + 6,
            text: r.label,
            font: labelFont,
            align: 'end',
            baseline: 'top',
            halo: theme.background,
            style: { fill: theme.text },
          });
        }
      }
    }
    return group(`refs-${panel.index}`, nodes, { x: panel.x, y: panel.y });
  });
}

/**
 * Bold x label for the hovered value. The other x labels are dimmed with a veil in the background
 * color, so the axes layer itself doesn't have to be redrawn on hover.
 */
export function drawAxisHover(frame: CartesianFrame, h: AxisHover, theme: Theme, sizes: SizeTokens): SceneNode[] {
  const panel = frame.panels[h.panel];
  if (!panel || !frame.showXAxis || !panel.showXLabels) return [];
  const W = panel.width;
  const H = panel.height;
  const lh = Math.round(sizes.axisFont * 1.3);
  const rows = frame.xTicks.some((t) => t.superLabel) ? 2 : 1;
  const bold = font(sizes.axisFont, 700);
  const w = measureText(h.label, bold);
  const px = clamp(h.x, w / 2 - 4, W + 4 - w / 2);
  const labelW = frame.xTicks.length ? Math.max(...frame.xTicks.map((t) => measureText(t.label, frame.axisFont))) : 0;
  return [
    group(
      `xhover-${panel.index}`,
      [
        {
          type: 'rect',
          key: 'veil',
          x: -labelW / 2 - 2,
          y: H + TICK + 2,
          width: W + labelW + 4,
          height: lh * rows + 4,
          style: { fill: theme.background, opacity: INTERACTION.axisLabelVeil },
        },
        {
          type: 'rect',
          key: 'bg',
          x: px - w / 2 - 4,
          y: H + TICK + 2,
          width: w + 8,
          height: lh + 4,
          style: { fill: theme.background },
        },
        {
          type: 'text',
          key: 'label',
          x: px,
          y: H + TICK + 4,
          text: h.label,
          font: bold,
          align: 'middle',
          baseline: 'top',
          style: { fill: theme.text },
        },
      ],
      { x: panel.x, y: panel.y },
    ),
  ];
}
