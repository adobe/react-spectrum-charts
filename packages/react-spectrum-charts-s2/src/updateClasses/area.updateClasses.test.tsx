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
import { Axis, ChartInspect, ChartPopover, Legend } from '../components/index.js';
import { Area } from '../lab/index.js';
import { UpdateCases, describeUpdateClasses, updateCaseData } from '../test-utils/index.js';
import { AreaProps } from '../types/index.js';
import { AREA_PROP_UPDATE_CLASSES } from './areaPropUpdateClasses.js';

const cases: UpdateCases<AreaProps> = {
  children: [{ b: { children: <ChartInspect /> } }, { b: { children: <ChartPopover /> } }],
  color: { b: { color: 'region' } },
  dimension: { b: { dimension: 'x' } },
  metric: { b: { metric: 'value2' } },
  metricEnd: { a: { metricStart: 'valueLow', metricEnd: 'value' }, b: { metricStart: 'valueLow', metricEnd: 'valueHigh' } },
  metricStart: { a: { metricStart: 'value', metricEnd: 'valueHigh' }, b: { metricStart: 'valueLow', metricEnd: 'valueHigh' } },
  name: { b: { name: 'renamedArea' } },
  opacity: { b: { opacity: 0.4 } },
  order: { b: { order: 'id' } },
  padding: { b: { padding: 10 } },
  scaleType: { b: { scaleType: 'point' } },
};

describeUpdateClasses<AreaProps>(
  'Area',
  AREA_PROP_UPDATE_CLASSES,
  (props, onVegaViewReady) => (
    <Chart data={updateCaseData} width={400} height={300} animations={false} onVegaViewReady={onVegaViewReady}>
      <Axis position="left" />
      <Axis position="bottom" />
      <Area dimension="datetime" metric="value" color="series" scaleType="linear" {...props} />
      <Legend />
    </Chart>
  ),
  cases
);
