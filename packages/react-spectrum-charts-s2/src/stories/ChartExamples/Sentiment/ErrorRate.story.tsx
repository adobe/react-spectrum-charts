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

import { Chart } from '../../../Chart';
import { Axis, Legend, Line, ReferenceLine } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import errorData from './errorData.json';

export default {
  title: 'React Spectrum Charts 2/Chart/Examples',
  component: ReferenceLine,
  parameters: { controls: { include: [] } },
};

const errorRateData = errorData.map((datum) => ({ ...datum, series: 'Checkout errors' }));

const ErrorRateStory: StoryFn = (): ReactElement => {
  const chartProps = useChartProps({ data: errorRateData, width: 800 });
  return (
    <Chart {...chartProps}>
      <Line scaleType="linear" dimension="time" metric="errors" color="series" />
      <Axis position="left" hideDefaultLabels>
        <ReferenceLine value={400} label="Critical" secondary />
        <ReferenceLine value={200} label="Warning" secondary />
        <ReferenceLine value={100} label="Watch" secondary />
      </Axis>
      <Axis position="bottom" baseline ticks labelFormat="duration" />
      <Legend highlight />
    </Chart>
  );
};

const ErrorRate = bindWithProps(ErrorRateStory);

export { ErrorRate };
