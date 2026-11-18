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
import { Axis, Bar, BarDirectLabel } from '../components/index.js';
import { UpdateCases, describeUpdateClasses, updateCaseData } from '../test-utils/index.js';
import { BarDirectLabelProps } from '../types/index.js';
import { BAR_DIRECT_LABEL_PROP_UPDATE_CLASSES } from './barDirectLabelPropUpdateClasses.js';

const cases: UpdateCases<BarDirectLabelProps> = {
  dataKey: { b: { dataKey: 'isStatic' } },
  format: { b: { format: 'currency' } },
  overflow: { a: { position: 'middle' }, b: { position: 'middle', overflow: 'spill' } },
  position: { b: { position: 'middle' } },
};

describeUpdateClasses<BarDirectLabelProps>(
  'BarDirectLabel',
  BAR_DIRECT_LABEL_PROP_UPDATE_CLASSES,
  (props, onVegaViewReady) => (
    <Chart data={updateCaseData} width={400} height={300} animations={false} onVegaViewReady={onVegaViewReady}>
      <Axis position="left" />
      <Axis position="bottom" />
      <Bar dimension="category" metric="value" color="series" type="dodged">
        <BarDirectLabel {...props} />
      </Bar>
    </Chart>
  ),
  cases
);
