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

import { View } from '@adobe/react-spectrum';
import { Datum } from '@spectrum-charts/vega-spec-builder';

import { Chart } from '../../../Chart';
import { Area, Bar, Line, Scatter } from '../../../components';
import { ChartTooltip } from '../../../components/ChartTooltip';
import useChartProps from '../../../hooks/useChartProps';
import { browserData } from '../../../stories/data/data';
import { characterData } from '../../../stories/data/marioKartData';
import { bindWithProps } from '../../../test-utils';

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

interface MarioData extends Datum {
	character?: string[];
	speedNormal?: number;
	handlingNormal?: number;
	weightClass?: string;
}

const StackedBarTooltipStory: StoryFn<typeof ChartTooltip> = (args): ReactElement => {
	const chartProps = useChartProps({ data: browserData, width: 600 });
	return (
		<Chart {...chartProps}>
			<Bar color="series">
				<ChartTooltip {...args} />
			</Bar>
		</Chart>
	);
};

const AreaStory: StoryFn<typeof ChartTooltip> = (args): ReactElement => {
	const chartProps = useChartProps({ data: browserData, width: 600 });
	return (
		<Chart {...chartProps}>
			<Area color="series" dimension="category" scaleType="point">
				<ChartTooltip {...args} />
			</Area>
		</Chart>
	);
};

const LineStory: StoryFn<typeof ChartTooltip> = (args): ReactElement => {
	const chartProps = useChartProps({ data: browserData, width: 600 });
	return (
		<Chart {...chartProps}>
			<Line color="series" dimension="category" scaleType="point">
				<ChartTooltip {...args} />
			</Line>
		</Chart>
	);
};

const ScatterStory: StoryFn<typeof ChartTooltip> = (args): ReactElement => {
	const chartProps = useChartProps({ data: characterData, width: 400 });

	return (
		<Chart {...chartProps}>
			<Scatter dimension="speedNormal" metric="handlingNormal">
				<ChartTooltip {...args} />
			</Scatter>
		</Chart>
	);
};

const dialogCallback = (datum: LineData) => (
	<div className="browser-data-tooltip">
		<div>Operating system: {datum.series}</div>
		<div>Browser: {datum.category}</div>
		<div>Users: {datum.value}</div>
	</div>
);

const marioDialogCallback = (datum: MarioData) => (
	<div className="mario-tooltip">
		<div>Characters: {datum.character?.join(', ')}</div>
		<div>Weight class: {datum.weightClass}</div>
		<div>Handling: {datum.handlingNormal}</div>
		<div>Speed: {datum.speedNormal}</div>
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

const GroupData = bindWithProps(ScatterStory);
GroupData.args = {
	highlightBy: ['weightClass'],
	children: (datum: MarioData) => (
		<div className="mario-tooltip">
			<div>Weight class: {datum.weightClass}</div>
			<div>
				Characters:
				<View marginStart={6}>
					{datum.rscGroupData
						?.map((d) => d.character)
						.flat()
						.map((c, i) => (
							<div key={c + i}>{c}</div>
						))}
				</View>
			</div>
		</div>
	),
};

const AreaChart = bindWithProps(AreaStory);
AreaChart.args = {
	highlightBy: 'dimension',
	children: dialogCallback,
};

const LineChart = bindWithProps(LineStory);
LineChart.args = {
	highlightBy: 'dimension',
	children: dialogCallback,
};

const ScatterChart = bindWithProps(ScatterStory);
ScatterChart.args = {
	highlightBy: ['weightClass'],
	children: marioDialogCallback,
};

export { AreaChart, Basic, Dimension, GroupData, Keys, LineChart, ScatterChart, Series };
