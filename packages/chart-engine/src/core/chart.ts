import { group, LAYERS, type Scene } from '../render/scene.js';
import { createFormatters } from '../util/format.js';
import { clearTextCache } from '../util/text.js';
import { EXPORT } from './assumptions.js';
import { applyChrome, createChartDom, type ChartDom } from './dom.js';
import { watchEnvironment } from './environment.js';
import { downloadFile, sceneToPNG, sceneToSVG } from './export.js';
import { layoutFrame, type ChartFrame } from './frame.js';
import { backLayer, frontLayer, LayerStack, marksLayer, overlayLayer, type LayerInput } from './layers.js';
import { LegendControls } from './legend.js';
import type { ChartModule, DrawState, Env, Hover } from './module.js';
import { Motion } from './motion.js';
import { Navigator } from './navigator.js';
import { Popover, renderTooltip, Tooltip } from './overlay.js';
import { InteractionState } from './state.js';
import { injectStyles } from './styles.js';
import { clearSystemColorCache, resolveTheme, SIZES } from './theme.js';
import type { BaseChartOptions, ChartState, ContentResult } from './types.js';

let chartCount = 0;

type AnyOptions<I> = BaseChartOptions<I, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * The chart shell. It owns everything chart types share — layout of the title and legend, interaction
 * state, tooltips, popovers, keyboard access, animation, layered rendering and export — and delegates
 * shapes, axes, hit testing and navigation structure to a `ChartModule`.
 *
 * O options · I public item · M model · G geometry · K mark reference · S animation snapshot
 */
export class Chart<O extends AnyOptions<I>, I, M = unknown, G = unknown, K = unknown, S = unknown> {
  readonly element: HTMLElement;
  protected opts: O;
  private readonly id = `s2c-${++chartCount}`;
  private readonly module: ChartModule<O, M, G, K, I, S>;

  private readonly dom: ChartDom;
  private readonly layers: LayerStack;
  private readonly legendControls: LegendControls;
  private readonly tooltip: Tooltip;
  private readonly popover: Popover;
  private readonly nav: Navigator<K>;
  private readonly state: InteractionState<I>;
  private readonly motion: Motion<S>;

  private model!: M;
  private env!: Env;
  private frame: ChartFrame | null = null;
  private geom: G | null = null;
  private version = 0;

  // Transient interaction state.
  private pointer: { x: number; y: number } | null = null;
  private pointerHover: Hover<K> | null = null;
  private keyMark: K | null = null;
  private keyGroup: string | null = null;
  private legendActive: string | null = null;
  private lastHoverKey = '';
  private popoverFor = '';
  private selectedViaKeyboard = false;

  private raf = 0;
  private needLayout = true;
  private destroyed = false;
  private ro: ResizeObserver | null = null;
  private cleanup: (() => void)[] = [];

  constructor(
    private container: HTMLElement,
    options: O,
    module: ChartModule<O, M, G, K, I, S>,
  ) {
    injectStyles();
    this.module = module;
    this.opts = { ...options };
    this.state = new InteractionState(() => this.opts);
    this.motion = new Motion(() => this.opts.animation, {
      reveal: () => this.paint(),
      tween: () => {
        this.relayout(false);
        this.paint();
      },
      settle: () => {
        this.needLayout = true;
        this.flush();
      },
    });

    this.dom = createChartDom(this.id);
    this.element = this.dom.root;
    const stage = this.dom.stage;
    this.layers = new LayerStack(stage);
    this.legendControls = new LegendControls({
      onHover: (k) => {
        if (k !== this.legendActive) {
          this.legendActive = k;
          this.opts.onLegendHover?.(k);
        }
        this.schedule();
      },
      onToggle: (k) => this.toggleHidden(k),
    });
    stage.append(this.legendControls.element);
    container.append(this.element);

    this.nav = new Navigator<K>(stage, this.id, (m) => this.module.identity.key(m), {
      onFocusItem: (mark) => {
        this.keyMark = mark;
        this.emitHover();
        this.schedule();
      },
      onFocusGroup: (k) => {
        this.keyGroup = k;
        this.schedule();
      },
      onSelect: (mark, additive) => {
        this.selectedViaKeyboard = true;
        this.toggleSelect(mark, null, additive);
      },
      onLeave: () => this.schedule(),
    });
    this.tooltip = new Tooltip(stage);
    this.popover = new Popover(stage, () => this.dismissPopover());

    this.bindPointer();
    this.cleanup.push(
      watchEnvironment({
        colorScheme: () => this.opts.theme === 'auto' && this.retheme(),
        forcedColors: () => this.retheme(),
        pixelRatio: () => {
          this.layers.invalidate();
          this.schedule(true);
        },
        fonts: () => {
          clearTextCache();
          this.schedule(true);
        },
      }),
    );
    this.configure();

    if (typeof ResizeObserver === 'function') {
      this.ro = new ResizeObserver(() => {
        if (this.destroyed) return;
        this.needLayout = true;
        this.flush();
      });
      this.ro.observe(stage);
    }
    this.flush();
    this.motion.startReveal();
  }

