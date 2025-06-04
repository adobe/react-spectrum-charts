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

import { Orientation } from '@spectrum-charts/vega-spec-builder';

import { Annotation } from '../../../components/Annotation/Annotation';
import useChartProps from '../../../hooks/useChartProps';
import { Bar, BarAnnotationProps, BarProps, Chart, Axis } from '../../../index';

export default {
	title: 'RSC/Bar/Annotation',
	component: Annotation,
	argTypes: {
		children: {
			description: '`(datum) => React.ReactElement`',
			control: {
				type: null,
			},
		},
	},
};

const data = [
	{ browser: 'Chrome', value: 5, operatingSystem: 'Windows', order: 2, percentLabel: '50%' },
	{ browser: 'Chrome', value: 3, operatingSystem: 'Mac', order: 1, percentLabel: '30%' },
	{ browser: 'Chrome', value: 2, operatingSystem: 'Other', order: 0, percentLabel: '20%' },
	{ browser: 'Firefox', value: 3, operatingSystem: 'Windows', order: 2, percentLabel: '42.6%' },
	{ browser: 'Firefox', value: 3, operatingSystem: 'Mac', order: 1, percentLabel: '42.6%' },
	{ browser: 'Firefox', value: 1, operatingSystem: 'Other', order: 0, percentLabel: '14.3%' },
	{ browser: 'Safari', value: 3, operatingSystem: 'Windows', order: 2, percentLabel: '75%' },
	{ browser: 'Safari', value: 0, operatingSystem: 'Mac', order: 1 },
	{ browser: 'Safari', value: 1, operatingSystem: 'Other', order: 0, percentLabel: '25%' },
];

const barArgs: BarProps = { dimension: 'browser', order: 'order', color: 'operatingSystem' };

const BarAnnotationStory: StoryFn<
	BarAnnotationProps & { barOrientation?: Orientation; chartHeight?: number; chartWidth?: number }
> = (args): ReactElement => {
	const chartProps = useChartProps({ data: data, });
	const { barOrientation = 'vertical', chartHeight = 300, chartWidth = 300, ...annotationProps } = args;
	return (
		<Chart {...chartProps} height={400} width={600} renderer='canvas'>
			<Axis position="left" grid  />
			<Axis position="bottom" baseline />
			<Bar {...barArgs} orientation={barOrientation}>
				<Annotation {...annotationProps} />
			</Bar>
		</Chart>
	);
};

const HorizontalBarChart = BarAnnotationStory.bind({});
HorizontalBarChart.args = {
	textKey: 'percentLabel',
	// color: 'operatingSystem',
	barOrientation: 'horizontal',
};

const VerticalBarChart = BarAnnotationStory.bind({});
VerticalBarChart.args = {
	textKey: 'percentLabel',
	// color: 'operatingSystem',
	barOrientation: 'vertical',
};

const FixedWidthBar = BarAnnotationStory.bind({});
FixedWidthBar.args = {
	textKey: 'percentLabel',
	style: { width: 48 },
	// color: 'operatingSystem',
};

export { HorizontalBarChart, VerticalBarChart, FixedWidthBar };
