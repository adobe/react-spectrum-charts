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
import { ReactElement } from 'react';

import useChartProps from '@hooks/useChartProps';
import { Axis, Bar, Chart, Line } from '@rsc';
import { Combo } from '@rsc/alpha';
import { peopleAdoptionComboData } from '@stories/data/data';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';

import { ChartProps } from '../../../types';

export default {
	title: 'RSC/Combo (alpha)',
	component: Combo,
};

const defaultChartProps: ChartProps = {
	data: peopleAdoptionComboData,
	minWidth: 400,
	maxWidth: 800,
	height: 400,
};

const BasicComboStory: StoryFn<typeof Combo> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartProps);
	return (
		<Chart {...chartProps}>
			<Axis position="left" title="People" grid />
			<Axis position="right" title="Adoption Rate" />
			<Axis position="bottom" labelFormat="time" baseline ticks />
			<Combo {...args}>
				<Bar dimension="datetime" metric="people" />
				<Line dimension="datetime" metric="adoptionRate" color={{ value: 'indigo-900' }} />
			</Combo>
		</Chart>
	);
};

const Basic = bindWithProps(BasicComboStory);

Basic.args = {};

export { Basic };
