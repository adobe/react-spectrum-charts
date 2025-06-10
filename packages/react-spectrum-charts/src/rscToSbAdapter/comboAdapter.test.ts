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
import { createElement } from 'react';

import { Bar, Line } from '../components';
import { getComboOptions } from './comboAdapter';

describe('getComboOptions()', () => {
  it('should return all basic options', () => {
    const options = getComboOptions({});
    expect(options.markType).toBe('combo');
    expect(options.marks).toHaveLength(0);
  });
  it('should convert mark children to marks array', () => {
    const options = getComboOptions({ children: [createElement(Bar), createElement(Line)] });
    expect(options.marks).toHaveLength(2);
    expect(options.marks?.[0].markType).toBe('bar');
    expect(options.marks?.[1].markType).toBe('line');
  });
  it('should pass through included props', () => {
    const options = getComboOptions({ dimension: 'x' });
    expect(options).toHaveProperty('dimension', 'x');
  });
  it('should not add props that are not provided', () => {
    const options = getComboOptions({});
    expect(options).not.toHaveProperty('dimension');
  });
});
