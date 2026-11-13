import type { SceneNode } from '../render/scene.js';
import type { Formatters } from '../util/format.js';
import type { SizeTokens, Theme } from './theme.js';
import type { BaseChartOptions, HoverContext, LegendOptions, LineStyle } from './types.js';

/** Shared, per-render inputs every module receives. */
export interface Env {
  theme: Theme;
  sizes: SizeTokens;
  f: Formatters;
  palette: string[];
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LegendEntry {
  key: string;
  label: string;
  color: string;
  lineStyle?: LineStyle;
  /** Appended after the label, e.g. a percentage. */
  value?: string;
  /** Non-interactive entries, e.g. a trendline or a line-style key. */
  static?: boolean;
}

export interface LegendSpec extends Omit<LegendOptions, 'hidden'> {
  show: boolean;
  entries: LegendEntry[];
  swatch: 'square' | 'line';
}

/** What is under the pointer or keyboard focus. `K` is the module's mark reference. */
export interface Hover<K> {
  primary: K;
  items: K[];
  mode: 'point' | 'x';
}

/** Interaction state handed to the drawing functions. */
export interface DrawState<K> {
  hover: Hover<K> | null;
  selected: K[];
  /** Persistent highlight: other groups are drawn in neutral gray. */
  highlighted: string | null;
  /** Transient emphasis (legend hover, keyboard focus on a group, point hover): others fade. */
  emphasized: string | null;
  /** Initial reveal progress, 0..1. */
  reveal: number;
  /** Fade-in progress of marks that appeared in the current update. */
  enter: number;
  /** Hover value labels are drawn in the scene (no tooltip is shown). */
  hoverLabels: boolean;
}

export interface LayoutInput<O, M, S> {
  model: M;
  options: O;
  env: Env;
  width: number;
  height: number;
  hidden: Set<string>;
  /** Previous geometry snapshot and progress while an update animates. */
  tween: { from: S; t: number } | null;
}

/** One level of keyboard navigation: chart → groups → items. Rects are in plot coordinates. */
export interface NavLeaf<K> {
  mark: K;
  label: string;
  rect: Rect;
  /** Focus outline shape, in plot coordinates. */
  path?: string;
  /** Items in other groups with the same match key are reached with up/down. */
  match: string;
}

export interface NavGroup<K> {
  key: string;
  label: string;
  rect: Rect;
  path?: string;
  /** Legend key emphasized while this group has focus. */
  emphasis?: string;
  items: NavLeaf<K>[];
}

export interface NavTree<K> {
  label: string;
  /** Skip the group level: Enter on the chart goes straight to the first item. */
  flat: boolean;
  groups: NavGroup<K>[];
}

export interface TooltipRow {
  color?: string | null;
  name: string;
  value: string;
  total?: boolean;
}

export interface TooltipModel {
  title?: string;
  rows: TooltipRow[];
}

/** Hover label for the shared x axis. */
export interface AxisHover {
  panel: number;
  x: number;
  label: string;
}

/** Turns options into a model and the text the shell shows around the chart. */
export interface ModelHooks<O, M> {
  prepare(options: O, env: Env): M;
  legend(model: M, options: O, env: Env): LegendSpec;
  /** Message shown above the chart (missing data). Default: none. */
  notice?(model: M, options: O): string;
  description(model: M, options: O): string;
  /** Compact presentation without title, legend or notice. Default: false. */
  minimal?(options: O): boolean;
}

/** Places marks in the plot area. */
export interface GeometryHooks<O, M, G, S> {
  layout(input: LayoutInput<O, M, S>): G;
  /** Captures what the next update animates from. */
  snapshot(geometry: G): S;
}

/** Scene content for each layer, in plot coordinates. */
export interface DrawHooks<O, G, K> {
  /** Drawn under the marks, e.g. axes and grid lines. */
  back?(geometry: G, options: O, env: Env): SceneNode[];
  /** Shapes and direct labels. */
  marks(geometry: G, state: DrawState<K>, env: Env, options: O): SceneNode[];
  /** Drawn over the marks and redrawn only with data, e.g. reference lines. */
  front?(geometry: G, options: O, env: Env): SceneNode[];
  /** Hover, selection and focus visuals, redrawn every frame. */
  overlay(geometry: G, state: DrawState<K>, env: Env, options: O): SceneNode[];
}

/** Maps between marks, public items and legend keys. */
export interface IdentityHooks<G, K, I> {
  /** Stable identity of a mark. */
  key(mark: K): string;
  /** Legend key the mark belongs to. */
  group(mark: K): string;
  item(geometry: G, mark: K): I;
  find(geometry: G, item: I): K | null;
  /** Tooltip and popover anchor. */
  anchor(geometry: G, mark: K): { x: number; y: number };
  /** Accessible description of one mark (popover label). */
  describe(geometry: G, mark: K): string;
}

/** Hit testing, hover content and selection rules. */
export interface InteractionHooks<O, G, K, I> {
  /** Default: 'point'. */
  hoverMode?(options: O): 'point' | 'x' | 'none';
  hit(geometry: G, x: number, y: number, mode: 'point' | 'x'): Hover<K> | null;
  hoverFor(geometry: G, mark: K, mode: 'point' | 'x'): Hover<K>;
  context(geometry: G, hover: Hover<K>): HoverContext<I>;
  tooltip(context: HoverContext<I>): TooltipModel;
  /** Legend entries that stay emphasized while marks are hovered or selected; the rest fade. Default: none fade. */
  legendEmphasis?(hover: Hover<K> | null, selected: K[]): string[] | null;
  /** Shift-click adds to the selection. Default: false. */
  multiSelect?(options: O): boolean;
}

/**
 * Everything that differs between chart types. The shell (`Chart`) owns layout of the title and legend,
 * interaction state, tooltips, popovers, keyboard access, animation, export and rendering.
 * All coordinates are relative to the plot area.
 *
 * O options · M model · G geometry · K mark reference · I public item · S animation snapshot
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ChartModule<O extends BaseChartOptions<I, any>, M, G, K, I, S> {
  /** Human name, e.g. "Line chart". */
  readonly name: string;
  /** Options whose change animates the data. */
  readonly dataKeys: readonly (keyof O)[];
  model: ModelHooks<O, M>;
  geometry: GeometryHooks<O, M, G, S>;
  draw: DrawHooks<O, G, K>;
  identity: IdentityHooks<G, K, I>;
  interaction: InteractionHooks<O, G, K, I>;
  nav(geometry: G, options: O): NavTree<K>;
}
