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
import { Axis, Chart, Legend, Scatter, ScatterPath, Title } from '@rsc';
import { characterData } from '@stories/data/marioKartData';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';

export default {
	title: 'RSC/Scatter/ScatterPath',
	component: ScatterPath,
};

const ScatterPathStory: StoryFn<typeof ScatterPath> = (args): ReactElement => {
	const chartProps = useChartProps({ data: characterData, height: 500, width: 500 });

	return (
		<Chart {...chartProps}>
			<Axis position="bottom" grid ticks baseline title="Speed (normal)" />
			<Axis position="left" grid ticks baseline title="Handling (normal)" />
			<Scatter color="weightClass" dimension="speedNormal" metric="handlingNormal">
				<ScatterPath {...args} />
			</Scatter>
			<Legend position="right" title="Weight class" highlight />
			<Title text="Mario Kart 8 Character Data" />
		</Chart>
	);
};

const Basic = bindWithProps(ScatterPathStory);
Basic.args = {};

const Color = bindWithProps(ScatterPathStory);
Color.args = {
	color: 'red-900',
};

const GroupBy = bindWithProps(ScatterPathStory);
GroupBy.args = {
	groupBy: ['weight'],
};

const Opacity = bindWithProps(ScatterPathStory);
Opacity.args = {
	opacity: 1,
};

const PathWidth = bindWithProps(ScatterPathStory);
PathWidth.args = {
	pathWidth: 'weight',
};

export { Basic, Color, GroupBy, Opacity, PathWidth };
