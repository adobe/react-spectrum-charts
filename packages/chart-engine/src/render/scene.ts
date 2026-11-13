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

/** Marker sizes relative to the point radius, so every shape looks about as heavy as a circle. */
const MARKER_SCALE = {
  /** Half the side of a square. */
  square: 0.9,
  /** Distance from centre to a triangle's apex. */
  triangle: 1.15,
  /** Depth of a triangle's base below the centre, relative to its apex distance. */
  triangleBase: 0.85,
  /** Distance from centre to a diamond's corners. */
  diamond: 1.25,
} as const;

/** Length of a direction triangle from base to tip, relative to its half-base. */
const ARROW_LENGTH_RATIO = 1.2;
const DEFAULT_ARROW_HALF_BASE = 5;

/** Dash patterns relative to the stroke width. */
const DASH = { dashLength: 2.5, dashGap: 1.6, dotGap: 2 } as const;

/** Path data for a point marker centred on (0, 0). */
export function shapePath(shape: string, r: number): string {
  switch (shape) {
    case 'square': {
      const half = r * MARKER_SCALE.square;
      return `M${-half},${-half}H${half}V${half}H${-half}Z`;
    }
    case 'triangle': {
      const apex = r * MARKER_SCALE.triangle;
      const base = apex * MARKER_SCALE.triangleBase;
      return `M0,${-apex}L${apex},${base}L${-apex},${base}Z`;
    }
    case 'diamond': {
      const corner = r * MARKER_SCALE.diamond;
      return `M0,${-corner}L${corner},0L0,${corner}L${-corner},0Z`;
    }
    default:
      return `M${r},0A${r},${r} 0 1,1 ${-r},0A${r},${r} 0 1,1 ${r},0Z`;
  }
}

/** Small filled triangle pointing in `dir`, with its base centered on (x, y). */
export function triangle(
  key: string,
  x: number,
  y: number,
  dir: 'left' | 'right' | 'up' | 'down',
  color: string,
  halfBase = DEFAULT_ARROW_HALF_BASE,
): PathNode {
  const length = halfBase * ARROW_LENGTH_RATIO;
  let d: string;
  switch (dir) {
    case 'right':
      d = `M${x},${y - halfBase}L${x + length},${y}L${x},${y + halfBase}Z`;
      break;
    case 'left':
      d = `M${x},${y - halfBase}L${x - length},${y}L${x},${y + halfBase}Z`;
      break;
    case 'down':
      d = `M${x - halfBase},${y}L${x},${y + length}L${x + halfBase},${y}Z`;
      break;
    default:
      d = `M${x - halfBase},${y}L${x},${y - length}L${x + halfBase},${y}Z`;
  }
  return { type: 'path', key, d, style: { fill: color } };
}

/** Dash pattern for a line style at a given stroke width. */
export function dashFor(style: 'solid' | 'dashed' | 'dotted' | undefined, width: number): number[] | undefined {
  if (style === 'dashed') return [width * DASH.dashLength, width * DASH.dashGap];
  if (style === 'dotted') return [0, width * DASH.dotGap];
  return undefined;
}
