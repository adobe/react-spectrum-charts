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
import { Chart } from '../Chart.js';
import { Donut, DonutSummary } from '../components/index.js';
import { UpdateCases, describeUpdateClasses } from '../test-utils/index.js';
import { DonutSummaryProps } from '../types/index.js';
import { DONUT_SUMMARY_PROP_UPDATE_CLASSES } from './donutSummaryPropUpdateClasses.js';

const donutData = [
  { browser: 'Chrome', visitors: 5000 },
  { browser: 'Firefox', visitors: 3000 },
  { browser: 'Safari', visitors: 4000 },
];

const cases: UpdateCases<DonutSummaryProps> = {
  delta: { b: { delta: 0.025 } },
  hideValue: { b: { hideValue: true } },
  label: { b: { label: 'Visitors' } },
  numberFormat: { b: { numberFormat: 'standardNumber' } },
};

describeUpdateClasses<DonutSummaryProps>(
  'DonutSummary',
  DONUT_SUMMARY_PROP_UPDATE_CLASSES,
  (props, onVegaViewReady) => (
    <Chart data={donutData} width={400} height={400} animations={false} onVegaViewReady={onVegaViewReady}>
      <Donut metric="visitors" color="browser">
        <DonutSummary {...props} />
      </Donut>
    </Chart>
  ),
  cases
);
