import { drawScene } from '../render/canvas.js';
import type { Scene } from '../render/scene.js';
import { SvgRenderer } from '../render/svg.js';
import { EXPORT } from './assumptions.js';

const NS = 'http://www.w3.org/2000/svg';

/** Serialize a scene as a standalone SVG document. */
export function sceneToSVG(scene: Scene, title?: string): string {
  const r = new SvgRenderer();
  r.setSize(scene.width, scene.height);
  const layers = ['back', 'marks', 'front', 'overlay'] as const;
  scene.layers.forEach((layer, i) => r.renderLayer(layers[i], layer));
  const svg = r.element;
  svg.removeAttribute('class');
  svg.removeAttribute('aria-hidden');
  svg.removeAttribute('focusable');
  svg.removeAttribute('style');
  svg.setAttribute('xmlns', NS);
  svg.setAttribute('role', 'img');
  if (title) {
    const t = document.createElementNS(NS, 'title');
    t.textContent = title;
    svg.prepend(t);
  }
  if (scene.background) {
    const bg = document.createElementNS(NS, 'rect');
    bg.setAttribute('width', '100%');
    bg.setAttribute('height', '100%');
    bg.setAttribute('fill', scene.background);
    svg.querySelector('defs')!.after(bg);
  }
  for (const g of Array.from(svg.querySelectorAll('[data-key],[data-layer]'))) {
    g.removeAttribute('data-key');
    g.removeAttribute('data-layer');
  }
  return new XMLSerializer().serializeToString(svg);
}

/** Rasterize a scene. `scale` is the pixel ratio (2 gives a sharp image on high-DPI screens). */
export function sceneToPNG(scene: Scene, scale = EXPORT.pngScale): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(scene.width * scale));
  canvas.height = Math.max(1, Math.round(scene.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Canvas 2D context is unavailable'));
  drawScene(ctx, scene, scale);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encoding failed'))), 'image/png'),
  );
}

/** Save a blob or SVG string as a file. */
export function downloadFile(content: Blob | string, filename: string): void {
  const blob = typeof content === 'string' ? new Blob([content], { type: 'image/svg+xml' }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
