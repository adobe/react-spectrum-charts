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

import usePrismProps from '@hooks/usePrismProps';
import { Axis, Bar, Legend, Prism, bindWithProps } from '@prism';
import { ComponentStory } from '@storybook/react';
import React, { ReactElement } from 'react';
import { BarProps, PrismData, SpectrumColor } from 'types';

import { frequencyOfUseData, generateMockDataForTrellis } from './data';

export default {
	title: 'Prism/Bar/Trellis',
	component: Bar,
	argTypes: {},
	parameters: {
		docs: {
			description: {
				component: 'This is _markdown_ enabled description for Bar component doc page.',
			},
		},
	},
};

const colors: SpectrumColor[] = [
	'sequential-magma-200',
	'sequential-magma-400',
	'sequential-magma-600',
	'sequential-magma-800',
	'sequential-magma-1000',
	'sequential-magma-1200',
	'sequential-magma-1400',
];
type BarStoryProps = BarProps & { data?: PrismData[]; width?: number; height?: number; legendTitle?: string };

const BarStory: ComponentStory<typeof Bar> = (args: BarStoryProps): ReactElement => {
	const prismProps = usePrismProps({
		data: args.data ?? frequencyOfUseData,
		colors,
		width: 800,
		height: 800,
	});
	return (
		<Prism {...prismProps} debug>
			<Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid />
			<Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline />
			<Bar {...args} />
			<Legend title={args.legendTitle} />
		</Prism>
	);
};

const Dodged = bindWithProps<BarStoryProps>(BarStory);
Dodged.args = {
	type: 'dodged',
	dimension: 'segment',
	order: 'order',
	color: 'bucket',
	trellis: 'event',
	trellisOrientation: 'vertical',
	orientation: 'vertical',
	data: generateMockDataForTrellis({
		property1: ['All users', 'Roku', 'Chromecast', 'Amazon Fire', 'Apple TV'],
		property2: ['A. Sign up', 'B. Watch a video', 'C. Add to MyList'],
		property3: ['1-5 times', '6-10 times', '11-15 times', '16-20 times', '21-25 times', '26+ times'],
		propertyNames: ['segment', 'event', 'bucket'],
		randomizeSteps: false,
		orderBy: 'bucket',
	}),
};

const HBHT = bindWithProps<BarStoryProps>(BarStory);
HBHT.storyName = 'Horizontal Bar, Horizontal Trellis';
HBHT.args = {
	type: 'stacked',
	trellis: 'event',
	dimension: 'segment',
	color: 'bucket',
	order: 'order',
	orientation: 'horizontal',
	trellisOrientation: 'horizontal',
	legendTitle: 'Users, Count',
	data: Dodged.args.data,
};

const HBVT = bindWithProps<BarStoryProps>(BarStory);
HBVT.storyName = 'Horizontal Bar, Vertical Trellis';
HBVT.args = {
	...HBHT.args,
	trellisOrientation: 'vertical',
};

const VBVT = bindWithProps<BarStoryProps>(BarStory);
VBVT.storyName = 'Vertical Bar, Vertical Trellis';
VBVT.args = {
	...HBVT.args,
	orientation: 'vertical',
	trellisOrientation: 'vertical',
};

const VBHT = bindWithProps<BarStoryProps>(BarStory);
VBHT.storyName = 'Vertical Bar, Horizontal Trellis';
VBHT.args = {
	...HBHT.args,
	orientation: 'vertical',
	trellisOrientation: 'horizontal',
};

export { Dodged, HBHT, HBVT, VBVT, VBHT };
