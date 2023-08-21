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

import { ChartTooltip } from '@components/ChartTooltip/ChartTooltip';
import usePrismProps from '@hooks/usePrismProps';
import { Area, Bar, Datum, Line, Prism } from '@prism';
import { browserData as data } from '@stories/data/data';
import { ComponentStory } from '@storybook/react';
import { bindWithProps } from '@test-utils';
import dayjs from 'dayjs';
import React, { ReactElement } from 'react';

export default {
	title: 'Prism/ChartTooltip',
	component: ChartTooltip,
	argTypes: {
		children: {
			description: '`(datum) => React.ReactElement`',
			control: {
				type: null,
			},
		},
	},
	parameters: {
		docs: {
			description: {
				component: 'This is _markdown_ enabled description for ChartTooltip component doc page.',
			},
		},
	},
};

const StackedBarTooltipStory: ComponentStory<typeof ChartTooltip> = (args): ReactElement => {
	const prismProps = usePrismProps({ data, width: 600 });
	return (
		<Prism {...prismProps}>
			<Bar color="series">
				<ChartTooltip {...args} />
			</Bar>
		</Prism>
	);
};
const DodgedBarTooltipStory: ComponentStory<typeof ChartTooltip> = (args): ReactElement => {
	const prismProps = usePrismProps({ data, width: 600 });
	return (
		<Prism {...prismProps}>
			<Bar type="dodged" color="series">
				<ChartTooltip {...args} />
			</Bar>
		</Prism>
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

const LineTooltipStory: ComponentStory<typeof ChartTooltip> = (args): ReactElement => {
	const prismProps = usePrismProps({ data: lineData, width: 600 });
	return (
		<Prism {...prismProps}>
			<Line color="series">
				<ChartTooltip {...args} />
			</Line>
		</Prism>
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

const AreaTooltipStory: ComponentStory<typeof ChartTooltip> = (args): ReactElement => {
	const prismProps = usePrismProps({ data: lineData, width: 600 });
	return (
		<Prism {...prismProps}>
			<Area>
				<ChartTooltip {...args} />
			</Area>
		</Prism>
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
			<div>{dayjs(datum.datetime as number).format('MMM D')}</div>
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
			<div>{dayjs(datum.datetime as number).format('MMM D')}</div>
			<div>Event: {datum.series}</div>
			<div>Count: {Number(datum.value).toLocaleString()}</div>
			<div>Users: {Number(datum.users).toLocaleString()}</div>
		</div>
	),
};

export { AreaChart, DodgedBarChart, LineChart, StackedBarChart };
