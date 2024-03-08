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

import { MARK_ID } from '@constants';
import useChartProps from '@hooks/useChartProps';
import { Axis, Bar, Chart, ChartPopover, ChartTooltip, Legend } from '@rsc';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';

import { Content, Text, View } from '@adobe/react-spectrum';

import { BarProps, Datum, SpectrumColor } from '../../../types';
import { generateMockDataForTrellis } from './data';

export default {
	title: 'RSC/Bar/Trellis',
	component: Bar,
};

const colors: SpectrumColor[] = [
	'sequential-magma-200',
	'sequential-magma-400',
	'sequential-magma-600',
	'sequential-magma-800',
	'sequential-magma-1000',
	'sequential-magma-1200',
	'sequential-magma-1400',
];

const BarStory: StoryFn<typeof Bar> = (args: BarProps): ReactElement => {
	const chartProps = useChartProps({
		data: generateMockDataForTrellis({
			property1: ['All users', 'Roku', 'Chromecast', 'Amazon Fire', 'Apple TV'],
			property2: ['A. Sign up', 'B. Watch a video', 'C. Add to MyList'],
			property3: ['1-5 times', '6-10 times', '11-15 times', '16-20 times', '21-25 times', '26+ times'],
			propertyNames: ['segment', 'event', 'bucket'],
			randomizeSteps: false,
			orderBy: 'bucket',
		}),
		colors,
		width: 800,
		height: 800,
		debug: true
	});

	const dialog = (item: Datum) => {
		return (
			<Content>
				<View>
					<Text>{item[MARK_ID]}</Text>
				</View>
			</Content>
		);
	};

	return (
		<Chart {...chartProps}>
			<Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} title="Users, Count" grid />
			<Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} title="Platform" baseline />
			<Bar {...args}>
				<ChartTooltip>{dialog}</ChartTooltip>
				<ChartPopover>{dialog}</ChartPopover>
			</Bar>
			<Legend />
		</Chart>
	);
};

const Dodged = bindWithProps<BarProps>(BarStory);
Dodged.args = {
	type: 'dodged',
	dimension: 'segment',
	onClick: undefined,
	order: 'order',
	color: 'bucket',
	trellis: 'event',
	trellisOrientation: 'horizontal',
	orientation: 'horizontal',
};

const HorizontalBarHorizontalTrellis = bindWithProps<BarProps>(BarStory);
HorizontalBarHorizontalTrellis.storyName = 'Horizontal Bar, Horizontal Trellis';
HorizontalBarHorizontalTrellis.args = {
	type: 'stacked',
	trellis: 'event',
	dimension: 'segment',
	onClick: undefined,
	color: 'bucket',
	order: 'order',
	orientation: 'horizontal',
	trellisOrientation: 'horizontal',
};

const HorizontalBarVerticalTrellis = bindWithProps<BarProps>(BarStory);
HorizontalBarVerticalTrellis.storyName = 'Horizontal Bar, Vertical Trellis';
HorizontalBarVerticalTrellis.args = {
	...HorizontalBarHorizontalTrellis.args,
	trellisOrientation: 'vertical',
};

const VerticalBarHorizontalTrellis = bindWithProps<BarProps>(BarStory);
VerticalBarHorizontalTrellis.storyName = 'Vertical Bar, Horizontal Trellis';
VerticalBarHorizontalTrellis.args = {
	...HorizontalBarHorizontalTrellis.args,
	orientation: 'vertical',
	trellisOrientation: 'horizontal',
};

const VerticalBarVerticalTrellis = bindWithProps<BarProps>(BarStory);
VerticalBarVerticalTrellis.storyName = 'Vertical Bar, Vertical Trellis';
VerticalBarVerticalTrellis.args = {
	...HorizontalBarVerticalTrellis.args,
	orientation: 'vertical',
	trellisOrientation: 'vertical',
};

const WithCustomTrellisPadding = bindWithProps<BarProps>(BarStory);
WithCustomTrellisPadding.args = {
	...HorizontalBarVerticalTrellis.args,
	orientation: 'vertical',
	trellisPadding: 0.33,
};

export {
	Dodged,
	HorizontalBarHorizontalTrellis,
	HorizontalBarVerticalTrellis,
	VerticalBarHorizontalTrellis,
	VerticalBarVerticalTrellis,
	WithCustomTrellisPadding,
};
