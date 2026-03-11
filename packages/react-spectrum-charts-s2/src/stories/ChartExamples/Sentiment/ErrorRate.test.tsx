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
import { spectrum2Colors } from '@spectrum-charts/themes';

import { findChart, findMarksByGroupName, render } from '../../../test-utils';
import { ErrorRate } from './ErrorRate.story';

const colors = spectrum2Colors.light;

describe('ErrorRate', () => {
  let chart: HTMLElement;

  beforeEach(async () => {
    render(<ErrorRate />);

    chart = await findChart();
    expect(chart).toBeInTheDocument();
  });

  test('should plot 3 reference lines with fixed S2 content neutral color', async () => {
    const refLine0 = await findMarksByGroupName(chart, 'axis0ReferenceLine0', 'line');
    expect(refLine0).toBeInTheDocument();
    expect(refLine0).toHaveAttribute('stroke', colors['gray-800']);

    const refLine1 = await findMarksByGroupName(chart, 'axis0ReferenceLine1', 'line');
    expect(refLine1).toBeInTheDocument();
    expect(refLine1).toHaveAttribute('stroke', colors['gray-800']);

    const refLine2 = await findMarksByGroupName(chart, 'axis0ReferenceLine2', 'line');
    expect(refLine2).toBeInTheDocument();
    expect(refLine2).toHaveAttribute('stroke', colors['gray-800']);
  });
});
