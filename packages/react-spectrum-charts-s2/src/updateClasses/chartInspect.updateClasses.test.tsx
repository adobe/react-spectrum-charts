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
import { Axis, Bar, ChartInspect, Legend, Line } from '../components/index.js';
import { UpdateCases, describeUpdateClasses, updateCaseData } from '../test-utils/index.js';
import { ChartInspectProps } from '../types/index.js';
import { CHART_INSPECT_PROP_UPDATE_CLASSES } from './chartInspectPropUpdateClasses.js';

const cases: UpdateCases<ChartInspectProps> = {
  children: { b: { children: () => 'Details' } },
  excludeDataKeys: { b: { excludeDataKeys: ['isStatic'] } },
  highlightBy: { b: { highlightBy: 'series' } },
  // targets only apply to bars
  targets: { a: { targets: ['item'] }, b: { targets: ['dimensionArea'] } },
};

describeUpdateClasses<ChartInspectProps>(
  'ChartInspect',
  CHART_INSPECT_PROP_UPDATE_CLASSES,
  (props, onVegaViewReady) => (
    <Chart data={updateCaseData} width={400} height={300} animations={false} onVegaViewReady={onVegaViewReady}>
      <Axis position="left" />
      <Axis position="bottom" />
      {'targets' in props ? (
        <Bar dimension="category" metric="value" color="series">
          <ChartInspect {...props} />
        </Bar>
      ) : (
        <Line dimension="datetime" metric="value" color="series" scaleType="linear">
          <ChartInspect {...props} />
        </Line>
      )}
      <Legend />
    </Chart>
  ),
  cases
);
