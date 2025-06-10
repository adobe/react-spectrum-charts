/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { getColorValue } from './utils';

describe('getColorValue()', () => {
  test('should return color values from spectrum names', () => {
    expect(getColorValue('categorical-100', 'light')).toEqual('rgb(15, 181, 174)');
    expect(getColorValue('gray-800', 'light')).toEqual('rgb(34, 34, 34)');
    expect(getColorValue('gray-800', 'dark')).toEqual('rgb(235, 235, 235)');
  });

  test('should pass through non-spectrum color values', () => {
    expect(getColorValue('transparent', 'light')).toEqual('transparent');
    expect(getColorValue('gray', 'light')).toEqual('gray');
    expect(getColorValue('#FFF', 'dark')).toEqual('#FFF');
  });
});
