import { dashFor, group, type SceneNode } from '../render/scene.js';
import { measureText, truncate } from '../util/text.js';
import { CHROME } from './assumptions.js';
import type { LegendEntry, LegendSpec, Rect } from './module.js';
import { font, type SizeTokens, type Theme } from './theme.js';

export interface LegendItemBox extends Rect {
  entry: LegendEntry;
  /** Possibly truncated label. */
  text: string;
  /** Left edge of the swatch (the box includes horizontal padding). */
  contentX: number;
}

export interface LegendLayout extends Rect {
  kind: 'list' | 'bar';
  swatch: 'square' | 'line';
  title: { text: string; x: number; y: number } | null;
  items: LegendItemBox[];
  /** Bar legends: label positions under the bar. */
  barLabels: { text: string; x: number; align: 'start' | 'middle' | 'end' }[];
}

export interface LegendDrawState {
  hidden: Set<string>;
  /** Entries not listed fade. */
  emphasized: string[] | null;
  /** Entry under the pointer: gets a rounded background. */
  hovered: string | null;
}

const SQUARE_SWATCH_SIZE = 16;
const LINE_SWATCH_WIDTH = 24;
const LINE_SWATCH_STROKE_WIDTH = 3;
const SQUARE_SWATCH_RADIUS = 4;
/** Hidden entries draw an outlined square inset by this much. */
const HIDDEN_SWATCH_INSET = 1;
const HIDDEN_SWATCH_RADIUS = 3;
const HIDDEN_SWATCH_STROKE_WIDTH = 2;
const BOLD = 700;
/** Preferred width of each bar legend segment. */
const BAR_SEGMENT_WIDTH = 48;
/** Gap between neighbouring bar segments. */
const BAR_SEGMENT_DIVIDER = 1;
/** Space between the bar and its labels. */
const BAR_LABEL_GAP = 4;
/** Minimum horizontal room left around a bar label for it to fit its segment. */
const BAR_LABEL_FIT_PADDING = 4;
const BAR_LABEL_LINE_HEIGHT_RATIO = 1.3;
const OUTLINE_STROKE_WIDTH = 1;

type LegendTitle = LegendLayout['title'];
type BarLabel = LegendLayout['barLabels'][number];

function swatchWidth(swatch: 'square' | 'line', entry: LegendEntry): number {
  return swatch === 'line' || entry.static ? LINE_SWATCH_WIDTH : SQUARE_SWATCH_SIZE;
}

function entryText(entry: LegendEntry): string {
  return entry.value ? `${entry.label} \u2013 ${entry.value}` : entry.label;
}

/** Labels under a bar legend: every entry if all fit, else the ends (and middle for odd counts). */
function barLabels(spec: LegendSpec, sizes: SizeTokens, barWidth: number, segmentWidth: number): BarLabel[] {
  const entries = spec.entries;
  const count = entries.length;
  const axisFont = font(sizes.axisFont);
  const fitsAll = entries.every((entry) => measureText(entry.label, axisFont) <= segmentWidth - BAR_LABEL_FIT_PADDING);
  if (fitsAll) return entries.map((entry, i) => ({ text: entry.label, x: (i + 0.5) * segmentWidth, align: 'middle' as const }));
  const labels: BarLabel[] = [{ text: entries[0]?.label ?? '', x: 0, align: 'start' }];
  if (count % 2 === 1 && count > 2) labels.push({ text: entries[(count - 1) / 2].label, x: barWidth / 2, align: 'middle' });
  if (count > 1) labels.push({ text: entries[count - 1].label, x: barWidth, align: 'end' });
  return labels;
}

function layoutBarLegend(spec: LegendSpec, sizes: SizeTokens, maxWidth: number): LegendLayout {
  const titleFont = font(sizes.legendFont, BOLD);
  const itemHeight = CHROME.legendItemHeight;
  const count = spec.entries.length;
  let title: LegendTitle = null;
  let y = 0;
  if (spec.title) {
    title = { text: truncate(spec.title, titleFont, maxWidth), x: 0, y: itemHeight / 2 };
    y = itemHeight;
  }
  const preferredWidth = Math.min(CHROME.legendBarMaxWidth, count * BAR_SEGMENT_WIDTH);
  const width = Math.min(maxWidth, Math.max(CHROME.legendBarMinWidth, preferredWidth));
  const segmentWidth = count ? width / count : 0;
  const items: LegendItemBox[] = spec.entries.map((entry, i) => ({
    entry,
    text: entry.label,
    x: i * segmentWidth,
    y,
    width: segmentWidth,
    height: CHROME.legendBarHeight,
    contentX: i * segmentWidth,
  }));
  const labelHeight = Math.round(sizes.axisFont * BAR_LABEL_LINE_HEIGHT_RATIO);
  return {
    kind: 'bar',
    swatch: spec.swatch,
    title,
    items,
    barLabels: barLabels(spec, sizes, width, segmentWidth),
    x: 0,
    y: 0,
    width: Math.max(width, title ? measureText(title.text, titleFont) : 0),
    height: y + CHROME.legendBarHeight + BAR_LABEL_GAP + labelHeight,
  };
}

