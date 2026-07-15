/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

// prop defaults
export const ANNOTATION_FONT_SIZE = 12;
export const ANNOTATION_FONT_WEIGHT = 'bold';
export const ANNOTATION_PADDING = 4;
export const DEFAULT_AXIS_ANNOTATION_COLOR = 'gray-600';
export const DEFAULT_AXIS_ANNOTATION_OFFSET = 80;
export const DEFAULT_BACKGROUND_COLOR = 'transparent';
export const DEFAULT_BULLET_DIRECTION = 'column';
export const DEFAULT_CATEGORICAL_DIMENSION = 'category';
export const DEFAULT_COLOR = 'series';
export const DEFAULT_COLOR_SCHEME = 'light';
export const DEFAULT_DIMENSION_SCALE_TYPE = 'linear';
export const DEFAULT_FONT_SIZE = 14;
export const DEFAULT_FONT_COLOR = 'gray-800';
export const DEFAULT_GRANULARITY = 'day';
export const DEFAULT_HIDDEN_SERIES = [];
export const DEFAULT_LABEL_ALIGN = 'center';
export const DEFAULT_LABEL_FONT_WEIGHT = 'normal';
export const DEFAULT_LABEL_ORIENTATION = 'horizontal';
export const DEFAULT_LABEL_POSITION = 'top';
export const DEFAULT_LINE_TYPES = ['solid', 'dashed', 'dotted', 'dotDash', 'longDash', 'twoDash'];
export const DEFAULT_LINE_WIDTHS = ['M'];

/** Vega signal name for the chart-size-derived stroke width, driven by a reactive expression. */
export const CHART_SIZE_STROKE_WIDTH = 'rscChartSizeStrokeWidth';
/** Vega signal name for the chart-size-derived font size, driven by a reactive expression. */
export const CHART_SIZE_FONT_SIZE = 'rscChartSizeFontSize';

/** Vega signal name for the chart-size-derived hover point stroke width, driven by a reactive expression. */
export const CHART_SIZE_HOVER_STROKE_WIDTH = 'rscChartSizeHoverStrokeWidth';

/** Vega signal name for the chart-size-derived point size (area in px²), driven by a reactive expression. */
export const CHART_SIZE_POINT_SIZE = 'rscChartSizePointSize';

/** Pixel thresholds at which the size tier transitions from S → M and M → L. */
export const CHART_SIZE_BREAKPOINTS = {
  M: 400,
  L: 800,
} as const;

/** Scale ratios applied to all size-tier properties (S, M, L). M=1 is the base. */
const CHART_SIZE_SCALE_RATIOS = { S: 0.75, M: 1, L: 1.25 } as const;

/** Line stroke widths (px) per chart size tier. Base M = 2px. */
const BASE_STROKE_WIDTH = 2;
export const CHART_SIZE_STROKE_WIDTHS = {
  S: BASE_STROKE_WIDTH * CHART_SIZE_SCALE_RATIOS.S,
  M: BASE_STROKE_WIDTH * CHART_SIZE_SCALE_RATIOS.M,
  L: BASE_STROKE_WIDTH * CHART_SIZE_SCALE_RATIOS.L,
} as const;

/** Hover point stroke widths (px) per chart size tier. Stroke width + 0.5px offset. */
const HOVER_STROKE_OFFSET = 0.5;
export const CHART_SIZE_HOVER_STROKE_WIDTHS = {
  S: CHART_SIZE_STROKE_WIDTHS.S + HOVER_STROKE_OFFSET,
  M: CHART_SIZE_STROKE_WIDTHS.M + HOVER_STROKE_OFFSET,
  L: CHART_SIZE_STROKE_WIDTHS.L + HOVER_STROKE_OFFSET,
} as const;

/** Symbol point sizes (Vega area = diameter²) per chart size tier. Base M = 8px diameter. */
const BASE_POINT_DIAMETER = 8;
export const CHART_SIZE_POINT_SIZES = {
  S: (BASE_POINT_DIAMETER * CHART_SIZE_SCALE_RATIOS.S) ** 2,
  M: (BASE_POINT_DIAMETER * CHART_SIZE_SCALE_RATIOS.M) ** 2,
  L: (BASE_POINT_DIAMETER * CHART_SIZE_SCALE_RATIOS.L) ** 2,
} as const;

/** Vega signal name for the chart-size-derived label gap, driven by a reactive expression. */
export const CHART_SIZE_LABEL_GAP = 'rscChartSizeLabelGap';

