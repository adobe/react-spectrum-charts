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

import { ChartTooltip } from '@components/ChartTooltip/ChartTooltip';
import useChartProps from '@hooks/useChartProps';
import { Bar, Chart, Datum } from '@rsc';
import { browserData } from '@stories/data/data';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';

export default {
	title: 'RSC/ChartTooltip/HighlightBy',
	component: ChartTooltip,
	argTypes: {
		children: {
			description: '`(datum) => React.ReactElement`',
			control: {
				type: null,
			},
		},
	},
};

interface LineData extends Datum {
	value?: number;
	series?: string;
	category?: string;
}

const StackedBarTooltipStory: StoryFn<typeof ChartTooltip> = (args): ReactElement => {
	const chartProps = useChartProps({ data: browserData, width: 600 });
	return (
		<Chart {...chartProps} debug>
			<Bar color="series">
				<ChartTooltip {...args} />
			</Bar>
		</Chart>
	);
};

const dialogCallback = (datum: LineData) => (
	<div className="bar-tooltip">
		<div>Operating system: {datum.series}</div>
		<div>Browser: {datum.category}</div>
		<div>Users: {datum.value}</div>
	</div>
);

const Basic = bindWithProps(StackedBarTooltipStory);
Basic.args = {
	highlightBy: 'item',
	children: dialogCallback,
};

const Dimension = bindWithProps(StackedBarTooltipStory);
Dimension.args = {
	highlightBy: 'dimension',
	children: dialogCallback,
};

const Series = bindWithProps(StackedBarTooltipStory);
Series.args = {
	highlightBy: 'series',
	children: dialogCallback,
};

const Keys = bindWithProps(StackedBarTooltipStory);
Keys.args = {
	highlightBy: ['series'],
	children: dialogCallback,
};

export { Basic, Dimension, Series, Keys };
