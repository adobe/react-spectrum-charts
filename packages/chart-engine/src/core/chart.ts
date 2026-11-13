import { CanvasRenderer } from '../render/canvas.js';
import type { Renderer } from '../render/renderer.js';
import { group, LAYERS, type GroupNode, type LayerId, type Scene, type SceneNode } from '../render/scene.js';
import { SvgRenderer } from '../render/svg.js';
import { createFormatters } from '../util/format.js';
import { clearTextCache } from '../util/text.js';
import { animate, prefersReducedMotion, type Animation } from './animation.js';
import { CHROME, EXPORT, MOTION } from './assumptions.js';
import { drawAxes, drawAxisHover, drawReferenceLines } from './cartesian/draw.js';
import { layoutCartesian, type CartesianFrame, type DomainTween } from './cartesian/layout.js';
import { downloadFile, sceneToPNG, sceneToSVG } from './export.js';
import { layoutFrame, type ChartFrame } from './frame.js';
import { drawLegend, LegendControls } from './legend.js';
import type { ChartModule, DrawState, Env, Hover } from './module.js';
import { Navigator } from './navigator.js';
import { Notice, Popover, renderTooltip, Tooltip } from './overlay.js';
import { injectStyles } from './styles.js';
import { clearSystemColorCache, resolveTheme, SIZES, type Theme } from './theme.js';
import { drawTitle } from './title.js';
import type { BaseChartOptions, CartesianOptions, ChartState, ContentResult, HoverContext } from './types.js';

let chartCount = 0;

type AnyOptions<I> = BaseChartOptions<I, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type AnyModule<O extends AnyOptions<I>, I> = ChartModule<O, any, any, any, I, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

interface TweenState<S> {
  from: S;
  t: number;
  domains: Omit<DomainTween, 't'> | null;
}

/**
 * The chart shell. It owns everything chart types share — layout of the title, legend and axes,
 * interaction state, tooltips, popovers, keyboard access, animation, layered rendering and export —
 * and delegates shapes, hit testing and navigation structure to a `ChartModule`.
 */
export class Chart<O extends AnyOptions<I>, I> {
  readonly element: HTMLElement;
  protected opts: O;
  private readonly id = `s2c-${++chartCount}`;
  private readonly module: AnyModule<O, I>;

  private heading: HTMLElement;
  private desc: HTMLElement;
  private notice = new Notice();
  private stage: HTMLElement;
  private renderer!: Renderer;
  private rendererType: 'svg' | 'canvas' | null = null;
  private legendControls: LegendControls;
  private tooltip: Tooltip;
  private popover: Popover;
  private nav: Navigator<unknown>;

  private model: unknown;
  private env!: Env;
  private frame: ChartFrame | null = null;
  private cart: CartesianFrame | null = null;
  private geom: unknown = null;
  private version = 0;
  private size = { width: -1, height: -1, background: '' };
  private layerSig = new Map<LayerId, string>();

  // Interaction state (uncontrolled copies).
  private pointer: { x: number; y: number } | null = null;
  private pointerHover: Hover<unknown> | null = null;
  private keyMark: unknown = null;
  private keyGroup: string | null = null;
  private legendActive: string | null = null;
  private internal: { selected: I[]; highlighted: string | null; hidden: string[] } = { selected: [], highlighted: null, hidden: [] };
  private lastHoverKey = '';
  private popoverFor = '';
  private selectedViaKeyboard = false;

  // Animation.
  private reveal = 1;
  private enter = 1;
  private tween: TweenState<unknown> | null = null;
  private dataAnim: Animation | null = null;
  private revealAnim: Animation | null = null;
  private revealed = false;

  private raf = 0;
  private needLayout = true;
  private destroyed = false;
  private ro: ResizeObserver | null = null;
  private cleanup: (() => void)[] = [];

