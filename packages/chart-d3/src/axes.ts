/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { ScaleLinear } from 'd3-scale';
import {
  CountableTimeInterval,
  TimeInterval,
  timeDay,
  timeHour,
  timeMinute,
  timeMonth,
  timeSecond,
  timeWeek,
  timeYear,
} from 'd3-time';

import { DEFAULT_FONT_COLOR, FADE_FACTOR } from '@spectrum-charts/core-s2/constants';

import { Formatter, getAxisLabelFormatter } from './format.js';
import { ChartData, DimensionScaleType, DualMetricScales, MetricScales, XScale, getBandOffset } from './scales.js';
import { GroupNode, RuleNode, SceneNode, TextNode, group } from './scene.js';
import { Bounds, lineHeight, offsetBounds, textBounds, truncate } from './text.js';
import { Theme } from './theme.js';
import { AxisOptions, FontWeight, Granularity, HitTarget, Label, LabelAlign, Position, SubLabel } from './types.js';

/** Scales and sizes an axis needs; the x scale is the dimension, the y scale is the metric. */
export interface AxisContext {
  width: number;
  height: number;
  theme: Theme;
  formatter: Formatter;
  xScale: XScale;
  xScaleType: DimensionScaleType;
  yScale: ScaleLinear<number, number>;
  /** Dual metric axis scales and label colors; the first metric axis is primary, later ones secondary. */
  dual?: {
    primary: ScaleLinear<number, number>;
    secondary: ScaleLinear<number, number>;
    primaryColor: string;
    secondaryColor: string;
  };
  /** Metric scales named by marks' `metricAxis`; a vertical axis with a matching `name` uses one. */
  metricScales?: MetricScales;
}

/**
 * Gets the metric scale a vertical axis draws.
 * @param axis
 * @param yScale default metric scale
 * @param metricScales named metric scales
 * @returns scale
 */
export const getAxisMetricScale = (
  axis: AxisOptions,
  yScale: ScaleLinear<number, number>,
  metricScales?: MetricScales
): ScaleLinear<number, number> => (axis.name && metricScales?.[axis.name]) || yScale;

/** One built axis row, with the space it needs outside the plot. */
export interface AxisResult {
  position: Position;
  node: GroupNode;
  /** Distance from the axis line to its outermost tick, label or title. */
  thickness: number;
  /** How far labels reach past the start and end of the plot along the axis. */
  overhang: [number, number];
  /** Set on dual metric axes, whose labels fade when the other scale's series is hovered. */
  dualRole?: 'primary' | 'secondary';
  /** Hoverable or clickable labels, with plot-relative bounds. */
  labelTargets?: HitTarget[];
}

interface Tick {
  value: unknown;
  index: number;
  label: string;
  /** Per-label style from the `labels` / `subLabels` options. */
  fontWeight?: FontWeight;
  anchor?: LabelAnchor;
}

type LabelAnchor = Pick<TextNode, 'align' | 'baseline'>;

interface AxisPart {
  key: string;
  position: Position;
  ticks: Tick[];
  showTicks: boolean;
  grid: boolean;
  labels: boolean;
  labelDy: number;
  labelFontWeight: string | number;
  labelLimit: number;
  labelAngle: number;
  labelAnchor: LabelAnchor;
  /** Overrides the theme label padding (sub label rows). */
  labelPadding?: number;
  /** Overrides the theme title padding (axes with sub labels). */
  titlePadding?: number;
  overlap: 'every-nth' | 'greedy';
  separation: number;
  title?: string | string[];
  /** Label and title color override (dual metric axes). */
  color?: string;
  /** Set when labels take a tooltip or click. */
  interaction?: LabelInteraction;
}

interface LabelInteraction {
  /** Only clickable or custom labels get a named label mark. */
  named: boolean;
  cursor?: string;
  tooltip?: (tick: Tick) => unknown;
}

/**
 * Gets label tooltips and click cursor for standard axes.
 * @param axis
 * @returns label interaction, if any
 */
