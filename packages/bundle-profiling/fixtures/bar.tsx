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

import { Axis, Bar, Chart, Title } from '@spectrum-charts/react-spectrum-charts-s2';

const data = [
  { browser: 'Chrome', downloads: 120 },
  { browser: 'Firefox', downloads: 80 },
  { browser: 'Safari', downloads: 60 },
];

function App() {
  return (
    <Chart data={data} width={600} height={400}>
      <Title text="Bar fixture" />
      <Axis position="left" grid />
      <Axis position="bottom" baseline />
      <Bar dimension="browser" metric="downloads" color="browser" />
    </Chart>
  );
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}