  constructor(
    private container: HTMLElement,
    options: O,
    module: AnyModule<O, I>,
  ) {
    injectStyles();
    this.module = module;
    this.opts = { ...options };

    const root = document.createElement('div');
    root.className = 's2c-root';
    root.setAttribute('role', 'figure');
    this.element = root;

    this.heading = document.createElement('div');
    this.heading.className = 's2c-sr-only';
    this.heading.id = `${this.id}-title`;
    this.heading.setAttribute('role', 'heading');
    this.heading.setAttribute('aria-level', '3');
    this.desc = document.createElement('p');
    this.desc.className = 's2c-sr-only';
    this.desc.id = `${this.id}-desc`;
    root.setAttribute('aria-describedby', this.desc.id);

    this.stage = document.createElement('div');
    this.stage.className = 's2c-stage';
    this.stage.id = `${this.id}-stage`;
    this.legendControls = new LegendControls({
      onHover: (k) => {
        if (k === this.legendActive) {
          this.schedule();
          return;
        }
        this.legendActive = k;
        this.opts.onLegendHover?.(k);
        this.schedule();
      },
      onToggle: (k) => this.toggleHidden(k),
    });
    this.stage.append(this.legendControls.element);
    root.append(this.heading, this.notice.element, this.stage, this.desc);
    container.append(root);

    this.nav = new Navigator<unknown>(this.stage, this.id, (m) => this.module.key(m), {
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
    this.tooltip = new Tooltip(this.stage);
    this.popover = new Popover(this.stage, () => this.dismissPopover());

    this.bindPointer();
    this.bindEnvironment();
    this.configure();

    if (typeof ResizeObserver === 'function') {
      this.ro = new ResizeObserver(() => {
        if (this.destroyed) return;
        this.needLayout = true;
        this.flush();
      });
      this.ro.observe(this.stage);
    }
    this.flush();
    this.startReveal();
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
      hovered: hover ? this.module.item(this.geom, hover.primary) : null,
      selected: this.selectedItems(),
      highlighted: this.highlighted(),
      hidden: [...this.hidden()],
    };
  }

  /** Select one item, several items, or none. */
  select(items: I | I[] | null): void {
    this.setSelected(items == null ? [] : Array.isArray(items) ? items : [items]);
  }

  setHighlight(key: string | null): void {
    if (!this.controlled('highlighted')) this.internal.highlighted = key;
    this.opts.onHighlight?.(key);
    this.schedule();
  }

  setHidden(hidden: string[]): void {
    if (!this.controlled('hidden')) {
      this.internal.hidden = [...hidden];
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
    const state: DrawState<unknown> = {
      hover: null,
      selected: [],
      highlighted: this.highlighted(),
      emphasized: null,
      reveal: 1,
      enter: 1,
      hoverLabels: false,
    };
    return {
      width: this.size.width,
      height: this.size.height,
      background: this.env.theme.background,
      layers: [this.backLayer(), this.marksLayer(state), this.frontLayer(null, null), group('overlay', [])],
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
    this.dataAnim?.cancel();
    this.revealAnim?.cancel();
    this.ro?.disconnect();
    for (const fn of this.cleanup) fn();
    this.popover.destroy();
    this.nav.destroy();
    this.renderer?.destroy();
    this.element.remove();
  }

  // ---------------------------------------------------------------- configuration

  private get minimal(): boolean {
    return !!(this.opts as CartesianOptions).minimal;
  }

  private configure(): void {
    const o = this.opts;
    const theme = resolveTheme(o.theme ?? 'light');
    const sizes = SIZES[o.size ?? 'L'];
    this.env = { theme, sizes, f: createFormatters(o.locale), palette: o.palette ?? theme.palette };
    this.model = this.module.prepare(o, this.env);

    const type = o.renderer ?? 'svg';
    if (type !== this.rendererType) {
      this.renderer?.destroy();
      this.renderer = type === 'canvas' ? new CanvasRenderer() : new SvgRenderer();
      this.rendererType = type;
      this.stage.prepend(this.renderer.element);
      this.size = { width: -1, height: -1, background: '' };
    }

    const root = this.element;
    this.applyThemeVars(theme);
    root.classList.toggle('s2c-minimal', this.minimal);
    root.style.width = o.width != null ? `${o.width}px` : '';
    if (o.height != null) root.style.height = `${o.height}px`;
    else if (!this.container.clientHeight) root.style.height = `${this.minimal ? CHROME.minimalHeight : CHROME.defaultHeight}px`;
    else root.style.height = '';

    this.heading.textContent = o.title ?? '';
    if (o.title) {
      root.setAttribute('aria-labelledby', this.heading.id);
      root.removeAttribute('aria-label');
    } else {
      root.removeAttribute('aria-labelledby');
      root.setAttribute('aria-label', this.module.name);
    }
    this.notice.update(this.minimal ? '' : this.module.notice(this.model, o));
    this.desc.textContent = o.description ?? this.module.description(this.model, o);
  }

  private applyThemeVars(t: Theme): void {
    const s = this.element.style;
    this.element.dataset.theme = t.name;
    s.setProperty('--s2c-bg', t.background);
    s.setProperty('--s2c-text', t.text);
    s.setProperty('--s2c-text2', t.textSecondary);
    s.setProperty('--s2c-border', t.surfaceBorder);
    s.setProperty('--s2c-focus', t.focus);
    s.setProperty('--s2c-surface', t.surface);
  }

  // ---------------------------------------------------------------- state helpers

  private controlled(key: keyof ChartState<I>): boolean {
    return !!this.opts.state && key in this.opts.state;
  }

  private hidden(): Set<string> {
    return new Set(this.controlled('hidden') ? (this.opts.state!.hidden ?? []) : this.internal.hidden);
  }

  private highlighted(): string | null {
    return this.controlled('highlighted') ? (this.opts.state!.highlighted ?? null) : this.internal.highlighted;
  }

  private selectedItems(): I[] {
    return this.controlled('selected') ? (this.opts.state!.selected ?? []) : this.internal.selected;
  }

  private selectedMarks(): unknown[] {
    if (!this.geom) return [];
    return this.selectedItems()
      .map((i) => this.module.find(this.geom, i))
      .filter((m) => m != null);
  }

  private hoverMode(): 'point' | 'x' {
    const m = this.module.hoverMode(this.opts);
    return m === 'x' ? 'x' : 'point';
  }

  private currentHover(): Hover<unknown> | null {
    if (!this.geom) return null;
    if (this.controlled('hovered')) {
      const item = this.opts.state!.hovered;
      const mark = item ? this.module.find(this.geom, item) : null;
      return mark ? this.module.hoverFor(this.geom, mark, this.hoverMode()) : null;
    }
    if (this.keyMark) return this.module.hoverFor(this.geom, this.keyMark, this.hoverMode());
    return this.pointerHover;
  }

  private context(hover: Hover<unknown>): HoverContext<I> {
    return this.module.context(this.geom, hover);
  }

  private emitHover(): void {
    if (this.controlled('hovered') || !this.geom) return;
    const hover = this.keyMark ? this.module.hoverFor(this.geom, this.keyMark, this.hoverMode()) : this.pointerHover;
    const key = hover ? this.module.key(hover.primary) : '';
    if (key === this.lastHoverKey) return;
    this.lastHoverKey = key;
    this.opts.onHover?.(hover ? this.module.item(this.geom, hover.primary) : null, hover ? this.context(hover) : null);
  }

  private toggleHidden(key: string): void {
    const hidden = this.hidden();
    const nowHidden = !hidden.has(key);
    if (nowHidden) hidden.add(key);
    else hidden.delete(key);
    this.opts.onLegendClick?.(key, nowHidden);
    this.setHidden([...hidden]);
  }

  private toggleSelect(mark: unknown, event: Event | null, additive: boolean): void {
    const item = this.module.item(this.geom, mark);
    if (event) this.opts.onClick?.(item, event);
    if (!(this.opts.selectable || this.opts.popover)) return;
    const key = this.module.key(mark);
    const cur = this.selectedItems();
    const keyOf = (i: I): string => {
      const m = this.module.find(this.geom, i);
      return m ? this.module.key(m) : '';
    };
    let next: I[];
    if (additive && this.module.multiSelect?.(this.opts)) {
      next = cur.some((i) => keyOf(i) === key) ? cur.filter((i) => keyOf(i) !== key) : [...cur, item];
    } else {
      next = cur.length === 1 && keyOf(cur[0]) === key ? [] : [item];
    }
    this.setSelected(next);
  }

  private setSelected(items: I[]): void {
    if (!this.controlled('selected')) this.internal.selected = items;
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

  // ---------------------------------------------------------------- events

  /** Pointer position in plot coordinates, or null outside the plot's hit area. */
  private locate(e: PointerEvent | MouseEvent): { x: number; y: number } | null {
    if (!this.frame) return null;
    const r = this.stage.getBoundingClientRect();
    return { x: e.clientX - r.left - this.frame.plot.x, y: e.clientY - r.top - this.frame.plot.y };
  }

  private overControls(e: Event): boolean {
    const t = e.target as Node;
    return this.popover.element.contains(t) || this.tooltip.element.contains(t) || this.legendControls.element.contains(t);
  }

  private bindPointer(): void {
    const stage = this.stage;
    const move = (e: PointerEvent): void => {
      if (this.module.hoverMode(this.opts) === 'none' || !this.geom) return;
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
      const info = p ? this.module.hit(this.geom, p.x, p.y, 'point') : null;
      this.selectedViaKeyboard = false;
      if (info) this.toggleSelect(info.primary, e, e.shiftKey);
      else if (this.selectedItems().length) this.setSelected([]);
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
    const info = p && this.geom ? this.module.hit(this.geom, p.x, p.y, this.hoverMode()) : null;
    const key = (h: Hover<unknown> | null): string => (h ? `${h.mode}:${this.module.key(h.primary)}` : '');
    const changed = key(info) !== key(this.pointerHover);
    this.pointerHover = info;
    const clickable = !!info && !!(this.opts.selectable || this.opts.popover || this.opts.onClick);
    this.stage.style.cursor = clickable ? 'pointer' : '';
    if (changed) {
      this.emitHover();
      this.schedule();
    }
  }

  private bindEnvironment(): void {
    if (typeof matchMedia !== 'function') return;
    const watch = (query: string, fn: () => void): void => {
      const mq = matchMedia(query);
      mq.addEventListener('change', fn);
      this.cleanup.push(() => mq.removeEventListener('change', fn));
    };
    const retheme = (): void => {
      clearSystemColorCache();
      this.configure();
      this.schedule(true);
    };
    watch('(prefers-color-scheme: dark)', () => this.opts.theme === 'auto' && retheme());
    watch('(forced-colors: active)', retheme);
    // Device pixel ratio changes (zoom, moving between displays) need a canvas repaint.
    const dprWatch = (): void => {
      const mq = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      const fn = (): void => {
        mq.removeEventListener('change', fn);
        if (this.destroyed) return;
        this.size.width = -1;
        this.schedule(true);
        dprWatch();
      };
      mq.addEventListener('change', fn);
      this.cleanup.push(() => mq.removeEventListener('change', fn));
    };
    dprWatch();
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts) {
      const onFonts = (): void => {
        if (this.destroyed) return;
        clearTextCache();
        this.schedule(true);
      };
      fonts.ready.then(onFonts);
      fonts.addEventListener?.('loadingdone', onFonts);
      this.cleanup.push(() => fonts.removeEventListener?.('loadingdone', onFonts));
    }
  }

  // ---------------------------------------------------------------- animation

  private animationDuration(base: number): number {
    const a = this.opts.animation;
    if (a === false || prefersReducedMotion()) return 0;
    if (typeof a === 'object' && a.duration != null) return a.duration;
    return base;
  }

  private startReveal(): void {
    const d = this.animationDuration(MOTION.revealMs);
    if (this.revealed || d === 0) {
      this.reveal = 1;
      this.revealed = true;
      return;
    }
    this.revealed = true;
    this.reveal = 0;
    this.revealAnim = animate(
      d,
      (t) => {
        this.reveal = t;
        this.paint();
      },
      MOTION.revealEase,
    );
  }

  private startTween(): void {
    const d = this.animationDuration(MOTION.updateMs);
    this.dataAnim?.cancel();
    if (!this.geom || d === 0) {
      this.tween = null;
      this.enter = 1;
      return;
    }
    const c = this.cart;
    this.tween = {
      from: this.module.snapshot(this.geom),
      t: 0,
      domains: c ? { xDomain: c.xDomain, yDomain: c.yDomain, y2Domain: c.y2Domain } : null,
    };
    this.enter = 0;
    this.dataAnim = animate(
      d,
      (t) => {
        if (!this.tween) return;
        this.tween.t = t;
        this.enter = t;
        this.relayout(false);
        this.paint();
      },
      MOTION.updateEase,
      () => {
        this.tween = null;
        this.enter = 1;
        this.dataAnim = null;
        this.needLayout = true;
        this.flush();
      },
    );
  }

  // ---------------------------------------------------------------- layout & rendering

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
    const env = this.env;
    const width = Math.max(0, o.width ?? this.stage.clientWidth);
    const height = Math.max(0, this.stage.clientHeight);
    const hidden = this.hidden();
    const spec = this.module.legend(this.model, o, env);
    const frame = layoutFrame({
      width,
      height,
      padding: o.padding,
      minimal: this.minimal,
      title: o.title,
      subtitle: o.subtitle,
      legend: spec,
      sizes: env.sizes,
    });
    this.frame = frame;
    const { plot } = frame;
    const tween = this.tween;
    this.cart = this.module.axes
      ? layoutCartesian(
          this.module.axes(this.model, o, env, hidden),
          o as CartesianOptions,
          env,
          plot.width,
          plot.height,
          tween?.domains ? { t: tween.t, ...tween.domains } : null,
        )
      : null;

    // Carry keyboard focus over to the new geometry.
    const focusItem = this.keyMark && this.geom ? this.module.item(this.geom, this.keyMark) : null;
    this.geom = this.module.layout({
      model: this.model,
      options: o,
      env,
      width: plot.width,
      height: plot.height,
      frame: this.cart,
      hidden,
      tween: tween ? { from: tween.from, t: tween.t } : null,
    });
    this.version++;
    if (focusItem) this.keyMark = this.module.find(this.geom, focusItem);
    if (this.pointer) this.pointerHover = this.module.hit(this.geom, this.pointer.x, this.pointer.y, this.hoverMode());
    this.legendControls.update(frame.legend, hidden, spec.title);
    if (settle && !tween) {
      const tree = this.module.nav(this.geom, o);
      tree.label = o.title ? `${o.title}. ${tree.label}` : tree.label;
      this.nav.update(tree, { x: plot.x, y: plot.y }, { x: 0, y: 0, width: plot.width, height: plot.height });
    }
  }

  private plotGroup(key: string, children: SceneNode[]): GroupNode {
    const p = this.frame!.plot;
    return group(key, children, { x: p.x, y: p.y });
  }

  private backLayer(): GroupNode {
    const nodes: SceneNode[] = [];
    const f = this.frame!;
    if (f.title) nodes.push(drawTitle(f.title.layout, f.title.x, f.title.y, this.env.theme));
    if (this.cart) nodes.push(this.plotGroup('axes', drawAxes(this.cart, this.opts as CartesianOptions, this.env.theme, this.env.sizes)));
    return group('back', nodes);
  }

  private marksLayer(state: DrawState<unknown>): GroupNode {
    return group('marks', [this.plotGroup('plot', this.module.marks(this.geom, state, this.env, this.opts))]);
  }

  private frontLayer(emphasized: string[] | null, hovered: string | null): GroupNode {
    const nodes: SceneNode[] = [];
    if (this.cart) nodes.push(this.plotGroup('refs', drawReferenceLines(this.cart, this.opts as CartesianOptions, this.env.theme, this.env.sizes)));
    if (this.frame!.legend) {
      nodes.push(drawLegend(this.frame!.legend, { hidden: this.hidden(), emphasized, hovered }, this.env.theme, this.env.sizes));
    }
    return group('front', nodes);
  }

  private overlayLayer(state: DrawState<unknown>): GroupNode {
    const nodes: SceneNode[] = [];
    if (this.cart && state.hover && this.module.axisHover) {
      const h = this.module.axisHover(this.geom, state.hover);
      if (h) nodes.push(...drawAxisHover(this.cart, h, this.env.theme, this.env.sizes));
    }
    nodes.push(...this.module.overlay(this.geom, state, this.env, this.opts));
    return group('overlay', [this.plotGroup('plot', nodes)]);
  }

  /** Redraw only the layers whose inputs changed. */
  private draw(id: LayerId, sig: string, build: () => GroupNode): void {
    if (id !== 'overlay' && this.layerSig.get(id) === sig) return;
    this.layerSig.set(id, sig);
    this.renderer.renderLayer(id, build());
  }

  private paint(): void {
    if (!this.geom || !this.frame || this.destroyed) return;
    const o = this.opts;
    const m = this.module;
    const theme = this.env.theme;
    const width = Math.max(0, o.width ?? this.stage.clientWidth);
    const height = Math.max(0, this.stage.clientHeight);
    if (width !== this.size.width || height !== this.size.height || theme.background !== this.size.background) {
      this.size = { width, height, background: theme.background };
      this.renderer.setSize(width, height, theme.background);
      this.layerSig.clear();
    }

    const hover = this.currentHover();
    const selected = this.selectedMarks();
    const legendEmphasis = this.legendActive ?? this.keyGroup;
    const emphasized = legendEmphasis ?? (hover && hover.mode === 'point' ? m.group(hover.primary) : null);
    const state: DrawState<unknown> = {
      hover,
      selected,
      highlighted: this.highlighted(),
      emphasized,
      reveal: this.reveal,
      enter: this.enter,
      hoverLabels: !o.tooltip,
    };
    const selKeys = selected.map((s) => m.key(s)).join(',');
    const hidden = [...this.hidden()].join(',');
    const legendKeys = legendEmphasis != null ? [legendEmphasis] : (m.legendEmphasis?.(hover, selected) ?? null);
    const v = this.version;
    this.draw('back', `${v}`, () => this.backLayer());
    this.draw('marks', [v, this.reveal, this.enter, state.highlighted, emphasized, hover?.mode, selKeys].join('|'), () => this.marksLayer(state));
    const hovered = this.legendControls.hovered;
    this.draw('front', [v, hidden, legendKeys?.join(','), hovered].join('|'), () => this.frontLayer(legendKeys, hovered));
    this.draw('overlay', '', () => this.overlayLayer(state));

    const plot = this.frame.plot;
    // Tooltip.
    if (hover && o.tooltip) {
      const ctx = this.context(hover);
      const content: ContentResult =
        typeof o.tooltip === 'function' ? o.tooltip(ctx as never) : renderTooltip(m.tooltip(ctx));
      const a = m.anchor(this.geom, hover.primary);
      this.tooltip.show(content, plot.x + a.x, plot.y + a.y);
    } else {
      this.tooltip.hide();
    }

    // Popover for the selection.
    if (selected.length && o.popover) {
      const last = selected[selected.length - 1];
      const a = m.anchor(this.geom, last);
      const ax = plot.x + a.x;
      const ay = plot.y + a.y;
      if (selKeys !== this.popoverFor) {
        this.popoverFor = selKeys;
        const items = selected.map((s) => m.item(this.geom, s));
        const content = o.popover(items[items.length - 1], () => this.dismissPopover(), items);
        this.popover.show(content, ax, ay, selected.map((s) => m.describe(this.geom, s)).join('; '), this.selectedViaKeyboard);
      } else if (this.popover.open) {
        this.popover.reposition(ax, ay);
      }
    } else if (this.popover.open || this.popoverFor) {
      this.popoverFor = '';
      this.popover.hide();
    }
  }
}

export { LAYERS };
