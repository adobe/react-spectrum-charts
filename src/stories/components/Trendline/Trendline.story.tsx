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
import { Axis, Legend, Line, Prism, PrismProps, Trendline } from '@prism';
import { workspaceTrendsData } from '@stories/data/data';
import { ComponentStory } from '@storybook/react';
import React, { ReactElement } from 'react';
import { bindWithProps } from 'test-utils/bindWithProps';

export default {
	title: 'Prism/Trendline',
	component: Trendline,
	argTypes: {},
	parameters: {
		docs: {
			description: {
				component: 'This is _markdown_ enabled description for Trendline component doc page.',
			},
		},
	},
};

const defaultPrismProps: PrismProps = { data: workspaceTrendsData, minWidth: 400, maxWidth: 800, height: 400 };

const TrendlineStory: ComponentStory<typeof Trendline> = (args): ReactElement => {
	const prismProps = usePrismProps(defaultPrismProps);
	return (
		<Prism {...prismProps}>
			<Axis position="left" grid title="Users" />
			<Axis position="bottom" labelFormat="time" baseline ticks />
			<Line color="series">
				<Trendline {...args} />
			</Line>
			<Legend lineWidth={{ value: 0 }} highlight />
		</Prism>
	);
};

const Basic = bindWithProps(TrendlineStory);
Basic.args = {
	method: 'average',
	lineType: 'dashed',
	lineWidth: 'S',
};

const DimensionRange = bindWithProps(TrendlineStory);
DimensionRange.args = {
	method: 'average',
	lineType: 'dashed',
	lineWidth: 'S',
	dimensionRange: [1668063600000, null],
};

export { Basic, DimensionRange };
