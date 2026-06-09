import { ReactElement } from 'react';

import { StoryFn } from '@storybook/react';

import { Chart } from '../../../Chart';
import { Axis, Legend, Line, LineDirectLabel } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { workspaceTrendsData, workspaceTrendsSixSeriesData } from '../../../stories/data/data';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';

export default {
  title: 'React Spectrum Charts 2/Line/Features/SeriesLimit',
  component: Line,
};

const defaultChartProps: ChartProps = { data: workspaceTrendsData, minWidth: 400, maxWidth: 800, height: 400 };

const SeriesLimitStory: StoryFn<typeof Line> = (args): ReactElement => {
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

const SeriesLimitWithDirectLabelsStory: StoryFn<typeof Line> = (args): ReactElement => {
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

const SeriesLimit = bindWithProps(SeriesLimitStory);
SeriesLimit.args = {
  color: 'series',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  seriesLimit: 1,
};

const SeriesLimitWithCustomColor = bindWithProps(SeriesLimitStory);
SeriesLimitWithCustomColor.args = {
  color: 'series',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  seriesLimit: 2,
  hiddenSeriesColor: 'gray-100',
};

const SeriesLimitWithDirectLabels = bindWithProps(SeriesLimitWithDirectLabelsStory);
SeriesLimitWithDirectLabels.args = {
  color: 'series',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  seriesLimit: 2,
};

export { SeriesLimit, SeriesLimitWithCustomColor, SeriesLimitWithDirectLabels };
