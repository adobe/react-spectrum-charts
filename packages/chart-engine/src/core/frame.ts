import { CHROME } from './assumptions.js';
import { layoutLegend, type LegendLayout } from './legend.js';
import type { LegendSpec, Rect } from './module.js';
import type { SizeTokens } from './theme.js';
import { layoutTitle, type TitleLayout } from './title.js';
import type { Padding } from './types.js';

/** Default padding of minimal charts (sparklines), in px. */
const MINIMAL_PADDING = 2;
/** Left/right legends are never squeezed narrower than this, in px. */
const MIN_SIDE_LEGEND_WIDTH = 40;

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

export function resolvePadding(
  padding: Padding | undefined,
  minimal: boolean,
): { top: number; right: number; bottom: number; left: number } {
  const fallback = minimal ? MINIMAL_PADDING : CHROME.padding;
  if (typeof padding === 'number') return { top: padding, right: padding, bottom: padding, left: padding };
  return {
    top: padding?.top ?? fallback,
    right: padding?.right ?? fallback,
    bottom: padding?.bottom ?? fallback,
    left: padding?.left ?? fallback,
  };
}

/** Place the title, legend and plot area inside the scene. */
export function layoutFrame(input: FrameInput): ChartFrame {
  const padding = resolvePadding(input.padding, input.minimal);
  // The remaining space; shrinks as the title and legend take their share.
  const plot: Rect = {
    x: padding.left,
    y: padding.top,
    width: Math.max(0, input.width - padding.left - padding.right),
    height: Math.max(0, input.height - padding.top - padding.bottom),
  };
  const title = input.minimal ? null : placeTitle(input, plot);
  const spec = input.legend;
  const showLegend = spec?.show && spec.entries.length && !input.minimal;
  const legend = showLegend ? placeLegend(spec, input.sizes, plot) : null;
  return {
    title,
    legend,
    plot: { x: plot.x, y: plot.y, width: Math.max(0, plot.width), height: Math.max(0, plot.height) },
  };
}

/** Lays out the title block at the top of `plot` and removes its height from `plot`. */
function placeTitle(input: FrameInput, plot: Rect): ChartFrame['title'] {
  const layout = layoutTitle(input.title, input.subtitle, input.sizes, plot.width);
  if (!layout) return null;
  const title = { layout, x: plot.x, y: plot.y };
  plot.y += layout.height + CHROME.titleGap;
  plot.height -= layout.height + CHROME.titleGap;
  return title;
}

/** Lays out the legend on its side of `plot` and removes the space it uses from `plot`. */
function placeLegend(spec: LegendSpec, sizes: SizeTokens, plot: Rect): LegendLayout {
  const position = spec.position ?? 'top';
  const onSide = position === 'left' || position === 'right';
  const vertical = onSide && spec.kind !== 'bar';
  const maxWidth = onSide ? Math.max(MIN_SIDE_LEGEND_WIDTH, plot.width * CHROME.legendMaxShare) : plot.width;
  const legend = layoutLegend(spec, sizes, maxWidth, vertical);
  // Vertical lists are inset so the hover background of each entry fits.
  const verticalInset = vertical ? CHROME.legendItemPadX : 0;
  if (position === 'top') {
    legend.x = plot.x;
    legend.y = plot.y;
    plot.y += legend.height + CHROME.legendGap;
    plot.height -= legend.height + CHROME.legendGap;
  } else if (position === 'bottom') {
    legend.x = plot.x;
    legend.y = plot.y + plot.height - legend.height;
    plot.height -= legend.height + CHROME.legendGap;
  } else if (position === 'left') {
    legend.x = plot.x + verticalInset;
    legend.y = plot.y;
    const used = legend.width + CHROME.legendSideGap + verticalInset;
    plot.x += used;
    plot.width -= used;
  } else {
    legend.x = plot.x + plot.width - legend.width - verticalInset;
    legend.y = plot.y;
    plot.width -= legend.width + CHROME.legendSideGap + verticalInset;
  }
  return legend;
}
