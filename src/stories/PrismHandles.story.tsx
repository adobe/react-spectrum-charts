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

import { ActionButton, Content, Flex } from '@adobe/react-spectrum';
import usePrismProps from '@hooks/usePrismProps';
import { Axis, Line, Prism, PrismHandle } from '@prism';
import { ComponentStory } from '@storybook/react';
import { bindWithProps } from '@test-utils';
import React, { ReactElement, useRef, useState } from 'react';

import './Prism.story.css';
import { data } from './data/data';

export default {
	title: 'Prism/Prism/Handles',
	component: Prism,
	argTypes: {},
	parameters: {
		docs: {
			description: {
				component: 'This is _markdown_ enabled description for Chart component doc page.',
			},
		},
	},
};

const HandleStory = ({ variant }: { variant: 'copy' | 'download' }) => {
	const [loading, setLoading] = useState(false);
	const ref = useRef<PrismHandle>(null);
	const props = usePrismProps({ data });
	return (
		<Content>
			<Prism {...props} ref={ref} loading={loading}>
				<Axis position="bottom" baseline ticks />
				<Axis position="left" grid />
				<Line dimension="x" metric="y" color="series" scaleType="linear" />
			</Prism>
			<Flex direction="row" gap="size-100">
				<ActionButton
					onPress={() => ref?.current?.[variant]().then(console.log, console.warn)}
					data-testid={variant}
				>
					{variant === 'copy' ? 'Copy to clipboard' : 'Download PNG'}
				</ActionButton>
				<ActionButton onPress={() => setLoading(!loading)}>Toggle loading</ActionButton>
			</Flex>
		</Content>
	);
};

const CopyStory: ComponentStory<typeof Prism> = (): ReactElement => {
	return <HandleStory variant="copy" />;
};

const DownloadStory: ComponentStory<typeof Prism> = (): ReactElement => {
	return <HandleStory variant="download" />;
};

const Copy = bindWithProps(CopyStory);

const Download = bindWithProps(DownloadStory);

export { Copy, Download };
