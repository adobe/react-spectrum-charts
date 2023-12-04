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
import { Chart, Donut } from '@rsc';
import { ComponentStory } from '@storybook/react';
import { bindWithProps } from '@test-utils';

import { donutData } from './data';

export default {
	title: 'RSC/Donut',
	component: Donut,
};

const DonutStory: ComponentStory<typeof Donut> = (args): ReactElement => {
	const chartProps = useChartProps({ data: donutData, width: 300, height: 300 });
	return (
		<Chart {...chartProps} debug>
			<Donut {...args} />
		</Chart>
	);
};

const Basic = bindWithProps(DonutStory);
Basic.args = {
	metric: 'count',
};

export { Basic };
