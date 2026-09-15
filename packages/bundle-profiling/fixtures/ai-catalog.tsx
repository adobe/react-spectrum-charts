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

// ai-catalog entry alone — measures whether it duplicates the shared code index.js
// already carries (Ticket 12), independent of any root-entry usage.

import { createRoot } from 'react-dom/client';

import { CatalogChart } from '@spectrum-charts/react-spectrum-charts-s2/ai-catalog';

const request = {
  component: 'Chart',
  data: { values: [{ browser: 'Chrome', downloads: 27000 }] },
  axes: [{ component: 'Axis', position: 'bottom' }],
  children: [{ component: 'Bar', dimension: 'browser', metric: 'downloads' }],
};

function App() {
  return <CatalogChart request={request} />;
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}
