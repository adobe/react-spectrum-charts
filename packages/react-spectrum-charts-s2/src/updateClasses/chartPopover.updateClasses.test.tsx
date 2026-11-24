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
import { Axis, ChartPopover, Legend, Line } from '../components/index.js';
import { UpdateCases, describeUpdateClasses, noopCallback, updateCaseData } from '../test-utils/index.js';
import { ChartPopoverProps } from '../types/index.js';
import { CHART_POPOVER_PROP_UPDATE_CLASSES } from './chartPopoverPropUpdateClasses.js';

const cases: UpdateCases<ChartPopoverProps> = {
  children: { b: { children: () => 'Details' } },
  containerPadding: { b: { containerPadding: 24 } },
  contentMargin: { b: { contentMargin: 4 } },
  height: { b: { height: 200 } },
  maxHeight: { b: { maxHeight: 200 } },
  maxWidth: { b: { maxWidth: 200 } },
  minHeight: { b: { minHeight: 100 } },
  minWidth: { b: { minWidth: 100 } },
  onOpenChange: { b: { onOpenChange: noopCallback } },
  rightClick: { b: { rightClick: true } },
  UNSAFE_highlightBy: { b: { UNSAFE_highlightBy: 'series' } },
  width: { b: { width: 200 } },
};

describeUpdateClasses<ChartPopoverProps>(
  'ChartPopover',
  CHART_POPOVER_PROP_UPDATE_CLASSES,
  (props, onVegaViewReady) => (
    <Chart data={updateCaseData} width={400} height={300} animations={false} onVegaViewReady={onVegaViewReady}>
      <Axis position="left" />
      <Axis position="bottom" />
      <Line dimension="datetime" metric="value" color="series" scaleType="linear">
        <ChartPopover {...props} />
      </Line>
      <Legend />
    </Chart>
  ),
  cases
);
