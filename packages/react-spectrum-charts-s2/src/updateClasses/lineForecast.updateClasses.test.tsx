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
import { Axis, Legend, Line, LineForecast } from '../components/index.js';
import { UpdateCases, describeUpdateClasses, updateCaseData } from '../test-utils/index.js';
import { LineForecastProps } from '../types/index.js';
import { LINE_FORECAST_PROP_UPDATE_CLASSES } from './lineForecastPropUpdateClasses.js';

const cases: UpdateCases<LineForecastProps> = {
  label: { b: { label: 'Projected' } },
  metric: { b: { metric: 'valueHigh' } },
  start: { b: { start: 3 } },
};

describeUpdateClasses<LineForecastProps>(
  'LineForecast',
  LINE_FORECAST_PROP_UPDATE_CLASSES,
  (props, onVegaViewReady) => (
    <Chart data={updateCaseData} width={400} height={300} animations={false} onVegaViewReady={onVegaViewReady}>
      <Axis position="left" />
      <Axis position="bottom" />
      <Line dimension="datetime" metric="value" color="series" scaleType="linear">
        <LineForecast metric="valueLow" start={2} {...props} />
      </Line>
      <Legend />
    </Chart>
  ),
  cases
);
