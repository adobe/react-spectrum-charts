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
export const DEFAULT_CATEGORICAL_DIMENSION = 'category';
export const DEFAULT_COLOR = 'series';
export const DEFAULT_COLOR_SCHEME = 'light';
export const DEFAULT_DIMENSION_SCALE_TYPE = 'linear';
export const DEFAULT_FONT_SIZE = 14;
export const DEFAULT_FONT_COLOR = 'gray-800';
export const DEFAULT_GRANULARITY = 'day';
export const DEFAULT_LABEL_ALIGN = 'center';
export const DEFAULT_LABEL_FONT_WEIGHT = 'normal';
export const DEFAULT_LABEL_ORIENTATION = 'horizontal';
export const DEFAULT_LINE_TYPES = ['solid', 'dashed', 'dotted', 'dotDash', 'longDash', 'twoDash'];
export const DEFAULT_LINEAR_DIMENSION = 'x';
export const DEFAULT_LOCALE = 'en-US';
export const DEFAULT_METRIC = 'value';
export const DEFAULT_SECONDARY_COLOR = 'subSeries';
export const DEFAULT_SYMBOL_SIZE = 100;
export const DEFAULT_SYMBOL_STROKE_WIDTH = 2;
export const DEFAULT_TIME_DIMENSION = 'datetime';
export const DEFAULT_TRANSFORMED_TIME_DIMENSION = `${DEFAULT_TIME_DIMENSION}0`;
export const DEFAULT_TITLE_FONT_WEIGHT = 'bold';
export const DEFAULT_INTERACTION_MODE = 'nearest';

// vega data table name
export const TABLE = 'table';
export const FILTERED_TABLE = 'filteredTable';

// vega data field names
export const GROUP_DATA = 'rscGroupData';
export const MARK_ID = 'rscMarkId';
export const SERIES_ID = 'rscSeriesId';
export const STACK_ID = 'rscStackId';
export const COMPONENT_NAME = 'rscComponentName';
export const TRENDLINE_VALUE = 'rscTrendlineValue';

// signal names
export const HIGHLIGHTED_ITEM = 'highlightedItem'; // data point
export const HIGHLIGHTED_GROUP = 'highlightedGroup'; // data point
export const HIGHLIGHTED_SERIES = 'highlightedSeries'; // series
export const SELECTED_ITEM = 'selectedItem'; // data point
export const SELECTED_SERIES = 'selectedSeries'; // series
export const SELECTED_GROUP = 'selectedGroup'; // data point

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

// corner radius
export const CORNER_RADIUS = 6;

// padding constants
export const DISCRETE_PADDING = 0.5;
export const PADDING_RATIO = 0.4;
export const LINEAR_PADDING = 0;
export const TRELLIS_PADDING = 0.2;

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

// ratio that each opacity is divded by when hovering or highlighting from legend
export const HIGHLIGHT_CONTRAST_RATIO = 5;

// legend tooltips
export const LEGEND_TOOLTIP_DELAY = 350;

// signal names
// 'backgroundColor' is an undocumented protected signal name used by vega
export const BACKGROUND_COLOR = 'chartBackgroundColor';

// time constants
export const MS_PER_DAY = 86400000;
export const TIME = 'time';

// mark constants
export enum INTERACTION_MODE {
	NEAREST = 'nearest',
	ITEM = 'item',
}
export const HOVER_SIZE = 3000;
export const HOVER_SHAPE_COUNT = 3;
export const HOVER_SHAPE = 'diamond';

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
