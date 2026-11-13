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

const SQUARE = 16;
const LINE = 24;

function swatchWidth(swatch: 'square' | 'line', e: LegendEntry): number {
  return swatch === 'line' || e.static ? LINE : SQUARE;
}

/**
 * Measure a legend and place its entries relative to its own origin.
 * `vertical` stacks entries (left/right legends); otherwise they flow and wrap within `maxWidth`.
 */
export function layoutLegend(spec: LegendSpec, sizes: SizeTokens, maxWidth: number, vertical: boolean): LegendLayout {
  const f = font(sizes.legendFont);
  const titleFont = font(sizes.legendFont, 700);
  const h = CHROME.legendItemHeight;
  const pad = CHROME.legendItemPadX;
  const items: LegendItemBox[] = [];
  let title: LegendLayout['title'] = null;

  if (spec.kind === 'bar') {
    const n = spec.entries.length;
    let y = 0;
    if (spec.title) {
      title = { text: truncate(spec.title, titleFont, maxWidth), x: 0, y: h / 2 };
      y = h;
    }
    const width = Math.min(maxWidth, Math.max(CHROME.legendBarMinWidth, Math.min(CHROME.legendBarMaxWidth, n * 48)));
    const seg = n ? width / n : 0;
    spec.entries.forEach((entry, i) => {
      items.push({ entry, text: entry.label, x: i * seg, y, width: seg, height: CHROME.legendBarHeight, contentX: i * seg });
    });
    const axisFont = font(sizes.axisFont);
    const fitsAll = spec.entries.every((e) => measureText(e.label, axisFont) <= seg - 4);
    const barLabels: LegendLayout['barLabels'] = fitsAll
      ? spec.entries.map((e, i) => ({ text: e.label, x: (i + 0.5) * seg, align: 'middle' as const }))
      : [
          { text: spec.entries[0]?.label ?? '', x: 0, align: 'start' as const },
          ...(n % 2 === 1 && n > 2 ? [{ text: spec.entries[(n - 1) / 2].label, x: width / 2, align: 'middle' as const }] : []),
          ...(n > 1 ? [{ text: spec.entries[n - 1].label, x: width, align: 'end' as const }] : []),
        ];
    const labelH = Math.round(sizes.axisFont * 1.3);
    return {
      kind: 'bar',
      swatch: spec.swatch,
      title,
      items,
      barLabels,
      x: 0,
      y: 0,
      width: Math.max(width, title ? measureText(title.text, titleFont) : 0),
      height: y + CHROME.legendBarHeight + 4 + labelH,
    };
  }

  const textOf = (e: LegendEntry): string => (e.value ? `${e.label} \u2013 ${e.value}` : e.label);
  const contentWidth = (e: LegendEntry, text: string): number => swatchWidth(spec.swatch, e) + CHROME.legendSwatchGap + measureText(text, f);

  if (vertical) {
    let y = 0;
    let width = 0;
    if (spec.title) {
      const t = truncate(spec.title, titleFont, maxWidth);
      title = { text: t, x: 0, y: h / 2 };
      width = measureText(t, titleFont);
      y = h + CHROME.legendRowGap;
    }
    for (const e of spec.entries) {
      const sw = swatchWidth(spec.swatch, e) + CHROME.legendSwatchGap;
      const text = truncate(textOf(e), f, Math.max(0, maxWidth - sw));
      const w = contentWidth(e, text);
      items.push({ entry: e, text, x: -pad, y, width: w + 2 * pad, height: h, contentX: 0 });
      width = Math.max(width, w);
      y += h + CHROME.legendRowGap;
    }
    return { kind: 'list', swatch: spec.swatch, title, items, barLabels: [], x: 0, y: 0, width, height: Math.max(0, y - CHROME.legendRowGap) };
  }

  let x = 0;
  let y = 0;
  let width = 0;
  if (spec.title) {
    const t = truncate(spec.title, titleFont, maxWidth);
    title = { text: t, x: 0, y: h / 2 };
    x = measureText(t, titleFont) + CHROME.legendItemGap;
  }
  for (const e of spec.entries) {
    const sw = swatchWidth(spec.swatch, e) + CHROME.legendSwatchGap;
    const text = truncate(textOf(e), f, Math.max(0, maxWidth - sw));
    const w = contentWidth(e, text);
    if (x > 0 && x + w > maxWidth) {
      x = 0;
      y += h + CHROME.legendRowGap;
    }
    items.push({ entry: e, text, x: x - pad, y, width: w + 2 * pad, height: h, contentX: x });
    width = Math.max(width, x + w);
    x += w + CHROME.legendItemGap;
  }
  return { kind: 'list', swatch: spec.swatch, title, items, barLabels: [], x: 0, y: 0, width, height: y + h };
}

