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
import { action } from 'storybook/actions';

import { Chart } from '../../../Chart';
import { Axis, ChartPopover, Legend, Line } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { LegendBarStory, LegendDisconnectedStory, LegendLineStory, defaultProps } from './LegendStoryUtils';

const WEEK_DATETIMES = [
  1780293600000, 1780380000000, 1780466400000, 1780552800000,
  1780639200000, 1780725600000, 1780812000000,
];

const fiveSeriesNames = ['CJA Users', 'Accounts', 'Events', 'Page Views', 'Sessions'];
const legendColumns5SeriesData = fiveSeriesNames.flatMap((series, si) =>
  WEEK_DATETIMES.map((datetime, di) => ({ datetime, value: 1000 + si * 900 + di * 180, series }))
);

const longLabelSeriesNames = [
  'Users',
  'Events',
  'Conversion Rate From All Marketing Channel Sources',
];
const legendColumnsLongLabelData = longLabelSeriesNames.flatMap((series, si) =>
  WEEK_DATETIMES.map((datetime, di) => ({ datetime, value: 1000 + si * 1200 + di * 150, series }))
);

const twentySeriesNames = [
  'DAU', 'MAU', 'CTR', 'CVR', 'Sessions',
  'Accounts', 'Visitors', 'Pageviews', 'New Users', 'Returning',
  'Unique Visitors', 'Time on Page', 'Bounce Rate', 'Revenue', 'Avg Session',
  'Cart Abandonment', 'Email Open Rate', 'Customer LTV', 'Revenue Per Visit', 'Mobile Sessions',
];
const legendColumns20SeriesData = twentySeriesNames.flatMap((series, si) =>
  WEEK_DATETIMES.map((datetime, di) => ({ datetime, value: 500 + si * 250 + di * 80, series }))
);

const makeResizableLegendLineStory = (data: Record<string, unknown>[]): StoryFn<typeof Legend> => {
  const ResizableLegendLineStory: StoryFn<typeof Legend> = (args): ReactElement => {
    const chartProps = useChartProps({ data, width: 'auto', height: '100%', padding: 2 });
    return (
      <div
        style={{
          backgroundColor: 'var(--spectrum-gray-50)',
          border: '4px solid var(--spectrum-gray-400)',
          height: 350,
          maxHeight: 600,
          maxWidth: 1400,
          minHeight: 200,
          minWidth: 200,
          overflow: 'auto',
          resize: 'both',
          width: 700,
        }}
      >
        <Chart {...chartProps}>
          <Axis position="left" grid />
          <Axis position="bottom" labelFormat="time" baseline ticks />
          <Line color="series" dimension="datetime" metric="value" scaleType="time" />
          <Legend {...args} />
        </Chart>
      </div>
    );
  };
  return ResizableLegendLineStory;
};

export default {
  title: 'React Spectrum Charts 2/Legend/Tests/Legend',
  component: Legend,
};

const Basic = bindWithProps(LegendBarStory);
Basic.args = { ...defaultProps };
Object.assign(Basic, { parameters: { controls: { include: [] } } });

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

const TitleLimit = bindWithProps(LegendBarStory);
TitleLimit.args = {
  title: 'Very long legend title that should be truncated',
  titleLimit: 250,
  ...defaultProps,
};

const OnClick = bindWithProps(LegendBarStory);
OnClick.args = { ...defaultProps, onClick: action('legend entry clicked') };

const Popover = bindWithProps(LegendBarStory);
Popover.args = {
  children: (
    <ChartPopover rightClick width="auto">
      {(datum) => (
        <div>
          <div>{datum.series}</div>
          <div>{datum.category}: {datum.value}</div>
        </div>
      )}
    </ChartPopover>
  ),
  ...defaultProps,
};
Popover.storyName = 'Popover and context menu';
Object.assign(Popover, { parameters: { controls: { include: ['children'] } } });

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

const LabelsDescriptionsAndTitle = bindWithProps(LegendBarStory);
LabelsDescriptionsAndTitle.args = {
  descriptions,
  highlight: true,
  labelLimit: 180,
  legendLabels,
  title: 'Operating system',
  titleLimit: 200,
  ...defaultProps,
};
Object.assign(LabelsDescriptionsAndTitle, {
  parameters: {
    controls: { include: ['descriptions', 'legendLabels', 'labelLimit', 'title', 'titleLimit', 'position', 'align'] },
  },
});

const LegendColumns = bindWithProps(LegendLineStory);
LegendColumns.args = {
  labelLimit: 200,
  highlight: true,
};

const PositionAndColumns = bindWithProps(LegendLineStory);
PositionAndColumns.args = {
  labelLimit: 200,
  highlight: true,
  position: 'right',
  title: 'Metrics',
};
Object.assign(PositionAndColumns, { parameters: { controls: { include: ['position', 'align', 'labelLimit', 'title'] } } });

const ResizableWith5Series = makeResizableLegendLineStory(legendColumns5SeriesData);
const LegendColumnsExtended = bindWithProps(ResizableWith5Series);
LegendColumnsExtended.args = {
  labelLimit: 200,
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

export {
  Basic,
  LabelsDescriptionsAndTitle,
  Popover,
  PositionAndColumns,
  Descriptions,
  Disconnected,
  Labels,
  LabelLimit,
  LegendColumns,
  LegendColumnsExtended,
  LegendColumnsLongLabel,
  LegendColumns20Series,
  OnClick,
  Position,
  Supreme,
  Title,
  TitleLimit,
};
