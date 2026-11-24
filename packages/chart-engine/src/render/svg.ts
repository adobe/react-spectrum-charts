import { baselineOffset, HALO_STROKE_WIDTH, parseFont, type Renderer } from './renderer.js';
import type { Gradient, GroupNode, LayerId, SceneNode, Style, TextNode } from './scene.js';
import { isGradient, LAYERS } from './scene.js';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
/** Numeric attributes are rounded to hundredths of a pixel. */
const ATTRIBUTE_PRECISION = 100;
const DEFAULT_STROKE_WIDTH = 1;

/** Counter that gives each renderer a unique id prefix for its definitions. */
let rendererCount = 0;

type Clip = NonNullable<GroupNode['clip']>;

export class SvgRenderer implements Renderer {
  readonly element: SVGSVGElement;
  private defs: SVGDefsElement;
  private layers = new Map<LayerId, SVGGElement>();
  private prefix = `s2c${++rendererCount}`;
  private idMap = new Map<string, string>();
  /** Definitions (clips, gradients) referenced by each layer. */
  private layerDefs = new Map<LayerId, Set<string>>();
  private current: Set<string> = new Set();
  private layer: LayerId = 'back';

  /** Stable element id for a definition of `kind` belonging to the node `key` in the current layer. */
  private defId(kind: string, key: string): string {
    const mapKey = this.layer + ':' + kind + ':' + key;
    let id = this.idMap.get(mapKey);
    if (!id) {
      id = `${this.prefix}-${kind}-${this.idMap.size}`;
      this.idMap.set(mapKey, id);
    }
    return id;
  }

  constructor() {
    this.element = document.createElementNS(SVG_NAMESPACE, 'svg');
    this.element.setAttribute('class', 's2c-surface');
    this.element.setAttribute('aria-hidden', 'true');
    this.element.setAttribute('focusable', 'false');
    this.defs = document.createElementNS(SVG_NAMESPACE, 'defs');
    this.element.append(this.defs);
    for (const id of LAYERS) {
      const layerGroup = document.createElementNS(SVG_NAMESPACE, 'g');
      layerGroup.setAttribute('data-layer', id);
      this.element.append(layerGroup);
      this.layers.set(id, layerGroup);
    }
  }

  setSize(width: number, height: number, background?: string): void {
    const svg = this.element;
    setAttr(svg, 'width', width);
    setAttr(svg, 'height', height);
    setAttr(svg, 'viewBox', `0 0 ${width} ${height}`);
    svg.style.background = background ?? 'transparent';
  }

  renderLayer(id: LayerId, root: GroupNode): void {
    this.current = new Set();
    this.layer = id;
    this.reconcileGroup(this.layers.get(id)!, root);
    this.layerDefs.set(id, this.current);
    this.removeUnusedDefs();
  }

  destroy(): void {
    this.element.remove();
  }

  /** Drop clips and gradients no layer references any more. */
  private removeUnusedDefs(): void {
    const live = new Set<string>();
    for (const ids of this.layerDefs.values()) for (const id of ids) live.add(id);
    for (const child of Array.from(this.defs.children)) {
      if (!live.has(child.id)) child.remove();
    }
  }

  private reconcileGroup(el: SVGGElement, node: GroupNode): void {
    setAttr(el, 'transform', translateOf(node));
    if (node.clip) setAttr(el, 'clip-path', `url(#${this.clipPath(node.key, node.clip)})`);
    else setAttr(el, 'clip-path', null);
    this.applyStyle(el, node.style, node.key);
    this.reconcileChildren(el, node.children);
  }

  /** Creates or updates the clip path for a group and returns its id. */
  private clipPath(key: string, clip: Clip): string {
    const id = this.defId('clip', key);
    let clipPath = this.defs.querySelector<SVGClipPathElement>(`#${id}`);
    if (!clipPath) {
      clipPath = document.createElementNS(SVG_NAMESPACE, 'clipPath');
      clipPath.id = id;
      clipPath.append(document.createElementNS(SVG_NAMESPACE, 'rect'));
      this.defs.append(clipPath);
    }
    const rect = clipPath.firstElementChild as SVGRectElement;
    setAttr(rect, 'x', clip.x);
    setAttr(rect, 'y', clip.y);
    setAttr(rect, 'width', Math.max(0, clip.width));
    setAttr(rect, 'height', Math.max(0, clip.height));
    this.current.add(id);
    return id;
  }

  /** Reuses elements by `data-key`, keeps them in scene order and removes the rest. */
  private reconcileChildren(el: SVGGElement, children: SceneNode[]): void {
    const existing = new Map<string, SVGElement>();
    for (const child of Array.from(el.children) as SVGElement[]) {
      const key = child.getAttribute('data-key');
      if (key != null) existing.set(key, child);
    }
    let cursor: Element | null = el.firstElementChild;
    for (const child of children) {
      const tag = tagFor(child);
      let target = existing.get(child.key);
      if (target && target.tagName !== tag) {
        target.remove();
        target = undefined;
      }
      if (target) existing.delete(child.key);
      else {
        target = document.createElementNS(SVG_NAMESPACE, tag) as SVGElement;
        target.setAttribute('data-key', child.key);
      }
      if (target !== cursor) el.insertBefore(target, cursor);
      else cursor = cursor.nextElementSibling;
      this.update(target, child);
    }
    for (const stale of existing.values()) stale.remove();
  }

