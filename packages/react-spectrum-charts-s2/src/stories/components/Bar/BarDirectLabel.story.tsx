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
import { Axis, Bar, BarDirectLabel, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { BarDirectLabelProps } from '../../../types';
import { mixedAcquisitionData } from './data';

export default {
  title: 'React Spectrum Charts 2/Bar/Features/Direct Label',
  component: BarDirectLabel,
  parameters: {
    controls: {
      include: ['position', 'format'],
    },
  },
};

const BarDirectLabelStory: StoryFn<BarDirectLabelProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: mixedAcquisitionData, width: 640, height: 420 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Acquisition channel" />
      <Axis position="left" grid title="Sign-ups" />
      <Bar dimension="channel" metric="signups" color="series">
        <BarDirectLabel {...args} />
      </Bar>
      <Legend title="Metric" />
    </Chart>
  );
};

const HorizontalBarDirectLabelStory: StoryFn<BarDirectLabelProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: mixedAcquisitionData, width: 640, height: 420 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" baseline title="Acquisition channel" />
      <Axis position="bottom" grid title="Sign-ups" />
      <Bar dimension="channel" metric="signups" color="series" orientation="horizontal">
        <BarDirectLabel {...args} />
      </Bar>
      <Legend title="Metric" />
    </Chart>
  );
};

const defaultProps: BarDirectLabelProps = {
  position: 'end-outside',
};

const Vertical = bindWithProps(BarDirectLabelStory);
Vertical.args = {
  ...defaultProps,
};

const Horizontal = bindWithProps(HorizontalBarDirectLabelStory);
Horizontal.args = {
  ...defaultProps,
};

export { Vertical, Horizontal };
