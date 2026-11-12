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
import { Paint, SceneNode, symbolPath } from '../scene.js';
import { baselineOffset, fontString, lineHeight } from '../text.js';
import { SceneRenderer } from './renderer.js';
import { rectPath } from './svg.js';

/**
 * Renders scenes to a HiDPI canvas by repainting the whole scene each frame.
 */
export class CanvasRenderer implements SceneRenderer {
  readonly element: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D | null;
  private width = 0;
  private height = 0;
  private ratio = 1;
  private readonly paths = new Map<string, Path2D>();
  private readonly images = new Map<string, HTMLImageElement>();
  private scene: SceneNode[] = [];

  constructor(container: HTMLElement) {
    this.element = document.createElement('canvas');
    this.element.className = 'marks';
    this.element.style.display = 'block';
    this.ctx = this.element.getContext('2d');
    container.appendChild(this.element);
  }

  resize(width: number, height: number): void {
    const ratio = globalThis.devicePixelRatio || 1;
    this.ratio = ratio;
    this.width = width;
    this.height = height;
    this.element.width = Math.round(width * ratio);
    this.element.height = Math.round(height * ratio);
    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;
  }

  render(scene: SceneNode[]): void {
    const { ctx } = this;
    if (!ctx) return;
    this.scene = scene;
    const { ratio } = this;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    scene.forEach((node) => this.draw(ctx, node));
  }

  destroy(): void {
    this.element.remove();
    this.paths.clear();
    this.images.clear();
    this.scene = [];
  }

  /** Gets a loaded image, or starts loading it and repaints the last scene once it arrives. */
  private image(url: string): HTMLImageElement | undefined {
    let image = this.images.get(url);
    if (!image) {
      image = new Image();
      image.onload = () => this.render(this.scene);
      image.src = url;
      this.images.set(url, image);
    }
    return image.complete && image.naturalWidth ? image : undefined;
  }

  private path(d: string): Path2D {
    let path = this.paths.get(d);
    if (!path) {
      if (this.paths.size > 2000) this.paths.clear();
      path = new Path2D(d);
      this.paths.set(d, path);
    }
    return path;
  }

  private draw(ctx: CanvasRenderingContext2D, node: SceneNode): void {
    if (node.opacity === 0) return;
    ctx.save();
    ctx.globalAlpha *= node.opacity ?? 1;
    switch (node.type) {
      case 'group':
        ctx.translate(node.x ?? 0, node.y ?? 0);
        if (node.clip) {
          ctx.beginPath();
          ctx.rect(node.clip.x, node.clip.y, node.clip.width, node.clip.height);
          ctx.clip();
        }
        node.children.forEach((child) => this.draw(ctx, child));
        break;
      case 'path': {
        const path = this.path(node.d);
        this.fill(ctx, node.fill, path, node.fillOpacity);
        this.stroke(ctx, node, path);
        break;
      }
      case 'rect': {
        const path = this.path(rectPath(node.x, node.y, node.width, node.height, node.cornerRadius));
        this.fill(ctx, node.fill, path, node.fillOpacity);
        this.stroke(ctx, node, path);
        break;
      }
      case 'image': {
        const image = this.image(node.url);
        if (image) {
          // preserve aspect ratio: fit inside the box and center
          const scale = Math.min(node.width / image.naturalWidth, node.height / image.naturalHeight);
          const w = image.naturalWidth * scale;
          const h = image.naturalHeight * scale;
          ctx.drawImage(image, node.x + (node.width - w) / 2, node.y + (node.height - h) / 2, w, h);
        }
        break;
      }
      case 'rule': {
        const path = new Path2D();
        path.moveTo(node.x, node.y);
        path.lineTo(node.x2, node.y2);
        this.stroke(ctx, node, path);
        break;
      }
      case 'symbol': {
        ctx.translate(node.x, node.y);
        const path = this.path(symbolPath(node.shape, node.size));
        this.fill(ctx, node.fill, path, node.fillOpacity);
        this.stroke(ctx, node, path);
        break;
      }
      case 'text': {
        ctx.translate(node.x, node.y);
        if (node.angle) ctx.rotate((node.angle * Math.PI) / 180);
        ctx.font = fontString(node.fontSize, node.font, node.fontWeight);
        ctx.textAlign = node.align ?? 'left';
        ctx.textBaseline = 'alphabetic';
        const dy = baselineOffset(node);
        const lh = lineHeight(node.fontSize);
        (node.lines ?? [node.text]).forEach((line, i) => {
          if (node.halo) {
            ctx.lineJoin = 'round';
            ctx.lineWidth = node.halo.width;
            ctx.strokeStyle = node.halo.color;
            ctx.strokeText(line, 0, dy + i * lh);
          }
          ctx.fillStyle = node.fill;
          ctx.fillText(line, 0, dy + i * lh);
        });
        break;
      }
    }
    ctx.restore();
  }

  private fill(ctx: CanvasRenderingContext2D, fill: Paint | undefined, path: Path2D, fillOpacity = 1): void {
    if (fill === undefined || fill === 'none' || fillOpacity === 0) return;
    ctx.save();
    ctx.globalAlpha *= fillOpacity;
    ctx.fillStyle = this.paint(ctx, fill);
    ctx.fill(path);
    ctx.restore();
  }

  private stroke(
    ctx: CanvasRenderingContext2D,
    node: {
      stroke?: string;
      strokeWidth?: number;
      strokeOpacity?: number;
      strokeDash?: number[];
      strokeCap?: CanvasLineCap;
    },
    path: Path2D
  ): void {
    if (!node.stroke || node.strokeWidth === 0) return;
    ctx.globalAlpha *= node.strokeOpacity ?? 1;
    ctx.strokeStyle = node.stroke;
    ctx.lineWidth = node.strokeWidth ?? 1;
    ctx.lineCap = node.strokeCap ?? 'butt';
    ctx.setLineDash(node.strokeDash ?? []);
    ctx.stroke(path);
  }

  private paint(ctx: CanvasRenderingContext2D, paint: Paint): string | CanvasGradient {
    if (typeof paint === 'string') return paint;
    const gradient = ctx.createLinearGradient(paint.x1, paint.y1, paint.x2, paint.y2);
    paint.stops.forEach((stop) => gradient.addColorStop(stop.offset, stop.color));
    return gradient;
  }
}
