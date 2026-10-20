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
import { JSXElementConstructor, ReactElement } from 'react';

import { LegendOptions } from '@spectrum-charts/vega-spec-builder-s2';

import { ChartPopoverElement } from './dialogs/chartPopover.types.js';
import { Children } from './util.types.js';

export interface LegendProps extends Omit<LegendOptions, 'hasOnClick' | 'hasMouseInteraction'> {
  /** Called with the entry's series name when an entry is clicked. */
  onClick?: (seriesName: string) => void;
  /** Called with the entry's series name when the pointer leaves an entry. */
  onMouseOut?: (seriesName: string) => void;
  /** Called with the entry's series name when the pointer enters an entry. */
  onMouseOver?: (seriesName: string) => void;

  /** `ChartPopover` to open when an entry is clicked. */
  children?: Children<ChartPopoverElement>;
}

export type LegendElement = ReactElement<LegendProps, JSXElementConstructor<LegendProps>>;
