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

import { TRENDLINE_VALUE } from '@constants';
import useChartProps from '@hooks/useChartProps';
import { Axis, Chart, ChartPopover, ChartProps, ChartTooltip, Legend, Line, Trendline } from '@rsc';
import { workspaceTrendsData } from '@stories/data/data';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from 'test-utils/bindWithProps';

export default {
	title: 'RSC/Trendline',
	component: Trendline,
	argTypes: {
		method: {
			control: {
				type: 'select',
				options: [
					'average',
					'exponential',
					'linear',
					'logarithmic',
					'movingAverage-2',
					'movingAverage-3',
					'movingAverage-4',
					'movingAverage-5',
					'movingAverage-6',
					'movingAverage-7',
					'polynomial-1',
					'polynomial-2',
					'polynomial-3',
					'polynomial-4',
					'polynomial-5',
					'polynomial-6',
					'power',
					'quadratic',
				],
			},
		},
	},
};

const defaultChartProps: ChartProps = { data: workspaceTrendsData, minWidth: 400, maxWidth: 800, height: 400 };

const TrendlineStory: StoryFn<typeof Trendline> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartProps);
	return (
		<Chart {...chartProps}>
			<Axis position="left" grid title="Users" />
			<Axis position="bottom" labelFormat="time" baseline ticks />
			<Line color="series">
				<Trendline {...args} />
			</Line>
			<Legend lineWidth={{ value: 0 }} highlight />
		</Chart>
	);
};

const TrendlineWithDialogsStory: StoryFn<typeof Trendline> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartProps);
	return (
		<Chart {...chartProps}>
			<Axis position="left" grid title="Users" />
			<Axis position="bottom" labelFormat="time" baseline ticks />
			<Line color="series">
				<Trendline {...args}>
					<ChartTooltip>
						{(item) => (
							<>
								<div>Trendline value: {item[TRENDLINE_VALUE]}</div>
								<div>Line value: {item.value}</div>
							</>
						)}
					</ChartTooltip>
					<ChartPopover>
						{(item) => (
							<>
								<div>Trendline value: {item[TRENDLINE_VALUE]}</div>
								<div>Line value: {item.value}</div>
							</>
						)}
					</ChartPopover>
				</Trendline>
			</Line>
			<Legend lineWidth={{ value: 0 }} highlight />
		</Chart>
	);
};

const TrendlineWithDialogsOnParentStory: StoryFn<typeof Trendline> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartProps);
	return (
		<Chart {...chartProps}>
			<Axis position="left" grid title="Users" />
			<Axis position="bottom" labelFormat="time" baseline ticks />
			<Line color="series">
				<ChartTooltip>
					{(item) => (
						<>
							<div>Trendline value: {item[TRENDLINE_VALUE]}</div>
							<div>Line value: {item.value}</div>
						</>
					)}
				</ChartTooltip>
				<ChartPopover>
					{(item) => (
						<>
							<div>Trendline value: {item[TRENDLINE_VALUE]}</div>
							<div>Line value: {item.value}</div>
						</>
					)}
				</ChartPopover>
				<Trendline {...args} />
			</Line>
			<Legend lineWidth={{ value: 0 }} highlight />
		</Chart>
	);
};

const Basic = bindWithProps(TrendlineStory);
Basic.args = {
	method: 'linear',
	lineType: 'dashed',
	lineWidth: 'S',
};

const DimensionRange = bindWithProps(TrendlineWithDialogsStory);
DimensionRange.args = {
	method: 'linear',
	lineType: 'dashed',
	lineWidth: 'S',
	highlightRawPoint: true,
	dimensionRange: [1668063600000, null],
};

const DisplayOnHover = bindWithProps(TrendlineStory);
DisplayOnHover.args = {
	displayOnHover: true,
	method: 'linear',
	lineType: 'solid',
	lineWidth: 'S',
	color: 'gray-600',
};

const TooltipAndPopover = bindWithProps(TrendlineWithDialogsStory);
TooltipAndPopover.args = {
	highlightRawPoint: true,
};

const TooltipAndPopoverOnParentLine = bindWithProps(TrendlineWithDialogsOnParentStory);
TooltipAndPopoverOnParentLine.args = {
	method: 'linear',
	lineType: 'dashed',
	lineWidth: 'S',
};

export { Basic, DimensionRange, DisplayOnHover, TooltipAndPopover, TooltipAndPopoverOnParentLine };
