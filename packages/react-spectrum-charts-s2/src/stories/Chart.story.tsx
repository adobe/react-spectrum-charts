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

import useChartProps from '../hooks/useChartProps';
import { Axis, Bar, Chart, ChartInspect, Legend, Line } from '../index';
import { bindWithProps } from '../test-utils';
import { chartEngagementData, workspaceTrendsData } from './data/data';

type StoryWithParameters = { parameters?: { controls: { include: string[] } } };

const setControlInclude = (story: StoryWithParameters, include: string[]) => {
  story.parameters = { controls: { include } };
};

export default {
  title: 'React Spectrum Charts 2/Chart/Features',
  component: Chart,
  argTypes: {
    colors: { control: 'object' },
    hiddenSeries: { control: 'object' },
    lineTypes: { control: 'object' },
    opacities: { control: 'object' },
    animationTypes: { control: 'check', options: ['hover', 'drawIn'] },
  },
};

const ChartLineStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <Chart {...props}>
      <Axis position="bottom" baseline title="Month" />
      <Axis position="left" grid title="Accounts" />
      <Line dimension="x" metric="y" color="series" scaleType="point" />
      <Legend highlight />
    </Chart>
  );
};

const ChartLineTypeStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <Chart {...props}>
      <Axis position="bottom" baseline title="Month" />
      <Axis position="left" grid title="Accounts" />
      <Line dimension="x" metric="y" color="series" lineType="series" scaleType="point" />
      <Legend highlight />
    </Chart>
  );
};

const ChartOpacityStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <Chart {...props}>
      <Axis position="bottom" baseline title="Month" />
      <Axis position="left" grid title="Accounts" />
      <Line dimension="x" metric="y" color="series" opacity="series" scaleType="point" />
      <Legend highlight />
    </Chart>
  );
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

const ChartPanelStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <div style={{ height: 480 }}>
      <Chart {...props}>
        <Axis position="bottom" baseline title="Month" />
        <Axis position="left" grid title="Accounts" />
        <Bar dimension="x" metric="y" color="series" />
        <Legend highlight />
      </Chart>
    </div>
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
Basic.args = { data: chartEngagementData, description: 'Monthly accounts by lifecycle stage' };
setControlInclude(Basic as StoryWithParameters, []);

// Hover a bar: with animations off the highlight fade snaps instead of easing.
const Animations = bindWithProps(ChartBarInspectStory);
Animations.args = { data: chartEngagementData, animations: false };
setControlInclude(Animations as StoryWithParameters, ['animations']);

const AnimationTypes = bindWithProps(ChartLineStory);
AnimationTypes.args = { data: chartEngagementData, animationTypes: ['hover', 'drawIn'] };
setControlInclude(AnimationTypes as StoryWithParameters, ['animationTypes']);

const BackgroundColor = bindWithProps(ChartLineStory);
BackgroundColor.args = { data: chartEngagementData, backgroundColor: 'gray-100' };
setControlInclude(BackgroundColor as StoryWithParameters, ['backgroundColor']);

const Colors = bindWithProps(ChartBarStory);
Colors.args = { data: chartEngagementData, colors: ['blue-1000', 'blue-800', 'blue-600', 'blue-400'] };
setControlInclude(Colors as StoryWithParameters, ['colors']);

const Config = bindWithProps(ChartBarStory);
Config.args = {
  data: chartEngagementData,
  config: { axis: { labelFontSize: 16, titleFontSize: 18, titleFontWeight: 'bold' } },
};
setControlInclude(Config as StoryWithParameters, ['config']);

const EmptyStateText = bindWithProps(ChartBarStory);
EmptyStateText.args = { data: [], height: 400, emptyStateText: 'No accounts match the selected filters' };
setControlInclude(EmptyStateText as StoryWithParameters, ['emptyStateText']);

