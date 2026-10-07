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

import { StoryFn } from '@storybook/react';

import { Chart } from '../../../Chart.js';
import { ChartInspect, Legend, Line } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { workspaceTrendsData } from '../../../storyShared/data/data.js';
import { formatTimestamp } from '../../../storyShared/storyUtils.js';
import { bindWithProps } from '../../../test-utils/index.js';
import { ChartProps } from '../../../types/index.js';

export default {
  title: 'React Spectrum Charts 2/Line/Coverage/Inspect',
  component: Line,
  parameters: { controls: { include: ['dimension', 'metric', 'color', 'scaleType'] } },
};

const defaultChartProps: ChartProps = { data: workspaceTrendsData, minWidth: 400, maxWidth: 800, height: 400 };

const defaultArgs = {
  color: 'series',
  name: 'line0',
  onClick: undefined,
};

const BasicLineStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Line {...args} />
      <Legend lineWidth={{ value: 0 }} />
    </Chart>
  );
};

const Inspect = bindWithProps(BasicLineStory);
Inspect.args = {
  ...defaultArgs,
  children: (
    <ChartInspect>
      {(datum) => (
        <div className="bar-tooltip">
          <div>{formatTimestamp(datum.datetime as number)}</div>
          <div>Event: {datum.series}</div>
          <div>Users: {Number(datum.value).toLocaleString()}</div>
        </div>
      )}
    </ChartInspect>
  ),
};

const ItemInspect = bindWithProps(BasicLineStory);
ItemInspect.args = {
  ...Inspect.args,
  interactionMode: 'item',
};

export { Inspect, ItemInspect };
