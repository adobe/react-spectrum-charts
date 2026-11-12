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
import { Axis, Bar, BarDirectLabel, ChartInspect, Legend } from '../components/index.js';
import { UpdateCases, describeUpdateClasses, noopCallback, updateCaseData } from '../test-utils/index.js';
import { BarProps } from '../types/index.js';
import { BAR_PROP_UPDATE_CLASSES } from './barPropUpdateClasses.js';

const cssColors = ['rgb(255, 0, 0)', 'rgb(0, 128, 0)', 'rgb(0, 0, 255)'];
const data = updateCaseData.map((row, i) => ({
  ...row,
  cssColor: cssColors[i % 3],
  delta: i % 2 ? -row.value : row.value,
}));
const inspect = <ChartInspect />;
const single: Partial<BarProps> = { color: { value: 'categorical-100' } };

const cases: UpdateCases<BarProps> = {
  children: { b: { children: <BarDirectLabel /> } },
  color: { b: { color: 'region' } },
  colorOverride: { b: { colorOverride: 'cssColor' } },
  dimension: { b: { dimension: 'region' } },
  dimensionDataType: { a: { dimension: 'datetime' }, b: { dimension: 'datetime', dimensionDataType: 'time' } },
  diverging: { a: { ...single, metric: 'delta' }, b: { ...single, metric: 'delta', diverging: true } },
  // a non-interactive dual axis bar fails to render
  dualMetricAxis: {
    a: { type: 'dodged', children: inspect },
    b: { type: 'dodged', children: inspect, dualMetricAxis: true },
  },
  groupedPadding: { a: { type: 'dodged' }, b: { type: 'dodged', groupedPadding: 0.3 } },
  hasSquareCorners: { b: { hasSquareCorners: true } },
  lineType: { a: { lineWidth: 2 }, b: { lineWidth: 2, lineType: 'region' } },
  lineWidth: { b: { lineWidth: 2 } },
  metric: { b: { metric: 'value2' } },
  // the factory adds a right axis with this name
  metricAxis: { b: { metricAxis: 'secondary' } },
  name: { b: { name: 'renamedBar' } },
  onClick: { b: { onClick: noopCallback } },
  onContextMenu: { b: { onContextMenu: noopCallback } },
  onMouseOut: { b: { onMouseOut: noopCallback } },
  onMouseOver: { b: { onMouseOver: noopCallback } },
  opacity: { b: { opacity: { value: 0.5 } } },
  order: { b: { order: 'value2' } },
  orientation: { b: { orientation: 'horizontal' } },
  paddingOuter: { b: { paddingOuter: 0.4 } },
  paddingRatio: { b: { paddingRatio: 0.2 } },
  trellis: { b: { trellis: 'region' } },
  trellisOrientation: { a: { trellis: 'region' }, b: { trellis: 'region', trellisOrientation: 'vertical' } },
  trellisPadding: { a: { trellis: 'region' }, b: { trellis: 'region', trellisPadding: 0.4 } },
  trendlines: { b: { trendlines: [{ method: 'average' }] } },
  type: { b: { type: 'dodged' } },
};

describeUpdateClasses<BarProps>(
  'Bar',
  BAR_PROP_UPDATE_CLASSES,
  (props, onVegaViewReady) => (
    <Chart data={data} width={400} height={300} animations={false} onVegaViewReady={onVegaViewReady}>
      <Axis position="left" />
      <Axis position="bottom" />
      {props.metricAxis && <Axis position="right" name={props.metricAxis} />}
      <Bar dimension="category" metric="value" color="series" {...props} />
      <Legend />
    </Chart>
  ),
  cases
);
