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

import usePrismProps from '@hooks/usePrismProps';
import { Axis, Bar, Legend, Prism, PrismProps, Title } from '@prism';
import { browserData as data } from '@stories/data/data';
import { ComponentStory } from '@storybook/react';
import { bindWithProps } from 'test-utils/bindWithProps';

export default {
	title: 'Prism/Title',
	component: Title,
	argTypes: {},
	parameters: {
		docs: {
			description: {
				component: 'This is _markdown_ enabled description for Title component doc page.',
			},
		},
	},
};

const defaultPrismProps: PrismProps = { data, minWidth: 400, maxWidth: 800, height: 400 };

const TitleBarStory: ComponentStory<typeof Title> = (args): ReactElement => {
	const prismProps = usePrismProps(defaultPrismProps);
	return (
		<Prism {...prismProps}>
			<Title {...args} />
			<Bar color="series" />
			<Legend />
			<Axis position="bottom" baseline />
			<Axis position="left" grid />
		</Prism>
	);
};

const Basic = bindWithProps(TitleBarStory);
Basic.args = {
	text: 'Bar Chart',
};

const Orient = bindWithProps(TitleBarStory);
Orient.args = {
	text: 'Bar Chart',
	orient: 'bottom',
};

const Position = bindWithProps(TitleBarStory);
Position.args = {
	text: 'Bar Chart',
	position: 'start',
};

const FontWeight = bindWithProps(TitleBarStory);
FontWeight.args = {
	text: 'Bar Chart',
	fontWeight: 'lighter',
};

export { Basic, Orient, Position, FontWeight };
