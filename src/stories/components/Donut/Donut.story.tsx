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

import { donutData } from './data';

export default {
	title: 'RSC/Donut',
	component: Donut,
};

const DonutStory: ComponentStory<typeof Donut> = (args): ReactElement => {
	const chartProps = useChartProps({ data: donutData, width: 350, height: 350 });
	return (
		<Chart {...chartProps} debug>
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
	const chartProps = useChartProps({ data: donutData, width: 350, height: 350 });
	return (
		<Chart {...chartProps} debug>
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
	segment: 'segment',
	color: 'id',
};

const DonutLegendStory: ComponentStory<typeof Donut> = (args): ReactElement => {
	const chartProps = useChartProps({ data: donutData, width: 400, height: 350 });
	return (
		<Chart {...chartProps} debug>
			<Donut {...args} />
			<Legend
				title="Browsers"
				position={'right'}
				legendLabels={donutData.map((d) => ({ label: d.segment, seriesName: d.id }))}
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
	segment: 'segment',
	color: 'id',
};

export { Basic, WithDirectLabels, WithPopover, WithLegend };
