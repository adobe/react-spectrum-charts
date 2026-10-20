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
import { Chart } from '../Chart.js';
import { Line } from '../components/index.js';
import { getScene, setupChartHarness } from './chartStability.js';

const EMBED_DELAY_MS = 50;

jest.mock('vega-embed', () => {
  const actual = jest.requireActual('vega-embed');
  return {
    __esModule: true,
    ...actual,
    default: async (...args: Parameters<typeof actual.default>) => {
      await new Promise((resolve) => setTimeout(resolve, EMBED_DELAY_MS));
      return actual.default(...args);
    },
  };
});

const harness = setupChartHarness();

const chart = (value: number) => (
  <Chart
    data={[
      { datetime: 1, value: 1 },
      { datetime: 2, value },
    ]}
    width={400}
    height={300}
    animations={false}
    onVegaViewReady={harness.onVegaViewReady}
  >
    <Line dimension="datetime" metric="value" scaleType="linear" />
  </Chart>
);

describe('settle', () => {
  test('waits for a slow embed on mount', async () => {
    const mounted = await harness.mount(chart(2));

    expect(harness.views).toHaveLength(1);
    mounted.unmount();
  });

  test('waits for a slow embed on update', async () => {
    const { updated, fresh } = await harness.compareUpdateToMount(chart, 2, 8);

    expect(updated).toEqual(fresh);
    expect(harness.views).toHaveLength(3);
  });

  test('a slow update reaches the scene', async () => {
    const mounted = await harness.mount(chart(2));
    const before = getScene(harness.latestView());

    await harness.update(mounted, chart(8));

    expect(getScene(harness.latestView())).not.toEqual(before);
    mounted.unmount();
  });
});
