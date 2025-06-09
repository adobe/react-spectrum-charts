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
import { ChartPopover, Legend } from '../../../components';
import { LegendBarStory, LegendDisconnectedStory, defaultProps } from './LegendStoryUtils';

export default {
	title: 'RSC/Legend',
	component: Legend,
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

const Disconnected = LegendDisconnectedStory.bind({});
Disconnected.args = { ...defaultProps, color: 'series' };

const legendLabels = [
	{ seriesName: 'Windows', label: 'Custom Windows' },
	{ seriesName: 'Mac', label: 'Custom Mac' },
	{ seriesName: 'Other', label: 'Custom Other' },
];

const truncatedLegendLabels = [
	{ seriesName: 'Windows', label: 'Very long Windows label that will be truncated without a custom labelLimit' },
	{ seriesName: 'Mac', label: 'Very long Mac label that will be truncated without a custom labelLimit' },
	{ seriesName: 'Other', label: 'Very long Other label that will be truncated without a custom labelLimit' },
];

const Labels = LegendBarStory.bind({});
Labels.args = { legendLabels, highlight: true, ...defaultProps };

const LabelLimit = LegendBarStory.bind({});
LabelLimit.args = { legendLabels: truncatedLegendLabels, ...defaultProps };

const TitleLimit = LegendBarStory.bind({});
TitleLimit.args = {
	title: 'Very long legend title that should be truncated',
	titleLimit: 250,
	...defaultProps,
};

const OnClick = LegendBarStory.bind({});
OnClick.args = {};

const Popover = LegendBarStory.bind({});
Popover.args = {
	children: <ChartPopover width="auto">{(datum) => <div>{datum.value}</div>}</ChartPopover>,
	...defaultProps,
};

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

export {
	Basic,
	Descriptions,
	Disconnected,
	Labels,
	LabelLimit,
	TitleLimit,
	OnClick,
	Popover,
	Position,
	Title,
	Supreme,
};
