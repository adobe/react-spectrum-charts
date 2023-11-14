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

import { Annotation } from '@components/Annotation/Annotation';
import useChartProps from '@hooks/useChartProps';
import { Bar, BarProps, Chart } from '@rsc';
import { ComponentStory } from '@storybook/react';

export default {
	title: 'RSC/Annotation',
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

const BarAnnotationStory: ComponentStory<typeof Annotation> = (args): ReactElement => {
	const chartProps = useChartProps({ data: data, width: 600, height: 600 });
	return (
		<Chart {...chartProps}>
			<Bar {...barArgs}>
				<Annotation {...args} />
			</Bar>
		</Chart>
	);
};

const BarChart = BarAnnotationStory.bind({});
BarChart.args = {
	textKey: 'percentLabel',
	color: 'operatingSystem',
};

const FixedWidthBar = BarAnnotationStory.bind({});
FixedWidthBar.args = {
	textKey: 'percentLabel',
	style: { width: 48 },
	color: 'operatingSystem',
};

export { BarChart, FixedWidthBar };