const getLabelInteraction = (axis: AxisOptions): LabelInteraction | undefined => {
  const clickable = Boolean(axis.hasOnClick && !axis.hideDefaultLabels);
  if (!axis.hasTooltip && !clickable) return undefined;
  const tooltips = new Map<unknown, string | null>((axis.tooltipText ?? []).map(({ value, text }) => [value, text]));
  return {
    named: clickable || Boolean(axis.labels?.length),
    ...(clickable ? { cursor: 'pointer' } : {}),
    ...(axis.hasTooltip
      ? { tooltip: (tick: Tick) => (tooltips.has(tick.value) ? tooltips.get(tick.value) : tick.value) }
      : {}),
  };
};

const DEFAULT_LABEL_LIMIT = 180;
const SUB_LABEL_TITLE_PADDING = 24;
const MAX_EXTENT = 200;
const AXIS_TRANSLATE = 0.5;

const TIME_FORMATS: Record<Granularity, { secondary: string; primary: string; interval: TimeInterval }> = {
  second: { secondary: ':%S', primary: '%-I:%M %p', interval: timeSecond },
  minute: { secondary: '%-I:%M %p', primary: '%b %-d', interval: timeMinute },
  hour: { secondary: '%-I %p', primary: '%b %-d', interval: timeHour },
  day: { secondary: '%-d', primary: '%b', interval: timeDay },
  week: { secondary: '%-d', primary: '%b', interval: timeWeek },
  month: { secondary: '%b', primary: '%Y', interval: timeMonth },
  quarter: { secondary: 'Q%q', primary: '%Y', interval: (timeMonth as CountableTimeInterval).every(3) as TimeInterval },
  year: { secondary: '%Y', primary: '', interval: timeYear },
};

const isVertical = (position: Position) => position === 'left' || position === 'right';

/**
 * Gets the numeric tick count, matching the S2 spec builder's `getTickCount` signal.
 * @param axis
 * @param range pixel length of the axis
 * @param grid
 * @returns tick count or undefined for the scale default
 */
export const getTickCount = (
  { position, tickCountMinimum, tickCountLimit }: AxisOptions,
  range: number,
  grid?: boolean
): number | undefined => {
  const ideal = Math.ceil(range / 100);
  const clamp = (min: number, max: number) => Math.max(min, Math.min(max, ideal));
  if (tickCountLimit !== undefined) return clamp(tickCountMinimum ?? 2, tickCountLimit);
  if (tickCountMinimum !== undefined) return clamp(tickCountMinimum, 10);
  if (grid || isVertical(position)) return clamp(2, 10);
  return undefined;
};

type AnyScale = { (value: never): number | undefined; ticks?: (arg?: unknown) => unknown[]; domain: () => unknown[] };

const tickValues = (scale: AnyScale, count: number | TimeInterval): unknown[] =>
  scale.ticks ? scale.ticks(count) : scale.domain();

const withMinStep = (count: number, scale: AnyScale, minStep?: number): number => {
  if (minStep === undefined) return count;
  const [d0, d1] = scale.domain() as number[];
  return Math.min(count, Math.floor(Math.abs(d1 - d0) / minStep || 1) + 1);
};

const toTicks = (values: unknown[], format: (value: unknown) => string): Tick[] =>
  values.map((value, i) => ({ value, index: i / (values.length - 1 || 1), label: format(value) }));

/** Hides repeats of the larger time unit, matching `formatHorizontalTimeAxisLabels`. */
const hideRepeats = (ticks: Tick[]): Tick[] => {
  let prev: string | undefined;
  return ticks.map((tick) => {
    const show = tick.index === 0 || prev !== tick.label;
    prev = tick.label;
    return show ? tick : { ...tick, label: '' };
  });
};

/** Shows the larger time unit only when it changes, matching `formatVerticalAxisTimeLabels`. */
const verticalTimeLabels = (ticks: Tick[]): Tick[] => {
  let prev: string | undefined;
  return ticks.map((tick) => {
    const [primary, secondary] = tick.label.split('\u2000');
    const show = tick.index === 0 || prev !== primary;
    prev = primary;
    return show ? tick : { ...tick, label: secondary };
  });
};

