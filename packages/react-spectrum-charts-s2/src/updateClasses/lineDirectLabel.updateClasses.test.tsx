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
import { Axis, Legend, Line, LineDirectLabel } from '../components/index.js';
import { UpdateCases, describeUpdateClasses, updateCaseData } from '../test-utils/index.js';
import { LineDirectLabelProps } from '../types/index.js';
import { LINE_DIRECT_LABEL_PROP_UPDATE_CLASSES } from './lineDirectLabelPropUpdateClasses.js';

const cases: UpdateCases<LineDirectLabelProps> = {
  excludeSeries: { b: { excludeSeries: ['a'] } },
  fontSize: { b: { fontSize: 20 } },
  format: { b: { format: '.1f' } },
  position: { b: { position: 'start' } },
  prefix: { b: { prefix: 'Total' } },
  value: { b: { value: 'average' } },
};

describeUpdateClasses<LineDirectLabelProps>(
  'LineDirectLabel',
  LINE_DIRECT_LABEL_PROP_UPDATE_CLASSES,
  (props, onVegaViewReady) => (
    <Chart data={updateCaseData} width={400} height={300} animations={false} onVegaViewReady={onVegaViewReady}>
      <Axis position="left" />
      <Axis position="bottom" />
      <Line dimension="datetime" metric="value" color="series" scaleType="linear">
        <LineDirectLabel {...props} />
      </Line>
      <Legend />
    </Chart>
  ),
  cases
);
