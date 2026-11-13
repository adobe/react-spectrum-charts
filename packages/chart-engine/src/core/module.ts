import type { SceneNode } from '../render/scene.js';
import type { Formatters } from '../util/format.js';
import type { CartesianFrame, CartesianSpec } from './cartesian/layout.js';
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
  /** Present when the module declares axes. */
  frame: CartesianFrame | null;
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

/**
 * Everything that differs between chart types. The shell (`Chart`) owns layout of the title, legend
 * and axes, interaction state, tooltips, popovers, keyboard access, animation, export and rendering.
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

  prepare(options: O, env: Env): M;
  legend(model: M, options: O, env: Env): LegendSpec;
  /** Message shown above the chart (missing data). */
  notice(model: M, options: O): string;
  description(model: M, options: O): string;
  /** Declare the cartesian axes this chart needs; omit for charts without axes. */
  axes?(model: M, options: O, env: Env, hidden: Set<string>): CartesianSpec;

  layout(input: LayoutInput<O, M, S>): G;
  snapshot(geometry: G): S;

  /** Shapes and direct labels (the `marks` layer). */
  marks(geometry: G, state: DrawState<K>, env: Env, options: O): SceneNode[];
  /** Hover, selection and focus visuals (the `overlay` layer). */
  overlay(geometry: G, state: DrawState<K>, env: Env, options: O): SceneNode[];
  /** x-axis hover label, for charts with axes. */
  axisHover?(geometry: G, hover: Hover<K>): AxisHover | null;

  hoverMode(options: O): 'point' | 'x' | 'none';
  hit(geometry: G, x: number, y: number, mode: 'point' | 'x'): Hover<K> | null;
  hoverFor(geometry: G, mark: K, mode: 'point' | 'x'): Hover<K>;

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
  nav(geometry: G, options: O): NavTree<K>;

  context(geometry: G, hover: Hover<K>): HoverContext<I>;
  tooltip(context: HoverContext<I>): TooltipModel;
  /** Legend entries that stay emphasized while marks are hovered or selected; the rest fade. Default: none fade. */
  legendEmphasis?(hover: Hover<K> | null, selected: K[]): string[] | null;
  /** Shift-click adds to the selection. */
  multiSelect?(options: O): boolean;
}
