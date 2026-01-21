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
import { Bullet } from '../../../alpha';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { BulletProps } from '../../../types';
import { customLabelBulletData, customLabelThresholdsData } from './data';

export default {
	title: 'RSC/Bullet (alpha)/Custom Labels',
	component: Bullet,
};

// Story template for custom labels
const CustomLabelsStory: StoryFn<BulletProps & { width?: number; height?: number }> = (args): ReactElement => {
	const { width, height, ...bulletProps } = args;
	const chartProps = useChartProps({
		data: customLabelBulletData,
		width: width ?? 500,
		height: height ?? 450,
	});
	return (
		<Chart {...chartProps}>
			<Bullet {...bulletProps} />
		</Chart>
	);
};

/**
 * Basic example with custom pre-formatted labels for both metric and target values.
 * The data includes `currentAmountLabel` and `targetLabel` fields that contain pre-formatted strings.
 * Includes colored thresholds to show performance zones, with bars colored by threshold.
 */
export const CustomLabels = bindWithProps(CustomLabelsStory);
CustomLabels.args = {
	dimension: 'graphLabel',
	metric: 'currentAmount',
	metricLabel: 'currentAmountLabel',
	target: 'target',
	targetLabel: 'targetLabel',
	showTargetValue: false,
	labelPosition: 'top',
	thresholds: customLabelThresholdsData,
	thresholdBarColor: true,
};

/**
 * Custom labels with side label position (column direction only).
 * Shows the custom formatted labels in the side position with colored thresholds and bars colored by threshold.
 */
export const CustomLabelsSidePosition = bindWithProps(CustomLabelsStory);
CustomLabelsSidePosition.args = {
	dimension: 'graphLabel',
	metric: 'currentAmount',
	metricLabel: 'currentAmountLabel',
	target: 'target',
	targetLabel: 'targetLabel',
	showTargetValue: false,
	labelPosition: 'side',
	direction: 'column',
	thresholds: customLabelThresholdsData,
	thresholdBarColor: true,
};

/**
 * Custom labels without target value label shown.
 * Demonstrates that metricLabel still works when target labels are not displayed.
 * Shows thresholds with threshold bar coloring enabled.
 */
export const CustomLabelsNoTargetValue = bindWithProps(CustomLabelsStory);
CustomLabelsNoTargetValue.args = {
	dimension: 'graphLabel',
	metric: 'currentAmount',
	metricLabel: 'currentAmountLabel',
	target: 'target',
	showTargetValue: false,
	labelPosition: 'top',
	thresholds: customLabelThresholdsData,
	thresholdBarColor: true,
};

/**
 * Row direction with custom labels.
 * Custom formatting works in row orientation as well, with colored thresholds and bars colored by threshold.
 */
export const CustomLabelsRowDirection = bindWithProps(CustomLabelsStory);
CustomLabelsRowDirection.args = {
	dimension: 'graphLabel',
	metric: 'currentAmount',
	metricLabel: 'currentAmountLabel',
	target: 'target',
	targetLabel: 'targetLabel',
	showTargetValue: false,
	direction: 'row',
	thresholds: customLabelThresholdsData,
	thresholdBarColor: true,
	width: 700,
	height: 400,
};

/**
 * Mixing custom labels with standard number formatting.
 * Using metricLabel for custom formatting but letting targetLabel use the default numberFormat.
 * When targetLabel is not provided, the target value will be formatted using numberFormat.
 */
export const PartialCustomLabels = bindWithProps(CustomLabelsStory);
PartialCustomLabels.args = {
	dimension: 'graphLabel',
	metric: 'currentAmount',
	metricLabel: 'currentAmountLabel',
	target: 'target',
	// targetLabel is intentionally omitted to show it falls back to numberFormat
	numberFormat: 'shortNumber',
	showTargetValue: true,
	labelPosition: 'top',
};

