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
import { Axis, Bar, Chart, ChartTooltip, Line } from '@rsc';
import { Combo } from '@rsc/alpha';
import { peopleAdoptionComboData, peopleTotalComboData } from '@stories/data/data';
import { formatTimestamp } from '@stories/storyUtils';
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
			<Axis position="right" name="adoption" title="Adoption Rate" />
			<Axis position="bottom" labelFormat="time" baseline ticks />
			<Combo {...args}>
				<Bar metric="people" />
				<Line metric="adoptionRate" metricAxis="adoption" color={{ value: 'indigo-900' }} scaleType="point" />
			</Combo>
		</Chart>
	);
};

const TooltipStory: StoryFn<typeof Combo> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartProps);
	return (
		<Chart {...chartProps}>
			<Axis position="left" title="People" grid />
			<Axis position="right" name="adoption" title="Adoption Rate" />
			<Axis position="bottom" labelFormat="time" baseline ticks />
			<Combo {...args}>
				<Bar metric="people">
					<ChartTooltip>
						{(datum) => (
							<div className="bar-tooltip">
								<div>{formatTimestamp(datum.datetime as number)}</div>
								<div>People: {datum.people}</div>
							</div>
						)}
					</ChartTooltip>
				</Bar>
				<Line
					metric="adoptionRate"
					metricAxis="adoption"
					color={{ value: 'indigo-900' }}
					interactionMode="item"
					scaleType="point"
				>
					<ChartTooltip>
						{(datum) => (
							<div className="line-tooltip">
								<div>{formatTimestamp(datum.datetime as number)}</div>
								<div>Adoption Rate: {datum.adoptionRate}</div>
							</div>
						)}
					</ChartTooltip>
				</Line>
			</Combo>
		</Chart>
	);
};

const DualAxisStory: StoryFn<typeof Combo> = (args): ReactElement => {
	const chartProps = useChartProps({ ...defaultChartProps, data: peopleTotalComboData });
	return (
		<Chart {...chartProps}>
			<Axis position="left" name="people" title="People" grid />
			<Axis position="right" name="total" title="Total" />
			<Axis position="bottom" labelFormat="time" baseline ticks />
			<Combo {...args}>
				<Bar metric="people" metricAxis="people" />
				<Line metric="total" metricAxis="total" color={{ value: 'indigo-900' }} scaleType="point" />
			</Combo>
		</Chart>
	);
};

const Basic = bindWithProps(BasicComboStory);
Basic.args = {
	name: 'combo0',
	dimension: 'datetime',
};

const Tooltip = bindWithProps(TooltipStory);
Tooltip.args = {
	name: 'combo0',
	dimension: 'datetime',
};

const DualAxis = bindWithProps(DualAxisStory);
DualAxis.args = {
	name: 'combo0',
	dimension: 'datetime',
};

export { Basic, Tooltip, DualAxis };
