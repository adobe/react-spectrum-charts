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
import { Scatter, ScatterAnnotation } from '../lab/index.js';
import { UpdateCases, describeUpdateClasses, updateCaseData } from '../test-utils/index.js';
import { ScatterAnnotationProps } from '../types/index.js';
import { SCATTER_ANNOTATION_PROP_UPDATE_CLASSES } from './scatterAnnotationPropUpdateClasses.js';

const cases: UpdateCases<ScatterAnnotationProps> = {
  anchor: { b: { anchor: 'top' } },
  textKey: { b: { textKey: 'category' } },
};

describeUpdateClasses<ScatterAnnotationProps>(
  'ScatterAnnotation',
  SCATTER_ANNOTATION_PROP_UPDATE_CLASSES,
  (props, onVegaViewReady) => (
    <Chart data={updateCaseData} width={400} height={300} animations={false} onVegaViewReady={onVegaViewReady}>
      <Axis position="left" />
      <Axis position="bottom" />
      <Scatter dimension="x" metric="value" color="series">
        <ScatterAnnotation textKey="displayValue" {...props} />
      </Scatter>
    </Chart>
  ),
  cases
);
