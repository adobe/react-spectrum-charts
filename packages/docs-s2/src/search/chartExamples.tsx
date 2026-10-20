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
import React, { ComponentProps } from 'react';

import { Bar, Chart, Donut, Line } from '@spectrum-charts/react-spectrum-charts-s2';
import { Area, Bullet, Combo, Scatter } from '@spectrum-charts/react-spectrum-charts-s2/lab';

import {
  barChannelDeviceData,
  browserData,
  bulletScoreData,
  channelSessionsData,
  comboTrafficData,
  scatterCampaignData,
} from '../components/examples/data';

export interface ChartExample {
  /** Doc id the card links to; also used as the key. */
  docId: string;
  title: string;
  /** Components whose prop names match this card. */
  components: string[];
  /** Extra search terms not in the title or props. */
  keywords: string;
  data: Record<string, unknown>[];
  /** Chart children rendered in the preview. */
  marks: ComponentProps<typeof Chart>['children'];
}

const SERIES = [
  { series: 'Desktop', base: 40, slope: 4 },
  { series: 'Mobile', base: 25, slope: 7 },
  { series: 'Tablet', base: 12, slope: 2 },
];
const START = Date.UTC(2024, 0, 1);
const DAY = 86_400_000;

const trendData = SERIES.flatMap(({ series, base, slope }) =>
  Array.from({ length: 8 }, (_, i) => ({
    series,
    datetime: START + i * DAY,
    value: base + slope * i + (i % 3 === 0 ? 6 : 0),
  }))
);

export const chartExamples: ChartExample[] = [
  {
    docId: 'line',
    title: 'Line',
    components: ['Line', 'LineDirectLabel', 'LineForecast'],
    keywords: 'trend time series sparkline forecast interpolation gradient multi-series',
    data: trendData,
    marks: <Line color="series" />,
  },
  {
    docId: 'bar',
    title: 'Bar',
    components: ['Bar', 'BarDirectLabel'],
    keywords: 'column histogram stacked grouped dodged diverging trellis small multiples',
    data: barChannelDeviceData,
    marks: <Bar dimension="channel" metric="visits" color="device" />,
  },
  {
    docId: 'donut',
    title: 'Donut',
    components: ['Donut', 'DonutSummary', 'SegmentLabel'],
    keywords: 'pie semicircle part to whole',
    data: browserData,
    marks: <Donut metric="count" color="browser" />,
  },
  {
    docId: 'area',
    title: 'Area',
    components: ['Area'],
    keywords: 'stacked area range band filled trend time series',
    data: channelSessionsData,
    marks: <Area metric="sessions" color="channel" />,
  },
  {
    docId: 'bullet',
    title: 'Bullet',
    components: ['Bullet'],
    keywords: 'target goal kpi progress threshold gauge',
    data: bulletScoreData,
    marks: <Bullet metric="score" dimension="kpi" target="goal" />,
  },
  {
    docId: 'combo',
    title: 'Combo',
    components: ['Combo'],
    keywords: 'bar and line dual axis mixed overlay',
    data: comboTrafficData,
    marks: (
      <Combo>
        <Bar metric="sessions" />
        <Line metric="orders" scaleType="point" />
      </Combo>
    ),
  },
  {
    docId: 'scatter',
    title: 'Scatter',
    components: ['Scatter', 'ScatterAnnotation', 'ScatterPath', 'Trendline', 'TrendlineAnnotation'],
    keywords: 'scatter plot bubble correlation xy point trendline regression',
    data: scatterCampaignData,
    marks: <Scatter dimension="spend" metric="revenue" color="channel" />,
  },
];
