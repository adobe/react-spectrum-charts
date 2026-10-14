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

import { FADE_FACTOR } from '@spectrum-charts/core-s2/constants';

import { Chart } from '../../../../Chart.js';
import { Axis, Bar, Legend } from '../../../../components/index.js';
import { findAllMarksByGroupName, findChart, render, waitFor } from '../../../../test-utils/index.js';
import {
  ControlledLegend,
  Dodged,
  DualMetricAxis,
  HorizontalDodged,
  HorizontalStacked,
  LeftLegend,
  LegendNavigation,
  WithPopoverAndDescriptions,
} from './LegendNavigation.story.js';

const focusedNode = (container: HTMLElement) =>
  container.querySelector('.dn-node:focus') ?? (document.activeElement as HTMLElement | null);

/** The focused node's accessible name (data-navigator puts it on the node's inner `.dn-node-text`). */
const focusedLabel = (container: HTMLElement) => focusedNode(container)?.querySelector('.dn-node-text')?.getAttribute('aria-label');

const press = (container: HTMLElement, code: string) => {
  const node = focusedNode(container) as HTMLElement;
  fireEvent.keyDown(node, { key: code === 'Space' ? ' ' : code, code });
};

const WINDOWS_BARS = 'Browser: Chrome, Downloads: 7. Browser: Firefox, Downloads: 10. Browser: Safari, Downloads: 2. Browser: Edge, Downloads: 5.';
const WINDOWS = `Operating system: Windows. ${WINDOWS_BARS}`;

const enterChartRoot = async (Story: typeof LegendNavigation | (() => ReactElement) = LegendNavigation) => {
  render('args' in Story ? <Story {...Story.args} /> : <Story />);
  const chart = await findChart();
  const container = chart.closest('.rsc-container') as HTMLElement;
  await waitFor(() => expect(container.querySelector('.dn-entry-button')).toBeTruthy());
  (container.querySelector('.dn-entry-button') as HTMLButtonElement).click();
  await waitFor(() => expect(container.querySelector('.dn-node')).toBeTruthy());
  return { chart, container };
};

const enterLegendRegion = async (Story: Parameters<typeof enterChartRoot>[0] = LegendNavigation) => {
  const { chart, container } = await enterChartRoot(Story);
  // Chart root → x-axis root (below) → bottom legend root (below the axis). Horizontal charts have no x-axis region.
  press(container, 'ArrowDown');
  if (!focusedLabel(container)?.includes('legend')) press(container, 'ArrowDown');
  await waitFor(() => expect(focusedLabel(container)).toContain('Operating system legend'));
  return { chart, container };
};

