/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { findChart, render, screen, hoverNthElement, getAllAxisLabels, waitFor } from '../../../test-utils';
import { LabelAlign, LabelOrientation, LabelWithTooltip, LabelWithTimeBasedTooltip } from './AxisLabels.story';

describe('LabelAlign', () => {
  test('anchor should be on the left side of text for labelAlign="start" and labelOrientation="horizontal"', async () => {
    render(<LabelAlign {...LabelAlign.args} labelAlign="start" />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    expect(screen.getByText('0')).toHaveAttribute('text-anchor', 'start');
  });

  test('anchor should be at end of text for labelAlign="end" and labelOrientation="horizontal"', async () => {
    render(<LabelAlign {...LabelAlign.args} labelAlign="end" />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    expect(screen.getByText('0')).toHaveAttribute('text-anchor', 'end');
  });
});

describe('LabelOrientation', () => {
  test('text should be rotated 270deg for veritcal labelOrientation', async () => {
    render(<LabelOrientation {...LabelOrientation.args} labelOrientation="vertical" />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    expect(screen.getByText('0').getAttribute('transform')?.includes('rotate(270')).toBeTruthy();
  });
});

describe('LabelWithTooltip', () => {
  test('tooltip should be included with the axis', async () => {
    render(<LabelWithTooltip {...LabelWithTooltip.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const el = document.getElementById('vg-tooltip-element');
    expect(el).toBeInTheDocument();
    expect(el).toHaveClass('vg-tooltip');
  });

  test('shows tooltip when first axis label is hovered', async () => {
    render(<LabelWithTooltip {...LabelWithTooltip.args} />);
  
    const chart = await findChart();
    const labels = getAllAxisLabels(chart);
    expect(labels.length).toBeGreaterThan(0);
  
    await hoverNthElement(labels, 1);

    await waitFor(() => {
      const el = document.getElementById('vg-tooltip-element');
      return expect(el?.textContent).toContain('0.1');
    });
  });
});

describe('LabelWithTimeBasedTooltip', () => {

  test('tooltip should be included with the axis', async () => {
    render(<LabelWithTimeBasedTooltip {...LabelWithTooltip.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const el = document.getElementById('vg-tooltip-element');
    expect(el).toBeInTheDocument();
    expect(el).toHaveClass('vg-tooltip');
  });

  test('shows tooltip when first axis label is hovered', async () => {
    render(<LabelWithTimeBasedTooltip {...LabelWithTooltip.args} />);
  
    const chart = await findChart();
    const labels = getAllAxisLabels(chart);
    expect(labels.length).toBeGreaterThan(0);
  
    await hoverNthElement(labels, 0);

    await waitFor(() => {
      const el = document.getElementById('vg-tooltip-element');
      return expect(el?.textContent).toContain('Nov 8, 2022');
    });
  });

});