  // ---------------------------------------------------------------- public API

  /** Merge new options. Data changes animate from the current state. */
  update(partial: Partial<O>): void {
    const dataChanged = this.module.dataKeys.some((k) => k in partial && partial[k] !== this.opts[k]);
    const hiddenChanged = !!partial.state && 'hidden' in partial.state && partial.state.hidden !== this.opts.state?.hidden;
    this.opts = { ...this.opts, ...partial };
    this.configure();
    if (dataChanged || hiddenChanged) this.startTween();
    this.needLayout = true;
    this.flush();
  }

  setData(data: O['data']): void {
    this.update({ data } as Partial<O>);
  }

  getState(): Required<ChartState<I>> {
    const hover = this.currentHover();
    return {
      hovered: hover && this.geom ? this.module.identity.item(this.geom, hover.primary) : null,
      selected: this.state.selected(),
      highlighted: this.state.highlighted(),
      hidden: [...this.state.hidden()],
    };
  }

  /** Select one item, several items, or none. */
  select(items: I | I[] | null): void {
    this.setSelected(items == null ? [] : Array.isArray(items) ? items : [items]);
  }

  setHighlight(key: string | null): void {
    this.state.setHighlighted(key);
    this.opts.onHighlight?.(key);
    this.schedule();
  }

  setHidden(hidden: string[]): void {
    if (this.state.setHidden(hidden)) {
      this.startTween();
      this.needLayout = true;
    }
    this.opts.onHiddenChange?.([...hidden]);
    this.schedule(true);
  }

  /** Re-measure the container (called automatically by a ResizeObserver). */
  resize(): void {
    this.needLayout = true;
    this.flush();
  }

  /** The chart as drawn, without hover, selection or focus, including the title and legend. */
  toScene(): Scene {
    if (this.needLayout || !this.geom) this.relayout(true);
    const input = this.layerInput()!;
    const state: DrawState<K> = {
      hover: null,
      selected: [],
      highlighted: this.state.highlighted(),
      emphasized: null,
      reveal: 1,
      enter: 1,
      hoverLabels: false,
    };
    const { width, height } = this.layers.size;
    return {
      width,
      height,
      background: this.env.theme.background,
      layers: [
        backLayer(input),
        marksLayer(input, state),
        frontLayer(input, { hidden: this.state.hidden(), emphasized: null, hovered: null }),
        group('overlay', []),
      ],
    };
  }

  toSVG(): string {
    return sceneToSVG(this.toScene(), this.opts.title ?? this.module.name);
  }

  toPNG(scale = EXPORT.pngScale): Promise<Blob> {
    return sceneToPNG(this.toScene(), scale);
  }

  /** Download the chart as an image file. */
  async download(format: 'png' | 'svg' = 'png', filename?: string): Promise<void> {
    const name = filename ?? `${(this.opts.title ?? this.module.name).replace(/[^\w-]+/g, '-').toLowerCase()}.${format}`;
    downloadFile(format === 'svg' ? this.toSVG() : await this.toPNG(), name);
  }

  destroy(): void {
    this.destroyed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.motion.cancel();
    this.ro?.disconnect();
    for (const fn of this.cleanup) fn();
    this.popover.destroy();
    this.nav.destroy();
    this.layers.destroy();
    this.element.remove();
  }

