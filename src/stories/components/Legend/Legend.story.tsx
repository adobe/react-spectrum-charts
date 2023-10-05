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

import { Legend } from '@prism';
import { LegendBarStory, defaultProps } from './LegendStoryUtils';

export default {
	title: 'Prism/Legend',
	component: Legend,
	parameters: {
		docs: {
			description: {
				component: 'This is _markdown_ enabled description for Legend component doc page.',
			},
		},
	},
};

const Basic = LegendBarStory.bind({});
Basic.args = { ...defaultProps };

const descriptions = [
	{
		seriesName: 'Windows',
		description: 'Most popular operating system, especially in business',
	},
	{ seriesName: 'Mac', description: 'Popular for content creation, home and development' },
	{ seriesName: 'Other', description: 'Linux accounts for the majority of "other" operating systems' },
];

const Descriptions = LegendBarStory.bind({});
Descriptions.args = { descriptions, ...defaultProps };

const Highlight = LegendBarStory.bind({});
Highlight.args = { highlight: true, ...defaultProps };

const legendLabels = [
	{ seriesName: 'Windows', label: 'Custom Windows' },
	{ seriesName: 'Mac', label: 'Custom Mac' },
	{ seriesName: 'Other', label: 'Custom Other' },
];

const Labels = LegendBarStory.bind({});
Labels.args = { legendLabels, highlight: true, ...defaultProps };

const OnClick = LegendBarStory.bind({});
OnClick.args = {};

const Position = LegendBarStory.bind({});
Position.args = { position: 'right', ...defaultProps };

const Title = LegendBarStory.bind({});
Title.args = { title: 'Operating system', ...defaultProps };

const Supreme = LegendBarStory.bind({});
Supreme.args = {
	descriptions,
	highlight: true,
	legendLabels,
	position: 'right',
	title: 'Operating system',
};

export { Basic, Descriptions, Highlight, Labels, OnClick, Position, Title, Supreme };
