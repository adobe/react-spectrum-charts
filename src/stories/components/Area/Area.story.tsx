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
import { Area, Axis, Chart, ChartProps } from '@rsc';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from 'test-utils/bindWithProps';
import { areaData } from '@stories/data/data';

export default {
	title: 'RSC/Area',
	component: Area,
	argTypes: {
		/*onClick: {
            control: {
                type: "object",
            },
        },*/
	},
};

const defaultChartProps: ChartProps = { data: areaData, minWidth: 400, maxWidth: 800, height: 400, animations: false };

const BasicStory: StoryFn<typeof Area> = (args): ReactElement => {
	const chartProps = useChartProps({ ...defaultChartProps });
	return (
		<Chart {...chartProps} debug>
			<Area {...args} />
		</Chart>
	);
};

const AreaTimeStory: StoryFn<typeof Area> = (args): ReactElement => {
	const chartProps = useChartProps({ ...defaultChartProps });
	return (
		<Chart {...chartProps}>
			<Axis position="bottom" labelFormat="time" baseline />
			<Axis position="left" title="Temperature (F)" grid />
			<Area {...args} />
		</Chart>
	);
};

const Basic = bindWithProps(BasicStory);
Basic.args = { metric: 'maxTemperature' };

const BasicFloating = bindWithProps(BasicStory);
BasicFloating.args = { metricStart: 'minTemperature', metricEnd: 'maxTemperature' };

const Supreme = bindWithProps(AreaTimeStory);
Supreme.args = { metricStart: 'minTemperature', metricEnd: 'maxTemperature', opacity: 0.6 };

export { Basic, BasicFloating, Supreme };
