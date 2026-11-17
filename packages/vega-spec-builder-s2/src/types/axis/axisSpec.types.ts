/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { Align, Baseline, FontWeight, NumberValue, ScaleType } from 'vega';

import { ColorScheme } from '../chartSpec.types.js';
import { NumberFormat, Orientation, PartiallyRequired, Position } from '../specUtil.types.js';
import { AxisAnnotationOptions } from './axisAnnotationSpec.types.js';
import { AxisThumbnailOptions } from './axisThumbnailSpec.types.js';
import { ReferenceLineOptions } from './referenceLineSpec.types.js';

export type Granularity = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
/**
 * `center` will set the align to `center` for horizontal axes and the baseline to `middle` for vertical axes.
 *
 * `start` will set the align to `left` for horizontal axes and the baseline to `top` for vertical axes.
 *
 * `end` will set the align to `right` for horizontal axes and the baseline to `bottom` for vertical axes.
 */
export type LabelAlign = 'center' | 'start' | 'end';

export type LabelFormat = 'duration' | 'linear' | 'percentage' | 'time';

export type Label = {
  /** The axis value that this label is anchored to */
  value: string | number;
  /** Sets the display value of the label, if undefined, the value will be the label */
  label?: string;
  /** Alignment of the label, defaults to center */
  align?: LabelAlign;
  /** Font weight of the label, defaults to normal */
  fontWeight?: FontWeight;
};

export type SubLabel = {
  /** The axis value that this sublabel is anchored to */
  value: string | number;
  /** The display value of the sublabel */
  subLabel: string;
  /** Alignment of the label, defaults to center */
  align?: LabelAlign;
  /** Font weight of the label, defaults to normal */
  fontWeight?: FontWeight;
};

export type AxisTooltip = {
  /** The axis value that this tooltip is anchored to */
  value: string | number;
  /** Custom tooltip text; `null` suppresses it. */
  text: string | null;
};

export interface AxisOptions {
  /** Sets the name of the component. */
  name?: string;
  /** Side of the chart the axis is drawn on; bottom and top label the x scale, left and right the y scale. */
  position: Position;
  /** Draws a solid baseline along the axis. Defaults to `false`. */
  baseline?: boolean;
  /** Value on the opposite linear scale where the baseline is drawn; ignored without `baseline` or when that scale is categorical. Defaults to `0`. */
  baselineOffset?: number;
  /** Time unit for the ticks and labels of a time axis; ignored on other axes. Defaults to `day`. */
  granularity?: Granularity;
  /** Draws a gridline across the plot at each tick. Defaults to `false`. */
  grid?: boolean;
  /** Hides the axis labels, including any set with `labels`. Defaults to `false`. */
  hideDefaultLabels?: boolean;
  /** Alignment of each label relative to its tick. Defaults to `center`. */
  labelAlign?: LabelAlign;
  /** Font weight of the axis labels. Defaults to `normal`. */
  labelFontWeight?: FontWeight;
  /** How label values are written: `linear` numbers, `percentage` fractions, `duration` seconds, or `time` dates. Defaults to `linear`. */
  labelFormat?: LabelFormat;
  /** Orientation of the axis labels; `vertical` rotates them 90°. Defaults to `horizontal`. */
  labelOrientation?: Orientation;
  /** Maximum label length in pixels; longer labels end with an ellipsis. Defaults to `180`. */
  labelLimit?: number;
  /** Labels to show instead of the automatic ones, as values or `{ value, label, align, fontWeight }` objects; not supported on time axes. */
  labels?: (Label | string | number)[];
  /** Minimum number of ticks when ticks are spaced automatically. */
  tickCountMinimum?: number;
  /** Maximum number of ticks, not counting the base tick; on time axes it replaces the granularity interval and can repeat labels. */
  tickCountLimit?: number;
  /** Format for `linear` labels: `shortNumber`, `standardNumber`, `currency`, `shortCurrency`, or a d3-format specifier. Defaults to `shortNumber`. */
  numberFormat?: NumberFormat;
  /** Fixed minimum and maximum axis values, such as `[-10, 10]`; only for linear and time scales. */
  range?: [number, number];
  /** Second row of labels under specific values, as `{ value, subLabel, align, fontWeight }` objects; horizontal labels only. */
  subLabels?: SubLabel[];
  /** Draws a tick mark at each label. Defaults to `false`. */
  ticks?: boolean;
  /** Shows a tooltip with the full label value when a label is hovered; not supported on time axes. Defaults to `false`. */
  hasTooltip?: boolean;
  /** Tooltip text for specific values as `{ value, text }` objects; `text: null` hides that value's tooltip. */
  tooltipText?: AxisTooltip[];
  /** Whether the axis has an onClick callback set. */
  hasOnClick?: boolean;
  /** Smallest step between ticks in data units, such as `1` for whole numbers; only for linear scales. */
  tickMinStep?: number;
  /** Axis title; an array of strings makes a multi-line title. */
  title?: string | string[];
  /** Cuts category labels wider than their band on bottom and top band axes. Defaults to `false`. */
  truncateLabels?: boolean;
  /** Limited support: locale for the currency symbol's position, such as `de-DE`; requires `currencyCode` and `numberFormat="currency"` or a `,.Nf` specifier. */
  currencyLocale?: string;
  /** Limited support: currency code, such as `EUR`, that overrides the chart locale's symbol; requires `currencyLocale`. */
  currencyCode?: string;

  // children
  axisAnnotations?: AxisAnnotationOptions[];
  axisThumbnails?: AxisThumbnailOptions[];
  referenceLines?: ReferenceLineOptions[];
}

type AxisOptionsWithDefaults =
  | 'axisAnnotations'
  | 'baseline'
  | 'baselineOffset'
  | 'granularity'
  | 'grid'
  | 'hasOnClick'
  | 'hideDefaultLabels'
  | 'labelAlign'
  | 'labelFontWeight'
  | 'labelOrientation'
  | 'labels'
  | 'numberFormat'
  | 'referenceLines'
  | 'axisThumbnails'
  | 'subLabels'
  | 'ticks';

export interface AxisSpecOptions extends PartiallyRequired<AxisOptions, AxisOptionsWithDefaults> {
  name: string;
  colorScheme: ColorScheme;
  index: number;
  scaleType: ScaleType;
  vegaLabelAlign?: Align;
  vegaLabelBaseline?: Baseline;
  vegaLabelOffset?: NumberValue;
  vegaLabelPadding?: number;
}