interface AxisPartInput {
  axis: AxisOptions;
  ctx: AxisContext;
  base: AxisPartBase;
  scale: AnyScale;
  range: number;
  vertical: boolean;
}

type AxisPartBase = Omit<AxisPart, 'key' | 'ticks' | 'labelFontWeight' | 'overlap' | 'separation'>;

const getAxisParts = (axis: AxisOptions, ctx: AxisContext): AxisPart[] => {
  const { position, grid = false, ticks = false, title } = axis;
  const orientation = axis.labelOrientation ?? 'horizontal';
  const vertical = isVertical(position);
  const base: AxisPartBase = {
    position,
    showTicks: ticks,
    grid,
    labels: !axis.hideDefaultLabels,
    labelDy: 0,
    labelLimit: axis.labelLimit ?? DEFAULT_LABEL_LIMIT,
    labelAngle: orientation === 'horizontal' ? 0 : 270,
    labelAnchor: getLabelAnchor(position, orientation, axis.labelAlign ?? 'center'),
    title,
  };
  const input: AxisPartInput = {
    axis,
    ctx,
    base,
    scale: (vertical ? ctx.yScale : ctx.xScale) as unknown as AnyScale,
    range: vertical ? ctx.height : ctx.width,
    vertical,
  };
  const isTime = !vertical && ctx.xScaleType === 'time';
  return isTime && axis.labelFormat === 'time' ? getTimeAxisParts(input) : getDefaultAxisParts(input);
};

const getTimeAxisParts = ({ axis, ctx, base, scale, range, vertical }: AxisPartInput): AxisPart[] => {
  const { position, grid = false, ticks = false, labelFontWeight = 'normal' } = axis;
  const formats = TIME_FORMATS[axis.granularity ?? 'day'];
  const hasCountLimits = axis.tickCountLimit !== undefined || axis.tickCountMinimum !== undefined;
  const secondaryCount = hasCountLimits ? getTickCount(axis, range, grid) ?? 10 : formats.interval;
  const primaryCount = hasCountLimits ? getTickCount(axis, range) ?? 10 : formats.interval;
  const time = (specifier: string) => {
    const format = ctx.formatter.time(specifier);
    return (value: unknown) => format(value as Date);
  };
  const secondaryFormat = vertical ? `${formats.primary}\u2000${formats.secondary}` : formats.secondary;
  let secondaryTicks = toTicks(tickValues(scale, secondaryCount), time(secondaryFormat));
  if (vertical) secondaryTicks = verticalTimeLabels(secondaryTicks);
  const parts: AxisPart[] = [
    {
      ...base,
      key: 'secondary',
      ticks: secondaryTicks,
      labelFontWeight: 'normal',
      overlap: 'every-nth',
      separation: 12,
    },
  ];
  if (!vertical) {
    parts.push({
      ...base,
      key: 'primary',
      showTicks: false,
      grid: false,
      title: undefined,
      ticks: hideRepeats(toTicks(tickValues(scale, primaryCount), time(formats.primary))),
      labelDy: (ticks ? 28 : 20) * (position === 'top' ? -1 : 1),
      labelFontWeight,
      overlap: 'greedy',
      separation: 0,
    });
  }
  return parts;
};

