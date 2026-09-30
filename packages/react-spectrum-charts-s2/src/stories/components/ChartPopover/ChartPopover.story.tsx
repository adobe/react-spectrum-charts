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

import { Button } from '@react-spectrum/s2';
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
import { basicDonutData } from '../../Donut/data';

type StoryWithParameters = { parameters?: { controls: { include: string[] } } };

const setControlInclude = (story: StoryWithParameters, include: string[]) => {
  story.parameters = { controls: { include } };
};

export default {
  title: 'React Spectrum Charts 2/Chart Popover/Features',
  component: ChartPopover,
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
    {close && (
      <Button data-testid="popover-close-button" variant="secondary" size="S" onPress={close} UNSAFE_style={{ marginTop: 8 }}>
        Close
      </Button>
    )}
  </div>
);

const defaultChartProps: ChartProps = { data, renderer: 'svg', width: 600 };

const BarPopoverStory: StoryFn<ChartPopoverProps> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" grid title="Users" />
      <Bar color="series">
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

// Click a bar to open the popover; the content's Close button calls the `close` callback.
const Basic = bindWithProps(BarPopoverStory);
Basic.args = { children: dialogContentWithClose, width: 'auto' };
setControlInclude(Basic as StoryWithParameters, []);

const ContainerPadding = bindWithProps(BarPopoverStory);
ContainerPadding.args = { children: dialogContent, width: 'auto', containerPadding: 48 };
setControlInclude(ContainerPadding as StoryWithParameters, ['containerPadding']);

const ContentMargin = bindWithProps(BarPopoverStory);
ContentMargin.args = { children: dialogContent, width: 'auto', contentMargin: 24 };
setControlInclude(ContentMargin as StoryWithParameters, ['contentMargin']);

const Height = bindWithProps(BarPopoverStory);
Height.args = { children: dialogContent, width: 'auto', height: 'auto', minHeight: 160, maxHeight: 240 };
setControlInclude(Height as StoryWithParameters, ['height', 'maxHeight', 'minHeight']);

const OnOpenChange = bindWithProps(BarPopoverStory);
OnOpenChange.args = { children: dialogContent, width: 'auto', onOpenChange: action('onOpenChange') };
setControlInclude(OnOpenChange as StoryWithParameters, []);

const RightClick = bindWithProps(BarPopoverStory);
RightClick.args = { children: dialogContent, width: 'auto', rightClick: true };
setControlInclude(RightClick as StoryWithParameters, ['rightClick']);

const Width = bindWithProps(BarPopoverStory);
Width.args = { children: dialogContent, width: 'auto', minWidth: 260, maxWidth: 400 };
setControlInclude(Width as StoryWithParameters, ['maxWidth', 'minWidth', 'width']);

// Line popovers select the whole series and fade the others.
const OnLine = bindWithProps(LineStory);
OnLine.args = { children: dialogContent, width: 'auto' };
setControlInclude(OnLine as StoryWithParameters, []);

// Donut popovers render default segment content when no children are passed.
const OnDonut = bindWithProps(DonutStory);
OnDonut.args = { width: 'auto' };
setControlInclude(OnDonut as StoryWithParameters, []);

export { Basic, ContainerPadding, ContentMargin, Height, OnOpenChange, RightClick, Width, OnLine, OnDonut };
