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
import { getChartTooltipOptions } from './chartTooltipAdapter';

describe('getChartTooltipOptions()', () => {
  it('should strip out children', () => {
    const options = getChartTooltipOptions({ children: () => null });
    expect(options).not.toHaveProperty('children');
  });
  it('should pass through included props', () => {
    const options = getChartTooltipOptions({ excludeDataKeys: ['foo'] });
    expect(options).toHaveProperty('excludeDataKeys', ['foo']);
  });
  it('should not add props that are not provided', () => {
    const options = getChartTooltipOptions({});
    expect(options).not.toHaveProperty('excludeDataKeys');
  });
});
