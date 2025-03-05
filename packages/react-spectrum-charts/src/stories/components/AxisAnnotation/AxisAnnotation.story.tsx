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

/**
 *  Component Story Format (CSF) is now encouraged.
 *  More info here: https://storybook.js.org/docs/react/api/csf
 *  --
 *  You don't need to include both story formats (mdx / tsx)
 *  they are both included for your convenience.
 *  --
 */
import React, { ReactElement } from 'react';

import useChartProps from '@hooks/useChartProps';
import { Axis, AxisAnnotation, Chart, ChartPopover, Legend, Line } from '@rsc';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';

import { Content } from '@adobe/react-spectrum';

import { ChartProps } from '../../../types';

export default {
	title: 'RSC/AxisAnnotation',
	component: AxisAnnotation,
};

const annotationAxisData = [
	{ datetime: 1667890800000, users: 477, series: 'Add Fallout' },
	{ datetime: 1667977200000, users: 481, series: 'Add Fallout', annotations: ['1'] },
	{ datetime: 1668063600000, users: 483, series: 'Add Fallout', annotations: ['1', '2'] },
	{ datetime: 1668150000000, users: 310, series: 'Add Fallout', annotations: ['1', '2'] },
	{ datetime: 1668236400000, users: 18, series: 'Add Fallout', annotations: ['2'] },
	{ datetime: 1668322800000, users: 70, series: 'Add Fallout' },
	{ datetime: 1668409200000, users: 438, series: 'Add Fallout', annotations: ['3', '4'] },
	{ datetime: 1667890800000, users: 5253, series: 'Add Freeform table' },
	{ datetime: 1667977200000, users: 5103, series: 'Add Freeform table' },
	{ datetime: 1668063600000, users: 5047, series: 'Add Freeform table' },
	{ datetime: 1668150000000, users: 3386, series: 'Add Freeform table' },
	{ datetime: 1668236400000, users: 205, series: 'Add Freeform table' },
	{ datetime: 1668322800000, users: 790, series: 'Add Freeform table' },
	{ datetime: 1668409200000, users: 4913, series: 'Add Freeform table' },
];

const popoverContent = (datum) => (
	<Content>
		<div>Annotations:{JSON.stringify(datum.annotations, null, 2)}</div>
	</Content>
);

const defaultChartLineProps: ChartProps = { data: annotationAxisData, minWidth: 400, maxWidth: 800, height: 400 };

const BasicAxisAnnotationStory: StoryFn<typeof AxisAnnotation> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartLineProps);
	return (
		<Chart {...chartProps}>
			<Axis position="left" grid title="Users" />
			<Axis position="bottom" labelFormat="time" granularity="day" baseline ticks>
				<AxisAnnotation {...args} />
			</Axis>
			<Line color="series" dimension="datetime" metric="users" scaleType="time" />
		</Chart>
	);
};

const LegendAxisAnnotationStory: StoryFn<typeof AxisAnnotation> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartLineProps);
	return (
		<Chart {...chartProps}>
			<Axis position="left" grid title="Users" />
			<Axis position="bottom" labelFormat="time" granularity="day" baseline ticks>
				<AxisAnnotation {...args} />
			</Axis>
			<Line color="series" dimension="datetime" metric="users" scaleType="time" />
			<Legend highlight />
		</Chart>
	);
};

const PopoverAxisAnnotationStory: StoryFn<typeof AxisAnnotation> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartLineProps);
	return (
		<Chart {...chartProps}>
			<Axis position="left" grid title="Users" />
			<Axis position="bottom" labelFormat="time" granularity="day" baseline ticks>
				<AxisAnnotation {...args}>
					<ChartPopover width={250}>{popoverContent}</ChartPopover>
				</AxisAnnotation>
			</Axis>
			<Line color="series" dimension="datetime" metric="users" scaleType="time">
				<ChartPopover width={250}>{(datum) => <Content>Series: {datum.series}</Content>}</ChartPopover>
			</Line>
		</Chart>
	);
};

const Basic = bindWithProps(BasicAxisAnnotationStory);
Basic.args = {
	dataKey: 'annotations',
};

const WithLegend = bindWithProps(LegendAxisAnnotationStory);
WithLegend.args = {
	dataKey: 'annotations',
};

const Color = bindWithProps(BasicAxisAnnotationStory);
Color.args = {
	dataKey: 'annotations',
	color: 'celery-600',
};

const ColorOptions = bindWithProps(BasicAxisAnnotationStory);
ColorOptions.args = {
	dataKey: 'annotations',
	color: 'gray-600',
	options: [
		{ id: '1', color: 'magenta-600' },
		{ id: '2', color: 'fuchsia-600' },
		{ id: '3', color: 'yellow-600' },
		{ id: '4', color: 'celery-600' },
	],
};

const Format = bindWithProps(BasicAxisAnnotationStory);
Format.args = {
	dataKey: 'annotations',
	format: 'summary',
};

const Offset = bindWithProps(BasicAxisAnnotationStory);
Offset.args = {
	dataKey: 'annotations',
	offset: 200,
};

const Popover = bindWithProps(PopoverAxisAnnotationStory);
Popover.args = {
	dataKey: 'annotations',
	color: 'gray-600',
	options: [
		{ id: '1', color: 'magenta-600' },
		{ id: '2', color: 'fuchsia-600' },
		{ id: '3', color: 'yellow-600' },
		{ id: '4', color: 'celery-600' },
	],
};

export { Basic, WithLegend, Color, ColorOptions, Format, Offset, Popover };
