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
import React, { ReactElement, createElement } from 'react';

import { ReferenceLine } from '@components/ReferenceLine';
import useChartProps from '@hooks/useChartProps';
import { Axis, Bar, Chart, ChartPopover, ChartTooltip, Legend, Line } from '@rsc';
import { workspaceTrendsData, workspaceTrendsDataWithVisiblePoints } from '@stories/data/data';
import { formatTimestamp } from '@stories/storyUtils';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';
import { ChartProps } from 'types';

export default {
	title: 'RSC/Line',
	component: Line,
};

const historicalCompareData = [
	{ datetime: 1667890800000, users: 147, series: 'Add Fallout', period: 'Last month' },
	{ datetime: 1667890800000, users: 477, series: 'Add Fallout', period: 'Current' },
	{ datetime: 1667977200000, users: 148, series: 'Add Fallout', period: 'Last month' },
	{ datetime: 1667977200000, users: 481, series: 'Add Fallout', period: 'Current' },
	{ datetime: 1668063600000, users: 148, series: 'Add Fallout', period: 'Last month' },
	{ datetime: 1668063600000, users: 483, series: 'Add Fallout', period: 'Current' },
	{ datetime: 1668150000000, users: 131, series: 'Add Fallout', period: 'Last month' },
	{ datetime: 1668150000000, users: 310, series: 'Add Fallout', period: 'Current' },
	{ datetime: 1668236400000, users: 11, series: 'Add Fallout', period: 'Last month' },
	{ datetime: 1668236400000, users: 18, series: 'Add Fallout', period: 'Current' },
	{ datetime: 1668322800000, users: 17, series: 'Add Fallout', period: 'Last month' },
	{ datetime: 1668322800000, users: 70, series: 'Add Fallout', period: 'Current' },
	{ datetime: 1668409200000, users: 143, series: 'Add Fallout', period: 'Last month' },
	{ datetime: 1668409200000, users: 438, series: 'Add Fallout', period: 'Current' },
	{ datetime: 1667890800000, users: 1525, series: 'Add Freeform table', period: 'Last month' },
	{ datetime: 1667890800000, users: 5253, series: 'Add Freeform table', period: 'Current' },
	{ datetime: 1667977200000, users: 1510, series: 'Add Freeform table', period: 'Last month' },
	{ datetime: 1667977200000, users: 5103, series: 'Add Freeform table', period: 'Current' },
	{ datetime: 1668063600000, users: 1504, series: 'Add Freeform table', period: 'Last month' },
	{ datetime: 1668063600000, users: 5047, series: 'Add Freeform table', period: 'Current' },
	{ datetime: 1668150000000, users: 1338, series: 'Add Freeform table', period: 'Last month' },
	{ datetime: 1668150000000, users: 3386, series: 'Add Freeform table', period: 'Current' },
	{ datetime: 1668236400000, users: 120, series: 'Add Freeform table', period: 'Last month' },
	{ datetime: 1668236400000, users: 205, series: 'Add Freeform table', period: 'Current' },
	{ datetime: 1668322800000, users: 179, series: 'Add Freeform table', period: 'Last month' },
	{ datetime: 1668322800000, users: 790, series: 'Add Freeform table', period: 'Current' },
	{ datetime: 1668409200000, users: 1491, series: 'Add Freeform table', period: 'Last month' },
	{ datetime: 1668409200000, users: 4913, series: 'Add Freeform table', period: 'Current' },
];

const defaultChartProps: ChartProps = { data: workspaceTrendsData, minWidth: 400, maxWidth: 800, height: 400 };

const BasicLineStory: StoryFn<typeof Line> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartProps);
	return (
		<Chart {...chartProps}>
			<Line {...args} />
			<Legend lineWidth={{ value: 0 }} />
		</Chart>
	);
};
const LinearStory: StoryFn<typeof Line> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartProps);
	return (
		<Chart {...chartProps}>
			<Axis position="left" grid title="Users" />
			<Axis position="bottom" labelFormat="linear" baseline ticks>
				<ReferenceLine value={13} />
			</Axis>
			<Line {...args} />
		</Chart>
	);
};

const LineStory: StoryFn<typeof Line> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartProps);
	return (
		<Chart {...chartProps}>
			<Axis position="left" grid title="Users" />
			<Axis position="bottom" labelFormat="time" baseline ticks />
			<Line {...args} />
			<Legend highlight />
		</Chart>
	);
};

