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
import { LineType } from 'types';

// prop defaults
export const ANNOTATION_FONT_SIZE = 12;
export const ANNOTATION_FONT_WEIGHT = 'bold';
export const DEFAULT_AXIS_ANNOTATION_COLOR = 'gray-600';
export const DEFAULT_AXIS_ANNOTATION_OFFSET = 80;
export const DEFAULT_BACKGROUND_COLOR = 'transparent';
export const DEFAULT_CATEGORICAL_DIMENSION = 'category';
export const DEFAULT_COLOR = 'series';
export const DEFAULT_COLOR_SCHEME = 'light';
export const DEFAULT_DIMENSION_SCALE_TYPE = 'linear';
export const DEFAULT_GRANULARITY = 'day';
export const DEFAULT_LABEL_ALIGN = 'center';
export const DEFAULT_LABEL_FONT_WEIGHT = 'normal';
export const DEFAULT_LABEL_ORIENTATION = 'horizontal';
export const DEFAULT_LINE_TYPES: LineType[] = ['solid', 'dashed', 'dotted', 'dotDash', 'longDash', 'twoDash'];
export const DEFAULT_LINEAR_DIMENSION = 'x';
export const DEFAULT_LOCALE = 'en-US';
export const DEFAULT_METRIC = 'value';
export const DEFAULT_SECONDARY_COLOR = 'subSeries';
export const DEFAULT_SYMBOL_SIZE = 100;
export const DEFAULT_SYMBOL_STROKE_WIDTH = 2;
export const DEFAULT_TIME_DIMENSION = 'datetime';
export const DEFAULT_TRANSFORMED_TIME_DIMENSION = `${DEFAULT_TIME_DIMENSION}0`;
export const DEFAULT_TITLE_FONT_WEIGHT = 'bold';

// vega data table name
export const TABLE = 'table';
export const FILTERED_TABLE = 'filteredTable';

// big number aspect ratio
export const BIG_NUMBER_ASPECT_RATIO = 16 / 9

// vega data field names
export const SERIES_ID = 'rscSeriesId';
export const MARK_ID = 'rscMarkId';
export const TRENDLINE_VALUE = 'rscTrendlineValue';
export const STACK_ID = 'rscStackId';

// signal names
export const HIGHLIGHTED_ITEM = 'highlightedItem'; // data point
export const HIGHLIGHTED_SERIES = 'highlightedSeries'; // series
export const SELECTED_ITEM = 'selectedItem'; // data point
export const SELECTED_SERIES = 'selectedSeries'; // series

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
export const LINEAR_PADDING = 32;
export const TRELLIS_PADDING = 0.2;

// ratio that each opacity is divded by when hovering or highlighting from legend
export const HIGHLIGHT_CONTRAST_RATIO = 5;

// legend tooltips
export const LEGEND_TOOLTIP_DELAY = 350;

// signal names
// 'backgroundColor' is an undocumented protected signal name used by vega
export const BACKGROUND_COLOR = 'chartBackgroundColor';

// time constants
export const MS_PER_DAY = 86400000;