const getDefaultAxisParts = ({ axis, ctx, base, scale, range, vertical }: AxisPartInput): AxisPart[] => {
  const { position, grid = false, ticks = false, labelFontWeight = 'normal' } = axis;
  const orientation = axis.labelOrientation ?? 'horizontal';
  const count = withMinStep(
    getTickCount(axis, range, grid) ?? 10,
    scale,
    ctx.xScaleType === 'linear' || vertical ? axis.tickMinStep : undefined
  );
  const defaultValues = tickValues(scale, count);
  const labels = axis.labels ?? [];
  const main: AxisPart = {
    ...base,
    key: 'default',
    ticks: labels.length
      ? getControlledTicks(labels, position, orientation)
      : toTicks(defaultValues, getAxisLabelFormatter(axis, ctx.formatter)),
    labelFontWeight,
    overlap: 'every-nth',
    separation: 0,
    interaction: getLabelInteraction(axis),
  };
  const subLabels = axis.subLabels ?? [];
  if (!subLabels.length || orientation !== 'horizontal') return [main];
  // sub labels are a second, tickless row of labels under the main labels
  const subTicks = getControlledTicks(subLabels, position, orientation);
  return [
    { ...main, titlePadding: SUB_LABEL_TITLE_PADDING },
    {
      ...main,
      key: 'subLabels',
      interaction: undefined,
      showTicks: false,
      grid: false,
      title: undefined,
      labelPadding: ticks ? 32 : 24,
      ticks: subTicks.length ? subTicks : toTicks(defaultValues, String),
    },
  ];
};

/**
 * Gets ticks for explicit `labels` / `subLabels`, whose text defaults to the raw value.value`.
 * @param labels
 * @param position
 * @param orientation
 * @returns ticks
 */
const getControlledTicks = (
  labels: (Label | SubLabel | string | number)[],
  position: Position,
  orientation: 'horizontal' | 'vertical'
): Tick[] => {
  const ticks = toTicks(
    labels.map((label) => (typeof label === 'object' ? label.value : label)),
    String
  );
  return ticks.map((tick, i) => {
    const label = labels[i];
    if (typeof label !== 'object') return tick;
    const text = 'subLabel' in label ? label.subLabel : label.label;
    return {
      ...tick,
      label: text || tick.label,
      fontWeight: label.fontWeight,
      anchor: label.align ? getLabelAnchor(position, orientation, label.align) : undefined,
    };
  });
};

const intersect = (a: Bounds, b: Bounds, sep: number) =>
  sep > Math.max(b.x1 - a.x2, a.x1 - b.x2, b.y1 - a.y2, a.y1 - b.y2);

/**
 * Hides colliding labels: `greedy` drops any label touching the last one kept; `every-nth` keeps every nth label for the smallest n that fits.
 * @param labels
 * @param method
 * @param sep minimum gap between labels
 * @returns visible, non-empty labels
 */
export const cullLabels = (labels: TextNode[], method: AxisPart['overlap'], sep: number): TextNode[] => {
  const shown = labels.filter((node) => node.text);
  const boxes = new Map(shown.map((node) => [node, textBounds(node)]));
  const fits = (prev: TextNode | undefined, next: TextNode) =>
    !prev || !intersect(boxes.get(prev) as Bounds, boxes.get(next) as Bounds, sep);
  if (method === 'greedy') {
    let last: TextNode | undefined;
    return shown.filter((node) => (fits(last, node) ? (last = node) : false));
  }
  for (let n = 1; n < shown.length; n *= 2) {
    const kept = shown.filter((_, i) => i % n === 0);
    if (!kept.every((node, i) => fits(kept[i - 1], node))) continue;
    // end on the last label when it fits in place of the last kept one
    const last = shown.at(-1) as TextNode;
    if (kept.at(-1) !== last && kept.length > 1 && fits(kept.at(-2), last)) kept[kept.length - 1] = last;
    return kept;
  }
  return shown.slice(0, 1);
};

/**
 * Gets the label align and baseline from the axis position, label orientation and `labelAlign`.
 * @param position
 * @param orientation
 * @param labelAlign
 * @returns align and baseline
 */
export const getLabelAnchor = (
  position: Position,
  orientation: 'horizontal' | 'vertical',
  labelAlign: LabelAlign
): LabelAnchor => {
  const parallel = (position === 'top' || position === 'bottom') === (orientation === 'horizontal');
  if (parallel) {
    const align = ({ start: 'left', center: 'center', end: 'right' } as const)[labelAlign];
    return { align, baseline: position === 'top' || position === 'left' ? 'bottom' : 'top' };
  }
  const baseline = ({ start: 'top', center: 'middle', end: 'bottom' } as const)[labelAlign];
  return { align: position === 'bottom' || position === 'left' ? 'right' : 'left', baseline };
};

