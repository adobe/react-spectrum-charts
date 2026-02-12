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
import { Axis, Legend, Line, LinePointAnnotation } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { workspaceTrendsDataWithAnnotations } from '../../../stories/data/data';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';

export default {
	title: 'RSC/Line/LinePointAnnotation',
	component: LinePointAnnotation,
};

const defaultChartProps: ChartProps = {
	data: workspaceTrendsDataWithAnnotations,
	minWidth: 400,
	maxWidth: 800,
	height: 400,
};

const LinePointAnnotationStory: StoryFn<typeof LinePointAnnotation> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartProps);
	return (
		<Chart {...chartProps}>
			<Axis position="left" grid title="Users" />
			<Axis position="bottom" labelFormat="time" baseline ticks />
			<Line color="series" dimension="datetime" metric="value" scaleType="time" staticPoint="staticPoint">
				<LinePointAnnotation {...args} />
			</Line>
			<Legend highlight />
		</Chart>
	);
};

const Basic = bindWithProps(LinePointAnnotationStory);
Basic.args = {
	textKey: 'label',
};

const AutoColor = bindWithProps(LinePointAnnotationStory);
AutoColor.args = {
	textKey: 'label',
	autoColor: true,
};

const CustomAnchor = bindWithProps(LinePointAnnotationStory);
CustomAnchor.args = {
	textKey: 'label',
	anchor: 'top',
};

const MultipleAnchors = bindWithProps(LinePointAnnotationStory);
MultipleAnchors.args = {
	textKey: 'label',
	anchor: ['top', 'right', 'bottom', 'left'],
};

const AutoColorWithCustomAnchor = bindWithProps(LinePointAnnotationStory);
AutoColorWithCustomAnchor.args = {
	textKey: 'label',
	autoColor: true,
	anchor: 'bottom',
};

export { Basic, AutoColor, CustomAnchor, MultipleAnchors, AutoColorWithCustomAnchor };
