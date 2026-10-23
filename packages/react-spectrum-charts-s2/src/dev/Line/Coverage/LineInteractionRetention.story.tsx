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
import { ReactElement, useCallback, useMemo, useRef } from 'react';

import { StoryFn } from '@storybook/react';
import { View } from 'vega';

import { Chart } from '../../../Chart.js';
import { Axis, ChartPopover, Legend, Line } from '../../../components/index.js';

type StoryArgs = {
  renderer: 'svg' | 'canvas';
  lineType: 'solid' | 'dashed';
  highlightedSeries?: string;
  valueScale: number;
};

export default {
  title: 'React Spectrum Charts 2/Line/Coverage/Interaction Retention',
  tags: ['alpha'],
  argTypes: {
    renderer: { control: 'inline-radio', options: ['svg', 'canvas'] },
    lineType: { control: 'inline-radio', options: ['solid', 'dashed'] },
    highlightedSeries: { control: 'select', options: [undefined, 'a', 'b', 'c'] },
    valueScale: { control: 'number' },
  },
};

const data = [
  { datetime: 1, value: 3, series: 'a' },
  { datetime: 2, value: 5, series: 'a' },
  { datetime: 1, value: 2, series: 'b' },
  { datetime: 2, value: 4, series: 'b' },
  { datetime: 1, value: 1, series: 'c' },
  { datetime: 2, value: 2, series: 'c' },
];

// Used by browser/interactionRetention.spec.ts, which reads the status line.
// The status is written to the DOM rather than React state, so the chart only re-renders when args change.
const InteractionRetentionStory: StoryFn<StoryArgs> = ({
  renderer,
  lineType,
  highlightedSeries,
  valueScale,
}): ReactElement => {
  const status = useRef<HTMLOutputElement>(null);
  const views = useRef(0);

  const onVegaViewReady = useCallback((view: View) => {
    const showHiddenSeries = (hiddenSeries: string[] = []) => {
      if (!status.current) return;
      status.current.dataset.hiddenSeries = hiddenSeries.join(',');
      status.current.textContent = `Views: ${views.current}. Hidden series: ${hiddenSeries.join(', ') || 'none'}.`;
    };
    views.current += 1;
    if (status.current) status.current.dataset.views = String(views.current);
    showHiddenSeries(view.signal('hiddenSeries'));
    view.addSignalListener('hiddenSeries', (_, value: string[]) => showHiddenSeries(value));
  }, []);

  const args = { renderer, lineType, highlightedSeries, valueScale };
  const scaledData = useMemo(() => data.map((row) => ({ ...row, value: row.value * valueScale })), [valueScale]);

  return (
    <div>
      <Chart
        data={scaledData}
        width={400}
        height={300}
        animations={false}
        renderer={renderer}
        highlightedSeries={highlightedSeries}
        onVegaViewReady={onVegaViewReady}
      >
        <Axis position="left" />
        <Axis position="bottom" />
        <Line dimension="datetime" metric="value" color="series" lineType={{ value: lineType }} scaleType="linear">
          <ChartPopover>{(datum) => <div>Popover {String(datum.series)}</div>}</ChartPopover>
        </Line>
        <Legend isToggleable />
      </Chart>
      <output ref={status} data-testid="retention-status" data-args={JSON.stringify(args)} />
    </div>
  );
};

const Default = InteractionRetentionStory.bind({});
Default.args = { renderer: 'svg', lineType: 'solid', valueScale: 1 };

export { Default };