/** Minimum vertical gap (px) between co-located labels per chart size tier. Base M = 12px. */
const BASE_LABEL_GAP = 12;
export const CHART_SIZE_LABEL_GAPS = {
  S: BASE_LABEL_GAP * CHART_SIZE_SCALE_RATIOS.S,
  M: BASE_LABEL_GAP * CHART_SIZE_SCALE_RATIOS.M,
  L: BASE_LABEL_GAP * CHART_SIZE_SCALE_RATIOS.L,
} as const;

export const DEFAULT_LINEAR_DIMENSION = 'x';
export const DEFAULT_LOCALE = 'en-US';
export const DEFAULT_METRIC = 'value';
export const DEFAULT_SCALE_TYPE = 'normal';
export const DEFAULT_SCALE_VALUE = 100;
export const DEFAULT_SECONDARY_COLOR = 'subSeries';
export const DEFAULT_SYMBOL_SHAPES = ['rounded-square'];
export const DEFAULT_SYMBOL_SIZE = 100;
export const DEFAULT_SYMBOL_SIZES = ['XS', 'XL'];
export const DEFAULT_SYMBOL_STROKE_WIDTH = 2;
export const DEFAULT_TIME_DIMENSION = 'datetime';
export const DEFAULT_TRANSFORMED_TIME_DIMENSION = `${DEFAULT_TIME_DIMENSION}0`;
export const DEFAULT_TITLE_FONT_WEIGHT = 'bold';
export const DEFAULT_INTERACTION_MODE = 'nearest';

// axis constants
export const MAX_THUMBNAIL_SIZE = 42;
export const MIN_THUMBNAIL_SIZE = 16;
export const THUMBNAIL_OFFSET = 4;

// legend constants
export const DEFAULT_LEGEND_SYMBOL_SIZE = 250;
export const DEFAULT_LEGEND_SYMBOL_WIDTH = 16; // approximate width for square symbols (√250 ≈ 15.8)
export const DEFAULT_LEGEND_COLUMN_PADDING = 20;
export const DEFAULT_LEGEND_LABEL_LIMIT = 184;

// vega data table name
export const TABLE = 'table';
export const FILTERED_TABLE = 'filteredTable';
export const CONTROLLED_HIGHLIGHTED_TABLE = 'controlledHighlightedTable';
/** Single-row data source recording timestamp of the most recent hover target change */
export const HOVER_ANIM_LAST_CHANGE_DATA = 'hoverAnimLastChangeData'; 

// vega data field names
export const DIMENSION_FIELD = 'rscDimensionField';
export const GROUP_DATA = 'rscGroupData';
export const MARK_ID = 'rscMarkId';
export const GROUP_ID = 'rscGroupId';
export const SERIES_ID = 'rscSeriesId';
export const STACK_ID = 'rscStackId';
export const COMPONENT_NAME = 'rscComponentName';
export const TRENDLINE_VALUE = 'rscTrendlineValue';

// signal names
export const HOVERED_ITEM = 'hoveredItem'; // hovered item suffix
export const HOVERED_SERIES = 'hoveredSeries'; // hovered item suffix
export const CONTROLLED_HIGHLIGHTED_ITEM = 'controlledHighlightedItem'; // data point
export const HIGHLIGHTED_GROUP = 'highlightedGroup'; // data point
export const CONTROLLED_HIGHLIGHTED_SERIES = 'controlledHighlightedSeries'; // series
export const SELECTED_ITEM = 'selectedItem'; // data point
export const SELECTED_SERIES = 'selectedSeries'; // series
export const SELECTED_GROUP = 'selectedGroup'; // data point
export const FIRST_RSC_SERIES_ID = 'firstRscSeriesId'; // first series for dual y-axis
export const LAST_RSC_SERIES_ID = 'lastRscSeriesId'; // last series for dual y-axis
export const HOVER_TIMER = 'hoverTimer'; // hover animation timer signal
export const HOVER_TARGETS = 'hoverTargets'; // hover animation target values
export const HOVER_ANIMATING = 'hoverAnimating'; // hover animation state signal
export const HOVER_ACTIVE_TIMER = 'hoverActiveTimer'; // animation timer to run only when hoverAnimating is true
export const HOVER_IDLE_TICKS = 'hoverIdleTicks'; // consecutive ticks since hoverAnimating went false

// scale names
export const COLOR_SCALE = 'color';
export const LINE_TYPE_SCALE = 'lineType';
export const LINEAR_COLOR_SCALE = 'linearColor';
export const LINE_WIDTH_SCALE = 'lineWidth';
export const OPACITY_SCALE = 'opacity';
export const SYMBOL_SHAPE_SCALE = 'symbolShape';
export const SYMBOL_SIZE_SCALE = 'symbolSize';
export const SYMBOL_PATH_WIDTH_SCALE = 'symbolPathWidth';

