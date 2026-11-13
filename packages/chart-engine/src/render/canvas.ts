import { baselineOffset, HALO_STROKE_WIDTH } from './renderer.js';
import type { Renderer } from './renderer.js';
import type { CircleNode, GroupNode, LayerId, PathNode, RectNode, Scene, SceneNode, Style, TextNode } from './scene.js';
import { isGradient, LAYERS } from './scene.js';

type Ctx = CanvasRenderingContext2D;

/** A sweep only runs once the cache holds more than twice the paths in use plus this many. */
const PATH_CACHE_SLACK = 400;
const DEFAULT_STROKE_WIDTH = 1;
const FULL_CIRCLE = Math.PI * 2;
const DEGREES_PER_HALF_TURN = 180;

const TEXT_ALIGN: Record<NonNullable<TextNode['align']>, CanvasTextAlign> = { start: 'left', middle: 'center', end: 'right' };

/** Caches parsed Path2D objects; shared by all layers of a chart. */
export class PathCache {
  private paths = new Map<string, Path2D>();
  private used = new Set<string>();
  get(pathData: string): Path2D {
    this.used.add(pathData);
    let path = this.paths.get(pathData);
    if (!path) {
      path = new Path2D(pathData);
      this.paths.set(pathData, path);
    }
    return path;
  }
  /** Drop paths not used since the last sweep once the cache grows large. */
  sweep(): void {
    if (this.paths.size > this.used.size * 2 + PATH_CACHE_SLACK) {
      for (const pathData of this.paths.keys()) if (!this.used.has(pathData)) this.paths.delete(pathData);
    }
    this.used.clear();
  }
  clear(): void {
    this.paths.clear();
    this.used.clear();
  }
}

function devicePixelRatioOrOne(): number {
  return typeof devicePixelRatio === 'number' && devicePixelRatio > 0 ? devicePixelRatio : 1;
}

