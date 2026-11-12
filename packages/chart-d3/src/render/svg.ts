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
import { AriaProps, LinearGradient, Paint, SceneNode, TextNode, symbolPath } from '../scene.js';
import { baselineOffset, lineHeight } from '../text.js';
import { SceneRenderer } from './renderer.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

type Attrs = Record<string, string | number | undefined>;

interface ElementState {
  el: SVGElement;
  type: SceneNode['type'];
  attrs: Attrs;
  text?: string;
  children?: Map<string, ElementState>;
  clipRect?: SVGRectElement;
  gradient?: SVGLinearGradientElement;
}

const TAGS: Record<SceneNode['type'], string> = {
  group: 'g',
  path: 'path',
  rule: 'line',
  rect: 'path',
  symbol: 'path',
  text: 'text',
  image: 'image',
};

const ANCHOR: Record<string, string> = { left: 'start', center: 'middle', right: 'end' };

let idCounter = 0;

/**
 * Renders scenes to SVG, reusing elements by key and only touching attributes that changed.
 */
export class SvgRenderer implements SceneRenderer {
  readonly element: SVGSVGElement;
  private readonly defs: SVGDefsElement;
  private readonly root: ElementState;
  private readonly uid = `rsc-d3-${++idCounter}`;

  constructor(container: HTMLElement) {
    this.element = document.createElementNS(SVG_NS, 'svg');
    this.element.setAttribute('class', 'marks');
    this.element.style.display = 'block';
    this.defs = document.createElementNS(SVG_NS, 'defs');
    this.element.appendChild(this.defs);
    const g = document.createElementNS(SVG_NS, 'g');
    this.element.appendChild(g);
    this.root = { el: g, type: 'group', attrs: {}, children: new Map() };
    container.appendChild(this.element);
  }

  resize(width: number, height: number): void {
    this.element.setAttribute('width', String(width));
    this.element.setAttribute('height', String(height));
    this.element.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }

  render(scene: SceneNode[]): void {
    this.reconcileChildren(this.root, scene, '');
  }

  toSVG(): string {
    return new XMLSerializer().serializeToString(this.element);
  }

  destroy(): void {
    this.element.remove();
  }

  private reconcileChildren(parent: ElementState, nodes: SceneNode[], path: string): void {
    const previous = parent.children ?? new Map<string, ElementState>();
    const next = new Map<string, ElementState>();
    let cursor: Element | null = parent.el.firstElementChild;
    for (const node of nodes) {
      let state = previous.get(node.key);
      if (state && state.type !== node.type) {
        if (state.el === cursor) cursor = cursor.nextElementSibling;
        this.removeState(state);
        state = undefined;
      }
      if (!state) {
        state = { el: document.createElementNS(SVG_NS, TAGS[node.type]) as SVGElement, type: node.type, attrs: {} };
      }
      if (state.el === cursor) {
        cursor = cursor.nextElementSibling;
      } else {
        parent.el.insertBefore(state.el, cursor);
      }
      this.update(state, node, `${path}/${node.key}`);
      next.set(node.key, state);
    }
    for (const [key, state] of previous) {
      if (!next.has(key)) this.removeState(state);
    }
    parent.children = next;
  }

  private removeState(state: ElementState): void {
    state.el.remove();
    state.gradient?.remove();
    state.children?.forEach((child) => this.removeState(child));
    state.clipRect?.parentElement?.remove();
  }

  private update(state: ElementState, node: SceneNode, path: string): void {
    const attrs: Attrs = { opacity: node.opacity === undefined || node.opacity === 1 ? undefined : node.opacity };
    if (node.role) attrs['data-role'] = node.role;
    if (node.aria) Object.assign(attrs, ariaAttrs(node.aria));
    switch (node.type) {
      case 'group': {
        const { x = 0, y = 0 } = node;
        attrs.transform = x || y ? `translate(${x},${y})` : undefined;
        this.updateClip(state, node.clip, path);
        attrs['clip-path'] = state.clipRect ? `url(#${state.clipRect.parentElement?.id})` : undefined;
        this.setAttrs(state, attrs);
        this.reconcileChildren(state, node.children, path);
        return;
      }
      case 'path':
        attrs.d = node.d;
        attrs.fill = this.paint(state, node.fill, path);
        attrs['fill-opacity'] = node.fillOpacity;
        break;
      case 'rect':
        attrs.d = rectPath(node.x, node.y, node.width, node.height, node.cornerRadius);
        attrs.fill = this.paint(state, node.fill, path);
        attrs['fill-opacity'] = node.fillOpacity;
        break;
      case 'image':
        attrs.href = node.url;
        attrs.x = node.x;
        attrs.y = node.y;
        attrs.width = node.width;
        attrs.height = node.height;
        attrs.preserveAspectRatio = 'xMidYMid';
        this.setAttrs(state, attrs);
        return;
      case 'rule':
        attrs.x1 = node.x;
        attrs.y1 = node.y;
        attrs.x2 = node.x2;
        attrs.y2 = node.y2;
        break;
      case 'symbol':
        attrs.transform = `translate(${node.x},${node.y})`;
        attrs.d = symbolPath(node.shape, node.size);
        attrs.fill = node.fill ?? 'none';
        attrs['fill-opacity'] = node.fillOpacity;
        break;
      case 'text':
        this.updateText(state, node, attrs);
        return;
    }
    attrs.stroke = node.stroke ?? 'none';
    attrs['stroke-width'] = node.strokeWidth;
    attrs['stroke-opacity'] = node.strokeOpacity === 1 ? undefined : node.strokeOpacity;
    attrs['stroke-dasharray'] = node.strokeDash?.length ? node.strokeDash.join(',') : undefined;
    attrs['stroke-linecap'] = node.strokeCap;
    this.setAttrs(state, attrs);
  }

