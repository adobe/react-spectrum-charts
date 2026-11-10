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
import { Axis, Legend, Line } from '../components/index.js';
import { ChartActionBar } from '../lab/index.js';
import { UpdateCases, describeUpdateClasses, noopCallback, updateCaseData } from '../test-utils/index.js';
import { ChartActionBarProps } from '../types/index.js';
import { CHART_ACTION_BAR_PROP_UPDATE_CLASSES } from './chartActionBarPropUpdateClasses.js';

const cases: UpdateCases<ChartActionBarProps> = {
  children: { b: { children: () => [] } },
  isEmphasized: { b: { isEmphasized: true } },
  maxActions: { b: { maxActions: 2 } },
  onClearSelection: { b: { onClearSelection: noopCallback } },
};

describeUpdateClasses<ChartActionBarProps>(
  'ChartActionBar',
  CHART_ACTION_BAR_PROP_UPDATE_CLASSES,
  (props, onVegaViewReady) => (
    <Chart data={updateCaseData} width={400} height={300} animations={false} onVegaViewReady={onVegaViewReady}>
      <Axis position="left" />
      <Axis position="bottom" />
      <Line dimension="datetime" metric="value" color="series" scaleType="linear">
        <ChartActionBar {...props} />
      </Line>
      <Legend />
    </Chart>
  ),
  cases
);
