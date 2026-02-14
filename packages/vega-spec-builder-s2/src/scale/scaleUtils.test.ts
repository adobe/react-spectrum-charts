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
import { Scale } from 'vega';

import { getDualAxisScaleNames, getScaleField } from './scaleUtils';

describe('getDualAxisScaleNames()', () => {
  test('should return correct scale names for "xLinear" base scale', () => {
    const result = getDualAxisScaleNames('xLinear');
    expect(result).toEqual({
      primaryScale: 'xLinearPrimary',
      secondaryScale: 'xLinearSecondary',
      primaryDomain: 'xLinearPrimaryDomain',
      secondaryDomain: 'xLinearSecondaryDomain',
    });
  });

  test('should return correct scale names for "yLinear" base scale', () => {
    const result = getDualAxisScaleNames('yLinear');
    expect(result).toEqual({
      primaryScale: 'yLinearPrimary',
      secondaryScale: 'yLinearSecondary',
      primaryDomain: 'yLinearPrimaryDomain',
      secondaryDomain: 'yLinearSecondaryDomain',
    });
  });

  test('should return correct scale names for custom base scale', () => {
    const result = getDualAxisScaleNames('customScale');
    expect(result).toEqual({
      primaryScale: 'customScalePrimary',
      secondaryScale: 'customScaleSecondary',
      primaryDomain: 'customScalePrimaryDomain',
      secondaryDomain: 'customScaleSecondaryDomain',
    });
  });

  test('should handle empty string base scale name', () => {
    const result = getDualAxisScaleNames('');
    expect(result).toEqual({
      primaryScale: 'Primary',
      secondaryScale: 'Secondary',
      primaryDomain: 'PrimaryDomain',
      secondaryDomain: 'SecondaryDomain',
    });
  });
});

describe('getScaleField()', () => {
  test('should return field string when scale has domain with field property', () => {
    const scale: Scale = {
      name: 'testScale',
      type: 'linear',
      domain: { data: 'table', field: 'category' },
    };

    const result = getScaleField(scale);
    expect(result).toBe('category');
  });

  test('should return first field when scale has domain with fields array', () => {
    const scale: Scale = {
      name: 'testScale',
      type: 'linear',
      domain: { data: 'table', fields: ['field1', 'field2'] },
    };

    const result = getScaleField(scale);
    expect(result).toBe('field1');
  });

  test('should return undefined when scale has domain with empty fields array', () => {
    const scale: Scale = {
      name: 'testScale',
      type: 'linear',
      domain: { data: 'table', fields: [] },
    };

    const result = getScaleField(scale);
    expect(result).toBeUndefined();
  });

  test('should return undefined when scale has no domain', () => {
    const scale: Scale = {
      name: 'testScale',
      type: 'linear',
    };

    const result = getScaleField(scale);
    expect(result).toBeUndefined();
  });
});