/** Entry text truncated to the available width, and the width of swatch plus text. */
function measureEntry(spec: LegendSpec, entry: LegendEntry, labelFont: string, maxWidth: number): { text: string; width: number } {
  const swatchAndGap = swatchWidth(spec.swatch, entry) + CHROME.legendSwatchGap;
  const text = truncate(entryText(entry), labelFont, Math.max(0, maxWidth - swatchAndGap));
  const width = swatchWidth(spec.swatch, entry) + CHROME.legendSwatchGap + measureText(text, labelFont);
  return { text, width };
}

/** Entries stacked one per row (left/right legends). */
function layoutVerticalList(spec: LegendSpec, sizes: SizeTokens, maxWidth: number): LegendLayout {
  const labelFont = font(sizes.legendFont);
  const titleFont = font(sizes.legendFont, BOLD);
  const itemHeight = CHROME.legendItemHeight;
  const padX = CHROME.legendItemPadX;
  const items: LegendItemBox[] = [];
  let title: LegendTitle = null;
  let y = 0;
  let width = 0;
  if (spec.title) {
    const titleText = truncate(spec.title, titleFont, maxWidth);
    title = { text: titleText, x: 0, y: itemHeight / 2 };
    width = measureText(titleText, titleFont);
    y = itemHeight + CHROME.legendRowGap;
  }
  for (const entry of spec.entries) {
    const measured = measureEntry(spec, entry, labelFont, maxWidth);
    items.push({ entry, text: measured.text, x: -padX, y, width: measured.width + 2 * padX, height: itemHeight, contentX: 0 });
    width = Math.max(width, measured.width);
    y += itemHeight + CHROME.legendRowGap;
  }
  return { kind: 'list', swatch: spec.swatch, title, items, barLabels: [], x: 0, y: 0, width, height: Math.max(0, y - CHROME.legendRowGap) };
}

/** Entries flowing left to right, wrapping within `maxWidth`. */
function layoutFlowList(spec: LegendSpec, sizes: SizeTokens, maxWidth: number): LegendLayout {
  const labelFont = font(sizes.legendFont);
  const titleFont = font(sizes.legendFont, BOLD);
  const itemHeight = CHROME.legendItemHeight;
  const padX = CHROME.legendItemPadX;
  const items: LegendItemBox[] = [];
  let title: LegendTitle = null;
  let x = 0;
  let y = 0;
  let width = 0;
  if (spec.title) {
    const titleText = truncate(spec.title, titleFont, maxWidth);
    title = { text: titleText, x: 0, y: itemHeight / 2 };
    x = measureText(titleText, titleFont) + CHROME.legendItemGap;
  }
  for (const entry of spec.entries) {
    const measured = measureEntry(spec, entry, labelFont, maxWidth);
    if (x > 0 && x + measured.width > maxWidth) {
      x = 0;
      y += itemHeight + CHROME.legendRowGap;
    }
    items.push({ entry, text: measured.text, x: x - padX, y, width: measured.width + 2 * padX, height: itemHeight, contentX: x });
    width = Math.max(width, x + measured.width);
    x += measured.width + CHROME.legendItemGap;
  }
  return { kind: 'list', swatch: spec.swatch, title, items, barLabels: [], x: 0, y: 0, width, height: y + itemHeight };
}

/**
 * Measure a legend and place its entries relative to its own origin.
 * `vertical` stacks entries (left/right legends); otherwise they flow and wrap within `maxWidth`.
 */
export function layoutLegend(spec: LegendSpec, sizes: SizeTokens, maxWidth: number, vertical: boolean): LegendLayout {
  if (spec.kind === 'bar') return layoutBarLegend(spec, sizes, maxWidth);
  if (vertical) return layoutVerticalList(spec, sizes, maxWidth);
  return layoutFlowList(spec, sizes, maxWidth);
}

