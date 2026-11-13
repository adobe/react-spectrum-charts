/**
 * Renderer-agnostic scene graph. Both the SVG and canvas renderers draw exactly these
 * primitives so the two outputs stay visually identical.
 */

export interface Gradient {
  /** Vertical linear gradient in the node's coordinate space. */
  y1: number;
  y2: number;
  stops: { offset: number; color: string; opacity: number }[];
}

export interface Style {
  fill?: string | Gradient;
  stroke?: string;
  strokeWidth?: number;
  dash?: number[];
  opacity?: number;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
}

interface Base {
  key: string;
  style?: Style;
}

export interface PathNode extends Base {
  type: 'path';
  d: string;
  /** Optional translation, used for point markers. */
  x?: number;
  y?: number;
}

export interface LineNode extends Base {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface RectNode extends Base {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
}

export interface CircleNode extends Base {
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
}

export interface TextNode extends Base {
  type: 'text';
  x: number;
  y: number;
  text: string;
  font: string;
  align?: 'start' | 'middle' | 'end';
  baseline?: 'top' | 'middle' | 'alphabetic' | 'bottom';
  rotate?: number;
  /** Background halo for legibility over lines. */
  halo?: string;
}

export interface GroupNode extends Base {
  type: 'group';
  x?: number;
  y?: number;
  clip?: { x: number; y: number; width: number; height: number };
  children: SceneNode[];
}

export type SceneNode = PathNode | LineNode | RectNode | CircleNode | TextNode | GroupNode;

/**
 * Stacked layers, bottom to top. Each is redrawn only when its inputs change, so hovering repaints
 * `overlay` (and `marks` only when the emphasized series or segment changes).
 *   back    – title, axes, grid, ranges, facet titles
 *   marks   – the chart type's shapes and direct labels
 *   front   – reference lines and the legend
 *   overlay – hover, selection and focus visuals (never exported)
 */
export type LayerId = 'back' | 'marks' | 'front' | 'overlay';
export const LAYERS: readonly LayerId[] = ['back', 'marks', 'front', 'overlay'];

/** A complete, renderer-agnostic picture of a chart, used for export. */
export interface Scene {
  width: number;
  height: number;
  background?: string;
  layers: GroupNode[];
}

export function group(key: string, children: SceneNode[], extra: Partial<GroupNode> = {}): GroupNode {
  return { type: 'group', key, children, ...extra };
}

export function isGradient(fill: Style['fill']): fill is Gradient {
  return typeof fill === 'object' && fill !== null;
}

/** Path data for a point marker centred on (0, 0). */
export function shapePath(shape: string, r: number): string {
  switch (shape) {
    case 'square': {
      const s = r * 0.9;
      return `M${-s},${-s}H${s}V${s}H${-s}Z`;
    }
    case 'triangle': {
      const h = r * 1.15;
      return `M0,${-h}L${h},${h * 0.85}L${-h},${h * 0.85}Z`;
    }
    case 'diamond': {
      const h = r * 1.25;
      return `M0,${-h}L${h},0L0,${h}L${-h},0Z`;
    }
    default:
      return `M${r},0A${r},${r} 0 1,1 ${-r},0A${r},${r} 0 1,1 ${r},0Z`;
  }
}

/** Small filled triangle pointing in `dir`, with its base centered on (x, y). */
export function triangle(key: string, x: number, y: number, dir: 'left' | 'right' | 'up' | 'down', color: string, s = 5): PathNode {
  let d: string;
  switch (dir) {
    case 'right':
      d = `M${x},${y - s}L${x + s * 1.2},${y}L${x},${y + s}Z`;
      break;
    case 'left':
      d = `M${x},${y - s}L${x - s * 1.2},${y}L${x},${y + s}Z`;
      break;
    case 'down':
      d = `M${x - s},${y}L${x},${y + s * 1.2}L${x + s},${y}Z`;
      break;
    default:
      d = `M${x - s},${y}L${x},${y - s * 1.2}L${x + s},${y}Z`;
  }
  return { type: 'path', key, d, style: { fill: color } };
}

/** Dash pattern for a line style at a given stroke width. */
export function dashFor(style: 'solid' | 'dashed' | 'dotted' | undefined, w: number): number[] | undefined {
  if (style === 'dashed') return [w * 2.5, w * 1.6];
  if (style === 'dotted') return [0, w * 2];
  return undefined;
}