// encode rules
export const DEFAULT_OPACITY_RULE = { value: 1 };
/** Default rule for stroke width when not hovered */
export const DEFAULT_STROKE_WIDTH_RULE = { signal: CHART_SIZE_STROKE_WIDTH };

// corner radius
export const CORNER_RADIUS = 6;

// padding constants
export const DISCRETE_PADDING = 0.5;
export const PADDING_RATIO = 0.4;
export const LINEAR_PADDING = 0;
export const TRELLIS_PADDING = 0.2;

// hover animation constants
/** Timer signal update interval in ms. Caps timer signal update at ~30fps. */
export const ANIMATION_THROTTLE = 33;
/** Time in ms it takes to animate between hover states (hovered -> unhovered etc.) */
export const ANIMATION_HOVER_SPEED = 100;
/**
 * The resting hover-animation target when nothing is hovered. The fraction is an "emphasis level":
 * 0 = deemphasized (something else hovered), this = neutral (nothing hovered), 1 = emphasized (this hovered).
 * Consumers map the lower half [0, neutral] for deemphasis (e.g. opacity) and the upper half [neutral, 1]
 * for emphasis (e.g. stroke width).
 */
export const HOVER_NEUTRAL_TARGET = 0.5;

// donut constants
/** Calculation for donut radius, subtract 2 pixels to make room for the selection ring */
export const DONUT_RADIUS = '(min(width, height) / 2 - 2)';
/** Min arc angle radians to display a segment label. If the arc angle is less than this, the segment label will be hidden. */
export const DONUT_SEGMENT_LABEL_MIN_ANGLE = 0.3;
/** Min font size for the donut summary metric value */
export const DONUT_SUMMARY_MIN_FONT_SIZE = 28;
/** Max font size for the donut summary metric value */
export const DONUT_SUMMARY_MAX_FONT_SIZE = 60;
/** Ratio of the donut summary matric value font size to the inner donut raidus */
export const DONUT_SUMMARY_FONT_SIZE_RATIO = 0.35;
/** Min inner radius to display the summary metric. If the inner radius is less than this, the summary metric is hidden. */
export const DONUT_SUMMARY_MIN_RADIUS = 45;

// venn constant
export const DEFAULT_VENN_COLOR = 'sets';
/** default key in data for the metric in the venn diagram */
export const DEFAULT_VENN_METRIC = 'size';
/** default key in data for the label inside the venn*/
export const DEFAULT_VENN_LABEL = 'label';

// ratio that each opacity is divded by when hovering or highlighting from legend
// TODO: invert this ratio so we don't have to do 1 / HIGHLIGHT_CONTRAST_RATIO every time
/**
 * @deprecated
 */
export const HIGHLIGHT_CONTRAST_RATIO = 5;
export const FADE_FACTOR = 0.2;

// legend tooltips
export const TOOLTIP_DELAY = 350;

// signal names
// 'backgroundColor' is an undocumented protected signal name used by vega
export const BACKGROUND_COLOR = 'chartBackgroundColor';

// S2 direct label shared style constants (used by LineDirectLabel and ReferenceLine)
export const DIRECT_LABEL_FONT_WEIGHT = 700 as const;
export const DIRECT_LABEL_BACKGROUND_STROKE_WIDTH = 4;

/** Direct label font size constants */
export const DIRECT_LABEL_FONT_SIZE_S = 14;
export const DIRECT_LABEL_FONT_SIZE_M = 16;
export const DIRECT_LABEL_FONT_SIZE_L = 18;

// Offset from anchor mark edge to label boundary.
export const LINE_POINT_ANNOTATION_OFFSET = 3;

// S2 reference line label constants — alias the shared direct label values
export const REFERENCE_LINE_LABEL_FONT_WEIGHT = DIRECT_LABEL_FONT_WEIGHT;
export const REFERENCE_LINE_LABEL_BACKGROUND_STROKE = 'referenceLineLabelBackgroundStroke';
export const REFERENCE_LINE_LABEL_BACKGROUND_STROKE_WIDTH = DIRECT_LABEL_BACKGROUND_STROKE_WIDTH;
export const REFERENCE_LINE_LABEL_OFFSET_FROM_LINE = 9;

export const REFERENCE_LINE_START_CAP_PATH =
  'M5.1 -0.51962C5.5 -0.28868 5.5 0.28867 5.1 0.51961L0.899999 2.94449C0.5 3.17543 -3.01029e-07 2.88675 -2.8084e-07 2.42487L-6.8851e-08 -2.42487C-4.86616e-08 -2.88675 0.5 -3.17543 0.9 -2.94449L5.1 -0.51962Z';
