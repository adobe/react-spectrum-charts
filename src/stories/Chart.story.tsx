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
import { Axis, Chart, Line } from '@rsc';
import { ComponentStory } from '@storybook/react';
import { bindWithProps } from '@test-utils';

import './Chart.story.css';
import { ChartBarStory } from './ChartBarStory';
import { data } from './data/data';

export default {
	title: 'RSC/Chart',
	component: Chart,
};

const ChartLineStory: ComponentStory<typeof Chart> = (args): ReactElement => {
	const props = useChartProps(args);
	return (
		<Chart {...props}>
			<Axis position="bottom" baseline ticks />
			<Axis position="left" grid />
			<Line dimension="x" metric="y" color="series" scaleType="linear" />
		</Chart>
	);
};

const Basic = bindWithProps(ChartLineStory);

// Story specific props are passed here
Basic.args = { data, renderer: 'svg', height: 300 };

const Config = bindWithProps(ChartBarStory);
Config.args = {
	config: {
		rect: {
			strokeWidth: 2,
		},
	},
	data,
};

const Width = bindWithProps(ChartBarStory);
Width.args = {
	width: '50%',
	minWidth: 300,
	maxWidth: 600,
	data,
};

export { Basic, Config, Width };