/** Legend drawn into the scene so screen and export match. */
export function drawLegend(layout: LegendLayout, state: LegendDrawState, theme: Theme, sizes: SizeTokens): SceneNode {
  const nodes: SceneNode[] = [];
  const f = font(sizes.legendFont);
  if (layout.title) {
    nodes.push({
      type: 'text',
      key: 'title',
      x: layout.title.x,
      y: layout.title.y,
      text: layout.title.text,
      font: font(sizes.legendFont, 700),
      baseline: 'middle',
      style: { fill: theme.text },
    });
  }
  const fadeOf = (key: string): number | undefined =>
    state.emphasized != null && !state.emphasized.includes(key) ? CHROME.legendFadeOpacity : undefined;

  if (layout.kind === 'bar') {
    layout.items.forEach((it, i) => {
      const hidden = state.hidden.has(it.entry.key);
      nodes.push({
        type: 'rect',
        key: `seg-${it.entry.key}`,
        x: it.x + (i ? 1 : 0),
        y: it.y,
        width: it.width - (i ? 1 : 0),
        height: it.height,
        style: hidden
          ? { fill: 'none', stroke: theme.textSecondary, strokeWidth: 1, opacity: fadeOf(it.entry.key) }
          : { fill: it.entry.color, opacity: fadeOf(it.entry.key) },
      });
    });
    const by = (layout.items[0]?.y ?? 0) + CHROME.legendBarHeight + 4;
    layout.barLabels.forEach((l, i) => {
      nodes.push({
        type: 'text',
        key: `label-${i}`,
        x: l.x,
        y: by,
        text: l.text,
        font: font(sizes.axisFont),
        align: l.align,
        baseline: 'top',
        style: { fill: theme.axisLabel },
      });
    });
    return group('legend', nodes, { x: layout.x, y: layout.y });
  }

  for (const it of layout.items) {
    const e = it.entry;
    const hidden = state.hidden.has(e.key);
    const cy = it.y + it.height / 2;
    const children: SceneNode[] = [];
    if (state.hovered === e.key && !e.static) {
      children.push({
        type: 'rect',
        key: 'hover',
        x: it.x,
        y: it.y,
        width: it.width,
        height: it.height,
        rx: CHROME.legendHoverRadius,
        style: { fill: theme.legendHover },
      });
    }
    const sx = it.contentX;
    const sw = swatchWidth(layout.swatch, e);
    if (layout.swatch === 'line' || e.static) {
      children.push({
        type: 'line',
        key: 'swatch',
        x1: sx,
        x2: sx + sw,
        y1: cy,
        y2: cy,
        style: { stroke: hidden ? theme.textSecondary : e.color, strokeWidth: 3, dash: dashFor(e.lineStyle, 3) },
      });
    } else if (hidden) {
      children.push({
        type: 'rect',
        key: 'swatch',
        x: sx + 1,
        y: cy - SQUARE / 2 + 1,
        width: SQUARE - 2,
        height: SQUARE - 2,
        rx: 3,
        style: { fill: 'none', stroke: theme.textSecondary, strokeWidth: 2 },
      });
    } else {
      children.push({
        type: 'rect',
        key: 'swatch',
        x: sx,
        y: cy - SQUARE / 2,
        width: SQUARE,
        height: SQUARE,
        rx: 4,
        style: { fill: e.color },
      });
    }
    children.push({
      type: 'text',
      key: 'label',
      x: sx + sw + CHROME.legendSwatchGap,
      y: cy,
      text: it.text,
      font: f,
      baseline: 'middle',
      style: { fill: hidden ? theme.textSecondary : theme.text },
    });
    nodes.push(group(`item-${e.key}`, children, { style: { opacity: fadeOf(e.key) } }));
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
    const el = this.element;
    el.hidden = !layout;
    if (!layout) {
      if (this.signature) {
        el.replaceChildren();
        this.buttons.clear();
        this.signature = '';
      }
      return;
    }
    el.setAttribute('aria-label', title ?? 'Legend');
    const sig = JSON.stringify(layout.items.map((i) => [i.entry.key, i.entry.label, i.entry.value, i.entry.static]));
    if (sig !== this.signature) {
      this.signature = sig;
      const focused = [...this.buttons].find(([, b]) => b === document.activeElement)?.[0];
      el.replaceChildren();
      this.buttons.clear();
      for (const it of layout.items) {
        const e = it.entry;
        const name = e.value ? `${e.label}, ${e.value}` : e.label;
        let node: HTMLElement;
        if (e.static) {
          node = document.createElement('span');
          node.setAttribute('role', 'img');
          node.setAttribute('aria-label', name);
        } else {
          const b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-label', name);
          b.addEventListener('click', () => this.handlers.onToggle(e.key));
          b.addEventListener('pointerenter', () => this.hover(e.key));
          b.addEventListener('pointerleave', () => this.hover(null));
          b.addEventListener('focus', () => {
            this.focusKey = e.key;
            this.emit();
          });
          b.addEventListener('blur', () => {
            this.focusKey = null;
            this.emit();
          });
          node = b;
        }
        node.className = 's2c-legend-hit';
        el.append(node);
        this.buttons.set(e.key, node);
      }
      if (focused) this.buttons.get(focused)?.focus({ preventScroll: true });
    }
    for (const it of layout.items) {
      const b = this.buttons.get(it.entry.key);
      if (!b) continue;
      b.style.left = `${layout.x + it.x}px`;
      b.style.top = `${layout.y + it.y}px`;
      b.style.width = `${it.width}px`;
      b.style.height = `${it.height}px`;
      if (!it.entry.static) b.setAttribute('aria-pressed', String(!hidden.has(it.entry.key)));
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
