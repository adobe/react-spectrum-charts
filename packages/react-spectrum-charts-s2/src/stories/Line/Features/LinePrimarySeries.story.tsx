import { ReactElement } from 'react';

import { StoryFn } from '@storybook/react';

import { Chart } from '../../../Chart';
import { Axis, Legend, Line, LineDirectLabel } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { workspaceTrendsData, workspaceTrendsSixSeriesData } from '../../../stories/data/data';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';

export default {
  title: 'React Spectrum Charts 2/Line/Features/PrimarySeries',
  component: Line,
};

const defaultChartProps: ChartProps = { data: workspaceTrendsData, minWidth: 400, maxWidth: 800, height: 400 };

const PrimarySeriesStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid />
      <Axis position="bottom" labelFormat="time" />
      <Line {...args} />
      <Legend lineWidth={{ value: 0 }} />
    </Chart>
  );
};

const PrimarySeriesWithDirectLabelsStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: workspaceTrendsSixSeriesData });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid />
      <Axis position="bottom" labelFormat="time" />
      <Line {...args}>
        <LineDirectLabel value="series" />
      </Line>
    </Chart>
  );
};

const PrimarySeries = bindWithProps(PrimarySeriesStory);
PrimarySeries.args = {
  color: 'series',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  primarySeries: 1,
};

const PrimarySeriesCustomSeries = bindWithProps(PrimarySeriesStory);
PrimarySeriesCustomSeries.args = {
  color: 'series',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  primarySeries: ['Add Fallout', 'Add Bar viz'],
};

const PrimarySeriesWithCustomColor = bindWithProps(PrimarySeriesStory);
PrimarySeriesWithCustomColor.args = {
  color: 'series',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  primarySeries: 2,
  hiddenSeriesColor: 'gray-100',
};

const PrimarySeriesWithDirectLabels = bindWithProps(PrimarySeriesWithDirectLabelsStory);
PrimarySeriesWithDirectLabels.args = {
  color: 'series',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  primarySeries: ['Add Freeform table', 'Add Line viz'],
};

export { PrimarySeries, PrimarySeriesCustomSeries, PrimarySeriesWithCustomColor, PrimarySeriesWithDirectLabels };