export const REFERENCE_LINE_END_CAP_PATH =
  'M0.30039 -0.51962C-0.0996097 -0.28868 -0.0996091 0.28867 0.300391 0.51961L4.50039 2.94449C4.90039 3.17543 5.40039 2.88675 5.40039 2.42487L5.40039 -2.42487C5.40039 -2.88675 4.90039 -3.17543 4.50039 -2.94449L0.30039 -0.51962Z';

export type ReferenceLineSize = 'XS' | 'S' | 'M' | 'L';

// Stroke widths per size tier for S2 reference lines (design confirmed).
export const REFERENCE_LINE_SIZE_STROKE_WIDTHS: Record<ReferenceLineSize, number> = {
  XS: 1,
  S: 1.5,
  M: 1.5,
  L: 2.5,
};

// Max x-coordinate (right tip) of the start cap path
const REFERENCE_LINE_CAP_RIGHT_TIP: Record<ReferenceLineSize, number> = {
  XS: 3.41667,
  S: 5.5,
  M: 5.5,
  L: 6.83333,
};

// x-anchor for the start cap mark in chart space (left face of cap is at x≈0 in path space).
const REFERENCE_LINE_START_CAP_ANCHOR = 5;
// Gap in px between cap tip and rule stroke's visible left edge.
const REFERENCE_LINE_CAP_RULE_GAP = 1;

// Rule x-start for explicit size — uses REFERENCE_LINE_SIZE_STROKE_WIDTHS per tier.
export const REFERENCE_LINE_RULE_X_START: Record<ReferenceLineSize, number> = {
  XS: REFERENCE_LINE_START_CAP_ANCHOR + REFERENCE_LINE_CAP_RIGHT_TIP.XS + REFERENCE_LINE_CAP_RULE_GAP + REFERENCE_LINE_SIZE_STROKE_WIDTHS.XS / 2, // 9.91667
  S: REFERENCE_LINE_START_CAP_ANCHOR + REFERENCE_LINE_CAP_RIGHT_TIP.S + REFERENCE_LINE_CAP_RULE_GAP + REFERENCE_LINE_SIZE_STROKE_WIDTHS.S / 2,   // 12.25
  M: REFERENCE_LINE_START_CAP_ANCHOR + REFERENCE_LINE_CAP_RIGHT_TIP.M + REFERENCE_LINE_CAP_RULE_GAP + REFERENCE_LINE_SIZE_STROKE_WIDTHS.M / 2,   // 12.25
  L: REFERENCE_LINE_START_CAP_ANCHOR + REFERENCE_LINE_CAP_RIGHT_TIP.L + REFERENCE_LINE_CAP_RULE_GAP + REFERENCE_LINE_SIZE_STROKE_WIDTHS.L / 2,   // 14.08333
};

// Rule x-start for auto mode — uses CHART_SIZE_STROKE_WIDTH signal values (S=1.5px, M=2px, L=3px)
// so the 1px gap is correct when stroke width reacts to chart width.
export const REFERENCE_LINE_AUTO_RULE_X_START = {
  S: REFERENCE_LINE_START_CAP_ANCHOR + REFERENCE_LINE_CAP_RIGHT_TIP.S + REFERENCE_LINE_CAP_RULE_GAP + 1.5 / 2, // 12.25
  M: REFERENCE_LINE_START_CAP_ANCHOR + REFERENCE_LINE_CAP_RIGHT_TIP.M + REFERENCE_LINE_CAP_RULE_GAP + 1,   // strokeWidth(2)/2 = 1, total 12.5
  L: REFERENCE_LINE_START_CAP_ANCHOR + REFERENCE_LINE_CAP_RIGHT_TIP.L + REFERENCE_LINE_CAP_RULE_GAP + 3 / 2,   // 14.33333
};

// Right face x in path space for each end cap. S and M share paths.
const REFERENCE_LINE_END_CAP_RIGHT_FACE_X: Record<ReferenceLineSize, number> = {
  XS: 3.34961,
  S: 5.40039,
  M: 5.40039,
  L: 6.7002,
};

// Desired clip past the right chart boundary for XS size.
const REFERENCE_LINE_END_CAP_CLIP = 0.4;

// Fixed x-anchor offset from `width` for S/M/L end caps — mirrors REFERENCE_LINE_START_CAP_ANCHOR.
// All three sizes share the same origin; larger caps grow further into the clip zone on the right.
const REFERENCE_LINE_END_CAP_ANCHOR = REFERENCE_LINE_END_CAP_RIGHT_FACE_X.S - REFERENCE_LINE_END_CAP_CLIP; // 5.00039