  // ---------------------------------------------------------------- configuration

  private get minimal(): boolean {
    return this.module.model.minimal?.(this.opts) ?? false;
  }

  private configure(): void {
    const o = this.opts;
    const m = this.module.model;
    const theme = resolveTheme(o.theme ?? 'light');
    this.env = { theme, sizes: SIZES[o.size ?? 'L'], f: createFormatters(o.locale), palette: o.palette ?? theme.palette };
    this.model = m.prepare(o, this.env);
    this.layers.use(o.renderer ?? 'svg');
    applyChrome(this.dom, {
      theme,
      minimal: this.minimal,
      width: o.width,
      height: o.height,
      containerHeight: this.container.clientHeight,
      title: o.title,
      name: this.module.name,
      notice: m.notice?.(this.model, o) ?? '',
      description: o.description ?? m.description(this.model, o),
    });
  }

  private retheme(): void {
    clearSystemColorCache();
    this.configure();
    this.schedule(true);
  }

  // ---------------------------------------------------------------- interaction

  private selectedMarks(): K[] {
    const g = this.geom;
    if (!g) return [];
    return this.state
      .selected()
      .map((i) => this.module.identity.find(g, i))
      .filter((m): m is K => m != null);
  }

  private hoverMode(): 'point' | 'x' {
    return this.module.interaction.hoverMode?.(this.opts) === 'x' ? 'x' : 'point';
  }

  private currentHover(): Hover<K> | null {
    const g = this.geom;
    if (!g) return null;
    const { identity, interaction } = this.module;
    if (this.state.controlled('hovered')) {
      const item = this.opts.state!.hovered;
      const mark = item ? identity.find(g, item) : null;
      return mark ? interaction.hoverFor(g, mark, this.hoverMode()) : null;
    }
    if (this.keyMark != null) return interaction.hoverFor(g, this.keyMark, this.hoverMode());
    return this.pointerHover;
  }

  private emitHover(): void {
    const g = this.geom;
    if (this.state.controlled('hovered') || !g) return;
    const { identity, interaction } = this.module;
    const hover = this.keyMark != null ? interaction.hoverFor(g, this.keyMark, this.hoverMode()) : this.pointerHover;
    const key = hover ? identity.key(hover.primary) : '';
    if (key === this.lastHoverKey) return;
    this.lastHoverKey = key;
    this.opts.onHover?.(hover ? identity.item(g, hover.primary) : null, hover ? interaction.context(g, hover) : null);
  }

  private toggleHidden(key: string): void {
    const hidden = this.state.hidden();
    const nowHidden = !hidden.has(key);
    if (nowHidden) hidden.add(key);
    else hidden.delete(key);
    this.opts.onLegendClick?.(key, nowHidden);
    this.setHidden([...hidden]);
  }

  private toggleSelect(mark: K, event: Event | null, additive: boolean): void {
    const g = this.geom!;
    const { identity, interaction } = this.module;
    const item = identity.item(g, mark);
    if (event) this.opts.onClick?.(item, event);
    if (!(this.opts.selectable || this.opts.popover)) return;
    const key = identity.key(mark);
    const cur = this.state.selected();
    const keyOf = (i: I): string => {
      const m = identity.find(g, i);
      return m ? identity.key(m) : '';
    };
    let next: I[];
    if (additive && interaction.multiSelect?.(this.opts)) {
      next = cur.some((i) => keyOf(i) === key) ? cur.filter((i) => keyOf(i) !== key) : [...cur, item];
    } else {
      next = cur.length === 1 && keyOf(cur[0]) === key ? [] : [item];
    }
    this.setSelected(next);
  }

  private setSelected(items: I[]): void {
    this.state.setSelected(items);
    this.opts.onSelect?.(items);
    this.schedule();
  }

  private dismissPopover(): void {
    const marks = this.selectedMarks();
    const viaKeyboard = this.selectedViaKeyboard;
    this.selectedViaKeyboard = false;
    this.popover.hide();
    this.popoverFor = '';
    this.setSelected([]);
    if (viaKeyboard && marks.length) this.nav.focusMark(marks[marks.length - 1]);
  }

  // ---------------------------------------------------------------- pointer

