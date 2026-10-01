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
import { findChart, getAllAxisLabels, hoverNthElement, render, screen, unhoverNthElement } from '../../../test-utils';
import { CustomTooltipText, LabelAlign, LabelOrientation, TruncatedLabelWithTooltip } from './AxisLabels.story';

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

describe('axis label tooltip', () => {
  test('hovering a truncated label shows its full, untruncated value', async () => {
    render(<TruncatedLabelWithTooltip {...TruncatedLabelWithTooltip.args} />);
    const chart = await findChart();
    const axisLabels = getAllAxisLabels(chart);

    await hoverNthElement(axisLabels, 0); // Google Chrome

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Google Chrome');
  });

  test('a per-value override shows custom text instead of the label value', async () => {
    render(<CustomTooltipText {...CustomTooltipText.args} />);
    const chart = await findChart();
    const axisLabels = getAllAxisLabels(chart);

    await hoverNthElement(axisLabels, 4); // Microsoft Explorer

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Microsoft Explorer is the most widely used browser');
  });

  test('an unlisted value still falls back to its default full label value', async () => {
    render(<CustomTooltipText {...CustomTooltipText.args} />);
    const chart = await findChart();
    const axisLabels = getAllAxisLabels(chart);

    await hoverNthElement(axisLabels, 2); // Mac Safari - not in tooltipText

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Mac Safari');
  });

  test('text: null suppresses the tooltip for that value', async () => {
    render(<CustomTooltipText {...CustomTooltipText.args} />);
    const chart = await findChart();
    const axisLabels = getAllAxisLabels(chart);

    await hoverNthElement(axisLabels, 1); // Mozilla Firefox - text: null

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  test('unhovering closes the tooltip', async () => {
    render(<TruncatedLabelWithTooltip {...TruncatedLabelWithTooltip.args} />);
    const chart = await findChart();
    const axisLabels = getAllAxisLabels(chart);

    await hoverNthElement(axisLabels, 0);
    await screen.findByRole('tooltip');

    await unhoverNthElement(axisLabels, 0);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
