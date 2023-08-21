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
import usePrismProps from '@hooks/usePrismProps';
import { Axis, Prism } from '@prism';
import { ComponentStory } from '@storybook/react';
import { bindWithProps } from '@test-utils';
import React, { ReactElement } from 'react';

export default {
	title: 'Prism/Axis/ReferenceLine',
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
	{ x: 0, y: 0, series: 0 },
	{ x: 1, y: 1, series: 0 },
];

const ReferenceLineStory: ComponentStory<typeof ReferenceLine> = (args): ReactElement => {
	const prismProps = usePrismProps({ data, width: 600 });
	return (
		<Prism {...prismProps}>
			<Axis position="bottom" baseline ticks>
				<ReferenceLine {...args} />
			</Axis>
		</Prism>
	);
};

const Basic = bindWithProps(ReferenceLineStory);
Basic.args = {
	value: 0.5,
};

const Icon = bindWithProps(ReferenceLineStory);
Icon.args = {
	value: 0.5,
	icon: 'date',
};

export { Basic, Icon };
