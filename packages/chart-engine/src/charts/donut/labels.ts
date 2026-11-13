import { DONUT } from '../../core/assumptions.js';
import { font } from '../../core/theme.js';
import { resolveVertical } from '../../util/labels.js';
import { measureText } from '../../util/text.js';
import type { ArcLayout, DonutGeometry, PieLayout } from './layout.js';
import type { DonutChartOptions, DonutDirectLabelOptions } from './types.js';

export interface DirectLabel {
  /** Arc key. */
  key: string;
  category: string;
  style: 'lightweight' | 'advanced';
  side: 'left' | 'right';
  /** Left edge and vertical centre of the label block. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Distance kept between the ring and the label. */
  offset: number;
  name: string;
  percent: string;
  /** "3,926 out of 6,458" (advanced labels). */
  detail: string | null;
  color: string;
  /** Polyline from the label to the ring, when drawn. */
  leader: [number, number][] | null;
}

export const LIGHT_LINE = { name: DONUT.labelNameFont, value: DONUT.labelValueFont };
export const ADVANCED = {
  name: DONUT.advancedNameFont,
  value: DONUT.advancedValueFont,
  detail: DONUT.advancedDetailFont,
  gap: DONUT.advancedSwatchGap,
};

/** Line height as a multiple of the font size. */
const LINE_HEIGHT_RATIO = 1.3;
const BOLD = 700;
/** Minimum vertical gap between stacked labels on one side. */
const LABEL_STACK_GAP = 4;
/** Leader lines end this far outside the ring. */
const LEADER_RING_OFFSET = 2;
/** Gap between a leader line and its label. */
const LEADER_LABEL_GAP = 4;
/** Advanced leaders within this many px of level are drawn as a single straight segment. */
const LEADER_LEVEL_TOLERANCE = 1;

type LabelStyle = DirectLabel['style'];
type Bounds = { x: number; y: number; width: number; height: number };
/** A label with the vertical centre it would take without collisions. */
type PlacedLabel = DirectLabel & { preferredY: number };

/** Rounded line height for a font size. */
export function labelLineHeight(size: number): number {
  return Math.round(size * LINE_HEIGHT_RATIO);
}

export function labelOptions(options: DonutChartOptions): DonutDirectLabelOptions | null {
  const directLabels = options.directLabels;
  if (!directLabels) return null;
  if (directLabels === true) return { style: 'lightweight' };
  if (typeof directLabels === 'string') return { style: directLabels };
  return directLabels;
}

export function labelStyle(options: DonutChartOptions): 'lightweight' | 'advanced' | null {
  const resolved = labelOptions(options);
  return resolved ? (resolved.style ?? 'lightweight') : null;
}

/** Measured lightweight label block (name over percentage). */
export function lightweightSize(name: string, percent: string): { width: number; height: number } {
  return {
    width: Math.max(measureText(name, font(LIGHT_LINE.name)), measureText(percent, font(LIGHT_LINE.value, BOLD))),
    height: labelLineHeight(LIGHT_LINE.name) + labelLineHeight(LIGHT_LINE.value),
  };
}

function advancedSize(name: string, percent: string, detail: string): { width: number; height: number } {
  return {
    width: Math.max(
      DONUT.advancedSwatch + ADVANCED.gap + measureText(name, font(ADVANCED.name)),
      measureText(percent, font(ADVANCED.value, BOLD)),
      measureText(detail, font(ADVANCED.detail)),
    ),
    height: labelLineHeight(ADVANCED.name) + labelLineHeight(ADVANCED.value) + labelLineHeight(ADVANCED.detail),
  };
}

function midAngle(arc: ArcLayout): number {
  return (arc.start + arc.end) / 2;
}

function styleFor(arc: ArcLayout, labelOpts: DonutDirectLabelOptions): LabelStyle {
  const isAdvanced = labelOpts.style === 'advanced' || labelOpts.advanced?.includes(arc.category);
  return isAdvanced ? 'advanced' : 'lightweight';
}

/** Initial position of a label: advanced labels in a column, lightweight ones beside their segment. */
function preferredPosition(pie: PieLayout, angle: number, style: LabelStyle, side: DirectLabel['side'], offset: number, width: number, height: number): { x: number; y: number } {
  const [unitX, unitY] = [Math.sin(angle), -Math.cos(angle)];
  if (style === 'advanced') {
    const x = side === 'right' ? pie.cx + pie.outer + offset : pie.cx - pie.outer - offset - width;
    return { x, y: pie.cy + unitY * pie.outer };
  }
  const anchorX = pie.cx + unitX * (pie.outer + offset);
  const anchorY = pie.cy + unitY * (pie.outer + offset);
  const x = side === 'right' ? anchorX : anchorX - width;
  // Labels near the top or bottom sit beyond the ring rather than across it.
  return { x, y: anchorY + unitY * (height / 2) * Math.abs(unitY) };
}

