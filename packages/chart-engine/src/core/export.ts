import { drawScene } from '../render/canvas.js';
import type { Scene } from '../render/scene.js';
import { SvgRenderer } from '../render/svg.js';
import { EXPORT } from './assumptions.js';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
/** Scene layers in drawing order. */
const LAYER_ORDER = ['back', 'marks', 'front', 'overlay'] as const;
/** Delay before a download's object URL is released, in ms. */
const REVOKE_URL_DELAY_MS = 1000;

/** Serialize a scene as a standalone SVG document. */
export function sceneToSVG(scene: Scene, title?: string): string {
  const renderer = new SvgRenderer();
  renderer.setSize(scene.width, scene.height);
  scene.layers.forEach((layer, i) => renderer.renderLayer(LAYER_ORDER[i], layer));
  const svg = renderer.element;
  svg.removeAttribute('class');
  svg.removeAttribute('aria-hidden');
  svg.removeAttribute('focusable');
  svg.removeAttribute('style');
  svg.setAttribute('xmlns', SVG_NAMESPACE);
  svg.setAttribute('role', 'img');
  if (title) {
    const titleElement = document.createElementNS(SVG_NAMESPACE, 'title');
    titleElement.textContent = title;
    svg.prepend(titleElement);
  }
  if (scene.background) {
    const background = document.createElementNS(SVG_NAMESPACE, 'rect');
    background.setAttribute('width', '100%');
    background.setAttribute('height', '100%');
    background.setAttribute('fill', scene.background);
    svg.querySelector('defs')!.after(background);
  }
  for (const element of Array.from(svg.querySelectorAll('[data-key],[data-layer]'))) {
    element.removeAttribute('data-key');
    element.removeAttribute('data-layer');
  }
  return new XMLSerializer().serializeToString(svg);
}

/** Rasterize a scene. `scale` is the pixel ratio (2 gives a sharp image on high-DPI screens). */
export function sceneToPNG(scene: Scene, scale = EXPORT.pngScale): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(scene.width * scale));
  canvas.height = Math.max(1, Math.round(scene.height * scale));
  const context = canvas.getContext('2d');
  if (!context) return Promise.reject(new Error('Canvas 2D context is unavailable'));
  drawScene(context, scene, scale);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PNG encoding failed'));
    }, 'image/png');
  });
}

/** Save a blob or SVG string as a file. */
export function downloadFile(content: Blob | string, filename: string): void {
  const blob = typeof content === 'string' ? new Blob([content], { type: 'image/svg+xml' }) : content;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_URL_DELAY_MS);
}