const ComboStory: StoryFn<typeof Line> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartProps);
	return (
		<Chart {...chartProps}>
			<Axis position="left" grid title="Users" />
			<Axis position="bottom" labelFormat="time" baseline ticks />
			<Bar dimension="datetime" metric="users" opacity={{ value: 0.75 }} />
			<Line {...args} />
			<Legend highlight />
		</Chart>
	);
};

const HistoricalCompareStory: StoryFn<typeof Line> = (args): ReactElement => {
	const chartProps = useChartProps({
		...defaultChartProps,
		data: historicalCompareData,
		width: 600,
		opacities: [0.5, 1],
		lineTypes: ['dotted', 'solid'],
	});
	return (
		<Chart {...chartProps}>
			<Axis position="left" grid title="Users" />
			<Axis position="bottom" labelFormat="time" baseline ticks />
			<Line {...args} />
			<Legend highlight opacity="period" />
		</Chart>
	);
};

const LineWithVisiblePointsStory: StoryFn<typeof Line> = (args): ReactElement => {
	const chartProps = useChartProps({ ...defaultChartProps, data: workspaceTrendsDataWithVisiblePoints });
	return (
		<Chart {...chartProps}>
			<Axis position="left" grid title="Users" />
			<Axis position="bottom" labelFormat="time" baseline ticks />
			<Line {...args} />
			<Legend highlight />
		</Chart>
	);
};

const Basic = bindWithProps(BasicLineStory);
Basic.args = {
	color: 'series',
	dimension: 'datetime',
	metric: 'value',
	name: 'line0',
	scaleType: 'time',
};

const LineWithAxisAndLegend = bindWithProps(LineStory);
LineWithAxisAndLegend.args = {
	color: 'series',
	dimension: 'datetime',
	metric: 'users',
	name: 'line0',
	scaleType: 'time',
};

const LineType = bindWithProps(BasicLineStory);
LineType.args = {
	color: 'series',
	lineType: 'series',
};

const Opacity = bindWithProps(BasicLineStory);
Opacity.args = {
	color: 'series',
	opacity: { value: 0.6 },
};

const TrendScale = bindWithProps(ComboStory);
TrendScale.args = {
	color: 'series',
	scaleType: 'point',
};

const LinearTrendScale = bindWithProps(LinearStory);
LinearTrendScale.args = {
	color: 'series',
	dimension: 'point',
	scaleType: 'linear',
};

const HistoricalCompare = bindWithProps(HistoricalCompareStory);
HistoricalCompare.args = {
	color: 'series',
	dimension: 'datetime',
	lineType: 'period',
	metric: 'users',
	scaleType: 'time',
};

const Tooltip = bindWithProps(BasicLineStory);
Tooltip.args = {
	color: 'series',
	children: (
		<ChartTooltip>
			{(datum) => (
				<div className="bar-tooltip">
					<div>{formatTimestamp(datum.datetime as number)}</div>
					<div>Event: {datum.series}</div>
					<div>Users: {Number(datum.value).toLocaleString()}</div>
				</div>
			)}
		</ChartTooltip>
	),
};

const WithStaticPoints = bindWithProps(LineWithVisiblePointsStory);
WithStaticPoints.args = {
	color: 'series',
	dimension: 'datetime',
	metric: 'value',
	name: 'line0',
	scaleType: 'time',
	staticPoint: 'staticPoint',
};

const dialogCallback = (datum) => (
	<div className="bar-tooltip">
		<div>{formatTimestamp(datum.datetime as number)}</div>
		<div>Event: {datum.series}</div>
		<div>Users: {Number(datum.value).toLocaleString()}</div>
	</div>
);

const WithStaticPointsAndDialogs = bindWithProps(LineWithVisiblePointsStory);
WithStaticPointsAndDialogs.args = {
	color: 'series',
	dimension: 'datetime',
	metric: 'value',
	name: 'line0',
	scaleType: 'time',
	staticPoint: 'staticPoint',
	children: [createElement(ChartTooltip, {}, dialogCallback), createElement(ChartPopover, {}, dialogCallback)],
};

export {
	Basic,
	LineWithAxisAndLegend,
	LineType,
	Opacity,
	TrendScale,
	LinearTrendScale,
	HistoricalCompare,
	Tooltip,
	WithStaticPoints,
	WithStaticPointsAndDialogs,
};
