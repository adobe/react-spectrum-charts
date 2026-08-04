/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

export type ChartFeatureCategory = 'mark' | 'decoration' | 'chart-level';

// Points at the canonical parameter shape instead of re-transcribing it, so this catalog can't
// drift from the real *Options types. Full machine-readable parameter schemas (for a generation
// skill to consume programmatically) should come from a later automated extraction step
// (e.g. ts-json-schema-generator run against optionsType.filePath), not from hand-copying here.
export type ChartFeatureTypeRef = {
  typeName: string;
  filePath: string;
};

export type ChartFeature = {
  id: string;
  name: string;
  category: ChartFeatureCategory;
  /** Feature ids (marks, or 'chart') this feature attaches to or requires. */
  appliesTo: string[];
  /** Engine-agnostic description of the visual/behavioral effect, independent of Vega/RSC internals. */
  description: string;
  /** @spectrum-charts/constants names referenced by this feature's builder. */
  relatedTokens: string[];
  /**
   * Whether a JSX wrapper component exists today, per RSC generation (spec-builder support always exists).
   * `s1Maturity`/`s2Maturity` are set when the component ships from a non-stable import path
   * (`@adobe/react-spectrum-charts/alpha` or `/rc`) rather than the stable barrel — alpha and RC
   * components are still considered supported (s1/s2: true), just not stable yet.
   */
  rscSupport: { s1: boolean; s2: boolean; s1Maturity?: 'alpha' | 'rc'; s2Maturity?: 'alpha' | 'rc' };
  optionsType: ChartFeatureTypeRef;
  /** Repo-relative path to the spec-builder implementation, when independently confirmed. */
  builderFile?: string;
};

const S2_TYPES = 'packages/vega-spec-builder-s2/src/types';
const S2_SRC = 'packages/vega-spec-builder-s2/src';

