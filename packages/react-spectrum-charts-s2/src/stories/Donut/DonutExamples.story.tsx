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

import { Chart } from '../../Chart';
import { ChartInspect, ChartPopover, Legend } from '../../components';
import useChartProps from '../../hooks/useChartProps';
import { Donut, DonutSummary, SegmentLabel } from '../../pre-alpha';
import { basicDonutData } from '../../storyShared/Donut/data';
import { bindWithProps } from '../../test-utils';
import { DonutProps } from '../../types';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Donut/Examples',
  component: Donut,
};

const VisitorsByBrowserStory: StoryFn<DonutProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: basicDonutData, width: 600, height: 420 });
  return (
    <Chart {...chartProps}>
      <Donut {...args}>
        <DonutSummary label="Visitors" numberFormat="shortNumber" />
        <SegmentLabel percent value valueFormat="shortNumber" />
        <ChartInspect />
        <ChartPopover width="auto" />
      </Donut>
      <Legend title="Browsers" position="right" highlight isToggleable />
    </Chart>
  );
};

const VisitorsByBrowser = bindWithProps(VisitorsByBrowserStory);
VisitorsByBrowser.args = { metric: 'count', color: 'browser', holeRatio: 0.8 };
Object.assign(VisitorsByBrowser, { parameters: { controls: { include: [] } } });

export { VisitorsByBrowser };
