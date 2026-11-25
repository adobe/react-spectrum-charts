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
import { Chart } from '../../../Chart.js';
import { Axis } from '../../../components/Axis/index.js';
import { ChartInspect } from '../../../components/ChartInspect/index.js';
import {
  clickNthElement,
  findAllMarksByGroupName,
  findChart,
  hoverNthElement,
  render,
  screen,
  within,
} from '../../../test-utils/index.js';
import { Histogram } from './Histogram.js';

// 3 rows in [0, 10), none in [10, 20), 2 in [20, 30]; null and text rows are ignored
const data = [{ ms: 1 }, { ms: 4 }, { ms: 9 }, { ms: 22 }, { ms: 30 }, { ms: null }, { ms: 'slow' }];

const renderHistogram = (props: Parameters<typeof Histogram>[0] = {}) =>
  render(
    <Chart data={data} width={400} height={300} animations={false}>
      <Axis position="left" />
      <Axis position="bottom" />
      <Histogram metric="ms" binSize={10} {...props} />
    </Chart>
  );

describe('Histogram', () => {
  // Histogram is not a real React component. This test just provides test coverage for sonarqube
  test('Histogram pseudo element', () => {
    render(<Histogram />);
  });

  test('draws a bar per bin, including empty interior bins', async () => {
    renderHistogram();
    const chart = await findChart();
    const bars = await findAllMarksByGroupName(chart, 'histogram0');
    expect(bars).toHaveLength(3);
  });

  test('titles the count axis', async () => {
    renderHistogram();
    await findChart();
    expect(await screen.findByText('Count')).toBeInTheDocument();
  });

  test('shows the bin range and count in the inspect', async () => {
    renderHistogram({
      children: (
        <ChartInspect>{(datum) => <div>{`${datum.binStart}–${datum.binEnd}: ${datum.count} rows`}</div>}</ChartInspect>
      ),
    });
    const chart = await findChart();
    const bars = await findAllMarksByGroupName(chart, 'histogram0');
    await hoverNthElement(bars, 0);
    const inspect = await screen.findByTestId('rsc-tooltip');
    expect(within(inspect).getByText('0–10: 3 rows')).toBeInTheDocument();
  });

  test('calls onClick with the clicked bin', async () => {
    const onClick = jest.fn();
    renderHistogram({ onClick });
    const chart = await findChart();
    const bars = await findAllMarksByGroupName(chart, 'histogram0');
    await clickNthElement(bars, 2);
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ binStart: 20, binEnd: 30, count: 2 }));
  });
});
