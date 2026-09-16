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

import { Axis, Chart, Legend, Title } from '@spectrum-charts/react-spectrum-charts-s2';
import { Scatter } from '@spectrum-charts/react-spectrum-charts-s2/pre-alpha';

const data = [
  { speed: 3, handling: 4, weightClass: 'Light' },
  { speed: 4, handling: 3, weightClass: 'Medium' },
  { speed: 2, handling: 5, weightClass: 'Heavy' },
];

function App() {
  return (
    <Chart data={data} width={500} height={500}>
      <Axis position="bottom" grid ticks baseline title="Speed" />
      <Axis position="left" grid ticks baseline title="Handling" />
      <Legend highlight position="right" title="Weight class" />
      <Title text="Scatter fixture" />
      <Scatter dimension="speed" metric="handling" color="weightClass" />
    </Chart>
  );
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}