function legendTitleNode(title: NonNullable<LegendTitle>, theme: Theme, sizes: SizeTokens): SceneNode {
  return {
    type: 'text',
    key: 'title',
    x: title.x,
    y: title.y,
    text: title.text,
    font: font(sizes.legendFont, BOLD),
    baseline: 'middle',
    style: { fill: theme.text },
  };
}

function barLegendNodes(layout: LegendLayout, state: LegendDrawState, theme: Theme, sizes: SizeTokens, fadeOf: (key: string) => number | undefined): SceneNode[] {
  const nodes: SceneNode[] = [];
  layout.items.forEach((item, i) => {
    const hidden = state.hidden.has(item.entry.key);
    const divider = i ? BAR_SEGMENT_DIVIDER : 0;
    const opacity = fadeOf(item.entry.key);
    nodes.push({
      type: 'rect',
      key: `seg-${item.entry.key}`,
      x: item.x + divider,
      y: item.y,
      width: item.width - divider,
      height: item.height,
      style: hidden
        ? { fill: 'none', stroke: theme.textSecondary, strokeWidth: OUTLINE_STROKE_WIDTH, opacity }
        : { fill: item.entry.color, opacity },
    });
  });
  const labelY = (layout.items[0]?.y ?? 0) + CHROME.legendBarHeight + BAR_LABEL_GAP;
  layout.barLabels.forEach((label, i) => {
    nodes.push({
      type: 'text',
      key: `label-${i}`,
      x: label.x,
      y: labelY,
      text: label.text,
      font: font(sizes.axisFont),
      align: label.align,
      baseline: 'top',
      style: { fill: theme.axisLabel },
    });
  });
  return nodes;
}

function swatchNode(swatch: 'square' | 'line', entry: LegendEntry, hidden: boolean, swatchX: number, centerY: number, theme: Theme): SceneNode {
  if (swatch === 'line' || entry.static) {
    return {
      type: 'line',
      key: 'swatch',
      x1: swatchX,
      x2: swatchX + swatchWidth(swatch, entry),
      y1: centerY,
      y2: centerY,
      style: {
        stroke: hidden ? theme.textSecondary : entry.color,
        strokeWidth: LINE_SWATCH_STROKE_WIDTH,
        dash: dashFor(entry.lineStyle, LINE_SWATCH_STROKE_WIDTH),
      },
    };
  }
  if (hidden) {
    return {
      type: 'rect',
      key: 'swatch',
      x: swatchX + HIDDEN_SWATCH_INSET,
      y: centerY - SQUARE_SWATCH_SIZE / 2 + HIDDEN_SWATCH_INSET,
      width: SQUARE_SWATCH_SIZE - 2 * HIDDEN_SWATCH_INSET,
      height: SQUARE_SWATCH_SIZE - 2 * HIDDEN_SWATCH_INSET,
      rx: HIDDEN_SWATCH_RADIUS,
      style: { fill: 'none', stroke: theme.textSecondary, strokeWidth: HIDDEN_SWATCH_STROKE_WIDTH },
    };
  }
  return {
    type: 'rect',
    key: 'swatch',
    x: swatchX,
    y: centerY - SQUARE_SWATCH_SIZE / 2,
    width: SQUARE_SWATCH_SIZE,
    height: SQUARE_SWATCH_SIZE,
    rx: SQUARE_SWATCH_RADIUS,
    style: { fill: entry.color },
  };
}

/** One list entry: optional hover background, swatch and label. */
function listItemNode(layout: LegendLayout, item: LegendItemBox, state: LegendDrawState, theme: Theme, labelFont: string, opacity: number | undefined): SceneNode {
  const entry = item.entry;
  const hidden = state.hidden.has(entry.key);
  const centerY = item.y + item.height / 2;
  const children: SceneNode[] = [];
  if (state.hovered === entry.key && !entry.static) {
    children.push({
      type: 'rect',
      key: 'hover',
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
      rx: CHROME.legendHoverRadius,
      style: { fill: theme.legendHover },
    });
  }
  const swatchX = item.contentX;
  children.push(swatchNode(layout.swatch, entry, hidden, swatchX, centerY, theme));
  children.push({
    type: 'text',
    key: 'label',
    x: swatchX + swatchWidth(layout.swatch, entry) + CHROME.legendSwatchGap,
    y: centerY,
    text: item.text,
    font: labelFont,
    baseline: 'middle',
    style: { fill: hidden ? theme.textSecondary : theme.text },
  });
  return group(`item-${entry.key}`, children, { style: { opacity } });
}

