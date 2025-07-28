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
import React from 'react';

import { spectrumColors } from '@spectrum-charts/themes';

import { AxisAnnotation } from '../../../components';
import { clickNthElement, findAllMarksByGroupName, findChart, render, screen } from '../../../test-utils';
import { Basic, Color, ColorOptions, Format, Popover } from './AxisAnnotation.story';

const colors = spectrumColors.light;

describe('AxisAnnotation', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // AxisAnnotation is not a real React component. This is test just provides test coverage for sonarqube
  test('AxisAnnoation pseudo element', () => {
    render(<AxisAnnotation />);
  });

  test('Basic renders correctly', async () => {
    render(<Basic {...Basic.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const annotations = await findAllMarksByGroupName(chart, 'axis1Annotation0_icon');
    expect(annotations).toHaveLength(3);
  });

  test('Annotations render in the correct color', async () => {
    render(<Color {...Color.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const annotations = await findAllMarksByGroupName(chart, 'axis1Annotation0_icon');
    expect(annotations).toHaveLength(3);

    expect(annotations[0]).toHaveAttribute('fill', colors['celery-600']);
  });

  test('Annotations render in the correct color when using color options', async () => {
    render(<ColorOptions {...ColorOptions.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const annotations = await findAllMarksByGroupName(chart, 'axis1Annotation0_icon');
    expect(annotations).toHaveLength(3);

    expect(annotations[0]).toHaveAttribute('fill', colors['magenta-600']);
    expect(annotations[1]).toHaveAttribute('fill', colors['fuscia-600']);
    expect(annotations[2]).toHaveAttribute('fill', colors['gray-600']);
  });

  test('Summary icon renders correctly', async () => {
    render(<Format {...Format.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const annotations = await findAllMarksByGroupName(chart, 'axis1Annotation0_icon');
    expect(annotations).toHaveLength(1);

    expect(annotations[0]).toHaveAttribute('fill', colors['gray-600']);
  });

  test('Popover renders correctly', async () => {
    render(<Popover {...Popover.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const annotations = await findAllMarksByGroupName(chart, 'axis1Annotation0_icon');
    expect(annotations).toHaveLength(3);

    let popover = screen.queryByTestId('rsc-popover');
    expect(popover).not.toBeInTheDocument();

    clickNthElement(annotations, 0);
    popover = await screen.findByTestId('rsc-popover');
    expect(popover).toBeInTheDocument();
  });
});
