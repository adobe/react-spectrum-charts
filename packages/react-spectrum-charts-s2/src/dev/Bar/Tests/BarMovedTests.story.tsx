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

import { GROUP_DATA, MARK_ID } from '@spectrum-charts/constants';
import { s2Categorical6 } from '@spectrum-charts/themes';
import { Datum, SpectrumColor } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { Axis, Bar, ChartInspect, ChartPopover, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import {
  barDataTwoSeries,
  barDataWithSeries,
  barDataWithUTCSeries,
  barSeriesData,
  barSubSeriesData,
  generateMockDataForTrellis,
  stackedBarDataWithUTCSeries,
} from '../../../storyShared/components/Bar/data';
import { bindWithProps } from '../../../test-utils';
import { BarProps } from '../../../types';

export default {
  title: 'React Spectrum Charts 2/Bar/Tests/Moved Demo Variants',
  component: Bar,
};

const groupedDialogContent = (datum: Datum): ReactElement => (
  <>
    <div>Operating system: {datum.operatingSystem}</div>
    <div>Browser: {datum.browser}</div>
    <div>Downloads: {datum.value}</div>
  </>
);

const BasicDimensionAreaStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barDataWithSeries, width: 600, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args}>
        <ChartInspect targets={['item', 'dimensionArea']}>
          {(datum) => {
            const d = datum[GROUP_DATA]?.[0] ?? datum;
            return (
              <div>
                {d.browser}: {d.downloads}
              </div>
            );
          }}
        </ChartInspect>
      </Bar>
      <Legend title="Metric" />
    </Chart>
  );
};

const GroupedDimensionAreaStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barSeriesData, width: 800, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args}>
        <ChartInspect>{groupedDialogContent}</ChartInspect>
        <ChartInspect targets={['dimensionArea']}>
          {(datum) => (
            <>
              <div style={{ fontWeight: 'bold' }}>{datum.browser} Downloads</div>
              {datum[GROUP_DATA]?.map((d) => (
                <div key={d[MARK_ID]}>
                  {d.operatingSystem}: {d.value}
                </div>
              ))}
            </>
          )}
        </ChartInspect>
      </Bar>
      <Legend title="Operating system" highlight />
    </Chart>
  );
};

const BarStoryWithUTCData: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barDataWithUTCSeries, width: 600, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis
        position={args.orientation === 'horizontal' ? 'left' : 'bottom'}
        labelFormat="time"
        granularity="day"
        baseline
        title="Date"
      />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args} />
      <Legend title="Dataset" />
    </Chart>
  );
};

const StackedBarStoryWithUTCData: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: stackedBarDataWithUTCSeries, width: 600, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis
        position={args.orientation === 'horizontal' ? 'left' : 'bottom'}
        labelFormat="time"
        granularity="day"
        baseline
        title="Date"
      />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args} />
      <Legend title="Dataset" />
    </Chart>
  );
};

const colors: SpectrumColor[] = ['categorical-100', 'categorical-200', 'categorical-300', 'categorical-400'];

const DodgedBarStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const { color } = args;
  const storyColors = Array.isArray(color)
    ? [
        ['categorical-700', 'categorical-1000'],
        ['categorical-400', 'categorical-500'],
        ['categorical-300', 'categorical-1100'],
      ]
    : s2Categorical6;
  const data = Array.isArray(color) ? barSubSeriesData : barSeriesData;
  const chartProps = useChartProps({ data, width: 800, height: 600, colors: storyColors });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args} />
      <Legend title="Operating system" highlight />
    </Chart>
  );
};

