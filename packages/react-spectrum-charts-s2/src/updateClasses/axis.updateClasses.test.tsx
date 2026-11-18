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
import { Axis, AxisThumbnail, Bar, Line, ReferenceLine } from '../components/index.js';
import { UpdateCases, describeUpdateClasses, noopCallback, updateCaseData } from '../test-utils/index.js';
import { AxisProps } from '../types/index.js';
import { AXIS_PROP_UPDATE_CLASSES } from './axisPropUpdateClasses.js';

// symbol keys that pick a time or band x scale instead of the default linear one; React drops them
const TIME = Symbol('time');
const BAND = Symbol('band');
const time = { [TIME]: true, labelFormat: 'time' } as Partial<AxisProps>;
const band = { [BAND]: true } as Partial<AxisProps>;

const data = updateCaseData.map((datum) => ({
  ...datum,
  datetime: Date.UTC(2024, 0, datum.datetime),
  annotations: datum.datetime === 2 ? ['1'] : [],
  category: `A very long label for category ${datum.category}`,
  thumbnail: `/${datum.category}.png`,
}));

// jsdom never loads images, so without this vega waits on them forever
const withoutImages = () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'Image') as PropertyDescriptor;
  Object.defineProperty(globalThis, 'Image', { ...descriptor, value: undefined });
  return () => Object.defineProperty(globalThis, 'Image', descriptor);
};

const cases: UpdateCases<AxisProps> = {
  axisAnnotations: { a: time, b: { ...time, axisAnnotations: [{}] }, setup: withoutImages },
  baseline: { b: { baseline: true } },
  baselineOffset: { a: { baseline: true }, b: { baseline: true, baselineOffset: 4 } },
  children: [
    { a: { position: 'left' }, b: { position: 'left', children: <ReferenceLine value={4} /> } },
    { a: band, b: { ...band, children: <AxisThumbnail /> }, setup: withoutImages },
  ],
  currencyCode: {
    a: { numberFormat: 'currency', currencyLocale: 'de-DE' },
    b: { numberFormat: 'currency', currencyLocale: 'de-DE', currencyCode: 'EUR' },
  },
  currencyLocale: {
    a: { numberFormat: 'currency', currencyCode: 'EUR' },
    b: { numberFormat: 'currency', currencyCode: 'EUR', currencyLocale: 'de-DE' },
  },
  granularity: { a: time, b: { ...time, granularity: 'hour' } },
  grid: { b: { grid: true } },
  hasTooltip: { b: { hasTooltip: true } },
  hideDefaultLabels: { b: { hideDefaultLabels: true } },
  labelAlign: { b: { labelAlign: 'start' } },
  labelFontWeight: { b: { labelFontWeight: 'bold' } },
  labelFormat: { b: { labelFormat: 'percentage' } },
  labelLimit: { a: band, b: { ...band, labelLimit: 40 } },
  labelOrientation: { b: { labelOrientation: 'vertical' } },
  labels: { b: { labels: [10, 20] } },
  // the left axis names the line's metric axis
  name: { a: { position: 'left' }, b: { position: 'left', name: 'secondary' } },
  numberFormat: { b: { numberFormat: ',.2f' } },
  onClick: { b: { onClick: noopCallback } },
  position: { b: { position: 'top' } },
  range: { b: { range: [0, 50] } },
  subLabels: { b: { subLabels: [{ value: 20, subLabel: 'Middle' }] } },
  tickCountLimit: { b: { tickCountLimit: 2 } },
  tickCountMinimum: { b: { tickCountMinimum: 8 } },
  tickMinStep: { b: { tickMinStep: 15 } },
  ticks: { b: { ticks: true } },
  title: { b: { title: 'Value' } },
  tooltipText: { a: { hasTooltip: true }, b: { hasTooltip: true, tooltipText: [{ value: 20, text: 'Twenty' }] } },
  truncateLabels: { a: band, b: { ...band, truncateLabels: true } },
};

const getMark = (props: Partial<AxisProps>) => {
  if (TIME in props) return <Line dimension="datetime" metric="value" color="series" scaleType="time" />;
  if (BAND in props) return <Bar dimension="category" metric="value" color="series" />;
  return <Line dimension="x" metric="value" color="series" scaleType="linear" metricAxis={props.name} />;
};

describeUpdateClasses<AxisProps>(
  'Axis',
  AXIS_PROP_UPDATE_CLASSES,
  (props, onVegaViewReady) => (
    <Chart data={data} width={400} height={300} animations={false} onVegaViewReady={onVegaViewReady}>
      {props.position !== 'left' && <Axis position="left" />}
      <Axis position="bottom" {...props} />
      {getMark(props)}
    </Chart>
  ),
  cases
);
