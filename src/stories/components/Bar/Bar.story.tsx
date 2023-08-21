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

import { Annotation } from '@components/Annotation';
import usePrismProps from '@hooks/usePrismProps';
import { Axis, Bar, Prism, bindWithProps } from '@prism';
import { ComponentStory } from '@storybook/react';
import React, { ReactElement, createElement } from 'react';

import { barData } from './data';

export default {
	title: 'Prism/Bar',
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

const BarStory: ComponentStory<typeof Bar> = (args): ReactElement => {
	const prismProps = usePrismProps({ data: barData, width: 600, height: 600 });
	return (
		<Prism {...prismProps}>
			<Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
			<Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
			<Bar {...args} />
		</Prism>
	);
};

const Basic = bindWithProps(BarStory);
Basic.args = {
	dimension: 'browser',
	metric: 'downloads',
};

const Horizontal = bindWithProps(BarStory);
Horizontal.args = {
	dimension: 'browser',
	metric: 'downloads',
	orientation: 'horizontal',
};

const LineType = bindWithProps(BarStory);
LineType.args = {
	dimension: 'browser',
	metric: 'downloads',
	opacity: { value: 0.75 },
	lineType: { value: 'dashed' },
	lineWidth: 2,
};

const Opacity = bindWithProps(BarStory);
Opacity.args = {
	dimension: 'browser',
	metric: 'downloads',
	opacity: { value: 0.75 },
};

const PaddingRatio = bindWithProps(BarStory);
PaddingRatio.args = {
	dimension: 'browser',
	metric: 'downloads',
	paddingRatio: 0.2,
};

const WithAnnotation = bindWithProps(BarStory);
WithAnnotation.args = {
	dimension: 'browser',
	children: createElement(Annotation, { textKey: 'percentLabel' }),
	metric: 'downloads',
};

export { Basic, Horizontal, LineType, Opacity, PaddingRatio, WithAnnotation };