// Height is a percentage of the 480px dashboard panel, clamped by minHeight / maxHeight.
const Height = bindWithProps(ChartPanelStory);
Height.args = { data: chartEngagementData, height: '75%', minHeight: 300, maxHeight: 600 };
setControlInclude(Height as StoryWithParameters, ['height', 'maxHeight', 'minHeight']);

const HiddenSeries = bindWithProps(ChartLineStory);
HiddenSeries.args = { data: chartEngagementData, hiddenSeries: ['Expansion'] };
setControlInclude(HiddenSeries as StoryWithParameters, ['hiddenSeries']);

const HighlightedItem = bindWithProps(ChartBarInspectStory);
HighlightedItem.args = { data: chartEngagementData, highlightedItem: 15 };
setControlInclude(HighlightedItem as StoryWithParameters, ['highlightedItem']);

const HighlightedSeries = bindWithProps(ChartLineStory);
HighlightedSeries.args = { data: chartEngagementData, highlightedSeries: 'Retention' };
setControlInclude(HighlightedSeries as StoryWithParameters, ['highlightedSeries']);

const LineTypes = bindWithProps(ChartLineTypeStory);
LineTypes.args = { data: chartEngagementData, lineTypes: ['solid', 'dashed', 'dotted', 'dotDash'] };
setControlInclude(LineTypes as StoryWithParameters, ['lineTypes']);

const Loading = bindWithProps(ChartBarStory);
Loading.args = { data: [], height: 400, loading: true };
setControlInclude(Loading as StoryWithParameters, ['loading']);

const Locale = bindWithProps(ChartTimeStory);
Locale.args = { data: workspaceTrendsData, locale: 'de-DE', width: 600 };
setControlInclude(Locale as StoryWithParameters, ['locale']);

const OnVegaViewReady = bindWithProps(ChartLineStory);
OnVegaViewReady.args = {
  data: chartEngagementData,
  onVegaViewReady: (view) => action('onVegaViewReady')({ width: view.width(), height: view.height() }),
};
setControlInclude(OnVegaViewReady as StoryWithParameters, []);

const Opacities = bindWithProps(ChartOpacityStory);
Opacities.args = { data: chartEngagementData, opacities: [1, 0.4, 0.4, 0.4] };
setControlInclude(Opacities as StoryWithParameters, ['opacities']);

const Padding = bindWithProps(ChartLineStory);
Padding.args = { data: chartEngagementData, backgroundColor: 'gray-100', padding: 40 };
setControlInclude(Padding as StoryWithParameters, ['padding']);

const Renderer = bindWithProps(ChartLineStory);
Renderer.args = { data: chartEngagementData, renderer: 'canvas' };
setControlInclude(Renderer as StoryWithParameters, ['renderer']);

const Title = bindWithProps(ChartLineStory);
Title.args = { data: chartEngagementData, title: 'Accounts by lifecycle stage' };
setControlInclude(Title as StoryWithParameters, ['title']);

const TooltipAnchor = bindWithProps(ChartBarInspectStory);
TooltipAnchor.args = { data: chartEngagementData, tooltipAnchor: 'mark', tooltipPlacement: 'top' };
setControlInclude(TooltipAnchor as StoryWithParameters, ['tooltipAnchor', 'tooltipPlacement']);

const Width = bindWithProps(ChartBarStory);
Width.args = { data: chartEngagementData, width: '50%', minWidth: 400, maxWidth: 800 };
setControlInclude(Width as StoryWithParameters, ['maxWidth', 'minWidth', 'width']);

export {
  Basic,
  Animations,
  AnimationTypes,
  BackgroundColor,
  Colors,
  Config,
  EmptyStateText,
  Height,
  HiddenSeries,
  HighlightedItem,
  HighlightedSeries,
  LineTypes,
  Loading,
  Locale,
  OnVegaViewReady,
  Opacities,
  Padding,
  Renderer,
  Title,
  TooltipAnchor,
  Width,
};
