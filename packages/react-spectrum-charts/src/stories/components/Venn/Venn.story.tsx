/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { ChartPopover, ChartTooltip, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '../../../test-utils';
import { Chart } from '../../../Chart';
import { Venn } from '../../../alpha';

import { Content } from '@adobe/react-spectrum';

import { ChartProps, VennProps } from '../../../types';
import { Datum } from '@spectrum-charts/vega-spec-builder';

import { radioData } from './data';

export default {
	title: 'RSC/Venn',
	component: Venn,
};

const { A, B, C } = {
	A: 'Instagram',
	B: 'TikTok',
	C: 'X',
};

const defaultChartProps: ChartProps = {
	data: [
		{ regions: [A], radius: 12 },
		{ regions: [B], radius: 12 },
		{ regions: [C], radius: 6 },
		{ regions: ['D'], radius: 6 },
		{ regions: [A, B], radius: 2 },
		{ regions: [A, 'D'], radius: 2 },
		{ regions: [A, C], radius: 2 },
		{ regions: [B, C], radius: 2 },
		{ regions: [A, B, C], radius: 1 },
	],

	height: 350,
	width: 350,
};

const basicData = [
	{ sets: [A], size: 12 },
	{ sets: [B], size: 12 },
	{ sets: [A, B], size: 2 },
];

const BasicVennStory: StoryFn<VennProps> = (args) => {
	const chartProps = useChartProps({ ...defaultChartProps, data: basicData });
	return (
		<Chart {...chartProps} config={{ autosize: { type: 'pad' } }} debug>
			<Venn {...args} />
		</Chart>
	);
};

const VennStoryWithLegend: StoryFn<VennProps> = (args) => {
	const chartProps = useChartProps({ ...defaultChartProps });
	return (
		<Chart {...chartProps} config={{ autosize: { type: 'pad' } }}>
			<Venn {...args} metric="radius" color="regions" />
			<Legend highlight isToggleable />
		</Chart>
	);
};

const SupremeStory: StoryFn<VennProps> = (args) => {
	return (
		<Chart data={radioData} height={650} width={650} config={{ autosize: { type: 'pad' } }}>
			<Venn {...args} />
		</Chart>
	);
};

const dialogContent = (datum: Datum) => {
	return (
		<Content>
			<div>{datum['set_id']}</div>
		</Content>
	);
};

const interactiveChildren = [
	<ChartTooltip key={0}>{dialogContent}</ChartTooltip>,
	<ChartPopover key={1} width="auto">
		{dialogContent}
	</ChartPopover>,
];

const Basic = bindWithProps(BasicVennStory);

const WithLegend = bindWithProps(VennStoryWithLegend);

const Supreme = bindWithProps(SupremeStory);
Supreme.args = {
  children: interactiveChildren
}

const WithToolTip = bindWithProps(BasicVennStory);
WithToolTip.args = {
	children: interactiveChildren[0],
};

const WithPopover = bindWithProps(VennStoryWithLegend);
WithPopover.args = {
	children: interactiveChildren,
};

export { Basic, WithToolTip, WithPopover, WithLegend, Supreme };