interface PartFrame {
  part: AxisPart;
  ctx: AxisContext;
  key: string;
  vertical: boolean;
  scale: (value: unknown) => number;
  range: number;
  sign: number;
}

const getGridLines = ({ part, ctx, key, vertical, scale }: PartFrame): RuleNode[] => {
  if (!part.grid) return [];
  const { position } = part;
  const { theme, width, height } = ctx;
  return part.ticks.map((tick): RuleNode => {
    const p = Math.round(scale(tick.value));
    const gridLine: RuleNode = vertical
      ? {
          type: 'rule',
          key: `${key}-grid-${String(tick.value)}`,
          x: 0,
          y: p,
          x2: position === 'left' ? width : -width,
          y2: p,
        }
      : {
          type: 'rule',
          key: `${key}-grid-${String(tick.value)}`,
          x: p,
          y: 0,
          x2: p,
          y2: position === 'bottom' ? -height : height,
        };
    return { ...gridLine, role: 'axis-grid', stroke: theme.axis.gridColor, strokeWidth: 1 };
  });
};

const getTickNodes = ({ part, ctx, key, vertical, scale, sign }: PartFrame): RuleNode[] => {
  if (!part.showTicks) return [];
  const { theme } = ctx;
  const length = sign * theme.axis.tickSize;
  return part.ticks.map((tick): RuleNode => {
    const p = Math.round(scale(tick.value));
    return {
      type: 'rule',
      key: `${key}-tick-${String(tick.value)}`,
      role: 'axis-tick',
      x: vertical ? 0 : p,
      y: vertical ? p : 0,
      x2: vertical ? length : p,
      y2: vertical ? p : length,
      stroke: theme.axis.tickColor,
      strokeWidth: 1,
      strokeCap: 'round',
    };
  });
};

const getLabelNodes = ({ part, ctx, key, vertical, scale, sign }: PartFrame): TextNode[] => {
  if (!part.labels) return [];
  const { theme } = ctx;
  const offset = sign * ((part.showTicks ? theme.axis.tickSize : 0) + (part.labelPadding ?? theme.axis.labelPadding));
  const { labelFontSize: fontSize, labelColor } = theme.axis;
  // the row offset (dy) applies in the rotated label frame
  const rad = (part.labelAngle * Math.PI) / 180;
  const dyX = part.labelAngle ? -part.labelDy * Math.sin(rad) : 0;
  const dyY = part.labelAngle ? part.labelDy * Math.cos(rad) : part.labelDy;
  return part.ticks.map(
    (tick): TextNode => ({
      type: 'text',
      key: `${key}-label-${String(tick.value)}`,
      role: 'axis-label',
      x: (vertical ? offset : scale(tick.value)) + dyX,
      y: vertical ? scale(tick.value) : offset + dyY,
      text: truncate(tick.label, part.labelLimit, fontSize, theme.font, tick.fontWeight ?? part.labelFontWeight),
      fill: part.color ?? labelColor,
      font: theme.font,
      fontSize,
      fontWeight: tick.fontWeight ?? part.labelFontWeight,
      ...(tick.anchor ?? part.labelAnchor),
      ...(part.labelAngle ? { angle: part.labelAngle } : {}),
    })
  );
};

/** How far a box reaches outward from the axis line. */
const outward = (b: Bounds, position: Position): number =>
  ({ left: -b.x1, right: b.x2, top: -b.y1, bottom: b.y2 })[position];

/**
 * Gets how far ticks and labels reach from the axis line, capped so long labels can't squeeze the plot away.
 * @param frame
 * @param labels visible labels
 * @returns extent in pixels
 */