export const REFERENCE_LINE_END_CAP_ANCHOR_OFFSET: Record<ReferenceLineSize, number> = {
  XS: REFERENCE_LINE_END_CAP_RIGHT_FACE_X.XS - REFERENCE_LINE_END_CAP_CLIP, // 2.94961
  S: REFERENCE_LINE_END_CAP_ANCHOR,   // 5.00039
  M: REFERENCE_LINE_END_CAP_ANCHOR,   // 5.00039
  L: REFERENCE_LINE_END_CAP_ANCHOR,   // 5.00039
};

// Rule x2 offset for explicit size = end cap anchor + gap + strokeWidth/2.
// S and M produce the same x2; L produces a shorter line (larger SW reduces x2 further left).
export const REFERENCE_LINE_RULE_X2_OFFSET: Record<ReferenceLineSize, number> = {
  XS: REFERENCE_LINE_END_CAP_ANCHOR_OFFSET.XS + REFERENCE_LINE_CAP_RULE_GAP + REFERENCE_LINE_SIZE_STROKE_WIDTHS.XS / 2, // 4.44961
  S: REFERENCE_LINE_END_CAP_ANCHOR + REFERENCE_LINE_CAP_RULE_GAP + REFERENCE_LINE_SIZE_STROKE_WIDTHS.S / 2,   // 6.75039
  M: REFERENCE_LINE_END_CAP_ANCHOR + REFERENCE_LINE_CAP_RULE_GAP + REFERENCE_LINE_SIZE_STROKE_WIDTHS.M / 2,   // 6.75039
  L: REFERENCE_LINE_END_CAP_ANCHOR + REFERENCE_LINE_CAP_RULE_GAP + REFERENCE_LINE_SIZE_STROKE_WIDTHS.L / 2,   // 7.25039
};

// Rule x2 offset for auto mode — uses CHART_SIZE_STROKE_WIDTH signal values (1.5/2/3px).
export const REFERENCE_LINE_AUTO_RULE_X2_OFFSET = {
  S: REFERENCE_LINE_END_CAP_ANCHOR + REFERENCE_LINE_CAP_RULE_GAP + 0.75, // 6.75039
  M: REFERENCE_LINE_END_CAP_ANCHOR + REFERENCE_LINE_CAP_RULE_GAP + 1,    // 7.00039
  L: REFERENCE_LINE_END_CAP_ANCHOR + REFERENCE_LINE_CAP_RULE_GAP + 1.5,  // 7.50039
};

// Caret SVG paths per size tier, y-shifted to center on reference line.
// S and M share the same path geometry.
export const REFERENCE_LINE_START_CAP_PATHS: Record<ReferenceLineSize, string> = {
  XS: 'M3.15 -0.34641C3.41667 -0.19245 3.41667 0.19245 3.15 0.34641L0.6 1.81866C0.333334 1.97262 -1.87092e-07 1.78017 -1.73632e-07 1.47225L-4.49247e-08 -1.47224C-3.14651e-08 -1.78016 0.333333 -1.97261 0.6 -1.81865L3.15 -0.34641Z',
  S: REFERENCE_LINE_START_CAP_PATH,
  M: REFERENCE_LINE_START_CAP_PATH,
  L: 'M6.3 -0.69283C6.83333 -0.38491 6.83333 0.38490 6.3 0.69282L1.2 3.63730C0.666667 3.94522 -3.74184e-07 3.56032 -3.47265e-07 2.94448L-8.98494e-08 -2.94449C-6.29301e-08 -3.56033 0.666666 -3.94523 1.2 -3.63731L6.3 -0.69283Z',
};

export const REFERENCE_LINE_END_CAP_PATHS: Record<ReferenceLineSize, string> = {
  XS: 'M0.19961 -0.34641C-0.067057 -0.19245 -0.0670574 0.19245 0.199609 0.34641L2.74961 1.81866C3.01628 1.97262 3.34961 1.78017 3.34961 1.47225L3.34961 -1.47224C3.34961 -1.78016 3.01628 -1.97261 2.74961 -1.81865L0.19961 -0.34641Z',
  S: REFERENCE_LINE_END_CAP_PATH,
  M: REFERENCE_LINE_END_CAP_PATH,
  L: 'M0.400196 -0.69283C-0.133137 -0.38491 -0.133138 0.38490 0.400195 0.69282L5.50019 3.63730C6.03353 3.94522 6.7002 3.56032 6.7002 2.94448L6.7002 -2.94449C6.7002 -3.56033 6.03353 -3.94523 5.5002 -3.63731L0.400196 -0.69283Z',
};

// Secondary reference line stroke color per size tier.
// XS uses gray-600 for sparkline contexts; S/M/L match the primary gray-800.
// Label color matches the stroke color for each tier.
export const REFERENCE_LINE_SECONDARY_COLORS: Record<ReferenceLineSize, string> = {
  XS: 'gray-600',
  S: DEFAULT_FONT_COLOR,
  M: DEFAULT_FONT_COLOR,
  L: DEFAULT_FONT_COLOR,
};

