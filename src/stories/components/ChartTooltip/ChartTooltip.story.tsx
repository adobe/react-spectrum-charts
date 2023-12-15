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
import React, { ReactElement } from 'react';

import { ChartTooltip } from '@components/ChartTooltip/ChartTooltip';
import useChartProps from '@hooks/useChartProps';
import { Area, Bar, Chart, Datum, Line } from '@rsc';
import { browserData as data } from '@stories/data/data';
import { formatTimestamp } from '@stories/storyUtils';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';

export default {
	title: 'RSC/ChartTooltip',
	component: ChartTooltip,
	argTypes: {
		children: {
			description: '`(datum) => React.ReactElement`',
			control: {
				type: null,
			},
		},
	},
};

const StackedBarTooltipStory: StoryFn<typeof ChartTooltip> = (args): ReactElement => {
	const chartProps = useChartProps({ data, width: 600 });
	return (
		<Chart {...chartProps}>
			<Bar color="series">
				<ChartTooltip {...args} />
			</Bar>
		</Chart>
	);
};
const DodgedBarTooltipStory: StoryFn<typeof ChartTooltip> = (args): ReactElement => {
	const chartProps = useChartProps({ data, width: 600 });
	return (
		<Chart {...chartProps}>
			<Bar type="dodged" color="series">
				<ChartTooltip {...args} />
			</Bar>
		</Chart>
	);
};

const lineData = [
	{ datetime: 1667890800000, point: 1, value: 738, users: 477, series: 'Add Fallout' },
	{ datetime: 1667977200000, point: 2, value: 704, users: 481, series: 'Add Fallout' },
	{ datetime: 1668063600000, point: 3, value: 730, users: 483, series: 'Add Fallout' },
	{ datetime: 1668150000000, point: 4, value: 465, users: 310, series: 'Add Fallout' },
	{ datetime: 1668236400000, point: 5, value: 31, users: 18, series: 'Add Fallout' },
	{ datetime: 1668322800000, point: 8, value: 108, users: 70, series: 'Add Fallout' },
	{ datetime: 1668409200000, point: 12, value: 648, users: 438, series: 'Add Fallout' },
	{ datetime: 1667890800000, point: 4, value: 12208, users: 5253, series: 'Add Freeform table' },
	{ datetime: 1667977200000, point: 5, value: 11309, users: 5103, series: 'Add Freeform table' },
	{ datetime: 1668063600000, point: 17, value: 11099, users: 5047, series: 'Add Freeform table' },
	{ datetime: 1668150000000, point: 20, value: 7243, users: 3386, series: 'Add Freeform table' },
	{ datetime: 1668236400000, point: 21, value: 395, users: 205, series: 'Add Freeform table' },
	{ datetime: 1668322800000, point: 22, value: 1606, users: 790, series: 'Add Freeform table' },
	{ datetime: 1668409200000, point: 25, value: 10932, users: 4913, series: 'Add Freeform table' },
];

const LineTooltipStory: StoryFn<typeof ChartTooltip> = (args): ReactElement => {
	const chartProps = useChartProps({ data: lineData, width: 600 });
	return (
		<Chart {...chartProps}>
			<Line color="series">
				<ChartTooltip {...args} />
			</Line>
		</Chart>
	);
};

interface LineData extends Datum {
	datetime?: number;
	point?: number;
	value?: number;
	users?: number;
	series?: string;
	category?: string;
}

const AreaTooltipStory: StoryFn<typeof ChartTooltip> = (args): ReactElement => {
	const chartProps = useChartProps({ data: lineData, width: 600 });
	return (
		<Chart {...chartProps}>
			<Area>
				<ChartTooltip {...args} />
			</Area>
		</Chart>
	);
};

const StackedBarChart = StackedBarTooltipStory.bind({});
StackedBarChart.args = {
	children: (datum: LineData) => (
		<div className="bar-tooltip">
			<div>Operating system: {datum.series}</div>
			<div>Browser: {datum.category}</div>
			<div>Users: {datum.value}</div>
		</div>
	),
};

const DodgedBarChart = DodgedBarTooltipStory.bind({});
DodgedBarChart.args = {
	children: (datum: LineData) => (
		<div className="bar-tooltip">
			<div>Operating system: {datum.series}</div>
			<div>Browser: {datum.category}</div>
			<div>Users: {datum.value}</div>
		</div>
	),
};

const LineChart = bindWithProps(LineTooltipStory);
LineChart.args = {
	children: (datum: LineData) => (
		<div className="bar-tooltip">
			<div>{formatTimestamp(datum.datetime as number)}</div>
			<div>Event: {datum.series}</div>
			<div>Count: {Number(datum.value).toLocaleString()}</div>
			<div>Users: {Number(datum.users).toLocaleString()}</div>
		</div>
	),
};

const AreaChart = bindWithProps(AreaTooltipStory);
AreaChart.args = {
	children: (datum: LineData) => (
		<div className="bar-tooltip">
			<div>{formatTimestamp(datum.datetime as number)}</div>
			<div>Event: {datum.series}</div>
			<div>Count: {Number(datum.value).toLocaleString()}</div>
			<div>Users: {Number(datum.users).toLocaleString()}</div>
		</div>
	),
};

export { AreaChart, DodgedBarChart, LineChart, StackedBarChart };