function measureLabel(arc: ArcLayout, pie: PieLayout, style: LabelStyle, geometry: DonutGeometry): PlacedLabel {
  const angle = midAngle(arc);
  const side = Math.sin(angle) >= 0 ? 'right' : 'left';
  const percent = geometry.formatPercent(arc.percent);
  const detail = style === 'advanced' ? `${geometry.formatValue(arc.value)} out of ${geometry.formatValue(pie.total)}` : null;
  const { width, height } = style === 'advanced' ? advancedSize(arc.category, percent, detail!) : lightweightSize(arc.category, percent);
  const offset = style === 'advanced' ? DONUT.advancedColumnGap : DONUT.labelOffset;
  const position = preferredPosition(pie, angle, style, side, offset, width, height);
  return {
    key: arc.key,
    category: arc.category,
    style,
    side,
    x: position.x,
    y: position.y,
    preferredY: position.y,
    width,
    height,
    offset,
    name: arc.category,
    percent,
    detail,
    color: arc.color,
    leader: null,
  };
}

/** X where a leader meets the label's ring-facing edge. */
function leaderEdge(label: DirectLabel): number {
  return label.side === 'right' ? label.x - LEADER_LABEL_GAP : label.x + label.width + LEADER_LABEL_GAP;
}

/** Elbow leader from the label's name line to the ring (straight when nearly level). */
function advancedLeader(label: DirectLabel, ringX: number, ringY: number): [number, number][] {
  const edgeX = leaderEdge(label);
  const nameY = label.y - label.height / 2 + labelLineHeight(ADVANCED.name) / 2;
  if (Math.abs(nameY - ringY) < LEADER_LEVEL_TOLERANCE) return [[edgeX, nameY], [ringX, ringY]];
  return [[edgeX, nameY], [ringX, nameY], [ringX, ringY]];
}

/** Pushed away from its segment: keep hugging the ring at the new height and connect with a leader. */
function hugRing(label: PlacedLabel, pie: PieLayout, ringX: number, ringY: number): void {
  const radius = pie.outer + label.offset;
  const dy = Math.min(radius, Math.max(0, Math.abs(label.y - pie.cy) - label.height / 2));
  const dx = Math.sqrt(radius * radius - dy * dy);
  label.x = label.side === 'right' ? pie.cx + dx : pie.cx - dx - label.width;
  label.leader = [[leaderEdge(label), label.y], [ringX, ringY]];
}

/** Resolve overlaps on one side and add leader lines where needed. */
function placeSide(labels: PlacedLabel[], pie: PieLayout, bounds: Bounds): void {
  const boxes = labels.map((label) => ({ id: label.key, y: label.preferredY, height: label.height }));
  const placed = resolveVertical(boxes, bounds.y, bounds.y + bounds.height, LABEL_STACK_GAP);
  for (const label of labels) {
    label.y = placed.get(label.key) ?? label.preferredY;
    const arc = pie.arcs.find((candidate) => candidate.key === label.key)!;
    const angle = midAngle(arc);
    const ringX = pie.cx + Math.sin(angle) * (pie.outer + LEADER_RING_OFFSET);
    const ringY = pie.cy - Math.cos(angle) * (pie.outer + LEADER_RING_OFFSET);
    if (label.style === 'advanced') label.leader = advancedLeader(label, ringX, ringY);
    else if (Math.abs(label.y - label.preferredY) > DONUT.leaderThreshold) hugRing(label, pie, ringX, ringY);
  }
}

/**
 * Place direct labels beside the ring. Lightweight labels sit next to their segment and get a leader line when
 * they have to move to avoid overlap. Advanced labels line up in a column on each side, always with a leader.
 */
export function layoutLabels(pie: PieLayout, options: DonutChartOptions, geometry: DonutGeometry, bounds: Bounds): DirectLabel[] {
  const labelOpts = labelOptions(options);
  if (!labelOpts) return [];
  const labels: PlacedLabel[] = [];
  for (const arc of pie.arcs) {
    if (arc.end - arc.start <= 0) continue;
    if (labelOpts.include && !labelOpts.include.includes(arc.category)) continue;
    labels.push(measureLabel(arc, pie, styleFor(arc, labelOpts), geometry));
  }
  for (const side of ['left', 'right'] as const) {
    placeSide(
      labels.filter((label) => label.side === side),
      pie,
      bounds,
    );
  }
  return labels.map(({ preferredY: _preferredY, ...label }) => label);
}