export const CHART_FEATURE_CATALOG: ChartFeature[] = [
  // --- Marks (top-level chart types) ---
  {
    id: 'area',
    name: 'Area',
    category: 'mark',
    appliesTo: ['chart'],
    description:
      'Fills the region between a metric line and a baseline (or between two metric fields) to show ' +
      'volume/magnitude over a continuous dimension (usually time).',
    relatedTokens: ['DEFAULT_COLOR', 'DEFAULT_COLOR_SCHEME', 'DEFAULT_TIME_DIMENSION', 'DEFAULT_METRIC'],
    rscSupport: { s1: true, s2: false },
    optionsType: { typeName: 'AreaOptions', filePath: `${S2_TYPES}/marks/areaSpec.types.ts` },
    builderFile: `${S2_SRC}/area/areaSpecBuilder.ts`,
  },
  {
    id: 'bar',
    name: 'Bar',
    category: 'mark',
    appliesTo: ['chart'],
    description:
      'Draws categorical bars for a metric, with support for grouping, stacking, dual-axis, trellising, ' +
      'square/round corners, and a large family of attachable decorations.',
    relatedTokens: [
      'DEFAULT_COLOR_SCHEME',
      'DEFAULT_CATEGORICAL_DIMENSION',
      'DEFAULT_LINE_TYPES',
      'DEFAULT_LINE_WIDTHS',
      'CHART_SIZE_STROKE_WIDTH',
      'CHART_SIZE_LABEL_GAP',
    ],
    rscSupport: { s1: true, s2: true },
    optionsType: { typeName: 'BarOptions', filePath: `${S2_TYPES}/marks/barSpec.types.ts` },
    builderFile: `${S2_SRC}/bar/barSpecBuilder.ts`,
  },
  {
    id: 'bullet',
    name: 'Bullet',
    category: 'mark',
    appliesTo: ['chart'],
    description:
      "Renders a compact horizontal/vertical 'target vs. actual' gauge bar (KPI-style), with optional " +
      'qualitative threshold bands and a target marker.',
    relatedTokens: ['DEFAULT_BULLET_DIRECTION', 'DEFAULT_COLOR_SCHEME'],
    rscSupport: { s1: true, s2: false, s1Maturity: 'alpha' },
    optionsType: { typeName: 'BulletOptions', filePath: `${S2_TYPES}/marks/bulletSpec.types.ts` },
    builderFile: `${S2_SRC}/bullet/bulletSpecBuilder.ts`,
  },
  {
    id: 'combo',
    name: 'Combo',
    category: 'mark',
    appliesTo: ['chart'],
    description:
      'Composites a Bar mark and a Line mark on the same chart/axes (e.g. bars for volume + line for a rate), ' +
      'so the two mark families can share a dimension/scale.',
    relatedTokens: [],
    rscSupport: { s1: true, s2: false, s1Maturity: 'alpha' },
    optionsType: { typeName: 'ComboOptions', filePath: `${S2_TYPES}/marks/comboSpec.types.ts` },
    builderFile: `${S2_SRC}/combo/comboSpecBuilder.ts`,
  },
  {
    id: 'donut',
    name: 'Donut',
    category: 'mark',
    appliesTo: ['chart'],
    description:
      "Renders proportional data as a ring (or pie when holeRatio=0), with an optional center summary " +
      'metric and per-segment labels.',
    relatedTokens: ['DEFAULT_COLOR_SCHEME'],
    rscSupport: { s1: true, s2: true, s1Maturity: 'rc', s2Maturity: 'rc' },
    optionsType: { typeName: 'DonutOptions', filePath: `${S2_TYPES}/marks/donutSpec.types.ts` },
    builderFile: `${S2_SRC}/donut/donutSpecBuilder.ts`,
  },
  {
    id: 'line',
    name: 'Line',
    category: 'mark',
    appliesTo: ['chart'],
    description:
      'Draws a trended line for a metric across a dimension (typically time), with rich interaction ' +
      '(hover animation, sparkline mode, dual-axis, gradient) and the largest set of attachable decorations ' +
      'of any mark.',
    relatedTokens: [
      'DEFAULT_COLOR_SCHEME',
      'DEFAULT_INTERACTION_MODE',
      'DEFAULT_LINE_TYPES',
      'CHART_SIZE_POINT_SIZE',
      'CHART_SIZE_STROKE_WIDTH',
      'CHART_SIZE_HOVER_STROKE_WIDTH',
    ],
    rscSupport: { s1: true, s2: true },
    optionsType: { typeName: 'LineOptions', filePath: `${S2_TYPES}/marks/lineSpec.types.ts` },
    builderFile: `${S2_SRC}/line/lineSpecBuilder.ts`,
  },
  {
    id: 'scatter',
    name: 'Scatter',
    category: 'mark',
    appliesTo: ['chart'],
    description:
      'Plots individual data points (x/y) as symbols, with facetable color/size/line-type/opacity/stroke ' +
      'and optional blend-mode for overlap density.',
    relatedTokens: ['DEFAULT_SYMBOL_SIZE', 'DEFAULT_SYMBOL_SHAPES', 'DEFAULT_SYMBOL_STROKE_WIDTH', 'CHART_SIZE_POINT_SIZE'],
    rscSupport: { s1: true, s2: false },
    optionsType: { typeName: 'ScatterOptions', filePath: `${S2_TYPES}/marks/scatterSpec.types.ts` },
    builderFile: `${S2_SRC}/scatter/scatterSpecBuilder.ts`,
  },
  {
    id: 'venn',
    name: 'Venn',
    category: 'mark',
    appliesTo: ['chart'],
    description:
      'Draws a proportional Venn/Euler diagram of set sizes and intersections, with labels inside sets/intersections.',
    relatedTokens: ['DEFAULT_COLOR_SCHEME'],
    rscSupport: { s1: true, s2: false, s1Maturity: 'alpha' },
    optionsType: { typeName: 'VennOptions', filePath: `${S2_TYPES}/marks/vennSpec.types.ts` },
    builderFile: `${S2_SRC}/venn/vennSpecBuilder.ts`,
  },

  // --- Mark decorations / sub-features ---
  {
    id: 'bar-direct-label',
    name: 'Bar Direct Label',
    category: 'decoration',
    appliesTo: ['bar'],
    description:
      'Draws the metric value as a text label directly on/adjacent to each bar, instead of relying on axis/tooltip.',
    relatedTokens: ['ANNOTATION_FONT_SIZE', 'ANNOTATION_FONT_WEIGHT'],
    rscSupport: { s1: false, s2: true },
    optionsType: { typeName: 'BarDirectLabelOptions', filePath: `${S2_TYPES}/marks/supplemental/barDirectLabelSpec.types.ts` },
    builderFile: `${S2_SRC}/barDirectLabel/barDirectLabelUtils.ts`,
  },
  {
    id: 'line-direct-label',
    name: 'Line Direct Label',
    category: 'decoration',
    appliesTo: ['line'],
    description:
      'Places a text label at the end (or a specified point) of a line series to identify it without needing the legend.',
    relatedTokens: ['DEFAULT_FONT_SIZE'],
    rscSupport: { s1: false, s2: true },
    optionsType: { typeName: 'LineDirectLabelOptions', filePath: `${S2_TYPES}/marks/supplemental/lineDirectLabelSpec.types.ts` },
    builderFile: `${S2_SRC}/lineDirectLabel/lineDirectLabelUtils.ts`,
  },
  {
    id: 'line-forecast',
    name: 'Line Forecast',
    category: 'decoration',
    appliesTo: ['line'],
    description:
      'Extends a line series past its known data with a projected/forecast segment, typically styled ' +
      'distinctly (e.g. dashed) with a boundary marker between actual and forecast.',
    relatedTokens: ['DEFAULT_LINE_TYPES'],
    rscSupport: { s1: false, s2: true },
    optionsType: { typeName: 'LineForecastOptions', filePath: `${S2_TYPES}/marks/supplemental/lineForecastSpec.types.ts` },
    builderFile: `${S2_SRC}/lineForecast/lineForecastUtils.ts`,
  },
  {
    id: 'metric-range',
    name: 'Metric Range',
    category: 'decoration',
    appliesTo: ['line'],
    description: 'Draws a shaded band (min/max envelope, e.g. a confidence interval) around a line series.',
    relatedTokens: [],
    rscSupport: { s1: true, s2: false },
    optionsType: { typeName: 'MetricRangeOptions', filePath: `${S2_TYPES}/marks/supplemental/metricRangeSpec.types.ts` },
    builderFile: `${S2_SRC}/metricRange/metricRangeUtils.ts`,
  },
  {
    id: 'trendline',
    name: 'Trendline',
    category: 'decoration',
    appliesTo: ['bar', 'line', 'scatter'],
    description:
      "Draws a fitted statistical trend line (linear/polynomial/exponential/log/power regression, or " +
      "moving-window average/median) over a series' data points, to surface an underlying pattern independent of noise.",
    relatedTokens: ['DEFAULT_COLOR_SCHEME', 'TRENDLINE_VALUE'],
    rscSupport: { s1: true, s2: false },
    optionsType: { typeName: 'TrendlineOptions', filePath: `${S2_TYPES}/marks/supplemental/trendlineSpec.types.ts` },
    builderFile: `${S2_SRC}/trendline/trendlineSpecBuilder.ts`,
  },
  {
    id: 'trendline-annotation',
    name: 'Trendline Annotation',
    category: 'decoration',
    appliesTo: ['trendline'],
    description:
      "Shows a small badge/label reporting the trendline's value (e.g. slope/formula result) at a specific dimension point.",
    relatedTokens: ['ANNOTATION_FONT_SIZE', 'ANNOTATION_FONT_WEIGHT', 'ANNOTATION_PADDING'],
    rscSupport: { s1: true, s2: false },
    optionsType: {
      typeName: 'TrendlineAnnotationOptions',
      filePath: `${S2_TYPES}/marks/supplemental/trendlineAnnotationSpec.types.ts`,
    },
    builderFile: `${S2_SRC}/trendlineAnnotation/trendlineAnnotationUtils.ts`,
  },
  {
    id: 'scatter-path',
    name: 'Scatter Path',
    category: 'decoration',
    appliesTo: ['scatter'],
    description:
      'Connects points within a group (e.g. by series/time order) with a line, turning a scatter plot into ' +
      'a path/trajectory visualization.',
    relatedTokens: ['DEFAULT_LINE_WIDTHS'],
    rscSupport: { s1: true, s2: false },
    optionsType: { typeName: 'ScatterPathOptions', filePath: `${S2_TYPES}/marks/supplemental/scatterPathSpec.types.ts` },
    builderFile: `${S2_SRC}/scatterPath/scatterPathUtils.ts`,
  },
  {
    id: 'axis-annotation',
    name: 'Axis Annotation',
    category: 'decoration',
    appliesTo: ['axis'],
    description:
      'Places grouped markers/callouts along an axis at specific data-driven points (distinct from reference ' +
      'lines), each with its own color and optional popover/inspect.',
    relatedTokens: [
      'DEFAULT_AXIS_ANNOTATION_COLOR',
      'DEFAULT_AXIS_ANNOTATION_OFFSET',
      'ANNOTATION_FONT_SIZE',
      'ANNOTATION_FONT_WEIGHT',
      'ANNOTATION_PADDING',
    ],
    rscSupport: { s1: true, s2: false },
    optionsType: { typeName: 'AxisAnnotationOptions', filePath: `${S2_TYPES}/axis/axisAnnotationSpec.types.ts` },
    builderFile: `${S2_SRC}/axisAnnotation/axisAnnotationUtils.ts`,
  },
  {
    id: 'reference-line',
    name: 'Reference Line',
    category: 'decoration',
    appliesTo: ['axis'],
    description:
      'Draws a single fixed rule (with optional caret/cap and text label) at a specific value on an axis — ' +
      'e.g. a goal line or threshold marker, independent of the data.',
    relatedTokens: ['CHART_SIZE_STROKE_WIDTH', 'REFERENCE_LINE_SIZE_STROKE_WIDTHS'],
    rscSupport: { s1: true, s2: true },
    optionsType: { typeName: 'ReferenceLineOptions', filePath: `${S2_TYPES}/axis/referenceLineSpec.types.ts` },
    builderFile: `${S2_SRC}/axis/axisReferenceLineUtils.ts`,
  },
  {
    id: 'bar-annotation',
    name: 'Bar Annotation',
    category: 'decoration',
    appliesTo: ['bar'],
    description: 'Draws a text callout on a bar.',
    relatedTokens: [],
    rscSupport: { s1: false, s2: false },
    optionsType: { typeName: 'BarAnnotationOptions', filePath: `${S2_TYPES}/marks/supplemental/barAnnotationSpec.types.ts` },
    // builder file not independently confirmed during the audit
  },
  {
    id: 'line-point-annotation',
    name: 'Line Point Annotation',
    category: 'decoration',
    appliesTo: ['line'],
    description: 'Anchors a text annotation to a specific data point on a line, auto-placing it to avoid overlap.',
    relatedTokens: [],
    rscSupport: { s1: true, s2: true },
    optionsType: {
      typeName: 'LinePointAnnotationOptions',
      filePath: `${S2_TYPES}/marks/supplemental/linePointAnnotationSpec.types.ts`,
    },
    // builder file not independently confirmed during the audit
  },
  {
    id: 'scatter-annotation',
    name: 'Scatter Annotation',
    category: 'decoration',
    appliesTo: ['scatter'],
    description: 'Same point-anchored annotation behavior as Line Point Annotation, for scatter points.',
    relatedTokens: [],
    rscSupport: { s1: true, s2: false },
    optionsType: {
      typeName: 'ScatterAnnotationOptions',
      filePath: `${S2_TYPES}/marks/supplemental/scatterAnnotationSpec.types.ts`,
    },
    // builder file not independently confirmed during the audit
  },
  {
    id: 'donut-summary',
    name: 'Donut Summary',
    category: 'decoration',
    appliesTo: ['donut'],
    description: "Shows a formatted metric total/summary in the donut's center hole.",
    relatedTokens: [],
    rscSupport: { s1: true, s2: true, s1Maturity: 'rc', s2Maturity: 'rc' },
    // NOTE: "dountSummarySpec.types.ts" (missing "n") is the real filename in the repo — not a transcription error.
    optionsType: { typeName: 'DonutSummaryOptions', filePath: `${S2_TYPES}/marks/supplemental/dountSummarySpec.types.ts` },
  },
  {
    id: 'segment-label',
    name: 'Segment Label',
    category: 'decoration',
    appliesTo: ['donut'],
    description: 'Labels each donut segment with its value and/or percent-of-whole.',
    relatedTokens: [],
    rscSupport: { s1: true, s2: true, s1Maturity: 'rc', s2Maturity: 'rc' },
    optionsType: { typeName: 'SegmentLabelOptions', filePath: `${S2_TYPES}/marks/supplemental/segmentLabelSpec.types.ts` },
  },

  // --- Chart-level / shared features ---
  {
    id: 'axis',
    name: 'Axis',
    category: 'chart-level',
    appliesTo: ['chart'],
    description:
      "Renders the chart's coordinate axis: tick marks, labels (with alignment/formatting/orientation/" +
      'truncation), gridlines, baseline, and hosts child annotations/reference lines/thumbnails.',
    relatedTokens: [
      'DEFAULT_GRANULARITY',
      'DEFAULT_LABEL_ALIGN',
      'DEFAULT_LABEL_FONT_WEIGHT',
      'DEFAULT_LABEL_ORIENTATION',
      'DEFAULT_LABEL_POSITION',
      'DEFAULT_LOCALE',
      'MAX_THUMBNAIL_SIZE',
      'MIN_THUMBNAIL_SIZE',
      'THUMBNAIL_OFFSET',
    ],
    rscSupport: { s1: true, s2: true },
    optionsType: { typeName: 'AxisOptions', filePath: `${S2_TYPES}/axis/axisSpec.types.ts` },
    builderFile: `${S2_SRC}/axis/axisSpecBuilder.ts`,
  },
  {
    id: 'legend',
    name: 'Legend',
    category: 'chart-level',
    appliesTo: ['chart'],
    description:
      'Renders a key mapping color/line-type/opacity/symbol-shape facets to series names, with optional ' +
      'interactivity (click-to-toggle/highlight series) and a popover child.',
    relatedTokens: [
      'DEFAULT_LEGEND_SYMBOL_SIZE',
      'DEFAULT_LEGEND_SYMBOL_WIDTH',
      'DEFAULT_LEGEND_COLUMN_PADDING',
      'DEFAULT_LEGEND_LABEL_LIMIT',
      'DEFAULT_HIDDEN_SERIES',
    ],
    rscSupport: { s1: true, s2: true },
    optionsType: { typeName: 'LegendOptions', filePath: `${S2_TYPES}/legendSpec.types.ts` },
    builderFile: `${S2_SRC}/legend/legendSpecBuilder.ts`,
  },
  {
    id: 'chart-popover',
    name: 'Chart Popover',
    category: 'chart-level',
    appliesTo: ['area', 'bar', 'donut', 'line', 'scatter', 'venn', 'legend'],
    description:
      'Opens a click-triggered (or right-click) floating detail panel anchored to a mark/data point, with ' +
      'configurable sizing and margins.',
    relatedTokens: ['HOVERED_ITEM', 'SELECTED_ITEM', 'SELECTED_SERIES', 'SELECTED_GROUP'],
    rscSupport: { s1: true, s2: true },
    optionsType: { typeName: 'ChartPopoverOptions', filePath: `${S2_TYPES}/dialogs/chartPopoverSpec.types.ts` },
    builderFile: `${S2_SRC}/chartPopover/chartPopoverUtils.ts`,
  },
  {
    id: 'chart-inspect',
    name: 'Chart Inspect',
    category: 'chart-level',
    appliesTo: ['area', 'bar', 'donut', 'line', 'scatter', 'venn', 'trendline', 'metric-range'],
    description:
      'Hover-triggered inspect/highlight behavior that shows detail without requiring a click, with ' +
      'configurable highlight scope and exclusion of specific data rows.',
    relatedTokens: ['HOVERED_ITEM', 'HOVERED_SERIES'],
    rscSupport: { s1: false, s2: true },
    optionsType: { typeName: 'ChartInspectOptions', filePath: `${S2_TYPES}/dialogs/chartInspectSpec.types.ts` },
    builderFile: `${S2_SRC}/chartInspect/chartInspectUtils.ts`,
  },
  {
    id: 'title',
    name: 'Title',
    category: 'chart-level',
    appliesTo: ['chart'],
    description: "Renders the chart's title text at a configurable position/orientation with size/weight styling.",
    relatedTokens: ['DEFAULT_TITLE_FONT_WEIGHT', 'DEFAULT_FONT_SIZE'],
    rscSupport: { s1: true, s2: true },
    optionsType: { typeName: 'TitleOptions', filePath: `${S2_TYPES}/titleSpec.types.ts` },
    builderFile: `${S2_SRC}/title/titleSpecBuilder.ts`,
  },
];

export function getChartFeatureById(id: string): ChartFeature {
  const feature = CHART_FEATURE_CATALOG.find((f) => f.id === id);
  if (!feature) {
    throw new Error(`Chart feature not found for id=${id}`);
  }
  return feature;
}
