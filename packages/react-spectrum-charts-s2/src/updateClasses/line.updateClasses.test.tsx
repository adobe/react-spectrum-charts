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
import { Axis, ChartInspect, Legend, Line } from '../components/index.js';
import { UpdateCases, describeUpdateClasses, noopCallback, updateCaseData } from '../test-utils/index.js';
import { LineProps } from '../types/index.js';
import { LINE_PROP_UPDATE_CLASSES } from './linePropUpdateClasses.js';

const inspect = <ChartInspect />;

const cases: UpdateCases<LineProps> = {
  alternateSegmentKey: { b: { alternateSegmentKey: 'estimated' } },
  alternateSegmentLabel: {
    a: { alternateSegmentKey: 'estimated' },
    b: { alternateSegmentKey: 'estimated', alternateSegmentLabel: 'Projected' },
  },
  alternateSegmentLineType: {
    a: { alternateSegmentKey: 'estimated' },
    b: { alternateSegmentKey: 'estimated', alternateSegmentLineType: 'dashed' },
  },
  children: { b: { children: inspect } },
  color: { b: { color: 'region' } },
  contextMenuMode: { a: { onContextMenu: noopCallback }, b: { onContextMenu: noopCallback, contextMenuMode: 'item' } },
  dimension: { b: { dimension: 'x', scaleType: 'linear' } },
  dimensionHover: { b: { dimensionHover: true } },
  // a non-interactive dual axis line fails to render
  dualMetricAxis: { a: { children: inspect }, b: { children: inspect, dualMetricAxis: true } },
  gradient: { b: { gradient: true } },
  hoverLabelKey: { a: { onClick: noopCallback }, b: { onClick: noopCallback, hoverLabelKey: 'displayValue' } },
  interactionMode: { a: { onClick: noopCallback }, b: { onClick: noopCallback, interactionMode: 'item' } },
  interpolate: { b: { interpolate: 'monotone' } },
  isMethodLast: { a: { isSparkline: true }, b: { isSparkline: true, isMethodLast: true } },
  isSparkline: { b: { isSparkline: true } },
  lineCap: { b: { lineCap: 'square' } },
  lineType: { b: { lineType: 'series' } },
  metric: { b: { metric: 'value2' } },
  // the factory adds a right axis with this name
  metricAxis: { b: { metricAxis: 'secondary' } },
  metricRanges: { b: { metricRanges: [{ metricStart: 'valueLow', metricEnd: 'valueHigh' }] } },
  name: { b: { name: 'renamedLine' } },
  onClick: { b: { onClick: noopCallback } },
  onContextMenu: { b: { onContextMenu: noopCallback } },
  opacity: { b: { opacity: 'series' } },
  otherSeriesColor: { a: { primarySeries: ['a'] }, b: { primarySeries: ['a'], otherSeriesColor: 'gray-500' } },
  padding: { b: { padding: 0.3 } },
  pointSize: { a: { staticPoint: 'isStatic' }, b: { staticPoint: 'isStatic', pointSize: 200 } },
  primarySeries: { b: { primarySeries: ['a'] } },
  scaleType: { b: { scaleType: 'time' } },
  showHoverLabel: { a: { onClick: noopCallback }, b: { onClick: noopCallback, showHoverLabel: false } },
  staticPoint: { b: { staticPoint: 'isStatic' } },
  trendlines: { b: { trendlines: [{ method: 'linear' }] } },
};

describeUpdateClasses<LineProps>(
  'Line',
  LINE_PROP_UPDATE_CLASSES,
  (props, onVegaViewReady) => (
    <Chart data={updateCaseData} width={400} height={300} animations={false} onVegaViewReady={onVegaViewReady}>
      <Axis position="left" />
      <Axis position="bottom" />
      {props.metricAxis && <Axis position="right" name={props.metricAxis} />}
      <Line dimension="datetime" metric="value" color="series" scaleType="linear" {...props} />
      <Legend />
    </Chart>
  ),
  cases
);
