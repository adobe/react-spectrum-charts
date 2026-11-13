import { CHROME } from './assumptions.js';
import { layoutLegend, type LegendLayout } from './legend.js';
import type { LegendSpec, Rect } from './module.js';
import type { SizeTokens } from './theme.js';
import { layoutTitle, type TitleLayout } from './title.js';
import type { Padding } from './types.js';

export interface FrameInput {
  width: number;
  height: number;
  padding: Padding | undefined;
  minimal: boolean;
  title?: string;
  subtitle?: string;
  legend: LegendSpec | null;
  sizes: SizeTokens;
}

export interface ChartFrame {
  title: { layout: TitleLayout; x: number; y: number } | null;
  legend: LegendLayout | null;
  plot: Rect;
}

export function resolvePadding(p: Padding | undefined, minimal: boolean): { top: number; right: number; bottom: number; left: number } {
  const def = minimal ? 2 : CHROME.padding;
  if (typeof p === 'number') return { top: p, right: p, bottom: p, left: p };
  return { top: p?.top ?? def, right: p?.right ?? def, bottom: p?.bottom ?? def, left: p?.left ?? def };
}

/** Place the title, legend and plot area inside the scene. */
export function layoutFrame(input: FrameInput): ChartFrame {
  const pad = resolvePadding(input.padding, input.minimal);
  let x = pad.left;
  let y = pad.top;
  let w = Math.max(0, input.width - pad.left - pad.right);
  let h = Math.max(0, input.height - pad.top - pad.bottom);

  let title: ChartFrame['title'] = null;
  if (!input.minimal) {
    const t = layoutTitle(input.title, input.subtitle, input.sizes, w);
    if (t) {
      title = { layout: t, x, y };
      y += t.height + CHROME.titleGap;
      h -= t.height + CHROME.titleGap;
    }
  }

  let legend: LegendLayout | null = null;
  const spec = input.legend;
  if (spec?.show && spec.entries.length && !input.minimal) {
    const pos = spec.position ?? 'top';
    const vertical = (pos === 'left' || pos === 'right') && spec.kind !== 'bar';
    const side = pos === 'left' || pos === 'right';
    const maxW = side ? Math.max(40, w * CHROME.legendMaxShare) : w;
    legend = layoutLegend(spec, input.sizes, maxW, vertical);
    if (pos === 'top') {
      legend.x = x;
      legend.y = y;
      y += legend.height + CHROME.legendGap;
      h -= legend.height + CHROME.legendGap;
    } else if (pos === 'bottom') {
      legend.x = x;
      legend.y = y + h - legend.height;
      h -= legend.height + CHROME.legendGap;
    } else if (pos === 'left') {
      legend.x = x + (vertical ? CHROME.legendItemPadX : 0);
      legend.y = y;
      const used = legend.width + CHROME.legendSideGap + (vertical ? CHROME.legendItemPadX : 0);
      x += used;
      w -= used;
    } else {
      legend.x = x + w - legend.width - (vertical ? CHROME.legendItemPadX : 0);
      legend.y = y;
      w -= legend.width + CHROME.legendSideGap + (vertical ? CHROME.legendItemPadX : 0);
    }
  }
  return { title, legend, plot: { x, y, width: Math.max(0, w), height: Math.max(0, h) } };
}
