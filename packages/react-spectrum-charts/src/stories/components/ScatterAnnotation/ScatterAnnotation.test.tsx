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
import React from 'react';

import { FADE_FACTOR } from '@spectrum-charts/constants';

import { ScatterAnnotation } from '../../../components';
import { findAllMarksByGroupName, findChart, getAllLegendEntries, hoverNthElement, render } from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { Basic } from './ScatterAnnotation.story';

describe('ScatterAnnotation', () => {
  // ScatterAnnotation is not a real React component. This is test just provides test coverage for sonarqube
  test('ScatterAnnotation pseudo element', () => {
    render(<ScatterAnnotation />);
  });

  test('Basic renders properly', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const annotations = await findAllMarksByGroupName(chart, 'scatter0Annotation0', 'text');
    expect(annotations).toHaveLength(16);
    expect(annotations[0]).toHaveTextContent('Baby Peach');
    expect(annotations[1]).toHaveTextContent('Baby Rosalina');
    expect(annotations[15]).toHaveTextContent('Bowser');
  });
  test('Opacity of annotations should be the same as the scatter mark', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const legendEntries = getAllLegendEntries(chart);
    const annotations = await findAllMarksByGroupName(chart, 'scatter0Annotation0', 'text');

    expect(annotations[0]).toHaveAttribute('fill-opacity', '1');
    await hoverNthElement(legendEntries, 1);
    expect(annotations[0]).toHaveAttribute('fill-opacity', `${FADE_FACTOR}`);
  });
});
