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
import { Axis, Bar, ChartInspect, Legend } from '../../../components/index.js';
import { ReferenceLine } from '../../../components/ReferenceLine/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { channelConversionsData } from '../../../storyShared/components/Bar/data.js';
import { bindStory } from './storyUtils.js';

export default {
  title: 'React Spectrum Charts 2/Bar/Examples',
  component: Bar,
};

const ConversionsVsTargetStory: StoryFn<typeof ReferenceLine> = (args): ReactElement => {
  const chartProps = useChartProps({ data: channelConversionsData, width: 640, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Conversions">
        <ReferenceLine {...args} />
      </Axis>
      <Axis position="bottom" baseline title="Acquisition channel" />
      <Bar dimension="channel" metric="conversions" color="series">
        <ChartInspect>
          {(datum) => (
            <div>
              {datum.channel}: {Number(datum.conversions).toLocaleString()} conversions
            </div>
          )}
        </ChartInspect>
      </Bar>
      <Legend title="Metric" />
    </Chart>
  );
};

// A labeled target reference line on the metric axis, with a tooltip on each channel.
const ConversionsVsTarget = bindStory(ConversionsVsTargetStory);
ConversionsVsTarget.args = { value: 2500, label: 'Target' };
ConversionsVsTarget.parameters = { controls: { include: ['value', 'label'] } };

export { ConversionsVsTarget };
