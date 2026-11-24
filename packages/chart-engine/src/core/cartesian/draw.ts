import { group, triangle, type SceneNode } from '../../render/scene.js';
import { measureText } from '../../util/text.js';
import { INTERACTION } from '../assumptions.js';
import type { AxisHover } from '../module.js';
import { font, type SizeTokens, type Theme } from '../theme.js';
import type { CartesianOptions, RangeOptions, ReferenceLineOptions } from '../types.js';
import { TICK, axisLineHeight, type CartesianFrame, type PanelFrame } from './layout.js';
import type { Tick } from './ticks.js';

const BOLD = 700;
/** Space between y labels and the plot edge, and between y labels and the y title. */
const Y_LABEL_GAP = 8;
/** Space between the end of an x tick mark and its label. */
const TICK_LABEL_GAP = 4;
/** Space between the x labels and the x title. */
const X_TITLE_GAP = 8;
/** Tolerance for treating a gridline as lying on the x baseline. */
const BASELINE_TOLERANCE = 0.5;
const GRID_STROKE_WIDTH = 1;
const TICK_STROKE_WIDTH = 1;
const BASELINE_STROKE_WIDTH = 1.5;
const RANGE_OPACITY = 0.1;
const COLORED_RANGE_OPACITY = 0.12;
/** Range label offset from the range's top-left corner. */
const RANGE_LABEL_INSET = 6;
const REFERENCE_STROKE_WIDTH = 1;
const PRIMARY_REFERENCE_STROKE_WIDTH = 2;
/** Primary reference labels are this much larger than the axis font. */
const PRIMARY_REFERENCE_FONT_INCREASE = 2;
/** How far outside the plot a reference line may fall and still be drawn. */
const REFERENCE_VISIBLE_SLACK = 1;
/** Reference label offset from its line. */
const REFERENCE_LABEL_OFFSET = 6;
/** Top inset of labels on vertical reference lines. */
const X_REFERENCE_LABEL_TOP = 2;
/** Padding around the bold hovered x label's background. */
const HOVER_LABEL_PAD = 4;
/** Padding around the veil that dims the other x labels. */
const HOVER_VEIL_PAD = 2;

type RangeRect = { x: number; y: number; width: number; height: number };

/** Snaps a coordinate to the pixel grid's centre so 1px lines render sharply. */
const crisp = (value: number): number => Math.round(value - 0.5) + 0.5;

function clamp(value: number, low: number, high: number): number {
  if (value < low) return low;
  if (value > high) return high;
  return value;
}

function widestLabel(ticks: { label: string }[], labelFont: string): number {
  return ticks.length ? Math.max(...ticks.map((tick) => measureText(tick.label, labelFont))) : 0;
}

function facetTitle(frame: CartesianFrame, panel: PanelFrame, theme: Theme, sizes: SizeTokens): SceneNode {
  return {
    type: 'text',
    key: 'facet-title',
    x: 0,
    y: -frame.facetTitleHeight,
    text: panel.facet,
    font: font(sizes.facetFont, BOLD),
    baseline: 'top',
    style: { fill: theme.text },
  };
}

/** Panel-space rectangle covered by a range, or null when an x bound can't be placed. */
function rangeRect(frame: CartesianFrame, range: RangeOptions, width: number, height: number): RangeRect | null {
  const axis = range.axis ?? 'x';
  if (axis === 'x') {
    const from = frame.xValue(range.from);
    const to = frame.xValue(range.to);
    if (from == null || to == null) return null;
    const x1 = clamp(frame.xScale(Math.min(from, to)), 0, width);
    const x2 = clamp(frame.xScale(Math.max(from, to)), 0, width);
    return { x: x1, y: 0, width: x2 - x1, height };
  }
  const scale = axis === 'y2' && frame.y2 ? frame.y2 : frame.y;
  const from = scale(Number(range.from));
  const to = scale(Number(range.to));
  const y1 = clamp(Math.min(from, to), 0, height);
  const y2 = clamp(Math.max(from, to), 0, height);
  return { x: 0, y: y1, width, height: y2 - y1 };
}

function rangeNodes(frame: CartesianFrame, options: CartesianOptions, panel: PanelFrame, theme: Theme, sizes: SizeTokens): SceneNode[] {
  const nodes: SceneNode[] = [];
  for (const [i, range] of (options.ranges ?? []).entries()) {
    const rect = rangeRect(frame, range, panel.width, panel.height);
    if (!rect) continue;
    nodes.push({
      type: 'rect',
      key: `range-${i}`,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      style: { fill: range.color ?? theme.neutral, opacity: range.color ? COLORED_RANGE_OPACITY : RANGE_OPACITY },
    });
    if (range.label) {
      nodes.push({
        type: 'text',
        key: `range-label-${i}`,
        x: rect.x + RANGE_LABEL_INSET,
        y: rect.y + RANGE_LABEL_INSET,
        text: range.label,
        font: font(sizes.axisFont),
        baseline: 'top',
        style: { fill: theme.textSecondary },
      });
    }
  }
  return nodes;
}

