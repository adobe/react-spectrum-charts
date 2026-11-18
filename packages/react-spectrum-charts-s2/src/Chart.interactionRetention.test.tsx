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
import { HOVER_ANIMATING, SELECTED_ITEM, SELECTED_SERIES } from '@spectrum-charts/core-s2/constants';

import { Chart } from './Chart.js';
import { Axis, ChartInspect, ChartPopover, Legend, Line } from './components/index.js';
import usePrefersReducedMotion from './hooks/usePrefersReducedMotion.js';
import {
  clickNthElement,
  enableDrawIn,
  findAllMarksByGroupName,
  findChart,
  getAllLegendEntries,
  getScene,
  hoverNthElement,
  screen,
  setupChartHarness,
  waitFor,
} from './test-utils/index.js';
import { ChartProps } from './types/index.js';

type Row = { datetime: number; value: number; series: string };
type Props = Partial<ChartProps> & { defaultHiddenSeries?: string[] };

const data: Row[] = [
  { datetime: 1, value: 3, series: 'a' },
  { datetime: 2, value: 5, series: 'a' },
  { datetime: 1, value: 2, series: 'b' },
  { datetime: 2, value: 4, series: 'b' },
  { datetime: 1, value: 1, series: 'c' },
  { datetime: 2, value: 2, series: 'c' },
];
const withoutA = data.filter((row) => row.series !== 'a');

// one change of each update class in the RFC's state retention table, split by whether selection is kept
const keepingUpdates: [string, Props][] = [
  ['a no-op', {}],
  ['equal data in a new array', { data: data.map((row) => ({ ...row })) }],
  ['a signal update', { highlightedSeries: 'b' }],
];
const clearingUpdates: [string, Props][] = [
  ['a data update', { data: data.map((row) => ({ ...row, value: row.value * 2 })) }],
  ['a rebuild', { title: 'Retitled' }],
];
const updates: [string, Props][] = [...keepingUpdates, ...clearingUpdates];

const harness = setupChartHarness();

// Canvas clicks after a rebuild are covered by browser/interactionRetention.test.ts, which needs real hit-testing.
describe('svg renderer', () => {
  const chart = ({ defaultHiddenSeries, ...props }: Props = {}) => (
    <Chart data={data} width={400} height={300} animations={false} onVegaViewReady={harness.onVegaViewReady} {...props}>
      <Axis position="left" />
      <Axis position="bottom" />
      <Line dimension="datetime" metric="value" color="series" scaleType="linear">
        <ChartPopover>{(datum) => <div>Popover {String(datum.series)}</div>}</ChartPopover>
      </Line>
      <Legend isToggleable defaultHiddenSeries={defaultHiddenSeries} />
    </Chart>
  );

  const hideSeriesA = async () => {
    await clickNthElement(getAllLegendEntries(await findChart()), 0);
    await harness.settle();
  };

  const openPopoverOnSeriesA = async () => {
    await clickNthElement(await findAllMarksByGroupName(await findChart(), 'line0_voronoi'), 1);
    await screen.findByTestId('rsc-popover');
    await harness.settle();
  };

  describe('legend hidden series', () => {
    test.each(updates)('stays hidden after %s', async (_, props) => {
      const { updated, fresh, updatedView } = await harness.compareUpdateToMount(chart, {}, props, {
        interact: hideSeriesA,
        expected: { ...props, defaultHiddenSeries: ['a'] },
      });

      expect(updatedView.signal('hiddenSeries')).toEqual(['a']);
      expect(updated).toEqual(fresh);
    });

    test('shows again after its data is removed and restored', async () => {
      const mounted = await harness.mount(chart());
      await hideSeriesA();

      await harness.update(mounted, chart({ data: withoutA }));
      await harness.update(mounted, chart());

      expect(harness.latestView().signal('hiddenSeries')).toEqual([]);
      const updated = getScene(harness.latestView());
      mounted.unmount();
      const fresh = await harness.mount(chart());
      expect(updated).toEqual(getScene(harness.latestView()));
      fresh.unmount();
    });
  });

  describe('open popover', () => {
    test.each(keepingUpdates)('stays open after %s', async (_, props) => {
      const mounted = await harness.mount(chart());
      await openPopoverOnSeriesA();
      const selectedItem = harness.latestView().signal(SELECTED_ITEM);

      await harness.update(mounted, chart(props));

      expect(screen.getByTestId('rsc-popover')).toHaveTextContent('Popover a');
      expect(harness.latestView().signal(SELECTED_ITEM)).toBe(selectedItem);
      expect(harness.latestView().signal(SELECTED_SERIES)).toBe('a');
      mounted.unmount();
    });

    test.each([...clearingUpdates, ['its series is removed', { data: withoutA }] as [string, Props]])(
      'closes after %s',
      async (_, props) => {
        const mounted = await harness.mount(chart());
        await openPopoverOnSeriesA();

        await harness.update(mounted, chart(props));

        expect(screen.queryByTestId('rsc-popover')).toBeNull();
        expect(harness.latestView().signal(SELECTED_ITEM)).toBeNull();
        expect(harness.latestView().signal(SELECTED_SERIES)).toBeNull();
        mounted.unmount();
      }
    );
  });

  describe('hover and inspect tooltip', () => {
    const inspectChart = (props: Props = {}) => (
      <Chart
        data={data}
        width={400}
        height={300}
        animations={false}
        onVegaViewReady={harness.onVegaViewReady}
        {...props}
      >
        <Line dimension="datetime" metric="value" color="series" scaleType="linear">
          <ChartInspect>{(datum) => <div>Inspect {String(datum.series)}</div>}</ChartInspect>
        </Line>
      </Chart>
    );
    const isTooltipVisible = () => Boolean(document.querySelector('.vg-tooltip.visible'));

    const hoverSeriesA = async () => {
      await hoverNthElement(await findAllMarksByGroupName(await findChart(), 'line0_voronoi'), 1);
      await waitFor(() => expect(isTooltipVisible()).toBe(true));
      await harness.settle();
    };

    afterEach(() => document.querySelectorAll('.vg-tooltip').forEach((node) => node.remove()));

    test.each(keepingUpdates)('stays after %s', async (_, props) => {
      const mounted = await harness.mount(inspectChart());
      await hoverSeriesA();

      await harness.update(mounted, inspectChart(props));

      expect(harness.latestView().signal('line0_hoveredItem')).not.toBeNull();
      expect(isTooltipVisible()).toBe(true);
      mounted.unmount();
    });

    describe('with animations', () => {
      beforeEach(enableDrawIn);
      afterEach(() => jest.mocked(usePrefersReducedMotion).mockReturnValue(true));

      test('settles the hover fade after a data update', async () => {
        const animated = (props: Props) => inspectChart({ ...props, animations: true });
        const { updated, fresh, updatedView } = await harness.compareUpdateToMount(
          animated,
          {},
          clearingUpdates[0][1],
          {
            interact: hoverSeriesA,
          }
        );

        expect(updatedView.signal(HOVER_ANIMATING)).toBeFalsy();
        expect(updated).toEqual(fresh);
      });
    });

    test.each(clearingUpdates)('resets after %s', async (_, props) => {
      const mounted = await harness.mount(inspectChart());
      await hoverSeriesA();

      await harness.update(mounted, inspectChart(props));

      expect(harness.latestView().signal('line0_hoveredItem')).toBeNull();
      expect(isTooltipVisible()).toBe(false);
      mounted.unmount();
    });
  });
});