/** Stacked canvases, one per layer, so a hover only repaints the overlay canvas. */
export class CanvasRenderer implements Renderer {
  readonly element: HTMLDivElement;
  private canvases = new Map<LayerId, HTMLCanvasElement>();
  private cache = new PathCache();
  private width = 0;
  private height = 0;
  private background?: string;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 's2c-surface s2c-canvas-stack';
    this.element.setAttribute('aria-hidden', 'true');
    for (const id of LAYERS) {
      const canvas = document.createElement('canvas');
      canvas.dataset.layer = id;
      if (!canvas.getContext('2d')) throw new Error('Canvas 2D context is unavailable');
      this.element.append(canvas);
      this.canvases.set(id, canvas);
    }
  }

  setSize(width: number, height: number, background?: string): void {
    this.width = width;
    this.height = height;
    this.background = background;
    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;
  }

  renderLayer(id: LayerId, root: GroupNode): void {
    const pixelRatio = devicePixelRatioOrOne();
    const canvas = this.canvases.get(id)!;
    const pixelWidth = Math.round(this.width * pixelRatio);
    const pixelHeight = Math.round(this.height * pixelRatio);
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    canvas.style.width = `${this.width}px`;
    canvas.style.height = `${this.height}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, pixelWidth, pixelHeight);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    if (id === 'back' && this.background) {
      ctx.fillStyle = this.background;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    drawNode(ctx, root, this.cache);
    if (id === 'overlay') this.cache.sweep();
  }

  destroy(): void {
    this.element.remove();
    this.cache.clear();
  }
}

/** Paint a whole scene onto one context (used for PNG export). */
export function drawScene(ctx: Ctx, scene: Scene, scale = 1): void {
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  if (scene.background) {
    ctx.fillStyle = scene.background;
    ctx.fillRect(0, 0, scene.width, scene.height);
  }
  const cache = new PathCache();
  for (const layer of scene.layers) drawNode(ctx, layer, cache);
}

export function drawNode(ctx: Ctx, node: SceneNode, cache: PathCache): void {
  if (node.type === 'group') {
    drawGroup(ctx, node, cache);
    return;
  }
  const style = node.style ?? {};
  ctx.save();
  if (style.opacity != null) ctx.globalAlpha *= style.opacity;
  switch (node.type) {
    case 'path':
      drawPath(ctx, node, style, cache);
      break;
    case 'line':
      if (setStroke(ctx, style)) {
        ctx.beginPath();
        ctx.moveTo(node.x1, node.y1);
        ctx.lineTo(node.x2, node.y2);
        ctx.stroke();
      }
      break;
    case 'rect':
      drawRect(ctx, node, style);
      break;
    case 'circle':
      drawCircle(ctx, node, style);
      break;
    case 'text':
      drawText(ctx, node, style);
      break;
  }
  ctx.restore();
}

function drawGroup(ctx: Ctx, node: GroupNode, cache: PathCache): void {
  ctx.save();
  if (node.x || node.y) ctx.translate(node.x ?? 0, node.y ?? 0);
  if (node.style?.opacity != null) ctx.globalAlpha *= node.style.opacity;
  if (node.clip) {
    ctx.beginPath();
    ctx.rect(node.clip.x, node.clip.y, Math.max(0, node.clip.width), Math.max(0, node.clip.height));
    ctx.clip();
  }
  for (const child of node.children) drawNode(ctx, child, cache);
  ctx.restore();
}

function drawPath(ctx: Ctx, node: PathNode, style: Style, cache: PathCache): void {
  if (node.x || node.y) ctx.translate(node.x ?? 0, node.y ?? 0);
  const path = cache.get(node.d);
  if (setFill(ctx, style)) ctx.fill(path);
  if (setStroke(ctx, style)) ctx.stroke(path);
}

function drawRect(ctx: Ctx, node: RectNode, style: Style): void {
  ctx.beginPath();
  const width = Math.max(0, node.width);
  const height = Math.max(0, node.height);
  if (node.rx) ctx.roundRect(node.x, node.y, width, height, node.rx);
  else ctx.rect(node.x, node.y, width, height);
  if (setFill(ctx, style)) ctx.fill();
  if (setStroke(ctx, style)) ctx.stroke();
}

function drawCircle(ctx: Ctx, node: CircleNode, style: Style): void {
  ctx.beginPath();
  ctx.arc(node.cx, node.cy, node.r, 0, FULL_CIRCLE);
  if (setFill(ctx, style)) ctx.fill();
  if (setStroke(ctx, style)) ctx.stroke();
}

function drawText(ctx: Ctx, node: TextNode, style: Style): void {
  ctx.font = node.font;
  ctx.textAlign = node.align ? TEXT_ALIGN[node.align] : 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.translate(node.x, node.y);
  if (node.rotate) ctx.rotate((node.rotate * Math.PI) / DEGREES_PER_HALF_TURN);
  const y = baselineOffset(node);
  if (node.halo) {
    ctx.strokeStyle = node.halo;
    ctx.lineWidth = HALO_STROKE_WIDTH;
    ctx.lineJoin = 'round';
    ctx.setLineDash([]);
    ctx.strokeText(node.text, 0, y);
  }
  if (setFill(ctx, style)) ctx.fillText(node.text, 0, y);
}

function setFill(ctx: Ctx, style: Style): boolean {
  if (!style.fill || style.fill === 'none') return false;
  if (isGradient(style.fill)) {
    const gradient = ctx.createLinearGradient(0, style.fill.y1, 0, style.fill.y2);
    for (const stop of style.fill.stops) gradient.addColorStop(clamp01(stop.offset), withAlpha(stop.color, stop.opacity));
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = style.fill;
  }
  return true;
}

function setStroke(ctx: Ctx, style: Style): boolean {
  if (!style.stroke || style.stroke === 'none') return false;
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = style.strokeWidth ?? DEFAULT_STROKE_WIDTH;
  ctx.setLineDash(style.dash ?? []);
  ctx.lineCap = style.lineCap ?? 'butt';
  ctx.lineJoin = style.lineJoin ?? 'miter';
  return true;
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

const alphaCache = new Map<string, string>();

/** Red, green and blue channels of a hex or rgb()/rgba() color, or null for other formats. */
function parseRgb(color: string): [number, number, number] | null {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color);
  if (hex) {
    const digits = hex[1].length === 3 ? hex[1].replace(/./g, '$&$&') : hex[1];
    return [parseInt(digits.slice(0, 2), 16), parseInt(digits.slice(2, 4), 16), parseInt(digits.slice(4, 6), 16)];
  }
  const rgb = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(color);
  if (rgb) return [+rgb[1], +rgb[2], +rgb[3]];
  return null;
}

/** Apply an opacity to any CSS color so canvas gradients match SVG stop-opacity. */
export function withAlpha(color: string, alpha: number): string {
  if (alpha >= 1) return color;
  const key = color + '|' + alpha;
  const cached = alphaCache.get(key);
  if (cached) return cached;
  const channels = parseRgb(color);
  if (!channels) return color;
  const [red, green, blue] = channels;
  const out = `rgba(${red},${green},${blue},${alpha})`;
  alphaCache.set(key, out);
  return out;
}