function gridline(tick: Tick, width: number, theme: Theme): SceneNode {
  return {
    type: 'line',
    key: `grid-${tick.value}`,
    x1: 0,
    x2: width,
    y1: crisp(tick.pos),
    y2: crisp(tick.pos),
    style: { stroke: tick.value === 0 ? theme.tick : theme.grid, strokeWidth: GRID_STROKE_WIDTH },
  };
}

function yLabel(key: string, tick: Tick, onRight: boolean, width: number, frame: CartesianFrame, theme: Theme): SceneNode {
  return {
    type: 'text',
    key,
    x: onRight ? width + Y_LABEL_GAP : -Y_LABEL_GAP,
    y: tick.pos,
    text: tick.label,
    font: frame.axisFont,
    align: onRight ? 'start' : 'end',
    baseline: 'middle',
    style: { fill: theme.axisLabel },
  };
}

/** Gridlines and labels for the primary y axis, interleaved per tick. */
function yTickNodes(frame: CartesianFrame, options: CartesianOptions, panel: PanelFrame, theme: Theme): SceneNode[] {
  const nodes: SceneNode[] = [];
  const showGrid = options.yAxis?.grid ?? true;
  const onRight = frame.yPosition === 'right';
  for (const tick of frame.yTicks) {
    const atBottom = Math.abs(tick.pos - panel.height) < BASELINE_TOLERANCE;
    if (showGrid && !(atBottom && frame.showXAxis)) nodes.push(gridline(tick, panel.width, theme));
    if (panel.showYLabels) nodes.push(yLabel(`ylabel-${tick.value}`, tick, onRight, panel.width, frame, theme));
  }
  return nodes;
}

function y2LabelNodes(frame: CartesianFrame, panel: PanelFrame, theme: Theme): SceneNode[] {
  if (!frame.y2 || !panel.showYLabels) return [];
  const onRight = frame.yPosition !== 'right';
  return frame.y2Ticks.map((tick) => yLabel(`y2label-${tick.value}`, tick, onRight, panel.width, frame, theme));
}

function yTitleNodes(frame: CartesianFrame, options: CartesianOptions, panel: PanelFrame, theme: Theme, sizes: SizeTokens): SceneNode[] {
  if (!panel.showYLabels) return [];
  const lineHeight = axisLineHeight(sizes.axisFont);
  const y2Side = frame.yPosition === 'right' ? 'left' : 'right';
  const titles: [string | undefined, 'left' | 'right', { label: string }[], string][] = [
    [options.yAxis?.title, frame.yPosition, frame.yTicks, 'ytitle'],
    [frame.y2 ? options.y2Axis?.title : undefined, y2Side, frame.y2Ticks, 'y2title'],
  ];
  const nodes: SceneNode[] = [];
  for (const [title, side, ticks, key] of titles) {
    if (!title) continue;
    const labelWidth = widestLabel(ticks, frame.axisFont);
    const offset = Y_LABEL_GAP + labelWidth + Y_LABEL_GAP + lineHeight / 2;
    nodes.push({
      type: 'text',
      key,
      x: side === 'right' ? panel.width + offset : -offset,
      y: panel.height / 2,
      text: title,
      font: frame.axisFont,
      align: 'middle',
      baseline: 'middle',
      rotate: -90,
      style: { fill: theme.axisLabel },
    });
  }
  return nodes;
}

function xLabel(key: string, text: string, x: number, y: number, frame: CartesianFrame, theme: Theme): SceneNode {
  return { type: 'text', key, x, y, text, font: frame.axisFont, align: 'middle', baseline: 'top', style: { fill: theme.axisLabel } };
}