/** Legend drawn into the scene so screen and export match. */
export function drawLegend(layout: LegendLayout, state: LegendDrawState, theme: Theme, sizes: SizeTokens): SceneNode {
  const nodes: SceneNode[] = [];
  if (layout.title) nodes.push(legendTitleNode(layout.title, theme, sizes));
  const fadeOf = (key: string): number | undefined =>
    state.emphasized != null && !state.emphasized.includes(key) ? CHROME.legendFadeOpacity : undefined;

  if (layout.kind === 'bar') {
    nodes.push(...barLegendNodes(layout, state, theme, sizes, fadeOf));
  } else {
    const labelFont = font(sizes.legendFont);
    for (const item of layout.items) nodes.push(listItemNode(layout, item, state, theme, labelFont, fadeOf(item.entry.key)));
  }
  return group('legend', nodes, { x: layout.x, y: layout.y });
}

export interface LegendHandlers {
  onHover: (key: string | null) => void;
  onToggle: (key: string) => void;
}

/**
 * Transparent, focusable buttons placed over the drawn legend entries. They carry the legend's
 * interaction and accessibility; the visuals live in the scene.
 */
export class LegendControls {
  readonly element: HTMLElement;
  private buttons = new Map<string, HTMLElement>();
  private signature = '';
  private hoverKey: string | null = null;
  private focusKey: string | null = null;

  constructor(private handlers: LegendHandlers) {
    this.element = document.createElement('div');
    this.element.className = 's2c-legend-controls';
    this.element.setAttribute('role', 'group');
  }

  update(layout: LegendLayout | null, hidden: Set<string>, title?: string): void {
    const element = this.element;
    element.hidden = !layout;
    if (!layout) {
      this.clear();
      return;
    }
    element.setAttribute('aria-label', title ?? 'Legend');
    const entrySignature = layout.items.map((item) => [item.entry.key, item.entry.label, item.entry.value, item.entry.static]);
    const signature = JSON.stringify(entrySignature);
    if (signature !== this.signature) {
      this.signature = signature;
      this.rebuild(layout);
    }
    this.position(layout, hidden);
  }

  private clear(): void {
    if (!this.signature) return;
    this.element.replaceChildren();
    this.buttons.clear();
    this.signature = '';
  }

  /** Recreates the controls for the entries, keeping keyboard focus on the same entry. */
  private rebuild(layout: LegendLayout): void {
    const focusedKey = [...this.buttons].find(([, button]) => button === document.activeElement)?.[0];
    this.element.replaceChildren();
    this.buttons.clear();
    for (const item of layout.items) {
      const control = this.createControl(item.entry);
      control.className = 's2c-legend-hit';
      this.element.append(control);
      this.buttons.set(item.entry.key, control);
    }
    if (focusedKey) this.buttons.get(focusedKey)?.focus({ preventScroll: true });
  }

  /** Static entries are labelled images; the rest are toggle buttons. */
  private createControl(entry: LegendEntry): HTMLElement {
    const name = entry.value ? `${entry.label}, ${entry.value}` : entry.label;
    if (entry.static) {
      const image = document.createElement('span');
      image.setAttribute('role', 'img');
      image.setAttribute('aria-label', name);
      return image;
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', name);
    button.addEventListener('click', () => this.handlers.onToggle(entry.key));
    button.addEventListener('pointerenter', () => this.hover(entry.key));
    button.addEventListener('pointerleave', () => this.hover(null));
    button.addEventListener('focus', () => {
      this.focusKey = entry.key;
      this.emit();
    });
    button.addEventListener('blur', () => {
      this.focusKey = null;
      this.emit();
    });
    return button;
  }

  /** Places each control over its drawn entry and syncs its pressed state. */
  private position(layout: LegendLayout, hidden: Set<string>): void {
    for (const item of layout.items) {
      const control = this.buttons.get(item.entry.key);
      if (!control) continue;
      control.style.left = `${layout.x + item.x}px`;
      control.style.top = `${layout.y + item.y}px`;
      control.style.width = `${item.width}px`;
      control.style.height = `${item.height}px`;
      if (!item.entry.static) control.setAttribute('aria-pressed', String(!hidden.has(item.entry.key)));
    }
  }

  /** Entry the pointer is over, or that has keyboard focus. */
  get active(): string | null {
    return this.hoverKey ?? this.focusKey;
  }

  /** Entry under the pointer (drawn with a hover background). */
  get hovered(): string | null {
    return this.hoverKey;
  }

  private hover(key: string | null): void {
    this.hoverKey = key;
    this.emit();
  }

  private emit(): void {
    this.handlers.onHover(this.active);
  }
}