const getTickLabelExtent = ({ part, ctx }: PartFrame, labels: TextNode[]): number => {
  const tick = part.showTicks ? ctx.theme.axis.tickSize : 0;
  const extent = Math.max(tick, ...labels.map((node) => outward(textBounds(node), part.position)));
  return Math.max(0, Math.min(MAX_EXTENT, extent));
};

const getTitleNode = ({ part, ctx, key, vertical, range, sign }: PartFrame, extent: number): TextNode | undefined => {
  if (!part.title) return undefined;
  const { position } = part;
  const { theme } = ctx;
  const { titleFontSize: fontSize, titleColor } = theme.axis;
  const titlePadding = part.titlePadding ?? theme.axis.titlePadding;
  const lines =
    Array.isArray(part.title) && part.title.length > 1
      ? part.title.map((line) => truncate(line, range, fontSize, theme.font, 'normal'))
      : undefined;
  // extra title lines push the title away from the plot except on bottom axes
  const dl = lines && position !== 'bottom' ? lineHeight(fontSize) * (lines.length - 1) : 0;
  const v = sign * (extent + dl + titlePadding);
  const angles: Partial<Record<string, number>> = { left: -90, right: 90 };
  const angle = angles[position] ?? 0;
  return {
    type: 'text',
    key: `${key}-title`,
    role: 'axis-title',
    x: vertical ? v : range / 2,
    y: vertical ? range / 2 : v,
    text: lines ? lines.join('\n') : truncate(String(part.title), range, fontSize, theme.font, 'normal'),
    ...(lines ? { lines } : {}),
    fill: part.color ?? titleColor,
    font: theme.font,
    fontSize,
    fontWeight: 'normal',
    align: 'center',
    baseline: position === 'bottom' ? 'top' : 'bottom',
    ...(angle ? { angle } : {}),
  };
};

const getPartFrame = (part: AxisPart, axisKey: string, ctx: AxisContext): PartFrame => {
  const { position } = part;
  const vertical = isVertical(position);
  const baseScale = (vertical ? ctx.yScale : ctx.xScale) as unknown as (value: unknown) => number;
  // band axes center on the band and shift ticks and grid by the axisBand tickOffset
  const bandOffset = vertical ? 0 : getBandOffset(ctx.xScale);
  return {
    part,
    ctx,
    key: `${axisKey}-${part.key}`,
    vertical,
    scale: bandOffset ? (value: unknown) => baseScale(value) + bandOffset - 0.5 : baseScale,
    range: vertical ? ctx.height : ctx.width,
    sign: position === 'left' || position === 'top' ? -1 : 1,
  };
};

const buildPart = (part: AxisPart, axisKey: string, ctx: AxisContext): AxisResult => {
  const { position } = part;
  const frame = getPartFrame(part, axisKey, ctx);
  const tickNodes = getTickNodes(frame);
  const allLabels = getLabelNodes(frame);
  const labelNodes = cullLabels(allLabels, part.overlap, part.separation);
  const extent = getTickLabelExtent(frame, labelNodes);
  const titleNode = getTitleNode(frame, extent);
  const children: SceneNode[] = [...getGridLines(frame), ...tickNodes, ...labelNodes, ...(titleNode ? [titleNode] : [])];

  const outer = [...labelNodes, ...(titleNode ? [titleNode] : [])].map(textBounds);
  const vertical = isVertical(position);
  const start = Math.max(0, ...outer.map((b) => -(vertical ? b.y1 : b.x1)));
  const end = Math.max(0, ...outer.map((b) => (vertical ? b.y2 : b.x2) - frame.range));
  const thickness = Math.max(extent, ...outer.map((b) => outward(b, position)));

  const x = position === 'right' ? ctx.width : 0;
  const y = position === 'bottom' ? ctx.height : 0;
  const labelTargets = part.interaction && getLabelTargets(part, axisKey, allLabels, labelNodes, [x, y]);
  return {
    position,
    node: group(frame.key, children, { role: 'axis', x: x + AXIS_TRANSLATE, y: y + AXIS_TRANSLATE }),
    thickness: Math.ceil(thickness),
    overhang: [Math.ceil(start), Math.ceil(end)],
    ...(labelTargets?.length ? { labelTargets } : {}),
  };
};

