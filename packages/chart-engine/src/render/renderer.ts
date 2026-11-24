import type { GroupNode, LayerId, TextNode } from './scene.js';

/** Draws scene layers. Each layer can be redrawn without touching the others. */
export interface Renderer {
  readonly element: HTMLElement | SVGSVGElement;
  /** Resize the surface. Callers must redraw every layer afterwards. */
  setSize(width: number, height: number, background?: string): void;
  renderLayer(id: LayerId, root: GroupNode): void;
  destroy(): void;
}

/** Stroke width of the background halo behind text, shared by both renderers. */
export const HALO_STROKE_WIDTH = 4;

const DEFAULT_FONT = { weight: '400', size: '12px', sizePx: 12 } as const;

/** Distance from the alphabetic baseline to each anchor, relative to the font size. */
const BASELINE_RATIO = { top: 0.78, middle: 0.34, bottom: 0.22 } as const;

/** Offset from the anchor y to the alphabetic baseline, shared by both renderers. */
export function baselineOffset(node: TextNode): number {
  const size = Number(/(\d+(?:\.\d+)?)px/.exec(node.font)?.[1] ?? DEFAULT_FONT.sizePx);
  switch (node.baseline) {
    case 'top':
      return size * BASELINE_RATIO.top;
    case 'middle':
      return size * BASELINE_RATIO.middle;
    case 'bottom':
      return -size * BASELINE_RATIO.bottom;
    default:
      return 0;
  }
}

/** Matches CSS font shorthand: "<weight> <size>px <family>". */
export function parseFont(font: string): { weight: string; size: string; family: string } {
  const match = /^(\S+)\s+(\d+(?:\.\d+)?px)\s+(.*)$/.exec(font);
  if (!match) return { weight: DEFAULT_FONT.weight, size: DEFAULT_FONT.size, family: font };
  return { weight: match[1], size: match[2], family: match[3] };
}
