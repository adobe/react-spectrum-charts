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
export const DEFAULT_CATEGORICAL_DIMENSION = 'category';
export const DEFAULT_COLOR = 'series';
export const DEFAULT_CONTINUOUS_DIMENSION = 'datetime';
export const DEFAULT_GRANULARITY = 'day';
export const DEFAULT_LABEL_ALIGN = 'center';
export const DEFAULT_LABEL_FONT_WEIGHT = 'normal';
export const DEFAULT_LINE_TYPES: LineType[] = ['solid', 'dashed', 'dotted', 'dotDash', 'longDash', 'twoDash'];
export const DEFAULT_METRIC = 'value';
export const DEFAULT_SECONDARY_COLOR = 'subSeries';
export const DEFAULT_SYMBOL_SIZE = 100;
export const DEFAULT_SYMBOL_STROKE_WIDTH = 2;
export const DEFAULT_COLOR_SCHEME = 'light';
export const DEFAULT_BACKGROUND_COLOR = 'transparent';
export const DEFAULT_AXIS_ANNOTATION_COLOR = 'gray-600';
export const DEFAULT_AXIS_ANNOTATION_OFFSET = 80;
export const TITLE_FONT_WEIGHT = 'bold';

// vega data table name
export const TABLE = 'table';
export const FILTERED_TABLE = 'filteredTable';

// vega data field names
export const SERIES_ID = 'rscSeriesId';
export const MARK_ID = 'rscMarkId';
export const TRENDLINE_VALUE = 'rscTrendlineValue';
export const STACK_ID = 'rscStackId';

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
