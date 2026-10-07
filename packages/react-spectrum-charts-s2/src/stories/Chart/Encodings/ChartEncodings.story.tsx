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

import useChartProps from '../../../hooks/useChartProps';
import { Axis, Chart, Legend, Line } from '../../../index';
import { chartEngagementData } from '../../../storyShared/data/data';
import { bindWithProps } from '../../../test-utils';
import { ChartBarStory, StoryWithParameters, setControlInclude } from '../chartStoryTemplates';

export default {
  title: 'React Spectrum Charts 2/Chart/Features/Encodings',
  component: Chart,
  argTypes: {
    colors: { control: 'object' },
    lineTypes: { control: 'object' },
    opacities: { control: 'object' },
  },
};

const ChartLineTypeStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <Chart {...props}>
      <Axis position="bottom" baseline title="Month" />
      <Axis position="left" grid title="Accounts" />
      <Line dimension="x" metric="y" color="series" lineType="series" scaleType="point" />
      <Legend highlight />
    </Chart>
  );
};

const ChartOpacityStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <Chart {...props}>
      <Axis position="bottom" baseline title="Month" />
      <Axis position="left" grid title="Accounts" />
      <Line dimension="x" metric="y" color="series" opacity="series" scaleType="point" />
      <Legend highlight />
    </Chart>
  );
};

const Colors = bindWithProps(ChartBarStory);
Colors.args = { data: chartEngagementData, colors: ['blue-1000', 'blue-800', 'blue-600', 'blue-400'] };
setControlInclude(Colors as StoryWithParameters, ['colors']);

const LineTypes = bindWithProps(ChartLineTypeStory);
LineTypes.args = { data: chartEngagementData, lineTypes: ['solid', 'dashed', 'dotted', 'dotDash'] };
setControlInclude(LineTypes as StoryWithParameters, ['lineTypes']);

const Opacities = bindWithProps(ChartOpacityStory);
Opacities.args = { data: chartEngagementData, opacities: [1, 0.4, 0.4, 0.4] };
setControlInclude(Opacities as StoryWithParameters, ['opacities']);

export { Colors, LineTypes, Opacities };
