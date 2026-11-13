import dn from 'data-navigator';
import type { EdgeObject, ElementData, NodeObject, Structure } from 'data-navigator';
import type { NavLeaf, NavTree, Rect } from './module.js';

export interface NavigatorCallbacks<K> {
  /** An item (or nothing) gained keyboard focus. */
  onFocusItem: (mark: K | null) => void;
  /** A group gained focus; the value is the legend key to emphasize. */
  onFocusGroup: (emphasis: string | null) => void;
  onSelect: (mark: K, additive: boolean) => void;
  onLeave: () => void;
}

/** The parts of data-navigator's input and rendering handlers this wrapper uses. */
interface InputHandler {
  keydownValidator(e: KeyboardEvent): string | undefined;
  move(current: string, direction: string): NodeObject | null | undefined;
}

interface RenderHandler {
  wrapper: HTMLElement;
  initialize(): HTMLElement | undefined;
  render(node: NodeObject): HTMLElement | undefined;
  remove(id: string): void;
  clearStructure(): void;
}

type Parsed = { kind: 'chart' } | { kind: 'group'; gi: number } | { kind: 'item'; gi: number; ii: number };

const RULES = {
  left: { key: 'ArrowLeft', direction: 'source' },
  right: { key: 'ArrowRight', direction: 'target' },
  up: { key: 'ArrowUp', direction: 'source' },
  down: { key: 'ArrowDown', direction: 'target' },
  'drill-in': { key: 'Enter', direction: 'target' },
  'drill-out': { key: 'Backspace', direction: 'source' },
  exit: { key: 'Escape', direction: 'target' },
} as const;

const INSTRUCTIONS = 'Press Enter to explore, arrow keys to move, Escape to return.';

/**
 * Keyboard and screen-reader access built on data-navigator, for any chart type: chart → groups →
 * items. Left/right move between items of a group; up/down move to the matching item of the
 * neighbouring group; Enter drills in or selects; Backspace drills out; Escape returns to the chart;
 * Home/End jump to the ends of a group.
 */
export class Navigator<K> {
  private renderer: RenderHandler;
  private handler: InputHandler | null = null;
  private elementData: ElementData = {};
  private structure: Structure = { nodes: {}, edges: {} };
  private tree: NavTree<K> = { label: '', flat: true, groups: [] };
  private origin = { x: 0, y: 0 };
  private bounds: Rect = { x: 0, y: 0, width: 0, height: 0 };
  private current: string | null = null;
  private prefix: string;
  private updating = false;

  constructor(
    root: HTMLElement,
    id: string,
    private keyOf: (mark: K) => string,
    private cb: NavigatorCallbacks<K>,
  ) {
    this.prefix = `${id}-n`;
    this.renderer = dn.rendering({
      elementData: this.elementData,
      suffixId: id,
      root: { id: root.id, description: 'Chart' },
    }) as RenderHandler;
    this.renderer.initialize();
    this.renderer.wrapper.addEventListener('keydown', this.onKeydown);
    this.renderer.wrapper.addEventListener('focusin', this.onFocusIn);
    this.renderer.wrapper.addEventListener('focusout', this.onFocusOut);
  }

  get wrapper(): HTMLElement {
    return this.renderer.wrapper;
  }

  /**
   * @param origin Offset of the plot area within the navigation root.
   * @param bounds Chart outline for the top-level node, in plot coordinates.
   */
  update(tree: NavTree<K>, origin: { x: number; y: number }, bounds: Rect): void {
    this.tree = { ...tree, groups: tree.groups.filter((g) => g.items.length) };
    this.origin = origin;
    this.bounds = bounds;
    this.renderer.wrapper.setAttribute('aria-label', `${tree.label}. Interactive chart.`);
    this.buildStructure();
    for (const k of Object.keys(this.elementData)) delete this.elementData[k];

    const chartId = this.id('chart');
    const focused = this.current;
    const hadFocus = this.renderer.wrapper.contains(document.activeElement);
    this.updating = true;
    try {
      this.renderer.clearStructure();
      this.renderNode(chartId);
      if (focused && focused !== chartId && this.structure.nodes[focused] && this.renderNode(focused)) {
        if (hadFocus) document.getElementById(focused)?.focus({ preventScroll: true });
      } else if (focused) {
        // The focused node disappeared (e.g. its group was hidden); fall back to the chart.
        this.current = chartId;
        if (hadFocus) document.getElementById(chartId)?.focus({ preventScroll: true });
      }
    } finally {
      this.updating = false;
    }
  }

  /** Move focus to an item, e.g. to restore focus after a popover closes. */
  focusMark(mark: K): void {
    const key = this.keyOf(mark);
    for (const [gi, g] of this.tree.groups.entries()) {
      const ii = g.items.findIndex((l) => this.keyOf(l.mark) === key);
      if (ii >= 0) {
        this.go(this.id(`i${gi}_${ii}`));
        return;
      }
    }
  }

