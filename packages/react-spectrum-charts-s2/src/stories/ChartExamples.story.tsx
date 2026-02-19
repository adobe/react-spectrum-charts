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

import { action } from '@storybook/addon-actions';
import { StoryFn } from '@storybook/react';

import { ActionButton, ActionGroup, Content, Divider, Flex, Item, Text } from '@adobe/react-spectrum';
import Close from '@spectrum-icons/workflow/Close';
import Download from '@spectrum-icons/workflow/Download';
import GraphPathing from '@spectrum-icons/workflow/GraphPathing';
import UsersAdd from '@spectrum-icons/workflow/UsersAdd';
import ViewDetail from '@spectrum-icons/workflow/ViewDetail';

import { Colors, Datum, LegendDescription, LegendLabel, SpectrumColor, SubLabel } from '@spectrum-charts/vega-spec-builder-s2';
import useChartProps from '../hooks/useChartProps';
import { Axis, Bar, Chart, ChartPopover, ChartTooltip, Legend, Line, s2Categorical16 } from '../index';
import { bindWithProps } from '../test-utils';
import {
  funnelConversionData,
  funnelConversionTimeComparisonData,
  userGrowthData,
  userGrowthTimeComparisonData,
} from './data/data';
import stackOverflowData from './data/stackOverflowTrends.json';
import { trendsTimeComparisonData } from './data/trendsTimeComparisonData';

export default {
  title: 'RSC/Chart/Examples',
  component: Chart,
};

const userGrowthColors: SpectrumColor[] = [
  'categorical-100',
  'categorical-200',
  'categorical-300',
  'categorical-400',
];

const userGrowthDescriptions: LegendDescription[] = [
  {
    seriesName: `New users`,
    description: `Users active in the current period, but not previously (within 6 months of the current period).`,
  },
  { seriesName: `Current users`, description: `Users active in the current and previous period.` },
  {
    seriesName: `Resurrected users`,
    description: `Users active in the current period, after being dormant previously (within 6 months of the current period).`,
  },
  {
    seriesName: `Dormant users`,
    description: `Users not active in the current period, but were active in the previous period.`,
  },
];

const funnelSublabels: SubLabel[] = [
  { value: '2. Click promo slide', subLabel: '90DF-0123 +2 more', fontWeight: 'normal' },
  { value: '3. Start video', subLabel: '90 Day Fiance', fontWeight: 'normal' },
];

const funnelLegendLabels: LegendLabel[] = [
  { seriesName: 'All users | retained', label: 'All users' },
  { seriesName: 'US | retained', label: 'US' },
];

const funnelTimeCompareLegendLabels: LegendLabel[] = [
  { seriesName: 'All users | Previous 4 weeks | retained', label: 'All users | Previous 4 weeks' },
  { seriesName: 'All users | Last 4 weeks | retained', label: 'All users | Last 4 weeks' },
  { seriesName: 'US | Previous 4 weeks | retained', label: 'US | Previous 4 weeks ' },
  { seriesName: 'US | Last 4 weeks | retained', label: 'US | Last 4 weeks ' },
];

const UserGrowthBarStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <Chart {...props}>
      <Axis position="bottom" baseline />
      <Axis position="left" grid title="Users" />
      <Bar dimension="x" metric="y" color="series" order="order">
        <ChartTooltip>{generateCallback('tooltip')}</ChartTooltip>
        <ChartPopover width={200}>{generateCallback('popover')}</ChartPopover>
      </Bar>
      <Legend highlight descriptions={userGrowthDescriptions} />
    </Chart>
  );
};

const UserGrowthBarTimeComparisonStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <Chart {...props}>
      <Axis position="bottom" baseline />
      <Axis position="left" grid title="Users" />
      <Bar
        dimension="x"
        metric="y"
        order="order"
        color="series"
        opacity={['series', 'period']}
        lineType={['series', 'period']}
        lineWidth={1.5}
        paddingRatio={0.3}
        groupedPadding={0.12}
      >
        <ChartTooltip>{generateCallback('tooltip')}</ChartTooltip>
        <ChartPopover width={200}>{generateCallback('popover')}</ChartPopover>
      </Bar>
      <Legend highlight descriptions={userGrowthDescriptions} />
    </Chart>
  );
};

