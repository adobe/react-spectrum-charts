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

type ParsedId =
  | { kind: 'chart' }
  | { kind: 'group'; groupIndex: number }
  | { kind: 'item'; groupIndex: number; itemIndex: number };

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
/** Focus outline padding around the whole chart. */
const CHART_FOCUS_PAD = 4;
/** Focus outline padding around a group. */
const GROUP_FOCUS_PAD = 6;

const centerX = (rect: Rect): number => rect.x + rect.width / 2;

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
    private callbacks: NavigatorCallbacks<K>,
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
    this.tree = { ...tree, groups: tree.groups.filter((navGroup) => navGroup.items.length) };
    this.origin = origin;
    this.bounds = bounds;
    this.renderer.wrapper.setAttribute('aria-label', `${tree.label}. Interactive chart.`);
    this.buildStructure();
    for (const key of Object.keys(this.elementData)) delete this.elementData[key];

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
    for (const [groupIndex, navGroup] of this.tree.groups.entries()) {
      const itemIndex = navGroup.items.findIndex((leaf) => this.keyOf(leaf.mark) === key);
      if (itemIndex >= 0) {
        this.go(this.itemNodeId(groupIndex, itemIndex));
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

  private itemNodeId(groupIndex: number, itemIndex: number): string {
    return this.id(`i${groupIndex}_${itemIndex}`);
  }

  private parse(id: string): ParsedId | null {
    const local = id.slice(this.prefix.length + 1);
    if (local === 'chart') return { kind: 'chart' };
    const groupMatch = /^g(\d+)$/.exec(local);
    if (groupMatch) return { kind: 'group', groupIndex: +groupMatch[1] };
    const itemMatch = /^i(\d+)_(\d+)$/.exec(local);
    if (itemMatch) return { kind: 'item', groupIndex: +itemMatch[1], itemIndex: +itemMatch[2] };
    return null;
  }

  private leaf(groupIndex: number, itemIndex: number): NavLeaf<K> | undefined {
    return this.tree.groups[groupIndex]?.items[itemIndex];
  }

  /** A single group navigated without the group level. */
  private get flat(): boolean {
    return this.tree.flat && this.tree.groups.length === 1;
  }

  private groupIdAt(groupIndex: number): string | undefined {
    return groupIndex >= 0 && groupIndex < this.tree.groups.length ? this.id(`g${groupIndex}`) : undefined;
  }

  private itemIdAt(groupIndex: number, itemIndex: number): string | undefined {
    return this.leaf(groupIndex, itemIndex) ? this.itemNodeId(groupIndex, itemIndex) : undefined;
  }

  /** Matching item in a group: same match key, else the nearest by x. */
  private matchingItem(groupIndex: number, from: NavLeaf<K>): string | undefined {
    const navGroup = this.tree.groups[groupIndex];
    if (!navGroup) return undefined;
    let best = navGroup.items.findIndex((leaf) => leaf.match === from.match);
    if (best < 0) {
      best = 0;
      const fromX = centerX(from.rect);
      navGroup.items.forEach((leaf, i) => {
        if (Math.abs(centerX(leaf.rect) - fromX) < Math.abs(centerX(navGroup.items[best].rect) - fromX)) best = i;
      });
    }
    return this.itemIdAt(groupIndex, best);
  }

  /** Neighbouring item within the same group. */
  private stepItem(current: string, delta: number): string | undefined {
    const parsed = this.parse(current);
    return parsed?.kind === 'item' ? this.itemIdAt(parsed.groupIndex, parsed.itemIndex + delta) : undefined;
  }

  /** Neighbouring group, or the matching item in the neighbouring group. */
  private acrossGroups(current: string, delta: number): string | undefined {
    const parsed = this.parse(current);
    if (!parsed || parsed.kind === 'chart') return undefined;
    if (parsed.kind === 'group') return this.groupIdAt(parsed.groupIndex + delta);
    if (this.flat) return this.stepItem(current, delta);
    const from = this.leaf(parsed.groupIndex, parsed.itemIndex);
    return from ? this.matchingItem(parsed.groupIndex + delta, from) : undefined;
  }

  private buildEdges(chartId: string): Record<string, EdgeObject> {
    return {
      'chart-in': {
        source: chartId,
        target: () => (this.flat ? this.itemIdAt(0, 0) : this.groupIdAt(0))!,
        navigationRules: ['drill-in'],
      },
      exit: { source: (_data, current) => current, target: chartId, navigationRules: ['exit'] },
      'group-move': {
        source: (_data, current) => this.acrossGroups(current, -1)!,
        target: (_data, current) => this.acrossGroups(current, 1)!,
        navigationRules: ['up', 'down', 'left', 'right'],
      },
      'group-in': {
        source: (_data, current) => current,
        target: (_data, current) => {
          const parsed = this.parse(current);
          return (parsed?.kind === 'group' ? this.itemIdAt(parsed.groupIndex, 0) : undefined)!;
        },
        navigationRules: ['drill-in'],
      },
      'group-out': { source: chartId, target: (_data, current) => current, navigationRules: ['drill-out'] },
      'item-lr': {
        source: (_data, current) => this.stepItem(current, -1)!,
        target: (_data, current) => this.stepItem(current, 1)!,
        navigationRules: ['left', 'right'],
      },
      'item-ud': {
        source: (_data, current) => this.acrossGroups(current, -1)!,
        target: (_data, current) => this.acrossGroups(current, 1)!,
        navigationRules: ['up', 'down'],
      },
      'item-out': {
        source: (_data, current) => {
          if (this.flat) return chartId;
          const parsed = this.parse(current);
          return (parsed?.kind === 'item' ? this.groupIdAt(parsed.groupIndex) : undefined)!;
        },
        target: (_data, current) => current,
        navigationRules: ['drill-out'],
      },
    };
  }

  private buildNodes(chartId: string): Record<string, NodeObject> {
    const flat = this.flat;
    const nodes: Record<string, NodeObject> = {};
    nodes[chartId] = { id: chartId, renderId: chartId, edges: ['chart-in'] };
    this.tree.groups.forEach((navGroup, groupIndex) => {
      if (!flat) {
        const groupId = this.id(`g${groupIndex}`);
        nodes[groupId] = { id: groupId, renderId: groupId, edges: ['group-move', 'group-in', 'group-out', 'exit'] };
      }
      navGroup.items.forEach((_leaf, itemIndex) => {
        const itemId = this.itemNodeId(groupIndex, itemIndex);
        nodes[itemId] = { id: itemId, renderId: itemId, edges: ['item-lr', 'item-ud', 'item-out', 'exit'] };
      });
    });
    return nodes;
  }

  private buildStructure(): void {
    const chartId = this.id('chart');
    this.structure = { nodes: this.buildNodes(chartId), edges: this.buildEdges(chartId) };
    this.handler = dn.input({ structure: this.structure, navigationRules: { ...RULES }, entryPoint: chartId }) as InputHandler;
  }

  /** A plot-space rect in navigation-root coordinates, grown by `pad` on every side. */
  private toRootRect(rect: Rect, pad = 0): { x: number; y: number; width: number; height: number } {
    return {
      x: this.origin.x + rect.x - pad,
      y: this.origin.y + rect.y - pad,
      width: rect.width + 2 * pad,
      height: rect.height + 2 * pad,
    };
  }

  private elementDataFor(id: string): ElementData[string] | null {
    const parsed = this.parse(id);
    if (!parsed) return null;
    const groups = this.tree.groups;
    if (parsed.kind === 'chart') {
      return {
        cssClass: 's2c-nav-chart',
        spatialProperties: this.toRootRect(this.bounds, CHART_FOCUS_PAD),
        semantics: { label: `${this.tree.label} ${INSTRUCTIONS}` },
      };
    }
    const navGroup = groups[parsed.groupIndex];
    if (!navGroup) return null;
    if (parsed.kind === 'group') {
      return {
        cssClass: navGroup.path ? 's2c-nav-group-path' : 's2c-nav-group',
        spatialProperties: { ...this.toRootRect(navGroup.rect, GROUP_FOCUS_PAD), ...(navGroup.path ? { path: navGroup.path } : {}) },
        semantics: { label: `${navGroup.label}, ${parsed.groupIndex + 1} of ${groups.length}. Press Enter to explore values.` },
      };
    }
    const leaf = navGroup.items[parsed.itemIndex];
    if (!leaf) return null;
    return {
      cssClass: leaf.path ? 's2c-nav-item-path' : 's2c-nav-item',
      spatialProperties: { ...this.toRootRect(leaf.rect), ...(leaf.path ? { path: leaf.path } : {}) },
      semantics: { label: `${leaf.label}. ${parsed.itemIndex + 1} of ${navGroup.items.length}.` },
    };
  }

  private renderNode(id: string): HTMLElement | null {
    const data = this.elementDataFor(id);
    const node = this.structure.nodes[id];
    if (!data || !node) return null;
    this.elementData[id] = data;
    document.getElementById(id)?.remove();
    const element = this.renderer.render(node) ?? null;
    // Focus paths are given in plot coordinates; data-navigator positions its SVG at the root origin.
    element?.querySelector('.dn-node-path')?.setAttribute('transform', `translate(${this.origin.x},${this.origin.y})`);
    return element;
  }

  private go(id: string): void {
    const chartId = this.id('chart');
    const previous = this.current;
    const element = id === chartId ? document.getElementById(chartId) : this.renderNode(id);
    if (!element) return;
    element.focus({ preventScroll: true });
    if (previous && previous !== id && previous !== chartId) this.renderer.remove(previous);
  }

  private markFor(id: string): K | null {
    const parsed = this.parse(id);
    return parsed?.kind === 'item' ? (this.leaf(parsed.groupIndex, parsed.itemIndex)?.mark ?? null) : null;
  }

  private onKeydown = (event: KeyboardEvent): void => {
    const current = this.current;
    if (!current || !this.handler) return;
    const parsed = this.parse(current);
    if (!parsed) return;
    if (parsed.kind === 'item' && (event.key === 'Home' || event.key === 'End')) {
      const lastIndex = this.tree.groups[parsed.groupIndex].items.length - 1;
      event.preventDefault();
      this.go(this.itemNodeId(parsed.groupIndex, event.key === 'Home' ? 0 : lastIndex));
      return;
    }
    if (parsed.kind === 'item' && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      const mark = this.markFor(current);
      if (mark) this.callbacks.onSelect(mark, event.shiftKey);
      return;
    }
    const direction = this.handler.keydownValidator(event);
    if (!direction) return;
    event.preventDefault();
    const next = this.handler.move(current, direction);
    if (next) this.go(next.id);
  };

  private onFocusIn = (event: FocusEvent): void => {
    if (this.updating) return;
    const id = (event.target as HTMLElement).id;
    const parsed = this.parse(id);
    if (!parsed) return;
    this.current = id;
    if (parsed.kind === 'item') {
      this.callbacks.onFocusGroup(null);
      this.callbacks.onFocusItem(this.markFor(id));
    } else {
      this.callbacks.onFocusItem(null);
      const emphasis = parsed.kind === 'group' ? (this.tree.groups[parsed.groupIndex]?.emphasis ?? null) : null;
      this.callbacks.onFocusGroup(emphasis);
    }
  };

  private onFocusOut = (event: FocusEvent): void => {
    if (this.updating) return;
    const focusTarget = event.relatedTarget as Node | null;
    if (focusTarget && this.renderer.wrapper.contains(focusTarget)) return;
    const chartId = this.id('chart');
    if (this.current && this.current !== chartId) this.renderer.remove(this.current);
    this.current = null;
    this.callbacks.onFocusItem(null);
    this.callbacks.onFocusGroup(null);
    this.callbacks.onLeave();
  };
}
