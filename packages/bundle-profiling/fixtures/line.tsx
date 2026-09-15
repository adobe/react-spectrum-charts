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

import { Axis, Chart, Legend, Line, Title } from '@spectrum-charts/react-spectrum-charts-s2';

const data = [
  { week: 0, retention: 1, cohort: 'A' },
  { week: 1, retention: 0.7, cohort: 'A' },
  { week: 2, retention: 0.5, cohort: 'A' },
];

function App() {
  return (
    <Chart data={data} width={600} height={400}>
      <Title text="Line fixture" />
      <Axis position="left" grid />
      <Axis position="bottom" />
      <Legend position="top" />
      <Line dimension="week" metric="retention" color="cohort" />
    </Chart>
  );
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}
