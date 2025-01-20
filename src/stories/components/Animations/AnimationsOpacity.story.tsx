/*
 * Copyright 2025 Adobe. All rights reserved.
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

import { COLOR_SCALE, LINE_TYPE_SCALE, OPACITY_SCALE } from '@constants';
import useChartProps from '@hooks/useChartProps';
import {
	Area,
	Axis,
	Bar,
	Chart,
	ChartColors,
	ChartPopover,
	ChartProps,
	ChartTooltip,
	Datum,
	Legend,
	LegendProps,
	Line,
	Scatter,
	ScatterProps,
	Title,
} from '@rsc';
import { barSeriesData } from '@stories/components/Bar/data';
import { browserData as data } from '@stories/data/data';
import { characterData } from '@stories/data/marioKartData';
import { StoryFn } from '@storybook/react';
import { bindWithProps } from '@test-utils';

import { Content, Flex } from '@adobe/react-spectrum';

export default {
	title: 'RSC/Animations/Opacity',
};

const defaultChartProps: ChartProps = { data: [], minWidth: 400, maxWidth: 800, height: 400, animations: true };
const dialogContent = (datum) => (
	<Content>
		<div>Operating system: {datum.series}</div>
		<div>Browser: {datum.category}</div>
		<div>Users: {datum.value}</div>
	</Content>
);

const dialog = (item: Datum) => {
	return (
		<Content>
			<Flex direction="column">
				<div style={{ fontWeight: 'bold' }}>{(item.character as string[]).join(', ')}</div>
				<div>
					{marioKeyTitle.speedNormal}: {item.speedNormal}
				</div>
				<div>
					{marioKeyTitle.handlingNormal}: {item.handlingNormal}
				</div>
			</Flex>
		</Content>
	);
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

const areaStoryData = [
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

const getLegendProps = (args: ScatterProps): LegendProps => {
	const facets = [COLOR_SCALE, LINE_TYPE_SCALE, OPACITY_SCALE, 'size'];
	const legendKey = args[facets.find((key) => args[key] !== undefined) ?? COLOR_SCALE];
	const legendProps: LegendProps = {
		position: 'right',
		title: marioKeyTitle[legendKey],
	};
	if (typeof args.opacity === 'object') {
		legendProps.opacity = args.opacity;
	}
	return legendProps;
};

const AreaPopoverStory: StoryFn<typeof Area> = (args): ReactElement => {
	const chartProps = useChartProps({ data: areaStoryData, minWidth: 400, maxWidth: 800, height: 400, animations: args.animations });
	return (
		<Chart {...chartProps}>
			<Axis position="bottom" baseline />
			<Axis position="left" grid />
			<Area {...args}>
				<ChartTooltip>{dialogContent}</ChartTooltip>
				<ChartPopover>{dialogContent}</ChartPopover>
			</Area>
			<Legend highlight />
		</Chart>
	);
};

const DodgedBarPopoverStory: StoryFn<typeof Bar> = (args): ReactElement => {
	const chartProps = useChartProps({ data: barSeriesData, width: 800, height: 600, animations: args.animations });
	return (
		<Chart {...chartProps}>
			<Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
			<Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
			<Bar {...args}>
				<ChartTooltip>{dialogContent}</ChartTooltip>
				<ChartPopover width={200}>{dialogContent}</ChartPopover>
			</Bar>
			<Legend title="Operating system" highlight />
		</Chart>
	);
};

const LineStory: StoryFn<typeof ChartPopover> = (args): ReactElement => {
	const chartProps = useChartProps({ ...defaultChartProps, data, animations: args.animations });
	return (
		<Chart {...chartProps}>
			<Axis position="bottom" baseline />
			<Axis position="left" grid />
			<Line scaleType="point" dimension="category" color="series">
				<ChartTooltip>{dialogContent}</ChartTooltip>
				<ChartPopover {...args} />
			</Line>
			<Legend highlight />
		</Chart>
	);
};

const ScatterStory: StoryFn<typeof Scatter> = (args): ReactElement => {
	const colors: ChartColors = args.colorScaleType === 'linear' ? 'sequentialViridis5' : 'categorical16';
	const chartProps = useChartProps({
		data: characterData,
		height: 500,
		width: 500,
		lineWidths: [1, 2, 3],
		colors,
		animations: args.animations,
	});
	const legendProps = getLegendProps(args);

	return (
		<Chart {...chartProps}>
			<Axis position="bottom" grid ticks baseline title={marioKeyTitle[args.dimension as MarioDataKey]} />
			<Axis position="left" grid ticks baseline title={marioKeyTitle[args.metric as MarioDataKey]} />
			<Scatter {...args} />
			<Legend {...legendProps} highlight />
			<Title text="Mario Kart 8 Character Data" />
		</Chart>
	);
};

const AreaPopover = bindWithProps(AreaPopoverStory);
AreaPopover.args = {
	dimension: 'browser',
	color: 'operatingSystem',
	scaleType: 'point',
	animations: true
};

const BarPopover = bindWithProps(DodgedBarPopoverStory);
BarPopover.args = {
	type: 'dodged',
	dimension: 'browser',
	order: 'order',
	color: 'operatingSystem',
	animations: true
};

const LineChart = bindWithProps(LineStory);
LineChart.args = { children: dialogContent, animations: true };

const ScatterPopover = bindWithProps(ScatterStory);
ScatterPopover.args = {
	color: 'weightClass',
	dimension: 'speedNormal',
	metric: 'handlingNormal',
	children: [
		<ChartTooltip key="0">{dialog}</ChartTooltip>,
		<ChartPopover key="1" width="auto" animations >
			{dialog}
		</ChartPopover>,
	],
	animations: true
};

export { AreaPopover, BarPopover, LineChart, ScatterPopover };