// Secondary reference line stroke width — always 1px regardless of size.
export const REFERENCE_LINE_SECONDARY_STROKE_WIDTH = 1;

// time constants
export const MS_PER_DAY = 86400000;
export const TIME = 'time';

// mark constants
export enum INTERACTION_MODE {
  NEAREST = 'nearest',
  ITEM = 'item',
  DIMENSION = 'dimension',
}
export const HOVER_SIZE = 3000;
export const HOVER_SHAPE_COUNT = 3;
export const HOVER_SHAPE = 'diamond';

// tooltip constants
export const DIMENSION_HOVER_AREA = 'dimensionHoverArea';

// Hover mark name suffixes — used both to construct mark names in builders and to identify
// the first top-level hover mark when inserting 'front' reference lines.
// Notes:
//   - Bar: _dimensionHoverArea excluded — pushed BEFORE bar rect marks, so inserting before
//     it would place the reference line behind all bars.
//   - Scatter: hover marks are nested inside the group mark, not top-level, so no suffix needed.
export const HOVER_RULE = '_hoverRule';         // line hover rule mark
export const SELECT_BORDER = '_selectBorder';   // area selection border mark (with popover)
export const AREA_HOVER_RULE = '_rule';         // area hover rule mark (dimension interaction)
export const AREA_HOVER_POINT = '_point';       // area hover point mark

//SVG Paths
export const ROUNDED_SQUARE_PATH =
  'M -0.55 -1 h 1.1 a 0.45 0.45 0 0 1 0.45 0.45 v 1.1 a 0.45 0.45 0 0 1 -0.45 0.45 h -1.1 a 0.45 0.45 0 0 1 -0.45 -0.45 v -1.1 a 0.45 0.45 0 0 1 0.45 -0.45 z';

export const DATE_PATH =
  'M 0.88 -0.66 H 0.605 V -0.825 a 0.055 0.055 90 0 0 -0.055 -0.055 h -0.11 a 0.055 0.055 90 0 0 -0.055 0.055 V -0.66 H -0.385 V -0.825 A 0.055 0.055 90 0 0 -0.44 -0.88 h -0.11 a 0.055 0.055 90 0 0 -0.055 0.055 V -0.66 H -0.88 a 0.055 0.055 90 0 0 -0.055 0.055 v 1.43 a 0.055 0.055 90 0 0 0.055 0.055 h 1.76 a 0.055 0.055 90 0 0 0.055 -0.055 V -0.605 A 0.055 0.055 90 0 0 0.88 -0.66 Z M 0.825 0.77 H -0.825 V -0.55 H -0.605 v 0.055 a 0.055 0.055 90 0 0 0.055 0.055 h 0.11 A 0.055 0.055 90 0 0 -0.385 -0.495 V -0.55 h 0.77 v 0.055 a 0.055 0.055 90 0 0 0.055 0.055 h 0.11 a 0.055 0.055 90 0 0 0.055 -0.055 V -0.55 h 0.22 Z M 0.165 0.165 v 0.33 a 0.055 0.055 90 0 0 0.055 0.055 h 0.33 a 0.055 0.055 90 0 0 0.055 -0.055 v -0.33 a 0.055 0.055 90 0 0 -0.055 -0.055 h -0.33 a 0.055 0.055 90 0 0 -0.055 0.055';

export const ANNOTATION_SINGLE_ICON_SVG =
  'M 6.86 -8.32 H -7.79 a 0.53 0.53 90 0 0 -0.53 0.53 v 14.65 a 0.53 0.53 90 0 0 0.53 0.53 H 1.72 V 2.9 a 1.06 1.06 90 0 1 1.06 -1.06 h 4.49 V -7.79 A 0.53 0.53 90 0 0 6.86 -8.32 Z M -0.4 2.9 H -5.02 V 1.72 H -0.4 Z m 4.49 -3.3 H -5.02 V -1.58 h 8.98 Z m 0 -3.3 H -5.02 V -5.02 h 8.98 Z M 2.9 7.39 V 3.43 a 0.53 0.53 90 0 1 0.53 -0.53 H 7.39 a 0.66 0.66 90 0 1 -0.13 0.53 l -3.83 3.83 A 0.66 0.66 90 0 1 2.9 7.39 Z';

