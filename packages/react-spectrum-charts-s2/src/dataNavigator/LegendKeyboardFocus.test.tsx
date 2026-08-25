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
import { ReactElement } from 'react';

import { fireEvent } from '@testing-library/react';
import { View } from 'vega';

import { Chart } from '../Chart';
import { Axis, Bar, Legend } from '../components';
import useChartProps from '../hooks/useChartProps';
import { findChart, render } from '../test-utils';
import '../test-utils/__mocks__/matchMedia.mock.js';

const data = [
  { browser: 'Chrome', downloads: 27000 },
  { browser: 'Firefox', downloads: 8000 },
  { browser: 'Safari', downloads: 4000 },
];

let capturedView: View | undefined;

const Harness = (): ReactElement => {
  const chartProps = useChartProps({
    data,
    width: 400,
    height: 400,
    accessibleNavigation: true,
    onVegaViewReady: (view: View) => {
      capturedView = view;
    },
  });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" baseline grid title="Downloads" />
      <Bar dimension="browser" metric="downloads" color="browser" />
      <Legend title="Browser" color="browser" />
    </Chart>
  );
};

describe('legend keyboard focus', () => {
  // The per-entry box ring (and that it doesn't reflow the legend) is asserted in
  // vega-spec-builder-s2's legendFocusRender.test.ts (src, not dist); here we cover the end-to-end
  // nav → signal path through the React layer, which drives the ring.
  test('drilling into a legend entry sets focusedSeries to that entry', async () => {
    const { container } = render(<Harness />);
    await findChart();

    // Enter the navigation widget, then drill into the first legend entry.
    (container.querySelector('.dn-entry-button') as HTMLButtonElement).click();
    fireEvent.keyDown(container.querySelector('.dn-node') as HTMLElement, { key: 'Enter', code: 'Enter' });
    await capturedView?.runAsync();

    expect(capturedView?.signal('focusedSeries')).toBe('Chrome');
  });

  test('entering the legend sets the focusedRegion signal for the whole-legend ring', async () => {
    const { container } = render(<Harness />);
    await findChart();

    // Entering lands on the legend root: the whole-legend ring (drawn via encode.legend keyed on
    // focusedRegion) turns on, with no individual entry highlighted yet.
    (container.querySelector('.dn-entry-button') as HTMLButtonElement).click();
    await capturedView?.runAsync();

    expect(capturedView?.signal('focusedRegion')).toBe('legend');
    expect(capturedView?.signal('focusedSeries')).toBeNull();
  });
});