const TrellisStory: StoryFn<typeof Bar> = (args: BarProps): ReactElement => {
  const chartProps = useChartProps({
    data: generateMockDataForTrellis({
      property1: ['All users', 'Roku', 'Chromecast', 'Amazon Fire', 'Apple TV'],
      property2: ['A. Sign up', 'B. Watch a video', 'C. Add to My List'],
      property3: ['1-5 times', '6-10 times', '11-15 times', '16-20 times', '21-25 times', '26+ times'],
      propertyNames: ['segment', 'event', 'bucket'],
      randomizeSteps: false,
      orderBy: 'bucket',
    }),
    colors,
    width: 800,
    height: 800,
  });

  const dialog = (item: Datum): ReactElement => (
    <div>
      <div>{item.event}</div>
      <div>{item.segment}</div>
      <div>
        {item.bucket}: {Number(item.value).toLocaleString()} users
      </div>
    </div>
  );

  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} title="Users, Count" grid />
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} title="Platform" baseline />
      <Bar {...args}>
        <ChartInspect>{dialog}</ChartInspect>
        <ChartPopover>{dialog}</ChartPopover>
      </Bar>
      <Legend title="Usage frequency" />
    </Chart>
  );
};

export const BasicInspectOnDimensionArea = bindWithProps(BasicDimensionAreaStory);
BasicInspectOnDimensionArea.args = { dimension: 'browser', metric: 'downloads', color: 'series' };

export const DodgedInspectOnDimensionArea = bindWithProps(GroupedDimensionAreaStory);
DodgedInspectOnDimensionArea.args = { type: 'dodged', dimension: 'browser', color: 'operatingSystem' };

export const StackedInspectOnDimensionArea = bindWithProps(GroupedDimensionAreaStory);
StackedInspectOnDimensionArea.args = { dimension: 'browser', order: 'order', color: 'operatingSystem' };

export const BarWithUTCDatetimeFormat = bindWithProps(BarStoryWithUTCData);
BarWithUTCDatetimeFormat.args = {
  dimension: 'browser',
  metric: 'downloads',
  color: 'datasetName',
  dimensionDataType: 'time',
};

export const StackedBarWithUTCDatetimeFormat = bindWithProps(StackedBarStoryWithUTCData);
StackedBarWithUTCDatetimeFormat.args = {
  dimension: 'browser',
  metric: 'downloads',
  color: 'datasetName',
  dimensionDataType: 'time',
};

export const DodgedLineType = bindWithProps(DodgedBarStory);
DodgedLineType.args = {
  type: 'dodged',
  dimension: 'browser',
  order: 'order',
  lineType: 'operatingSystem',
  lineWidth: 2,
  opacity: { value: 0.2 },
};

export const DodgedOpacity = bindWithProps(DodgedBarStory);
DodgedOpacity.args = { type: 'dodged', dimension: 'browser', order: 'order', opacity: 'operatingSystem' };

export const DodgedOnClick = bindWithProps(DodgedBarStory);
DodgedOnClick.args = {
  type: 'dodged',
  dimension: 'browser',
  order: 'order',
  color: 'operatingSystem',
  onClick: action('onClick'),
};

export const StackedOnClick = bindWithProps(DodgedBarStory);
StackedOnClick.args = { dimension: 'browser', order: 'order', color: 'operatingSystem', onClick: action('onClick') };

export const TrellisHorizontalHorizontal = bindWithProps<BarProps>(TrellisStory);
TrellisHorizontalHorizontal.args = {
  type: 'stacked',
  trellis: 'event',
  dimension: 'segment',
  color: 'bucket',
  order: 'order',
  orientation: 'horizontal',
  trellisOrientation: 'horizontal',
};

export const TrellisDodged = bindWithProps<BarProps>(TrellisStory);
TrellisDodged.args = {
  type: 'dodged',
  dimension: 'segment',
  onClick: undefined,
  order: 'order',
  color: 'bucket',
  trellis: 'event',
  trellisOrientation: 'horizontal',
  orientation: 'horizontal',
};

export const TrellisHorizontalVertical = bindWithProps<BarProps>(TrellisStory);
TrellisHorizontalVertical.args = { ...TrellisHorizontalHorizontal.args, trellisOrientation: 'vertical' };

export const TrellisVerticalHorizontal = bindWithProps<BarProps>(TrellisStory);
TrellisVerticalHorizontal.args = {
  ...TrellisHorizontalHorizontal.args,
  orientation: 'vertical',
  trellisOrientation: 'horizontal',
};

export const TrellisVerticalVertical = bindWithProps<BarProps>(TrellisStory);
TrellisVerticalVertical.args = {
  ...TrellisHorizontalVertical.args,
  orientation: 'vertical',
  trellisOrientation: 'vertical',
};

