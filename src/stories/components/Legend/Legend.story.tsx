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
import usePrismProps from '@hooks/usePrismProps';
import { Bar, ChartPopover, ChartTooltip, Legend, Prism } from '@prism';
import { browserData as data } from '@stories/data/data';
import { ComponentStory } from '@storybook/react';
import React, { ReactElement } from 'react';

export default {
	title: 'Prism/Legend',
	component: Legend,
	argTypes: {},
	parameters: {
		docs: {
			description: {
				component: 'This is _markdown_ enabled description for Legend component doc page.',
			},
		},
	},
};

const dialogContent = (datum) => (
	<Content>
		<div>Operating system: {datum.series}</div>
		<div>Browser: {datum.category}</div>
		<div>Users: {datum.value}</div>
	</Content>
);

const LegendBarStory: ComponentStory<typeof Legend> = (args): ReactElement => {
	const prismProps = usePrismProps({ data, width: 700 });
	return (
		<Prism {...prismProps}>
			<Bar color="series">
				<ChartTooltip>{(datum) => dialogContent(datum)}</ChartTooltip>
				<ChartPopover>{(datum) => dialogContent(datum)}</ChartPopover>
			</Bar>
			<Legend {...args} />
		</Prism>
	);
};

const Basic = LegendBarStory.bind({});
Basic.args = { descriptions: undefined, highlight: false, position: 'bottom', title: undefined };

const descriptions = [
	{
		seriesName: 'Windows',
		description: 'Most popular operating system, especially in business',
	},
	{ seriesName: 'Mac', description: 'Popular for content creation, home and development' },
	{ seriesName: 'Other', description: 'Linux accounts for the majority of "other" operating systems' },
];

const Descriptions = LegendBarStory.bind({});
Descriptions.args = { descriptions };

const Highlight = LegendBarStory.bind({});
Highlight.args = { highlight: true };

const legendLabels = [
	{ seriesName: 'Windows', label: 'Custom Windows' },
	{ seriesName: 'Mac', label: 'Custom Mac' },
	{ seriesName: 'Other', label: 'Custom Other' },
];

const Labels = LegendBarStory.bind({});
Labels.args = { legendLabels, highlight: true };

const Position = LegendBarStory.bind({});
Position.args = { position: 'right' };

const Title = LegendBarStory.bind({});
Title.args = { title: 'Operating system' };

const Supreme = LegendBarStory.bind({});
Supreme.args = { descriptions, highlight: true, position: 'right', title: 'Operating system', legendLabels };

export { Basic, Descriptions, Highlight, Labels, Position, Title, Supreme };
