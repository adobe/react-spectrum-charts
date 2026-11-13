import type { GroupNode, LayerId, TextNode } from './scene.js';

/** Draws scene layers. Each layer can be redrawn without touching the others. */
export interface Renderer {
  readonly element: HTMLElement | SVGSVGElement;
  /** Resize the surface. Callers must redraw every layer afterwards. */
  setSize(width: number, height: number, background?: string): void;
  renderLayer(id: LayerId, root: GroupNode): void;
  destroy(): void;
}

/** Offset from the anchor y to the alphabetic baseline, shared by both renderers. */
export function baselineOffset(node: TextNode): number {
  const size = Number(/(\d+(?:\.\d+)?)px/.exec(node.font)?.[1] ?? 12);
  switch (node.baseline) {
    case 'top':
      return size * 0.78;
    case 'middle':
      return size * 0.34;
    case 'bottom':
      return -size * 0.22;
    default:
      return 0;
  }
}

/** Matches CSS font shorthand: "<weight> <size>px <family>". */
export function parseFont(font: string): { weight: string; size: string; family: string } {
  const m = /^(\S+)\s+(\d+(?:\.\d+)?px)\s+(.*)$/.exec(font);
  return m ? { weight: m[1], size: m[2], family: m[3] } : { weight: '400', size: '12px', family: font };
}
