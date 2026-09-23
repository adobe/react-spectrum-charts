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
import { SegmentLabel } from '../../../pre-alpha';
import { findChart, fireEvent, render, screen } from '../../../test-utils';
import { basicDonutData } from '../../components/Donut/data';
import { ResponsiveDonut } from './ResponsiveDonut';

describe('ResponsiveDonut', () => {
  test('reports the label-reserved diameter and size tier for its initial width', async () => {
    render(
      <ResponsiveDonut data={basicDonutData}>
        <SegmentLabel value />
      </ResponsiveDonut>
    );

    expect(await findChart()).toBeInTheDocument();
    expect(screen.getByText('300px')).toBeInTheDocument();
    expect(screen.getByText('160px')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Chart width' })).toHaveValue('300');
  });

  test('updates the chart width, effective diameter, and size tier from the slider', async () => {
    render(
      <ResponsiveDonut data={basicDonutData}>
        <SegmentLabel value />
      </ResponsiveDonut>
    );
    await findChart();

    fireEvent.change(screen.getByRole('slider', { name: 'Chart width' }), { target: { value: 500 } });

    expect(screen.getByText('500px')).toBeInTheDocument();
    expect(screen.getByText('285px')).toBeInTheDocument();
    expect(screen.getByText('L')).toBeInTheDocument();
  });
});
