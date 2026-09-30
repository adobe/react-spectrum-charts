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
import { Axis, Bar, ChartInspect, ChartPopover } from '../../../components';
import { ReferenceLine } from '../../../components/ReferenceLine';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';

export default {
  title: 'React Spectrum Charts 2/Accessible Navigation/Bar Navigation',
  component: Bar,
};

const data = [
  { browser: 'Chrome', downloads: 27 },
  { browser: 'Firefox', downloads: 8 },
  { browser: 'Safari', downloads: 12 },
  { browser: 'Edge', downloads: 4 },
];

const dialogContent = (datum) => (
  <div>
    <div>Browser: {datum.browser}</div>
    <div>Downloads: {datum.downloads}</div>
  </div>
);

const AccessibleNavigationStory: StoryFn<typeof ReferenceLine> = (args): ReactElement => {
  const chartProps = useChartProps({ data, width: 600, accessibleNavigation: true });
  return (
    <Chart {...chartProps}>
      <Axis position="left" baseline ticks grid title="Downloads">
        <ReferenceLine {...args} />
      </Axis>
      <Axis position="bottom" baseline title="Browser" />
      <Bar dimension="browser" metric="downloads">
        <ChartInspect>{dialogContent}</ChartInspect>
        <ChartPopover width={200}>{dialogContent}</ChartPopover>
      </Bar>
    </Chart>
  );
};

export const ReferenceLineBarNavigation = bindWithProps(AccessibleNavigationStory);
ReferenceLineBarNavigation.args = { value: 20, label: 'Target' };
