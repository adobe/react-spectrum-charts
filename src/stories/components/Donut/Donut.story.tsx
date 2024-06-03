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

import useChartProps from '@hooks/useChartProps';
import { Chart, ChartPopover, ChartProps, ChartTooltip, Datum, Legend } from '@rsc';
import { Donut } from '@rsc/alpha';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';

import { Content } from '@adobe/react-spectrum';

import { basicDonutData, booleanDonutData, sliveredDonutData } from './data';

export default {
	title: 'RSC/Donut (alpha)',
	component: Donut,
};

const defaultChartProps: ChartProps = {
	data: basicDonutData,
	width: 350,
	height: 350,
};

const DonutStory: StoryFn<typeof Donut> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartProps);
	return (
		<Chart {...chartProps}>
			<Donut {...args} />
		</Chart>
	);
};

const DonutLegendStory: StoryFn<typeof Donut> = (args): ReactElement => {
	const chartProps = useChartProps({ ...defaultChartProps, width: 400 });
	return (
		<Chart {...chartProps}>
			<Donut {...args} />
			<Legend title="Browsers" position={'right'} highlight isToggleable />
		</Chart>
	);
};

const SliversStory: StoryFn<typeof Donut> = (args): ReactElement => {
	const chartProps = useChartProps({ ...defaultChartProps, data: sliveredDonutData });
	return (
		<Chart {...chartProps}>
			<Donut {...args} />
		</Chart>
	);
};

const BooleanStory: StoryFn<typeof Donut> = (args): ReactElement => {
	const positiveBooleanProps = useChartProps({
		...defaultChartProps,
		data: booleanDonutData,
		colors: ['green-700', 'gray-200'],
	});
	const negativeBooleanProps = useChartProps({
		...defaultChartProps,
		data: [...booleanDonutData].reverse(),
		colors: ['red-700', 'gray-200'],
	});
	return (
		<div style={{ display: 'flex', flexDirection: 'row', gap: '30px' }}>
			<Chart {...positiveBooleanProps}>
				<Donut {...args} />
			</Chart>

			<Chart {...negativeBooleanProps}>
				<Donut {...args} />
			</Chart>
		</div>
	);
};

// content for tooltip and popover
const dialogContent = (datum: Datum) => {
	return (
		<Content>
			<div>Browser: {datum.browser}</div>
			<div>Visitors: {datum.count}</div>
		</Content>
	);
};

// tooltip and popover
const interactiveChildren = [
	<ChartTooltip key={0}>{dialogContent}</ChartTooltip>,
	<ChartPopover width="auto" key={1}>
		{dialogContent}
	</ChartPopover>,
];

const Basic = bindWithProps(DonutStory);
Basic.args = {
	metric: 'count',
	metricLabel: 'Visitors',
	color: 'browser',
};

const WithDirectLabels = bindWithProps(DonutStory);
WithDirectLabels.args = {
	metric: 'count',
	metricLabel: 'Visitors',
	segment: 'browser',
	color: 'browser',
	hasDirectLabels: true,
};

const WithPopover = bindWithProps(DonutStory);
WithPopover.args = {
	metric: 'count',
	metricLabel: 'Visitors',
	color: 'browser',
	children: interactiveChildren,
};

const WithLegend = bindWithProps(DonutLegendStory);
WithLegend.args = {
	metric: 'count',
	metricLabel: 'Visitors',
	color: 'browser',
};

const Everything = bindWithProps(DonutLegendStory);
Everything.args = {
	metric: 'count',
	metricLabel: 'Visitors',
	segment: 'browser',
	color: 'browser',
	hasDirectLabels: true,
	holeRatio: 0.8,
	children: interactiveChildren,
};

const Slivers = bindWithProps(SliversStory);
Slivers.args = {
	metric: 'count',
	metricLabel: 'Visitors',
	segment: 'browser',
	color: 'browser',
	hasDirectLabels: true,
	holeRatio: 0.8,
};

const BooleanDonut = bindWithProps(BooleanStory);
BooleanDonut.args = {
	metric: 'value',
	metricLabel: 'Success rate',
	color: 'id',
	isBoolean: true,
};

export { Basic, WithDirectLabels, WithPopover, WithLegend, Everything, Slivers, BooleanDonut };
