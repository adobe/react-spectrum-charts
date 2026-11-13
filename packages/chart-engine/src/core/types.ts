import type { FormatLocaleDefinition } from 'd3-format';
import type { TimeLocaleDefinition } from 'd3-time-format';

export type Datum = Record<string, unknown>;
export type Accessor<T> = string | ((d: Datum, index: number) => T);

export type RendererType = 'svg' | 'canvas';
export type ThemeName = 'light' | 'dark' | 'auto';
export type ChartSize = 'L' | 'M' | 'S';
export type ScaleType = 'time' | 'linear' | 'band';
export type LineStyle = 'solid' | 'dashed' | 'dotted';
export type LegendPosition = 'top' | 'bottom' | 'left' | 'right';
export type XValue = number | Date | string;

export type ContentResult = string | Node | null | undefined;

export interface LegendOptions {
  position?: LegendPosition;
  title?: string;
  /** Swatch shape. Defaults depend on the chart type. */
  swatch?: 'square' | 'line';
  /** Append each entry's value, e.g. "Phone – 65.2%" (donut). */
  values?: boolean;
  /** `bar` draws one continuous segmented bar (ordinal and diverging palettes). */
  kind?: 'list' | 'bar';
  hidden?: boolean;
}

/** Context passed to custom tooltip functions. Chart types add their own formatters. */
export interface HoverContext<I> {
  /** The item under the pointer, or the keyboard-focused item. */
  item: I;
  /** Every item reported together with it (e.g. all values at the hovered x). */
  items: I[];
  mode: 'point' | 'x';
  /** Color of a legend key (series or segment). */
  colorOf: (key: string) => string;
}

/** Interaction state. A key that is present (even `null`) is controlled by the consumer. */
export interface ChartState<I> {
  hovered?: I | null;
  selected?: I[];
  /** Persistent emphasis: other series/segments are drawn in neutral gray. */
  highlighted?: string | null;
  hidden?: string[];
}

export interface ChartCallbacks<I> {
  onHover?: (item: I | null, ctx: HoverContext<I> | null) => void;
  onClick?: (item: I, event: Event) => void;
  onSelect?: (items: I[]) => void;
  onHighlight?: (key: string | null) => void;
  onLegendHover?: (key: string | null) => void;
  onLegendClick?: (key: string, hidden: boolean) => void;
  onHiddenChange?: (hidden: string[]) => void;
}

export interface LocaleOptions {
  number?: FormatLocaleDefinition;
  time?: TimeLocaleDefinition;
}

export type Padding = number | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>;

/** Options shared by every chart type. `C` is the chart type's tooltip context. */
export interface BaseChartOptions<I, C extends HoverContext<I> = HoverContext<I>> extends ChartCallbacks<I> {
  data: Datum[];
  /** Fixed size in CSS pixels. By default the chart fills its container. */
  width?: number;
  height?: number;
  renderer?: RendererType;
  theme?: ThemeName;
  size?: ChartSize;
  palette?: string[];
  colors?: Record<string, string>;

  title?: string;
  subtitle?: string;
  /** Screen-reader summary. Generated when omitted. */
  description?: string;
  legend?: LegendOptions | boolean;

  tooltip?: boolean | ((ctx: C) => ContentResult);
  popover?: (item: I, close: () => void, selected: I[]) => ContentResult;
  selectable?: boolean;
  state?: ChartState<I>;

  animation?: boolean | { duration?: number };
  locale?: LocaleOptions;
  padding?: Padding;
}

export interface AxisOptions {
  title?: string;
  /** d3-format / d3-time-format specifier, or a custom function. */
  format?: string | ((v: never) => string);
  /** Approximate tick count; derived from the available space by default. */
  ticks?: number;
  grid?: boolean;
  /** Force the domain. `null` keeps the computed end. */
  domain?: [number | Date | null, number | Date | null];
  /** Include zero in a numeric domain. Default true for y, false for x. */
  zero?: boolean;
  nice?: boolean;
  hidden?: boolean;
}

export interface XAxisOptions extends AxisOptions {
  type?: ScaleType;
  /** Second row of time labels (e.g. year under month). Default true for time axes. */
  superLabels?: boolean;
  tickMarks?: boolean;
}

export interface YAxisOptions extends AxisOptions {
  position?: 'left' | 'right';
}

export interface Y2AxisOptions extends YAxisOptions {
  /** Series drawn against the secondary axis. */
  series: string[];
}

export interface ReferenceLineOptions {
  axis?: 'x' | 'y' | 'y2';
  value: XValue;
  label?: string;
  /** primary: thick line with inward triangles (target/goal). secondary: thin solid line. */
  kind?: 'primary' | 'secondary';
}

export interface RangeOptions {
  axis?: 'x' | 'y' | 'y2';
  from: XValue;
  to: XValue;
  label?: string;
  color?: string;
}

/** Options read by the shared cartesian axes (line, and future bar/area charts). */
export interface CartesianOptions {
  xAxis?: XAxisOptions;
  yAxis?: YAxisOptions;
  y2Axis?: Y2AxisOptions;
  referenceLines?: ReferenceLineOptions[];
  ranges?: RangeOptions[];
  /** Columns in a trellis. Defaults to fit the available width. */
  facetColumns?: number;
  /** Hide axes, grid, legend and title (sparklines). */
  minimal?: boolean;
}