  /** Pointer position in plot coordinates, or null outside the plot's hit area. */
  private locate(e: PointerEvent | MouseEvent): { x: number; y: number } | null {
    if (!this.frame) return null;
    const r = this.dom.stage.getBoundingClientRect();
    return { x: e.clientX - r.left - this.frame.plot.x, y: e.clientY - r.top - this.frame.plot.y };
  }

  private overControls(e: Event): boolean {
    const t = e.target as Node;
    return this.popover.element.contains(t) || this.tooltip.element.contains(t) || this.legendControls.element.contains(t);
  }

  private bindPointer(): void {
    const stage = this.dom.stage;
    const move = (e: PointerEvent): void => {
      if (this.module.interaction.hoverMode?.(this.opts) === 'none' || !this.geom) return;
      if (this.popover.element.contains(e.target as Node)) return;
      this.pointer = this.overControls(e) ? null : this.locate(e);
      this.refreshPointerHover();
    };
    const leave = (e: PointerEvent): void => {
      if (e.pointerType === 'touch') return;
      this.pointer = null;
      this.refreshPointerHover();
    };
    const click = (e: MouseEvent): void => {
      if (!this.geom || this.overControls(e)) return;
      const p = this.locate(e);
      const info = p ? this.module.interaction.hit(this.geom, p.x, p.y, 'point') : null;
      this.selectedViaKeyboard = false;
      if (info) this.toggleSelect(info.primary, e, e.shiftKey);
      else if (this.state.selected().length) this.setSelected([]);
    };
    stage.addEventListener('pointermove', move);
    stage.addEventListener('pointerdown', move);
    stage.addEventListener('pointerleave', leave);
    stage.addEventListener('click', click);
    this.cleanup.push(() => {
      stage.removeEventListener('pointermove', move);
      stage.removeEventListener('pointerdown', move);
      stage.removeEventListener('pointerleave', leave);
      stage.removeEventListener('click', click);
    });
  }

  private refreshPointerHover(): void {
    const p = this.pointer;
    const info = p && this.geom ? this.module.interaction.hit(this.geom, p.x, p.y, this.hoverMode()) : null;
    const key = (h: Hover<K> | null): string => (h ? `${h.mode}:${this.module.identity.key(h.primary)}` : '');
    const changed = key(info) !== key(this.pointerHover);
    this.pointerHover = info;
    const clickable = !!info && !!(this.opts.selectable || this.opts.popover || this.opts.onClick);
    this.dom.stage.style.cursor = clickable ? 'pointer' : '';
    if (changed) {
      this.emitHover();
      this.schedule();
    }
  }

  // ---------------------------------------------------------------- layout & rendering

  private startTween(): void {
    const g = this.geom;
    this.motion.startTween(g ? () => this.module.geometry.snapshot(g) : null);
  }

