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
import React, { ReactElement } from 'react';

import useChartProps from '@hooks/useChartProps';
import { Chart, ChartProps } from '@rsc';
import { Donut, SegmentLabel } from '@rsc/alpha';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';

import { basicDonutData, sliveredDonutData } from '../Donut/data';

export default {
	title: 'RSC/Donut/SegmentLabel',
	component: SegmentLabel,
};

const defaultChartProps: ChartProps = {
	data: basicDonutData,
	width: 350,
	height: 350,
};

const SegmentLabelStory: StoryFn<typeof SegmentLabel> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartProps);

	return (
		<Chart {...chartProps}>
			<Donut metric="count" color="browser">
				<SegmentLabel {...args} />;
			</Donut>
		</Chart>
	);
};

const SliverStory: StoryFn<typeof SegmentLabel> = (args): ReactElement => {
	const chartProps = useChartProps({ ...defaultChartProps, data: sliveredDonutData });

	return (
		<Chart {...chartProps}>
			<Donut metric="count" color="browser">
				<SegmentLabel {...args} />;
			</Donut>
		</Chart>
	);
};

const Basic = bindWithProps(SegmentLabelStory);
Basic.args = {};

const LabelKey = bindWithProps(SegmentLabelStory);
LabelKey.args = { labelKey: 'browser' };

const Percent = bindWithProps(SegmentLabelStory);
Percent.args = { percent: true };

const Value = bindWithProps(SegmentLabelStory);
Value.args = { value: true };

const ValueFormat = bindWithProps(SegmentLabelStory);
ValueFormat.args = { value: true, valueFormat: 'shortNumber' };

const Supreme = bindWithProps(SegmentLabelStory);
Supreme.args = { labelKey: 'browser', percent: true, value: true, valueFormat: 'shortNumber' };

const Slivers = bindWithProps(SliverStory);
Slivers.args = { percent: true, value: true };

export { Basic, LabelKey, Percent, Value, ValueFormat, Supreme, Slivers };
