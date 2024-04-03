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
import { Area, Axis, Chart, ChartPopover, ChartProps, ChartTooltip, Legend } from '@rsc';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from 'test-utils/bindWithProps';

export default {
	title: 'RSC/Area/StackedArea',
	component: Area,
	argTypes: {
		/*onClick: {
            control: {
                type: "object",
            },
        },*/
	},
};

const data = [
	{ browser: 'Chrome', value: 5, operatingSystem: 'Windows', order: 2 },
	{ browser: 'Chrome', value: 3, operatingSystem: 'Mac', order: 1 },
	{ browser: 'Chrome', value: 2, operatingSystem: 'Other', order: 0 },
	{ browser: 'Firefox', value: 3, operatingSystem: 'Windows', order: 2 },
	{ browser: 'Firefox', value: 3, operatingSystem: 'Mac', order: 1 },
	{ browser: 'Firefox', value: 1, operatingSystem: 'Other', order: 0 },
	{ browser: 'Safari', value: 3, operatingSystem: 'Windows', order: 2 },
	{ browser: 'Safari', value: 0, operatingSystem: 'Mac', order: 1 },
	{ browser: 'Safari', value: 1, operatingSystem: 'Other', order: 0 },
];
const defaultChartProps: ChartProps = { data, minWidth: 400, maxWidth: 800, height: 400, animations: false };

const AreaStory: StoryFn<typeof Area> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartProps);
	return (
		<Chart {...chartProps}>
			<Area {...args} />
		</Chart>
	);
};

const timeData = [
	{ datetime: 1667890800000, point: 1, value: 738, users: 477, series: 'Add Fallout' },
	{ datetime: 1667977200000, point: 2, value: 704, users: 481, series: 'Add Fallout' },
	{ datetime: 1668063600000, point: 3, value: 730, users: 483, series: 'Add Fallout' },
	{ datetime: 1668150000000, point: 4, value: 465, users: 310, series: 'Add Fallout' },
	{ datetime: 1668236400000, point: 5, value: 31, users: 18, series: 'Add Fallout' },
	{ datetime: 1668322800000, point: 8, value: 108, users: 70, series: 'Add Fallout' },
	{ datetime: 1668409200000, point: 12, value: 648, users: 438, series: 'Add Fallout' },
	{ datetime: 1667890800000, point: 4, value: 1220, users: 525, series: 'Add Freeform table' },
	{ datetime: 1667977200000, point: 5, value: 1130, users: 510, series: 'Add Freeform table' },
	{ datetime: 1668063600000, point: 17, value: 1109, users: 504, series: 'Add Freeform table' },
	{ datetime: 1668150000000, point: 20, value: 724, users: 338, series: 'Add Freeform table' },
	{ datetime: 1668236400000, point: 21, value: 39, users: 20, series: 'Add Freeform table' },
	{ datetime: 1668322800000, point: 22, value: 160, users: 79, series: 'Add Freeform table' },
	{ datetime: 1668409200000, point: 25, value: 1093, users: 491, series: 'Add Freeform table' },
];

const AreaTimeStory: StoryFn<typeof Area> = (args): ReactElement => {
	const chartProps = useChartProps({ ...defaultChartProps, data: timeData });
	return (
		<Chart {...chartProps}>
			<Axis position="bottom" labelFormat="time" baseline />
			<Axis position="left" grid />
			<Area {...args} />
			<Legend />
		</Chart>
	);
};

const TooltipStory: StoryFn<typeof Area> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartProps);
	return (
		<Chart {...chartProps}>
			<Axis position="bottom" baseline />
			<Axis position="left" grid />
			<Area {...args}>
				<ChartTooltip>{dialog}</ChartTooltip>
			</Area>
			<Legend />
		</Chart>
	);
};

const PopoverStory: StoryFn<typeof Area> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartProps);
	return (
		<Chart {...chartProps}>
			<Axis position="bottom" baseline />
			<Axis position="left" grid />
			<Area {...args}>
				<ChartTooltip>{dialog}</ChartTooltip>
				<ChartPopover>{dialog}</ChartPopover>
			</Area>
			<Legend highlight />
		</Chart>
	);
};

const dialog = (datum) => (
	<>
		<div>Browser: {datum.browser}</div>
		<div>OS: {datum.operatingSystem}</div>
		<div>Downloads: {datum.value}</div>
	</>
);

const Basic = bindWithProps(AreaStory);
Basic.args = { dimension: 'browser', color: 'operatingSystem', scaleType: 'point' };

const TimeAxis = bindWithProps(AreaTimeStory);
TimeAxis.args = {};

const Tooltip = bindWithProps(TooltipStory);
Tooltip.args = {
	dimension: 'browser',
	color: 'operatingSystem',
	scaleType: 'point',
};

const Popover = bindWithProps(PopoverStory);
Popover.args = {
	dimension: 'browser',
	color: 'operatingSystem',
	scaleType: 'point',
};

export { Basic, TimeAxis, Tooltip, Popover };
