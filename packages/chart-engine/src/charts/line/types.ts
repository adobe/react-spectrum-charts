import type {
  Accessor,
  BaseChartOptions,
  CartesianOptions,
  Datum,
  HoverContext,
  LineStyle,
  XValue,
} from '../../core/types.js';

export type { LineStyle, XValue };
export type PointShape = 'circle' | 'square' | 'triangle' | 'diamond';
export type HoverMode = 'point' | 'x' | 'none';

/** A resolved data point handed to callbacks, tooltips, and popovers. */
export interface LineItem {
  series: string;
  /** Value of the color channel for this series (defaults to the series name). */
  color: string;
  x: XValue;
  y: number | null;
  index: number;
  datum: Datum;
  estimated: boolean;
  axis: 'y' | 'y2';
  facet?: string;
}

/** @deprecated Use LineItem. */
export type ChartItem = LineItem;

export interface LineHoverContext extends HoverContext<LineItem> {
  formatX: (v: XValue) => string;
  formatY: (v: number | null, axis?: 'y' | 'y2') => string;
  /** @deprecated Use colorOf. */
  seriesColor: (series: string) => string;
}

export interface DirectLabelOptions {
  /** Series-name labels at the start or end of each line. */
  category?: 'end' | 'start' | false;
  /** Value label on the last point of each series. */
  value?: 'end' | false;
  /** Restrict labels to these series. */
  include?: string[];
}

export interface AnnotationOptions {
  x: XValue;
  /** Series to anchor on. Required when `y` is omitted and several series exist. */
  series?: string;
  y?: number;
  text: string;
  side?: 'left' | 'right';
}

export interface TrendlineOptions {
  series?: string;
  label?: string;
}

export interface SeriesStyle {
  color?: string;
  lineStyle?: LineStyle;
  area?: boolean;
  shape?: PointShape;
}

export interface LineChartOptions extends BaseChartOptions<LineItem, LineHoverContext>, CartesianOptions {
  x: Accessor<unknown>;
  y: Accessor<unknown>;
  /** Field that identifies a line. Omit for a single series. */
  series?: Accessor<unknown>;
  /** Field that drives color. Defaults to the series field. */
  color?: Accessor<unknown>;
  /** Field that drives line style; map its values with `lineStyles`. */
  lineStyle?: Accessor<unknown>;
  lineStyles?: Record<string, LineStyle>;
  /** Field marking estimated/forecast points, drawn dotted. */
  estimated?: Accessor<unknown>;
  /** Field that splits the chart into small multiples. */
  facet?: Accessor<unknown>;
  layout?: 'single' | 'trellis';

  lineWidth?: number;
  seriesStyles?: Record<string, SeriesStyle>;
  curve?: 'linear' | 'monotone';
  points?: 'auto' | 'all' | 'none';
  shapes?: boolean;
  area?: boolean;

  directLabels?: DirectLabelOptions | boolean;
  annotations?: AnnotationOptions[];
  trendline?: TrendlineOptions | boolean;

  hover?: HoverMode;
  /** Hollow marker on the last point (sparklines). */
  endMarker?: boolean;
  /** Text drawn to the right of the plot (sparkline value). */
  trailingLabel?: string;
}
