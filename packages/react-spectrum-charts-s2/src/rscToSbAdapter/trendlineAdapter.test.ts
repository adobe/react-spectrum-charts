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
import { createElement } from 'react';

import { ChartInspect } from '../components/ChartInspect';
import { TrendlineAnnotation } from '../pre-alpha';
import { getTrendlineOptions } from './trendlineAdapter';

describe('getTrendlineOptions()', () => {
  it('should return all basic options', () => {
    const options = getTrendlineOptions({});
    expect(options.chartInspects).toHaveLength(0);
    expect(options.trendlineAnnotations).toHaveLength(0);
  });
  it('should convert ChartInspect children to chartInspects array', () => {
    const options = getTrendlineOptions({ children: [createElement(ChartInspect)] });
    expect(options.chartInspects).toHaveLength(1);
  });
  it('should convert trendline annotation children to trendlineAnnotations array', () => {
    const options = getTrendlineOptions({ children: [createElement(TrendlineAnnotation)] });
    expect(options.trendlineAnnotations).toHaveLength(1);
  });
  it('should pass through included props', () => {
    const options = getTrendlineOptions({ method: 'linear' });
    expect(options).toHaveProperty('method', 'linear');
  });
});
