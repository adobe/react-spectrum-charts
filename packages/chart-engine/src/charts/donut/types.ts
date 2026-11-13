import type { Accessor, BaseChartOptions, Datum, HoverContext } from '../../core/types.js';

/** A segment handed to callbacks, tooltips, and popovers. */
export interface DonutItem {
  category: string;
  value: number;
  /** Share of its donut's total, 0–1. */
  percent: number;
  /** Total of the donut the segment belongs to. */
  total: number;
  /** Index into the original data array. */
  index: number;
  datum: Datum;
  facet?: string;
}

export interface DonutHoverContext extends HoverContext<DonutItem> {
  formatValue: (value: number) => string;
  formatPercent: (share: number) => string;
}

export interface DonutCenterOptions {
  /**
   * The large metric. `total` sums the segments (default for multi-segment donuts); `primary` shows the
   * share of the first segment (default for binary donuts and trellises). Numbers are formatted.
   */
  value?: 'total' | 'primary' | number | string | false;
  /** Metric label under the value. */
  label?: string;
  /** Optional third line at large sizes, e.g. "+2.5%". */
  delta?: { text: string; sentiment?: 'positive' | 'negative' | 'neutral' };
}

export interface DonutBenchmarkOptions {
  /** Share the primary segment is compared to: 0–1, or a percentage when greater than 1. */
  value: number;
  label?: string;
  /** Show the benchmark value under its label. Default true when a label is set. */
  showValue?: boolean;
  /** Color the primary segment positive/negative against the benchmark. Default true. */
  sentiment?: boolean;
}

export interface DonutDirectLabelOptions {
  /** `lightweight`: name over percentage. `advanced`: swatch, name, percentage and "n out of total" in columns. */
  style?: 'lightweight' | 'advanced';
  /** Segments drawn with the advanced style while the rest stay lightweight (combined labels). */
  advanced?: string[];
  /** Restrict labels to these segments. */
  include?: string[];
}

export interface DonutChartOptions extends BaseChartOptions<DonutItem, DonutHoverContext> {
  category: Accessor<unknown>;
  value: Accessor<unknown>;
  /** Field that splits the chart into small multiples. */
  facet?: Accessor<unknown>;
  facetColumns?: number;
  variant?: 'full' | 'semicircle';
  /** `descending` (default) orders segments largest first from 12 o'clock; `none` keeps data order (ordinal data). */
  sort?: 'descending' | 'none';
  /** Binary donut: the second segment is drawn in neutral gray. Pass `{ secondary }` to pick the gray category. */
  binary?: boolean | { secondary: string };
  /** In a binary trellis, give each facet's primary segment its own palette color. */
  colorByFacet?: boolean;
  /** Ring thickness in px. Interpolated from the diameter by default. */
  thickness?: number;
  /** Largest diameter in px. */
  maxDiameter?: number;
  center?: DonutCenterOptions | false;
  benchmark?: DonutBenchmarkOptions;
  directLabels?: boolean | 'lightweight' | 'advanced' | DonutDirectLabelOptions;
  /** d3-format specifier for values. Compact by default. */
  valueFormat?: string;
  /** d3-format specifier for shares. Default ".1%". */
  percentFormat?: string;
  /** Shift-click (or Shift+Enter) adds segments to the selection. Default true. */
  multiSelect?: boolean;
}