export const ANNOTATION_RANGED_ICON_SVG =
  'M 3.8 7.6 V 4.3 A 0.5 0.5 90 0 1 4.3 3.8 h 3.3 a 0.6 0.6 90 0 1 -0.1 0.4 L 4.2 7.5 a 0.6 0.6 90 0 1 -0.4 0.1 Z m 3.7 -15.1 a 0.5 0.5 90 0 0 -0.4 -0.2 H -7.1 a 0.5 0.5 90 0 0 -0.5 0.5 v 14.2 a 0.5 0.5 90 0 0 0.5 0.5 H 2.5 V 3.6 a 1.1 1.1 90 0 1 1.1 -1.1 H 7.6 V -7.1 A 0.5 0.5 90 0 0 7.5 -7.5 Z M 5.7 -3.3 l -1.9 1.9 a 0.2 0.2 90 0 1 -0.1 0 a 0.2 0.2 90 0 1 -0.1 0 a 0.2 0.2 90 0 1 -0.1 -0 a 0.2 0.2 90 0 1 -0.1 -0 a 0.2 0.2 90 0 1 -0 -0.1 a 0.2 0.2 90 0 1 -0 -0.1 v -1 L -3.4 -2.6 l -0 1 a 0.2 0.2 90 0 1 -0.1 0.2 a 0.2 0.2 90 0 1 -0.2 0.1 a 0.2 0.2 90 0 1 -0.1 -0 a 0.2 0.2 90 0 1 -0.1 -0 L -5.7 -3.3 a 0.2 0.2 90 0 1 0 -0.2 L -3.8 -5.4 a 0.2 0.2 90 0 1 0.2 -0.1 a 0.2 0.2 90 0 1 0.2 0.1 a 0.2 0.2 90 0 1 0 0.1 a 0.2 0.2 90 0 1 0 0.1 l 0 1 l 6.8 0 V -5.3 a 0.2 0.2 90 0 1 0 -0.1 a 0.2 0.2 90 0 1 0 -0.1 a 0.2 0.2 90 0 1 0.3 -0 l 1.9 1.9 a 0.2 0.2 90 0 1 0 0.2 Z';

export const SENTIMENT_NEGATIVE_PATH =
  'M 0 -1 A 1 1 90 1 0 1 0 A 1 1 90 0 0 0 -1 Z M 0.3421 -0.598 A 0.2149 0.2149 90 0 1 0.5296 -0.3636 A 0.2149 0.2149 90 0 1 0.3421 -0.1292 A 0.2149 0.2149 90 0 1 0.1546 -0.3636 A 0.2149 0.2149 90 0 1 0.3421 -0.598 Z M -0.3522 -0.5916 A 0.2148 0.2148 90 0 1 -0.1647 -0.3574 A 0.2149 0.2149 90 0 1 -0.3522 -0.123 A 0.2149 0.2149 90 0 1 -0.5397 -0.3574 A 0.2148 0.2148 90 0 1 -0.3522 -0.5916 Z M 0.5548 0.4151 L 0.4959 0.4449 A 0.0625 0.0625 90 0 1 0.4257 0.4354 C 0.4049 0.4166 0.3802 0.3942 0.3739 0.3898 A 0.6554 0.6554 90 0 0 0.0026 0.2813 A 0.6546 0.6546 90 0 0 -0.3724 0.3919 C -0.3802 0.3974 -0.403 0.4184 -0.4224 0.4368 A 0.0625 0.0625 90 0 1 -0.4933 0.4468 L -0.5513 0.4174 A 0.0625 0.0625 90 0 1 -0.5694 0.3197 C -0.5549 0.3036 -0.5418 0.2895 -0.5366 0.2848 A 0.813 0.813 90 0 1 0.0026 0.0938 A 0.8106 0.8106 90 0 1 0.5481 0.2906 C 0.5511 0.2933 0.5611 0.3043 0.5731 0.3176 A 0.0625 0.0625 90 0 1 0.5548 0.4151 Z';

export const SENTIMENT_NEUTRAL_PATH =
  'M 0 -1 A 1 1 90 1 0 1 0 A 1 1 90 0 0 0 -1 Z M -0.3522 -0.4666 A 0.2149 0.2149 90 0 1 -0.1647 -0.2322 A 0.2149 0.2149 90 0 1 -0.3522 0.0021 A 0.2149 0.2149 90 0 1 -0.5397 -0.2322 A 0.2149 0.2149 90 0 1 -0.3522 -0.4666 Z M 0.325 0.5 H -0.325 A 0.05 0.05 90 0 1 -0.375 0.45 V 0.425 A 0.05 0.05 90 0 1 -0.325 0.375 H 0.325 A 0.05 0.05 90 0 1 0.375 0.425 V 0.45 A 0.05 0.05 90 0 1 0.325 0.5 Z M 0.3421 -0.0042 A 0.2149 0.2149 90 0 1 0.1546 -0.2386 A 0.2149 0.2149 90 0 1 0.3421 -0.473 A 0.2149 0.2149 90 0 1 0.5296 -0.2386 A 0.2149 0.2149 90 0 1 0.3421 -0.0043 Z';

