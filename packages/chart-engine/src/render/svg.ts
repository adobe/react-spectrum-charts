import { baselineOffset, parseFont, type Renderer } from './renderer.js';
import type { Gradient, GroupNode, LayerId, SceneNode, Style, TextNode } from './scene.js';
import { isGradient, LAYERS } from './scene.js';

const NS = 'http://www.w3.org/2000/svg';
let uid = 0;

export class SvgRenderer implements Renderer {
  readonly element: SVGSVGElement;
  private defs: SVGDefsElement;
  private layers = new Map<LayerId, SVGGElement>();
  private prefix = `s2c${++uid}`;
  private idMap = new Map<string, string>();
  /** Definitions (clips, gradients) referenced by each layer. */
  private layerDefs = new Map<LayerId, Set<string>>();
  private current: Set<string> = new Set();
  private layer: LayerId = 'back';

  private defId(kind: string, key: string): string {
    const k = this.layer + ':' + kind + ':' + key;
    let id = this.idMap.get(k);
    if (!id) {
      id = `${this.prefix}-${kind}-${this.idMap.size}`;
      this.idMap.set(k, id);
    }
    return id;
  }

  constructor() {
    this.element = document.createElementNS(NS, 'svg');
    this.element.setAttribute('class', 's2c-surface');
    this.element.setAttribute('aria-hidden', 'true');
    this.element.setAttribute('focusable', 'false');
    this.defs = document.createElementNS(NS, 'defs');
    this.element.append(this.defs);
    for (const id of LAYERS) {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('data-layer', id);
      this.element.append(g);
      this.layers.set(id, g);
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
    const live = new Set<string>();
    for (const set of this.layerDefs.values()) for (const d of set) live.add(d);
    for (const child of Array.from(this.defs.children)) {
      if (!live.has(child.id)) child.remove();
    }
  }

  destroy(): void {
    this.element.remove();
  }

  private reconcileGroup(el: SVGGElement, node: GroupNode): void {
    const transform = node.x || node.y ? `translate(${node.x ?? 0},${node.y ?? 0})` : null;
    setAttr(el, 'transform', transform);
    if (node.clip) {
      const id = this.defId('clip', node.key);
      let cp = this.defs.querySelector<SVGClipPathElement>(`#${id}`);
      if (!cp) {
        cp = document.createElementNS(NS, 'clipPath');
        cp.id = id;
        cp.append(document.createElementNS(NS, 'rect'));
        this.defs.append(cp);
      }
      const r = cp.firstElementChild as SVGRectElement;
      setAttr(r, 'x', node.clip.x);
      setAttr(r, 'y', node.clip.y);
      setAttr(r, 'width', Math.max(0, node.clip.width));
      setAttr(r, 'height', Math.max(0, node.clip.height));
      this.current.add(id);
      setAttr(el, 'clip-path', `url(#${id})`);
    } else {
      setAttr(el, 'clip-path', null);
    }
    this.applyStyle(el, node.style, node.key);

    const existing = new Map<string, SVGElement>();
    for (const child of Array.from(el.children) as SVGElement[]) {
      const k = child.getAttribute('data-key');
      if (k != null) existing.set(k, child);
    }
    let cursor: Element | null = el.firstElementChild;
    for (const child of node.children) {
      const tag = tagFor(child);
      let target = existing.get(child.key);
      if (target && target.tagName !== tag) {
        target.remove();
        target = undefined;
      }
      if (target) existing.delete(child.key);
      else {
        target = document.createElementNS(NS, tag) as SVGElement;
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
        setAttr(el, 'transform', node.x || node.y ? `translate(${node.x ?? 0},${node.y ?? 0})` : null);
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
      case 'text': {
        const f = parseFont(node.font);
        const y = node.y + baselineOffset(node);
        setAttr(el, 'x', node.x);
        setAttr(el, 'y', y);
        setAttr(el, 'font-family', f.family);
        setAttr(el, 'font-size', f.size);
        setAttr(el, 'font-weight', f.weight);
        setAttr(el, 'text-anchor', node.align ?? 'start');
        setAttr(el, 'transform', node.rotate ? `rotate(${node.rotate},${node.x},${node.y})` : null);
        if (node.halo) {
          setAttr(el, 'paint-order', 'stroke');
          setAttr(el, 'stroke-linejoin', 'round');
        } else {
          setAttr(el, 'paint-order', null);
        }
        if (el.textContent !== node.text) el.textContent = node.text;
        break;
      }
    }
    this.applyStyle(el, node.style, node.key, node.type === 'text' ? node : undefined);
  }

  private applyStyle(el: SVGElement, style: Style | undefined, key: string, text?: TextNode): void {
    const s = style ?? {};
    if (el.tagName === 'g') {
      setAttr(el, 'opacity', s.opacity ?? null);
      return;
    }
    let fill: string | null;
    if (isGradient(s.fill)) fill = `url(#${this.gradient(key, s.fill)})`;
    else fill = s.fill ?? 'none';
    setAttr(el, 'fill', fill);
    if (text?.halo) {
      setAttr(el, 'stroke', text.halo);
      setAttr(el, 'stroke-width', 4);
    } else {
      setAttr(el, 'stroke', s.stroke ?? null);
      setAttr(el, 'stroke-width', s.stroke ? (s.strokeWidth ?? 1) : null);
    }
    setAttr(el, 'stroke-dasharray', s.dash && s.dash.length ? s.dash.join(' ') : null);
    setAttr(el, 'stroke-linecap', s.lineCap ?? null);
    if (!text?.halo) setAttr(el, 'stroke-linejoin', s.lineJoin ?? null);
    setAttr(el, 'opacity', s.opacity ?? null);
  }

  private gradient(key: string, g: Gradient): string {
    const id = this.defId('grad', key);
    let el = this.defs.querySelector<SVGLinearGradientElement>(`#${id}`);
    if (!el) {
      el = document.createElementNS(NS, 'linearGradient');
      el.id = id;
      el.setAttribute('gradientUnits', 'userSpaceOnUse');
      el.setAttribute('x1', '0');
      el.setAttribute('x2', '0');
      this.defs.append(el);
    }
    setAttr(el, 'y1', g.y1);
    setAttr(el, 'y2', g.y2);
    while (el.children.length > g.stops.length) el.lastElementChild!.remove();
    g.stops.forEach((s, i) => {
      let stop = el!.children[i] as SVGStopElement | undefined;
      if (!stop) {
        stop = document.createElementNS(NS, 'stop');
        el!.append(stop);
      }
      setAttr(stop, 'offset', s.offset);
      setAttr(stop, 'stop-color', s.color);
      setAttr(stop, 'stop-opacity', s.opacity);
    });
    this.current.add(id);
    return id;
  }
}

function tagFor(node: SceneNode): string {
  return node.type === 'group' ? 'g' : node.type;
}

function setAttr(el: Element, name: string, value: string | number | null): void {
  if (value === null) {
    if (el.hasAttribute(name)) el.removeAttribute(name);
    return;
  }
  const v = typeof value === 'number' ? String(Math.round(value * 100) / 100) : value;
  if (el.getAttribute(name) !== v) el.setAttribute(name, v);
}
