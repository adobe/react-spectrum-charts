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

import { Line } from '../components';
import { BigNumberProps } from '../types';
import { getBigNumberOptions } from './bigNumberAdapter';

const basicBigNumberProps: BigNumberProps = {
  dataKey: 'test',
  label: 'Hello world',
  orientation: 'horizontal',
};

describe('getBigNumberOptions()', () => {
  it('should return all basic options', () => {
    const options = getBigNumberOptions(basicBigNumberProps);
    expect(options.markType).toBe('bigNumber');
    expect(options.lines).toHaveLength(0);
  });
  it('should convert line children to bigNumberLines array', () => {
    const options = getBigNumberOptions({ ...basicBigNumberProps, children: [createElement(Line)] });
    expect(options.lines).toHaveLength(1);
  });
  it('should pass through included props', () => {
    const options = getBigNumberOptions({ ...basicBigNumberProps, numberFormat: 'currency' });
    expect(options).toHaveProperty('numberFormat', 'currency');
  });
  it('should not add props that are not provided', () => {
    const options = getBigNumberOptions(basicBigNumberProps);
    expect(options).not.toHaveProperty('numberFormat');
  });
});
