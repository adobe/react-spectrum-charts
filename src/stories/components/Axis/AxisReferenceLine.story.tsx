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
import React, { ReactElement } from 'react';

import { ReferenceLine } from '@components/ReferenceLine';
import useChartProps from '@hooks/useChartProps';
import { Axis, Chart } from '@rsc';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';

export default {
	title: 'RSC/Axis/ReferenceLine',
	component: ReferenceLine,
};

const data = [
	{ x: 0, y: 0, series: 0 },
	{ x: 1, y: 1, series: 0 },
];

const ReferenceLineStory: StoryFn<typeof ReferenceLine> = (args): ReactElement => {
	const chartProps = useChartProps({ data, width: 600 });
	return (
		<Chart {...chartProps}>
			<Axis position="bottom" baseline ticks>
				<ReferenceLine {...args} />
			</Axis>
		</Chart>
	);
};

const Basic = bindWithProps(ReferenceLineStory);
Basic.args = {
	value: 0.5,
};

const Color = bindWithProps(ReferenceLineStory);
Color.args = {
	color: 'blue-500',
	value: 0.5,
};

const Icon = bindWithProps(ReferenceLineStory);
Icon.args = {
	icon: 'date',
	value: 0.5,
};

export { Basic, Color, Icon };
