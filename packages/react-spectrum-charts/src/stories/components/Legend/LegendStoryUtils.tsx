/*
 * Copyright 2023 Adobe. All rights reserved.
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
import { Axis, Bar, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { LegendProps } from '../../../types';
import { browserData as data } from '../../data/data';

export const LegendBarStory: StoryFn<typeof Legend> = (args): ReactElement => {
  const chartProps = useChartProps({ data, width: 700 });
  return (
    <Chart {...chartProps}>
      <Bar color="series" />
      <Legend {...args} />
      <Axis position="bottom" baseline />
      <Axis position="left" grid />
    </Chart>
  );
};

export const LegendBarHighlightedSeriesStory: StoryFn<typeof Legend> = (args): ReactElement => {
  const chartProps = useChartProps({ data, width: 700, highlightedSeries: 'Mac' });
  return (
    <Chart {...chartProps}>
      <Bar color="series" />
      <Legend {...args} />
      <Axis position="bottom" baseline />
      <Axis position="left" grid />
    </Chart>
  );
};

export const LegendBarHiddenSeriesStory: StoryFn<typeof Legend> = (args): ReactElement => {
  const chartProps = useChartProps({ data, width: 700, hiddenSeries: ['Mac'] });
  return (
    <Chart {...chartProps}>
      <Bar color="series" />
      <Legend {...args} />
      <Axis position="bottom" baseline />
      <Axis position="left" grid />
    </Chart>
  );
};

export const LegendDisconnectedStory: StoryFn<typeof Legend> = (args): ReactElement => {
  const chartProps = useChartProps({ data, width: 700, height: 50 });
  return (
    <Chart {...chartProps}>
      <Legend {...args} />
    </Chart>
  );
};

export const defaultProps: LegendProps = {
  onClick: undefined,
};