  destroy(): void {
    this.renderer.wrapper.removeEventListener('keydown', this.onKeydown);
    this.renderer.wrapper.removeEventListener('focusin', this.onFocusIn);
    this.renderer.wrapper.removeEventListener('focusout', this.onFocusOut);
    this.renderer.clearStructure();
    this.renderer.wrapper.remove();
  }

  // ---- structure ----

  private id(local: string): string {
    return `${this.prefix}-${local}`;
  }

  private parse(id: string): Parsed | null {
    const local = id.slice(this.prefix.length + 1);
    if (local === 'chart') return { kind: 'chart' };
    let m = /^g(\d+)$/.exec(local);
    if (m) return { kind: 'group', gi: +m[1] };
    m = /^i(\d+)_(\d+)$/.exec(local);
    if (m) return { kind: 'item', gi: +m[1], ii: +m[2] };
    return null;
  }

  private leaf(gi: number, ii: number): NavLeaf<K> | undefined {
    return this.tree.groups[gi]?.items[ii];
  }

  private buildStructure(): void {
    const groups = this.tree.groups;
    const flat = this.tree.flat && groups.length === 1;
    const chartId = this.id('chart');
    const groupId = (gi: number): string | undefined => (gi >= 0 && gi < groups.length ? this.id(`g${gi}`) : undefined);
    const itemId = (gi: number, ii: number): string | undefined => (this.leaf(gi, ii) ? this.id(`i${gi}_${ii}`) : undefined);
    const cx = (r: Rect): number => r.x + r.width / 2;
    /** Matching item in group `gi`: same match key, else the nearest by x. */
    const matching = (gi: number, from: NavLeaf<K>): string | undefined => {
      const g = groups[gi];
      if (!g) return undefined;
      let best = g.items.findIndex((l) => l.match === from.match);
      if (best < 0) {
        best = 0;
        const x = cx(from.rect);
        g.items.forEach((l, i) => {
          if (Math.abs(cx(l.rect) - x) < Math.abs(cx(g.items[best].rect) - x)) best = i;
        });
      }
      return itemId(gi, best);
    };
    const step = (cur: string, delta: number): string | undefined => {
      const p = this.parse(cur);
      return p?.kind === 'item' ? itemId(p.gi, p.ii + delta) : undefined;
    };
    const across = (cur: string, delta: number): string | undefined => {
      const p = this.parse(cur);
      if (!p || p.kind === 'chart') return undefined;
      if (p.kind === 'group') return groupId(p.gi + delta);
      if (flat) return step(cur, delta);
      const from = this.leaf(p.gi, p.ii);
      return from ? matching(p.gi + delta, from) : undefined;
    };
    const edges: Record<string, EdgeObject> = {
      'chart-in': { source: chartId, target: () => (flat ? itemId(0, 0) : groupId(0))!, navigationRules: ['drill-in'] },
      exit: { source: (_d, cur) => cur, target: chartId, navigationRules: ['exit'] },
      'group-move': {
        source: (_d, cur) => across(cur, -1)!,
        target: (_d, cur) => across(cur, 1)!,
        navigationRules: ['up', 'down', 'left', 'right'],
      },
      'group-in': {
        source: (_d, cur) => cur,
        target: (_d, cur) => {
          const p = this.parse(cur);
          return (p?.kind === 'group' ? itemId(p.gi, 0) : undefined)!;
        },
        navigationRules: ['drill-in'],
      },
      'group-out': { source: chartId, target: (_d, cur) => cur, navigationRules: ['drill-out'] },
      'item-lr': {
        source: (_d, cur) => step(cur, -1)!,
        target: (_d, cur) => step(cur, 1)!,
        navigationRules: ['left', 'right'],
      },
      'item-ud': {
        source: (_d, cur) => across(cur, -1)!,
        target: (_d, cur) => across(cur, 1)!,
        navigationRules: ['up', 'down'],
      },
      'item-out': {
        source: (_d, cur) => {
          if (flat) return chartId;
          const p = this.parse(cur);
          return (p?.kind === 'item' ? groupId(p.gi) : undefined)!;
        },
        target: (_d, cur) => cur,
        navigationRules: ['drill-out'],
      },
    };
    const nodes: Record<string, NodeObject> = {};
    nodes[chartId] = { id: chartId, renderId: chartId, edges: ['chart-in'] };
    groups.forEach((g, gi) => {
      if (!flat) {
        const gid = this.id(`g${gi}`);
        nodes[gid] = { id: gid, renderId: gid, edges: ['group-move', 'group-in', 'group-out', 'exit'] };
      }
      g.items.forEach((_l, ii) => {
        const iid = this.id(`i${gi}_${ii}`);
        nodes[iid] = { id: iid, renderId: iid, edges: ['item-lr', 'item-ud', 'item-out', 'exit'] };
      });
    });
    this.structure = { nodes, edges };
    this.handler = dn.input({ structure: this.structure, navigationRules: { ...RULES }, entryPoint: chartId }) as InputHandler;
  }

