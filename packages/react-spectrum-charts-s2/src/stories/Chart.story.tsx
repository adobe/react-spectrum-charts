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
import { Axis, Chart, Legend, Line } from '../index';
import { chartEngagementData, workspaceTrendsData } from '../storyShared/data/data';
import { bindWithProps } from '../test-utils';
import {
  ChartBarInspectStory,
  ChartBarStory,
  ChartLineStory,
  StoryWithParameters,
  setControlInclude,
} from './Chart/chartStoryTemplates';

export default {
  title: 'React Spectrum Charts 2/Chart/Features',
  component: Chart,
};

const ChartTimeStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <Chart {...props}>
      <Axis position="bottom" baseline ticks labelFormat="time" title="Day" />
      <Axis position="left" grid numberFormat=",.2f" title="Events" />
      <Line dimension="datetime" metric="value" color="series" scaleType="time" />
      <Legend highlight />
    </Chart>
  );
};

const Basic = bindWithProps(ChartLineStory);
Basic.args = { data: chartEngagementData, description: 'Monthly accounts by lifecycle stage' };
setControlInclude(Basic as StoryWithParameters, []);

const BackgroundColor = bindWithProps(ChartLineStory);
BackgroundColor.args = { data: chartEngagementData, backgroundColor: 'gray-100' };
setControlInclude(BackgroundColor as StoryWithParameters, ['backgroundColor']);

const Config = bindWithProps(ChartBarStory);
Config.args = {
  data: chartEngagementData,
  config: { axis: { labelFontSize: 16, titleFontSize: 18, titleFontWeight: 'bold' } },
};
setControlInclude(Config as StoryWithParameters, ['config']);

const EmptyStateText = bindWithProps(ChartBarStory);
EmptyStateText.args = { data: [], height: 400, emptyStateText: 'No accounts match the selected filters' };
setControlInclude(EmptyStateText as StoryWithParameters, ['emptyStateText']);

const Loading = bindWithProps(ChartBarStory);
Loading.args = { data: [], height: 400, loading: true };
setControlInclude(Loading as StoryWithParameters, ['loading']);

const Locale = bindWithProps(ChartTimeStory);
Locale.args = { data: workspaceTrendsData, locale: 'de-DE', width: 600 };
setControlInclude(Locale as StoryWithParameters, ['locale']);

const Renderer = bindWithProps(ChartLineStory);
Renderer.args = { data: chartEngagementData, renderer: 'canvas' };
setControlInclude(Renderer as StoryWithParameters, ['renderer']);

const Title = bindWithProps(ChartLineStory);
Title.args = { data: chartEngagementData, title: 'Accounts by lifecycle stage' };
setControlInclude(Title as StoryWithParameters, ['title']);

const TooltipAnchor = bindWithProps(ChartBarInspectStory);
TooltipAnchor.args = { data: chartEngagementData, tooltipAnchor: 'mark', tooltipPlacement: 'top' };
setControlInclude(TooltipAnchor as StoryWithParameters, ['tooltipAnchor', 'tooltipPlacement']);

export { Basic, BackgroundColor, Config, EmptyStateText, Loading, Locale, Renderer, Title, TooltipAnchor };