describe('Legend keyboard navigation', () => {
  test('a left legend is reached with Left from the chart root, and Right comes back', async () => {
    const { container } = await enterChartRoot(LeftLegend);
    press(container, 'ArrowRight');
    expect(focusedLabel(container)).not.toContain('legend');
    press(container, 'ArrowLeft');
    await waitFor(() => expect(focusedLabel(container)).toContain('Operating system legend'));
    press(container, 'ArrowRight');
    await waitFor(() => expect(focusedLabel(container)).not.toContain('legend'));
  });

  test('rings the whole legend on the legend root', async () => {
    const { container } = await enterLegendRegion();
    const ring = container.querySelector('.dn-legend-focus-ring') as HTMLElement;
    expect(ring.style.display).toBe('block');
    expect(focusedLabel(container)).toBe('Operating system legend. 8 series.');
  });

  test('Enter drills into the first series and arrows walk the rendered entries', async () => {
    const { container } = await enterLegendRegion();
    press(container, 'Enter');
    await waitFor(() => expect(focusedLabel(container)).toBe(WINDOWS));

    press(container, 'ArrowRight');
    await waitFor(() => expect(focusedLabel(container)).toMatch(/^Operating system: macOS\. Browser: Chrome, Downloads: \d+\./));

    press(container, 'ArrowLeft');
    await waitFor(() => expect(focusedLabel(container)).toBe(WINDOWS));
    // No wraparound.
    press(container, 'ArrowLeft');
    expect(focusedLabel(container)).toBe(WINDOWS);
  });

  test("Enter on a series drills into its bars, which show the bar's own focus ring", async () => {
    const { chart, container } = await enterLegendRegion();
    press(container, 'Enter');
    await waitFor(() => expect(focusedLabel(container)).toBe(WINDOWS));
    press(container, 'Enter');
    await waitFor(async () => {
      const rings = await findAllMarksByGroupName(chart, 'bar0_focusRing');
      expect(rings.some((ring) => ring.getAttribute('opacity') === '1')).toBe(true);
    });
    expect((container.querySelector('.dn-legend-focus-ring') as HTMLElement).style.display).toBe('none');

    // The first Escape dismisses the bar's focus tooltip (WCAG 2.2 SC 1.4.13) if it's showing; the next drills out.
    press(container, 'Escape');
    if (focusedLabel(container) !== WINDOWS) press(container, 'Escape');
    await waitFor(() => expect(focusedLabel(container)).toBe(WINDOWS));
  });

  test('Space toggles a series off, keeping focus on it', async () => {
    const { container } = await enterLegendRegion();
    press(container, 'Enter');
    await waitFor(() => expect(focusedLabel(container)).toBe(WINDOWS));
    press(container, 'Space');
    await waitFor(() => expect(focusedLabel(container)).toBe('Operating system: Windows. Hidden.'));

    // A hidden series isn't drillable.
    press(container, 'Enter');
    expect(focusedLabel(container)).toBe('Operating system: Windows. Hidden.');

    press(container, 'Space');
    await waitFor(() => expect(focusedLabel(container)).toBe(`Operating system: Windows. Shown. ${WINDOWS_BARS}`));
    // Later re-renders keep the announcement until the next key press.
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(focusedLabel(container)).toBe(`Operating system: Windows. Shown. ${WINDOWS_BARS}`);
  });

  test('a series reads its legend description after its name', async () => {
    const { container } = await enterLegendRegion(WithPopoverAndDescriptions);
    press(container, 'Enter');
    await waitFor(() => expect(focusedLabel(container)).toBe(`Operating system: Windows. Windows downloads. ${WINDOWS_BARS}`));
  });

  test('a non-first legend reads its display labels and drives its own highlight', async () => {
    const data = [
      { browser: 'Chrome', operatingSystem: 'Windows', downloads: 7 },
      { browser: 'Chrome', operatingSystem: 'macOS', downloads: 3 },
      { browser: 'Firefox', operatingSystem: 'Windows', downloads: 4 },
      { browser: 'Firefox', operatingSystem: 'macOS', downloads: 5 },
    ];
    const NamedLegendChart = () => (
      <Chart data={data} width={600} height={400} accessibleNavigation>
        <Axis position="bottom" title="Browser" />
        <Axis position="left" title="Downloads" />
        <Bar dimension="browser" metric="downloads" color="operatingSystem" />
        <Legend color="browser" position="top" />
        <Legend
          title="Operating system"
          highlight
          legendLabels={[{ seriesName: 'Windows', label: 'Microsoft Windows' }]}
        />
      </Chart>
    );
    const { chart, container } = await enterLegendRegion(NamedLegendChart);
    press(container, 'Enter');
    await waitFor(() =>
      expect(focusedLabel(container)).toBe(
        'Operating system: Microsoft Windows. Browser: Chrome, Downloads: 7. Browser: Firefox, Downloads: 4.'
      )
    );

    const bars = await findAllMarksByGroupName(chart, 'bar0');
    await waitFor(() => {
      expect(bars.filter((bar) => bar.getAttribute('opacity') === `${FADE_FACTOR}`)).toHaveLength(2);
    });
  });

  describe('controlled legend', () => {
    const WINDOWS_DESCRIBED = `Operating system: Windows. Windows downloads. ${WINDOWS_BARS}`;

    test('focusing a series drives controlled highlightedSeries through onMouseOver/onMouseOut', async () => {
      const { chart, container } = await enterLegendRegion(ControlledLegend);
      press(container, 'Enter');
      await waitFor(() => expect(focusedLabel(container)).toBe(WINDOWS_DESCRIBED));

      const bars = await findAllMarksByGroupName(chart, 'bar0');
      await waitFor(() => expect(bars.filter((bar) => bar.getAttribute('opacity') === `${FADE_FACTOR}`)).toHaveLength(bars.length - 4));

      press(container, 'Escape');
      if (focusedLabel(container) === WINDOWS_DESCRIBED) press(container, 'Escape'); // first Escape may dismiss the tooltip
      await waitFor(async () => {
        const current = await findAllMarksByGroupName(chart, 'bar0');
        expect(current.some((bar) => bar.getAttribute('opacity') === `${FADE_FACTOR}`)).toBe(false);
      });
    });

    test('Space toggles controlled hiddenSeries through onClick and announces it', async () => {
      const { container } = await enterLegendRegion(ControlledLegend);
      press(container, 'Enter');
      await waitFor(() => expect(focusedLabel(container)).toBe(WINDOWS_DESCRIBED));

      press(container, 'Space');
      await waitFor(() => expect(focusedLabel(container)).toBe('Operating system: Windows. Hidden. Windows downloads.'));
      await waitFor(() => expect(focusedLabel(container)).toBe('Operating system: Windows. Hidden. Windows downloads.'));

      press(container, 'Space');
      await waitFor(() => expect(focusedLabel(container)).toBe(`Operating system: Windows. Shown. Windows downloads. ${WINDOWS_BARS}`));
    });
  });

  test.each([
    ['HorizontalStacked', HorizontalStacked],
    ['Dodged', Dodged],
    ['HorizontalDodged', HorizontalDodged],
    ['DualMetricAxis', DualMetricAxis],
  ])('%s: drills from the legend into the first series bar', async (_, Story) => {
    const { chart, container } = await enterLegendRegion(Story);
    press(container, 'Enter');
    await waitFor(() => expect(focusedLabel(container)).toMatch(/^Operating system: Windows\. Browser: Chrome/));
    press(container, 'Enter');
    await waitFor(() => expect(focusedLabel(container)).toContain('Browser: Chrome'));
    await waitFor(async () => {
      const rings = await findAllMarksByGroupName(chart, 'bar0_focusRing');
      expect(rings.some((ring) => ring.getAttribute('opacity') === '1')).toBe(true);
    });
  });
});
