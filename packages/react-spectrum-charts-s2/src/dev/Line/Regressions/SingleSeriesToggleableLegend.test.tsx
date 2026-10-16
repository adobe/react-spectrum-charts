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
import { View, changeset } from 'vega';

import { Chart } from '../../../Chart.js';
import { Axis, Legend, Line } from '../../../components/index.js';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import {
  act,
  clickNthElement,
  findChart,
  getAllLegendEntries,
  queryAllLegendEntries,
  render,
  waitFor,
} from '../../../test-utils/index.js';
import { lineVariationDatasets } from '../Dashboards/lineVariationData.js';
import { SingleSeriesHiddenLegendEntry } from './SingleSeriesHiddenLegendEntry.story.js';
import { SingleSeriesToggleableLegend } from './SingleSeriesToggleableLegend.story.js';

test('hiding the only legend entry preserves the line and chart layout', async () => {
  const onView = jest.fn<void, [View]>();
  render(<SingleSeriesHiddenLegendEntry {...SingleSeriesHiddenLegendEntry.args} onVegaViewReady={onView} />);
  const chart = await findChart();
  await waitFor(() => {
    expect(onView).toHaveBeenCalled();
    expect(queryAllLegendEntries(chart)).toHaveLength(0);
    expect(chart.querySelectorAll('g.line0 > path')).toHaveLength(1);
    const view = onView.mock.calls.at(-1)?.[0];
    expect(Number.isFinite(view?.width())).toBe(true);
    expect(view?.width()).toBeGreaterThan(0);
    expect(view?.height()).toBeGreaterThan(0);
    expect(chart.querySelector('g.line0 > path')?.getAttribute('d')).not.toMatch(/NaN/);
  });
});

test.each(['top', 'bottom', 'left', 'right'] as const)(
  'an empty titled %s legend stays hidden and recovers when entries return',
  async (position) => {
    const onView = jest.fn<void, [View]>();
    render(
      <Chart data={lineVariationDatasets.single} width={360} height={216} onVegaViewReady={onView}>
        <Axis position="left" grid />
        <Axis position="bottom" labelFormat="time" />
        <Line color="series" />
        <Legend hiddenEntries={['Paid search']} position={position} title="Channels" />
      </Chart>
    );
    const chart = await findChart();
    await waitFor(() => expect(onView).toHaveBeenCalled());
    const view = onView.mock.calls[0][0];
    const getVisibleTitle = () =>
      Array.from(chart.querySelectorAll('.role-legend-title text'))
        .filter((text) => !text.closest('[display="none"]'))
        .map((text) => text.textContent)
        .join('');
    const expectHiddenLegend = () => {
      expect(queryAllLegendEntries(chart).filter((entry) => !entry.closest('[display="none"]'))).toHaveLength(0);
      expect(getVisibleTitle()).not.toContain('Channels');
      expect(chart.querySelectorAll('g.line0 > path')).toHaveLength(1);
      expect(view.width()).toBeGreaterThan(0);
      expect(view.height()).toBeGreaterThan(0);
      expect(view.height()).toBeLessThanOrEqual(216);
    };
    await waitFor(expectHiddenLegend);

    const hiddenData = lineVariationDatasets.single.map(({ datetime, value, series }) => ({ datetime, value, series }));
    const visibleData = hiddenData.map((row) => ({ ...row, series: 'Email' }));
    await act(async () => {
      await view
        .change(
          'table',
          changeset()
            .remove(() => true)
            .insert(visibleData)
        )
        .runAsync();
    });
    await waitFor(() => {
      expect(queryAllLegendEntries(chart)).toHaveLength(1);
      expect(getVisibleTitle()).toContain('Channels');
      expect(view.width()).toBeGreaterThan(0);
      expect(view.height()).toBeGreaterThan(0);
    });

    await act(async () => {
      await view
        .change(
          'table',
          changeset()
            .remove(() => true)
            .insert(hiddenData)
        )
        .runAsync();
    });
    await waitFor(expectHiddenLegend);
  }
);

test.each([false, true])('single-series toggling preserves valid axes with animations=%s', async (animations) => {
  const onView = jest.fn<void, [View]>();
  render(
    <SingleSeriesToggleableLegend
      {...SingleSeriesToggleableLegend.args}
      animations={animations}
      onVegaViewReady={onView}
    />
  );
  const chart = await findChart();
  const getLines = () => chart.querySelectorAll('g.line0 > path');
  const expectValidAxes = async () => {
    await waitFor(() => {
      const view = onView.mock.calls.at(-1)?.[0];
      expect(view).toBeDefined();
      expect(view?.scale('xTime').domain().map(Number)).toEqual([expect.any(Number), expect.any(Number)]);
      expect(
        view
          ?.scale('xTime')
          .domain()
          .every((value) => Number.isFinite(Number(value)))
      ).toBe(true);
      expect(view?.scale('yLinear').domain().at(-1)).toBeGreaterThan(4000);
      expect(chart.querySelectorAll('.role-axis-label text').length).toBeGreaterThan(2);
    });
  };
  await waitFor(() => expect(getAllLegendEntries(chart)).toHaveLength(1));
  await waitFor(() => expect(getLines()).toHaveLength(0));
  await expectValidAxes();

  await clickNthElement(getAllLegendEntries(chart), 0);
  await waitFor(() => expect(getLines()).toHaveLength(1));
  await expectValidAxes();
  await clickNthElement(getAllLegendEntries(chart), 0);
  await waitFor(() => expect(getLines()).toHaveLength(0));
  await expectValidAxes();
  await clickNthElement(getAllLegendEntries(chart), 0);
  await waitFor(() => expect(getLines()).toHaveLength(1));
  await expectValidAxes();
});
