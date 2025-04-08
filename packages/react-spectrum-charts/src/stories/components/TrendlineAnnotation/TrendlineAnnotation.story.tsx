/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { ReactElement } from 'react';

import { StoryFn } from '@storybook/react';

import { Chart } from '../../../Chart';
import { Axis, Legend, Scatter, Title, Trendline, TrendlineAnnotation } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { TrendlineProps } from '../../../types';
import { characterData } from '../../data/marioKartData';

export default {
	title: 'RSC/Trendline/TrendlineAnnotation',
	component: TrendlineAnnotation,
};

const trendlineProps: TrendlineProps = {
	method: 'median',
	dimensionExtent: ['domain', 'domain'],
	lineWidth: 'S',
};

const TrendlineAnnotationStory: StoryFn<typeof TrendlineAnnotation> = (args): ReactElement => {
	const chartProps = useChartProps({ data: characterData, height: 500, width: 500, lineWidths: [1, 2, 3] });

	return (
		<Chart {...chartProps}>
			<Axis position="bottom" grid ticks baseline title="Speed (normal)" />
			<Axis position="left" grid ticks baseline title="Handling (normal)" />
			<Scatter color="weightClass" dimension="speedNormal" metric="handlingNormal">
				<Trendline {...trendlineProps}>
					<TrendlineAnnotation {...args} />
				</Trendline>
			</Scatter>
			<Legend title="Weight class" highlight position="right" />
			<Title text="Mario Kart 8 Character Data" />
		</Chart>
	);
};

const Basic = bindWithProps(TrendlineAnnotationStory);

const Badge = bindWithProps(TrendlineAnnotationStory);
Badge.args = {
	badge: true,
};

const DimensionValue = bindWithProps(TrendlineAnnotationStory);
DimensionValue.args = {
	dimensionValue: 2,
};

const NumberFormat = bindWithProps(TrendlineAnnotationStory);
NumberFormat.args = {
	numberFormat: '.2f',
};

const Prefix = bindWithProps(TrendlineAnnotationStory);
Prefix.args = {
	prefix: 'Speed:',
};

const Supreme = bindWithProps(TrendlineAnnotationStory);
Supreme.args = {
	badge: true,
	dimensionValue: 'start',
	numberFormat: '.2f',
	prefix: 'Speed:',
};

export { Basic, Badge, DimensionValue, NumberFormat, Prefix, Supreme };
