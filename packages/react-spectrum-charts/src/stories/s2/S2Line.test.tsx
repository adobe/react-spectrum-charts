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
import { spectrumColors } from '@spectrum-charts/themes';

import { allElementsHaveAttributeValue, findAllMarksByGroupName, findChart, render } from '../../test-utils';
import { S2Line } from './S2Line.story';

const colors = spectrumColors.light;

describe('s2 styling', () => {
  test('lines should be the correct color', async () => {
    render(<S2Line {...S2Line.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const lines = await findAllMarksByGroupName(chart, 'line0');
    expect(lines.length).toEqual(4);
    expect(lines[0]).toHaveAttribute('stroke', colors['s2-categorical-100']);
    expect(lines[1]).toHaveAttribute('stroke', colors['s2-categorical-200']);
    expect(lines[2]).toHaveAttribute('stroke', colors['s2-categorical-300']);
    expect(lines[3]).toHaveAttribute('stroke', colors['s2-categorical-400']);
    expect(allElementsHaveAttributeValue(lines, 'stroke-width', '2.5')).toBe(true);
  });

  test('title should be the correct size', async () => {
    render(<S2Line {...S2Line.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const titles = await findAllMarksByGroupName(chart, 'role-title-text', 'text');
    expect(titles.length).toEqual(1);
    expect(titles[0]).toHaveAttribute('font-size', '22px');
  });
});
