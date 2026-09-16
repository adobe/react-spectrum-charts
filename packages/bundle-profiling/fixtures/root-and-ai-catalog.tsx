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

// Root entry + ai-catalog entry, imported together — the multi-entry scenario Ticket 12
// targets. Compare this fixture's size against ai-catalog.tsx + bar.tsx summed: today,
// with no shared chunk between webpack entries, this should be close to their sum (near-full
// duplication of the ~700 KB shared code both entries carry independently). After Ticket 12
// lands, this fixture should shrink relative to that sum since the shared code would only
// need to be counted once.

import { createRoot } from 'react-dom/client';

import { Axis, Bar, Chart } from '@spectrum-charts/react-spectrum-charts-s2';
import { CatalogChart } from '@spectrum-charts/react-spectrum-charts-s2/ai-catalog';

const barData = [
  { browser: 'Chrome', downloads: 120 },
  { browser: 'Firefox', downloads: 80 },
];

const catalogRequest = {
  component: 'Chart',
  data: { values: [{ browser: 'Chrome', downloads: 27000 }] },
  axes: [{ component: 'Axis', position: 'bottom' }],
  children: [{ component: 'Bar', dimension: 'browser', metric: 'downloads' }],
};

function App() {
  return (
    <>
      <Chart data={barData} width={600} height={400}>
        <Axis position="left" grid />
        <Axis position="bottom" baseline />
        <Bar dimension="browser" metric="downloads" color="browser" />
      </Chart>
      <CatalogChart request={catalogRequest} />
    </>
  );
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}
