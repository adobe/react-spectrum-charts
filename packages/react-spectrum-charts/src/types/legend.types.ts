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

import { LegendOptions } from '@spectrum-charts/vega-spec-builder';

import { ChartPopoverElement } from './dialogs/chartPopover.types';
import { Children } from './util.types';

export interface LegendProps extends Omit<LegendOptions, 'hasOnClick' | 'hasMouseInteraction'> {
  /** callback that will be run when a legend item is selected */
  onClick?: (seriesName: string) => void;
  /** callback that will be run when mousing out of a legend item */
  onMouseOut?: (seriesName: string) => void;
  /** callback that will be run when mousing over a legend item */
  onMouseOver?: (seriesName: string) => void;

  children?: Children<ChartPopoverElement>;
}

export type LegendElement = ReactElement<LegendProps, JSXElementConstructor<LegendProps>>;
