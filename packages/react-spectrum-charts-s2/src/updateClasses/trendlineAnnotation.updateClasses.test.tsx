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
import { Axis } from '../components/index.js';
import { Scatter, Trendline, TrendlineAnnotation } from '../lab/index.js';
import { UpdateCases, describeUpdateClasses, updateCaseData } from '../test-utils/index.js';
import { TrendlineAnnotationProps } from '../types/index.js';
import { TRENDLINE_ANNOTATION_PROP_UPDATE_CLASSES } from './trendlineAnnotationPropUpdateClasses.js';

// at the default end position, a non-default label's bounds flip on every dataflow run
const atStart = { dimensionValue: 'start' } as const;

// regression methods fail to render with annotations, so median is used
const cases: UpdateCases<TrendlineAnnotationProps> = {
  badge: { b: { badge: true } },
  dimensionValue: { b: { dimensionValue: 'start' } },
  numberFormat: { a: atStart, b: { ...atStart, numberFormat: '.2f' } },
  prefix: [
    { a: atStart, b: { ...atStart, prefix: 'Trend' } },
    { b: { prefix: 'Trend' }, knownIssue: 'label bounds at the end position flip on every dataflow run, so it never settles' },
  ],
};

describeUpdateClasses<TrendlineAnnotationProps>(
  'TrendlineAnnotation',
  TRENDLINE_ANNOTATION_PROP_UPDATE_CLASSES,
  (props, onVegaViewReady) => (
    <Chart data={updateCaseData} width={400} height={300} animations={false} onVegaViewReady={onVegaViewReady}>
      <Axis position="left" />
      <Axis position="bottom" />
      <Scatter dimension="x" metric="value" color="series">
        <Trendline method="median">
          <TrendlineAnnotation {...props} />
        </Trendline>
      </Scatter>
    </Chart>
  ),
  cases
);
