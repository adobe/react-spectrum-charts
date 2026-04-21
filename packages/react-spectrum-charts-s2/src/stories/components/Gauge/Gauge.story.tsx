/*
 * Copyright 2026 Adobe. All rights reserved.
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
import useChartProps from '../../../hooks/useChartProps';
import { Gauge } from '../../../rc';
import { bindWithProps } from '../../../test-utils';
import { ChartProps, GaugeProps } from '../../../types';
import { gaugeWithTargetData } from './data';

export default {
	title: 'React Spectrum Charts 2/Gauge/Features',
	component: Gauge,
};

const SIZE = 300;

const defaultChartProps: ChartProps = {
	data: [],
	width: SIZE,
	height: SIZE,
};

const GaugeStory: StoryFn<GaugeProps & { width?: number; height?: number; value?: number }> = (args): ReactElement => {
	const { width, height, value = 65, ...gaugeProps } = args;
	const chartProps = useChartProps({ ...defaultChartProps, data: [{ value }], width: width ?? SIZE, height: height ?? SIZE });
	return (
		<Chart {...chartProps}>
			<Gauge {...gaugeProps} />
		</Chart>
	);
};

const GaugeWithTargetStory: StoryFn<GaugeProps & { width?: number; height?: number; value?: number }> = (args): ReactElement => {
	const { width, height, value = 65, ...gaugeProps } = args;
	const chartProps = useChartProps({
		...defaultChartProps,
		data: [{ ...gaugeWithTargetData[0], value }],
		width: width ?? SIZE,
		height: height ?? SIZE,
	});
	return (
		<Chart {...chartProps}>
			<Gauge {...gaugeProps} />
		</Chart>
	);
};

// Needle mode (default)
const Basic = bindWithProps(GaugeStory);
Basic.args = {
	value: 65,
	label: 'Completion Rate',
	metric: 'value',
	minScaleValue: 0,
	maxScaleValue: 100,
	showNeedle: true,
};

// Fill mode (no needle)
const FillMode = bindWithProps(GaugeStory);
FillMode.args = {
	value: 65,
	label: 'Completion Rate',
	metric: 'value',
	minScaleValue: 0,
	maxScaleValue: 100,
	showNeedle: false,
};

// Needle with target marker
const WithTarget = bindWithProps(GaugeWithTargetStory);
WithTarget.args = {
	value: 65,
	label: 'Completion Rate',
	metric: 'value',
	target: 'target',
	minScaleValue: 0,
	maxScaleValue: 100,
	showNeedle: true,
};

// Threshold zones with needle
const WithThresholds = bindWithProps(GaugeStory);
WithThresholds.args = {
	value: 65,
	label: 'Completion Rate',
	metric: 'value',
	minScaleValue: 0,
	maxScaleValue: 100,
	showNeedle: true,
	thresholds: [
		{ value: 20, color: 'red-700', label: 'Poor' },
		{ value: 70, color: 'gray-300', label: 'Normal' },
		{ value: 100, color: 'blue-700', label: 'Good' },
	],
};

// Range labels
const WithRangeLabels = bindWithProps(GaugeStory);
WithRangeLabels.args = {
	value: 65,
	label: 'Completion Rate',
	metric: 'value',
	minScaleValue: 0,
	maxScaleValue: 100,
	showNeedle: true,
	showRangeLabels: true,
};

export { Basic, FillMode, WithRangeLabels, WithTarget, WithThresholds };
