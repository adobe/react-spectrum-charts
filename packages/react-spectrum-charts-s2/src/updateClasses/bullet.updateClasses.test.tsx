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
import { ChartInspect } from '../components/index.js';
import { Bullet } from '../lab/index.js';
import { UpdateCases, describeUpdateClasses } from '../test-utils/index.js';
import { BulletProps } from '../types/index.js';
import { BULLET_PROP_UPDATE_CLASSES } from './bulletPropUpdateClasses.js';

const bulletData = [
  { graphLabel: 'Acquisition', label2: 'A', currentAmount: 78, amount2: 40, amountLabel: '78!', target: 82, target2: 50, targetLabel: '82!' },
  { graphLabel: 'Activation', label2: 'B', currentAmount: 64, amount2: 30, amountLabel: '64!', target: 70, target2: 60, targetLabel: '70!' },
  { graphLabel: 'Retention', label2: 'C', currentAmount: 91, amount2: 20, amountLabel: '91!', target: 88, target2: 70, targetLabel: '88!' },
];

const thresholds = [
  { thresholdMax: 70, fill: 'rgb(200, 0, 0)' },
  { thresholdMin: 70, fill: 'rgb(0, 200, 0)' },
];

const cases: UpdateCases<BulletProps> = {
  children: { b: { children: <ChartInspect /> } },
  color: { b: { color: 'red-900' } },
  dimension: { b: { dimension: 'label2' } },
  direction: { b: { direction: 'row' } },
  labelPosition: { b: { labelPosition: 'side' } },
  maxScaleValue: { a: { scaleType: 'fixed' }, b: { scaleType: 'fixed', maxScaleValue: 200 } },
  metric: { b: { metric: 'amount2' } },
  metricAxis: { b: { metricAxis: true } },
  metricLabel: { b: { metricLabel: 'amountLabel' } },
  name: { b: { name: 'renamedBullet' } },
  numberFormat: { b: { numberFormat: 'currency' } },
  scaleType: { b: { scaleType: 'fixed' } },
  showTarget: { b: { showTarget: false } },
  showTargetValue: { b: { showTargetValue: true } },
  target: { b: { target: 'target2' } },
  targetLabel: { a: { showTargetValue: true }, b: { showTargetValue: true, targetLabel: 'targetLabel' } },
  thresholdBarColor: { a: { thresholds }, b: { thresholds, thresholdBarColor: true } },
  thresholds: { b: { thresholds } },
  track: { b: { track: true } },
};

describeUpdateClasses<BulletProps>(
  'Bullet',
  BULLET_PROP_UPDATE_CLASSES,
  (props, onVegaViewReady) => (
    <Chart data={bulletData} width={400} height={300} animations={false} onVegaViewReady={onVegaViewReady}>
      <Bullet {...props} />
    </Chart>
  ),
  cases
);
