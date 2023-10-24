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

import { Content } from '@adobe/react-spectrum';
import { Annotation } from '@components/Annotation';
import usePrismProps from '@hooks/usePrismProps';
import { Axis, Bar, ChartPopover, ChartTooltip, Legend, Prism, categorical6 } from '@prism';
import { bindWithProps } from '@test-utils';
import { ComponentStory } from '@storybook/react';
import { ReactElement, createElement } from 'react';

import { barSeriesData, barSubSeriesData } from './data';

export default {
	title: 'Prism/Bar/Dodged Bar',
	component: Bar,
	argTypes: {},
	parameters: {
		docs: {
			description: {
				component: 'This is _markdown_ enabled description for Bar component doc page.',
			},
		},
	},
};

const DodgedBarStory: ComponentStory<typeof Bar> = (args): ReactElement => {
	const { color } = args;
	const colors = Array.isArray(color)
		? [
				['#00a6a0', '#4bcec7'],
				['#575de8', '#8489fd'],
				['#d16100', '#fa8b1a'],
		  ]
		: categorical6;
	const data = Array.isArray(color) ? barSubSeriesData : barSeriesData;
	const prismProps = usePrismProps({ data, width: 800, height: 600, colors });
	return (
		<Prism {...prismProps}>
			<Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
			<Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
			<Bar {...args} />
			<Legend title="Operating system" highlight />
		</Prism>
	);
};

const dialogContent = (datum) => (
	<Content>
		<div>Operating system: {datum.operatingSystem}</div>
		<div>Browser: {datum.browser}</div>
		<div>Users: {datum.value}</div>
	</Content>
);

const DodgedBarPopoverStory: ComponentStory<typeof Bar> = (args): ReactElement => {
	const prismProps = usePrismProps({ data: barSeriesData, width: 800, height: 600 });
	return (
		<Prism {...prismProps}>
			<Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
			<Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
			<Bar {...args}>
				<ChartTooltip>{dialogContent}</ChartTooltip>
				<ChartPopover width={200}>{dialogContent}</ChartPopover>
			</Bar>
			<Legend title="Operating system" highlight />
		</Prism>
	);
};

const DodgedBarLineTypeStory: ComponentStory<typeof Bar> = (args): ReactElement => {
	const prismProps = usePrismProps({ data: barSeriesData, width: 800, height: 600 });
	return (
		<Prism {...prismProps}>
			<Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
			<Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
			<Bar {...args} />
			<Legend title="Operating system" opacity={{ value: 0.2 }} />
		</Prism>
	);
};

const Color = bindWithProps(DodgedBarStory);
Color.args = {
	type: 'dodged',
	dimension: 'browser',
	order: 'order',
	color: 'operatingSystem',
};

const DodgedStacked = bindWithProps(DodgedBarStory);
DodgedStacked.args = {
	type: 'dodged',
	dimension: 'browser',
	color: ['operatingSystem', 'version'],
};

const LineType = bindWithProps(DodgedBarLineTypeStory);
LineType.args = {
	type: 'dodged',
	dimension: 'browser',
	order: 'order',
	lineType: 'operatingSystem',
	lineWidth: 2,
	opacity: { value: 0.2 },
};

const Opacity = bindWithProps(DodgedBarStory);
Opacity.args = {
	type: 'dodged',
	dimension: 'browser',
	order: 'order',
	opacity: 'operatingSystem',
};

const Popover = bindWithProps(DodgedBarPopoverStory);
Popover.args = {
	type: 'dodged',
	dimension: 'browser',
	order: 'order',
	color: 'operatingSystem',
};

const DodgedStackedWithLabels = bindWithProps(DodgedBarStory);
DodgedStackedWithLabels.args = {
	type: 'dodged',
	dimension: 'browser',
	color: ['operatingSystem', 'version'],
	children: createElement(Annotation, { textKey: 'percentLabel' }),
	paddingRatio: 0.1,
};

export { Color, DodgedStacked, DodgedStackedWithLabels, LineType, Opacity, Popover };
