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
import { Datum } from './types.js';

export interface LinearGradient {
  gradient: 'linear';
  stops: { offset: number; color: string }[];
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type Paint = string | LinearGradient;

/** ARIA attributes a node carries, matching what Vega's SVG renderer emits for the equivalent mark. */
export interface AriaProps {
  role?: string;
  roleDescription?: string;
  label?: string;
  hidden?: boolean;
}

/** Per-frame behaviors the runtime applies to a built node, so animation frames don't rebuild marks. */
export interface NodeTraits {
  /** Series whose animated hover fraction sets the node's opacity while hover animates. */
  emphasis?: string;
  /** Hidden until the draw-in sweep reaches this x. */
  revealX?: number;
  /** Clipped to the draw-in sweep; `fixedHeight` keeps a fixed metric axis's plot-height clip. */
  drawInClip?: { fixedHeight?: number };
}

interface BaseNode {
  /** Stable identity used by renderers to reuse elements between frames. */
  key: string;
  /** Vega-compatible role, so tests and parity checks can find items the same way in both engines. */
  role?: string;
  opacity?: number;
  datum?: Datum;
  aria?: AriaProps;
  traits?: NodeTraits;
}

interface StrokeProps {
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  strokeDash?: number[];
  strokeCap?: 'butt' | 'round' | 'square';
}

export interface GroupNode extends BaseNode {
  type: 'group';
  x?: number;
  y?: number;
  clip?: { x: number; y: number; width: number; height: number };
  children: SceneNode[];
}

export interface PathNode extends BaseNode, StrokeProps {
  type: 'path';
  d: string;
  fill?: Paint;
  fillOpacity?: number;
  /** Pads bounds by a second stroke width for miter joins, like Vega's path marks (but not its line or area marks). */
  miterBounds?: boolean;
}

export interface RuleNode extends BaseNode, StrokeProps {
  type: 'rule';
  x: number;
  y: number;
  x2: number;
  y2: number;
}

export interface RectNode extends BaseNode, StrokeProps {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: Paint;
  fillOpacity?: number;
  cornerRadius?: number;
}

export interface SymbolNode extends BaseNode, StrokeProps {
  type: 'symbol';
  x: number;
  y: number;
  /** Area in square pixels, like Vega's symbol size. */
  size: number;
  /** 'circle' or an SVG path normalized to a 2x2 box centered on the origin, like Vega's custom shapes. */
  shape: string;
  fill?: string;
  fillOpacity?: number;
}

export interface TextNode extends BaseNode {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fill: string;
  font: string;
  fontSize: number;
  fontWeight?: string | number;
  align?: 'left' | 'center' | 'right';
  baseline?: 'top' | 'middle' | 'bottom' | 'alphabetic';
  angle?: number;
  /** Multi-line text drawn downward from the first line, like Vega's array text; `text` holds the lines joined by newlines. */
  lines?: string[];
  /** Halo drawn behind the text, used for hover labels on top of lines. */
  halo?: { color: string; width: number };
}

export interface ImageNode extends BaseNode {
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  url: string;
}

export type SceneNode = GroupNode | PathNode | RuleNode | RectNode | SymbolNode | TextNode | ImageNode;

/**
 * Creates a group node.
 * @param key
 * @param children
 * @param props
 * @returns GroupNode
 */
export const group = (key: string, children: SceneNode[], props: Partial<GroupNode> = {}): GroupNode => ({
  type: 'group',
  key,
  children,
  ...props,
});

/** Vega's built-in symbol shapes (other than circle) as unit paths, so they scale like custom paths. */
export const BUILTIN_SYMBOLS: Record<string, string> = {
  square: 'M-1 -1h2v2h-2Z',
  diamond: 'M-1 0L0 -1L1 0L0 1Z',
  cross: 'M-1 -0.4L-1 0.4L-0.4 0.4L-0.4 1L0.4 1L0.4 0.4L1 0.4L1 -0.4L0.4 -0.4L0.4 -1L-0.4 -1L-0.4 -0.4Z',
  arrow:
    'M-0.14285714285714285 1L0.14285714285714285 1L0.14285714285714285 -0.125L0.4 -0.125L0 -1L-0.4 -0.125L-0.14285714285714285 -0.125Z',
  wedge: 'M0 -1.1547005383792515L-0.25 0.5773502691896257L0.25 0.5773502691896257Z',
  triangle: 'M0 -1.1547005383792515L-1 0.5773502691896257L1 0.5773502691896257Z',
  'triangle-up': 'M0 -0.8660254037844386L-1 0.8660254037844386L1 0.8660254037844386Z',
  'triangle-down': 'M0 0.8660254037844386L-1 -0.8660254037844386L1 -0.8660254037844386Z',
  'triangle-right': 'M0.8660254037844386 0L-0.8660254037844386 -1L-0.8660254037844386 1Z',
  'triangle-left': 'M-0.8660254037844386 0L0.8660254037844386 -1L0.8660254037844386 1Z',
  stroke: 'M-1 0L1 0',
};

/**
 * Converts a symbol size (area) and shape into an SVG path centered on the origin.
 * @param shape
 * @param size
 * @returns path string
 */
export const symbolPath = (shape: string, size: number): string => {
  if (shape === 'circle') {
    const r = Math.sqrt(size) / 2;
    return `M${r},0A${r},${r},0,1,1,${-r},0A${r},${r},0,1,1,${r},0Z`;
  }
  const half = Math.sqrt(size) / 2;
  return scalePath(BUILTIN_SYMBOLS[shape] ?? shape, half);
};

const pathCache = new Map<string, string>();

const NUMBER = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;

const scaleArgs = (command: string, args: number[], factor: number): number[] => {
  if (command.toLowerCase() !== 'a') return args.map((n) => n * factor);
  // arcs: radii and end point scale; rotation and flags don't
  return args.map((n, i) => ([2, 3, 4].includes(i % 7) ? n : n * factor));
};

const scalePath = (path: string, factor: number): string => {
  const cacheKey = `${factor}|${path}`;
  const cached = pathCache.get(cacheKey);
  if (cached) return cached;
  const scaled = (path.match(/[a-df-z][^a-df-z]*/gi) ?? [])
    .map((segment) => {
      const command = segment[0];
      const args = (segment.slice(1).match(NUMBER) ?? []).map(Number);
      return command + scaleArgs(command, args, factor).join(',');
    })
    .join('');
  if (pathCache.size > 500) pathCache.clear();
  pathCache.set(cacheKey, scaled);
  return scaled;
};

/**
 * Walks every node in a scene, depth first, with its absolute offset.
 * @param node
 * @param visit
 * @param dx
 * @param dy
 */
export const walkScene = (
  node: SceneNode,
  visit: (node: SceneNode, dx: number, dy: number) => void,
  dx = 0,
  dy = 0
): void => {
  visit(node, dx, dy);
  if (node.type === 'group') {
    const nx = dx + (node.x ?? 0);
    const ny = dy + (node.y ?? 0);
    node.children.forEach((child) => walkScene(child, visit, nx, ny));
  }
};
