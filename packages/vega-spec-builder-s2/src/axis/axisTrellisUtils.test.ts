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
import { getTrellisAxisOptions } from './axisTrellisUtils';

describe('getTrellisAxisOptions()', () => {
  test('should generate trellis axis options for x axis', () => {
    const trellisAxisOptions = getTrellisAxisOptions('xTrellisBand');
    expect(trellisAxisOptions).toHaveProperty('position', 'top');
    expect(trellisAxisOptions).toHaveProperty('vegaLabelOffset', { signal: "bandwidth('xTrellisBand') / -2" });
    expect(trellisAxisOptions).toHaveProperty('vegaLabelPadding', 8);
  });
  test('should generate trellis axis options for y axis', () => {
    const trellisAxisOptions = getTrellisAxisOptions('yTrellisBand');
    expect(trellisAxisOptions).toHaveProperty('position', 'left');
    expect(trellisAxisOptions).toHaveProperty('vegaLabelOffset', {
      signal: "bandwidth('yTrellisBand') / -2 - 8",
    });
    expect(trellisAxisOptions).toHaveProperty('vegaLabelPadding', 0);
  });
  test('should retrun empty object if not for a trellis axis', () => {
    expect(getTrellisAxisOptions('xLinear')).toEqual({});
  });
});