  private update(el: SVGElement, node: SceneNode): void {
    switch (node.type) {
      case 'group':
        this.reconcileGroup(el as SVGGElement, node);
        return;
      case 'path':
        setAttr(el, 'd', node.d);
        setAttr(el, 'transform', translateOf(node));
        break;
      case 'line':
        setAttr(el, 'x1', node.x1);
        setAttr(el, 'y1', node.y1);
        setAttr(el, 'x2', node.x2);
        setAttr(el, 'y2', node.y2);
        break;
      case 'rect':
        setAttr(el, 'x', node.x);
        setAttr(el, 'y', node.y);
        setAttr(el, 'width', Math.max(0, node.width));
        setAttr(el, 'height', Math.max(0, node.height));
        setAttr(el, 'rx', node.rx ?? null);
        break;
      case 'circle':
        setAttr(el, 'cx', node.cx);
        setAttr(el, 'cy', node.cy);
        setAttr(el, 'r', node.r);
        break;
      case 'text':
        updateText(el, node);
        break;
    }
    this.applyStyle(el, node.style, node.key, node.type === 'text' ? node : undefined);
  }

  private applyStyle(el: SVGElement, style: Style | undefined, key: string, text?: TextNode): void {
    const resolved = style ?? {};
    if (el.tagName === 'g') {
      setAttr(el, 'opacity', resolved.opacity ?? null);
      return;
    }
    let fill: string | null;
    if (isGradient(resolved.fill)) fill = `url(#${this.gradient(key, resolved.fill)})`;
    else fill = resolved.fill ?? 'none';
    setAttr(el, 'fill', fill);
    if (text?.halo) {
      setAttr(el, 'stroke', text.halo);
      setAttr(el, 'stroke-width', HALO_STROKE_WIDTH);
    } else {
      setAttr(el, 'stroke', resolved.stroke ?? null);
      setAttr(el, 'stroke-width', resolved.stroke ? (resolved.strokeWidth ?? DEFAULT_STROKE_WIDTH) : null);
    }
    const hasDash = resolved.dash && resolved.dash.length;
    setAttr(el, 'stroke-dasharray', hasDash ? resolved.dash!.join(' ') : null);
    setAttr(el, 'stroke-linecap', resolved.lineCap ?? null);
    if (!text?.halo) setAttr(el, 'stroke-linejoin', resolved.lineJoin ?? null);
    setAttr(el, 'opacity', resolved.opacity ?? null);
  }

  /** Creates or updates a vertical linear gradient and returns its id. */
  private gradient(key: string, gradient: Gradient): string {
    const id = this.defId('grad', key);
    let el = this.defs.querySelector<SVGLinearGradientElement>(`#${id}`);
    if (!el) {
      el = document.createElementNS(SVG_NAMESPACE, 'linearGradient');
      el.id = id;
      el.setAttribute('gradientUnits', 'userSpaceOnUse');
      el.setAttribute('x1', '0');
      el.setAttribute('x2', '0');
      this.defs.append(el);
    }
    const gradientEl = el;
    setAttr(gradientEl, 'y1', gradient.y1);
    setAttr(gradientEl, 'y2', gradient.y2);
    while (gradientEl.children.length > gradient.stops.length) gradientEl.lastElementChild!.remove();
    gradient.stops.forEach((stop, i) => {
      let stopEl = gradientEl.children[i] as SVGStopElement | undefined;
      if (!stopEl) {
        stopEl = document.createElementNS(SVG_NAMESPACE, 'stop');
        gradientEl.append(stopEl);
      }
      setAttr(stopEl, 'offset', stop.offset);
      setAttr(stopEl, 'stop-color', stop.color);
      setAttr(stopEl, 'stop-opacity', stop.opacity);
    });
    this.current.add(id);
    return id;
  }
}

/** SVG translate for a node's optional offset, or null when it has none. */
function translateOf(node: { x?: number; y?: number }): string | null {
  return node.x || node.y ? `translate(${node.x ?? 0},${node.y ?? 0})` : null;
}

function updateText(el: SVGElement, node: TextNode): void {
  const font = parseFont(node.font);
  const y = node.y + baselineOffset(node);
  setAttr(el, 'x', node.x);
  setAttr(el, 'y', y);
  setAttr(el, 'font-family', font.family);
  setAttr(el, 'font-size', font.size);
  setAttr(el, 'font-weight', font.weight);
  setAttr(el, 'text-anchor', node.align ?? 'start');
  setAttr(el, 'transform', node.rotate ? `rotate(${node.rotate},${node.x},${node.y})` : null);
  if (node.halo) {
    setAttr(el, 'paint-order', 'stroke');
    setAttr(el, 'stroke-linejoin', 'round');
  } else {
    setAttr(el, 'paint-order', null);
  }
  if (el.textContent !== node.text) el.textContent = node.text;
}

function tagFor(node: SceneNode): string {
  return node.type === 'group' ? 'g' : node.type;
}

/** Sets an attribute only when it changes; null removes it. */
function setAttr(el: Element, name: string, value: string | number | null): void {
  if (value === null) {
    if (el.hasAttribute(name)) el.removeAttribute(name);
    return;
  }
  const text = typeof value === 'number' ? String(Math.round(value * ATTRIBUTE_PRECISION) / ATTRIBUTE_PRECISION) : value;
  if (el.getAttribute(name) !== text) el.setAttribute(name, text);
}
