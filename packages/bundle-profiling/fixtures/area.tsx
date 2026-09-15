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

import { Axis, Chart, Legend } from '@spectrum-charts/react-spectrum-charts-s2';
import { Area } from '@spectrum-charts/react-spectrum-charts-s2/pre-alpha';

const data = [
  { datetime: 1667890800000, temperature: 73, series: 'A' },
  { datetime: 1667977200000, temperature: 70, series: 'A' },
  { datetime: 1668063600000, temperature: 68, series: 'A' },
];

function App() {
  return (
    <Chart data={data} width={600} height={400}>
      <Axis position="left" grid />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Legend position="top" />
      <Area dimension="datetime" metric="temperature" color="series" scaleType="time" />
    </Chart>
  );
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}
