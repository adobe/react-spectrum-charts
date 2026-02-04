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
import { JSXElementConstructor, ReactElement } from 'react';

import { LineOptions } from '@spectrum-charts/vega-spec-builder';

import { ChartPopoverElement, ChartTooltipElement } from '../dialogs';
import { Children, MarkCallback } from '../util.types';
import { MetricRangeElement, TrendlineElement } from './supplemental';

type LineChildElement = ChartTooltipElement | ChartPopoverElement | MetricRangeElement | TrendlineElement;
export interface LineProps
  extends Omit<
    LineOptions,
    'chartPopovers' | 'chartTooltips' | 'hasOnClick' | 'markType' | 'metricRanges' | 'trendlines'
  > {
  children?: Children<LineChildElement>;
  /** Callback that will be run when a point/section is clicked */
  onClick?: MarkCallback;
  /** Callback that will be run when a point/section is hovered */
  onMouseOver?: MarkCallback;
  /** Callback that will be run when a point/section is no longer hovered */
  onMouseOut?: MarkCallback;
}

export type LineElement = ReactElement<LineProps, JSXElementConstructor<LineProps>>;
