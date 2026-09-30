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

import { ActionButton, Divider, Text } from '@react-spectrum/s2';
import Close from '@react-spectrum/s2/icons/Close';
import Download from '@react-spectrum/s2/icons/Download';
import Path from '@react-spectrum/s2/icons/Path';
import UserAdd from '@react-spectrum/s2/icons/UserAdd';
import UserGroup from '@react-spectrum/s2/icons/UserGroup';
import { StoryFn } from '@storybook/react';

import { Colors, Datum, LegendDescription, LegendLabel, SpectrumColor, SubLabel } from '@spectrum-charts/vega-spec-builder-s2';

import useChartProps from '../../hooks/useChartProps';
import { Axis, Bar, Chart, ChartInspect, ChartPopover, Legend, Line, s2Categorical16 } from '../../index';
import '../Chart.story.css';

export const userGrowthColors: SpectrumColor[] = [
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

const trendsLegendLabels: LegendLabel[] = [
  { seriesName: 'add-freeform-table-0 | Previous 4 weeks', label: 'Add Freeform table | Previous 4 weeks' },
  { seriesName: 'add-freeform-table-0 | Last 4 weeks', label: 'Add Freeform table | Last 4 weeks' },
  { seriesName: 'add-line-viz-1 | Previous 4 weeks', label: 'Add Line Viz | Previous 4 weeks' },
  { seriesName: 'add-line-viz-1 | Last 4 weeks', label: 'Add Line Viz | Last 4 weeks' },
];

export const funnelColors: Colors[] = s2Categorical16.map((color) => [color, 'gray-300']);

const generateDialogContent = () => {
  const callback = (datum: Datum, close?: () => void) => {
    return (
      <div className="userGrowth-dialog">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
            <div>
              <div>{datum.x}</div>
              <div>{datum.series}</div>
              <div>{Math.abs(datum.y as number).toLocaleString()} users</div>
            </div>
            {close !== undefined && (
              <ActionButton isQuiet aria-label="Close" onPress={close}>
                <Close />
              </ActionButton>
            )}
          </div>
          {close !== undefined && (
            <>
              <Divider />
              <div className="dialog-actions" style={{ display: 'flex', flexDirection: 'column' }}>
                <ActionButton isQuiet onPress={close}>
                  <UserAdd />
                  <Text>Create segment</Text>
                </ActionButton>
                <ActionButton isQuiet onPress={close}>
                  <Path />
                  <Text>Show user paths</Text>
                </ActionButton>
                <ActionButton isQuiet onPress={close}>
                  <UserGroup />
                  <Text>View users</Text>
                </ActionButton>
                <ActionButton isQuiet onPress={close}>
                  <Download />
                  <Text>Download users</Text>
                </ActionButton>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };
  return callback;
};

export const UserGrowthBarStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <Chart {...props}>
      <Axis position="bottom" baseline />
      <Axis position="left" grid title="Users" />
      <Bar dimension="x" metric="y" color="series" order="order">
        <ChartInspect>{generateDialogContent()}</ChartInspect>
        <ChartPopover width={200}>{generateDialogContent()}</ChartPopover>
      </Bar>
      <Legend highlight descriptions={userGrowthDescriptions} />
    </Chart>
  );
};

export const UserGrowthBarTimeComparisonStory: StoryFn<typeof Chart> = (args): ReactElement => {
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
        <ChartInspect>{generateDialogContent()}</ChartInspect>
        <ChartPopover width={200}>{generateDialogContent()}</ChartPopover>
      </Bar>
      <Legend highlight descriptions={userGrowthDescriptions} />
    </Chart>
  );
};

export const FunnelConversionStory: StoryFn<typeof Chart> = (args): ReactElement => {
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

export const FunnelTimeComparisonStory: StoryFn<typeof Chart> = (args): ReactElement => {
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
        <ChartInspect />
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

export const TrendsTimeComparisonLineStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <Chart {...props}>
      <Axis position="bottom" ticks baseline labelFormat="time" />
      <Axis position="left" grid title="Events" />
      <Line color="series" lineType="period" scaleType="time" />
      <Legend highlight legendLabels={trendsLegendLabels} opacity="period" />
    </Chart>
  );
};

export const TrendsTimeComparisonBarStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
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
      <Legend highlight legendLabels={trendsLegendLabels} labelLimit={300} />
    </Chart>
  );
};

export const TrendsTimeComparisonStackedBarStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
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
      <Legend highlight legendLabels={trendsLegendLabels} labelLimit={300} />
    </Chart>
  );
};

export const StackOverflowStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <Chart {...props}>
      <Axis position="left" grid title="Page Views" />
      <Axis position="bottom" baseline ticks labelFormat="time" granularity="month" />
      <Line dimension="timestamp" metric="rollingAveragePageViews" color="series" />
      <Legend highlight />
    </Chart>
  );
};
