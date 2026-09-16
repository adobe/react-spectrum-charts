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

// The absolute floor: Chart + Bar + a single Axis, nothing else (no Title, no Legend).
// Distinct from bar.tsx (which adds a second axis + Title) — this is the true minimum
// a consumer can render.

import { createRoot } from 'react-dom/client';

import { Axis, Bar, Chart } from '@spectrum-charts/react-spectrum-charts-s2';

const data = [
  { browser: 'Chrome', downloads: 120 },
  { browser: 'Firefox', downloads: 80 },
];

function App() {
  return (
    <Chart data={data} width={600} height={400}>
      <Axis position="bottom" baseline />
      <Bar dimension="browser" metric="downloads" />
    </Chart>
  );
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}
