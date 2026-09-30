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
import { ReactElement, useState } from 'react';

import { StoryFn } from '@storybook/react';
import { action } from 'storybook/actions';

import { Chart } from '../../../Chart';
import { Axis, ChartPopover, Legend, Line } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { LegendDescription, LegendLabel } from '@spectrum-charts/vega-spec-builder-s2';
import { revenueByRegionAndPeriodData, trafficBySourceData } from './legendStoryData';

export default {
  title: 'React Spectrum Charts 2/Legend/Features',
  component: Legend,
  argTypes: {
    align: { control: 'inline-radio', options: ['start', 'middle', 'end'] },
    position: { control: 'inline-radio', options: ['top', 'bottom', 'left', 'right'] },
    labelLimit: { control: { type: 'range', min: 40, max: 200, step: 10 } },
    titleLimit: { control: { type: 'range', min: 40, max: 300, step: 10 } },
  },
};

const controls = (...include: string[]) => ({ parameters: { controls: { include } } });

const TrafficStory: StoryFn<typeof Legend> = (args): ReactElement => {
  const chartProps = useChartProps({ data: trafficBySourceData, width: 700, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Sessions" numberFormat="shortNumber" />
      <Axis position="bottom" baseline labelFormat="time" granularity="month" title="Month" />
      <Line dimension="datetime" metric="sessions" color="source" scaleType="time" />
      <Legend {...args} />
    </Chart>
  );
};

const RevenueStory: StoryFn<typeof Legend> = (args): ReactElement => {
  const chartProps = useChartProps({ data: revenueByRegionAndPeriodData, width: 700, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Revenue" numberFormat="shortCurrency" />
      <Axis position="bottom" baseline labelFormat="time" granularity="month" title="Month" />
      <Line dimension="datetime" metric="revenue" color="region" lineType="period" scaleType="time" />
      <Legend {...args} />
    </Chart>
  );
};

const ControlledHiddenSeriesStory: StoryFn<typeof Legend> = (args): ReactElement => {
  const [hiddenSeries, setHiddenSeries] = useState<string[]>(['Referral']);
  const chartProps = useChartProps({ data: trafficBySourceData, width: 700, height: 400 });
  const toggleSeries = (series: string) => {
    action('legend entry clicked')(series);
    setHiddenSeries((hidden) =>
      hidden.includes(series) ? hidden.filter((name) => name !== series) : [...hidden, series]
    );
  };
  return (
    <Chart {...chartProps} hiddenSeries={hiddenSeries}>
      <Axis position="left" grid title="Sessions" numberFormat="shortNumber" />
      <Axis position="bottom" baseline labelFormat="time" granularity="month" title="Month" />
      <Line dimension="datetime" metric="sessions" color="source" scaleType="time" />
      <Legend {...args} onClick={toggleSeries} />
    </Chart>
  );
};

const legendLabels: LegendLabel[] = [
  { seriesName: 'Organic search', label: 'SEO' },
  { seriesName: 'Paid search', label: 'SEM' },
  { seriesName: 'Social', label: 'Social media' },
  { seriesName: 'Email', label: 'Newsletters' },
  { seriesName: 'Referral', label: 'Partner sites' },
];

const descriptions: LegendDescription[] = [
  { seriesName: 'Organic search', description: 'Unpaid visits from search engine results' },
  { seriesName: 'Paid search', description: 'Visits from sponsored search ads' },
  { seriesName: 'Social', description: 'Visits from social network posts and ads' },
  { seriesName: 'Email', description: 'Visits from marketing email campaigns' },
  { seriesName: 'Referral', description: 'Visits from links on partner websites' },
];

const Basic = bindWithProps(TrafficStory);
Basic.args = {};
Object.assign(Basic, controls());

const Position = bindWithProps(TrafficStory);
Position.args = { position: 'right' };
Object.assign(Position, controls('position'));

const Align = bindWithProps(TrafficStory);
Align.args = { align: 'start' };
Object.assign(Align, controls('align'));

const Title = bindWithProps(TrafficStory);
Title.args = { title: 'Traffic source' };
Object.assign(Title, controls('title'));

const TitleLimit = bindWithProps(TrafficStory);
TitleLimit.args = { title: 'Traffic source (last touch attribution, all devices)', titleLimit: 180 };
Object.assign(TitleLimit, controls('titleLimit'));

const LegendLabels = bindWithProps(TrafficStory);
LegendLabels.args = { legendLabels };
Object.assign(LegendLabels, controls('legendLabels'));

const LabelLimit = bindWithProps(TrafficStory);
LabelLimit.args = { labelLimit: 60 };
Object.assign(LabelLimit, controls('labelLimit'));

// Hover a legend entry to see its description.
const Descriptions = bindWithProps(TrafficStory);
Descriptions.args = { descriptions };
Object.assign(Descriptions, controls('descriptions'));

// Hover a legend entry to highlight its series.
const Highlight = bindWithProps(TrafficStory);
Highlight.args = { highlight: true };
Object.assign(Highlight, controls('highlight'));

// Click a legend entry to hide or show its series.
const IsToggleable = bindWithProps(TrafficStory);
IsToggleable.args = { isToggleable: true };
Object.assign(IsToggleable, controls('isToggleable'));

const DefaultHiddenSeries = bindWithProps(TrafficStory);
DefaultHiddenSeries.args = { isToggleable: true, defaultHiddenSeries: ['Organic search', 'Paid search'] };
Object.assign(DefaultHiddenSeries, controls('defaultHiddenSeries'));

// Chart-level `hiddenSeries` state is updated from the legend `onClick` callback.
const HiddenSeries = bindWithProps(ControlledHiddenSeriesStory);
HiddenSeries.args = {};
Object.assign(HiddenSeries, controls());

const HiddenEntries = bindWithProps(TrafficStory);
HiddenEntries.args = { hiddenEntries: ['Referral'] };
Object.assign(HiddenEntries, controls('hiddenEntries'));

// Only the `region` facet is listed; line type still distinguishes this year from last year.
const Keys = bindWithProps(RevenueStory);
Keys.args = { keys: ['region'] };
Object.assign(Keys, controls('keys'));

// A neutral color keeps the period legend from implying a region.
const Color = bindWithProps(RevenueStory);
Color.args = { keys: ['period'], color: { value: 'gray-700' }, lineType: 'period', symbolShape: { value: 'stroke' } };
Object.assign(Color, controls('color'));

const LineType = bindWithProps(RevenueStory);
LineType.args = { keys: ['period'], lineType: 'period', symbolShape: { value: 'stroke' } };
Object.assign(LineType, controls('lineType'));

const LineWidth = bindWithProps(TrafficStory);
LineWidth.args = { lineWidth: { value: 'L' }, symbolShape: { value: 'stroke' } };
Object.assign(LineWidth, controls('lineWidth'));

const Opacity = bindWithProps(TrafficStory);
Opacity.args = { opacity: { value: 0.5 } };
Object.assign(Opacity, controls('opacity'));

const SymbolShape = bindWithProps(TrafficStory);
SymbolShape.args = { symbolShape: { value: 'circle' } };
Object.assign(SymbolShape, controls('symbolShape'));

const OnClick = bindWithProps(TrafficStory);
OnClick.args = { onClick: action('onClick') };
Object.assign(OnClick, controls());

const OnMouseOver = bindWithProps(TrafficStory);
OnMouseOver.args = { onMouseOver: action('onMouseOver') };
Object.assign(OnMouseOver, controls());

const OnMouseOut = bindWithProps(TrafficStory);
OnMouseOut.args = { onMouseOut: action('onMouseOut') };
Object.assign(OnMouseOut, controls());

// Right-click a legend entry to open the popover.
const Popover = bindWithProps(TrafficStory);
Popover.args = {
  highlight: true,
  children: (
    <ChartPopover rightClick width="auto">
      {(datum) => (
        <div>
          <strong>{String(datum.value)}</strong>
          <div>View source report</div>
        </div>
      )}
    </ChartPopover>
  ),
};
Object.assign(Popover, controls());

export {
  Basic,
  Position,
  Align,
  Title,
  TitleLimit,
  LegendLabels,
  LabelLimit,
  Descriptions,
  Highlight,
  IsToggleable,
  DefaultHiddenSeries,
  HiddenSeries,
  HiddenEntries,
  Keys,
  Color,
  LineType,
  LineWidth,
  Opacity,
  SymbolShape,
  OnClick,
  OnMouseOver,
  OnMouseOut,
  Popover,
};
