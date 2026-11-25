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

/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC } from 'react';

import { DEFAULT_METRIC } from '@spectrum-charts/core-s2/constants';

import { HistogramProps } from '../../../types/index.js';

// destructure props here and set defaults so that storybook can pick them up
/**
 * Renders the distribution of a numeric field as bars of binned counts on a continuous x axis.
 * @experimental
 */
const Histogram: FC<HistogramProps> = ({
  binAnchor,
  binCount,
  binEdges,
  binSize,
  cellColors = 'sequentialCerulean9',
  cellLegend = true,
  cellLegendTitle,
  children,
  color = { value: 'categorical-100' },
  cumulative = false,
  densityCurve = false,
  drawInEffect = 'grow',
  extent,
  layout = 'stacked',
  metric = DEFAULT_METRIC,
  name,
  onClick,
  orientation = 'vertical',
  weight,
  yBinCount,
  yBinSize,
  yExtent,
  yMetric,
  yValue = 'count',
}) => {
  return null;
};

// displayName is used to validate the component type in the spec builder
Histogram.displayName = 'Histogram';

export { Histogram };
