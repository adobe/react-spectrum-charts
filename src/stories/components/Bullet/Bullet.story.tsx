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
import { ReactElement } from 'react';

import useChartProps from '@hooks/useChartProps';
// Assuming Bullet chart is a component in the @rsc/rc library
import { BulletProps, Chart, ChartProps, Title } from '@rsc';
import { Bullet } from '@rsc/alpha';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';

import { basicBulletData, basicThresholdsData } from './data';

export default {
	title: 'RSC/Bullet',
	component: Bullet,
};

// Default chart properties
const defaultChartProps: ChartProps = {
	data: basicBulletData,
	width: 350,
	height: 350,
};

// Basic Bullet chart story
const BulletStory: StoryFn<BulletProps & { width?: number; height?: number }> = (args): ReactElement => {
	const { width, height, ...bulletProps } = args;
	const chartProps = useChartProps({ ...defaultChartProps, width: width ?? 350, height: height ?? 350 });
	return (
		<Chart {...chartProps} >
			<Bullet {...bulletProps} />
		</Chart>
	);
};

// Bullet with Title
const BulletTitleStory: StoryFn<typeof Bullet> = (args): ReactElement => {
	const chartProps = useChartProps({ ...defaultChartProps, width: 400 });
	return (
		<Chart {...chartProps}>
			<Title text={'Title Bullet'} position={'start'} orient={'top'} />
			<Bullet {...args} />
		</Chart>
	);
};

const Basic = bindWithProps(BulletStory);
Basic.args = {
	metric: 'currentAmount',
	dimension: 'graphLabel',
	target: 'target',
	color: 'blue-900',
	direction: 'column',
	numberFormat: '$,.2f',
	thresholdValues: basicThresholdsData,
	showTarget: true,
	showTargetValue: false,
	labelPosition: 'top',
	scaleType: 'normal',
	maxScaleValue: 100,
	track: false,
	axis: false,
};

const Thresholds = bindWithProps(BulletStory);
Thresholds.args = {
	metric: 'currentAmount',
	dimension: 'graphLabel',
	target: 'target',
	color: 'blue-900',
	direction: 'column',
	numberFormat: '$,.2f',
	showTarget: true,
	showTargetValue: false,
	labelPosition: 'top',
	scaleType: 'normal',
	maxScaleValue: 100,
	thresholdValues: basicThresholdsData,
	track: false,
	axis: false,
};

const Track = bindWithProps(BulletStory);
Track.args = {
	metric: 'currentAmount',
	dimension: 'graphLabel',
	target: 'target',
	color: 'blue-900',
	direction: 'column',
	numberFormat: '$,.2f',
	showTarget: true,
	showTargetValue: false,
	labelPosition: 'top',
	scaleType: 'normal',
	maxScaleValue: 100,
	track: true,
	axis: false,
};

const RowMode = bindWithProps(BulletStory);
RowMode.args = {
	metric: 'currentAmount',
	dimension: 'graphLabel',
	target: 'target',
	color: 'blue-900',
	direction: 'row',
	numberFormat: '$,.2f',
	showTarget: true,
	showTargetValue: false,
	labelPosition: 'top',
	scaleType: 'normal',
	maxScaleValue: 100,
	thresholdValues: basicThresholdsData,
	track: false,
	axis: false,
};

const WithTitle = bindWithProps(BulletTitleStory);
WithTitle.args = {
	metric: 'currentAmount',
	dimension: 'graphLabel',
	target: 'target',
	color: 'blue-900',
	numberFormat: '$,.2f',
	labelPosition: 'top',
	scaleType: 'normal',
	maxScaleValue: 100,
	track: false,
	direction: 'column',
	axis: false,
};

const FixedScale = bindWithProps(BulletStory);
FixedScale.args = {
	metric: 'currentAmount',
	dimension: 'graphLabel',
	target: 'target',
	color: 'blue-900',
	direction: 'column',
	numberFormat: '$,.2f',
	showTarget: true,
	showTargetValue: false,
	labelPosition: 'top',
	scaleType: 'fixed',
	maxScaleValue: 250,
	thresholdValues: basicThresholdsData,
	track: false,
	axis: false,
};

const Axis = bindWithProps(BulletStory);
Axis.args = {
	metric: 'currentAmount',
	dimension: 'graphLabel',
	target: 'target',
	color: 'blue-900',
	direction: 'column',
	numberFormat: '$,.2f',
	showTarget: true,
	showTargetValue: false,
	labelPosition: 'top',
	scaleType: 'normal',
	maxScaleValue: 250,
	track: false,
	axis: true,
};

export { Basic, Thresholds, Track, RowMode, WithTitle, FixedScale, Axis };