/**
 * Gets hit targets for interactive labels, named.
 * @param part
 * @param axisKey
 * @param allLabels one label per tick
 * @param labelNodes labels left after overlap removal
 * @param offset axis offset
 * @returns label targets
 */
const getLabelTargets = (
  part: AxisPart,
  axisKey: string,
  allLabels: TextNode[],
  labelNodes: TextNode[],
  [x, y]: [number, number]
): HitTarget[] => {
  const { named, cursor, tooltip } = part.interaction ?? {};
  const visible = new Set(labelNodes);
  return allLabels.flatMap((node, i) => {
    const tick = part.ticks[i];
    return visible.has(node)
      ? [
          {
            datum: { value: tick.value, index: tick.index },
            mark: named ? `${axisKey}_labelHover` : '',
            role: 'axis-label',
            itemCount: part.ticks.length,
            bounds: offsetBounds(textBounds(node), x + AXIS_TRANSLATE, y + AXIS_TRANSLATE),
            ...(cursor ? { cursor } : {}),
            ...(tooltip ? { tooltip: tooltip(tick) as HitTarget['tooltip'] } : {}),
          },
        ]
      : [];
  });
};

/**
 * Builds every axis (time axes expand into secondary and primary parts).
 * @param axes
 * @param ctx
 * @returns axis results in render order
 */
export const buildAxes = (axes: AxisOptions[], ctx: AxisContext): AxisResult[] => {
  let metricAxisCount = 0;
  return axes.flatMap((axis, i) => {
    let axisCtx = ctx;
    let dualRole: AxisResult['dualRole'];
    let color: string | undefined;
    if (ctx.dual && isVertical(axis.position)) {
      dualRole = metricAxisCount++ === 0 ? 'primary' : 'secondary';
      axisCtx = { ...ctx, yScale: ctx.dual[dualRole] };
      color = dualRole === 'primary' ? ctx.dual.primaryColor : ctx.dual.secondaryColor;
    } else if (isVertical(axis.position)) {
      axisCtx = { ...ctx, yScale: getAxisMetricScale(axis, ctx.yScale, ctx.metricScales) };
    }
    return getAxisParts(axis, axisCtx).map((part) => ({
      ...buildPart({ ...part, color }, `axis${i}`, axisCtx),
      ...(dualRole ? { dualRole } : {}),
    }));
  });
};

/**
 * Fades a dual metric axis's labels and title while a series on the other scale is hovered.
 * @param axis
 * @param hoveredSeriesId series of the hovered item, if any
 * @param lastSeriesId the series drawn on the secondary scale
 * @returns the axis node
 */
export const getAxisNode = (axis: AxisResult, hoveredSeriesId: unknown, lastSeriesId: unknown): GroupNode => {
  if (!axis.dualRole || hoveredSeriesId === undefined) return axis.node;
  const onSecondary = hoveredSeriesId === lastSeriesId;
  if (onSecondary === (axis.dualRole === 'secondary')) return axis.node;
  return {
    ...axis.node,
    children: axis.node.children.map((child) =>
      child.role === 'axis-label' || child.role === 'axis-title' ? { ...child, opacity: FADE_FACTOR } : child
    ),
  };
};

/**
 * Gets the dual axis label colors: the first series' color only when there are exactly two series.
 * @param data
 * @param dual
 * @param theme
 * @returns colors
 */
export const getDualAxisColors = (data: ChartData, dual: DualMetricScales, theme: Theme) => {
  const { color } = data;
  const colorOf = (id: unknown) => color.get({ [color.field ?? '']: id });
  return {
    primaryColor: color.domain.length - 1 === 1 ? colorOf(dual.firstSeriesId) : theme.color(DEFAULT_FONT_COLOR),
    secondaryColor: colorOf(dual.lastSeriesId),
  };
};
