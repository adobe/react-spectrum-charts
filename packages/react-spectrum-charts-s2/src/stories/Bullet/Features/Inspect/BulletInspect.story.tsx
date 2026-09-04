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

import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../../Chart';
import { ChartInspect } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { Bullet } from '../../../../pre-alpha';
import { bindWithProps } from '../../../../test-utils';
import { BulletProps, ChartProps } from '../../../../types';
import { basicBulletData, coloredThresholdsData } from '../../../data/bulletData';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Bullet/Features/Inspect',
  component: Bullet,
};

const defaultChartProps: ChartProps = { data: basicBulletData, width: 350, height: 350 };
const defaultArgs: Partial<BulletProps> = {
  metric: 'currentAmount',
  dimension: 'graphLabel',
  target: 'target',
  direction: 'column',
  labelPosition: 'top',
};

const BulletStory: StoryFn<BulletProps> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Bullet {...args} />
    </Chart>
  );
};

const dialogContent = (datum: Datum) => (
  <div>
    <div>{datum.graphLabel as string}</div>
    <div>Current: ${datum.currentAmount as number}</div>
    <div>Target: ${datum.target as number}</div>
  </div>
);

// no track or thresholds — the tooltip binds directly to the rect and target marks
const Inspect = bindWithProps(BulletStory);
Inspect.args = {
  ...defaultArgs,
  children: <ChartInspect>{dialogContent}</ChartInspect>,
};

// thresholds add a dedicated hover area so the tooltip also fires between the threshold bands
const InspectWithThresholds = bindWithProps(BulletStory);
InspectWithThresholds.args = {
  ...defaultArgs,
  thresholds: coloredThresholdsData,
  children: <ChartInspect>{dialogContent}</ChartInspect>,
};

// track also gets its own hover area, same as thresholds
const InspectWithTrack = bindWithProps(BulletStory);
InspectWithTrack.args = {
  ...defaultArgs,
  track: true,
  children: <ChartInspect>{dialogContent}</ChartInspect>,
};

export { Inspect, InspectWithThresholds, InspectWithTrack };
