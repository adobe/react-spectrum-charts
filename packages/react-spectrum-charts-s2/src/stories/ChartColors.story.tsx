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

import { Chart } from '../Chart';
import { Axis, Bar, Legend } from '../components';
import useChartProps from '../hooks/useChartProps';
import { bindWithProps } from '../test-utils';
import { chartEngagementData } from './data/data';

type StoryWithParameters = { parameters?: { controls: { include: string[] } } };

const setControlInclude = (story: StoryWithParameters, include: string[]) => {
  story.parameters = { controls: { include } };
};

export default {
  title: 'React Spectrum Charts 2/Chart/Features/Colors',
  component: Chart,
  parameters: { controls: { include: ['colors'] } },
};

const colorData = chartEngagementData;

const ChartColorStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <Chart {...props}>
      <Axis position="bottom" baseline title="Month" />
      <Axis position="left" grid title="Accounts" />
      <Bar dimension="x" metric="y" color="series" />
      <Legend highlight />
    </Chart>
  );
};

const ColorValues = bindWithProps(ChartColorStory);
ColorValues.args = {
  colors: ['cinnamon-1200', 'cinnamon-1000', 'cinnamon-800', 'cinnamon-600'],
  data: colorData,
};
setControlInclude(ColorValues as StoryWithParameters, ['colors']);

const ColorSchemes = bindWithProps(ChartColorStory);
ColorSchemes.args = {
  colors: 's2Categorical12',
  data: colorData,
};
setControlInclude(ColorSchemes as StoryWithParameters, ['colors']);

export { ColorSchemes, ColorValues };
