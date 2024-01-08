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
import { Chart, ChartPopover, ChartTooltip, Donut, Legend } from '@rsc';
import { ComponentStory } from '@storybook/react';
import { bindWithProps } from '@test-utils';

import { Content } from '@adobe/react-spectrum';

import { basicDonutData, booleanDonutData, sliveredDonutData } from './data';

export default {
	title: 'RSC/Donut',
	component: Donut,
};

const DonutStory: ComponentStory<typeof Donut> = (args): ReactElement => {
	const chartProps = useChartProps({ data: basicDonutData, width: 350, height: 350 });
	return (
		<Chart {...chartProps}>
			<Donut {...args} />
		</Chart>
	);
};

const Basic = bindWithProps(DonutStory);
Basic.args = {
	metric: 'count',
	metricLabel: 'Visitors',
	color: 'id',
};

const WithDirectLabels = bindWithProps(DonutStory);
WithDirectLabels.args = {
	metric: 'count',
	metricLabel: 'Visitors',
	segment: 'segment',
	color: 'id',
	hasDirectLabels: true,
};

const dialogContent = (datum) => {
	return (
		<Content>
			<div>Browser: {datum.segment}</div>
			<div>Visitors: {datum.count}</div>
		</Content>
	);
};

const DonutTooltipStory: ComponentStory<typeof Donut> = (args): ReactElement => {
	const chartProps = useChartProps({ data: basicDonutData, width: 350, height: 350 });
	return (
		<Chart {...chartProps}>
			<Donut {...args}>
				<ChartTooltip>{dialogContent}</ChartTooltip>
				<ChartPopover width={150}>{dialogContent}</ChartPopover>
			</Donut>
		</Chart>
	);
};

const WithPopover = bindWithProps(DonutTooltipStory);
WithPopover.args = {
	metric: 'count',
	metricLabel: 'Visitors',
	color: 'id',
};

const DonutLegendStory: ComponentStory<typeof Donut> = (args): ReactElement => {
	const chartProps = useChartProps({ data: basicDonutData, width: 400, height: 350 });
	return (
		<Chart {...chartProps}>
			<Donut {...args} />
			<Legend
				title="Browsers"
				position={'right'}
				legendLabels={basicDonutData.map((d) => ({ label: d.segment, seriesName: d.id }))}
				highlight
				isToggleable
			/>
		</Chart>
	);
};

const WithLegend = bindWithProps(DonutLegendStory);
WithLegend.args = {
	metric: 'count',
	metricLabel: 'Visitors',
	color: 'id',
};

const EverythingBagel: ComponentStory<typeof Donut> = (args): ReactElement => {
	const chartProps = useChartProps({ data: basicDonutData, width: 400, height: 350 });
	return (
		<Chart {...chartProps}>
			<Donut {...args}>
				<ChartTooltip>{dialogContent}</ChartTooltip>
				<ChartPopover width={150}>{dialogContent}</ChartPopover>
			</Donut>
			<Legend
				title="Browsers"
				position={'right'}
				legendLabels={basicDonutData.map((d) => ({ label: d.segment, seriesName: d.id }))}
				highlight
				isToggleable
			/>
		</Chart>
	);
};

const Everything = bindWithProps(EverythingBagel);
Everything.args = {
	metric: 'count',
	metricLabel: 'Visitors',
	segment: 'segment',
	color: 'id',
	hasDirectLabels: true,
	holeRatio: 0.8,
};

const SliversStory: ComponentStory<typeof Donut> = (args): ReactElement => {
	const chartProps = useChartProps({ data: sliveredDonutData, width: 350, height: 350 });
	return (
		<Chart {...chartProps}>
			<Donut {...args}>
				<ChartTooltip>{dialogContent}</ChartTooltip>
				<ChartPopover width={150}>{dialogContent}</ChartPopover>
			</Donut>
		</Chart>
	);
};

const Slivers = bindWithProps(SliversStory);
Slivers.args = {
	metric: 'count',
	metricLabel: 'Visitors',
	segment: 'segment',
	color: 'id',
	hasDirectLabels: true,
	holeRatio: 0.8,
};

const BooleanStory: ComponentStory<typeof Donut> = (args): ReactElement => {
	const positiveBooleanProps = useChartProps({
		data: booleanDonutData,
		width: 350,
		height: 350,
		colors: ['green-700', 'gray-200'],
	});
	const negativeBooleanProps = useChartProps({
		data: [...booleanDonutData].reverse(),
		width: 350,
		height: 350,
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

const BooleanDonut = bindWithProps(BooleanStory);
BooleanDonut.args = {
	metric: 'value',
	metricLabel: 'Success rate',
	color: 'id',
	isBoolean: true,
};

export { Basic, WithDirectLabels, WithPopover, WithLegend, Everything, Slivers, BooleanDonut };
