import { baselineOffset } from './renderer.js';
import type { Renderer } from './renderer.js';
import type { GroupNode, LayerId, Scene, SceneNode, Style } from './scene.js';
import { isGradient, LAYERS } from './scene.js';

type Ctx = CanvasRenderingContext2D;

/** Caches parsed Path2D objects; shared by all layers of a chart. */
export class PathCache {
  private paths = new Map<string, Path2D>();
  private used = new Set<string>();
  get(d: string): Path2D {
    this.used.add(d);
    let p = this.paths.get(d);
    if (!p) {
      p = new Path2D(d);
      this.paths.set(d, p);
    }
    return p;
  }
  /** Drop paths not used since the last sweep once the cache grows large. */
  sweep(): void {
    if (this.paths.size > this.used.size * 2 + 400) {
      for (const k of this.paths.keys()) if (!this.used.has(k)) this.paths.delete(k);
    }
    this.used.clear();
  }
  clear(): void {
    this.paths.clear();
    this.used.clear();
  }
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
      const c = document.createElement('canvas');
      c.dataset.layer = id;
      if (!c.getContext('2d')) throw new Error('Canvas 2D context is unavailable');
      this.element.append(c);
      this.canvases.set(id, c);
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
    const dpr = typeof devicePixelRatio === 'number' && devicePixelRatio > 0 ? devicePixelRatio : 1;
    const c = this.canvases.get(id)!;
    const w = Math.round(this.width * dpr);
    const h = Math.round(this.height * dpr);
    if (c.width !== w) c.width = w;
    if (c.height !== h) c.height = h;
    c.style.width = `${this.width}px`;
    c.style.height = `${this.height}px`;
    const ctx = c.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
    return;
  }
  const s = node.style ?? {};
  ctx.save();
  if (s.opacity != null) ctx.globalAlpha *= s.opacity;
  switch (node.type) {
    case 'path': {
      if (node.x || node.y) ctx.translate(node.x ?? 0, node.y ?? 0);
      const p = cache.get(node.d);
      if (setFill(ctx, s)) ctx.fill(p);
      if (setStroke(ctx, s)) ctx.stroke(p);
      break;
    }
    case 'line':
      if (setStroke(ctx, s)) {
        ctx.beginPath();
        ctx.moveTo(node.x1, node.y1);
        ctx.lineTo(node.x2, node.y2);
        ctx.stroke();
      }
      break;
    case 'rect': {
      ctx.beginPath();
      const w = Math.max(0, node.width);
      const h = Math.max(0, node.height);
      if (node.rx) ctx.roundRect(node.x, node.y, w, h, node.rx);
      else ctx.rect(node.x, node.y, w, h);
      if (setFill(ctx, s)) ctx.fill();
      if (setStroke(ctx, s)) ctx.stroke();
      break;
    }
    case 'circle':
      ctx.beginPath();
      ctx.arc(node.cx, node.cy, node.r, 0, Math.PI * 2);
      if (setFill(ctx, s)) ctx.fill();
      if (setStroke(ctx, s)) ctx.stroke();
      break;
    case 'text': {
      ctx.font = node.font;
      ctx.textAlign = node.align === 'middle' ? 'center' : node.align === 'end' ? 'right' : 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.translate(node.x, node.y);
      if (node.rotate) ctx.rotate((node.rotate * Math.PI) / 180);
      const y = baselineOffset(node);
      if (node.halo) {
        ctx.strokeStyle = node.halo;
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.setLineDash([]);
        ctx.strokeText(node.text, 0, y);
      }
      if (setFill(ctx, s)) ctx.fillText(node.text, 0, y);
      break;
    }
  }
  ctx.restore();
}

function setFill(ctx: Ctx, s: Style): boolean {
  if (!s.fill || s.fill === 'none') return false;
  if (isGradient(s.fill)) {
    const g = ctx.createLinearGradient(0, s.fill.y1, 0, s.fill.y2);
    for (const stop of s.fill.stops) g.addColorStop(clamp01(stop.offset), withAlpha(stop.color, stop.opacity));
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = s.fill;
  }
  return true;
}

function setStroke(ctx: Ctx, s: Style): boolean {
  if (!s.stroke || s.stroke === 'none') return false;
  ctx.strokeStyle = s.stroke;
  ctx.lineWidth = s.strokeWidth ?? 1;
  ctx.setLineDash(s.dash ?? []);
  ctx.lineCap = s.lineCap ?? 'butt';
  ctx.lineJoin = s.lineJoin ?? 'miter';
  return true;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

const alphaCache = new Map<string, string>();

/** Apply an opacity to any CSS color so canvas gradients match SVG stop-opacity. */
export function withAlpha(color: string, alpha: number): string {
  if (alpha >= 1) return color;
  const key = color + '|' + alpha;
  const hit = alphaCache.get(key);
  if (hit) return hit;
  let r: number, g: number, b: number;
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color);
  const rgb = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(color);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, '$&$&') : hex[1];
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  } else if (rgb) {
    r = +rgb[1];
    g = +rgb[2];
    b = +rgb[3];
  } else {
    return color;
  }
  const out = `rgba(${r},${g},${b},${alpha})`;
  alphaCache.set(key, out);
  return out;
}
