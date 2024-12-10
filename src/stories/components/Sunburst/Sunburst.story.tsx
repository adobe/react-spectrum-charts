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
import { Chart, ChartPopover, ChartProps, ChartTooltip, Datum, SunburstProps } from '@rsc';
import { Sunburst } from '@rsc/alpha';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';

import { Content } from '@adobe/react-spectrum';

import { basicSunburstData } from './data';

export default {
	title: 'RSC/Sunburst',
	component: Sunburst,
};

const defaultChartProps: ChartProps = {
	data: basicSunburstData,
	width: 350,
	height: 350,
};

const SunburstStory: StoryFn<SunburstProps & { width?: number; height?: number }> = (args): ReactElement => {
	const { width, height, ...sunburstProps } = args;
	const chartProps = useChartProps({ ...defaultChartProps, width: width ?? 600, height: height ?? 600 });
	return (
		<Chart {...chartProps} debug>
			<Sunburst {...sunburstProps} />
		</Chart>
	);
};

const dialogContent = (datum: Datum) => {
	return (
		<Content>
			<div>Browser: {datum.segment}</div>
			<div>Users: {datum.value}</div>
		</Content>
	);
};

const interactiveChildren = [
	<ChartTooltip key={0}>{dialogContent}</ChartTooltip>,
	<ChartPopover width="auto" key={1}>
		{dialogContent}
	</ChartPopover>,
];

const Basic = bindWithProps(SunburstStory);
Basic.args = {
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

export { Basic, WithPopovers };