export const TrellisWithCustomPadding = bindWithProps<BarProps>(TrellisStory);
TrellisWithCustomPadding.args = { ...TrellisHorizontalVertical.args, orientation: 'vertical', trellisPadding: 0.33 };

const OnMouseInputsStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const [hoveredData, setHoveredData] = useState<Datum | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const controlledMouseOver = (datum: Datum) => {
    if (!isHovering) {
      setHoveredData(datum);
      setIsHovering(true);
    }
  };
  const controlledMouseOut = () => {
    if (isHovering) {
      setIsHovering(false);
    }
  };

  const chartProps = useChartProps({ data: barDataWithSeries, width: 640, height: 420 });
  return (
    <div>
      <div data-testid="hover-info" style={{ marginBottom: 8 }}>
        {isHovering && hoveredData ? (
          <div data-testid="hover-data">
            Previewing {hoveredData.browser}: {Number(hoveredData.downloads).toLocaleString()} downloads
          </div>
        ) : (
          <div data-testid="no-hover">Hover a browser to preview its downloads.</div>
        )}
      </div>
      <Chart {...chartProps}>
        <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
        <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
        <Bar {...args} onMouseOver={controlledMouseOver} onMouseOut={controlledMouseOut} />
        <Legend title="Metric" />
      </Chart>
    </div>
  );
};

const dualAxisDialogContent = (datum: Datum): ReactElement => (
  <div>
    <div>Operating system: {datum.operatingSystem}</div>
    <div>Browser: {datum.browser}</div>
    <div>Users: {datum.value}</div>
  </div>
);

const DualMetricAxisWithSublabelsStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barDataTwoSeries, width: 720, height: 460 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis
        position={args.orientation === 'horizontal' ? 'bottom' : 'left'}
        ticks
        tickMinStep={1}
        title="Downloads"
        subLabels={[
          { value: '1', subLabel: 'Low' },
          { value: '2', subLabel: 'Medium' },
          { value: '5', subLabel: 'High' },
        ]}
      />
      <Axis
        position={args.orientation === 'horizontal' ? 'bottom' : 'right'}
        ticks
        tickMinStep={1}
        title="Mac Downloads"
        subLabels={[
          { value: '1', subLabel: 'Low' },
          { value: '2', subLabel: 'Medium' },
          { value: '3', subLabel: 'High' },
        ]}
      />
      <Bar {...args}>
        <ChartInspect>{dualAxisDialogContent}</ChartInspect>
        <ChartPopover width={200}>{dualAxisDialogContent}</ChartPopover>
      </Bar>
      <Legend title="Operating system" highlight />
    </Chart>
  );
};

const DualMetricAxisWithThreeSeriesStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barSeriesData, width: 720, height: 460 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} ticks tickMinStep={1} title="Downloads" />
      <Axis
        position={args.orientation === 'horizontal' ? 'bottom' : 'right'}
        ticks
        tickMinStep={1}
        title="Other Downloads"
      />
      <Bar {...args}>
        <ChartInspect>{dualAxisDialogContent}</ChartInspect>
        <ChartPopover width={200}>{dualAxisDialogContent}</ChartPopover>
      </Bar>
      <Legend title="Operating system" highlight />
    </Chart>
  );
};

export const OnMouseInputs = bindWithProps(OnMouseInputsStory);
OnMouseInputs.args = { dimension: 'browser', metric: 'downloads', color: 'series' };

export const DualMetricAxisWithSublabels = bindWithProps(DualMetricAxisWithSublabelsStory);
DualMetricAxisWithSublabels.args = {
  dualMetricAxis: true,
  type: 'dodged',
  dimension: 'browser',
  order: 'order',
  color: 'operatingSystem',
};

export const DualMetricAxisWithThreeSeries = bindWithProps(DualMetricAxisWithThreeSeriesStory);
DualMetricAxisWithThreeSeries.args = {
  dualMetricAxis: true,
  type: 'dodged',
  dimension: 'browser',
  order: 'order',
  color: 'operatingSystem',
};
