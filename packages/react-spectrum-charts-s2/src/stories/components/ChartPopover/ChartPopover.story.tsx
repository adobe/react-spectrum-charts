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

import { action } from 'storybook/actions';
import { StoryFn } from '@storybook/react';

import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { Axis, Bar, ChartPopover, ChartInspect, Legend, Line } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { Donut, DonutSummary } from '../../../pre-alpha';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';
import { ChartPopoverProps } from '../../../types/dialogs/chartPopover.types';
import { browserData as data } from '../../data/data';
import { basicDonutData } from '../Donut/data';

interface ChartPopoverStoryArgs extends ChartPopoverProps {
  renderer?: ChartProps['renderer'];
}

type StoryWithParameters = { parameters?: { controls: { include: string[] } } };

const setControlInclude = (story: StoryWithParameters, include: string[]) => {
  story.parameters = { controls: { include } };
};

export default {
  title: 'React Spectrum Charts 2/Chart Popover/Features',
  component: ChartPopover,
  parameters: { controls: { include: ['contentMargin', 'height', 'minWidth', 'renderer', 'rightClick', 'width'] } },
  argTypes: {
    children: {
      description: '`(datum: Datum, close: () => void)`',
      control: {
        type: null,
      },
    },
  },
};

const dialogContent = (datum: Datum) => (
  <div>
    <div>Operating system: {datum.series}</div>
    <div>Browser: {datum.category}</div>
    <div>Users: {datum.value}</div>
  </div>
);

const dialogContentWithClose = (datum: Datum, close?: () => void) => (
  <div>
    <div>Operating system: {datum.series}</div>
    <div>Browser: {datum.category}</div>
    <div>Users: {datum.value}</div>
    {close && <button data-testid="popover-close-button" onClick={close}>Close</button>}
  </div>
);

const defaultChartProps: ChartProps = { data, renderer: 'svg', width: 600 };

const BarPopoverStory: StoryFn<ChartPopoverStoryArgs> = (args): ReactElement => {
  const { renderer = 'svg', ...popoverArgs } = args;
  const chartProps = useChartProps({ ...defaultChartProps, renderer });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" grid title="Users" />
      <Bar color="series">
        <ChartInspect>{dialogContent}</ChartInspect>
        <ChartPopover {...popoverArgs} />
      </Bar>
      <Legend highlight />
    </Chart>
  );
};

const DodgedBarPopoverStory: StoryFn<ChartPopoverProps> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" grid title="Users" />
      <Bar color="series" type="dodged">
        <ChartInspect>{dialogContent}</ChartInspect>
        <ChartPopover {...args} />
      </Bar>
      <Legend highlight />
    </Chart>
  );
};

const StackedBarPopoverStory: StoryFn<ChartPopoverProps> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" grid title="Users" />
      <Bar color="series" type="stacked">
        <ChartInspect>{dialogContent}</ChartInspect>
        <ChartPopover {...args} />
      </Bar>
      <Legend highlight />
    </Chart>
  );
};

const LineStory: StoryFn<ChartPopoverProps> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" grid title="Users" />
      <Line scaleType="point" dimension="category" color="series">
        <ChartInspect>{dialogContent}</ChartInspect>
        <ChartPopover {...args} />
      </Line>
      <Legend highlight />
    </Chart>
  );
};

const DonutStory: StoryFn<typeof ChartPopover> = (args): ReactElement => {
  const chartProps = useChartProps({ data: basicDonutData, width: 350, height: 350 });
  return (
    <Chart {...chartProps}>
      <Donut metric="count" color="browser">
        <DonutSummary label="Visitors" />
        <ChartInspect />
        <ChartPopover {...args} />
      </Donut>
      <Legend highlight />
    </Chart>
  );
};

const Renderer = bindWithProps(BarPopoverStory);
Renderer.args = { children: dialogContent, width: 'auto', renderer: 'svg' };
setControlInclude(Renderer as StoryWithParameters, ['renderer']);

const Sizing = bindWithProps(BarPopoverStory);
Sizing.args = { children: dialogContent, width: 220, height: 120, minWidth: 220, contentMargin: 24 };
setControlInclude(Sizing as StoryWithParameters, ['contentMargin', 'height', 'minWidth', 'width']);

const OnOpenChange = bindWithProps(BarPopoverStory);
OnOpenChange.args = { children: dialogContent, width: 'auto', onOpenChange: action('onOpenChange') };
setControlInclude(OnOpenChange as StoryWithParameters, []);

const RightClick = bindWithProps(BarPopoverStory);
RightClick.args = { children: dialogContent, width: 'auto', rightClick: true };
setControlInclude(RightClick as StoryWithParameters, ['rightClick']);

const WithCloseCallback = bindWithProps(BarPopoverStory);
WithCloseCallback.args = { children: dialogContentWithClose, width: 'auto' };
setControlInclude(WithCloseCallback as StoryWithParameters, []);

const DodgedBarChart = bindWithProps(DodgedBarPopoverStory);
DodgedBarChart.args = { children: dialogContent, width: 'auto' };
setControlInclude(DodgedBarChart as StoryWithParameters, ['width']);

const DonutChart = bindWithProps(DonutStory);
DonutChart.args = { width: 'auto' };
setControlInclude(DonutChart as StoryWithParameters, ['width']);

const LineChart = bindWithProps(LineStory);
LineChart.args = { children: dialogContent, width: 'auto' };
setControlInclude(LineChart as StoryWithParameters, ['width']);

const StackedBarChart = bindWithProps(StackedBarPopoverStory);
StackedBarChart.args = { children: dialogContent, width: 'auto' };
setControlInclude(StackedBarChart as StoryWithParameters, ['width']);

export {
  DodgedBarChart,
  DonutChart,
  LineChart,
  OnOpenChange,
  Renderer,
  RightClick,
  Sizing,
  StackedBarChart,
  WithCloseCallback,
};
