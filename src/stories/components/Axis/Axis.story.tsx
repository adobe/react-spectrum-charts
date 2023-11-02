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

import { DEFAULT_GRANULARITY } from '@constants';
import useChartProps from '@hooks/useChartProps';
import { Axis, Bar, Chart, ChartTooltip, Line } from '@rsc';
import { stockPriceData, workspaceTrendsData } from '@stories/data/data';
import { ComponentStory } from '@storybook/react';
import { bindWithProps } from '@test-utils';

import { barData } from '../Bar/data';
import timeData from './timeData.json';

export default {
	title: 'RSC/Axis',
	component: Axis,
	argTypes: {},
	parameters: {
		docs: {
			description: {
				component: 'This is _markdown_ enabled description for Axis component doc page.',
			},
		},
	},
};

const data = [
	{ x: 0, y: 0, series: 0 },
	{ x: 1, y: 1, series: 0 },
];

const AxisStory: ComponentStory<typeof Axis> = (args): ReactElement => {
	const chartProps = useChartProps({ data, width: 600 });
	return (
		<Chart {...chartProps}>
			<Axis {...args} />
		</Chart>
	);
};

const TimeAxisStory: ComponentStory<typeof Axis> = (args): ReactElement => {
	return (
		<Chart data={timeData[args.granularity ?? DEFAULT_GRANULARITY]} width={600}>
			<Axis {...args} />
			<Line />
		</Chart>
	);
};

const SubLabelStory: ComponentStory<typeof Axis> = (args): ReactElement => {
	return (
		<Chart data={barData} width={600}>
			<Axis {...args} />
			<Bar dimension="browser" metric="downloads" />
		</Chart>
	);
};

const LinearAxisStory: ComponentStory<typeof Axis> = (args): ReactElement => {
	const chartProps = useChartProps({ data: workspaceTrendsData, width: 600 });
	return (
		<Chart {...chartProps}>
			<Axis position="left" grid title="Users" />
			<Axis {...args} />
			<Line color="series" dimension="point" scaleType="linear" />
		</Chart>
	);
};

const NonLinearAxisStory: ComponentStory<typeof Axis> = (args): ReactElement => {
	const chartProps = useChartProps({ data: workspaceTrendsData, width: 600 });
	return (
		<Chart {...chartProps}>
			<Axis position="bottom" ticks baseline labelFormat="time" />
			<Axis {...args} />
			<Line color="series" lineType="period" scaleType="time" />
		</Chart>
	);
};

const SparkLineStory: ComponentStory<typeof Axis> = (args): ReactElement => {
	const chartProps = useChartProps({ data: stockPriceData, width: 200, height: 100 });
	return (
		<Chart {...chartProps}>
			<Axis {...args} />
			<Line dimension="timestamp" metric="price" scaleType="point" padding={0}>
				<ChartTooltip>
					{(item) => (
						<>
							<div>{item.stock}</div>
							<div style={{ fontWeight: 'bold', fontSize: 24 }}>${(item.price as number).toFixed(2)}</div>
							<div>{item.date}</div>
						</>
					)}
				</ChartTooltip>
			</Line>
		</Chart>
	);
};

const Basic = bindWithProps(AxisStory);
Basic.args = {
	position: 'left',
	baseline: true,
	grid: true,
	labelFormat: 'percentage',
	ticks: true,
	title: 'Conversion Rate',
};

const Time = bindWithProps(TimeAxisStory);
Time.args = {
	granularity: 'day',
	position: 'bottom',
	baseline: true,
	labelFormat: 'time',
	ticks: true,
	labelAlign: 'center',
};

const SubLabels = bindWithProps(SubLabelStory);
SubLabels.args = {
	position: 'bottom',
	baseline: true,
	title: 'Browser',
	subLabels: [
		{ value: 'Chrome', subLabel: '80.1+' },
		{ value: 'Firefox', subLabel: '70.0+' },
		{ value: 'Safari', subLabel: '10.13 (High Sierra)+' },
	],
	labelAlign: 'start',
};

const TickMinStep = bindWithProps(LinearAxisStory);
TickMinStep.args = {
	position: 'bottom',
	baseline: true,
	labelFormat: 'linear',
	ticks: true,
	tickMinStep: 4,
};

const NonLinearAxis = bindWithProps(NonLinearAxisStory);
NonLinearAxis.args = {
	position: 'left',
	tickMinStep: 5,
	title: 'Events',
	grid: true,
};

const CustomXRange = bindWithProps(LinearAxisStory);
CustomXRange.args = {
	position: 'bottom',
	baseline: true,
	labelFormat: 'linear',
	ticks: true,
	tickMinStep: 5,
	range: [-5, 30],
};

const ControlledLabels = bindWithProps(SparkLineStory);
ControlledLabels.args = {
	position: 'bottom',
	labels: [
		{ value: 1685577600000, label: 'Jun 1', align: 'start' },
		{ value: 1687996800000, label: 'Jun 29', align: 'end' },
	],
};

export { Basic, Time, SubLabels, TickMinStep, NonLinearAxis, CustomXRange, ControlledLabels };