/** Tick mark, label and super label for each x tick. */
function xTickNodes(frame: CartesianFrame, options: CartesianOptions, panel: PanelFrame, theme: Theme, lineHeight: number): SceneNode[] {
  const nodes: SceneNode[] = [];
  const height = panel.height;
  const showTicks = options.xAxis?.tickMarks ?? true;
  for (const tick of frame.xTicks) {
    if (showTicks) {
      nodes.push({
        type: 'line',
        key: `xtick-${tick.value}`,
        x1: crisp(tick.pos),
        x2: crisp(tick.pos),
        y1: height,
        y2: height + TICK,
        style: { stroke: theme.baseline, strokeWidth: TICK_STROKE_WIDTH },
      });
    }
    if (!panel.showXLabels) continue;
    const labelY = height + TICK + TICK_LABEL_GAP;
    nodes.push(xLabel(`xlabel-${tick.value}`, tick.label, tick.pos, labelY, frame, theme));
    if (tick.superLabel) {
      const superLabelY = height + TICK + TICK_LABEL_GAP + lineHeight;
      nodes.push(xLabel(`xsuper-${tick.value}`, tick.superLabel, tick.pos, superLabelY, frame, theme));
    }
  }
  return nodes;
}

function xAxisNodes(frame: CartesianFrame, options: CartesianOptions, panel: PanelFrame, theme: Theme, sizes: SizeTokens): SceneNode[] {
  const lineHeight = axisLineHeight(sizes.axisFont);
  const width = panel.width;
  const height = panel.height;
  const nodes: SceneNode[] = [
    {
      type: 'line',
      key: 'baseline',
      x1: 0,
      x2: width,
      y1: crisp(height),
      y2: crisp(height),
      style: { stroke: theme.baseline, strokeWidth: BASELINE_STROKE_WIDTH },
    },
    ...xTickNodes(frame, options, panel, theme, lineHeight),
  ];
  if (options.xAxis?.title && panel.showXLabels) {
    const labelRows = frame.xTicks.some((tick) => tick.superLabel) ? 2 : 1;
    const titleY = height + TICK + TICK_LABEL_GAP + lineHeight * labelRows + X_TITLE_GAP;
    nodes.push(xLabel('xtitle', options.xAxis.title, width / 2, titleY, frame, theme));
  }
  return nodes;
}

/** Facet titles, ranges, grid, axis labels and titles. Drawn beneath the marks. */
export function drawAxes(frame: CartesianFrame, options: CartesianOptions, theme: Theme, sizes: SizeTokens): SceneNode[] {
  return frame.panels.map((panel) => {
    const nodes: SceneNode[] = [];
    if (frame.trellis) nodes.push(facetTitle(frame, panel, theme, sizes));
    nodes.push(...rangeNodes(frame, options, panel, theme, sizes));
    if (frame.showYAxis) {
      nodes.push(...yTickNodes(frame, options, panel, theme));
      nodes.push(...y2LabelNodes(frame, panel, theme));
      nodes.push(...yTitleNodes(frame, options, panel, theme, sizes));
    }
    if (frame.showXAxis) nodes.push(...xAxisNodes(frame, options, panel, theme, sizes));
    return group(`axes-${panel.index}`, nodes, { x: panel.x, y: panel.y });
  });
}

interface ReferenceStyle {
  color: string;
  strokeWidth: number;
  labelFont: string;
  primary: boolean;
}

function referenceStyle(referenceLine: ReferenceLineOptions, theme: Theme, sizes: SizeTokens): ReferenceStyle {
  const primary = referenceLine.kind === 'primary';
  return {
    color: theme.reference,
    strokeWidth: primary ? PRIMARY_REFERENCE_STROKE_WIDTH : REFERENCE_STROKE_WIDTH,
    labelFont: primary ? font(sizes.axisFont + PRIMARY_REFERENCE_FONT_INCREASE, BOLD) : font(sizes.axisFont),
    primary,
  };
}

/** Vertical reference line at an x value, with end markers and label. */
function xReferenceNodes(frame: CartesianFrame, referenceLine: ReferenceLineOptions, i: number, panel: PanelFrame, style: ReferenceStyle, theme: Theme): SceneNode[] {
  const value = frame.xValue(referenceLine.value);
  if (value == null) return [];
  const px = frame.xScale(value);
  if (px < -REFERENCE_VISIBLE_SLACK || px > panel.width + REFERENCE_VISIBLE_SLACK) return [];
  const { color } = style;
  const nodes: SceneNode[] = [
    { type: 'line', key: `ref-${i}`, x1: crisp(px), x2: crisp(px), y1: 0, y2: panel.height, style: { stroke: color, strokeWidth: style.strokeWidth } },
  ];
  if (style.primary) nodes.push(triangle(`ref-${i}-a`, px, 0, 'down', color), triangle(`ref-${i}-b`, px, panel.height, 'up', color));
  if (referenceLine.label) {
    nodes.push({
      type: 'text',
      key: `ref-label-${i}`,
      x: px + REFERENCE_LABEL_OFFSET,
      y: X_REFERENCE_LABEL_TOP,
      text: referenceLine.label,
      font: style.labelFont,
      baseline: 'top',
      halo: theme.background,
      style: { fill: theme.text },
    });
  }
  return nodes;
}

