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
import { spectrumColors } from '@spectrum-charts/themes';

import { MetricRange } from '../../../components';
import {
  clickNthElement,
  findAllMarksByGroupName,
  findChart,
  findMarksByGroupName,
  getAllLegendEntries,
  hoverNthElement,
  queryMarksByGroupName,
  render,
  unhoverNthElement,
} from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { Basic, DisplayOnHover, WithPopover } from './MetricRange.story';

const colors = spectrumColors.light;

describe('MetricRange', () => {
  // MetricRange is not a real React component. This is test just provides test coverage for sonarqube
  test('MetricRange pseudo element', () => {
    render(<MetricRange metricEnd="100" metricStart="0" />);
  });

  test('Basic renders properly', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const areas = await findAllMarksByGroupName(chart, 'line0MetricRange0_area');
    expect(areas[0]).toHaveAttribute('opacity', '1');
    expect(areas[0]).toHaveAttribute('fill-opacity', '0.2');
    expect(areas[0]).toHaveAttribute('fill', colors['categorical-100']);
    expect(areas[1]).toHaveAttribute('fill', colors['categorical-200']);

    const lines = await findAllMarksByGroupName(chart, 'line0MetricRange0_line');
    expect(lines[0]).toHaveAttribute('stroke-opacity', '1');
    expect(lines[0]).toHaveAttribute('stroke-dasharray', '3,4');
    expect(lines[0]).toHaveAttribute('stroke-width', '1.5');
    expect(lines[0]).toHaveAttribute('stroke', colors['categorical-100']);
    expect(lines[1]).toHaveAttribute('stroke', colors['categorical-200']);
  });

  test('DisplayOnHover renders properly', async () => {
    render(<DisplayOnHover {...DisplayOnHover.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    expect(queryMarksByGroupName(chart, 'line0MetricRange0_line')).not.toBeInTheDocument();
    expect(queryMarksByGroupName(chart, 'line0MetricRange0_area')).not.toBeInTheDocument();

    const points = await findAllMarksByGroupName(chart, 'line0_voronoi');
    await hoverNthElement(points, 0);

    let line = await findMarksByGroupName(chart, 'line0MetricRange0_line');
    expect(line).toHaveAttribute('stroke', colors['categorical-100']);
    expect(line).toHaveAttribute('stroke-dasharray', '3,4');
    expect(line).toHaveAttribute('stroke-width', '1.5');

    let area = await findMarksByGroupName(chart, 'line0MetricRange0_area');
    expect(area).toHaveAttribute('fill', colors['categorical-100']);
    expect(area).toHaveAttribute('fill-opacity', '0.2');

    await unhoverNthElement(points, 0);
    await hoverNthElement(points, 7);

    line = await findMarksByGroupName(chart, 'line0MetricRange0_line');
    expect(line).toHaveAttribute('stroke', colors['categorical-200']);

    area = await findMarksByGroupName(chart, 'line0MetricRange0_area');
    expect(area).toHaveAttribute('fill', colors['categorical-200']);

    await unhoverNthElement(points, 7);

    const legendEntries = getAllLegendEntries(chart);
    await hoverNthElement(legendEntries, 0);

    line = await findMarksByGroupName(chart, 'line0MetricRange0_line');
    expect(line).toHaveAttribute('stroke', colors['categorical-100']);
    expect(line).toHaveAttribute('stroke-dasharray', '3,4');
    expect(line).toHaveAttribute('stroke-width', '1.5');
  });

  test('Hovered range stays active with popover', async () => {
    render(<WithPopover {...WithPopover.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const points = await findAllMarksByGroupName(chart, 'line0_voronoi');
    await clickNthElement(points, 0);

    const metricRangeAreas = await findAllMarksByGroupName(chart, 'line0MetricRange0_area');
    expect(metricRangeAreas[0]).toHaveAttribute('opacity', '1');
    expect(metricRangeAreas[0]).toHaveAttribute('fill-opacity', '0.2');

    const metricRangeLines = await findAllMarksByGroupName(chart, 'line0MetricRange0_line');
    expect(metricRangeLines[0]).toHaveAttribute('stroke-opacity', '1');
  });
});
