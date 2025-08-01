/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { Scale } from 'vega';

import { FILTERED_TABLE, LINEAR_PADDING } from '@spectrum-charts/constants';

import { TrendlineParentOptions, hasTrendlineWithNormalizedDimension } from './trendlineUtils';

/**
 * Gets all the scales used for trendlines
 * @param options
 * @returns Scale[]
 */
export const getTrendlineScales = (options: TrendlineParentOptions): Scale[] => {
  const { dimension } = options;

  // if there is a trendline that requires a normalized dimension, add the scale
  if (hasTrendlineWithNormalizedDimension(options)) {
    return [
      {
        name: 'xTrendline',
        type: 'linear',
        range: 'width',
        domain: { data: FILTERED_TABLE, fields: [`${dimension}Normalized`] },
        padding: LINEAR_PADDING,
        zero: false,
        nice: false,
      },
    ];
  }
  return [];
};
