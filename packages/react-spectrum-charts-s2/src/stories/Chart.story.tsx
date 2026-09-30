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

import useChartProps from '../hooks/useChartProps';
import { Axis, Bar, Chart, ChartInspect, Legend, Line } from '../index';
import { bindWithProps } from '../test-utils';
import './Chart.story.css';
import { chartEngagementData, workspaceTrendsData } from './data/data';

type StoryWithParameters = { parameters?: { controls: { include: string[] } } };

const setControlInclude = (story: StoryWithParameters, include: string[]) => {
  story.parameters = { controls: { include } };
};

export default {
  title: 'React Spectrum Charts 2/Chart/Features',
  component: Chart,
  parameters: { controls: { include: ['backgroundColor', 'colors', 'config', 'height', 'highlightedItem', 'locale', 'maxHeight', 'maxWidth', 'minHeight', 'minWidth', 'padding', 'tooltipAnchor', 'tooltipPlacement', 'width'] } },
};

const chartData = chartEngagementData;

const ChartLineStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <Chart {...props}>
      <Axis position="bottom" baseline ticks title="Month" />
      <Axis position="left" grid title="Accounts" />
      <Line dimension="x" metric="y" color="series" scaleType="point" />
      <Legend highlight />
    </Chart>
  );
};

const ChartTimeStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <Chart {...props} width={500}>
      <Axis position="bottom" baseline ticks labelFormat="time" />
      <Axis position="left" grid numberFormat=",.2f" title="Events" />
      <Line dimension="datetime" metric="value" color="series" scaleType="time" />
      <Legend highlight />
    </Chart>
  );
};

const ChartBarStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <Chart {...props}>
      <Axis position="bottom" baseline title="Month" />
      <Axis position="left" grid title="Accounts" />
      <Bar dimension="x" metric="y" color="series" />
      <Legend highlight />
    </Chart>
  );
};

const ChartBarInspectStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <Chart {...props}>
      <Axis position="bottom" baseline title="Month" />
      <Axis position="left" grid title="Accounts" />
      <Bar dimension="x" metric="y" color="series">
        <ChartInspect>
          {(datum) => (
            <div className="bar-tooltip">
              <div>Month: {datum.x}</div>
              <div>Segment: {datum.series}</div>
              <div>Accounts: {datum.y}</div>
            </div>
          )}
        </ChartInspect>
      </Bar>
      <Legend highlight />
    </Chart>
  );
};

const Basic = bindWithProps(ChartLineStory);
Basic.args = { data: chartData };
setControlInclude(Basic as StoryWithParameters, []);

const BackgroundColor = bindWithProps(ChartLineStory);
BackgroundColor.args = {
  backgroundColor: 'gray-100',
  padding: 32,
  data: chartData,
};
setControlInclude(BackgroundColor as StoryWithParameters, ['backgroundColor', 'padding']);

const Config = bindWithProps(ChartBarStory);
Config.args = {
  config: {
    rect: {
      strokeWidth: 2,
    },
  },
  data: chartData,
};
setControlInclude(Config as StoryWithParameters, ['config']);

const Locale = bindWithProps(ChartTimeStory);
Locale.args = {
  locale: 'de-DE',
  data: workspaceTrendsData,
};
setControlInclude(Locale as StoryWithParameters, ['locale']);

const ResponsiveBounds = bindWithProps(ChartBarStory);
ResponsiveBounds.args = {
  width: '50%',
  minWidth: 300,
  maxWidth: 600,
  height: '50%',
  minHeight: 300,
  maxHeight: 600,
  data: chartData,
};
setControlInclude(ResponsiveBounds as StoryWithParameters, ['height', 'maxHeight', 'maxWidth', 'minHeight', 'minWidth', 'width']);

const TooltipAnchor = bindWithProps(ChartBarInspectStory);
TooltipAnchor.args = {
  tooltipAnchor: 'mark',
  tooltipPlacement: 'top',
  data: chartData,
};
setControlInclude(TooltipAnchor as StoryWithParameters, ['tooltipAnchor', 'tooltipPlacement']);

const HighlightedItem = bindWithProps(ChartBarInspectStory);
HighlightedItem.args = {
  highlightedItem: 15,
  data: chartData,
};
setControlInclude(HighlightedItem as StoryWithParameters, ['highlightedItem']);

export { Basic, BackgroundColor, Config, HighlightedItem, Locale, ResponsiveBounds, TooltipAnchor };
