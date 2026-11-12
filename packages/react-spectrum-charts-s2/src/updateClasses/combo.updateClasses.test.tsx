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
import { Axis, Bar, Line } from '../components/index.js';
import { Combo } from '../lab/index.js';
import { UpdateCases, describeUpdateClasses, updateCaseData } from '../test-utils/index.js';
import { ComboProps } from '../types/index.js';
import { COMBO_PROP_UPDATE_CLASSES } from './comboPropUpdateClasses.js';

const comboData = updateCaseData.filter((row) => row.series === 'a');

const barAndLine = [<Bar key="bar" metric="value" />, <Line key="line" metric="value2" scaleType="point" />];

const cases: UpdateCases<ComboProps> = {
  children: { a: { children: barAndLine }, b: { children: barAndLine.slice(0, 1) } },
  dimension: { a: { children: barAndLine }, b: { children: barAndLine, dimension: 'x' } },
  name: { a: { children: barAndLine }, b: { children: barAndLine, name: 'renamedCombo' } },
};

describeUpdateClasses<ComboProps>(
  'Combo',
  COMBO_PROP_UPDATE_CLASSES,
  (props, onVegaViewReady) => (
    <Chart data={comboData} width={400} height={300} animations={false} onVegaViewReady={onVegaViewReady}>
      <Axis position="left" />
      <Axis position="bottom" />
      <Combo dimension="datetime" {...props} />
    </Chart>
  ),
  cases
);