/** Horizontal reference line at a y value, with end markers and label. */
function yReferenceNodes(frame: CartesianFrame, referenceLine: ReferenceLineOptions, i: number, panel: PanelFrame, style: ReferenceStyle, theme: Theme): SceneNode[] {
  const scale = referenceLine.axis === 'y2' && frame.y2 ? frame.y2 : frame.y;
  const py = scale(Number(referenceLine.value));
  if (!Number.isFinite(py) || py < -REFERENCE_VISIBLE_SLACK || py > panel.height + REFERENCE_VISIBLE_SLACK) return [];
  const { color } = style;
  const nodes: SceneNode[] = [
    { type: 'line', key: `ref-${i}`, x1: 0, x2: panel.width, y1: crisp(py), y2: crisp(py), style: { stroke: color, strokeWidth: style.strokeWidth } },
  ];
  if (style.primary) nodes.push(triangle(`ref-${i}-a`, 0, py, 'right', color), triangle(`ref-${i}-b`, panel.width, py, 'left', color));
  if (referenceLine.label) {
    nodes.push({
      type: 'text',
      key: `ref-label-${i}`,
      x: panel.width,
      y: py + REFERENCE_LABEL_OFFSET,
      text: referenceLine.label,
      font: style.labelFont,
      align: 'end',
      baseline: 'top',
      halo: theme.background,
      style: { fill: theme.text },
    });
  }
  return nodes;
}

/** Reference lines, drawn above the marks. */
export function drawReferenceLines(frame: CartesianFrame, options: CartesianOptions, theme: Theme, sizes: SizeTokens): SceneNode[] {
  const referenceLines = options.referenceLines ?? [];
  if (!referenceLines.length) return [];
  return frame.panels.map((panel) => {
    const nodes: SceneNode[] = [];
    for (const [i, referenceLine] of referenceLines.entries()) {
      const style = referenceStyle(referenceLine, theme, sizes);
      if ((referenceLine.axis ?? 'y') === 'x') nodes.push(...xReferenceNodes(frame, referenceLine, i, panel, style, theme));
      else nodes.push(...yReferenceNodes(frame, referenceLine, i, panel, style, theme));
    }
    return group(`refs-${panel.index}`, nodes, { x: panel.x, y: panel.y });
  });
}

/**
 * Bold x label for the hovered value. The other x labels are dimmed with a veil in the background
 * color, so the axes layer itself doesn't have to be redrawn on hover.
 */
export function drawAxisHover(frame: CartesianFrame, hover: AxisHover, theme: Theme, sizes: SizeTokens): SceneNode[] {
  const panel = frame.panels[hover.panel];
  if (!panel || !frame.showXAxis || !panel.showXLabels) return [];
  const width = panel.width;
  const height = panel.height;
  const lineHeight = axisLineHeight(sizes.axisFont);
  const labelRows = frame.xTicks.some((tick) => tick.superLabel) ? 2 : 1;
  const boldFont = font(sizes.axisFont, BOLD);
  const hoverLabelWidth = measureText(hover.label, boldFont);
  const labelX = clamp(hover.x, hoverLabelWidth / 2 - HOVER_LABEL_PAD, width + HOVER_LABEL_PAD - hoverLabelWidth / 2);
  const tickLabelWidth = widestLabel(frame.xTicks, frame.axisFont);
  return [
    group(
      `xhover-${panel.index}`,
      [
        {
          type: 'rect',
          key: 'veil',
          x: -tickLabelWidth / 2 - HOVER_VEIL_PAD,
          y: height + TICK + HOVER_VEIL_PAD,
          width: width + tickLabelWidth + 2 * HOVER_VEIL_PAD,
          height: lineHeight * labelRows + 2 * HOVER_VEIL_PAD,
          style: { fill: theme.background, opacity: INTERACTION.axisLabelVeil },
        },
        {
          type: 'rect',
          key: 'bg',
          x: labelX - hoverLabelWidth / 2 - HOVER_LABEL_PAD,
          y: height + TICK + HOVER_VEIL_PAD,
          width: hoverLabelWidth + 2 * HOVER_LABEL_PAD,
          height: lineHeight + 2 * HOVER_VEIL_PAD,
          style: { fill: theme.background },
        },
        {
          type: 'text',
          key: 'label',
          x: labelX,
          y: height + TICK + TICK_LABEL_GAP,
          text: hover.label,
          font: boldFont,
          align: 'middle',
          baseline: 'top',
          style: { fill: theme.text },
        },
      ],
      { x: panel.x, y: panel.y },
    ),
  ];
}
