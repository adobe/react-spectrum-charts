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
import { Area, Axis, Bar, Chart, ChartPopover, ChartProps, ChartTooltip, Datum, Legend, Line } from '@rsc';
import { Donut, DonutSummary } from '@rsc/rc';
import { browserData as data } from '@stories/data/data';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';

import { Content } from '@adobe/react-spectrum';

import { basicDonutData } from '../Donut/data';

export default {
	title: 'RSC/ChartPopover',
	component: ChartPopover,
	argTypes: {
		children: {
			description: '`(datum: Datum, close: () => void)`',
			control: {
				type: null,
			},
		},
	},
};

const dialogContent = (datum: Datum) => (
	<Content>
		<div>Operating system: {datum.series}</div>
		<div>Browser: {datum.category}</div>
		<div>Users: {datum.value}</div>
	</Content>
);

const defaultChartProps: ChartProps = { animations: false, data, renderer: 'svg', width: 600 };

const ChartPopoverCanvasStory: StoryFn<typeof ChartPopover> = (args): ReactElement => {
	const chartProps = useChartProps({ animations: false, data, renderer: 'canvas', width: 600 });
	return (
		<Chart {...chartProps}>
			<Bar color="series">
				<ChartTooltip>{dialogContent}</ChartTooltip>
				<ChartPopover {...args} />
			</Bar>
		</Chart>
	);
};

const ChartPopoverSvgStory: StoryFn<typeof ChartPopover> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartProps);
	return (
		<Chart {...chartProps}>
			<Bar color="series">
				<ChartTooltip>{dialogContent}</ChartTooltip>
				<ChartPopover {...args} />
			</Bar>
		</Chart>
	);
};

const ChartPopoverDodgedBarStory: StoryFn<typeof ChartPopover> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartProps);
	return (
		<Chart {...chartProps}>
			<Bar color="series" type="dodged">
				<ChartTooltip>{dialogContent}</ChartTooltip>
				<ChartPopover {...args} />
			</Bar>
		</Chart>
	);
};

const LineStory: StoryFn<typeof ChartPopover> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartProps);
	return (
		<Chart {...chartProps}>
			<Axis position="bottom" baseline />
			<Axis position="left" grid />
			<Line scaleType="point" dimension="category" color="series">
				<ChartTooltip>{dialogContent}</ChartTooltip>
				<ChartPopover {...args} />
			</Line>
			<Legend />
		</Chart>
	);
};

const AreaStory: StoryFn<typeof ChartPopover> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartProps);
	return (
		<Chart {...chartProps}>
			<Axis position="bottom" baseline />
			<Axis position="left" grid />
			<Area scaleType="point" dimension="category">
				<ChartTooltip>{dialogContent}</ChartTooltip>
				<ChartPopover {...args} />
			</Area>
			<Legend />
		</Chart>
	);
};

// content for tooltip and popover
const donutDialogContent = (datum: Datum) => {
	return (
		<Content>
			<div>Browser: {datum.browser}</div>
			<div>Visitors: {datum.count}</div>
		</Content>
	);
};

const DonutStory: StoryFn<typeof ChartPopover> = (args): ReactElement => {
	const chartProps = useChartProps({ data: basicDonutData, width: 350, height: 350 });
	return (
		<Chart {...chartProps}>
			<Donut metric="count" color="browser">
				<DonutSummary label="Visitors" />
				<ChartTooltip>{donutDialogContent}</ChartTooltip>
				<ChartPopover {...args} />
			</Donut>
		</Chart>
	);
};

const Canvas = bindWithProps(ChartPopoverCanvasStory);
Canvas.args = { children: dialogContent, width: 'auto' };

const Svg = bindWithProps(ChartPopoverSvgStory);
Svg.args = { children: dialogContent, width: 'auto' };

const Size = bindWithProps(ChartPopoverSvgStory);
Size.args = { children: dialogContent, width: 200, height: 100 };

const MinWidth = bindWithProps(ChartPopoverSvgStory);
MinWidth.args = { children: dialogContent, width: 'auto', minWidth: 250 };

const OnOpenChange = bindWithProps(ChartPopoverSvgStory);
OnOpenChange.args = { children: dialogContent, width: 'auto' };

const AreaChart = bindWithProps(AreaStory);
AreaChart.args = { children: dialogContent, width: 'auto' };

const DodgedBarChart = bindWithProps(ChartPopoverDodgedBarStory);
DodgedBarChart.args = { children: dialogContent, width: 'auto' };

const LineChart = bindWithProps(LineStory);
LineChart.args = { children: dialogContent, width: 'auto' };

const StackedBarChart = bindWithProps(ChartPopoverSvgStory);
StackedBarChart.args = { children: dialogContent, width: 'auto' };

const DonutChart = bindWithProps(DonutStory);
DonutChart.args = { children: donutDialogContent, width: 'auto' };

export { Canvas, Svg, Size, MinWidth, OnOpenChange, AreaChart, DodgedBarChart, LineChart, StackedBarChart, DonutChart };
