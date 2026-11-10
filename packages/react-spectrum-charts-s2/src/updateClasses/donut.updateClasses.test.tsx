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
import { ChartInspect, Donut, DonutSummary, Legend, SegmentLabel } from '../components/index.js';
import { UpdateCases, describeUpdateClasses } from '../test-utils/index.js';
import { DonutProps } from '../types/index.js';
import { DONUT_PROP_UPDATE_CLASSES } from './donutPropUpdateClasses.js';

const donutData = [
  { browser: 'Chrome', vendor: 'Google', visitors: 50, sessions: 10, share: 0.6 },
  { browser: 'Firefox', vendor: 'Mozilla', visitors: 30, sessions: 40, share: 0.4 },
  { browser: 'Safari', vendor: 'Apple', visitors: 40, sessions: 20, share: 0 },
];

const segmentLabel = <SegmentLabel percent />;
const summary = <DonutSummary label="Visitors" />;
const modeLabels = [
  <SegmentLabel key="emphasized" labelMode="emphasized" percent />,
  <SegmentLabel key="deemphasized" labelMode="deemphasized" />,
];

const cases: UpdateCases<DonutProps> = {
  children: [{ b: { children: <ChartInspect /> } }, { b: { children: segmentLabel } }, { b: { children: summary } }],
  color: { b: { color: 'vendor' } },
  emphasizedItems: { b: { emphasizedItems: ['Chrome'] } },
  hideDeemphasizedLabels: {
    a: { emphasizedItems: ['Chrome'], children: modeLabels },
    b: { emphasizedItems: ['Chrome'], children: modeLabels, hideDeemphasizedLabels: true },
  },
  holeRatio: { b: { holeRatio: 0.5 } },
  isBoolean: { a: { metric: 'share', children: summary }, b: { metric: 'share', children: summary, isBoolean: true } },
  metric: { b: { metric: 'sessions' } },
  name: { b: { name: 'renamedDonut' } },
  sortOrder: { b: { sortOrder: 'data' } },
  variant: { b: { variant: 'semicircle' } },
};

describeUpdateClasses<DonutProps>(
  'Donut',
  DONUT_PROP_UPDATE_CLASSES,
  (props, onVegaViewReady) => (
    <Chart data={donutData} width={400} height={300} animations={false} onVegaViewReady={onVegaViewReady}>
      <Donut metric="visitors" color="browser" {...props} />
      <Legend />
    </Chart>
  ),
  cases
);
