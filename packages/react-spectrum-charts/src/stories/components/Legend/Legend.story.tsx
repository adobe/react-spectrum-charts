/*
 * Copyright 2023 Adobe. All rights reserved.
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

import { View } from '@adobe/react-spectrum';
import { StoryFn } from '@storybook/react';

import { Chart } from '../../../Chart';
import { Axis, ChartPopover, Legend, Line } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { LegendBarStory, LegendDisconnectedStory, LegendLineStory, defaultProps } from './LegendStoryUtils';

// Shared datetime range: Jun 1–7 2026 (daily)
const WEEK_DATETIMES = [
  1780293600000, 1780380000000, 1780466400000, 1780552800000,
  1780639200000, 1780725600000, 1780812000000,
];

// Story 1: 5 series, mix of short labels and long labels that wrap
const fiveSeriesNames = [
  'CJA Users',
  'Accounts',
  'Events About Total Website Page Views And Engagement',
  'Page Views',
  'Total Unique Session Duration And Conversion Rate',
];
const legendColumns5SeriesData = fiveSeriesNames.flatMap((series, si) =>
  WEEK_DATETIMES.map((datetime, di) => ({ datetime, value: 1000 + si * 900 + di * 180, series }))
);

// Story 2: 3 series, one very long label (~350px), labelLimit 500
const longLabelSeriesNames = [
  'Users',
  'Events',
  'Conversion Rate From All Marketing Channel Sources',
];
const legendColumnsLongLabelData = longLabelSeriesNames.flatMap((series, si) =>
  WEEK_DATETIMES.map((datetime, di) => ({ datetime, value: 1000 + si * 1200 + di * 150, series }))
);

// 5 series, three short + two long labels — exercises per-column (align: 'each') sizing
const longLabel5SeriesNames = [
  'Conversion Rate From All Marketing Channel Sources',
  'Users',
  'Events',
  'Sessions',
  'Average Revenue Per Paying Customer Account',
];
const legendColumnsLongLabel5Data = longLabel5SeriesNames.flatMap((series, si) =>
  WEEK_DATETIMES.map((datetime, di) => ({ datetime, value: 1000 + si * 900 + di * 150, series }))
);

// Story 3: 20 series of varying label lengths
const twentySeriesNames = [
  'DAU',
  'MAU',
  'CTR',
  'CVR',
  'Sessions',
  'Accounts',
  'Visitors',
  'Pageviews',
  'New Users',
  'Returning',
  'Unique Visitors',
  'Time on Page',
  'Bounce Rate',
  'Revenue',
  'Avg Session',
  'Cart Abandonment',
  'Email Open Rate',
  'Customer LTV',
  'Revenue Per Visit',
  'Mobile Sessions',
];
const legendColumns20SeriesData = twentySeriesNames.flatMap((series, si) =>
  WEEK_DATETIMES.map((datetime, di) => ({ datetime, value: 500 + si * 250 + di * 80, series }))
);

const makeResizableLegendLineStory = (data: Record<string, unknown>[]): StoryFn<typeof Legend> => {
  const ResizableLegendLineStory: StoryFn<typeof Legend> = (args): ReactElement => {
    const chartProps = useChartProps({ data, width: 'auto', height: '100%', padding: 2 });
    return (
      <View
        backgroundColor="gray-50"
        overflow="auto"
        width={700}
        minWidth={200}
        maxWidth={1400}
        height={350}
        minHeight={200}
        maxHeight={600}
        borderColor="gray-400"
        borderWidth="thick"
        UNSAFE_style={{ resize: 'both' }}
      >
        <Chart {...chartProps}>
          <Axis position="left" grid />
          <Axis position="bottom" labelFormat="time" baseline ticks />
          <Line color="series" dimension="datetime" metric="value" scaleType="time" />
          <Legend {...args} />
        </Chart>
      </View>
    );
  };
  return ResizableLegendLineStory;
};

export default {
  title: 'RSC/Legend',
  component: Legend,
};

const Basic = bindWithProps(LegendBarStory);
Basic.args = { ...defaultProps };

const descriptions = [
  {
    seriesName: 'Windows',
    description: 'Most popular operating system, especially in business',
  },
  { seriesName: 'Mac', description: 'Popular for content creation, home and development' },
  { seriesName: 'Other', description: 'Linux accounts for the majority of "other" operating systems' },
];

const Descriptions = bindWithProps(LegendBarStory);
Descriptions.args = { descriptions, ...defaultProps };

const Disconnected = bindWithProps(LegendDisconnectedStory);
Disconnected.args = { ...defaultProps, color: 'series' };

const legendLabels = [
  { seriesName: 'Windows', label: 'Custom Windows' },
  { seriesName: 'Mac', label: 'Custom Mac' },
  { seriesName: 'Other', label: 'Custom Other' },
];

const truncatedLegendLabels = [
  { seriesName: 'Windows', label: 'Very long Windows label that will be truncated without a custom labelLimit' },
  { seriesName: 'Mac', label: 'Very long Mac label that will be truncated without a custom labelLimit' },
  { seriesName: 'Other', label: 'Very long Other label that will be truncated without a custom labelLimit' },
];

const Labels = bindWithProps(LegendBarStory);
Labels.args = { legendLabels, highlight: true, ...defaultProps };

const LabelLimit = bindWithProps(LegendBarStory);
LabelLimit.args = { legendLabels: truncatedLegendLabels, ...defaultProps };

const LabelWrapLimit = bindWithProps(LegendBarStory);
LabelWrapLimit.args = {
  legendLabels: truncatedLegendLabels,
  labelLimit: 150,
  _labelWrap: 2,
  ...defaultProps,
};

const TitleLimit = bindWithProps(LegendBarStory);
TitleLimit.args = {
  title: 'Very long legend title that should be truncated',
  titleLimit: 250,
  ...defaultProps,
};

const OnClick = bindWithProps(LegendBarStory);
OnClick.args = {};

const Popover = bindWithProps(LegendBarStory);
Popover.args = {
  children: <ChartPopover width="auto">{(datum) => <div>{datum.value}</div>}</ChartPopover>,
  ...defaultProps,
};

const Position = bindWithProps(LegendBarStory);
Position.args = { position: 'right', ...defaultProps };

const Title = bindWithProps(LegendBarStory);
Title.args = { title: 'Operating system', ...defaultProps };

const Supreme = bindWithProps(LegendBarStory);
Supreme.args = {
  descriptions,
  highlight: true,
  legendLabels,
  position: 'right',
  title: 'Operating system',
};

const LegendColumns = bindWithProps(LegendLineStory);
LegendColumns.args = {
  labelLimit: 200,
  highlight: true,
};

const ResizableWith5Series = makeResizableLegendLineStory(legendColumns5SeriesData);
const LegendColumnsExtended = bindWithProps(ResizableWith5Series);
LegendColumnsExtended.args = {
  labelLimit: 200,
  _labelWrap: 2,
  highlight: true,
};

const ResizableWithLongLabel = makeResizableLegendLineStory(legendColumnsLongLabelData);
const LegendColumnsLongLabel = bindWithProps(ResizableWithLongLabel);
LegendColumnsLongLabel.args = {
  labelLimit: 500,
  highlight: true,
};

const ResizableWith20Series = makeResizableLegendLineStory(legendColumns20SeriesData);
const LegendColumns20Series = bindWithProps(ResizableWith20Series);
LegendColumns20Series.args = {
  labelLimit: 200,
  highlight: true,
};

// _preferredColumns: pick the largest listed column count whose labels fit without truncation.
// Resize the container to watch the layout step down 5 -> 3, then truncate at 3 when nothing fits.
const PreferredColumns5or3 = bindWithProps(ResizableWith5Series);
PreferredColumns5or3.args = {
  _preferredColumns: [5, 3],
  highlight: true,
};

// A longer candidate ladder over the 20-series data.
const ResizableWith20SeriesPreferred = makeResizableLegendLineStory(legendColumns20SeriesData);
const PreferredColumnsLadder = bindWithProps(ResizableWith20SeriesPreferred);
PreferredColumnsLadder.args = {
  _preferredColumns: [5, 4, 3, 2],
  highlight: true,
};

// 5 items with two long labels: at 5 columns only the two long labels widen their own columns
// (align: 'each'), so 5 can still fit in a wide container; narrowing steps down to 3.
const ResizableWithLongLabelPreferred = makeResizableLegendLineStory(legendColumnsLongLabel5Data);
const PreferredColumnsLongLabel = bindWithProps(ResizableWithLongLabelPreferred);
PreferredColumnsLongLabel.args = {
  _preferredColumns: [5, 3],
  align: 'start',
  highlight: true,
};

// Combined _preferredColumns + _labelWrap: at each candidate, labels wrap (up to _labelWrap lines)
// to keep that column count before stepping down. Resize wide->narrow to watch 5 full -> 5 wrapped
// -> 3 wrapped -> 3 truncated.
const PreferredColumnsWithWrap = bindWithProps(ResizableWithLongLabelPreferred);
PreferredColumnsWithWrap.args = {
  _preferredColumns: [5, 3],
  _labelWrap: 3,
  align: 'start',
  highlight: true,
};

export {
  Basic,
  Descriptions,
  Disconnected,
  Labels,
  LabelLimit,
  LabelWrapLimit,
  TitleLimit,
  OnClick,
  Popover,
  Position,
  Title,
  Supreme,
  LegendColumns,
  LegendColumnsExtended,
  LegendColumnsLongLabel,
  LegendColumns20Series,
  PreferredColumns5or3,
  PreferredColumnsLadder,
  PreferredColumnsLongLabel,
  PreferredColumnsWithWrap,
};
