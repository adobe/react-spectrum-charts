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
import { Axis, ChartInspect, ChartPopover, Legend } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { Area } from '../../../../pre-alpha';
import { bindWithProps } from '../../../../test-utils';
import { AreaProps, ChartProps } from '../../../../types';

export default {
  title: 'React Spectrum Charts 2/Area/Features/Inspect',
  component: Area,
};

const data = [
  { browser: 'Chrome', value: 5, operatingSystem: 'Windows' },
  { browser: 'Chrome', value: 3, operatingSystem: 'Mac' },
  { browser: 'Chrome', value: 2, operatingSystem: 'Other' },
  { browser: 'Firefox', value: 3, operatingSystem: 'Windows' },
  { browser: 'Firefox', value: 3, operatingSystem: 'Mac' },
  { browser: 'Firefox', value: 1, operatingSystem: 'Other' },
  { browser: 'Safari', value: 3, operatingSystem: 'Windows' },
  { browser: 'Safari', value: 0, operatingSystem: 'Mac' },
  { browser: 'Safari', value: 1, operatingSystem: 'Other' },
];
const defaultChartProps: ChartProps = { data, minWidth: 400, maxWidth: 800, height: 400 };
const defaultArgs: Partial<AreaProps> = { dimension: 'browser', color: 'operatingSystem', scaleType: 'point' };

const AreaStory: StoryFn<AreaProps> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline />
      <Axis position="left" grid />
      <Area {...args} />
      <Legend highlight />
    </Chart>
  );
};

const dialogContent = (datum: Datum) => (
  <div>
    <div>Browser: {datum.browser as string}</div>
    <div>OS: {datum.operatingSystem as string}</div>
    <div>Downloads: {datum.value as number}</div>
  </div>
);

const Inspect = bindWithProps(AreaStory);
Inspect.args = {
  ...defaultArgs,
  children: <ChartInspect>{dialogContent}</ChartInspect>,
};

const Popover = bindWithProps(AreaStory);
Popover.args = {
  ...defaultArgs,
  children: (
    <ChartPopover width="auto" key={0}>
      {dialogContent}
    </ChartPopover>
  ),
};

export { Inspect, Popover };
