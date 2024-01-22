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

export default {
	title: 'RSC/Scatter',
	component: Scatter,
};

const ScatterStory: StoryFn<typeof Scatter> = (args): ReactElement => {
	const chartProps = useChartProps({ data: characterData, width: 400 });

	return (
		<Chart {...chartProps}>
			<Axis position="bottom" grid ticks baseline title="Speed (normal)" />
			<Axis position="left" grid ticks baseline title="Handling (normal)" />
			<Scatter {...args} />;
			<Legend position="right" title="Weight class" />
			<Title text="Mario Kart 8 Character Data" />
		</Chart>
	);
};

const Basic = bindWithProps(ScatterStory);
Basic.args = {
	color: 'weightClass',
	dimension: 'speedNormal',
	metric: 'handlingNormal',
};

export { Basic };
