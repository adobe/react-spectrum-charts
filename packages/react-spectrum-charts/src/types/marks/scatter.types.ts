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

import { ScatterOptions } from '@spectrum-charts/vega-spec-builder';

import { ChartPopoverElement, ChartTooltipElement } from '../dialogs';
import { Children } from '../util.types';
import { ScatterPathElement, TrendlineElement } from './supplemental';

type ScatterChildElement = ChartPopoverElement | ChartTooltipElement | ScatterPathElement | TrendlineElement;

export interface ScatterProps
  extends Omit<ScatterOptions, 'chartPopovers' | 'chartTooltips' | 'markType' | 'scatterPaths' | 'trendlines'> {
  children?: Children<ScatterChildElement>;
}

export type ScatterElement = ReactElement<ScatterProps, JSXElementConstructor<ScatterProps>>;
