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
import type { ChartModule, DrawState, Env, Hover, LegendSpec, Rect } from './module.js';
import { Motion } from './motion.js';
import { Navigator } from './navigator.js';
import { Popover, renderTooltip, Tooltip } from './overlay.js';
import { InteractionState } from './state.js';
import { injectStyles } from './styles.js';
import { clearSystemColorCache, resolveTheme, SIZES } from './theme.js';
import type { BaseChartOptions, ChartState, ContentResult } from './types.js';

const DEFAULT_THEME = 'light';
const DEFAULT_SIZE = 'L';
const DEFAULT_RENDERER = 'svg';

let chartCount = 0;

type AnyOptions<I> = BaseChartOptions<I, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

type Point = { x: number; y: number };

/** Normalizes the argument of `select()` to a list. */
function toItemList<I>(items: I | I[] | null): I[] {
  if (items == null) return [];
  if (Array.isArray(items)) return items;
  return [items];
}

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
  private readonly keyboardNav: Navigator<K>;
  private readonly state: InteractionState<I>;
  private readonly motion: Motion<S>;

  private model!: M;
  private env!: Env;
  private frame: ChartFrame | null = null;
  private geometry: G | null = null;
  /** Incremented on every layout; part of each layer's redraw signature. */
  private layoutVersion = 0;

  // Transient interaction state.
  private pointer: Point | null = null;
  private pointerHover: Hover<K> | null = null;
  private keyboardMark: K | null = null;
  private keyboardGroup: string | null = null;
  private legendActive: string | null = null;
  private lastHoverKey = '';
  /** Selection keys the open popover was rendered for. */
  private popoverFor = '';
  private selectedViaKeyboard = false;

  private animationFrame = 0;
  private needLayout = true;
  private destroyed = false;
  private resizeObserver: ResizeObserver | null = null;
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
    this.motion = this.createMotion();

    this.dom = createChartDom(this.id);
    this.element = this.dom.root;
    const stage = this.dom.stage;
    this.layers = new LayerStack(stage);
    this.legendControls = this.createLegendControls();
    stage.append(this.legendControls.element);
    container.append(this.element);

    this.keyboardNav = this.createKeyboardNav(stage);
    this.tooltip = new Tooltip(stage);
    this.popover = new Popover(stage, () => this.dismissPopover());

    this.bindPointer();
    this.cleanup.push(this.watchSystemSettings());
    this.configure();
    this.observeResize(stage);
    this.flush();
    this.motion.startReveal();
  }

  // ---------------------------------------------------------------- public API

  /** Merge new options. Data changes animate from the current state. */
  update(partial: Partial<O>): void {
    const dataChanged = this.module.dataKeys.some((key) => key in partial && partial[key] !== this.opts[key]);
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
      hovered: hover && this.geometry ? this.module.identity.item(this.geometry, hover.primary) : null,
      selected: this.state.selected(),
      highlighted: this.state.highlighted(),
      hidden: [...this.state.hidden()],
    };
  }

  /** Select one item, several items, or none. */
  select(items: I | I[] | null): void {
    this.setSelected(toItemList(items));
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
    if (this.needLayout || !this.geometry) this.relayout(true);
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
    const name = filename ?? this.defaultFilename(format);
    downloadFile(format === 'svg' ? this.toSVG() : await this.toPNG(), name);
  }

  destroy(): void {
    this.destroyed = true;
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.motion.cancel();
    this.resizeObserver?.disconnect();
    for (const stop of this.cleanup) stop();
    this.popover.destroy();
    this.keyboardNav.destroy();
    this.layers.destroy();
    this.element.remove();
  }

  // ---------------------------------------------------------------- setup

  private createMotion(): Motion<S> {
    return new Motion(() => this.opts.animation, {
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
  }

  private createLegendControls(): LegendControls {
    return new LegendControls({
      onHover: (key) => {
        if (key !== this.legendActive) {
          this.legendActive = key;
          this.opts.onLegendHover?.(key);
        }
        this.schedule();
      },
      onToggle: (key) => this.toggleHidden(key),
    });
  }

  private createKeyboardNav(stage: HTMLElement): Navigator<K> {
    return new Navigator<K>(stage, this.id, (mark) => this.module.identity.key(mark), {
      onFocusItem: (mark) => {
        this.keyboardMark = mark;
        this.emitHover();
        this.schedule();
      },
      onFocusGroup: (key) => {
        this.keyboardGroup = key;
        this.schedule();
      },
      onSelect: (mark, additive) => {
        this.selectedViaKeyboard = true;
        this.toggleSelect(mark, null, additive);
      },
      onLeave: () => this.schedule(),
    });
  }

  /** Redraws when the color scheme, forced colors, pixel ratio or fonts change; returns a stop function. */
  private watchSystemSettings(): () => void {
    return watchEnvironment({
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
    });
  }

  private observeResize(stage: HTMLElement): void {
    if (typeof ResizeObserver !== 'function') return;
    this.resizeObserver = new ResizeObserver(() => {
      if (this.destroyed) return;
      this.needLayout = true;
      this.flush();
    });
    this.resizeObserver.observe(stage);
  }

  private defaultFilename(format: 'png' | 'svg'): string {
    const baseName = this.opts.title ?? this.module.name;
    const slug = baseName.replace(/[^\w-]+/g, '-').toLowerCase();
    return `${slug}.${format}`;
  }

  // ---------------------------------------------------------------- configuration

  private get minimal(): boolean {
    return this.module.model.minimal?.(this.opts) ?? false;
  }

  private configure(): void {
    const options = this.opts;
    const modelHooks = this.module.model;
    const theme = resolveTheme(options.theme ?? DEFAULT_THEME);
    this.env = {
      theme,
      sizes: SIZES[options.size ?? DEFAULT_SIZE],
      f: createFormatters(options.locale),
      palette: options.palette ?? theme.palette,
    };
    this.model = modelHooks.prepare(options, this.env);
    this.layers.use(options.renderer ?? DEFAULT_RENDERER);
    applyChrome(this.dom, {
      theme,
      minimal: this.minimal,
      width: options.width,
      height: options.height,
      containerHeight: this.container.clientHeight,
      title: options.title,
      name: this.module.name,
      notice: modelHooks.notice?.(this.model, options) ?? '',
      description: options.description ?? modelHooks.description(this.model, options),
    });
  }

  private retheme(): void {
    clearSystemColorCache();
    this.configure();
    this.schedule(true);
  }

  // ---------------------------------------------------------------- interaction

  private selectedMarks(): K[] {
    const geometry = this.geometry;
    if (!geometry) return [];
    return this.state
      .selected()
      .map((item) => this.module.identity.find(geometry, item))
      .filter((mark): mark is K => mark != null);
  }

  private hoverMode(): 'point' | 'x' {
    return this.module.interaction.hoverMode?.(this.opts) === 'x' ? 'x' : 'point';
  }

  private currentHover(): Hover<K> | null {
    const geometry = this.geometry;
    if (!geometry) return null;
    const { identity, interaction } = this.module;
    if (this.state.controlled('hovered')) {
      const item = this.opts.state!.hovered;
      const mark = item ? identity.find(geometry, item) : null;
      return mark ? interaction.hoverFor(geometry, mark, this.hoverMode()) : null;
    }
    if (this.keyboardMark != null) return interaction.hoverFor(geometry, this.keyboardMark, this.hoverMode());
    return this.pointerHover;
  }

  /** Calls `onHover` when the uncontrolled hover target changes. */
  private emitHover(): void {
    const geometry = this.geometry;
    if (this.state.controlled('hovered') || !geometry) return;
    const { identity, interaction } = this.module;
    const hover =
      this.keyboardMark != null ? interaction.hoverFor(geometry, this.keyboardMark, this.hoverMode()) : this.pointerHover;
    const key = hover ? identity.key(hover.primary) : '';
    if (key === this.lastHoverKey) return;
    this.lastHoverKey = key;
    const item = hover ? identity.item(geometry, hover.primary) : null;
    const context = hover ? interaction.context(geometry, hover) : null;
    this.opts.onHover?.(item, context);
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
    const geometry = this.geometry!;
    const item = this.module.identity.item(geometry, mark);
    if (event) this.opts.onClick?.(item, event);
    if (!(this.opts.selectable || this.opts.popover)) return;
    this.setSelected(this.nextSelection(geometry, mark, item, additive));
  }

  /** The selection after clicking `mark`: additive clicks toggle it in the set, others toggle a single selection. */
  private nextSelection(geometry: G, mark: K, item: I, additive: boolean): I[] {
    const { identity, interaction } = this.module;
    const key = identity.key(mark);
    const current = this.state.selected();
    const keyOf = (selectedItem: I): string => {
      const selectedMark = identity.find(geometry, selectedItem);
      return selectedMark ? identity.key(selectedMark) : '';
    };
    if (additive && interaction.multiSelect?.(this.opts)) {
      const alreadySelected = current.some((selectedItem) => keyOf(selectedItem) === key);
      if (alreadySelected) return current.filter((selectedItem) => keyOf(selectedItem) !== key);
      return [...current, item];
    }
    const isOnlySelection = current.length === 1 && keyOf(current[0]) === key;
    return isOnlySelection ? [] : [item];
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
    if (viaKeyboard && marks.length) this.keyboardNav.focusMark(marks[marks.length - 1]);
  }

  // ---------------------------------------------------------------- pointer

  /** Pointer position in plot coordinates, or null outside the plot's hit area. */
  private locate(event: PointerEvent | MouseEvent): Point | null {
    if (!this.frame) return null;
    const stageRect = this.dom.stage.getBoundingClientRect();
    return {
      x: event.clientX - stageRect.left - this.frame.plot.x,
      y: event.clientY - stageRect.top - this.frame.plot.y,
    };
  }

  /** Whether the event target is inside the popover, tooltip or legend controls. */
  private overControls(event: Event): boolean {
    const target = event.target as Node;
    return (
      this.popover.element.contains(target) ||
      this.tooltip.element.contains(target) ||
      this.legendControls.element.contains(target)
    );
  }

  private bindPointer(): void {
    const stage = this.dom.stage;
    const move = (event: PointerEvent): void => {
      if (this.module.interaction.hoverMode?.(this.opts) === 'none' || !this.geometry) return;
      if (this.popover.element.contains(event.target as Node)) return;
      this.pointer = this.overControls(event) ? null : this.locate(event);
      this.refreshPointerHover();
    };
    const leave = (event: PointerEvent): void => {
      if (event.pointerType === 'touch') return;
      this.pointer = null;
      this.refreshPointerHover();
    };
    const click = (event: MouseEvent): void => {
      if (!this.geometry || this.overControls(event)) return;
      const position = this.locate(event);
      const hit = position ? this.module.interaction.hit(this.geometry, position.x, position.y, 'point') : null;
      this.selectedViaKeyboard = false;
      if (hit) this.toggleSelect(hit.primary, event, event.shiftKey);
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
    const pointer = this.pointer;
    const hit =
      pointer && this.geometry ? this.module.interaction.hit(this.geometry, pointer.x, pointer.y, this.hoverMode()) : null;
    const signature = (hover: Hover<K> | null): string =>
      hover ? `${hover.mode}:${this.module.identity.key(hover.primary)}` : '';
    const changed = signature(hit) !== signature(this.pointerHover);
    this.pointerHover = hit;
    const clickable = !!hit && !!(this.opts.selectable || this.opts.popover || this.opts.onClick);
    this.dom.stage.style.cursor = clickable ? 'pointer' : '';
    if (changed) {
      this.emitHover();
      this.schedule();
    }
  }

  // ---------------------------------------------------------------- layout & rendering

  private startTween(): void {
    const geometry = this.geometry;
    this.motion.startTween(geometry ? () => this.module.geometry.snapshot(geometry) : null);
  }

  private schedule(layout = false): void {
    if (this.destroyed) return;
    if (layout) this.needLayout = true;
    if (this.animationFrame) return;
    if (typeof requestAnimationFrame !== 'function') {
      this.flush();
      return;
    }
    this.animationFrame = requestAnimationFrame(() => {
      this.animationFrame = 0;
      this.flush();
    });
  }

  private flush(): void {
    if (this.destroyed) return;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }
    if (this.needLayout || !this.geometry) this.relayout(true);
    this.paint();
  }

  /** Drawing size: the fixed width option or the stage's width, and the stage's height. */
  private stageSize(): { width: number; height: number } {
    const width = Math.max(0, this.opts.width ?? this.dom.stage.clientWidth);
    const height = Math.max(0, this.dom.stage.clientHeight);
    return { width, height };
  }

  private relayout(settle: boolean): void {
    this.needLayout = false;
    const options = this.opts;
    const hidden = this.state.hidden();
    const legend = this.module.model.legend(this.model, options, this.env);
    const frame = this.layoutChrome(legend);
    this.frame = frame;
    const tween = this.motion.tween;

    const geometry = this.layoutGeometry(frame.plot, hidden, tween);
    this.legendControls.update(frame.legend, hidden, legend.title);
    if (settle && !tween) this.updateKeyboardNav(geometry, frame.plot);
  }

  /** Places the title, legend and plot area in the stage. */
  private layoutChrome(legend: LegendSpec): ChartFrame {
    const options = this.opts;
    const { width, height } = this.stageSize();
    return layoutFrame({
      width,
      height,
      padding: options.padding,
      minimal: this.minimal,
      title: options.title,
      subtitle: options.subtitle,
      legend,
      sizes: this.env.sizes,
    });
  }

  /** Lays out the marks and carries keyboard focus and pointer hover over to the new geometry. */
  private layoutGeometry(plot: Rect, hidden: Set<string>, tween: Motion<S>['tween']): G {
    const { identity, interaction } = this.module;
    const focusItem = this.keyboardMark != null && this.geometry ? identity.item(this.geometry, this.keyboardMark) : null;
    const geometry = this.module.geometry.layout({
      model: this.model,
      options: this.opts,
      env: this.env,
      width: plot.width,
      height: plot.height,
      hidden,
      tween,
    });
    this.geometry = geometry;
    this.layoutVersion++;
    if (focusItem) this.keyboardMark = identity.find(geometry, focusItem);
    if (this.pointer) this.pointerHover = interaction.hit(geometry, this.pointer.x, this.pointer.y, this.hoverMode());
    return geometry;
  }

  private updateKeyboardNav(geometry: G, plot: Rect): void {
    const options = this.opts;
    const tree = this.module.nav(geometry, options);
    tree.label = options.title ? `${options.title}. ${tree.label}` : tree.label;
    this.keyboardNav.update(tree, { x: plot.x, y: plot.y }, { x: 0, y: 0, width: plot.width, height: plot.height });
  }

  private layerInput(): LayerInput<O, G, K> | null {
    if (this.geometry == null || !this.frame) return null;
    return { draw: this.module.draw, geometry: this.geometry, options: this.opts, env: this.env, frame: this.frame };
  }

  private paint(): void {
    const input = this.layerInput();
    if (!input || this.destroyed) return;
    const { width, height } = this.stageSize();
    this.layers.resize(width, height, this.env.theme.background);

    const hover = this.currentHover();
    const selected = this.selectedMarks();
    const selectedKeys = selected.map((mark) => this.module.identity.key(mark)).join(',');
    this.drawLayers(input, hover, selected, selectedKeys);

    this.syncTooltip(input.geometry, hover);
    this.syncPopover(input.geometry, selected, selectedKeys);
  }

  /** Legend key of a point-hovered mark, which fades the other groups. */
  private pointHoverGroup(hover: Hover<K> | null): string | null {
    if (hover && hover.mode === 'point') return this.module.identity.group(hover.primary);
    return null;
  }

  /** Redraws each layer whose signature changed; the overlay always redraws. */
  private drawLayers(input: LayerInput<O, G, K>, hover: Hover<K> | null, selected: K[], selectedKeys: string): void {
    const legendEmphasis = this.legendActive ?? this.keyboardGroup;
    const emphasized = legendEmphasis ?? this.pointHoverGroup(hover);
    const { reveal, enter } = this.motion;
    const state: DrawState<K> = {
      hover,
      selected,
      highlighted: this.state.highlighted(),
      emphasized,
      reveal,
      enter,
      hoverLabels: !this.opts.tooltip,
    };
    const hidden = this.state.hidden();
    const legendKeys =
      legendEmphasis != null ? [legendEmphasis] : (this.module.interaction.legendEmphasis?.(hover, selected) ?? null);
    const hovered = this.legendControls.hovered;
    const version = this.layoutVersion;

    const marksSignature = [version, reveal, enter, state.highlighted, emphasized, hover?.mode, selectedKeys].join('|');
    const frontSignature = [version, [...hidden].join(','), legendKeys?.join(','), hovered].join('|');
    this.layers.draw('back', `${version}`, () => backLayer(input));
    this.layers.draw('marks', marksSignature, () => marksLayer(input, state));
    this.layers.draw('front', frontSignature, () => frontLayer(input, { hidden, emphasized: legendKeys, hovered }));
    this.layers.draw('overlay', '', () => overlayLayer(input, state));
  }

  private syncTooltip(geometry: G, hover: Hover<K> | null): void {
    const options = this.opts;
    if (!hover || !options.tooltip) {
      this.tooltip.hide();
      return;
    }
    const { identity, interaction } = this.module;
    const context = interaction.context(geometry, hover);
    const content: ContentResult =
      typeof options.tooltip === 'function'
        ? options.tooltip(context as never)
        : renderTooltip(interaction.tooltip(context));
    const anchor = identity.anchor(geometry, hover.primary);
    const plot = this.frame!.plot;
    this.tooltip.show(content, plot.x + anchor.x, plot.y + anchor.y);
  }

  private syncPopover(geometry: G, selected: K[], selectedKeys: string): void {
    const options = this.opts;
    if (!selected.length || !options.popover) {
      if (this.popover.open || this.popoverFor) {
        this.popoverFor = '';
        this.popover.hide();
      }
      return;
    }
    const { identity } = this.module;
    const plot = this.frame!.plot;
    const anchor = identity.anchor(geometry, selected[selected.length - 1]);
    const anchorX = plot.x + anchor.x;
    const anchorY = plot.y + anchor.y;
    if (selectedKeys !== this.popoverFor) {
      this.popoverFor = selectedKeys;
      const items = selected.map((mark) => identity.item(geometry, mark));
      const content = options.popover(items[items.length - 1], () => this.dismissPopover(), items);
      const label = selected.map((mark) => identity.describe(geometry, mark)).join('; ');
      this.popover.show(content, anchorX, anchorY, label, this.selectedViaKeyboard);
    } else if (this.popover.open) {
      this.popover.reposition(anchorX, anchorY);
    }
  }
}

export { LAYERS };
