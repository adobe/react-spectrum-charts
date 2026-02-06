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
import { ChartTooltipOptions } from '../../dialogs/chartTooltipSpec.types';
import { LineType, LineWidth, PartiallyRequired, OpacityFacet } from '../../specUtil.types';
import { SpectrumColor } from '../../spectrumVizColor.types';

export interface MetricRangeOptions {
  /** The color of the metric line and range. If undefined, will default to the color of the series that it represents. */
  color?: SpectrumColor | string;
  /** The line type of the metric line. (dashed, solid, etc..) */
  lineType?: LineType;
  /** The line width of the metric line. */
  lineWidth?: LineWidth;
  /** The opacity of the area around the metric */
  rangeOpacity?: number;
  /** The opacity of the metric line */
  lineOpacity?: OpacityFacet;
  /** The key for the upper range in the data */
  metricEnd: string;
  /** The key for the lower range in the data */
  metricStart: string;
  /** The key for the metric value in the data */
  metric?: string;
  /** Whether the metric range should only be visible when hovering over the parent line */
  displayOnHover?: boolean;
  /** Boolean indicating whether or not the y-axis should expand to include the entire metric range (if necessary). */
  scaleAxisToFit?: boolean;

  // children
  chartTooltips?: ChartTooltipOptions[];
}

type MetricRangeOptionsWithDefaults =
  | 'chartTooltips'
  | 'lineType'
  | 'lineWidth'
  | 'metric'
  | 'metricEnd'
  | 'metricStart'
  | 'rangeOpacity';

export interface MetricRangeSpecOptions extends PartiallyRequired<MetricRangeOptions, MetricRangeOptionsWithDefaults> {
  name: string;
}
