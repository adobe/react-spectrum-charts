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

import { SpectrumColor } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { Axis, Bar, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { channelDeviceData, channelDeviceVisitorData } from '../../../storyShared/components/Bar/data';
import { BarProps } from '../../../types';
import { bindStory } from './storyUtils';

export default {
  title: 'React Spectrum Charts 2/Bar/Features',
  component: Bar,
};

// Two devices per channel keeps the dodged bars wide.
const desktopMobileData = channelDeviceData.filter(({ device }) => device !== 'Tablet');

const DodgedBarStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const isHorizontal = args.orientation === 'horizontal';
  const chartProps = useChartProps({ data: desktopMobileData, width: 640, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position={isHorizontal ? 'left' : 'bottom'} baseline title="Acquisition channel" />
      <Axis position={isHorizontal ? 'bottom' : 'left'} grid title="Sign-ups" />
      <Bar {...args} />
      <Legend title="Device" highlight />
    </Chart>
  );
};

// One color pair per device: [new visitors, returning visitors].
const deviceVisitorColors: SpectrumColor[][] = [
  ['blue-900', 'blue-500'],
  ['fuchsia-900', 'fuchsia-500'],
];

const DodgedStackedBarStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({
    data: channelDeviceVisitorData,
    colors: deviceVisitorColors,
    width: 640,
    height: 400,
  });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Acquisition channel" />
      <Axis position="left" grid title="Sessions" />
      <Bar {...args} />
      <Legend title="Device and visitor type" highlight />
    </Chart>
  );
};

const defaultProps: BarProps = {
  type: 'dodged',
  dimension: 'channel',
  metric: 'signups',
  color: 'device',
};

const Dodged = bindStory(DodgedBarStory);
Dodged.args = { ...defaultProps };
Dodged.parameters = { controls: { include: ['type'] } };

const GroupedPadding = bindStory(DodgedBarStory);
GroupedPadding.args = { ...defaultProps, groupedPadding: 0 };
GroupedPadding.parameters = { controls: { include: ['groupedPadding'] } };

// A two-key color facet dodges by the first key and stacks by the second.
const DodgedStacked = bindStory(DodgedStackedBarStory);
DodgedStacked.args = { type: 'dodged', dimension: 'channel', metric: 'sessions', color: ['device', 'visitor'] };
DodgedStacked.parameters = { controls: { include: [] } };

export { Dodged, GroupedPadding, DodgedStacked };
