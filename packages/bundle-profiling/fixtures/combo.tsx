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

import { createRoot } from 'react-dom/client';

import { Axis, Bar, Chart, Line } from '@spectrum-charts/react-spectrum-charts-s2';
import { Combo } from '@spectrum-charts/react-spectrum-charts-s2/pre-alpha';

const data = [
  { datetime: 1667890800000, orders: 42, visits: 58 },
  { datetime: 1667977200000, orders: 55, visits: 63 },
  { datetime: 1668063600000, orders: 61, visits: 70 },
];

function App() {
  return (
    <Chart data={data} minWidth={400} maxWidth={800} height={400}>
      <Axis position="left" title="Count" grid />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Combo dimension="datetime">
        <Bar metric="orders" />
        <Line metric="visits" scaleType="point" />
      </Combo>
    </Chart>
  );
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}
