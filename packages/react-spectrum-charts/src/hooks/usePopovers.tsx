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
import { createElement, useMemo } from 'react';

import { getAllElements } from '@utils';

import { Chart } from '../Chart';
import { ChartPopover } from '../components/ChartPopover';
import { ChartChildElement, ChartPopoverElement, ChartPopoverProps } from '../types';

type MappedPopover = { name: string; element: ChartPopoverElement };

export type PopoverDetail = {
	chartPopoverProps: ChartPopoverProps;
	key: string;
	name: string;
	UNSAFE_highlightBy: ChartPopoverProps['UNSAFE_highlightBy'];
};

export default function usePopovers(children: ChartChildElement[]): PopoverDetail[] {
	const popoverElements = useMemo(
		() => getAllElements(createElement(Chart, { data: [] }, children), ChartPopover, []) as MappedPopover[],
		[children]
	);

	return useMemo(
		() =>
			popoverElements
				.filter((popover) => popover.element.props.children)
				.map((popover, index) => {
					return {
						chartPopoverProps: popover.element.props,
						key: `${popover.name}Popover${index}`,
						name: popover.name,
						UNSAFE_highlightBy: popover.element.props.UNSAFE_highlightBy,
					};
				}),
		[popoverElements]
	);
}
