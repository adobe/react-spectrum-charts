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
import { DEFAULT_ANIMATION_TYPES } from '@spectrum-charts/core-s2/constants';

import { annotateAria, applyContainerAria } from './a11y.js';
import { DrawInClock, HoverAnimator, easeInOut, now, requestFrame } from './animation.js';
import { MarkContext, MarkOutput, getChartType, registerChartType } from './charts/chartType.js';
import { lineChartType } from './charts/line/index.js';
import { FrameContext, LayoutPart } from './component.js';
import { getLegendEntryOpacity, getLegendFraction } from './emphasis.js';
import { LocaleInput, getFormatter } from './format.js';
import {
  Layout,
  LayoutInput,
  Padding,
  buildMarks,
  computeLayout,
  getHoverTargets,
  getLayoutMarks,
  getYScaleFor,
  hasFixedMetricAxis,
} from './layout.js';
import { getLegendTarget, isLegendClickable, legendHitTest } from './legend.js';
import { NavigationItems, buildFocusRing, offsetNavigationItems } from './navigation.js';
import { resolveOptions } from './options.js';
import { CanvasRenderer } from './render/canvas.js';
import { SceneRenderer } from './render/renderer.js';
import { SvgRenderer } from './render/svg.js';
import { ChartData, prepareData } from './scales.js';
import { SceneNode, group } from './scene.js';
import { getChartSize, getTheme } from './theme.js';
import { applyTraits } from './traits.js';
import {
  ChartState,
  ColorScheme,
  D3ChartOptions,
  Datum,
  HitTarget,
  Renderer,
  ResolvedChartOptions,
} from './types.js';

registerChartType(lineChartType);

/** Host-controlled settings that aren't part of the shared chart options. */
export interface ChartEnv {
  width: number;
  height: number;
  padding?: number | Partial<Padding>;
  renderer?: Renderer;
  colorScheme?: ColorScheme;
  locale?: LocaleInput;
  /** Carried draw-in start (wall-clock ms) so a remount continues an in-flight sweep. */
  drawInStart?: number;
  /** performance.now() deadline to wait for steady frames before starting the draw-in. */
  holdUntil?: number;
}

export interface ChartEvents {
  hover: (item: Datum | null, target: HitTarget | null, event?: MouseEvent) => void;
  /** Fires on every pointer move over the chart, e.g. to position tooltips. */
  move: (target: HitTarget | null, event: MouseEvent) => void;
  click: (item: Datum, event: MouseEvent, target: HitTarget) => void;
  contextmenu: (item: Datum, event: MouseEvent, target: HitTarget) => void;
  /** Fires when the pointer enters (series) or leaves (null) a legend entry. */
  legendHover: (series: string | null, legendIndex: number) => void;
  legendClick: (series: string, legendIndex: number, event: MouseEvent) => void;
  /** Fires once a frame finishes rendering; `animating` is false when the chart has settled. */
  render: (animating: boolean) => void;
}

export interface D3Chart {
  readonly element: Element;
  update(options: D3ChartOptions, env?: Partial<ChartEnv>): void;
  setState(state: Partial<ChartState>): void;
  getState(): ChartState;
  on<E extends keyof ChartEvents>(event: E, handler: ChartEvents[E]): () => void;
  /** Finds the item at a point relative to the chart element. */
  hitTest(x: number, y: number): Datum | null;
  /** Finds the interactive item at a point relative to the chart element; bounds are plot-relative like Vega's. */
  hitTarget(x: number, y: number): HitTarget | null;
  /** Rows of visible series, decorated with interaction group ids like Vega's filteredTable. */
  getData(): Datum[];
  getLayout(): Layout | undefined;
  /** The last rendered scene, in view coordinates. */
  getScene(): SceneNode[];
  getDrawInStart(): number | undefined;
  /** Navigable series and points with their bounds in view coordinates, for keyboard navigation. */
  getNavigationItems(): NavigationItems;
  /** Renders the current frame immediately; the engine otherwise renders on animation frames. */
  flush(): void;
  /** Serializes the current scene to SVG markup with either renderer. */
  toSVG(): string;
  /** Draws the current scene to a new 1x canvas, like Vega's image export. */
  toCanvas(): HTMLCanvasElement;
  destroy(): void;
}

const toPadding = (padding: ChartEnv['padding'] = 0): Padding =>
  typeof padding === 'number'
    ? { top: padding, right: padding, bottom: padding, left: padding }
    : { top: 0, right: 0, bottom: 0, left: 0, ...padding };