  private updateText(state: ElementState, node: TextNode, attrs: Attrs): void {
    const angle = node.angle ? ` rotate(${node.angle})` : '';
    attrs.transform = `translate(${node.x},${node.y})${angle}`;
    attrs.y = baselineOffset(node.baseline, node.fontSize) || undefined;
    attrs.fill = node.fill;
    attrs['font-family'] = node.font;
    attrs['font-size'] = `${node.fontSize}px`;
    attrs['font-weight'] = node.fontWeight;
    attrs['text-anchor'] = ANCHOR[node.align ?? 'left'];
    attrs.stroke = node.halo?.color;
    attrs['stroke-width'] = node.halo?.width;
    attrs['paint-order'] = node.halo ? 'stroke' : undefined;
    attrs['stroke-linejoin'] = node.halo ? 'round' : undefined;
    if (state.text !== node.text) {
      if (node.lines) {
        state.el.textContent = '';
        node.lines.forEach((line, i) => {
          const tspan = document.createElementNS(SVG_NS, 'tspan');
          tspan.setAttribute('x', '0');
          if (i) tspan.setAttribute('dy', String(lineHeight(node.fontSize)));
          tspan.textContent = line;
          state.el.appendChild(tspan);
        });
      } else {
        state.el.textContent = node.text;
      }
      state.text = node.text;
    }
    this.setAttrs(state, attrs);
  }

  private setAttrs(state: ElementState, attrs: Attrs): void {
    const prev = state.attrs;
    for (const name in attrs) {
      const value = attrs[name];
      if (prev[name] === value) continue;
      if (value === undefined) state.el.removeAttribute(name);
      else state.el.setAttribute(name, String(value));
    }
    for (const name in prev) {
      if (!(name in attrs) && prev[name] !== undefined) state.el.removeAttribute(name);
    }
    state.attrs = attrs;
  }

  private updateClip(
    state: ElementState,
    clip: { x: number; y: number; width: number; height: number } | undefined,
    path: string
  ): void {
    if (!clip) {
      state.clipRect?.parentElement?.remove();
      state.clipRect = undefined;
      return;
    }
    if (!state.clipRect) {
      const clipPath = document.createElementNS(SVG_NS, 'clipPath');
      clipPath.id = `${this.uid}-clip-${hash(path)}`;
      state.clipRect = document.createElementNS(SVG_NS, 'rect');
      clipPath.appendChild(state.clipRect);
      this.defs.appendChild(clipPath);
    }
    const rect = state.clipRect;
    rect.setAttribute('x', String(clip.x));
    rect.setAttribute('y', String(clip.y));
    rect.setAttribute('width', String(Math.max(0, clip.width)));
    rect.setAttribute('height', String(Math.max(0, clip.height)));
  }

  private paint(state: ElementState, paint: Paint | undefined, path: string): string {
    if (paint === undefined) return 'none';
    if (typeof paint === 'string') return paint;
    if (!state.gradient) {
      state.gradient = document.createElementNS(SVG_NS, 'linearGradient');
      state.gradient.id = `${this.uid}-gradient-${hash(path)}`;
      state.gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
      this.defs.appendChild(state.gradient);
    }
    writeGradient(state.gradient, paint);
    return `url(#${state.gradient.id})`;
  }
}

const ariaAttrs = ({ role, roleDescription, label, hidden }: AriaProps): Attrs =>
  hidden ? { 'aria-hidden': 'true' } : { role, 'aria-roledescription': roleDescription, 'aria-label': label };

const writeGradient = (el: SVGLinearGradientElement, { stops, x1, y1, x2, y2 }: LinearGradient): void => {
  el.setAttribute('x1', String(x1));
  el.setAttribute('y1', String(y1));
  el.setAttribute('x2', String(x2));
  el.setAttribute('y2', String(y2));
  const markup = stops.map((s) => `<stop offset="${s.offset}" stop-color="${s.color}"></stop>`).join('');
  if (el.innerHTML !== markup) el.innerHTML = markup;
};

const hash = (value: string): string => {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (Math.imul(31, h) + value.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
};

/**
 * Gets an SVG path for a rectangle with optional rounded corners.
 * @param x
 * @param y
 * @param width
 * @param height
 * @param r
 * @returns path string
 */
export const rectPath = (x: number, y: number, width: number, height: number, r = 0): string => {
  if (!r) return `M${x},${y}h${width}v${height}h${-width}Z`;
  const radius = Math.min(r, width / 2, height / 2);
  return (
    `M${x + radius},${y}h${width - 2 * radius}a${radius},${radius} 0 0 1 ${radius},${radius}` +
    `v${height - 2 * radius}a${radius},${radius} 0 0 1 ${-radius},${radius}h${2 * radius - width}` +
    `a${radius},${radius} 0 0 1 ${-radius},${-radius}v${
      2 * radius - height
    }a${radius},${radius} 0 0 1 ${radius},${-radius}Z`
  );
};
