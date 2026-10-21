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
import { SegmentLabel } from '../../../components/index.js';
import { basicDonutData } from '../../../storyShared/Donut/data.js';
import { findChart, fireEvent, render, screen } from '../../../test-utils/index.js';
import { ResizableDonut } from './ResizableDonut.js';

const renderDonut = () =>
  render(
    <ResizableDonut data={basicDonutData}>
      <SegmentLabel value />
    </ResizableDonut>
  );

describe('ResizableDonut', () => {
  test('reports the size tier from the smaller side of the chart', async () => {
    renderDonut();
    await findChart();

    expect(screen.getByText('Chart: 300 × 300px')).toBeInTheDocument();
    expect(screen.getByText('Size tier: S')).toBeInTheDocument();
  });

  test('resizes both dimensions from the corner handle with the keyboard', async () => {
    renderDonut();
    await findChart();

    const handle = screen.getByRole('slider', { name: 'Resize chart' });
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    fireEvent.keyDown(handle, { key: 'ArrowDown' });

    expect(screen.getByText('Chart: 310 × 320px')).toBeInTheDocument();
    expect(screen.getByText('Smaller side: 310px')).toBeInTheDocument();
  });

  test('a wide but short chart stays in the tier of its smaller side', async () => {
    renderDonut();
    await findChart();

    const handle = screen.getByRole('slider', { name: 'Resize chart' });
    for (let i = 0; i < 20; i++) fireEvent.keyDown(handle, { key: 'ArrowRight' });

    expect(screen.getByText('Chart: 500 × 300px')).toBeInTheDocument();
    expect(screen.getByText('Size tier: S')).toBeInTheDocument();
  });
});
