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

import usePrismProps from '@hooks/usePrismProps';
import { Bar, Legend, Line, Prism } from '@prism';
import { browserData as data } from '@stories/data/data';
import { ComponentStory } from '@storybook/react';
import React, { ReactElement } from 'react';
import { ROUNDED_SQUARE_PATH } from 'svgPaths';

export default {
	title: 'Prism/Legend/Symbols',
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
	const prismProps = usePrismProps({ data, width: 700, symbolShapes: ['square', 'triangle', ROUNDED_SQUARE_PATH] });
	return (
		<Prism {...prismProps}>
			<Bar color="series" />
			<Legend {...args} />
		</Prism>
	);
};
const LegendLineStory: ComponentStory<typeof Legend> = (args): ReactElement => {
	const prismProps = usePrismProps({ data, width: 700 });
	return (
		<Prism {...prismProps}>
			<Line dimension="category" lineType="series" color="series" scaleType="point" />
			<Legend {...args} />
		</Prism>
	);
};

const Color = LegendLineStory.bind({});
Color.args = { color: { value: 'gray-700' }, opacity: { value: 0.25 } };

const LineType = LegendLineStory.bind({});
LineType.args = { lineType: { value: 'solid' }, opacity: { value: 0.25 } };

const LineWidth = LegendBarStory.bind({});
LineWidth.args = { lineWidth: { value: 'XS' }, opacity: { value: 0.25 } };

const Opacity = LegendBarStory.bind({});
Opacity.args = { opacity: 'series', lineWidth: { value: 0 }, highlight: true };

const Symbols = LegendBarStory.bind({});
Symbols.args = { symbolShape: 'series', opacity: { value: 0.25 } };

const Supreme = LegendBarStory.bind({});
Supreme.args = {
	color: 'series',
	lineType: 'series',
	lineWidth: { value: 'S' },
	opacity: 'series',
	symbolShape: 'series',
	// highlight: true,
};

export { Color, LineType, LineWidth, Opacity, Symbols, Supreme };
