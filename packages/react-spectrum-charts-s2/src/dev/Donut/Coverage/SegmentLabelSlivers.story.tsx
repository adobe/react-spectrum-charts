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
import { Legend } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { Donut, SegmentLabel } from '../../../pre-alpha/index.js';
import { sliveredDonutData } from '../../../storyShared/Donut/data.js';
import { bindWithProps } from '../../../test-utils/index.js';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Donut/Coverage/Segment Label',
  component: SegmentLabel,
};

// fixed-size chart with many thin segments, formerly the Segment Label demo's Slivers story
const SliversStory: StoryFn<typeof SegmentLabel> = (args): ReactElement => {
  const chartProps = useChartProps({ data: sliveredDonutData, width: 640, height: 460 });
  return (
    <Chart {...chartProps}>
      <Donut metric="count" color="browser">
        <SegmentLabel {...args} />
      </Donut>
      <Legend title="Browsers" position="right" highlight />
    </Chart>
  );
};

const Slivers = bindWithProps(SliversStory);
Slivers.args = { percent: true, value: true, valueFormat: 'shortNumber' };

export { Slivers };
