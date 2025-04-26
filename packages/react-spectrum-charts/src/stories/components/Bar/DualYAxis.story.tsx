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

import { StoryFn } from '@storybook/react';

import { Content } from '@adobe/react-spectrum';

import { Chart } from '../../../Chart';
import { Axis, Bar, ChartPopover, ChartTooltip, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { BarProps } from '../../../types';
import { barSeriesData, barSeriesDataTwoSeries } from './data';

export default {
	title: 'RSC/Bar/Dual Axis',
	component: Bar,
};

const dialogContent = (datum) => (
	<Content>
		<div>Operating system: {datum.operatingSystem}</div>
		<div>Browser: {datum.browser}</div>
		<div>Users: {datum.value}</div>
	</Content>
);

const DualYAxisStory: StoryFn<typeof Bar> = (args): ReactElement => {
	const chartProps = useChartProps({ data: barSeriesDataTwoSeries, width: 800, height: 600 });
	return (
		<Chart {...chartProps}>
			<Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
			<Axis
				position={args.orientation === 'horizontal' ? 'bottom' : 'left'}
				ticks
				tickMinStep={1}
				title="Downloads"
			/>
			<Axis
				position={args.orientation === 'horizontal' ? 'bottom' : 'right'}
				ticks
				tickMinStep={1}
				title="Downloads"
			/>
			<Bar {...args}>
				<ChartTooltip>{dialogContent}</ChartTooltip>
				<ChartPopover width={200}>{dialogContent}</ChartPopover>
			</Bar>
			<Legend title="Operating system" highlight />
		</Chart>
	);
};

const WithSublabelsStory: StoryFn<typeof Bar> = (args): ReactElement => {
	const chartProps = useChartProps({ data: barSeriesDataTwoSeries, width: 800, height: 600 });
	return (
		<Chart {...chartProps}>
			<Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
			<Axis
				position={args.orientation === 'horizontal' ? 'bottom' : 'left'}
				ticks
				tickMinStep={1}
				title="Downloads"
				subLabels={[
					{ value: '1', subLabel: 'Low' },
					{ value: '2', subLabel: 'Medium' },
					{ value: '5', subLabel: 'High' },
				]}
			/>
			<Axis
				position={args.orientation === 'horizontal' ? 'bottom' : 'right'}
				ticks
				tickMinStep={1}
				title="Downloads"
				subLabels={[
					{ value: '1', subLabel: 'Low' },
					{ value: '2', subLabel: 'Medium' },
					{ value: '3', subLabel: 'High' },
				]}
			/>
			<Bar {...args}>
				<ChartTooltip>{dialogContent}</ChartTooltip>
				<ChartPopover width={200}>{dialogContent}</ChartPopover>
			</Bar>
			<Legend title="Operating system" highlight />
		</Chart>
	);
};

const WithThreeSeriesStory: StoryFn<typeof Bar> = (args): ReactElement => {
	const chartProps = useChartProps({ data: barSeriesData, width: 800, height: 600 });
	return (
		<Chart {...chartProps}>
			<Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
			<Axis
				position={args.orientation === 'horizontal' ? 'bottom' : 'left'}
				ticks
				tickMinStep={1}
				title="Downloads"
			/>
			<Axis
				position={args.orientation === 'horizontal' ? 'bottom' : 'right'}
				ticks
				tickMinStep={1}
				title="Downloads"
			/>
			<Bar {...args}>
				<ChartTooltip>{dialogContent}</ChartTooltip>
				<ChartPopover width={200}>{dialogContent}</ChartPopover>
			</Bar>
			<Legend title="Operating system" highlight />
		</Chart>
	);
};

const defaultProps: BarProps = {
	type: 'dodged',
	dimension: 'browser',
	onClick: undefined,
};

const DualYAxis = bindWithProps(DualYAxisStory);
DualYAxis.args = {
	...defaultProps,
	orientation: 'vertical',
	order: 'order',
	color: 'operatingSystem',
};

const WithSublabels = bindWithProps(WithSublabelsStory);
WithSublabels.args = {
	...defaultProps,
	orientation: 'vertical',
	order: 'order',
	color: 'operatingSystem',
};

const WithThreeSeries = bindWithProps(WithThreeSeriesStory);
WithThreeSeries.args = {
	...defaultProps,
	orientation: 'vertical',
	order: 'order',
	color: 'operatingSystem',
};

export {
	DualYAxis,
	WithSublabels,
	WithThreeSeries,
};
