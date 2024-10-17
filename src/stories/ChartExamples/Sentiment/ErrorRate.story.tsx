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

import { ReferenceLine } from '@components/ReferenceLine';
import useChartProps from '@hooks/useChartProps';
import { Axis, Chart, Line } from '@rsc';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';

import errorData from './errorData.json';

export default {
	title: 'RSC/Chart/Examples',
	component: ReferenceLine,
};

const ErrorRateStory: StoryFn = (): ReactElement => {
	const chartProps = useChartProps({ data: errorData, width: 600 });
	return (
		<Chart {...chartProps}>
			<Line scaleType="linear" dimension="time" metric="errors" />
			<Axis position="left" hideDefaultLabels>
				<ReferenceLine value={400} icon="sentimentNegative" color="red-800" iconColor="red-800" layer="back" />
				<ReferenceLine value={200} icon="sentimentNeutral" color="blue-800" iconColor="blue-800" layer="back" />
				<ReferenceLine
					value={100}
					icon="sentimentPositive"
					color="green-800"
					iconColor="green-800"
					layer="back"
				/>
			</Axis>
			<Axis position="bottom" baseline ticks labelFormat="duration" />
		</Chart>
	);
};

const ErrorRate = bindWithProps(ErrorRateStory);

export { ErrorRate };
