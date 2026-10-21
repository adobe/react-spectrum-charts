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
import { SegmentLabel } from '../../../../components/index.js';
import { basicDonutData } from '../../../../storyShared/Donut/data.js';
import { findChart, fireEvent, render, screen } from '../../../../test-utils/index.js';
import { ResizableDonut, getDonutDiameter, getSizeTierIndex } from './ResizableDonut.js';

const renderDonut = () => render(<ResizableDonut data={basicDonutData} segmentLabel={<SegmentLabel value />} />);

describe('ResizableDonut', () => {
  test('uses the labeled breakpoints, capping the diameter at the next tier', () => {
    expect([205, 206, 343, 344, 472, 674].map((size) => getSizeTierIndex(size, true))).toEqual([0, 1, 1, 2, 3, 4]);
    expect(getDonutDiameter(206, true)).toBe(120);
    expect(getDonutDiameter(343, true)).toBe(200);
  });

  test('uses the unlabeled breakpoints, where the diameter is the chart size minus padding', () => {
    expect([139, 140, 220, 300, 420].map((size) => getSizeTierIndex(size, false))).toEqual([0, 1, 2, 3, 4]);
    expect(getDonutDiameter(300, false)).toBe(280);
  });

  test('resizes both dimensions from the corner handle and tiers off the smaller side', async () => {
    renderDonut();
    await findChart();

    const handle = screen.getByRole('button', { name: /^Resize chart/ });
    for (let i = 0; i < 20; i++) fireEvent.keyDown(handle, { key: 'ArrowRight' });
    fireEvent.keyDown(handle, { key: 'ArrowDown' });

    expect(screen.getByText('Chart: 500 × 310px')).toBeInTheDocument();
    expect(screen.getByText('Size tier: S')).toBeInTheDocument();
  });

  test('switches to the unlabeled breakpoints when segment labels are turned off', async () => {
    renderDonut();
    await findChart();
    expect(screen.getByText('Size tier: S')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('switch', { name: 'Segment labels' }));

    expect(screen.getByText('Size tier: L')).toBeInTheDocument();
    expect(screen.getByText('L ≥ 300px')).toBeInTheDocument();
  });
});
