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
import { Axis, AxisThumbnail, Bar } from '../components/index.js';
import { UpdateCases, describeUpdateClasses, updateCaseData } from '../test-utils/index.js';
import { AxisThumbnailProps } from '../types/index.js';
import { AXIS_THUMBNAIL_PROP_UPDATE_CLASSES } from './axisThumbnailPropUpdateClasses.js';

const data = updateCaseData.map((datum) => ({
  ...datum,
  thumbnail: `/${datum.category}.png`,
  icon: `/${datum.category}-icon.png`,
}));

// jsdom never loads images, so without this vega waits on them forever
const withoutImages = () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'Image') as PropertyDescriptor;
  Object.defineProperty(globalThis, 'Image', { ...descriptor, value: undefined });
  return () => Object.defineProperty(globalThis, 'Image', descriptor);
};

const cases: UpdateCases<AxisThumbnailProps> = {
  urlKey: { b: { urlKey: 'icon' }, setup: withoutImages },
};

describeUpdateClasses<AxisThumbnailProps>(
  'AxisThumbnail',
  AXIS_THUMBNAIL_PROP_UPDATE_CLASSES,
  (props, onVegaViewReady) => (
    <Chart data={data} width={400} height={300} animations={false} onVegaViewReady={onVegaViewReady}>
      <Axis position="left" />
      <Axis position="bottom">
        <AxisThumbnail {...props} />
      </Axis>
      <Bar dimension="category" metric="value" color="series" />
    </Chart>
  ),
  cases
);
