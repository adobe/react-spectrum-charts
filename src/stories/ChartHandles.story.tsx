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
import React, { ReactElement, useRef, useState } from 'react';

import useChartProps from '@hooks/useChartProps';
import { Axis, Chart, ChartHandle, Line } from '@rsc';
import { ComponentStory } from '@storybook/react';
import { bindWithProps } from '@test-utils';

import { ActionButton, Content, Flex } from '@adobe/react-spectrum';

import './Chart.story.css';
import { data } from './data/data';

export default {
	title: 'RSC/Chart/Handles',
	component: Chart,
};

const HandleStory = ({ variant }: { variant: 'copy' | 'download' | 'getSvg' }) => {
	const [loading, setLoading] = useState(false);
	const ref = useRef<ChartHandle>(null);
	const props = useChartProps({ data });

	const buttonText: Record<typeof variant, string> = {
		copy: 'Copy to clipboard',
		download: 'Download PNG',
		getSvg: 'Get SVG',
	};
	return (
		<Content>
			<Chart {...props} ref={ref} loading={loading}>
				<Axis position="bottom" baseline ticks />
				<Axis position="left" grid />
				<Line dimension="x" metric="y" color="series" scaleType="linear" />
			</Chart>
			<Flex direction="row" gap="size-100">
				<ActionButton
					onPress={() => ref?.current?.[variant]().then(console.log, console.warn)}
					data-testid={variant}
				>
					{buttonText[variant]}
				</ActionButton>
				<ActionButton onPress={() => setLoading(!loading)}>Toggle loading</ActionButton>
			</Flex>
		</Content>
	);
};

const CopyStory: ComponentStory<typeof Chart> = (): ReactElement => {
	return <HandleStory variant="copy" />;
};

const DownloadStory: ComponentStory<typeof Chart> = (): ReactElement => {
	return <HandleStory variant="download" />;
};

const SvgStory: ComponentStory<typeof Chart> = (): ReactElement => {
	return <HandleStory variant="getSvg" />;
};

const Copy = bindWithProps(CopyStory);

const Download = bindWithProps(DownloadStory);

const GetSvg = bindWithProps(SvgStory);

export { Copy, Download, GetSvg };
