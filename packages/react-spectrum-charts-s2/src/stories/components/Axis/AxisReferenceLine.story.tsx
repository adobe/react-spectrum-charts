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
import React, { ReactElement } from 'react';

import { StoryFn } from '@storybook/react';

import { Chart } from '../../../Chart';
import { Axis, Line, ReferenceLine } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { workspaceTrendsData } from '../../../stories/data/data';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';

export default {
  title: 'RSC/Axis/ReferenceLine',
  component: ReferenceLine,
};

const defaultChartProps: ChartProps = {
  data: workspaceTrendsData,
  minWidth: 400,
  maxWidth: 800,
  height: 400,
  backgroundColor: 'gray-50',
};

const ReferenceLineStory: StoryFn<typeof ReferenceLine> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users">
        <ReferenceLine {...args} />
      </Axis>
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line dimension="datetime" metric="users" color="series" scaleType="time" />
    </Chart>
  );
};

const Basic = bindWithProps(ReferenceLineStory);
Basic.args = {
  value: 5000,
};

const Label = bindWithProps(ReferenceLineStory);
Label.args = {
  label: 'Target',
  value: 5000,
};

export { Basic, Label };
