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

import useChartProps from '@hooks/useChartProps';
import { Axis, Chart, Legend, Scatter, Title } from '@rsc';
import { characterData } from '@stories/data/marioKartData';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';

const marioDataKeys = [
	...Object.keys(characterData[0])
		.filter((key) => key !== 'character')
		.sort((a, b) => {
			if (a < b) {
				return -1;
			}
			if (a > b) {
				return 1;
			}
			return 0;
		}),
	undefined,
];

export default {
	title: 'RSC/Scatter',
	component: Scatter,
	argTypes: {
		dimension: {
			control: 'select',
			options: marioDataKeys,
		},
		metric: {
			control: 'select',
			options: marioDataKeys,
		},
		color: {
			control: 'select',
			options: marioDataKeys.filter((key) => key !== 'weight'),
		},
		size: {
			control: 'select',
			options: marioDataKeys.filter((key) => key !== 'weightClass'),
		},
	},
};

type MarioDataKey = keyof (typeof characterData)[0];

const marioKeyTitle: Record<Exclude<MarioDataKey, 'character'>, string> = {
	weightClass: 'Weight class',
	speedNormal: 'Speed (normal)',
	speedAntigravity: 'Speed (antigravity)',
	speedWater: 'Speed (water)',
	speedAir: 'Speed (air)',
	acceleration: 'Acceleration',
	weight: 'Weight',
	handlingNormal: 'Handling (normal)',
	handlingAntigravity: 'Handling (antigravity)',
	handlingWater: 'Handling (water)',
	handlingAir: 'Handling (air)',
	grip: 'Grip',
	miniTurbo: 'Mini-turbo',
};

const ScatterStory: StoryFn<typeof Scatter> = (args): ReactElement => {
	const chartProps = useChartProps({ data: characterData, width: 400 });

	const legendKey = (args.color ?? args.size) as MarioDataKey;

	return (
		<Chart {...chartProps}>
			<Axis position="bottom" grid ticks baseline title={marioKeyTitle[args.dimension as MarioDataKey]} />
			<Axis position="left" grid ticks baseline title={marioKeyTitle[args.metric as MarioDataKey]} />
			<Scatter {...args} />
			<Legend position="right" title={marioKeyTitle[legendKey]} />
			<Title text="Mario Kart 8 Character Data" />
		</Chart>
	);
};

const Basic = bindWithProps(ScatterStory);
Basic.args = {
	dimension: 'speedNormal',
	metric: 'handlingNormal',
};

const Color = bindWithProps(ScatterStory);
Color.args = {
	color: 'weightClass',
	dimension: 'speedNormal',
	metric: 'handlingNormal',
};

const Opacity = bindWithProps(ScatterStory);
Opacity.args = {
	opacity: 0.5,
	dimension: 'speedNormal',
	metric: 'handlingNormal',
};

const Size = bindWithProps(ScatterStory);
Size.args = {
	size: 'weight',
	dimension: 'speedNormal',
	metric: 'handlingNormal',
};

export { Basic, Color, Opacity, Size };
