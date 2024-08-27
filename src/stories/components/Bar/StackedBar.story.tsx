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

import { Annotation } from '@components/Annotation';
import useChartProps from '@hooks/useChartProps';
import { Axis, Bar, Chart, Legend } from '@rsc';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';

import { SpectrumColor } from '../../../types';
import { barSeriesData, negativeBarSeriesData } from './data';

export default {
	title: 'RSC/Bar/Stacked Bar',
	component: Bar,
};

const colors: SpectrumColor[] = [
	'divergent-orange-yellow-seafoam-1000',
	'divergent-orange-yellow-seafoam-1200',
	'divergent-orange-yellow-seafoam-1400',
	'divergent-orange-yellow-seafoam-600',
];

const BarStory: StoryFn<typeof Bar> = (args): ReactElement => {
	const chartProps = useChartProps({ data: barSeriesData, colors, width: 800, height: 600 });
	return (
		<Chart {...chartProps}>
			<Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
			<Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
			<Bar {...args} />
			<Legend title="Operating system" />
		</Chart>
	);
};

const NegativeBarStory: StoryFn<typeof Bar> = (args): ReactElement => {
	const chartProps = useChartProps({ data: negativeBarSeriesData, width: 800, height: 600 });
	return (
		<Chart {...chartProps}>
			<Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
			<Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
			<Bar {...args} />
			<Legend title="Operating system" />
		</Chart>
	);
};

const Basic = bindWithProps(BarStory);
Basic.args = {
	dimension: 'browser',
	order: 'order',
	onClick: undefined,
	color: 'operatingSystem',
};

const WithBarLabels = bindWithProps(BarStory);
WithBarLabels.args = {
	dimension: 'browser',
	order: 'order',
	onClick: undefined,
	color: 'operatingSystem',
	children: createElement(Annotation, { textKey: 'percentLabel' }),
};

const NegativeStack = bindWithProps(NegativeBarStory);
NegativeStack.args = {
	dimension: 'browser',
	order: 'order',
	onClick: undefined,
	color: 'operatingSystem',
};

export { Basic, NegativeStack, WithBarLabels };
