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
import { Axis, ChartInspect, Legend } from '../components/index.js';
import { Scatter } from '../lab/index.js';
import { UpdateCases, describeUpdateClasses, updateCaseData } from '../test-utils/index.js';
import { ScatterProps } from '../types/index.js';
import { SCATTER_PROP_UPDATE_CLASSES } from './scatterPropUpdateClasses.js';

const outlined = { lineWidth: { value: 2 } };

const cases: UpdateCases<ScatterProps> = {
  blend: { b: { blend: 'screen' } },
  children: { b: { children: <ChartInspect /> } },
  clip: { b: { clip: true } },
  color: { b: { color: 'region' } },
  colorScaleType: {
    a: { color: 'value' },
    b: { color: 'value', colorScaleType: 'linear' },
    knownIssue: 'rows keep the stale rscSeriesId from the ordinal spec after rebuilding with a linear color scale',
  },
  dimension: { b: { dimension: 'datetime' } },
  dimensionScaleType: { b: { dimensionScaleType: 'time' } },
  lineType: { a: outlined, b: { ...outlined, lineType: 'series' } },
  lineWidth: { b: outlined },
  metric: { b: { metric: 'value2' } },
  name: { b: { name: 'renamedScatter' } },
  opacity: { b: { opacity: { value: 0.5 } } },
  size: { b: { size: 'value2' } },
  stroke: { a: outlined, b: { ...outlined, stroke: 'region' } },
};

describeUpdateClasses<ScatterProps>(
  'Scatter',
  SCATTER_PROP_UPDATE_CLASSES,
  (props, onVegaViewReady) => (
    <Chart data={updateCaseData} width={400} height={300} animations={false} onVegaViewReady={onVegaViewReady}>
      <Axis position="left" />
      <Axis position="bottom" />
      <Scatter dimension="x" metric="value" color="series" {...props} />
      <Legend />
    </Chart>
  ),
  cases
);