/** Generates identical return callbacks but each has a custom Storybook Action Name for a better dev experience. */
const generateCallback = (variant: 'popover' | 'tooltip') => {
  const actionName = {
    popover: 'ChartPopover',
    tooltip: 'ChartTooltip',
  };

  const callback = (datum: Datum, close?: () => void) => {
    action(`${actionName[variant]}:callback`)(datum);
    return (
      <Content UNSAFE_className="userGrowth-dialog">
        <Flex direction="column">
          <Flex direction="row" justifyContent="space-between">
            <div>
              <div>{datum.x}</div>
              <div>{datum.series}</div>
              <div>{Math.abs(datum.y as number).toLocaleString()} users</div>
            </div>
            {close !== undefined && (
              <ActionButton isQuiet onPress={close}>
                <Close />
              </ActionButton>
            )}
          </Flex>
          {close !== undefined && (
            <>
              <Divider />
              <ActionGroup isQuiet onAction={close} orientation="vertical" UNSAFE_className="dialog-actions">
                <Item key="create-segment">
                  <UsersAdd />
                  <Text>Create segment</Text>
                </Item>
                <Item key="user-paths">
                  <GraphPathing />
                  <Text>Show user paths</Text>
                </Item>
                <Item key="view-users">
                  <ViewDetail />
                  <Text>View users</Text>
                </Item>
                <Item key="download-users">
                  <Download />
                  <Text>Download users</Text>
                </Item>
              </ActionGroup>
            </>
          )}
        </Flex>
      </Content>
    );
  };
  return callback;
};

const FunnelConversionStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <Chart {...props}>
      <Axis position="bottom" labelAlign="start" labelFontWeight="bold" subLabels={funnelSublabels} baseline />
      <Axis position="left" grid labelFormat="percentage" title="Conversion rate" />
      <Bar type="dodged" dimension="step" color={['series', 'subSeries']} paddingRatio={0.1} />
      <Legend highlight hiddenEntries={['All users | lost', 'US | lost']} legendLabels={funnelLegendLabels} />
    </Chart>
  );
};

const FunnelTimeComparisonStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <Chart {...props}>
      <Axis position="bottom" labelAlign="start" labelFontWeight="bold" subLabels={funnelSublabels} baseline />
      <Axis position="left" grid labelFormat="percentage" title="Conversion rate" />
      <Bar
        type="dodged"
        dimension="step"
        color={['series', 'subSeries']}
        paddingRatio={0.1}
        opacity="period"
        lineType="period"
        lineWidth={1.5}
      >
        <ChartTooltip />
      </Bar>
      <Legend
        highlight
        hiddenEntries={[
          'All users | lost',
          'US | lost',
          'US | Previous 4 weeks | lost',
          'All users | Previous 4 weeks | lost',
          'All users | Last 4 weeks | lost',
          'US | Last 4 weeks | lost',
        ]}
        legendLabels={funnelTimeCompareLegendLabels}
      />
    </Chart>
  );
};

const TrendsTimeComparisonLineStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  const legendLabels = [
    { seriesName: 'add-freeform-table-0 | Previous 4 weeks', label: 'Add Freeform table | Previous 4 weeks' },
    { seriesName: 'add-freeform-table-0 | Last 4 weeks', label: 'Add Freeform table | Last 4 weeks' },
    { seriesName: 'add-line-viz-1 | Previous 4 weeks', label: 'Add Line Viz | Previous 4 weeks' },
    { seriesName: 'add-line-viz-1 | Last 4 weeks', label: 'Add Line Viz | Last 4 weeks' },
  ];
  return (
    <Chart {...props}>
      <Axis position="bottom" ticks baseline labelFormat="time" />
      <Axis position="left" grid title="Events" />
      <Line color="series" lineType="period" scaleType="time" />
      <Legend highlight legendLabels={legendLabels} opacity="period" />
    </Chart>
  );
};

const TrendsTimeComparisonBarStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  const legendLabels = [
    { seriesName: 'add-freeform-table-0 | Previous 4 weeks', label: 'Add Freeform table | Previous 4 weeks' },
    { seriesName: 'add-freeform-table-0 | Last 4 weeks', label: 'Add Freeform table | Last 4 weeks' },
    { seriesName: 'add-line-viz-1 | Previous 4 weeks', label: 'Add Line Viz | Previous 4 weeks' },
    { seriesName: 'add-line-viz-1 | Last 4 weeks', label: 'Add Line Viz | Last 4 weeks' },
  ];
  return (
    <Chart {...props}>
      <Axis position="bottom" ticks baseline labelFormat="time" />
      <Axis position="left" grid title="Events" />
      <Bar
        type="dodged"
        dimension="datetime"
        color="series"
        opacity="period"
        lineType="period"
        lineWidth={1.5}
        paddingRatio={0.2}
      />
      <Legend highlight legendLabels={legendLabels} />
    </Chart>
  );
};

const TrendsTimeComparisonStackedBarStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  const legendLabels = [
    { seriesName: 'add-freeform-table-0 | Previous 4 weeks', label: 'Add Freeform table | Previous 4 weeks' },
    { seriesName: 'add-freeform-table-0 | Last 4 weeks', label: 'Add Freeform table | Last 4 weeks' },
    { seriesName: 'add-line-viz-1 | Previous 4 weeks', label: 'Add Line Viz | Previous 4 weeks' },
    { seriesName: 'add-line-viz-1 | Last 4 weeks', label: 'Add Line Viz | Last 4 weeks' },
  ];
  return (
    <Chart {...props} colors={s2Categorical16} opacities={[[0.5, 1]]} lineTypes={[['shortDash', 'solid']]}>
      <Axis position="bottom" ticks baseline labelFormat="time" />
      <Axis position="left" grid title="Events" />
      <Bar
        type="stacked"
        dimension="datetime"
        color="series"
        opacity={['series', 'period']}
        lineType={['series', 'period']}
        lineWidth={1.5}
        paddingRatio={0.2}
      />
      <Legend highlight legendLabels={legendLabels} />
    </Chart>
  );
};

const StackOverflowStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <Chart {...props}>
      <Axis position="left" grid title="Page Views" />
      <Axis position="bottom" baseline ticks labelFormat="time" granularity="month" />
      <Line dimension="timestamp" metric="rollingAveragePageViews" />
    </Chart>
  );
};

const UserGrowthBarGrowth = bindWithProps(UserGrowthBarStory);
UserGrowthBarGrowth.args = {
  data: userGrowthData,
  colors: userGrowthColors,
  height: 500,
  minWidth: 600,
  maxWidth: 1600,
  width: 'auto',
};

const UserGrowthTimeComparisonBarGrowth = bindWithProps(UserGrowthBarTimeComparisonStory);
UserGrowthTimeComparisonBarGrowth.args = {
  data: userGrowthTimeComparisonData,
  colors: userGrowthColors,
  height: 500,
  minWidth: 600,
  maxWidth: 1600,
  width: 'auto',
  lineTypes: [['shortDash', 'solid']],
  opacities: [[0.5, 1]],
};

const FunnelConversion = bindWithProps(FunnelConversionStory);
const funnelColors: Colors[] = s2Categorical16.map((color) => [color, 'gray-300']);
FunnelConversion.args = {
  data: funnelConversionData,
  colors: funnelColors,
  height: 500,
  minWidth: 840,
  maxWidth: 1280,
  width: 'auto',
};

const FunnelTimeComparison = bindWithProps(FunnelTimeComparisonStory);
const funnelTimeComparisonColors: Colors[] = s2Categorical16.map((color) => [color, 'gray-300']);
FunnelTimeComparison.args = {
  data: funnelConversionTimeComparisonData,
  colors: funnelTimeComparisonColors,
  height: 500,
  minWidth: 840,
  width: 'auto',
  lineTypes: ['shortDash', 'solid'],
  opacities: [0.5, 1],
};

const TrendsTimeComparisonBar = bindWithProps(TrendsTimeComparisonBarStory);
TrendsTimeComparisonBar.args = {
  data: trendsTimeComparisonData,
  height: 500,
  minWidth: 840,
  width: 'auto',
  lineTypes: ['shortDash', 'solid'],
  opacities: [0.5, 1],
};

const TrendsTimeComparisonStackedBar = bindWithProps(TrendsTimeComparisonStackedBarStory);
TrendsTimeComparisonStackedBar.args = {
  data: trendsTimeComparisonData,
  height: 500,
  minWidth: 840,
  width: 'auto',
  lineTypes: ['shortDash', 'solid'],
  opacities: [0.5, 1],
};

const TrendsTimeComparisonLine = bindWithProps(TrendsTimeComparisonLineStory);
TrendsTimeComparisonLine.args = {
  data: trendsTimeComparisonData,
  height: 500,
  minWidth: 840,
  width: 'auto',
  lineTypes: ['shortDash', 'solid'],
  opacities: [0.5, 1],
};

const StackOverflowTrends = bindWithProps(StackOverflowStory);
StackOverflowTrends.args = {
  data: stackOverflowData,
  height: 500,
  minWidth: 840,
  width: 'auto',
  renderer: 'canvas',
  title: 'The Fall of Stack Overflow',
};

export {
  FunnelConversion,
  FunnelTimeComparison,
  UserGrowthBarGrowth,
  TrendsTimeComparisonBar,
  TrendsTimeComparisonStackedBar,
  TrendsTimeComparisonLine,
  StackOverflowTrends,
  UserGrowthTimeComparisonBarGrowth,
};
