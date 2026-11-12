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
import { Donut, SegmentLabel } from '../components/index.js';
import { UpdateCases, describeUpdateClasses } from '../test-utils/index.js';
import { SegmentLabelProps } from '../types/index.js';
import { SEGMENT_LABEL_PROP_UPDATE_CLASSES } from './segmentLabelPropUpdateClasses.js';

const donutData = [
  { browser: 'Chrome', label: 'Google Chrome', visitors: 5000 },
  { browser: 'Firefox', label: 'Mozilla Firefox', visitors: 3000 },
  { browser: 'Safari', label: 'Apple Safari', visitors: 4000 },
];

const cases: UpdateCases<SegmentLabelProps> = {
  labelKey: { b: { labelKey: 'label' } },
  labelMode: { b: { labelMode: 'emphasized' } },
  percent: { b: { percent: true } },
  percentFormat: { a: { percent: true }, b: { percent: true, percentFormat: '.1%' } },
  showTotal: { a: { showValueRow: true, value: true }, b: { showValueRow: true, value: true, showTotal: true } },
  showValueRow: { a: { value: true }, b: { value: true, showValueRow: true } },
  swatch: { b: { swatch: true } },
  value: { b: { value: false } },
  valueFormat: { a: { value: true }, b: { value: true, valueFormat: 'shortNumber' } },
};

describeUpdateClasses<SegmentLabelProps>(
  'SegmentLabel',
  SEGMENT_LABEL_PROP_UPDATE_CLASSES,
  (props, onVegaViewReady) => (
    <Chart data={donutData} width={500} height={400} animations={false} onVegaViewReady={onVegaViewReady}>
      {/* emphasizedItems gives labelMode a filter to apply */}
      <Donut metric="visitors" color="browser" emphasizedItems={['Chrome']}>
        <SegmentLabel {...props} />
      </Donut>
    </Chart>
  ),
  cases
);
