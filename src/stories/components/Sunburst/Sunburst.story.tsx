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

import useChartProps from '@hooks/useChartProps';
import { Chart, ChartPopover, ChartProps, ChartTooltip, Datum, Legend, SunburstProps } from '@rsc';
import { Sunburst } from '@rsc/alpha';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';

import { Content } from '@adobe/react-spectrum';

import { basicSunburstData, simpleSunburstData } from './data';

export default {
	title: 'RSC/Sunburst',
	component: Sunburst,
};

const defaultChartProps: ChartProps = {
	data: basicSunburstData,
	width: 350,
	height: 350,
};

const smallChartProps: ChartProps = {
	data: simpleSunburstData,
	width: 350,
	height: 350,
};

const SimpleSunburstStory: StoryFn<SunburstProps & { width?: number; height?: number }> = (args): ReactElement => {
	const { width, height, ...sunburstProps } = args;
	const chartProps = useChartProps({ ...smallChartProps, width: width ?? 600, height: height ?? 600 });
	return (
		<Chart {...chartProps}>
			<Sunburst {...sunburstProps} />
		</Chart>
	);
};

const SunburstStory: StoryFn<SunburstProps & { width?: number; height?: number }> = (args): ReactElement => {
	const { width, height, ...sunburstProps } = args;
	const chartProps = useChartProps({ ...defaultChartProps, width: width ?? 600, height: height ?? 600 });
	return (
		<Chart {...chartProps}>
			<Sunburst {...sunburstProps} />
		</Chart>
	);
};

const SunburstLegendStory: StoryFn<typeof Sunburst> = (args): ReactElement => {
	const chartProps = useChartProps({ ...defaultChartProps, height: 400, width: 600 });
	return (
		<Chart {...chartProps} debug>
			<Sunburst {...args} />
			<Legend title="Browsers" position={'left'} highlight isToggleable />
		</Chart>
	);
};

const dialogContent = (datum: Datum) => {
	return (
		<Content>
			<div>Browser: {datum.name}</div>
			<div>Users: {datum.value}</div>
			{datum.segment && <div>Details: {datum.segment}</div>}
		</Content>
	);
};

const interactiveChildren = [
	<ChartTooltip key={0}>{dialogContent}</ChartTooltip>,
	<ChartPopover width="auto" key={1}>
		{dialogContent}
	</ChartPopover>,
];

const Basic = bindWithProps(SimpleSunburstStory);
Basic.args = {
	metric: 'value',
	parentId: 'parent',
	id: 'id',
	segmentKey: 'segment',
};

const Complex = bindWithProps(SunburstStory);
Complex.args = {
	metric: 'value',
	parentId: 'parent',
	id: 'id',
	segmentKey: 'segment',
};

const WithPopovers = bindWithProps(SunburstStory);
WithPopovers.args = {
	metric: 'value',
	parentId: 'parent',
	id: 'id',
	segmentKey: 'segment',
	children: interactiveChildren,
};

const WithLegend = bindWithProps(SunburstLegendStory);
WithLegend.args = {
	metric: 'value',
	parentId: 'parent',
	id: 'id',
	segmentKey: 'segment',
	children: interactiveChildren,
};

const WithLegendAndMuting = bindWithProps(SunburstLegendStory);
WithLegendAndMuting.args = {
	metric: 'value',
	parentId: 'parent',
	id: 'id',
	segmentKey: 'segment',
	muteElementsOnHover: true,
	children: interactiveChildren,
};

export { Basic, Complex, WithPopovers, WithLegend, WithLegendAndMuting };
