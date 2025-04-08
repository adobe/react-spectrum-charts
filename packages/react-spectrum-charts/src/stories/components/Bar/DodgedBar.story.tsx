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
import React, { ReactElement, createElement } from 'react';

import { StoryFn } from '@storybook/react';

import { Content } from '@adobe/react-spectrum';
import { categorical6 } from '@spectrum-charts/themes';

import { Chart } from '../../../Chart';
import { Annotation } from '../../../components';
import { Axis, Bar, ChartPopover, ChartTooltip, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { BarProps } from '../../../types';
import { barSeriesData, barSubSeriesData } from './data';

export default {
	title: 'RSC/Bar/Dodged Bar',
	component: Bar,
};

const DodgedBarStory: StoryFn<typeof Bar> = (args): ReactElement => {
	const { color } = args;
	const colors = Array.isArray(color)
		? [
				['#00a6a0', '#4bcec7'],
				['#575de8', '#8489fd'],
				['#d16100', '#fa8b1a'],
		  ]
		: categorical6;
	const data = Array.isArray(color) ? barSubSeriesData : barSeriesData;
	const chartProps = useChartProps({ data, width: 800, height: 600, colors });
	return (
		<Chart {...chartProps}>
			<Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
			<Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
			<Bar {...args} />
			<Legend title="Operating system" highlight />
		</Chart>
	);
};

const dialogContent = (datum) => (
	<Content>
		<div>Operating system: {datum.operatingSystem}</div>
		<div>Browser: {datum.browser}</div>
		<div>Users: {datum.value}</div>
	</Content>
);

const DodgedBarPopoverStory: StoryFn<typeof Bar> = (args): ReactElement => {
	const chartProps = useChartProps({ data: barSeriesData, width: 800, height: 600 });
	return (
		<Chart {...chartProps}>
			<Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
			<Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
			<Bar {...args}>
				<ChartTooltip>{dialogContent}</ChartTooltip>
				<ChartPopover width={200}>{dialogContent}</ChartPopover>
			</Bar>
			<Legend title="Operating system" highlight />
		</Chart>
	);
};

const DodgedBarLineTypeStory: StoryFn<typeof Bar> = (args): ReactElement => {
	const chartProps = useChartProps({ data: barSeriesData, width: 800, height: 600 });
	return (
		<Chart {...chartProps}>
			<Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
			<Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
			<Bar {...args} />
			<Legend title="Operating system" opacity={{ value: 0.2 }} />
		</Chart>
	);
};

const defaultProps: BarProps = {
	type: 'dodged',
	dimension: 'browser',
	onClick: undefined,
};

const Color = bindWithProps(DodgedBarStory);
Color.args = {
	...defaultProps,
	order: 'order',
	color: 'operatingSystem',
};

const DodgedStacked = bindWithProps(DodgedBarStory);
DodgedStacked.args = {
	...defaultProps,
	color: ['operatingSystem', 'version'],
};

const LineType = bindWithProps(DodgedBarLineTypeStory);
LineType.args = {
	...defaultProps,
	order: 'order',
	lineType: 'operatingSystem',
	lineWidth: 2,
	opacity: { value: 0.2 },
};

const Opacity = bindWithProps(DodgedBarStory);
Opacity.args = {
	...defaultProps,
	order: 'order',
	opacity: 'operatingSystem',
};

const Popover = bindWithProps(DodgedBarPopoverStory);
Popover.args = {
	...defaultProps,
	order: 'order',
	color: 'operatingSystem',
};

const DodgedStackedWithLabels = bindWithProps(DodgedBarStory);
DodgedStackedWithLabels.args = {
	...defaultProps,
	color: ['operatingSystem', 'version'],
	children: createElement(Annotation, { textKey: 'percentLabel' }),
	paddingRatio: 0.1,
};

const OnClick = bindWithProps(DodgedBarStory);
OnClick.args = {
	type: 'dodged',
	dimension: 'browser',
	order: 'order',
	color: 'operatingSystem',
};

export { Color, DodgedStacked, DodgedStackedWithLabels, LineType, Opacity, Popover, OnClick };
