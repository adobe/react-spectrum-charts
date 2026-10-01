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
import { NumericValueRef, ProductionRule } from 'vega';

import { FADE_FACTOR, LAST_RSC_SERIES_ID, SERIES_ID } from '@spectrum-charts/constants';

import { getDeemphasisRamp, getHoverFractionSignal } from '../marks/hoverAnimationUtils';
import { getDualAxisScaleNames } from '../scale/scaleUtils';
import { LineMarkOptions, isDualMetricAxis } from './lineUtils';

/**
 * Gets the Y encoding for line marks with dual metric axis support
 * @param lineMarkOptions - Line mark options including metricAxis and dualMetricAxis
 * @param metric - The metric field name
 * @returns Y encoding with conditional scale selection for dual metric axis
 */
export const getLineYEncoding = (lineMarkOptions: LineMarkOptions, metric: string): ProductionRule<NumericValueRef> => {
  const { metricAxis } = lineMarkOptions;

  if (isDualMetricAxis(lineMarkOptions)) {
    const baseScaleName = metricAxis || 'yLinear';
    const scaleNames = getDualAxisScaleNames(baseScaleName);

    return [
      {
        test: `datum.${SERIES_ID} === ${LAST_RSC_SERIES_ID}`,
        scale: scaleNames.secondaryScale,
        field: metric,
      },
      {
        scale: scaleNames.primaryScale,
        field: metric,
      },
    ];
  }

  return [{ scale: metricAxis || 'yLinear', field: metric }];
};

export const getLineDeemphasisOpacitySignal = (name: string): ProductionRule<NumericValueRef> => {
  const ramp = getDeemphasisRamp(getHoverFractionSignal(name));
  return {
    signal: `${FADE_FACTOR} + (1 - ${FADE_FACTOR}) * ${ramp}`,
  };
};
