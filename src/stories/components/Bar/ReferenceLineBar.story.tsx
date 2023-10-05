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

import { ReferenceLine } from '@components/ReferenceLine';
import { Bar } from 'components/Bar';
import usePrismProps from '@hooks/usePrismProps';
import { Axis, Prism } from '@prism';
import { ComponentStory } from '@storybook/react';
import { bindWithProps } from '@test-utils';
import React, { ReactElement } from 'react';

export default {
	title: 'Prism/Bar/ReferenceLine',
	component: ReferenceLine,
	argTypes: {},
	parameters: {
		docs: {
			description: {
				component: 'This is _markdown_ enabled description for Axis component doc page.',
			},
		},
	},
};

const data = [
	{ x: 1, y: 1, series: 0 },
	{ x: 2, y: 2, series: 0 },
	{ x: 3, y: 3, series: 0 },
	{ x: 4, y: 4, series: 0 },
	{ x: 5, y: 5, series: 0 },
];

const ReferenceLineStory: ComponentStory<typeof ReferenceLine> = (args): ReactElement => {
	const prismProps = usePrismProps({ data, width: 600 });
	return (
		<Prism {...prismProps}>
			<Axis position="bottom" baseline ticks>
				<ReferenceLine {...args} />
			</Axis>
			<Bar dimension="y" metric="x" />
		</Prism>
	);
};

const ReferenceLineHorizontalStory: ComponentStory<typeof ReferenceLine> = (args): ReactElement => {
	const prismProps = usePrismProps({ data, width: 600 });
	return (
		<Prism {...prismProps}>
			<Axis position="left" baseline ticks>
				<ReferenceLine {...args} />
			</Axis>
			<Axis position="bottom" baseline ticks></Axis>
			<Bar dimension="y" metric="x" />
		</Prism>
	);
};

const Basic = bindWithProps(ReferenceLineStory);
Basic.args = {
	value: 3,
	position: 'center',
};

const Icon = bindWithProps(ReferenceLineStory);
Icon.args = {
	value: 3,
	icon: 'date',
	position: 'center',
};

const Label = bindWithProps(ReferenceLineStory);
Label.args = {
	value: 3,
	label: 'Jul 4',
	position: 'center',
};

const Supreme = bindWithProps(ReferenceLineStory);
Supreme.args = {
	value: 3,
	icon: 'date',
	label: 'Jul 4',
	position: 'center',
};

const Horizontal = bindWithProps(ReferenceLineHorizontalStory);
Horizontal.args = {
	value: 3,
	position: 'center',
};

const HorizontalIcon = bindWithProps(ReferenceLineHorizontalStory);
HorizontalIcon.args = {
	value: 3,
	icon: 'date',
	position: 'center',
};

const HorizontalLabel = bindWithProps(ReferenceLineHorizontalStory);
HorizontalLabel.args = {
	value: 3,
	label: 'Jul 4',
	position: 'center',
};

const HorizontalSupreme = bindWithProps(ReferenceLineHorizontalStory);
HorizontalSupreme.args = {
	value: 3,
	icon: 'date',
	label: 'Jul 4',
	position: 'center',
};

export { Basic, Icon, Label, Supreme, Horizontal, HorizontalIcon, HorizontalLabel, HorizontalSupreme };
