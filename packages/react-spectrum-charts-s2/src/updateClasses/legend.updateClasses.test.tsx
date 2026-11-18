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
import { LegendProps } from '../types/index.js';
import { LEGEND_PROP_UPDATE_CLASSES } from './legendPropUpdateClasses.js';

const cases: UpdateCases<LegendProps> = {
  align: { b: { align: 'end' } },
  chartPopovers: { b: { chartPopovers: [{}] } },
  children: { b: { children: <ChartPopover /> } },
  color: { b: { color: { value: 'gray-700' } } },
  defaultHiddenSeries: { skip: 'uncontrolled initial value, only read on mount' },
  descriptions: { b: { descriptions: [{ seriesName: 'a', description: 'Series a' }] } },
  hiddenEntries: { b: { hiddenEntries: ['a'] } },
  highlight: { b: { highlight: true } },
  isToggleable: { b: { isToggleable: true } },
  keys: { a: { highlight: true }, b: { highlight: true, keys: ['series'] } },
  labelLimit: { b: { labelLimit: 5 } },
  legendLabels: { b: { legendLabels: [{ seriesName: 'a', label: 'Alpha' }] } },
  lineType: { b: { lineType: { value: 'dashed' } } },
  lineWidth: { b: { lineWidth: { value: 'L' } } },
  name: {
    b: { name: 'renamedLegend' },
    knownIssue: 'a named legend fails to render: Undefined data set name "legend0Aggregate"',
  },
  onClick: { b: { onClick: noopCallback } },
  onMouseOut: { b: { onMouseOut: noopCallback } },
  onMouseOver: { b: { onMouseOver: noopCallback } },
  opacity: { b: { opacity: { value: 0.5 } } },
  position: { b: { position: 'right' } },
  symbolShape: { b: { symbolShape: { value: 'circle' } } },
  title: { b: { title: 'Series' } },
  titleLimit: { a: { title: 'A long legend title' }, b: { title: 'A long legend title', titleLimit: 20 } },
};

describeUpdateClasses<LegendProps>(
  'Legend',
  LEGEND_PROP_UPDATE_CLASSES,
  (props, onVegaViewReady) => (
    <Chart data={updateCaseData} width={400} height={300} animations={false} onVegaViewReady={onVegaViewReady}>
      <Axis position="left" />
      <Axis position="bottom" />
      <Line dimension="datetime" metric="value" color="series" scaleType="linear" />
      <Legend {...props} />
    </Chart>
  ),
  cases
);