  private abs(r: Rect, pad = 0): { x: number; y: number; width: number; height: number } {
    return { x: this.origin.x + r.x - pad, y: this.origin.y + r.y - pad, width: r.width + 2 * pad, height: r.height + 2 * pad };
  }

  private data(id: string): ElementData[string] | null {
    const p = this.parse(id);
    if (!p) return null;
    const groups = this.tree.groups;
    if (p.kind === 'chart') {
      return {
        cssClass: 's2c-nav-chart',
        spatialProperties: this.abs(this.bounds, 4),
        semantics: { label: `${this.tree.label} ${INSTRUCTIONS}` },
      };
    }
    const g = groups[p.gi];
    if (!g) return null;
    if (p.kind === 'group') {
      return {
        cssClass: g.path ? 's2c-nav-group-path' : 's2c-nav-group',
        spatialProperties: { ...this.abs(g.rect, 6), ...(g.path ? { path: g.path } : {}) },
        semantics: { label: `${g.label}, ${p.gi + 1} of ${groups.length}. Press Enter to explore values.` },
      };
    }
    const l = g.items[p.ii];
    if (!l) return null;
    return {
      cssClass: l.path ? 's2c-nav-item-path' : 's2c-nav-item',
      spatialProperties: { ...this.abs(l.rect), ...(l.path ? { path: l.path } : {}) },
      semantics: { label: `${l.label}. ${p.ii + 1} of ${g.items.length}.` },
    };
  }

  private renderNode(id: string): HTMLElement | null {
    const d = this.data(id);
    const node = this.structure.nodes[id];
    if (!d || !node) return null;
    this.elementData[id] = d;
    document.getElementById(id)?.remove();
    const el = this.renderer.render(node) ?? null;
    // Focus paths are given in plot coordinates; data-navigator positions its SVG at the root origin.
    el?.querySelector('.dn-node-path')?.setAttribute('transform', `translate(${this.origin.x},${this.origin.y})`);
    return el;
  }

  private go(id: string): void {
    const chartId = this.id('chart');
    const prev = this.current;
    const el = id === chartId ? document.getElementById(chartId) : this.renderNode(id);
    if (!el) return;
    el.focus({ preventScroll: true });
    if (prev && prev !== id && prev !== chartId) this.renderer.remove(prev);
  }

  private markFor(id: string): K | null {
    const p = this.parse(id);
    return p?.kind === 'item' ? (this.leaf(p.gi, p.ii)?.mark ?? null) : null;
  }

  private onKeydown = (e: KeyboardEvent): void => {
    const cur = this.current;
    if (!cur || !this.handler) return;
    const p = this.parse(cur);
    if (!p) return;
    if (p.kind === 'item' && (e.key === 'Home' || e.key === 'End')) {
      const n = this.tree.groups[p.gi].items.length;
      e.preventDefault();
      this.go(this.id(`i${p.gi}_${e.key === 'Home' ? 0 : n - 1}`));
      return;
    }
    if (p.kind === 'item' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      const mark = this.markFor(cur);
      if (mark) this.cb.onSelect(mark, e.shiftKey);
      return;
    }
    const direction = this.handler.keydownValidator(e);
    if (!direction) return;
    e.preventDefault();
    const next = this.handler.move(cur, direction);
    if (next) this.go(next.id);
  };

  private onFocusIn = (e: FocusEvent): void => {
    if (this.updating) return;
    const id = (e.target as HTMLElement).id;
    const p = this.parse(id);
    if (!p) return;
    this.current = id;
    if (p.kind === 'item') {
      this.cb.onFocusGroup(null);
      this.cb.onFocusItem(this.markFor(id));
    } else {
      this.cb.onFocusItem(null);
      this.cb.onFocusGroup(p.kind === 'group' ? (this.tree.groups[p.gi]?.emphasis ?? null) : null);
    }
  };

  private onFocusOut = (e: FocusEvent): void => {
    if (this.updating) return;
    const to = e.relatedTarget as Node | null;
    if (to && this.renderer.wrapper.contains(to)) return;
    const chartId = this.id('chart');
    if (this.current && this.current !== chartId) this.renderer.remove(this.current);
    this.current = null;
    this.cb.onFocusItem(null);
    this.cb.onFocusGroup(null);
    this.cb.onLeave();
  };
}
