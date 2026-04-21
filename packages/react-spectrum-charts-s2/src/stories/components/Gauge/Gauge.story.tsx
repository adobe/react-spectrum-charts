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
import { gaugeMultiRowData, gaugeWithTargetData } from './data';

export default {
	title: 'React Spectrum Charts 2/Gauge/Features',
	component: Gauge,
};

const SIZE = 275;

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

const GaugeAggregationStory: StoryFn<GaugeProps & { width?: number; height?: number }> = (args): ReactElement => {
	const { width, height, ...gaugeProps } = args;
	const chartProps = useChartProps({ ...defaultChartProps, data: gaugeMultiRowData, width: width ?? SIZE, height: height ?? SIZE });
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

// Size variants
const WithSizeS = bindWithProps(GaugeStory);
WithSizeS.args = { value: 65, label: 'Completion Rate', metric: 'value', size: 'S', width: 100, height: 100, ticks: 'normal' };

const WithSizeM = bindWithProps(GaugeStory);
WithSizeM.args = { value: 65, label: 'Completion Rate', metric: 'value', size: 'M', width: 200, height: 200, ticks: 'normal' };

const WithSizeL = bindWithProps(GaugeStory);
WithSizeL.args = { value: 65, label: 'Completion Rate', metric: 'value', size: 'L', width: 275, height: 275, ticks: 'normal' };

const WithSizeXL = bindWithProps(GaugeStory);
WithSizeXL.args = { value: 65, label: 'Completion Rate', metric: 'value', size: 'XL', width: 350, height: 350, ticks: 'normal' };

// Tick marks — minimal (6-10 evenly spaced major ticks)
const WithTicksMinimal = bindWithProps(GaugeStory);
WithTicksMinimal.args = {
	value: 65,
	label: 'Completion Rate',
	metric: 'value',
	minScaleValue: 0,
	maxScaleValue: 100,
	showNeedle: true,
	ticks: 'minimal',
};

// Tick marks — normal (alternating tall/short)
const WithTicksNormal = bindWithProps(GaugeStory);
WithTicksNormal.args = {
	value: 65,
	label: 'Completion Rate',
	metric: 'value',
	minScaleValue: 0,
	maxScaleValue: 100,
	showNeedle: true,
	ticks: 'normal',
};

// Tick marks — dense (major ticks with 3 minor ticks between each)
const WithTicksDense = bindWithProps(GaugeStory);
WithTicksDense.args = {
	value: 65,
	label: 'Completion Rate',
	metric: 'value',
	minScaleValue: 0,
	maxScaleValue: 100,
	showNeedle: true,
	ticks: 'dense',
};

// Aggregation method — avg of [40, 60, 80] = 60
const WithAggregation = bindWithProps(GaugeAggregationStory);
WithAggregation.args = {
	label: 'Avg Completion',
	metric: 'value',
	method: 'avg',
	minScaleValue: 0,
	maxScaleValue: 100,
	showNeedle: true,
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

export { Basic, FillMode, WithAggregation, WithRangeLabels, WithSizeL, WithSizeM, WithSizeS, WithSizeXL, WithTarget, WithThresholds, WithTicksDense, WithTicksMinimal, WithTicksNormal };