const isAnimationType = (options: ResolvedChartOptions, type: 'hover' | 'drawIn'): boolean =>
  options.animations !== false && (options.animationTypes ?? DEFAULT_ANIMATION_TYPES).includes(type);

const isMarkInteractive = (options: ResolvedChartOptions): boolean =>
  options.marks.some((mark) => getChartType(mark.markType)?.isInteractive?.(mark));

/** Gets the first hovered group id from marks that highlight by group, like Vega's shared `highlightedGroup` signal. */
const getHighlightedGroup = (ctx: MarkContext): unknown => {
  for (const mark of ctx.options.marks) {
    const group = getChartType(mark.markType)?.highlightedGroup?.(mark, ctx);
    if (group !== undefined) return group;
  }
  return undefined;
};

const isInteractive = (options: ResolvedChartOptions): boolean =>
  isMarkInteractive(options) ||
  options.highlightedSeries !== undefined ||
  options.highlightedItem !== undefined ||
  Boolean(options.legends?.some((legend) => legend.highlight));

/** Gets the draw-in sweep's pixel extent: the dimension range, ending half a hover stroke past the last point. */
const hasFocus = (state: ChartState): boolean =>
  Boolean(state.focusedItem) || (state.focusedSeries ?? null) !== null || state.focusedRegion === 'chart';

/** Gets every mark's navigable series in plot coordinates. */
const getNavigation = (ctx: MarkContext): NavigationItems => ({
  chart: { x1: 0, y1: 0, x2: ctx.width, y2: ctx.height },
  series: (ctx.options.marks ?? []).flatMap((mark, i) => getChartType(mark.markType)?.navigation?.(mark, i, ctx) ?? []),
});

const getDrawInExtent = (layout: Layout, hoverStrokeWidth: number): [number, number] => {
  const scale = layout.xScale as unknown as { domain: () => unknown[]; (value: unknown): number | undefined };
  const domain = scale.domain();
  const values = domain.map((value) => scale(value) ?? 0);
  const start = Math.min(...values);
  const end = Math.max(...values);
  return [start, end + hoverStrokeWidth / 2];
};

/**
 * Creates a D3 chart inside a container.
 * @param container
 * @param options
 * @param env
 * @returns D3Chart
 */