  private schedule(layout = false): void {
    if (this.destroyed) return;
    if (layout) this.needLayout = true;
    if (this.raf) return;
    if (typeof requestAnimationFrame !== 'function') {
      this.flush();
      return;
    }
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.flush();
    });
  }

  private flush(): void {
    if (this.destroyed) return;
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    if (this.needLayout || !this.geom) this.relayout(true);
    this.paint();
  }

  private relayout(settle: boolean): void {
    this.needLayout = false;
    const o = this.opts;
    const { identity, interaction } = this.module;
    const env = this.env;
    const width = Math.max(0, o.width ?? this.dom.stage.clientWidth);
    const height = Math.max(0, this.dom.stage.clientHeight);
    const hidden = this.state.hidden();
    const legend = this.module.model.legend(this.model, o, env);
    const frame = layoutFrame({
      width,
      height,
      padding: o.padding,
      minimal: this.minimal,
      title: o.title,
      subtitle: o.subtitle,
      legend,
      sizes: env.sizes,
    });
    this.frame = frame;
    const { plot } = frame;
    const tween = this.motion.tween;

    // Carry keyboard focus over to the new geometry.
    const focusItem = this.keyMark != null && this.geom ? identity.item(this.geom, this.keyMark) : null;
    const g = this.module.geometry.layout({ model: this.model, options: o, env, width: plot.width, height: plot.height, hidden, tween });
    this.geom = g;
    this.version++;
    if (focusItem) this.keyMark = identity.find(g, focusItem);
    if (this.pointer) this.pointerHover = interaction.hit(g, this.pointer.x, this.pointer.y, this.hoverMode());
    this.legendControls.update(frame.legend, hidden, legend.title);
    if (settle && !tween) {
      const tree = this.module.nav(g, o);
      tree.label = o.title ? `${o.title}. ${tree.label}` : tree.label;
      this.nav.update(tree, { x: plot.x, y: plot.y }, { x: 0, y: 0, width: plot.width, height: plot.height });
    }
  }

  private layerInput(): LayerInput<O, G, K> | null {
    if (this.geom == null || !this.frame) return null;
    return { draw: this.module.draw, geometry: this.geom, options: this.opts, env: this.env, frame: this.frame };
  }

  private paint(): void {
    const input = this.layerInput();
    if (!input || this.destroyed) return;
    const o = this.opts;
    const { identity, interaction } = this.module;
    const width = Math.max(0, o.width ?? this.dom.stage.clientWidth);
    const height = Math.max(0, this.dom.stage.clientHeight);
    this.layers.resize(width, height, this.env.theme.background);

    const hover = this.currentHover();
    const selected = this.selectedMarks();
    const legendEmphasis = this.legendActive ?? this.keyGroup;
    const emphasized = legendEmphasis ?? (hover && hover.mode === 'point' ? identity.group(hover.primary) : null);
    const { reveal, enter } = this.motion;
    const state: DrawState<K> = {
      hover,
      selected,
      highlighted: this.state.highlighted(),
      emphasized,
      reveal,
      enter,
      hoverLabels: !o.tooltip,
    };
    const selKeys = selected.map((s) => identity.key(s)).join(',');
    const hidden = this.state.hidden();
    const legendKeys = legendEmphasis != null ? [legendEmphasis] : (interaction.legendEmphasis?.(hover, selected) ?? null);
    const hovered = this.legendControls.hovered;
    const v = this.version;
    this.layers.draw('back', `${v}`, () => backLayer(input));
    this.layers.draw('marks', [v, reveal, enter, state.highlighted, emphasized, hover?.mode, selKeys].join('|'), () => marksLayer(input, state));
    this.layers.draw('front', [v, [...hidden].join(','), legendKeys?.join(','), hovered].join('|'), () =>
      frontLayer(input, { hidden, emphasized: legendKeys, hovered }),
    );
    this.layers.draw('overlay', '', () => overlayLayer(input, state));

    this.syncTooltip(input.geometry, hover);
    this.syncPopover(input.geometry, selected, selKeys);
  }

  private syncTooltip(g: G, hover: Hover<K> | null): void {
    const o = this.opts;
    if (!hover || !o.tooltip) {
      this.tooltip.hide();
      return;
    }
    const { identity, interaction } = this.module;
    const ctx = interaction.context(g, hover);
    const content: ContentResult = typeof o.tooltip === 'function' ? o.tooltip(ctx as never) : renderTooltip(interaction.tooltip(ctx));
    const a = identity.anchor(g, hover.primary);
    const plot = this.frame!.plot;
    this.tooltip.show(content, plot.x + a.x, plot.y + a.y);
  }

  private syncPopover(g: G, selected: K[], selKeys: string): void {
    const o = this.opts;
    if (!selected.length || !o.popover) {
      if (this.popover.open || this.popoverFor) {
        this.popoverFor = '';
        this.popover.hide();
      }
      return;
    }
    const { identity } = this.module;
    const plot = this.frame!.plot;
    const a = identity.anchor(g, selected[selected.length - 1]);
    const ax = plot.x + a.x;
    const ay = plot.y + a.y;
    if (selKeys !== this.popoverFor) {
      this.popoverFor = selKeys;
      const items = selected.map((s) => identity.item(g, s));
      const content = o.popover(items[items.length - 1], () => this.dismissPopover(), items);
      this.popover.show(content, ax, ay, selected.map((s) => identity.describe(g, s)).join('; '), this.selectedViaKeyboard);
    } else if (this.popover.open) {
      this.popover.reposition(ax, ay);
    }
  }
}

export { LAYERS };
