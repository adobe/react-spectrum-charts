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
import { Bar, Chart, Legend, Line } from '@rsc';
import { browserData as data } from '@stories/data/data';
import { ComponentStory } from '@storybook/react';
import { ROUNDED_SQUARE_PATH } from 'svgPaths';

import { defaultProps } from './LegendStoryUtils';

export default {
	title: 'RSC/Legend/Symbols',
	component: Legend,
	argTypes: {},
	parameters: {
		docs: {
			description: {
				component: 'This is _markdown_ enabled description for Legend component doc page.',
			},
		},
	},
};

const LegendBarStory: ComponentStory<typeof Legend> = (args): ReactElement => {
	const chartProps = useChartProps({ data, width: 700, symbolShapes: ['square', 'triangle', ROUNDED_SQUARE_PATH] });
	return (
		<Chart {...chartProps}>
			<Bar color="series" />
			<Legend {...args} />
		</Chart>
	);
};
const LegendLineStory: ComponentStory<typeof Legend> = (args): ReactElement => {
	const chartProps = useChartProps({ data, width: 700 });
	return (
		<Chart {...chartProps}>
			<Line dimension="category" lineType="series" color="series" scaleType="point" />
			<Legend {...args} />
		</Chart>
	);
};

const Color = LegendLineStory.bind({});
Color.args = { color: { value: 'gray-700' }, opacity: { value: 0.25 }, ...defaultProps };

const LineType = LegendLineStory.bind({});
LineType.args = { lineType: { value: 'solid' }, opacity: { value: 0.25 }, ...defaultProps };

const LineWidth = LegendBarStory.bind({});
LineWidth.args = { lineWidth: { value: 'XS' }, opacity: { value: 0.25 }, ...defaultProps };

const Opacity = LegendBarStory.bind({});
Opacity.args = { opacity: 'series', lineWidth: { value: 0 }, highlight: true, ...defaultProps };

const Symbols = LegendBarStory.bind({});
Symbols.args = { symbolShape: 'series', opacity: { value: 0.25 }, ...defaultProps };

const Supreme = LegendBarStory.bind({});
Supreme.args = {
	color: 'series',
	lineType: 'series',
	lineWidth: { value: 'S' },
	opacity: 'series',
	symbolShape: 'series',
	...defaultProps,
};

export { Color, LineType, LineWidth, Opacity, Supreme, Symbols };