export const createChart = (container: HTMLElement, options: D3ChartOptions, env: ChartEnv): D3Chart => {
  let currentOptions = resolveOptions(options);
  let currentEnv = env;
  let renderer: SceneRenderer = createRenderer(container, env.renderer);
  let state: ChartState = {};
  let layout: Layout | undefined;
  let layoutState: ChartState | undefined;
  let layoutInput: LayoutInput | undefined;
  let data: ChartData | undefined;
  let outputs: MarkOutput[] = [];
  let scene: SceneNode[] = [];
  let cancelFrame: (() => void) | undefined;
  let destroyed = false;
  const hoverAnimators: HoverAnimator[] = [];
  const drawIn = new DrawInClock(env.drawInStart, env.holdUntil);
  const listeners: { [E in keyof ChartEvents]: Set<ChartEvents[E]> } = {
    hover: new Set(),
    move: new Set(),
    click: new Set(),
    contextmenu: new Set(),
    legendHover: new Set(),
    legendClick: new Set(),
    render: new Set(),
  };
  let hoveredLegendEntry: { index: number; value: string } | undefined;
  let seriesFraction: ((seriesId: string) => number | undefined) | undefined;

  const relayout = () => {
    const theme = getTheme(currentOptions.colorScheme ?? currentEnv.colorScheme, currentOptions.backgroundColor);
    data = prepareData(currentOptions, theme);
    layoutInput = {
      options: currentOptions,
      theme,
      size: getChartSize(currentEnv.width),
      data,
      formatter: getFormatter((currentEnv.locale ?? currentOptions.locale) as LocaleInput),
      viewWidth: currentEnv.width,
      viewHeight: currentEnv.height,
      padding: toPadding(currentEnv.padding),
    };
    layout = computeLayout(layoutInput, state);
    layoutState = state;
    renderer.resize(currentEnv.width, currentEnv.height);
    applyContainerAria(container, currentOptions.description);
  };

  const hasRows = () => Boolean(data?.table.length);
  const drawInEnabled = () => isAnimationType(currentOptions, 'drawIn') && hasRows();
  const hoverEnabled = () => isAnimationType(currentOptions, 'hover') && isInteractive(currentOptions);

  const getContext = (): MarkContext => {
    const input = layoutInput as LayoutInput;
    const l = layout as Layout;
    return {
      options: currentOptions,
      theme: input.theme,
      size: input.size,
      data: input.data,
      width: l.width,
      height: l.height,
      xScale: l.xScale,
      yScale: l.yScale,
      yScaleFor: getYScaleFor(l.dual),
      metricScales: l.metricScales,
      hasFixedMetricAxis: hasFixedMetricAxis(currentOptions),
      state,
    };
  };

  /** Builds marks for a frame, retargeting hover tweens to the current state first. */
  /** The draw-in sweep's x for a frame; undefined once draw-in is done. */
  const getDrawInX = (time: number): number | undefined => {
    if (!drawInEnabled() || drawIn.done(time)) return undefined;
    const [start, end] = getDrawInExtent(layout as Layout, (layoutInput as LayoutInput).size.hoverStrokeWidth);
    return start + (end - start) * easeInOut(drawIn.t(time));
  };

  const buildFrame = (time: number): boolean => {
    const ctx = getContext();
    const animateHover = hoverEnabled();
    if (animateHover) {
      getHoverTargets(ctx).forEach((targets, i) => {
        hoverAnimators[i] ??= new HoverAnimator();
        if (targets) hoverAnimators[i].setTargets(targets, time);
      });
    }
    // the layout's final pass built the marks for this state; frames only apply traits to them
    const built = getLayoutMarks(layout as Layout, state) ?? buildMarks(ctx);
    const drawInX = getDrawInX(time);
    outputs = built.map((output, i) =>
      applyTraits(output, {
        fraction: animateHover ? (key) => hoverAnimators[i].fraction(key, time) : undefined,
        drawInX,
        height: ctx.height,
      })
    );
    seriesFraction = undefined;
    if (animateHover) {
      // like Vega, the first animated mark's series fractions drive legend opacity
      const targets = getHoverTargets(ctx);
      const i = targets.findIndex((t) => t?.size);
      if (i >= 0) seriesFraction = (key) => (targets[i]?.has(key) ? hoverAnimators[i].fraction(key, time) : undefined);
    }
    const hoverAnimating = animateHover && hoverAnimators.some((animator) => animator.isAnimating(time));
    const drawInAnimating = drawInEnabled() && !drawIn.done(time);
    return hoverAnimating || drawInAnimating;
  };

  const draw = (time: number): boolean => {
    if (!layout || !layoutInput) return false;
    if (state !== layoutState) {
      // like Vega's autosize, hover emphasis that grows mark bounds refits the plot
      layout = computeLayout(layoutInput, state, layout);
      layoutState = state;
    }
    const animating = buildFrame(time);
    const colorScheme = currentOptions.colorScheme ?? currentEnv.colorScheme;
    const focus = hasFocus(state) ? buildFocusRing(state, getNavigation(getContext()), colorScheme) : [];
    const ctx = getContext();
    const inputs = {
      hasInteractiveMarks: isMarkInteractive(currentOptions),
      hoveredItem: ctx.state.hoveredItem ?? undefined,
      highlightedGroup: getHighlightedGroup(ctx),
    };
    const frame: FrameContext = {
      state,
      marks: ctx,
      legendOpacity: (i) =>
        getLegendEntryOpacity(ctx, i, {
          ...inputs,
          fraction: seriesFraction && getLegendFraction(ctx, i, seriesFraction),
        }),
    };
    scene = assembleScene(layout, layoutInput, outputs, frame, focus);
    renderer.render(scene);
    listeners.render.forEach((handler) => handler(animating));
    return animating;
  };

  const schedule = () => {
    if (cancelFrame || destroyed) return;
    cancelFrame = requestFrame((frameTime) => {
      cancelFrame = undefined;
      if (destroyed) return;
      const time = now();
      if (drawInEnabled()) drawIn.frame(frameTime, time);
      if (draw(time)) schedule();
    });
  };

  const invalidate = () => {
    if (draw(now())) schedule();
  };

  const setHovered = (target: HitTarget | null, event?: MouseEvent) => {
    if (!hoveredLegendEntry) (renderer.element as HTMLElement).style.cursor = target?.cursor ?? '';
    // targets with a role, like axis labels, aren't data items
    const item = target && !target.role ? target.datum : null;
    if ((state.hoveredItem ?? null) === item) return;
    state = { ...state, hoveredItem: item };
    listeners.hover.forEach((handler) => handler(item, target, event));
    invalidate();
  };

  const hitTarget = (x: number, y: number): HitTarget | null => {
    if (!layout) return null;
    const px = x - layout.origin.x;
    const py = y - layout.origin.y;
    // later marks draw on top, so they win ties like Vega's voronoi stacking
    for (let i = outputs.length - 1; i >= 0; i--) {
      const { hitTarget: findTarget, hitTest: findItem } = outputs[i];
      const target = findTarget ? findTarget(px, py) : toTarget(findItem?.(px, py) ?? null);
      if (target) return target;
    }
    return null;
  };
  const hitTest = (x: number, y: number): Datum | null => hitTarget(x, y)?.datum ?? null;

  /** Finds a mark, then the topmost layout target, since Vega draws marks above axes. */
  const pointerTarget = (x: number, y: number): HitTarget | null => {
    const target = hitTarget(x, y);
    if (target || !layout) return target;
    const px = x - layout.origin.x;
    const py = y - layout.origin.y;
    return layout.targets.findLast(({ bounds: b }) => px >= b.x1 && px <= b.x2 && py >= b.y1 && py <= b.y2) ?? null;
  };

  const pointerPosition = (event: MouseEvent) => {
    const rect = renderer.element.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const legendAt = (x: number, y: number) =>
    layout ? legendHitTest(layout.legends, x - layout.origin.x, y - layout.origin.y) : undefined;
  const legendTarget = (hit: NonNullable<ReturnType<typeof legendAt>>) =>
    getLegendTarget(currentOptions.legends?.[hit.index], hit);
  /** Legends sit outside the plot, so a legend entry wins over marks and axis labels. */
  const targetAt = (x: number, y: number, legendHit = legendAt(x, y)) =>
    legendHit ? legendTarget(legendHit) : pointerTarget(x, y);

  /** Tracks the hovered legend entry; highlight legends drive hoveredSeries like Vega's legend hover signal. */
  const setLegendHovered = (hit: { index: number; value: string } | undefined) => {
    if (hit?.index === hoveredLegendEntry?.index && hit?.value === hoveredLegendEntry?.value) return;
    const previous = hoveredLegendEntry;
    hoveredLegendEntry = hit;
    if (previous) listeners.legendHover.forEach((handler) => handler(null, previous.index));
    if (hit) listeners.legendHover.forEach((handler) => handler(hit.value, hit.index));
    const clickable = hit && isLegendClickable(currentOptions.legends?.[hit.index]);
    (renderer.element as HTMLElement).style.cursor = clickable ? 'pointer' : '';
    const highlights = hit
      ? currentOptions.legends?.[hit.index]?.highlight
      : previous && currentOptions.legends?.[previous.index]?.highlight;
    if (!highlights) return;
    const hidden = hit && (currentOptions.hiddenSeries ?? []).includes(hit.value);
    const hoveredSeries = hit && !hidden ? hit.value : null;
    const hoveredLegend = hoveredSeries === null ? null : hit?.index ?? null;
    if ((state.hoveredSeries ?? null) === hoveredSeries && (state.hoveredLegend ?? null) === hoveredLegend) return;
    state = { ...state, hoveredSeries, hoveredLegend };
    invalidate();
  };

  const onMove = (event: MouseEvent) => {
    const { x, y } = pointerPosition(event);
    const legendHit = legendAt(x, y);
    setLegendHovered(legendHit && { index: legendHit.index, value: legendHit.entry.value });
    const target = targetAt(x, y, legendHit);
    setHovered(legendHit ? null : target, event);
    listeners.move.forEach((handler) => handler(target, event));
  };
  const onLeave = (event: Event) => {
    setLegendHovered(undefined);
    setHovered(null, event as MouseEvent);
    listeners.move.forEach((handler) => handler(null, event as MouseEvent));
  };
  const onClick = (event: MouseEvent) => {
    const { x, y } = pointerPosition(event);
    const legendHit = legendAt(x, y);
    if (legendHit) listeners.legendClick.forEach((handler) => handler(legendHit.entry.value, legendHit.index, event));
    const target = targetAt(x, y, legendHit);
    if (target) listeners.click.forEach((handler) => handler(target.datum, event, target));
  };
  const onContextMenu = (event: MouseEvent) => {
    const { x, y } = pointerPosition(event);
    const target = targetAt(x, y);
    if (target) listeners.contextmenu.forEach((handler) => handler(target.datum, event, target));
  };

  /** Draws the current scene with a detached renderer, e.g. for export. */
  const renderDetached = <R extends SceneRenderer>(detached: R): R => {
    detached.resize(currentEnv.width, currentEnv.height);
    detached.render(scene);
    return detached;
  };

  const attach = (element: Element) => {
    element.addEventListener('mousemove', onMove as EventListener);
    element.addEventListener('mouseleave', onLeave);
    element.addEventListener('click', onClick as EventListener);
    element.addEventListener('contextmenu', onContextMenu as EventListener);
  };
  const detach = (element: Element) => {
    element.removeEventListener('mousemove', onMove as EventListener);
    element.removeEventListener('mouseleave', onLeave);
    element.removeEventListener('click', onClick as EventListener);
    element.removeEventListener('contextmenu', onContextMenu as EventListener);
  };

  attach(renderer.element);
  relayout();
  invalidate();
  if (drawInEnabled()) schedule();

  return {
    get element() {
      return renderer.element;
    },
    update(nextOptions, nextEnv = {}) {
      const rendererChanged = nextEnv.renderer !== undefined && nextEnv.renderer !== (currentEnv.renderer ?? 'svg');
      currentOptions = resolveOptions(nextOptions);
      currentEnv = { ...currentEnv, ...nextEnv };
      if (rendererChanged) {
        detach(renderer.element);
        renderer.destroy();
        renderer = createRenderer(container, currentEnv.renderer);
        attach(renderer.element);
      }
      relayout();
      invalidate();
      if (drawInEnabled() && !drawIn.done(now())) schedule();
    },
    setState(next) {
      state = { ...state, ...next };
      invalidate();
    },
    getState: () => state,
    on(event, handler) {
      const set = listeners[event] as Set<typeof handler>;
      set.add(handler);
      return () => set.delete(handler);
    },
    hitTest,
    hitTarget,
    getData: () => data?.filteredTable ?? [],
    getLayout: () => layout,
    getScene: () => scene,
    getDrawInStart: () => drawIn.start,
    getNavigationItems: () =>
      layout
        ? offsetNavigationItems(getNavigation(getContext()), layout.origin.x, layout.origin.y)
        : { chart: { x1: 0, y1: 0, x2: 0, y2: 0 }, series: [] },
    flush: () => {
      draw(now());
    },
    toSVG: () =>
      renderer instanceof SvgRenderer
        ? renderer.toSVG()
        : renderDetached(new SvgRenderer(document.createElement('div'))).toSVG(),
    toCanvas: () => {
      const source = renderDetached(new CanvasRenderer(document.createElement('div'))).element;
      if (source.width === currentEnv.width && source.height === currentEnv.height) return source;
      // export at 1x like Vega's toImageURL, whatever the device pixel ratio
      const canvas = document.createElement('canvas');
      canvas.width = currentEnv.width;
      canvas.height = currentEnv.height;
      canvas.getContext('2d')?.drawImage(source, 0, 0, canvas.width, canvas.height);
      return canvas;
    },
    destroy() {
      destroyed = true;
      cancelFrame?.();
      detach(renderer.element);
      renderer.destroy();
    },
  };
};

const toTarget = (datum: Datum | null): HitTarget | null =>
  datum ? { datum, mark: '', bounds: { x1: 0, y1: 0, x2: 0, y2: 0 } } : null;

const createRenderer = (container: HTMLElement, type: Renderer = 'svg'): SceneRenderer =>
  type === 'canvas' ? new CanvasRenderer(container) : new SvgRenderer(container);

/**
 * Assembles a frame's scene in Vega's draw order: background, then components and marks by layer, then the focus ring.
 * @param layout
 * @param input
 * @param outputs
 * @param frame
 * @param focus
 * @returns scene
 */
const assembleScene = (
  layout: Layout,
  input: LayoutInput,
  outputs: MarkOutput[],
  frame: FrameContext,
  focus: SceneNode[] = []
): SceneNode[] => {
  const marks = outputs.flatMap((output) => [...output.marks, ...output.overlay]);
  const below = layout.parts.filter(({ component }) => component.layer < 0);
  const above = layout.parts.filter(({ component }) => component.layer >= 0);
  const draw = ({ component, result }: LayoutPart) => component.scene(result, frame);
  const children: SceneNode[] = [...below.flatMap(draw), ...marks, ...above.flatMap(draw), ...focus];
  const scene: SceneNode[] = [];
  if (input.theme.background !== 'transparent') {
    scene.push({
      type: 'rect',
      key: 'background',
      x: 0,
      y: 0,
      width: input.viewWidth,
      height: input.viewHeight,
      fill: input.theme.background,
    });
  }
  scene.push(group('root', children, { x: layout.origin.x, y: layout.origin.y, role: 'frame' }));
  annotateAria(scene, layout, input);
  return scene;
};
