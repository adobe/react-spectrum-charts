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

// Upper-bound fixture: references every stable + pre-alpha mark and every supporting
// component so this file's bundled size is the ceiling a consumer could ever pay
// today, regardless of which of these they actually use.

import { createRoot } from 'react-dom/client';

import {
  Axis,
  AxisThumbnail,
  Bar,
  BarDirectLabel,
  Chart,
  ChartPopover,
  Legend,
  Line,
  LineDirectLabel,
  LineForecast,
  LinePointAnnotation,
  ReferenceLine,
  Title,
} from '@spectrum-charts/react-spectrum-charts-s2';
import {
  Area,
  Bullet,
  Combo,
  Donut,
  DonutSummary,
  Scatter,
  ScatterAnnotation,
  ScatterPath,
  SegmentLabel,
  Trendline,
  TrendlineAnnotation,
} from '@spectrum-charts/react-spectrum-charts-s2/pre-alpha';

const lineBarData = [
  { datetime: 1667890800000, orders: 42, visits: 58, series: 'A' },
  { datetime: 1667977200000, orders: 55, visits: 63, series: 'A' },
  { datetime: 1668063600000, orders: 61, visits: 70, series: 'A' },
];

const donutData = [
  { category: 'Direct', value: 40 },
  { category: 'Organic', value: 35 },
  { category: 'Referral', value: 25 },
];

const scatterData = [
  { speed: 3, handling: 4, weightClass: 'Light' },
  { speed: 4, handling: 3, weightClass: 'Medium' },
];

const bulletData = [{ metric: 'Revenue', value: 70, target: 100 }];

function App() {
  return (
    <>
      <Chart data={lineBarData} width={700} height={450}>
        <Title text="Stable marks + Combo" />
        <Axis position="left" title="Count" grid>
          <ReferenceLine value={50} label="Target" />
        </Axis>
        <Axis position="bottom" labelFormat="time" baseline ticks />
        <AxisThumbnail />
        <Legend position="top" highlight />
        <ChartPopover />
        <Combo dimension="datetime">
          <Bar metric="orders">
            <BarDirectLabel />
          </Bar>
          <Line metric="visits" scaleType="point">
            <LineDirectLabel value="series" />
            <LineForecast metric="visits" start={1668063600000} />
            <LinePointAnnotation />
          </Line>
        </Combo>
        <Trendline />
        <TrendlineAnnotation />
      </Chart>

      <Chart data={donutData} width={350} height={350}>
        <Donut metric="value" color="category">
          <SegmentLabel />
        </Donut>
        <DonutSummary label="Total" />
      </Chart>

      <Chart data={scatterData} width={500} height={500}>
        <Axis position="bottom" grid ticks baseline title="Speed" />
        <Axis position="left" grid ticks baseline title="Handling" />
        <Scatter dimension="speed" metric="handling" color="weightClass">
          <ScatterPath />
          <ScatterAnnotation />
        </Scatter>
      </Chart>

      <Chart data={bulletData} width={400} height={120}>
        <Bullet dimension="metric" metric="value" target="target" />
      </Chart>

      <Chart data={lineBarData} width={700} height={450}>
        <Axis position="bottom" labelFormat="time" baseline ticks />
        <Area dimension="datetime" metric="orders" color="series" scaleType="time" />
      </Chart>
    </>
  );
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}
