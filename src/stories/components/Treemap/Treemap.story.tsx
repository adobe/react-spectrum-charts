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
import { ReactElement } from 'react';

import useChartProps from '@hooks/useChartProps';
import { Chart, ChartProps, SpectrumColor, TreemapProps } from '@rsc';
import { Treemap } from '@rsc/alpha';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';

import { basicTreemapData } from './data';

export default {
	title: 'RSC/Treemap',
	component: Treemap,
};

const defaultChartProps: ChartProps = {
	data: basicTreemapData,
	width: 600,
	height: 600,
};

const colors: SpectrumColor[] = [
	'sequential-magma-200',
	'sequential-magma-400',
	'sequential-magma-600',
	'sequential-magma-800',
	'sequential-magma-1000',
	'sequential-magma-1200',
	'sequential-magma-1400',
	'sequential-magma-1600',
];

const TreemapStory: StoryFn<TreemapProps & { width?: number; height?: number }> = (args): ReactElement => {
	const { width, height, ...treemapProps } = args;

	const chartProps = useChartProps({ ...defaultChartProps, colors, width: width ?? 600, height: height ?? 600 });
	return (
		<Chart {...chartProps} debug>
			<Treemap {...treemapProps} />
		</Chart>
	);
};

// TODO: add component props and additional stories here

const Basic = bindWithProps(TreemapStory);
Basic.args = {
	layout: 'squarify',
};

const Binary = bindWithProps(TreemapStory);
Binary.args = {
	layout: 'binary',
};

const SliceDice = bindWithProps(TreemapStory);
SliceDice.args = {
	layout: 'slicedice',
};

const HighAspectRatio = bindWithProps(TreemapStory);
HighAspectRatio.args = {
	layout: 'squarify',
	aspectRatio: 1.5,
};

const LowAspectRatio = bindWithProps(TreemapStory);
LowAspectRatio.args = {
	layout: 'squarify',
	aspectRatio: 0.5,
};

export { Basic, Binary, SliceDice, HighAspectRatio, LowAspectRatio };
