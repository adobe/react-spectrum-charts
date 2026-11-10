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
import { Chart } from '../Chart.js';
import { Axis, ChartInspect } from '../components/index.js';
import { Scatter, Trendline } from '../lab/index.js';
import { UpdateCases, describeUpdateClasses, updateCaseData } from '../test-utils/index.js';
import { TrendlineProps } from '../types/index.js';
import { TRENDLINE_PROP_UPDATE_CLASSES } from './trendlinePropUpdateClasses.js';

const inspect = <ChartInspect />;
const movingAverage = { method: 'movingAverage-2' } as const;

const cases: UpdateCases<TrendlineProps> = {
  children: { b: { children: inspect } },
  color: { b: { color: 'gray-500' } },
  dimensionExtent: { b: { dimensionExtent: [0, 40] } },
  dimensionRange: { b: { dimensionRange: [15, null] } },
  displayOnHover: { a: { children: inspect }, b: { children: inspect, displayOnHover: true } },
  excludeDataKeys: { b: { excludeDataKeys: ['isStatic'] } },
  hidePartialWindows: { a: movingAverage, b: { ...movingAverage, hidePartialWindows: true } },
  highlightRawPoint: { a: { children: inspect }, b: { children: inspect, highlightRawPoint: true } },
  lineType: { b: { lineType: 'dotted' } },
  lineWidth: { b: { lineWidth: 'XL' } },
  method: { b: { method: 'average' } },
  opacity: { b: { opacity: 0.5 } },
  orientation: { b: { orientation: 'vertical' } },
};

describeUpdateClasses<TrendlineProps>(
  'Trendline',
  TRENDLINE_PROP_UPDATE_CLASSES,
  (props, onVegaViewReady) => (
    <Chart data={updateCaseData} width={400} height={300} animations={false} onVegaViewReady={onVegaViewReady}>
      <Axis position="left" />
      <Axis position="bottom" />
      <Scatter dimension="x" metric="value" color="series">
        <Trendline {...props} />
      </Scatter>
    </Chart>
  ),
  cases
);
