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

import { StoryFn } from '@storybook/react';

import { Chart } from '../../../Chart';
import { Axis, Bar, Legend, Title } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';
import { browserData as data } from '../../data/data';

export default {
	title: 'RSC/Title',
	component: Title,
};

const defaultChartProps: ChartProps = { data, minWidth: 400, maxWidth: 800, height: 400 };

const TitleBarStory: StoryFn<typeof Title> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartProps);
	return (
		<Chart {...chartProps}>
			<Title {...args} />
			<Bar color="series" />
			<Legend />
			<Axis position="bottom" baseline />
			<Axis position="left" grid />
		</Chart>
	);
};

const Basic = bindWithProps(TitleBarStory);
Basic.args = {
	text: 'Bar Chart',
};

const Orient = bindWithProps(TitleBarStory);
Orient.args = {
	text: 'Bar Chart',
	orient: 'bottom',
};

const Position = bindWithProps(TitleBarStory);
Position.args = {
	text: 'Bar Chart',
	position: 'start',
};

const FontWeight = bindWithProps(TitleBarStory);
FontWeight.args = {
	text: 'Bar Chart',
	fontWeight: 'lighter',
};

export { Basic, Orient, Position, FontWeight };
