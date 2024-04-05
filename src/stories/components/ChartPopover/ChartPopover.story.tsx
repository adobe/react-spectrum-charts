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
import { Area, Axis, Bar, Chart, ChartPopover, ChartProps, ChartTooltip, Legend, Line } from '@rsc';
import { browserData as data } from '@stories/data/data';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';

import { Content } from '@adobe/react-spectrum';

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

const dialogContent = (datum) => (
	<Content>
		<div>Operating system: {datum.series}</div>
		<div>Browser: {datum.category}</div>
		<div>Users: {datum.value}</div>
	</Content>
);

const defaultChartProps: ChartProps = {animations: false, data, renderer: 'svg', width: 600 };

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

const Canvas = bindWithProps(ChartPopoverCanvasStory);
Canvas.args = { children: dialogContent, width: 250 };

const Svg = bindWithProps(ChartPopoverSvgStory);
Svg.args = { children: dialogContent, width: 250 };

const AreaChart = bindWithProps(AreaStory);
AreaChart.args = { children: dialogContent };

const DodgedBarChart = bindWithProps(ChartPopoverDodgedBarStory);
DodgedBarChart.args = { children: dialogContent, width: 250 };

const LineChart = bindWithProps(LineStory);
LineChart.args = { children: dialogContent };

const StackedBarChart = bindWithProps(ChartPopoverSvgStory);
StackedBarChart.args = { children: dialogContent, width: 250 };

export { Canvas, Svg, AreaChart, DodgedBarChart, LineChart, StackedBarChart };
