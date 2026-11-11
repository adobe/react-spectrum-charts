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
import { act } from '@testing-library/react';
import { View } from 'vega';

import { Chart } from '../../../../../Chart.js';
import { Scatter, Trendline } from '../../../../../lab/index.js';
import { TrendlineAnnotation } from '../../../../../lab/components/TrendlineAnnotation/index.js';
import { findAllMarksByGroupName, findChart, render } from '../../../../../test-utils/index.js';
import { Badge, Basic } from './TrendlineAnnotation.story.js';

type SceneItem = { opacity: number; bounds: { y1: number }; items?: SceneMark[] };
type SceneMark = { name?: string; items: SceneItem[] };

describe('TrendlineAnnotation', () => {
  // TrendlineAnnotation is not a real React component. This is test just provides test coverage for sonarqube
  test('TrendlineAnnotation pseudo element', () => {
    render(<TrendlineAnnotation />);
  });

  test('Badge renders a badged label for each trendline', async () => {
    render(<Badge {...Badge.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // one label is drawn per weightClass facet trendline
    const labels = await findAllMarksByGroupName(chart, 'scatter0Trendline0Annotation0', 'text');
    expect(labels.length).toBeGreaterThan(0);
    expect(chart.querySelector('.scatter0Trendline0Annotation0_badge')).toBeInTheDocument();
  });

  test('renders labels without badges when badge is false', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();

    const labels = await findAllMarksByGroupName(chart, 'scatter0Trendline0Annotation0', 'text');
    expect(labels.length).toBeGreaterThan(0);
    expect(chart.querySelector('.scatter0Trendline0Annotation0_badge')).not.toBeInTheDocument();
  });

  test('a label that cannot be placed stays inside the plot, so the layout is stable', async () => {
    // both series share a median, so one of the two labels has nowhere to go
    const data = [1, 2, 3, 4].flatMap((x) => [
      { x, value: 4, series: 'a' },
      { x, value: 4, series: 'b' },
    ]);
    let view: View | undefined;
    render(
      <Chart data={data} width={400} height={300} animations={false} onVegaViewReady={(v) => (view = v)}>
        <Scatter dimension="x" metric="value" color="series">
          <Trendline method="median">
            <TrendlineAnnotation prefix="Trend" />
          </Trendline>
        </Scatter>
      </Chart>
    );
    await findChart();

    const getLabels = async () => {
      await act(async () => {
        await view?.runAsync();
      });
      const { root } = view?.scenegraph() as unknown as { root: SceneMark };
      const group = root.items[0].items?.find(({ name }) => name === 'scatter0Trendline0Annotation0_group');
      const labels = group?.items[0].items?.find(({ name }) => name === 'scatter0Trendline0Annotation0');
      return labels?.items ?? [];
    };

    const first = await getLabels();
    expect(first.some(({ opacity }) => opacity === 0)).toBe(true);
    expect(first.every(({ bounds }) => bounds.y1 >= 0)).toBe(true);
    const snapshot = JSON.stringify(first.map(({ opacity, bounds }) => ({ opacity, bounds })));
    expect(JSON.stringify((await getLabels()).map(({ opacity, bounds }) => ({ opacity, bounds })))).toBe(snapshot);
  });
});