export const SENTIMENT_POSITIVE_PATH =
  'M 0 -1 A 1 1 90 1 0 1 0 A 1 1 90 0 0 0 -1 Z M -0.3522 -0.5916 A 0.215 0.215 90 0 1 -0.1647 -0.3572 A 0.215 0.215 90 0 1 -0.3522 -0.1229 A 0.215 0.215 90 0 1 -0.5397 -0.3572 A 0.2149 0.2149 90 0 1 -0.3522 -0.5916 Z M 0.3421 -0.598 A 0.215 0.215 90 0 1 0.5296 -0.3635 A 0.2149 0.2149 90 0 1 0.3421 -0.1291 A 0.2149 0.2149 90 0 1 0.1546 -0.3635 A 0.215 0.215 90 0 1 0.3421 -0.598 Z M 0 0.6275 A 0.6161 0.6161 90 0 1 -0.625 0.1187 H 0.625 A 0.6161 0.6161 90 0 1 0 0.6275 Z';

// Derived from @react-spectrum/s2/icons/VisibilityOff (20x20 viewBox), re-centered on origin and
// scaled down 8.5x to match this file's ~[-1, 1] symbol-path convention (a smaller divisor than
// sibling shapes, since this icon's thin linework would read as too faint otherwise). Legend
// symbol shape for toggled-off/hidden series entries in S2.
export const VISIBILITY_OFF_PATH =
  'M-0.004 0.7862 C-0.5753 0.7862 -1.0882 0.2699 -1.0882 0.0261 c0 -0.1082 0.1016 -0.2776 0.2589 -0.4315 c0.0347 -0.0339 0.0906 -0.0334 0.1247 0.0013 c0.0341 0.0348 0.0335 0.0906 -0.0013 0.1248 c-0.1541 0.1507 -0.2059 0.2729 -0.2059 0.3054 c0 0.1346 0.4291 0.5835 0.9078 0.5835 c0.0711 0 0.1448 -0.0099 0.2192 -0.0295 c0.0468 -0.012 0.0953 0.0156 0.1079 0.0628 c0.0125 0.0471 -0.0158 0.0953 -0.0628 0.1079 c-0.0889 0.0235 -0.1779 0.0353 -0.2642 0.0353 M0.7769 0.4521 c-0.024 0 -0.0478 -0.0096 -0.0652 -0.0287 c-0.0329 -0.036 -0.0304 -0.0918 0.0056 -0.1247 c0.1341 -0.1226 0.1944 -0.2332 0.1944 -0.2726 c0 -0.0944 -0.224 -0.3855 -0.5306 -0.5355 c-0.1188 -0.06 -0.2506 -0.0922 -0.3824 -0.0939 c-0.0729 0 -0.1487 0.0111 -0.2241 0.0329 c-0.0471 0.0128 -0.0958 -0.0136 -0.1093 -0.0604 c-0.0135 -0.0468 0.0135 -0.0958 0.0604 -0.1093 c0.0912 -0.0265 0.1835 -0.0398 0.2742 -0.0398 c0.1595 0.002 0.3181 0.0408 0.4596 0.1122 c0.3226 0.158 0.6286 0.4953 0.6286 0.6936 c0 0.1081 -0.0941 0.2587 -0.2518 0.4028 c-0.0169 0.0155 -0.0384 0.0232 -0.0595 0.0232 M1.0329 0.9107 l-0.6798 -0.6798 c0.024 -0.0348 0.0421 -0.0724 0.0541 -0.1113 c0.0245 -0.0805 -0.0541 -0.1471 -0.1318 -0.1148 c-0.0582 0.0242 -0.1113 0.0165 -0.1388 0.0095 L-0.0249 -0.1471 c-0.0111 -0.0435 -0.0093 -0.0876 0.0047 -0.1276 c0.0262 -0.0749 -0.0556 -0.1482 -0.1294 -0.1188 q-0.0416 0.0165 -0.0796 0.0421 L-0.9082 -1.0305 c-0.0345 -0.0345 -0.0902 -0.0345 -0.1247 0 s-0.0345 0.0904 0 0.1247 l1.9412 1.9412 c0.0172 0.0173 0.0398 0.0259 0.0624 0.0259 s0.0452 -0.0086 0.0624 -0.0259 c0.0345 -0.0344 0.0345 -0.0902 0 -0.1247 M-0.2112 0.3527 c0.0818 0.0511 0.1792 0.0691 0.2728 0.0569 L-0.4068 -0.0587 c-0.0198 0.1547 0.0454 0.3176 0.1956 0.4114';
